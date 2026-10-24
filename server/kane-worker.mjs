import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

// Browser jobs are serialized even across tasks: Kane's local Chrome/CDP ports
// are not safe to treat as independent without an explicit external browser.
let lastJob = Promise.resolve()
const taskBrowsers = new Map()

const MAX_OUTPUT_BYTES = 8 * 1024 * 1024
const MAX_LINE_BYTES = 1024 * 1024
const DEFAULT_TIMEOUT_MS = 240_000
const CHROME_START_TIMEOUT_MS = 15_000

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

async function runJob({ taskId, phase, objective, url, onEvent, timeoutMs, headless }) {
  const startedAt = Date.now()
  let browser = null
  if (taskId) {
    try {
      browser = await ensureTaskBrowser(taskId, headless)
    } catch (error) {
      const summary = clipped(error?.message || 'The dedicated task browser could not start.', 500)
      notify(onEvent, { type: 'complete', phase, status: 'error', summary })
      return {
        phase, status: 'error', summary, finalState: {}, steps: [], stepCount: 0,
        evidencePath: null, evidencePackPath: null, runId: null, sessionId: null,
        testUrl: null, resultCode: null, verdict: null, creditsConsumed: null,
        durationMs: Date.now() - startedAt, exitCode: null,
        browserId: profileFor(taskId).browserId, browserReused: false,
      }
    }
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

    const args = [
      'run',
      objective,
      '--url',
      url,
      '--agent',
      '--final-validation',
      'on',
      '--timeout',
      String(Math.ceil(timeoutMs / 1000)),
    ]
    if (browser) args.push('--cdp-endpoint', browser.endpoint)
    else if (headless) args.push('--headless')

    const child = spawn('kane-cli', args, {
      cwd: process.cwd(),
      env: { ...process.env, KANE_CLI_USER_AGENT: 'codex' },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    })

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
        stepByKey.set(`${event.execution_id ?? ''}:${event.step}`, step)
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
        child.kill('SIGTERM')
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
        child.kill('SIGTERM')
      }
    })

    // Keep only a short private tail for known error classification. Never log
    // or return raw stderr, which may include the user's data or credentials.
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', (chunk) => { stderrTail = (stderrTail + chunk).slice(-4_096) })
    child.on('error', (error) => { childError = error })

    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
      setTimeout(() => child.kill('SIGKILL'), 5_000).unref()
    }, timeoutMs + 10_000)
    timer.unref()

    child.on('close', async (exitCode) => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      consumeLine(lineBuffer)

      const steps = [...stepByKey.values()].filter((step) => step.status !== 'running')
      const status = childError?.code === 'ENOENT'
        ? 'unavailable'
        : timedOut || exitCode === 3
          ? 'timeout'
          : outputTooLarge
            ? 'error'
            : exitCode === 0 && terminal?.status === 'passed'
              ? 'passed'
              : exitCode === 1 || terminal?.status === 'failed'
                ? 'failed'
                : 'error'
      const summary = outputTooLarge
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
      })
    })
  })
}

/**
 * Execute an actual Kane browser objective. A successful process exit without a
 * passing terminal event is an error, never a pass. Browser jobs are serialized.
 */
export function runKane({ taskId, phase = 'browser', objective, url, onEvent, timeoutMs = DEFAULT_TIMEOUT_MS, headless = false }) {
  if (taskId != null && (typeof taskId !== 'string' || !taskId.trim() || taskId.length > 200)) {
    return Promise.reject(new TypeError('A task ID must be a non-empty string under 200 characters.'))
  }
  if (typeof objective !== 'string' || !objective.trim()) {
    return Promise.reject(new TypeError('Kane objective is required.'))
  }
  let parsedUrl
  try { parsedUrl = new URL(url) } catch { /* handled below */ }
  if (!parsedUrl || !['http:', 'https:'].includes(parsedUrl.protocol)) {
    return Promise.reject(new TypeError('Kane URL must be an HTTP or HTTPS URL.'))
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs < 10_000 || timeoutMs > 600_000) {
    return Promise.reject(new RangeError('Kane timeout must be between 10 and 600 seconds.'))
  }

  const job = lastJob.then(() => runJob({ taskId, phase, objective: objective.trim(), url: parsedUrl.href, onEvent, timeoutMs, headless }))
  lastJob = job.catch(() => {})
  return job
}

/** Browser ownership/continuity state without disclosing the CDP endpoint. */
export async function getTaskBrowserState(taskId) {
  if (typeof taskId !== 'string' || !taskId.trim() || taskId.length > 200) {
    throw new TypeError('A task ID must be a non-empty string under 200 characters.')
  }
  const { profileDir, browserId } = profileFor(taskId)
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
  }
  taskBrowsers.delete(taskId)
  await rm(ownerPath, { force: true })
  return true
}

export async function shutdownAllTaskBrowsers() {
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
