import { spawn, spawnSync } from 'node:child_process'
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises'
import { createServer } from 'node:net'
import { join } from 'node:path'
import { readMapDetails, readExplorationWriteup } from './exploration-api.mjs'
import {
  kaneEnvironment,
  runKane,
  runPreviewKane,
  shutdownTaskBrowser,
  preparePreviewBrowser,
} from '../kane-worker.mjs'

const ownedProcesses = new Set()
export function shutdownBuilderWorkers() {
  for (const child of ownedProcesses) {
    try {
      process.kill(-child.pid, 'SIGTERM')
    } catch {
      child.kill('SIGTERM')
    }
  }
}
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
export function command(args, cwd, { timeout = 300000, onEvent = () => {} } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.env.KANE_CLI || 'kane-cli', args, {
      cwd,
      env: kaneEnvironment(),
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    })
    ownedProcesses.add(child)
    const events = []
    let buffer = '',
      size = 0,
      stderr = ''
    const consume = (line) => {
      try {
        const event = JSON.parse(line)
        events.push(event)
        onEvent(event)
      } catch {}
    }
    const stop = () => {
      try {
        process.kill(-child.pid, 'SIGTERM')
      } catch {}
    }
    const timer = setTimeout(() => {
      stop()
      setTimeout(() => {
        try {
          process.kill(-child.pid, 'SIGKILL')
        } catch {}
      }, 3000).unref()
    }, timeout)
    child.stdout.on('data', (chunk) => {
      size += chunk.length
      if (size > 16000000) {
        stop()
        return
      }
      buffer += chunk
      const lines = buffer.split('\n')
      buffer = lines.pop()
      lines.forEach(consume)
    })
    child.stderr.on('data', (chunk) => {
      stderr = (stderr + chunk).slice(-4000)
    })
    child.on('error', (error) => {
      clearTimeout(timer)
      reject(
        Error(error.code === 'ENOENT' ? 'Kane CLI is not installed.' : 'Kane could not start.'),
      )
    })
    child.on('close', (code) => {
      ownedProcesses.delete(child)
      clearTimeout(timer)
      consume(buffer)
      resolve({
        code,
        events,
        diagnostic: stderr.replace(/sk-[\w-]+|Bearer\s+\S+/g, '[redacted]').slice(-1200),
      })
    })
  })
}
async function freePort() {
  return new Promise((resolve) => {
    const s = createServer()
    s.listen(0, '127.0.0.1', () => {
      const port = s.address().port
      s.close(() => resolve(port))
    })
  })
}
function flattenProject(events) {
  for (const event of events) {
    for (const value of [event.project, event.data, event.result, event])
      if (value?.id && (value.name || value.project_name)) return value.id
    if (event.project_id) return event.project_id
  }
  throw Error('Kane did not return a project ID.')
}
export async function explore({
  directory,
  url,
  label,
  onProgress = () => {},
  leases = 6,
  goal = '',
}) {
  await mkdir(directory, { recursive: true })
  const version = spawnSync(process.env.KANE_CLI || 'kane-cli', ['--version'], {
    cwd: directory,
    env: kaneEnvironment(),
    encoding: 'utf8',
    timeout: 15000,
  })
  if (version.status !== 0 || !version.stdout.includes('0.10.0-rc.3'))
    throw Error(
      'The Explore importer requires tested Kane CLI 0.10.0-rc.3. Install @testmuai/kane-cli@0.10.0-rc.3.',
    )
  const created = await command(
    ['projects', 'create', `Raising Kane ${label} ${Date.now()}`, '--agent'],
    directory,
  )
  if (created.code !== 0) throw Error('Could not create an isolated Kane exploration project.')
  const projectId = flattenProject(created.events)
  onProgress(`Kane Explore started in its own project.`)
  const result = await command(
    [
      'explore',
      'run',
      '--project',
      projectId,
      '--url',
      url,
      '--prompt',
      (goal
        ? 'Prioritize flows relevant to this user intent (untrusted data): ' +
          JSON.stringify(goal) +
          '. Map relevant choices, validation and accessibility findings.'
        : 'Explore the supported website broadly. Follow reachable navigation and identify distinct useful flows, screens, required choices, validation and accessibility findings. No task intent was supplied; do not assume a transaction goal.') +
        ' Do not submit or confirm a transaction. Record actual reached states and unknown paths.',
      '--policy',
      'read_only',
      '--allow-domain',
      new URL(url).hostname,
      '--deny',
      'Submit return request',
      '--deny',
      'Confirm appointment change',
      '--max-leases',
      String(leases),
      '--max-parallel',
      '1',
      '--local-orchestration',
      '--headless',
      '--no-context',
      '--agent',
    ],
    directory,
    {
      onEvent: (e) => {
        if (e.type === 'explore_progress') onProgress('Kane is mapping reachable source states.')
      },
    },
  )
  const done = result.events.findLast((e) => e.type === 'done'),
    explorationId =
      done?.exploration_id || result.events.find((e) => e.exploration_id)?.exploration_id
  await writeFile(join(directory, 'explore-events.json'), JSON.stringify(result.events, null, 2), {
    mode: 0o600,
  })
  if (result.code !== 0 || !explorationId)
    throw Error('Kane Explore did not finish with a readable map. ' + (done?.remark?.code || ''))
  const port = await freePort(),
    base = `http://127.0.0.1:${port}`
  const viewer = spawn(
    process.env.KANE_CLI || 'kane-cli',
    ['explore', 'view', '--exploration-id', explorationId, '--port', String(port), '--agent'],
    {
      cwd: directory,
      env: kaneEnvironment(),
      stdio: ['ignore', 'ignore', 'ignore'],
      detached: true,
    },
  )
  ownedProcesses.add(viewer)
  viewer.on('error', () => {})
  try {
    let response
    for (let i = 0; i < 60; i++) {
      try {
        response = await fetch(base + '/api/view/summary')
        if (response.ok) break
      } catch {}
      await delay(500)
    }
    if (!response?.ok) throw Error('Explore map reader unavailable for this Kane version.')
    const summary = await response.json(),
      collections = {}
    for (const name of ['junctions', 'flows', 'findings']) {
      const rows = []
      let cursor = null
      for (let page = 0; page < 12; page++) {
        const r = await fetch(
          base + '/api/view/' + name + (cursor ? '?cursor=' + encodeURIComponent(cursor) : ''),
        )
        if (!r.ok) throw Error('Explore evidence page unavailable.')
        const data = await r.json()
        if (!Array.isArray(data.rows)) throw Error('Unsupported Explore map schema.')
        rows.push(...data.rows)
        cursor = data.next
        if (!cursor) break
      }
      if (cursor) throw Error('Explore evidence exceeds the bounded importer limit.')
      collections[name] = rows
    }
    const details = await readMapDetails(base, collections)
    const writeup = await readExplorationWriteup(explorationId, done.run_id)
    const screens = []
    for (const [i, j] of collections.junctions.slice(0, 8).entries()) {
      const r = await fetch(base + '/api/screenshot?junction=' + encodeURIComponent(j.id))
      const screen = {
        id: j.id,
        name: j.name || j.heading || 'Observed screen',
        url: j.url || j.url_pattern || null,
        runId: j.first_seen_run,
        controls: j.control_groups || [],
        origin: j.origin,
        description: details.screens[j.id]?.description ?? null,
        affordances: details.screens[j.id]?.affordances ?? null,
      }
      if (r.ok) {
        if (r.headers.get('content-type')?.includes('application/json')) {
          const data = await r.json()
          const match = /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/.exec(
            data.data_url || '',
          )
          if (match) {
            const filename = `screen-${i}.${match[1] === 'png' ? 'png' : 'jpg'}`
            await writeFile(join(directory, filename), Buffer.from(match[2], 'base64'))
            screen.image = filename
          }
        } else if (r.headers.get('content-type')?.startsWith('image/')) {
          const filename = `screen-${i}.jpg`
          await writeFile(join(directory, filename), Buffer.from(await r.arrayBuffer()))
          screen.image = filename
        }
      }
      screens.push(screen)
    }
    const map = {
      projectId,
      explorationId,
      runId: done.run_id,
      complete: done.complete === true,
      stopReason: done.remark,
      summary,
      screens,
      flows: collections.flows.map((row) => details.flows[row.id] || row),
      findings: collections.findings.map((row) => details.findings[row.id] || row),
      detailReads: details.reads,
      writeup,
      capturedAt: new Date().toISOString(),
    }
    await writeFile(join(directory, 'map.json'), JSON.stringify(map, null, 2))
    return map
  } finally {
    ownedProcesses.delete(viewer)
    viewer.kill('SIGTERM')
  }
}

