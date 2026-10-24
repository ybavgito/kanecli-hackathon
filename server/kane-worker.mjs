import { spawn, spawnSync } from 'node:child_process'

// One browser operation at a time. The POC shares a single local Chrome profile,
// so overlapping Kane jobs would make draft ownership impossible to reason about.
let lastJob = Promise.resolve()

const MAX_OUTPUT_BYTES = 8 * 1024 * 1024
const MAX_LINE_BYTES = 1024 * 1024
const DEFAULT_TIMEOUT_MS = 240_000

function notify(callback, event) {
  if (typeof callback !== 'function') return
  try {
    callback(event)
  } catch {
    // Rendering a progress event must not change the browser task's outcome.
  }
}

function clipped(value, max = 500) {
  return typeof value === 'string' ? value.slice(0, max) : ''
}

function runJob({ phase, objective, url, onEvent, timeoutMs, headless }) {
  return new Promise((resolve) => {
    const startedAt = Date.now()
    const stepByKey = new Map()
    let terminal = null
    let childError = null
    let timedOut = false
    let outputTooLarge = false
    let outputBytes = 0
    let lineBuffer = ''
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
    if (headless) args.push('--headless')

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

    // Drain stderr so the child cannot block. CLI diagnostics may include user
    // data, so they are deliberately not logged or returned to the product.
    child.stderr.resume()
    child.on('error', (error) => { childError = error })

    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
      setTimeout(() => child.kill('SIGKILL'), 5_000).unref()
    }, timeoutMs + 10_000)
    timer.unref()

    child.on('close', (exitCode) => {
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
              || `Kane did not produce a completed result (exit ${exitCode ?? 'unknown'}).`

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
        evidencePath: terminal?.run_dir || terminal?.session_dir || null,
        runId: terminal?.run_id || null,
        testUrl: terminal?.test_url || null,
        resultCode: terminal?.result_code ?? null,
        verdict: terminal?.verdict && typeof terminal.verdict === 'object'
          ? { family: clipped(terminal.verdict.family, 80), category: clipped(terminal.verdict.category, 80) }
          : null,
        durationMs: Date.now() - startedAt,
        exitCode,
      })
    })
  })
}

/**
 * Execute an actual Kane browser objective. A successful process exit without a
 * passing terminal event is an error, never a pass. Browser jobs are serialized.
 */
export function runKane({ phase = 'browser', objective, url, onEvent, timeoutMs = DEFAULT_TIMEOUT_MS, headless = false }) {
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

  const job = lastJob.then(() => runJob({ phase, objective: objective.trim(), url: parsedUrl.href, onEvent, timeoutMs, headless }))
  lastJob = job.catch(() => {})
  return job
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
