import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { homedir } from 'node:os'

// Browser jobs are serialized even across tasks: Kane's local Chrome/CDP ports
// are not safe to treat as independent without an explicit external browser.
let lastJob = Promise.resolve()
const taskBrowsers = new Map()
const taskControls = new Map()

const MAX_OUTPUT_BYTES = 8 * 1024 * 1024
const MAX_LINE_BYTES = 1024 * 1024
const DEFAULT_TIMEOUT_MS = 240_000
const CHROME_START_TIMEOUT_MS = 15_000
const STOP_GRACE_MS = 2_000
const NATIVE_FOCUS_TIMEOUT_MS = 1_500

function controlFor(taskId) {
  let control = taskControls.get(taskId)
  if (!control) {
    control = { generation: 0, paused: false, pausing: false, disconnected: false, activeChild: null, activeFocus: null, jobs: new Set(), pausePromise: null, disconnectPromise: null, lifecycle: Promise.resolve() }
    taskControls.set(taskId, control)
  }
  return control
}

// Pending jobs settle immediately when cancelled; the global queue retains their
// no-op slot, so takeover does not wait behind another connection's long run.
function enqueue(control, work, cancelled, kind = 'kane') {
  let resolve, reject
  const promise = new Promise((ok, fail) => { resolve = ok; reject = fail })
  const item = {
    promise, kind, started: false, settled: false,
    cancel() {
      if (item.started || item.settled) return
      item.settled = true
      control?.jobs.delete(item)
      try { resolve(cancelled()) } catch (error) { reject(error) }
    },
  }
  control?.jobs.add(item)
  // Human browser access is connection-local and must not wait for unrelated
  // Kane work. Kane itself stays globally serialized and waits for any opening
  // operation already in progress on its own connection.
  const predecessor = kind === 'browser' ? control.lifecycle : Promise.all([lastJob, control?.lifecycle])
  const slot = predecessor.then(async () => {
    if (item.settled) return
    item.started = true
    try { resolve(await work()) } catch (error) { reject(error) }
    finally { item.settled = true; control?.jobs.delete(item) }
  })
  if (kind === 'browser') control.lifecycle = slot.catch(() => {})
  else lastJob = slot.catch(() => {})
  return promise
}

function signalRunner(child, signal) {
  if (!child?.pid) return
  // Kane's launcher spawns its bundled Node runtime and ignores SIGTERM itself.
  // Its dedicated process group includes the runtime and runner, but excludes
  // the separately owned Chrome process that must survive human takeover.
  try {
    if (process.platform !== 'win32') process.kill(-child.pid, signal)
    else child.kill(signal)
  } catch { /* The entire group may already have exited. */ }
}

function stopRunner(child) {
  if (!child || child.stopRequested) return
  child.stopRequested = true
  signalRunner(child, 'SIGTERM')
  child.killTimer = setTimeout(() => signalRunner(child, 'SIGKILL'), STOP_GRACE_MS)
  child.killTimer.unref()
}

async function cancelJobs(control) {
  for (const item of control.jobs) item.cancel()
  stopRunner(control.activeChild)
  stopRunner(control.activeFocus)
  await Promise.allSettled([...control.jobs].map((item) => item.promise))
}

function cancelledResult(phase, taskId, summary = 'Browser work was paused before it started.') {
  return {
    phase, status: 'cancelled', summary, finalState: {}, steps: [], stepCount: 0,
    evidencePath: null, evidencePackPath: null, runId: null, sessionId: null,
    testUrl: null, resultCode: null, verdict: null, creditsConsumed: null,
    durationMs: 0, exitCode: 3, browserId: taskId ? profileFor(taskId).browserId : null,
    browserReused: false, browserReconnected: false, conditionResults: null,
    allConditionsTrue: null,
  }
}

function profileFor(taskId) {
  const hash = createHash('sha256').update(taskId).digest('hex')
  return {
    profileDir: path.join(process.cwd(), 'data', 'chrome-tasks', hash),
    browserId: hash.slice(0, 16),
  }
}

