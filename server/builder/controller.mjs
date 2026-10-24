import { randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs'
import { readFile, mkdir } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { explore, mission, assureAndVerify } from './kane.mjs'
import { generate, compileArtifact, hash, MODEL } from './model.mjs'
import { sourceOutcomeMatches } from './outcome.mjs'

const busyStates = new Set([
  'connecting',
  'exploring_source',
  'investigating',
  'building',
  'exploring_preview',
  'verifying',
  'repairing',
])
const safeId = (s) => typeof s === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(s)
const clean = (value) =>
  String(value || '')
    .replace(/sk-[\w-]+|Bearer\s+\S+/g, '[redacted]')
    .slice(0, 2000)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const observedKeys = [
  'source_terms',
  'source_choices',
  'source_transition',
  'source_requirements',
  'source_identity',
  'current_url',
]
function send(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(value))
}
async function body(req) {
  let text = ''
  for await (const chunk of req) {
    text += chunk
    if (text.length > 20000) throw Error('Request too large.')
  }
  return JSON.parse(text || '{}')
}
export function sourceKind(url, sourceUrls) {
  const u = new URL(url)
  if (u.username || u.password || u.search || u.hash)
    throw Error('Use the supported website entry URL without account parameters.')
  for (const [kind, origin] of Object.entries(sourceUrls))
    if (
      u.origin === origin &&
      ['/', '/merchant', '/appointments'].includes(u.pathname) &&
      ((kind === 'return' && u.pathname !== '/appointments') ||
        (kind === 'appointment' && u.pathname !== '/merchant'))
    )
      return kind
  throw Error(
    'This release supports the two local demonstration websites. External websites are not enabled for automated exploration or transactions.',
  )
}
export function buildContract(kind, goal) {
  return {
    version: 1,
    kind,
    goal: goal || null,
    mode: goal ? 'focused' : 'overview',
    executionMode: 'sandbox',
    scope: 'Synthetic records only; no production access.',
    supportedTask:
      kind === 'return'
        ? 'Return the red shoes, keep the jacket, refund original payment.'
        : 'Move the washer repair to Saturday morning, keep Maya, no added fee.',
    requirements:
      kind === 'return'
        ? [
            'Keep the jacket',
            'Return only red shoes',
            'Preserve original-payment preference',
            'Show method fee and refund destination',
            'Changing a method must expose any source conflict',
            'Explicit approval of exact current terms before submission',
            'Separately verified saved confirmation',
          ]
        : [
            'Keep original booking until confirmation',
            'Saturday morning in Pacific time',
            'Keep Maya Chen',
            'No added fee',
            'Show excluded alternatives and reasons',
            'Explicit approval of exact terms',
            'Verify one active booking after confirmation',
          ],
    actions:
      kind === 'return'
        ? ['start', 'choice:reason', 'choice:method', 'check', 'restore']
        : ['start', 'choice:slotId', 'check'],
    unknownPolicy: 'Unknowns stay visible and block dependent operations.',
  }
}
export function validateBridgeAction(kind, action, payload = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload))
    throw Error('Invalid action payload.')
  const allowed =
    action === 'choice'
      ? kind === 'return'
        ? ['reason', 'method']
        : ['slotId']
      : action === 'check'
        ? ['repair']
        : []
  if (
    !['start', 'choice', 'check', 'approve', 'submit'].includes(action) ||
    Object.keys(payload).some((key) => !allowed.includes(key))
  )
    throw Error('This action cannot change the frozen task contract.')
  if ('repair' in payload && typeof payload.repair !== 'boolean')
    throw Error('Repair must be explicitly selected.')
  return payload
}