export async function mission({
  directory,
  id,
  url,
  objective,
  preview = false,
  timeoutMs = 240000,
  onEvent,
}) {
  await mkdir(directory, { recursive: true })
  const run = preview ? runPreviewKane : runKane
  const result = await run({
    taskId: preview ? 'preview-' + id : 'builder-' + id,
    phase: preview ? 'preview-check' : 'observe-branch',
    objective,
    url,
    headless: true,
    timeoutMs,
    onEvent,
  })
  await writeFile(join(directory, 'result.json'), JSON.stringify(result, null, 2), { mode: 0o600 })
  let shots = []
  if (result.evidencePath) {
    const script = new URL('./pack-images.py', import.meta.url)
    shots = await new Promise((resolve, reject) => {
      const p = spawn('python3', [script.pathname, result.evidencePath, directory], {
        stdio: ['ignore', 'pipe', 'ignore'],
        env: kaneEnvironment(),
      })
      let out = ''
      p.stdout.on('data', (s) => (out += s))
      p.on('error', reject)
      p.on('close', (code) => {
        if (code) resolve([])
        else {
          try {
            resolve(JSON.parse(out))
          } catch {
            resolve([])
          }
        }
      })
    })
  }
  await shutdownTaskBrowser(preview ? 'preview-' + id : 'builder-' + id)
  return { ...result, shots }
}