function chromeExecutable() {
  const candidates = [
    process.env.KANE_CLI_CHROME_PATH,
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
  ].filter(Boolean)
  for (const candidate of candidates) if (existsSync(candidate)) return candidate
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium']) {
    const found = spawnSync('which', [name], { encoding: 'utf8', timeout: 2_000 })
    if (found.status === 0 && found.stdout.trim()) return found.stdout.trim()
  }
  return null
}

function processHasProfile(pid, profileDir) {
  if (!Number.isInteger(pid) || pid <= 0) return false
  try { process.kill(pid, 0) } catch { return false }
  const result = spawnSync('ps', ['-p', String(pid), '-o', 'command='], { encoding: 'utf8', timeout: 2_000 })
  return result.status === 0 && (result.stdout || '').includes(`--user-data-dir=${profileDir}`)
}

async function chromeEndpoint(profileDir) {
  let portText
  try { portText = (await readFile(path.join(profileDir, 'DevToolsActivePort'), 'utf8')).split(/\r?\n/)[0] } catch { return null }
  const port = Number(portText)
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null
  const endpoint = `http://127.0.0.1:${port}`
  try {
    const response = await fetch(`${endpoint}/json/version`, { signal: AbortSignal.timeout(1_000) })
    const details = response.ok ? await response.json() : null
    const debuggerUrl = details?.webSocketDebuggerUrl ? new URL(details.webSocketDebuggerUrl) : null
    if (debuggerUrl && ['127.0.0.1', 'localhost', '[::1]'].includes(debuggerUrl.hostname)
      && Number(debuggerUrl.port) === port) return endpoint
  } catch { /* Browser may still be starting or has exited. */ }
  return null
}

async function ensureTaskBrowser(taskId, headless) {
  const { profileDir, browserId } = profileFor(taskId)
  const ownerPath = path.join(profileDir, 'raising-kane-owner.json')
  const live = taskBrowsers.get(taskId)
  if (live) {
    if (live.headless !== headless) throw new Error('This task browser is already running in a different display mode.')
    const oursStillRunning = live.child ? live.child.exitCode === null : processHasProfile(live.pid, profileDir)
    if (oursStillRunning && await chromeEndpoint(profileDir)) return { ...live, reused: true }
    taskBrowsers.delete(taskId)
    throw new Error('The task browser was lost. Reconcile the source draft before resuming.')
  }

  await mkdir(profileDir, { recursive: true, mode: 0o700 })
  let owner = null
  let ownerText = null
  try { ownerText = await readFile(ownerPath, 'utf8') }
  catch (error) {
    if (error?.code !== 'ENOENT') throw new Error('The task browser ownership record cannot be read.')
  }
  if (ownerText != null) {
    try { owner = JSON.parse(ownerText) }
    catch { throw new Error('The task browser ownership record is damaged; reconcile before resuming.') }
  }
  if (!owner && await chromeEndpoint(profileDir)) {
    throw new Error('A task browser is reachable without a valid ownership record; reconcile before resuming.')
  }
  if (owner && owner.browserId !== browserId) throw new Error('The task browser ownership record does not match this connection.')
  if (owner?.pid && processHasProfile(owner.pid, profileDir)) {
    const endpoint = await chromeEndpoint(profileDir)
    if (!endpoint) throw new Error('The task browser is running but its control endpoint is unavailable.')
    if (owner.headless !== headless) throw new Error('This task browser is already running in a different display mode.')
    const reconnected = { taskId, browserId, profileDir, ownerPath, pid: owner.pid, endpoint, headless, child: null }
    taskBrowsers.set(taskId, reconnected)
    return { ...reconnected, reused: true, reconnected: true }
  }
  if (owner) {
    throw new Error('The prior task browser is gone. Reconcile the source draft before starting another browser job.')
  }

  const executable = chromeExecutable()
  if (!executable) throw new Error('Google Chrome is not installed or its executable cannot be found.')
  await rm(path.join(profileDir, 'DevToolsActivePort'), { force: true })
  const args = [
    '--remote-debugging-port=0',
    '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900',
  ]
  if (headless) args.push('--headless=new')
  args.push('about:blank')
  // A detached process group keeps this task-owned browser alive when the
  // local server or its launching terminal is restarted. Only the verified
  // private profile is eligible for later cleanup.
  const child = spawn(executable, args, { stdio: 'ignore', shell: false, detached: true })
  let launchError = null
  child.once('error', (error) => { launchError = error })
  const until = Date.now() + CHROME_START_TIMEOUT_MS
  let endpoint = null
  while (Date.now() < until && !endpoint && !launchError && child.exitCode === null) {
    endpoint = await chromeEndpoint(profileDir)
    if (!endpoint) await new Promise((resolve) => setTimeout(resolve, 100))
  }
  if (!endpoint) {
    if (child.exitCode === null) child.kill('SIGTERM')
    throw new Error(launchError ? 'Could not launch the dedicated task browser.' : 'The dedicated task browser did not become ready.')
  }
  const browser = { taskId, browserId, profileDir, ownerPath, pid: child.pid, endpoint, headless, child }
  try {
    await writeFile(ownerPath, JSON.stringify({ pid: child.pid, browserId, headless, startedAt: new Date().toISOString() }), { mode: 0o600 })
  } catch {
    child.kill('SIGTERM')
    throw new Error('Could not record ownership of the dedicated task browser.')
  }
  child.unref()
  taskBrowsers.set(taskId, browser)
  return { ...browser, reused: false, reconnected: false }
}