export function createBuilder({ baseUrl, sourceUrls, controller, merchant, appointments }) {
  const root = resolve(process.env.RAISING_KANE_DATA_DIR || 'data', 'builder'),
    store = join(root, 'builds.json')
  mkdirSync(root, { recursive: true })
  const builds = new Map(),
    sessions = new Map(),
    locks = new Set()
  try {
    const saved = JSON.parse(readFileSync(store, 'utf8'))
    for (const b of saved.builds || []) {
      if (busyStates.has(b.status)) {
        b.status = 'blocked'
        b.error =
          'Build interrupted. Start a new build; existing evidence and candidates are retained.'
      }
      builds.set(b.id, b)
    }
    for (const s of saved.sessions || []) sessions.set(s.id, s)
  } catch (e) {
    if (e.code !== 'ENOENT') throw e
  }
  function save() {
    writeFileSync(
      store + '.tmp',
      JSON.stringify({ builds: [...builds.values()], sessions: [...sessions.values()] }, null, 2),
      { mode: 0o600 },
    )
    renameSync(store + '.tmp', store)
  }
  function event(b, kind, summary, extra = {}) {
    b.events.push({
      sequence: b.events.length + 1,
      at: new Date().toISOString(),
      phase: b.status,
      kind,
      summary: clean(summary),
      ...extra,
    })
    b.updatedAt = new Date().toISOString()
    save()
  }
  function publicBuild(b) {
    const { ownerId, ...copy } = b
    return { ...copy, evidence: b.evidence.map(({ imagePath, ...e }) => e) }
  }
  const sourcePath = (b) => (b.kind === 'return' ? '/merchant' : '/appointments')
  function sourceUrl(b, id) {
    return sourceUrls[b.kind] + sourcePath(b) + '?taskId=' + id
  }
  function summaryMap(map) {
    return {
      explorationId: map.explorationId,
      complete: map.complete,
      stopReason: map.stopReason,
      screens: map.screens.map(({ image, ...s }) => s),
      flows: map.flows,
      findings: map.findings,
      writeup: map.writeup,
      detailReads: map.detailReads,
    }
  }
  async function observe(b, branch) {
    const cached = b.evidence.find((e) => e.branch === branch)
    if (cached) return cached
    if (!['primary', 'alternative'].includes(branch)) throw Error('Unsupported source branch.')
    b.status = 'investigating'
    event(b, 'agent.tool', `The builder asked Kane to inspect the ${branch} source branch.`)
    const id = randomUUID(),
      directory = join(root, b.id, 'observations', id),
      url = sourceUrl(b, id)
    const instruction =
      b.kind === 'return'
        ? `Select only Red running shoes Size 8 and keep Black jacket unselected. Choose Size or fit issue as the reason. ${branch === 'primary' ? 'Choose Print a shipping label and then Original payment method.' : 'First choose Print a shipping label and Original payment method. Then change to Printer-free QR drop-off and DO NOT change the refund destination afterward.'} Wait for saves. Do not submit. Store exact current method, fee, refund amount and destination as source_terms. Store available reasons, methods and destinations as source_choices. Store the observed effect of the method selection as source_transition. Store item and order identity as source_identity. Store visible requirements as source_requirements. Store current page URL as current_url. Verify the review shows only the shoes and the jacket is kept.`
        : `Inspect the original booking, then ${branch === 'primary' ? 'select the available Saturday morning slot that keeps Maya Chen without adding a fee' : 'select the earliest Saturday slot with a different technician'}. Wait for Draft saved; do not confirm. Store selected time, technician, fee and timezone as source_terms. Store every available slot with time, technician, fee and availability as source_choices. Store what changed compared with the original booking as source_transition. Store service and booking ID as source_identity. Store visible requirements as source_requirements. Store current page URL as current_url. Verify a draft is visible and the original booking is still unchanged.`
    const result = await mission({
      directory,
      id,
      url,
      objective: `Use only this synthetic source. ${instruction}`,
      onEvent: (e) => {
        if (e.type === 'step' && e.status === 'done') event(b, 'kane.step', e.remark)
      },
    })
    if (result.status !== 'passed')
      throw Error('Source observation did not pass: ' + result.summary)
    const facts = Object.fromEntries(
      observedKeys
        .filter((k) => result.finalState?.[k] != null)
        .map((k) => [k, result.finalState[k]]),
    )
    if (!facts.source_terms || !result.shots.length)
      throw Error('Source run did not produce review facts and step-linked screenshots.')
    const last = result.shots.at(-1),
      e = {
        id,
        branch,
        status: result.status,
        facts,
        shots: result.shots,
        at: new Date().toISOString(),
        imagePath: join(directory, last.image),
        imageUrl: `/api/builder/${b.id}/image/observations/${id}/${last.image}`,
        runId: result.runId,
        sessionId: result.sessionId,
      }
    b.evidence.push(e)
    event(
      b,
      'journey.observed',
      `${branch === 'primary' ? 'Original choice' : 'Changed choice'} observed and captured.`,
      { evidenceId: id },
    )
    return e
  }
  async function executeBuild(b) {
    try {
      const directory = join(root, b.id)
      await mkdir(directory, { recursive: true })
      b.status = 'exploring_source'
      event(
        b,
        'explore.started',
        b.goal
          ? 'Exploring paths relevant to your task.'
          : 'Exploring the website broadly; intent is optional.',
      )
      const map = await explore({
        directory: join(directory, 'source-map'),
        url: sourceUrl(b, b.sourceTaskId),
        label: `source ${b.id.slice(0, 8)}`,
        leases: b.goal ? 6 : 12,
        goal: b.goal,
        onProgress: (s) => event(b, 'explore.progress', s),
      })
      b.sourceMap = map
      event(
        b,
        'explore.finished',
        `${map.screens.length} screens and ${map.flows.length} flow records observed. ${map.complete ? 'Exploration finished.' : 'Exploration was bounded; unseen paths remain unverified.'}`,
      )
      if (!map.screens.length)
        throw Error('No source screens were observed. No supported interface can be generated.')
      for (const screen of map.screens)
        b.evidence.push({
          id: screen.id,
          branch: 'explore',
          facts: {
            name: screen.name,
            controls: screen.controls,
            affordances: screen.affordances,
            description: screen.description,
          },
          shots: [],
          imagePath: screen.image ? join(directory, 'source-map', screen.image) : null,
          imageUrl: screen.image ? `/api/builder/${b.id}/image/source-map/${screen.image}` : null,
          at: map.capturedAt,
        })
      for (const record of [...map.flows, ...map.findings])
        b.evidence.push({
          id: record.id,
          branch: 'explore-record',
          facts: record,
          shots: [],
          at: map.capturedAt,
        })
      b.evidence.push({
        id: 'user-contract',
        branch: 'contract',
        facts: b.contract,
        shots: [],
        at: b.createdAt,
      })
      let previous = null,
        failure = null
      for (let revision = 1; revision <= 3; revision++) {
        b.status = revision === 1 ? 'building' : 'repairing'
        event(
          b,
          revision === 1 ? 'agent.started' : 'repair.started',
          revision === 1
            ? 'Building your interface from Kane’s observations.'
            : 'Rebuilding the interface against the same requirements.',
        )
        const candidateDir = join(directory, 'candidates', String(revision)),
          candidate = {
            revision,
            status: 'building',
            contractHash: b.contractHash,
            createdAt: new Date().toISOString(),
          }
        b.candidates.push(candidate)
        save()
        try {
          const artifact = await generate({
            directory: candidateDir,
            contract: b.contract,
            map: summaryMap(map),
            evidence: b.evidence,
            inspect: (branch) => observe(b, branch),
            previous,
            failure,
            onEvent: (entry) =>
              event(b, entry.type, `${entry.model} returned a builder response.`, {
                usage: entry.usage,
              }),
          })
          // Both supported branches must be observed, even if the model omitted a request.
          const missing = ['primary', 'alternative'].filter(
            (branch) => !b.evidence.some((e) => e.branch === branch),
          )
          if (missing.length) {
            for (const branch of missing) await observe(b, branch)
            previous = artifact
            failure = {
              kind: 'missing-evidence',
              message:
                'Required source branches were missing. Use the newly captured facts and images to revise the interface.',
            }
            candidate.status = 'rejected'
            candidate.failure = failure
            event(b, 'check.failed', failure.message)
            continue
          }
          const allowedIds = new Set(b.evidence.map((e) => e.id))
          if (
            artifact.decisions.some(
              (d) => !d.evidenceIds.length || d.evidenceIds.some((id) => !allowedIds.has(id)),
            )
          )
            throw Error('Interface decisions must reference actual captured evidence.')
          const parentArtifact = previous
          previous = artifact
          const compiled = await compileArtifact(artifact, candidateDir)
          if (parentArtifact) {
            candidate.change = {
              fromHash: hash(parentArtifact.componentCode),
              toHash: hash(artifact.componentCode),
              codeChanged: parentArtifact.componentCode !== artifact.componentCode,
              cssChanged: parentArtifact.css !== artifact.css,
            }
          }
          Object.assign(candidate, compiled, {
            status: 'checking',
            title: artifact.title,
            decisions: artifact.decisions,
            previewUrl: `${baseUrl}/builder-preview/${b.id}/${revision}`,
            codeHash: hash(artifact.componentCode),
            cssHash: hash(artifact.css),
          })
          previous = artifact
          event(b, 'artifact.built', `Revision ${revision} compiled. Checking it before release.`, {
            revision,
            hash: candidate.hash,
          })
          // Explore a passive preview. It cannot start any source job or create approval.
          b.status = 'exploring_preview'
          save()
          candidate.previewMap = await explore({
            directory: join(candidateDir, 'explore'),
            url: candidate.previewUrl + '?inspect=1',
            label: `preview ${b.id.slice(0, 8)} r${revision}`,
            leases: 3,
            onProgress: (s) => event(b, 'explore.progress', s),
          })
          b.status = 'verifying'
          event(
            b,
            'check.started',
            'Kane is using the generated interface and checking source-backed outcomes.',
          )
          const test = await createSession(
            b,
            candidate,
            'test',
            'verifier-' + b.id + '-' + revision,
          )
          const checkUrl = candidate.previewUrl + '?session=' + test.id
          const objective =
            b.kind === 'return'
              ? 'Click Start this task if visible. Wait for the source order to load. In the generated interface choose Size or fit issue under Return reason. Wait until source work finishes. Verify the review shows only red shoes, jacket kept, original payment and $80 refund for the printed label. Change Return method to Printer-free QR drop-off. Wait for the source check. Verify a conflict is visible, $5 deduction and $75 refund are shown, and requested Original payment differs from observed Store credit. Click Restore my choices and wait until the source review is verified. Verify Original payment and $75 refund are displayed. Use the trusted approval panel: click Approve exact terms, then Submit approved request. Wait for the saved confirmation. Verify Return requested; refund pending, a request identifier, $75 refund, original payment and jacket kept. Reload and verify the same saved receipt remains.'
              : 'Click Start this task if visible. Wait for the source booking to load. Choose the available Saturday October 31 11:00 slot with Maya Chen and no added fee in the generated interface. Wait for the source review to be verified. Verify Maya, Saturday morning and $0 added fee. Use the trusted approval panel: click Approve exact terms, then Submit approved request. Wait for the saved confirmation. Verify Appointment change confirmed, the new time, Maya and no added fee. Reload and verify the same saved receipt remains.'
          const result = await assureAndVerify({
            directory: join(candidateDir, 'verification'),
            id: b.id + '-' + revision,
            url: checkUrl,
            objective,
            onProgress: (message) => event(b, 'check.step', message),
          })
          const task = test.taskId
            ? (await controller.invoke(test.ownerId, '/api/tasks/' + test.taskId)).task
            : null
          const source = (b.kind === 'return' ? merchant : appointments).getOperation(
            task?.operationId || '',
          )
          candidate.verification = {
            status: result.status,
            summary: result.summary,
            sessionId: result.sessionId,
            shots: result.shots,
            testFile: result.testFile,
            coverage: result.coverage,
            evidenceIngestStatus: result.ingestStatus,
            artifactHash: candidate.hash,
            contractHash: b.contractHash,
            taskId: test.taskId,
            sourceMatch: sourceOutcomeMatches(b.kind, task, source),
            at: new Date().toISOString(),
          }
          if (result.status === 'passed' && candidate.verification.sourceMatch) {
            candidate.status = 'verified'
            b.promotedRevision = revision
            b.status = 'ready'
            event(
              b,
              'artifact.promoted',
              'Your interface passed the browser journey and its saved source outcome was confirmed.',
              { revision },
            )
            return
          }
          if (result.shots?.length) {
            const shot = result.shots.at(-1)
            b.evidence.push({
              id: 'preview-' + revision,
              branch: 'failed-preview',
              facts: { failure: result.summary },
              shots: result.shots,
              at: new Date().toISOString(),
              imagePath: join(candidateDir, 'verification', shot.image),
              imageUrl: `/api/builder/${b.id}/image/candidates/${revision}/verification/${shot.image}`,
            })
          }
          failure = {
            kind: 'interface-check',
            summary: result.summary,
            sourceMatch: candidate.verification.sourceMatch,
            taskStatus: task?.status,
            taskError: task?.error,
            checks: task?.checks,
          }
          candidate.status = 'failed'
          candidate.failure = failure
          event(b, 'check.failed', `Revision ${revision} did not pass. Its evidence is retained.`, {
            revision,
          })
          if (['timeout', 'unavailable', 'error'].includes(result.status) && !task?.receipt)
            throw Error(
              'Browser verification was interrupted or unavailable. Retained the candidate; no speculative code repair was attempted.',
            )
        } catch (error) {
          if (candidate.status === 'failed') throw error
          try {
            previous = JSON.parse(await readFile(join(candidateDir, 'artifact.json'), 'utf8'))
          } catch {}
          candidate.status = 'failed'
          candidate.failure = { kind: 'build', message: clean(error.message) }
          failure = candidate.failure
          event(b, 'check.failed', error.message, { revision })
          if (/^(OpenAI|Kane|Source)|exploration did not|observation did not/i.test(error.message))
            throw error
        }
      }
      throw Error(
        'The interface did not pass within the two-repair limit. All candidates and evidence were retained.',
      )
    } catch (error) {
      b.status = 'blocked'
      b.error = clean(error.message)
      event(b, 'build.blocked', b.error)
    }
  }
  async function createSession(b, candidate, mode, ownerId) {
    const s = {
      id: randomUUID(),
      buildId: b.id,
      revision: candidate.revision,
      mode,
      ownerId,
      taskId: null,
      createdAt: new Date().toISOString(),
    }
    sessions.set(s.id, s)
    save()
    return s
  }
  async function sessionTask(s, b) {
    if (s.taskId) return (await controller.invoke(s.ownerId, '/api/tasks/' + s.taskId)).task
    return {
      kind: b.kind,
      status: 'not_started',
      discovery: {
        screens: b.sourceMap.screens,
        flows: [
          ...b.sourceMap.flows,
          ...b.evidence
            .filter((e) => ['primary', 'alternative'].includes(e.branch))
            .map((e) => ({
              id: e.id,
              name:
                e.branch === 'primary'
                  ? 'Review the original choice'
                  : 'Change a choice and inspect its consequences',
              status: 'observed',
              description: e.facts.source_transition,
            })),
        ],
        complete: b.sourceMap.complete,
      },
      intent: {
        refundDestination: 'original_payment',
        noPrinter: false,
        keepTechnician: true,
        maxFeeCents: 0,
      },
      request: b.contract.supportedTask,
      progress: null,
      checks: [],
      merchant: null,
    }
  }
  async function act(s, b, action, payload = {}) {
    validateBridgeAction(b.kind, action, payload)
    if (locks.has(s.id)) throw Error('A request is already being handled.')
    locks.add(s.id)
    try {
      if (action === 'start') {
        if (!s.taskId) {
          const result = await controller.invoke(s.ownerId, '/api/tasks', {
            kind: b.kind,
            ...(b.kind === 'return'
              ? {
                  request:
                    'Return the red shoes, keep the jacket, refund my original payment method.',
                }
              : {}),
          })
          s.taskId = result.task.id
          save()
        }
      } else {
        if (!s.taskId) throw Error('Start this task first.')
        if (!['choice', 'check', 'approve', 'submit'].includes(action))
          throw Error('Unsupported action.')
        await controller.invoke(s.ownerId, `/api/tasks/${s.taskId}/${action}`, payload)
      }
      return sessionTask(s, b)
    } finally {
      locks.delete(s.id)
    }
  }
  async function handle(req, res, url) {
    if (!url.pathname.startsWith('/api/builder')) return false
    try {
      const parts = url.pathname.split('/').filter(Boolean)
      if (parts.length === 2) {
        if (req.method === 'GET') {
          send(res, 200, {
            builds: [...builds.values()]
              .filter((b) => b.ownerId === req.clientId)
              .reverse()
              .map(publicBuild),
            sources: [
              {
                kind: 'return',
                name: 'Northstar Outfitters',
                url: sourceUrls.return + '/merchant',
              },
              {
                kind: 'appointment',
                name: 'Linden Home',
                url: sourceUrls.appointment + '/appointments',
              },
            ],
            model: MODEL,
            configured: !!process.env.OPENAI_API_KEY,
          })
          return true
        }
        if (req.method !== 'POST') throw Error('Method not allowed.')
        if ([...builds.values()].some((b) => busyStates.has(b.status)))
          throw Error(
            'Another build is running. Wait for its evidence before starting the next one.',
          )
        if (!process.env.OPENAI_API_KEY)
          throw Error('Set OPENAI_API_KEY on the server to enable generation.')
        const input = await body(req),
          kind = sourceKind(input.url, sourceUrls),
          goal = clean(input.goal).trim()
        if (/\{\{|\}\}/.test(goal))
          throw Error(
            'Describe your task in plain text; Kane variable placeholders are not supported.',
          )
        if ([...builds.values()].some((b) => busyStates.has(b.status)))
          throw Error('Another build is running. Wait for it to finish.')
        const contract = buildContract(kind, goal),
          b = {
            id: randomUUID(),
            ownerId: req.clientId,
            kind,
            url: input.url,
            goal,
            contract,
            contractHash: hash(contract),
            sourceTaskId: randomUUID(),
            status: 'connecting',
            events: [],
            evidence: [],
            candidates: [],
            createdAt: new Date().toISOString(),
          }
        builds.set(b.id, b)
        save()
        void executeBuild(b)
        send(res, 202, { build: publicBuild(b) })
        return true
      }
      const b = builds.get(parts[2])
      if (!b) throw Error('Build not found.')
      // Source evidence is synthetic, but build control and account history stay owner-bound.
      if (parts[3] === 'session') {
        if (parts.length === 4 && req.method === 'POST') {
          if (b.status !== 'ready' || b.ownerId !== req.clientId)
            throw Error('Only the owner can start a verified interface.')
          const s = await createSession(
            b,
            b.candidates.find((c) => c.revision === b.promotedRevision),
            'use',
            req.clientId,
          )
          send(res, 201, { sessionId: s.id })
          return true
        }
        const s = sessions.get(parts[4])
        if (!s || s.buildId !== b.id) throw Error('Session not found.')
        // The unguessable test session is a sandbox-only capability, never a live grant.
        if (s.mode === 'use' && s.ownerId !== req.clientId)
          throw Error('Open this task in its original browser.')
        if (req.method === 'GET') {
          send(res, 200, { task: await sessionTask(s, b), mode: s.mode })
          return true
        }
        const input = await body(req)
        send(res, 200, { task: await act(s, b, input.action, input.payload) })
        return true
      }
      if (b.ownerId !== req.clientId) throw Error('Open this build in its original browser.')
      if (parts[3] === 'verification' && req.method === 'GET') {
        const candidate = b.candidates.find((c) => c.revision === Number(parts[4]))
        const filename = candidate?.verification?.testFile
        if (!filename || !/^[\w-]+_test\.md$/.test(filename))
          throw Error('This candidate does not have a completed verification record yet.')
        const directory = join(root, b.id, 'candidates', String(candidate.revision), 'verification')
        send(res, 200, {
          requirements: await readFile(join(directory, 'requirements.md'), 'utf8'),
          journey: await readFile(join(directory, '.testmuai/tests', filename), 'utf8'),
          status: candidate.verification.status,
          capturedAt: candidate.verification.at,
        })
        return true
      }
      if (parts[3] === 'image' && req.method === 'GET') {
        const relative = parts.slice(4)
        if (
          !relative.every(safeId) &&
          !relative.every((s, i) =>
            i === relative.length - 1 ? /^[\w-]+\.(?:jpg|png)$/.test(s) : safeId(s),
          )
        )
          throw Error('Invalid evidence path.')
        const path = resolve(root, b.id, ...relative)
        if (!path.startsWith(join(root, b.id) + '/') || !/\.(?:jpg|png)$/.test(path))
          throw Error('Invalid image.')
        res.writeHead(200, {
          'Content-Type': path.endsWith('.png') ? 'image/png' : 'image/jpeg',
          'Cache-Control': 'private,max-age=3600',
        })
        res.end(await readFile(path))
        return true
      }
      if (req.method === 'GET') {
        send(res, 200, { build: publicBuild(b) })
        return true
      }
      throw Error('Unknown build action.')
    } catch (e) {
      send(res, 400, { error: clean(e.message) })
      return true
    }
  }
  return { handle, builds, sessions, root, publicBuild, sessionTask }
}