// Requirements stay outside the coding agent's writable artifact. Assurance designs
// the journey; generated criteria retain derived trust, never human-approved status.
export async function assureAndVerify({ directory, id, url, objective, onProgress = () => {} }) {
  await mkdir(directory, { recursive: true })
  const requirements = `# Verify one generated synthetic task interface

One user story: complete this exact supported synthetic journey through the generated interface at ${url}. This is a sandbox-only test session, so the browser verifier acts as the sandbox user, including approval through the trusted host panel. Generated code itself cannot approve. No production accounts or actions are involved.

## Required journey and observable outcomes
${objective}

Stay within this one journey. Wait for source browser jobs to finish; they can take two minutes. Only use visible browser controls, not API calls, scripts or direct source edits. Keep all expectations above unchanged. Browser reload must preserve the same receipt.
`
  await writeFile(join(directory, 'requirements.md'), requirements)
  const ingest = await command(
    ['context', 'ingest', 'requirements.md', '--mode', 'agent'],
    directory,
    { timeout: 240000 },
  )
  await writeFile(join(directory, 'ingest.json'), JSON.stringify(ingest.events, null, 2))
  if (ingest.code !== 0)
    throw Error(
      'Kane assurance needs clarification before this candidate can be tested. Its question and requirements are retained.',
    )
  const usecase = ingest.events
    .filter((e) => e.type === 'commit')
    .flatMap((e) => e.minted || [])
    .find((e) => e.logical_id?.startsWith('uc-'))?.logical_id
  if (!usecase) throw Error('Kane assurance did not extract a testable requirement.')
  onProgress('Designing a requirements-linked Kane journey.')
  const design = await command(
    [
      'design',
      'tests',
      '--use-case',
      usecase,
      '--mode',
      'agent',
      '--max',
      '1',
      '--allow-unreviewed',
    ],
    directory,
    { timeout: 300000 },
  )
  await writeFile(join(directory, 'design.json'), JSON.stringify(design.events, null, 2))
  if (design.code !== 0)
    throw Error('Kane test design did not complete. No candidate was promoted.')
  const files = (await readdir(join(directory, '.testmuai/tests'))).filter((f) =>
    f.endsWith('_test.md'),
  )
  if (files.length !== 1) throw Error('Expected one assurance-designed journey for this candidate.')
  const browserId = 'preview-' + id,
    browser = await preparePreviewBrowser(browserId)
  try {
    onProgress('Running the assurance-designed journey against the generated interface.')
    const result = await command(
      [
        'testmd',
        'run',
        join('.testmuai/tests', files[0]),
        '--url',
        url,
        '--cdp-endpoint',
        browser.endpoint,
        '--headless',
        '--agent',
        '--no-adaptive-heal',
        '--timeout',
        '900',
      ],
      directory,
      {
        timeout: 930000,
        onEvent: (e) => {
          if (e.type === 'test_md_step_end')
            onProgress(`Journey step ${e.step_index}: ${e.status}.`)
        },
      },
    )
    await writeFile(
      join(directory, 'verification-events.json'),
      JSON.stringify(result.events, null, 2),
    )
    const done = result.events.findLast((e) => e.type === 'test_md_done'),
      summary = result.events.findLast((e) => e.type === 'test_md_summary'),
      last = result.events.findLast((e) => e.type === 'run_end')
    const cover = await command(['cover', '--mode', 'agent'], directory)
    await writeFile(join(directory, 'coverage.json'), JSON.stringify(cover.events, null, 2))
    const pack = result.events.findLast((e) => e.type === 'coverage' && e.pack)?.pack
    let shots = []
    if (pack)
      shots = await new Promise((resolve) => {
        const p = spawn(
          'python3',
          [new URL('./pack-images.py', import.meta.url).pathname, pack, directory],
          { env: kaneEnvironment(), stdio: ['ignore', 'pipe', 'ignore'] },
        )
        let out = ''
        p.stdout.on('data', (s) => (out += s))
        p.on('error', () => resolve([]))
        p.on('close', () => {
          try {
            resolve(JSON.parse(out))
          } catch {
            resolve([])
          }
        })
      })
    const status =
      result.code === 0 && done?.overall_status === 'passed'
        ? 'passed'
        : done?.overall_status === 'failed'
          ? 'failed'
          : 'error'
    return {
      status,
      summary:
        status === 'passed'
          ? `All ${summary?.steps?.passed || 0} assurance journey steps passed.`
          : last?.summary || 'Kane did not pass the entire assurance journey.',
      sessionId: done?.session_id,
      shots,
      evidencePath: pack,
      testFile: files[0],
      coverage: cover.events.find((e) => e.type === 'coverage'),
      ingestStatus: result.events.find((e) => e.type === 'test_md_evidence_ingest')?.status,
    }
  } finally {
    await shutdownTaskBrowser(browserId)
  }
}