async function evidencePackPath(coveragePack, terminal) {
  const direct = [coveragePack, terminal?.coverage?.pack, terminal?.evidence_pack_path, terminal?.evidence_path]
  for (const candidate of direct) {
    if (typeof candidate === 'string' && candidate.endsWith('.evidence') && existsSync(candidate)) return candidate
  }
  if (typeof terminal?.session_dir !== 'string') return null
  const evidenceDir = path.join(terminal.session_dir, 'evidence')
  try {
    const entries = (await readdir(evidenceDir, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith('.evidence'))
    if (entries.length === 1) return path.join(evidenceDir, entries[0].name)
  } catch { /* A refused run may not have a session or sealed pack. */ }
  return null
}

function notify(callback, event) {
  if (typeof callback !== 'function') return
  try {
    callback(event)
  } catch {
    // Rendering a progress event must not change the browser task's outcome.
  }
}

function clipped(value, max = 500) {
  return typeof value === 'string'
    ? value.replace(/Bearer\s+\S+|\bsk-[A-Za-z0-9_-]{12,}\b|\bkhk_[A-Za-z0-9_-]+\b/gi, '[redacted]').slice(0, max)
    : ''
}

function knownDiagnostic(stderr) {
  if (/could not resolve credentials|not authenticated|login required/i.test(stderr)) return 'Kane could not use its saved sign-in. Sign in again before retrying.'
  if (/insufficient credits|no credits|credit balance/i.test(stderr)) return 'Kane could not start because the account has no available credits.'
  if (/cdp endpoint not reachable|could not connect to.*cdp|ECONNREFUSED/i.test(stderr)) return 'Kane could not connect to the dedicated task browser.'
  if (/unknown option|invalid option/i.test(stderr)) return 'Kane rejected a worker option; check the installed CLI version.'
  return ''
}

async function assertNoDefaultStartUrl() {
  // --allow-missing-url does not override Kane's saved default_url. Refuse
  // that ambiguity so authenticated resume cannot silently navigate away.
  try {
    const config = JSON.parse(await readFile(path.join(homedir(), '.testmuai', 'kaneai', 'tui-config.json'), 'utf8'))
    if (typeof config.default_url === 'string' && config.default_url.trim()
      && config.default_url !== 'https://kaneai-playground.lambdatest.io') {
      throw new Error('Clear Kane’s configured default start URL before inspecting the current browser page.')
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
}

async function runJob({ taskId, phase, objective, url, onEvent, timeoutMs, headless, mode, analyzerOnly, conditions, currentPage, control, generation }) {
  const startedAt = Date.now()
  if (control && (control.paused || control.disconnected || control.generation !== generation)) {
    return cancelledResult(phase, taskId)
  }
  let browser = null
  if (taskId) {
    try {
      if (analyzerOnly || currentPage) {
        if (currentPage) await assertNoDefaultStartUrl()
        const state = await getTaskBrowserState(taskId)
        if (state.status !== 'ready') throw new Error('The existing task browser is unavailable; open it before inspecting the current page.')
      }
      browser = await ensureTaskBrowser(taskId, headless)
    } catch (error) {
      const summary = clipped(error?.message || 'The dedicated task browser could not start.', 500)
      notify(onEvent, { type: 'complete', phase, status: 'error', summary })
      return {
        phase, mode, status: 'error', summary, finalState: {}, steps: [], stepCount: 0,
        evidencePath: null, evidencePackPath: null, runId: null, sessionId: null,
        testUrl: null, resultCode: null, verdict: null, creditsConsumed: null,
        durationMs: Date.now() - startedAt, exitCode: null,
        browserId: profileFor(taskId).browserId, browserReused: false,
        browserReconnected: false, conditionResults: null, allConditionsTrue: null,
      }
    }
  }
  // pauseTaskBrowser may have arrived during the asynchronous Chrome launch.
  // Do not start Kane after the pause generation has changed.
  if (control && (control.paused || control.disconnected || control.generation !== generation)) {
    return cancelledResult(phase, taskId)
  }
  return new Promise((resolve) => {
    const stepByKey = new Map()
    let terminal = null
    let childError = null
    let timedOut = false
    let outputTooLarge = false
    let outputBytes = 0
    let lineBuffer = ''
    let stderrTail = ''
    let coveragePack = null
    let finished = false

    const args = analyzerOnly
      ? ['run', '--analyzer-only', '--allow-missing-url', '--agent', '--timeout', String(Math.ceil(timeoutMs / 1000))]
      : ['run', objective, ...(currentPage ? ['--allow-missing-url'] : ['--url', url]), '--agent', '--mode', mode,
        '--final-validation', 'on', '--timeout', String(Math.ceil(timeoutMs / 1000))]
    if (analyzerOnly) for (const condition of conditions) args.push('--condition', condition)
    if (browser) args.push('--cdp-endpoint', browser.endpoint)
    else if (headless) args.push('--headless')

    const child = spawn('kane-cli', args, {
      cwd: process.cwd(),
      env: { ...process.env, KANE_CLI_USER_AGENT: 'codex' },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      detached: process.platform !== 'win32',
    })
    if (control) control.activeChild = child

    notify(onEvent, { type: 'start', phase, at: new Date().toISOString() })

    const consumeLine = (line) => {
      if (!line.trim()) return
      let event
      try {
        event = JSON.parse(line)
      } catch {
        return
      }
      if (!event || typeof event !== 'object') return
      if (event.type === 'run_end') {
        terminal = event
      } else if (event.type === 'coverage' && typeof event.pack === 'string') {
        coveragePack = event.pack
      } else if (typeof event.step === 'number' && typeof event.status === 'string') {
        const step = {
          step: event.step,
          status: clipped(event.status, 40),
          remark: clipped(event.remark, 500),
        }
        // Keep the last state for each step. A later completion replaces running.
        stepByKey.set(`${event.execution_id ?? ''}:${event.child_id ?? ''}:${event.step}`, step)
        notify(onEvent, { type: 'step', phase, ...step })
      } else if (event.type === 'error') {
        notify(onEvent, { type: 'error', phase, message: clipped(event.message, 500) })
      } else if (event.type === 'warning') {
        notify(onEvent, { type: 'warning', phase, message: clipped(event.message, 500) })
      }
    }

    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk) => {
      outputBytes += Buffer.byteLength(chunk)
      if (outputBytes > MAX_OUTPUT_BYTES) {
        outputTooLarge = true
        stopRunner(child)
        return
      }
      lineBuffer += chunk
      let newline = lineBuffer.indexOf('\n')
      while (newline !== -1) {
        consumeLine(lineBuffer.slice(0, newline))
        lineBuffer = lineBuffer.slice(newline + 1)
        newline = lineBuffer.indexOf('\n')
      }
      if (Buffer.byteLength(lineBuffer) > MAX_LINE_BYTES) {
        outputTooLarge = true
        stopRunner(child)
      }
    })

    // Keep only a short private tail for known error classification. Never log
    // or return raw stderr, which may include the user's data or credentials.
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', (chunk) => { stderrTail = (stderrTail + chunk).slice(-4_096) })
    child.on('error', (error) => { childError = error })

    const timer = setTimeout(() => {
      timedOut = true
      stopRunner(child)
    }, timeoutMs + 10_000)
    timer.unref()

    child.on('close', async (exitCode) => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      clearTimeout(child.killTimer)
      if (child.stopRequested) signalRunner(child, 'SIGKILL')
      if (control?.activeChild === child) control.activeChild = null
      consumeLine(lineBuffer)

      const steps = [...stepByKey.values()].filter((step) => ['done', 'failed'].includes(step.status))
      const rawConditionResults = analyzerOnly && Array.isArray(terminal?.condition_results)
        ? terminal.condition_results : null
      const conditionResults = analyzerOnly ? conditions.map((condition, index) => ({
        condition,
        result: typeof rawConditionResults?.[index] === 'boolean' ? rawConditionResults[index] : null,
        reason: clipped(terminal?.condition_reasons?.[index], 300) || null,
      })) : null
      const allConditionsTrue = analyzerOnly
        ? rawConditionResults?.length === conditions.length && conditionResults.every((item) => item.result === true)
        : null
      const wasCancelled = control && (control.paused || control.disconnected || control.generation !== generation)
      const status = wasCancelled
        ? 'cancelled'
        : childError?.code === 'ENOENT'
        ? 'unavailable'
        : timedOut || exitCode === 3
          ? 'timeout'
          : outputTooLarge
            ? 'error'
            : exitCode === 0 && terminal?.status === 'passed' && (!analyzerOnly || allConditionsTrue)
              ? 'passed'
              : analyzerOnly && rawConditionResults?.some((value) => value === false)
                ? 'failed'
              : exitCode === 1 || terminal?.status === 'failed'
                ? 'failed'
                : 'error'
      const summary = wasCancelled
        ? 'Browser work was paused; its result needs a fresh source check before continuing.'
        : outputTooLarge
        ? 'Kane produced more output than this worker can safely process.'
        : childError?.code === 'ENOENT'
          ? 'Kane CLI is not installed.'
          : timedOut
            ? 'Kane did not finish before the time limit.'
            : clipped(terminal?.summary || terminal?.one_liner, 1000)
              || knownDiagnostic(stderrTail)
              || `Kane did not produce a completed result (exit ${exitCode ?? 'unknown'}).`
      const sealedPack = await evidencePackPath(coveragePack, terminal)

      notify(onEvent, { type: 'complete', phase, status, summary: clipped(summary, 500) })

      resolve({
        phase,
        mode: analyzerOnly ? 'analyzer' : mode,
        status,
        summary,
        finalState: terminal?.final_state && typeof terminal.final_state === 'object'
          ? terminal.final_state
          : {},
        steps,
        stepCount: steps.length,
        evidencePath: sealedPack,
        evidencePackPath: sealedPack,
        runDir: terminal?.run_dir || null,
        sessionDir: terminal?.session_dir || null,
        runId: terminal?.run_id || null,
        sessionId: terminal?.session_id || null,
        testUrl: terminal?.test_url || null,
        reasonCode: clipped(terminal?.reason_code, 80) || null,
        reason: clipped(terminal?.reason, 500) || null,
        creditsConsumed: terminal?.credits_consumed != null && Number.isFinite(Number(terminal.credits_consumed))
          ? Number(terminal.credits_consumed)
          : null,
        resultCode: terminal?.result_code ?? null,
        verdict: terminal?.verdict && typeof terminal.verdict === 'object'
          ? { family: clipped(terminal.verdict.family, 80), category: clipped(terminal.verdict.category, 80) }
          : null,
        durationMs: Date.now() - startedAt,
        exitCode,
        browserId: browser?.browserId || null,
        browserReused: browser?.reused ?? false,
        browserReconnected: browser?.reconnected ?? false,
        conditionResults,
        allConditionsTrue,
      })
    })
  })
}

/**
 * Execute an actual Kane browser objective. A successful process exit without a
 * passing terminal event is an error, never a pass. Browser jobs are serialized.
 */
export function runKane({ taskId, phase = 'browser', objective, url, onEvent, timeoutMs = DEFAULT_TIMEOUT_MS, headless = false, mode = 'testing', analyzerOnly = false, conditions = [], currentPage = false } = {}) {
  if (taskId != null && (typeof taskId !== 'string' || !taskId.trim() || taskId.length > 200)) {
    return Promise.reject(new TypeError('A task ID must be a non-empty string under 200 characters.'))
  }
  if (!['testing', 'action'].includes(mode)) {
    return Promise.reject(new TypeError('Kane mode must be testing or action.'))
  }
  if (!analyzerOnly && (typeof objective !== 'string' || !objective.trim())) {
    return Promise.reject(new TypeError('Kane objective is required.'))
  }
  if (analyzerOnly && (!taskId || !Array.isArray(conditions) || conditions.length === 0
    || conditions.some((condition) => typeof condition !== 'string' || !condition.trim()))) {
    return Promise.reject(new TypeError('Current-page analysis needs a task ID and at least one condition.'))
  }
  if (currentPage && !taskId) return Promise.reject(new TypeError('Current-page work needs an existing task browser.'))
  let parsedUrl
  try { parsedUrl = new URL(url) } catch { /* handled below */ }
  if (!analyzerOnly && !currentPage && (!parsedUrl || !['http:', 'https:'].includes(parsedUrl.protocol) || parsedUrl.username || parsedUrl.password)) {
    return Promise.reject(new TypeError('Kane URL must be an HTTP or HTTPS URL.'))
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs < 10_000 || timeoutMs > 600_000) {
    return Promise.reject(new RangeError('Kane timeout must be between 10 and 600 seconds.'))
  }

  const control = taskId ? controlFor(taskId) : null
  const generation = control?.generation ?? 0
  if (control?.paused || control?.disconnected) return Promise.resolve(cancelledResult(phase, taskId))
  return enqueue(control, () => runJob({ taskId, phase, objective: analyzerOnly ? '' : objective.trim(),
    url: parsedUrl?.href, onEvent, timeoutMs, headless, mode, analyzerOnly, currentPage,
    conditions: analyzerOnly ? conditions.map((condition) => condition.trim()) : [], control, generation }),
  () => cancelledResult(phase, taskId))
}

export function analyzeTaskBrowser({ taskId, conditions, onEvent, timeoutMs } = {}) {
  return runKane({ taskId, phase: 'analyze', analyzerOnly: true, conditions, onEvent, timeoutMs })
}

function validTaskId(taskId) {
  if (typeof taskId !== 'string' || !taskId.trim() || taskId.length > 200) {
    throw new TypeError('A task ID must be a non-empty string under 200 characters.')
  }
}

function validWebUrl(url) {
  let parsed
  try { parsed = new URL(url) } catch { /* handled below */ }
  if (!parsed || !['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new TypeError('Website URL must be HTTP or HTTPS.')
  }
  return parsed.href
}

async function focusOwnedBrowser(browser, control, assertCurrent) {
  const fallback = {
    focused: false,
    focusStatus: 'manual',
    focusMessage: 'The browser is open. Select its Chrome window to continue.',
  }
  assertCurrent()
  if (process.platform !== 'darwin' || !processHasProfile(browser.pid, browser.profileDir)) return fallback
  assertCurrent()
  // CDP activates a tab but need not foreground Chrome above another app.
  // This native operation addresses only the PID verified against our private
  // profile. It neither inspects windows/page content nor reads other apps.
  const script = `tell application "System Events"
set ownedProcess to first application process whose unix id is ${browser.pid}
set frontmost of ownedProcess to true
return frontmost of ownedProcess
end tell`
  const focused = await new Promise((resolve) => {
    const child = spawn('/usr/bin/osascript', ['-e', script], {
      stdio: ['ignore', 'pipe', 'ignore'], shell: false, detached: true,
    })
    control.activeFocus = child
    let answer = ''
    let failed = false
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (value) => { answer = (answer + value).slice(0, 32) })
    child.on('error', () => { failed = true })
    const timer = setTimeout(() => stopRunner(child), NATIVE_FOCUS_TIMEOUT_MS)
    timer.unref()
    child.on('close', (code) => {
      clearTimeout(timer)
      clearTimeout(child.killTimer)
      if (child.stopRequested) signalRunner(child, 'SIGKILL')
      if (control.activeFocus === child) control.activeFocus = null
      resolve(!failed && !child.stopRequested && code === 0 && answer.trim() === 'true')
    })
  })
  assertCurrent()
  return focused ? { focused: true, focusStatus: 'focused', focusMessage: null } : fallback
}

/** Open a visible private Chrome window for the person to operate directly. */
export function openTaskBrowser({ taskId, url }) {
  validTaskId(taskId)
  const targetUrl = validWebUrl(url)
  const control = controlFor(taskId)
  if ([...control.jobs].some((job) => job.kind === 'kane')) {
    return Promise.reject(new Error('Pause this connection’s browser work before opening it.'))
  }
  const generation = control.generation
  const assertCurrent = () => {
    if (control.disconnected || control.generation !== generation) throw new Error('Opening this browser was cancelled.')
  }
  return enqueue(control, async () => {
    assertCurrent()
    const browser = await ensureTaskBrowser(taskId, false)
    assertCurrent()
    // Only lifecycle/navigation CDP calls; no page DOM, screenshots, or cookies.
    // Reusing a browser focuses its existing page and preserves sign-in context.
    if (browser.reused) {
      const response = await fetch(`${browser.endpoint}/json/list`, { signal: AbortSignal.timeout(5_000) })
      const targets = response.ok ? await response.json() : []
      const target = targets.find((item) => item.type === 'page' && item.url !== 'about:blank')
      if (target && /^[\w-]+$/.test(target.id)) {
        assertCurrent()
        const focused = await fetch(`${browser.endpoint}/json/activate/${target.id}`, { signal: AbortSignal.timeout(5_000) })
        if (!focused.ok) throw new Error('The private browser could not activate its existing page.')
        const focus = await focusOwnedBrowser(browser, control, assertCurrent)
        return { status: 'ready', browserId: browser.browserId, reused: true, ...focus }
      }
    }
    assertCurrent()
    const response = await fetch(`${browser.endpoint}/json/new?${encodeURIComponent(targetUrl)}`, {
      method: 'PUT', signal: AbortSignal.timeout(5_000),
    })
    if (!response.ok) throw new Error('The private browser could not open this website.')
    const target = await response.json()
    if (target?.type !== 'page' && target?.type !== 'tab') throw new Error('Chrome did not create a website tab.')
    assertCurrent()
    const focus = await focusOwnedBrowser(browser, control, assertCurrent)
    return { status: 'ready', browserId: browser.browserId, url: targetUrl, reused: browser.reused, ...focus }
  }, () => { throw new Error('Opening this browser was cancelled.') }, 'browser')
}

/** Stop all owned runner processes before returning control to the person. */
export function pauseTaskBrowser(taskId) {
  validTaskId(taskId)
  const control = controlFor(taskId)
  if (control.pausePromise) return control.pausePromise
  control.paused = true
  control.pausing = true
  control.generation += 1
  control.pausePromise = cancelJobs(control).then(() => ({ status: 'paused', browserId: profileFor(taskId).browserId }))
    .finally(() => { control.pausing = false; control.pausePromise = null })
  return control.pausePromise
}

/** Reconnect the same owned browser after explicit human Continue. */
export async function resumeTaskBrowser(taskId) {
  validTaskId(taskId)
  const control = controlFor(taskId)
  if (control.disconnected) throw new Error('This connection has been disconnected.')
  if (control.pausing) throw new Error('Browser work is still stopping; wait before continuing.')
  const generation = control.generation
  const state = await getTaskBrowserState(taskId)
  if (control.disconnected || control.generation !== generation) throw new Error('Resuming this browser was cancelled.')
  if (state.status !== 'ready') throw new Error('The original browser is unavailable. Reconcile before starting a new connection.')
  const browser = await ensureTaskBrowser(taskId, false)
  if (control.disconnected || control.generation !== generation) throw new Error('Resuming this browser was cancelled.')
  control.generation += 1
  control.paused = false
  return { ...state, paused: false, reconnected: browser.reconnected ?? false }
}

/** Stop automation, close the owned browser, then erase its private profile. */
export function disconnectTaskBrowser(taskId) {
  validTaskId(taskId)
  const control = controlFor(taskId)
  if (control.disconnectPromise) return control.disconnectPromise
  control.disconnected = true
  control.paused = true
  control.generation += 1
  control.disconnectPromise = (async () => {
    await cancelJobs(control)
    await shutdownTaskBrowser(taskId)
    const { profileDir, browserId } = profileFor(taskId)
    await rm(profileDir, { recursive: true, force: true })
    // Keep the tombstone so late requests cannot recreate this connection.
    return { status: 'disconnected', browserId }
  })().catch((error) => { control.disconnectPromise = null; throw error })
  return control.disconnectPromise
}

/** Browser ownership/continuity state without disclosing the CDP endpoint. */
export async function getTaskBrowserState(taskId) {
  if (typeof taskId !== 'string' || !taskId.trim() || taskId.length > 200) {
    throw new TypeError('A task ID must be a non-empty string under 200 characters.')
  }
  const { profileDir, browserId } = profileFor(taskId)
  if (taskControls.get(taskId)?.disconnected) return { status: 'disconnected', browserId }
  let owner
  let ownerText
  try { ownerText = await readFile(path.join(profileDir, 'raising-kane-owner.json'), 'utf8') }
  catch (error) {
    if (error?.code !== 'ENOENT') return { status: 'lost', browserId }
    return { status: await chromeEndpoint(profileDir) ? 'lost' : 'new', browserId }
  }
  try { owner = JSON.parse(ownerText) }
  catch { return { status: 'lost', browserId } }
  if (owner?.browserId !== browserId || !processHasProfile(owner.pid, profileDir)) {
    return { status: 'lost', browserId }
  }
  return { status: await chromeEndpoint(profileDir) ? 'ready' : 'lost', browserId }
}

/** Stop only a Chrome process verified to use this task's private profile. */
export async function shutdownTaskBrowser(taskId) {
  if (typeof taskId !== 'string' || !taskId.trim()) return false
  const { profileDir } = profileFor(taskId)
  const ownerPath = path.join(profileDir, 'raising-kane-owner.json')
  const live = taskBrowsers.get(taskId)
  let pid = live?.pid
  if (!pid) {
    try { pid = JSON.parse(await readFile(ownerPath, 'utf8')).pid } catch { /* No owned browser. */ }
  }
  if (!processHasProfile(pid, profileDir)) {
    if (await chromeEndpoint(profileDir)) {
      throw new Error('A task browser is still reachable, but process ownership cannot be verified.')
    }
    taskBrowsers.delete(taskId)
    await rm(ownerPath, { force: true })
    return false
  }
  try { process.kill(pid, 'SIGTERM') } catch { /* It may have just exited. */ }
  for (let i = 0; i < 30 && processHasProfile(pid, profileDir); i++) {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  if (processHasProfile(pid, profileDir)) {
    try { process.kill(pid, 'SIGKILL') } catch { /* It may have just exited. */ }
    for (let i = 0; i < 20 && processHasProfile(pid, profileDir); i++) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    if (processHasProfile(pid, profileDir)) throw new Error('The owned browser could not be stopped; its profile was retained.')
  }
  taskBrowsers.delete(taskId)
  await rm(ownerPath, { force: true })
  return true
}

export async function shutdownAllTaskBrowsers() {
  // Graceful server shutdown must not leave a detached Kane runner controlling
  // a browser after the server has stopped accepting takeover requests.
  await Promise.all([...taskControls.keys()].map((taskId) => pauseTaskBrowser(taskId)))
  for (const taskId of [...taskBrowsers.keys()]) await shutdownTaskBrowser(taskId)
}

/** Lightweight, read-only status for the UI. This does not launch a browser. */
export function getKaneAvailability() {
  const env = { ...process.env, KANE_CLI_USER_AGENT: 'codex' }
  const version = spawnSync('kane-cli', ['--version'], { encoding: 'utf8', timeout: 5_000, env })
  if (version.error?.code === 'ENOENT' || version.status !== 0) {
    return { installed: false, available: false, authenticated: false, version: null }
  }
  const whoami = spawnSync('kane-cli', ['whoami'], { encoding: 'utf8', timeout: 8_000, env })
  const authenticated = whoami.status === 0
    && /✓\s*Authenticated/.test(whoami.stdout || '')
  return {
    installed: true,
    available: authenticated,
    authenticated,
    version: clipped((version.stdout || '').trim(), 80),
  }
}
