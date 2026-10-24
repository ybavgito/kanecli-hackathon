import { randomUUID, randomBytes, createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createKaneExplore } from './kane-explore.mjs'
import { generateInterface } from './builder-generator.mjs'
import { buildGeneratedArtifact, readGeneratedAsset, readGeneratedSource } from './builder-artifacts.mjs'
import { captureBuilderScreenshot, publicBuilderEvidence } from './builder-evidence.mjs'
import { verifyGeneratedInterface } from './builder-verifier.mjs'

const activeStatuses = new Set(['preparing', 'exploring', 'inspecting', 'generating', 'building', 'verifying', 'repairing'])
const now = () => new Date().toISOString()
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const clone = value => structuredClone(value)
const cleanError = error => String(error?.message || 'The builder could not finish.').slice(0, 800)
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const safeJson = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028|\u2029/g, '')

export function builderInput(input) {
  let url
  try { url = new URL(input?.url) } catch { throw new Error('Enter a complete website URL.') }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Use an HTTP or HTTPS URL without embedded credentials.')
  }
  if (/\{\{|\}\}/.test(input?.goal || '')) throw new Error('A task cannot contain Kane variable placeholders.')
  return { url: url.href, goal: typeof input?.goal === 'string' ? input.goal.trim().slice(0, 2000) : '' }
}

export function createBuilderController({ source, baseUrl, dataDir = path.resolve('data/builder'),
  generator = generateInterface, artifactBuilder = buildGeneratedArtifact,
  verifier = verifyGeneratedInterface, screenshot = captureBuilderScreenshot } = {}) {
  const jobs = new Map(), running = new Set(), capabilities = new Map(), sessions = new Map()
  const store = path.join(dataDir, 'builds.json')
  mkdirSync(dataDir, { recursive: true, mode: 0o700 })
  if (existsSync(store)) for (const job of JSON.parse(readFileSync(store, 'utf8'))) {
    if (activeStatuses.has(job.status)) {
      job.status = 'interrupted'
      job.error = 'The server restarted during this build. Its saved revisions remain available; retry explicitly.'
    }
    jobs.set(job.id, job)
  }
  const projectId = (() => {
    try { return JSON.parse(readFileSync('.testmuai/assurance.json', 'utf8')).projectId } catch { return undefined }
  })()
  const explore = createKaneExplore({ projectId, storeDir: path.join(dataDir, 'explore'), onUpdate(value) {
    const job = jobs.get(value.connectionId)
    if (job) { job.exploration = value; save(job) }
  } })
  function save(job) {
    job.updatedAt = now()
    writeFileSync(store + '.tmp', JSON.stringify([...jobs.values()], null, 2), { mode: 0o600 })
    renameSync(store + '.tmp', store)
  }
  function event(job, stage, message, status = 'info') {
    job.stage = stage
    job.events.push({ id: randomUUID(), at: now(), stage, message, status, revision: job.revision || null })
    job.events = job.events.slice(-100)
    save(job)
  }
  function transition(job, status, message) {
    job.status = status
    event(job, status, message)
  }
  function publicBuild(job) {
    const { ownerId, rawArtifacts, screenshots, sourceSessionId, ...result } = clone(job)
    result.configuration = { missing: keyConfigured() ? [] : ['OPENAI_API_KEY'],
      message: keyConfigured() ? 'Builder configured.' : 'Configure OPENAI_API_KEY in the server’s ignored .env file, then retry.' }
    for (const revision of result.revisions || []) {
      delete revision.rootDir; delete revision.distDir; delete revision.entryPath
    }
    if (result.artifact) { delete result.artifact.rootDir; delete result.artifact.distDir; delete result.artifact.entryPath }
    for (const report of result.reports || []) {
      if (report.browser) delete report.browser.evidencePath
    }
    if (result.verification?.browser) delete result.verification.browser.evidencePath
    return result
  }
  function keyConfigured() {
    if (!process.env.OPENAI_API_KEY) try { process.loadEnvFile() } catch {}
    return Boolean(process.env.OPENAI_API_KEY)
  }
  async function sessionFor(job) {
    if (sessions.has(job.id)) return sessions.get(job.id)
    let session
    if (job.sourceSessionId) session = await source.get(job.sourceSessionId)
    else {
      session = await source.create({ buildId: job.id, url: job.url, goal: job.goal, mode: 'test' })
      job.sourceSessionId = session.id
      job.contract = session.contract
      job.contractDigest = hash(session.contract)
      job.sourceModel = session.sourceModel
      job.sourceUrl = session.sourceUrl
      job.allowedActions = session.allowedActions
      save(job)
    }
    if (!session) throw new Error('The isolated source session is unavailable. Start a new build.')
    sessions.set(job.id, session)
    return session
  }
  async function observe(job, session, question) {
    const result = await session.inspect({ question, evidenceIds: job.evidence.map(item => item.id) })
    const evidence = result.evidence || result.run || result
    const shot = await screenshot({ evidence, directory: path.join(dataDir, job.id, 'screenshots') })
    job.screenshots.push({ ...shot, dataUrl: undefined })
    const item = publicBuilderEvidence(shot)
    item.thumbnailUrl = `/api/builds/${job.id}/screenshots/${shot.filename}`
    job.evidence.push(item)
    event(job, 'inspecting', shot.description)
    return { observation: result.observation || result.state || await session.state(),
      sourceModel: result.sourceModel, screenshots: [{ ...shot, provenance: item.provenance }] }
  }
  async function imagesFor(job) {
    return Promise.all(job.screenshots.slice(-4).map(async shot => ({
      ...shot, provenance: publicBuilderEvidence(shot).provenance,
      dataUrl: `data:${shot.mime};base64,${(await readFile(path.join(dataDir, job.id, 'screenshots', shot.filename))).toString('base64')}`,
    })))
  }
  async function mapSource(job, session) {
    transition(job, 'exploring', 'Kane is mapping the isolated source website with read-only Explore.')
    let exploration = explore.start({ connectionId: job.id, url: session.sourceUrl,
      goal: job.goal || 'Observe this synthetic task and the available choices without submitting it.', maxLeases: 2, timeoutMs: 180000 })
    job.exploration = exploration
    save(job)
    while (['starting', 'running', 'stopping'].includes(exploration.status)) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      exploration = explore.get(exploration.id)
    }
    job.exploration = exploration
    if (exploration.cleanupUnconfirmed) {
      throw new Error('Explore stopped without confirming browser cleanup. Its observations were saved; stop that exploration before retrying.')
    }
    if (!['completed', 'budget'].includes(exploration.status) || !exploration.screens?.length || !exploration.evidence?.committedDeltaCount) {
      throw new Error(`Kane Explore did not establish an observed source map (${exploration.status}). This build cannot advance from discovery.`)
    }
    event(job, 'exploring', `${exploration.screens?.length || 0} source screens observed. ${exploration.error || 'The map is partial and does not prove task completion.'}`,
      exploration.screens?.length ? 'success' : 'warning')
  }
  async function verify(job, session, artifact) {
    transition(job, 'verifying', `Kane is checking generated revision ${artifact.revision} against a fresh synthetic record.`)
    const testSource = await source.create({ buildId: `${job.id}-verify-${artifact.revision}-${randomUUID().slice(0, 8)}`,
      url: job.url, goal: job.goal, mode: 'test' })
    let token
    try {
      if (hash(testSource.contract) !== job.contractDigest) throw new Error('The independent contract changed between build and test. Start a new build.')
      token = randomBytes(32).toString('hex')
      const capability = { token, jobId: job.id, revision: artifact.revision, session: testSource, expires: Date.now() + 900000 }
      capabilities.set(token, capability)
      const url = `${baseUrl}/api/builds/${job.id}/verification/${artifact.revision}?token=${token}`
      const report = await verifier({ buildId: job.id, revision: artifact.revision, artifactDigest: artifact.digest,
        contractDigest: job.contractDigest, contract: job.contract, url, source: testSource,
        onEvent(update) { if (update.type === 'step' && update.status === 'done') event(job, 'verifying', update.remark || 'Kane completed a preview step.') } })
      job.reports.push(report)
      job.verification = report
      artifact.status = report.status === 'passed' ? 'ready' : 'failed'
      artifact.summary = report.summary
      event(job, 'verifying', report.summary, report.status === 'passed' ? 'success' : 'error')
      return report
    } finally {
      if (token) capabilities.delete(token)
      await testSource.close?.()
    }
  }
  async function run(job) {
    if (running.has(job.id)) throw new Error('This build is already running.')
    running.add(job.id)
    try {
      job.error = null
      if (!keyConfigured()) {
        transition(job, 'needs_configuration', 'Configure the OpenAI API key locally, then retry. No interface has been generated.')
        return
      }
      transition(job, 'preparing', 'Creating a separate synthetic source record for this build.')
      const session = await sessionFor(job)
      if (!job.screenshots.length) {
        await mapSource(job, session)
        transition(job, 'inspecting', 'Kane is reading the selected workflow and capturing the actual page.')
        const observed = await observe(job, session, 'Read the initial source record and available choices without submitting a transaction.')
        job.sourceModel = { ...(observed.sourceModel || session.sourceModel), observed: observed.observation, exploration: job.exploration }
      }
      let previousArtifact = job.rawArtifacts.at(-1), feedback = job.reports.at(-1)
      for (let attempt = 0; attempt < 3; attempt++) {
        transition(job, attempt ? 'repairing' : 'generating', attempt
          ? 'The agent is changing the generated code using Kane’s failed expectations. The contract stays unchanged.'
          : 'The agent is generating a simpler React interface from Kane’s observations and screenshots.')
        const generated = await generator({ contract: job.contract, sourceModel: job.sourceModel, initialState: await session.state(),
          screenshots: await imagesFor(job), allowedActions: job.allowedActions,
          previousArtifact, repairFeedback: feedback }, {
          inspect: request => observe(job, session, request.question),
          onEvent(update) { event(job, job.status, update.message || update.type || 'Builder progress.') },
        })
        transition(job, 'building', 'Compiling the generated interface in its isolated artifact directory.')
        const revision = (job.revision || 0) + 1
        let artifact
        try {
          artifact = await artifactBuilder({ artifact: generated.artifact, contract: job.contract,
            allowedActions: job.allowedActions, initialState: await session.state(),
            buildId: job.id, revision, dataDir: path.join(dataDir, 'artifacts') })
        } catch (error) {
          feedback = { status: 'failed', repairable: true, summary: cleanError(error), stage: 'compile', revision }
          job.reports.push(feedback)
          job.revision = revision
          job.revisions.push({ revision, status: 'failed', summary: feedback.summary, stage: 'compile' })
          previousArtifact = generated.artifact
          job.rawArtifacts.push(previousArtifact)
          event(job, 'building', feedback.summary, 'error')
          if (attempt === 2) throw new Error('The generated interface did not compile within two repairs. See the retained failures.')
          continue
        }
        artifact.revision = revision
        artifact.previewUrl = `/api/builds/${job.id}/artifacts/${revision}/index.html`
        artifact.sourceUrl = `/api/builds/${job.id}/artifacts/${revision}/source`
        artifact.status = 'unverified'
        artifact.generation = generated.metadata
        job.revision = revision
        job.artifact = artifact
        job.previewUrl = artifact.previewUrl
        job.title = generated.artifact.title
        job.revisions.push(artifact)
        job.rawArtifacts.push(generated.artifact)
        save(job)
        const report = await verify(job, session, artifact)
        if (report.status === 'passed') {
          job.promotedRevision = revision
          transition(job, 'ready', `Revision ${revision} passed the generated interface and source outcome checks. It is ready for a separate sandbox task.`)
          return
        }
        if (!report.repairable || attempt === 2) throw new Error(report.summary)
        previousArtifact = generated.artifact
        feedback = report
      }
    } catch (error) {
      job.status = 'failed'
      job.error = cleanError(error)
      event(job, 'failed', job.error, 'error')
    } finally { running.delete(job.id); save(job) }
  }
  const send = (res, status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
    res.end(JSON.stringify(body))
    return true
  }
  async function body(req) {
    let value = ''
    for await (const chunk of req) { value += chunk; if (value.length > 24000) throw new Error('Request too large.') }
    return value ? JSON.parse(value) : {}
  }
  function capabilityFor(req, job) {
    const token = (req.headers.cookie || '').split(';').map(value => value.trim()).find(value => value.startsWith('rk_builder_test='))?.split('=')[1]
    const grant = capabilities.get(token)
    return grant?.jobId === job.id && grant.expires > Date.now() ? grant : null
  }
  async function handle(req, res, url) {
    if (url.pathname !== '/api/builds' && !url.pathname.startsWith('/api/builds/')) return false
    try {
      if (url.pathname === '/api/builds') {
        if (req.method === 'GET') return send(res, 200, { builds: [...jobs.values()].filter(job => job.ownerId === req.clientId).map(publicBuild), configuration: { configured: keyConfigured() } })
        if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed.' })
        if (!req.clientId) return send(res, 403, { error: 'Open Raising Kane to start a build.' })
        const input = builderInput(await body(req))
        const job = { id: randomUUID(), ...input, ownerId: req.clientId, status: 'preparing', createdAt: now(),
          events: [], evidence: [], screenshots: [], revisions: [], reports: [], rawArtifacts: [], revision: 0,
          scope: 'isolated_synthetic_sandbox', title: 'A simpler interface', error: null }
        jobs.set(job.id, job)
        save(job)
        void run(job)
        return send(res, 202, { build: publicBuild(job) })
      }
      const match = url.pathname.match(/^\/api\/builds\/([a-zA-Z0-9-]+)(?:\/(.*))?$/)
      const job = match && jobs.get(match[1]), suffix = match?.[2] || ''
      if (!job) return send(res, 404, { error: 'Build not found.' })
      const verifyMatch = suffix.match(/^verification\/(\d+)$/)
      if (verifyMatch && req.method === 'GET') {
        const grant = capabilities.get(url.searchParams.get('token'))
        if (!grant || grant.jobId !== job.id || grant.revision !== Number(verifyMatch[1]) || grant.expires <= Date.now()) return send(res, 403, { error: 'The synthetic verification session expired.' })
        res.setHeader('Set-Cookie', `rk_builder_test=${grant.token}; Path=/api/builds/${job.id}/; HttpOnly; SameSite=Strict; Max-Age=900`)
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
          'Content-Security-Policy': "default-src 'none'; frame-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'" })
        res.end(verificationPage(job, grant.revision))
        return true
      }
      const grant = capabilityFor(req, job), owns = req.clientId && job.ownerId === req.clientId
      if (!owns && !grant) return send(res, 403, { error: 'Use the browser that started this build.' })
      if (!suffix && req.method === 'GET') return send(res, 200, { build: publicBuild(job) })
      const assetMatch = suffix.match(/^artifacts\/(\d+)\/(.+)$/)
      if (assetMatch && req.method === 'GET') {
        const revision = Number(assetMatch[1])
        if (grant && grant.revision !== revision) return send(res, 403, { error: 'Artifact revision mismatch.' })
        const artifact = job.revisions.find(item => item.revision === revision && item.rootDir)
        if (!artifact) return send(res, 404, { error: 'Artifact not found.' })
        if (assetMatch[2] === 'source') {
          const source = await readGeneratedSource({ rootDir: artifact.rootDir })
          return send(res, 200, source)
        }
        const asset = await readGeneratedAsset({ rootDir: artifact.rootDir, assetPath: assetMatch[2] })
        res.writeHead(200, { ...asset.headers, 'Content-Type': asset.contentType || asset.mimeType || 'application/octet-stream', 'Cache-Control': 'no-store' })
        res.end(asset.body || asset.content || asset.bytes)
        return true
      }
      const shotMatch = suffix.match(/^screenshots\/(screenshot-[a-f0-9]{20}\.(?:jpg|png))$/)
      if (shotMatch && req.method === 'GET') {
        if (!job.screenshots.some(shot => shot.filename === shotMatch[1])) return send(res, 404, { error: 'Screenshot not found.' })
        res.writeHead(200, { 'Content-Type': shotMatch[1].endsWith('.png') ? 'image/png' : 'image/jpeg', 'Cache-Control': 'no-store' })
        res.end(await readFile(path.join(dataDir, job.id, 'screenshots', shotMatch[1])))
        return true
      }
      if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed.' })
      const input = await body(req)
      if (['actions', 'approve'].includes(suffix)) {
        const revision = Number(input.revision)
        if (grant ? revision !== grant.revision : revision !== job.promotedRevision || job.status !== 'ready') {
          return send(res, 409, { error: 'Only the verified revision may control this task. Test revisions use a separate synthetic session.' })
        }
        const artifact = job.revisions.find(item => item.revision === revision)
        if (suffix === 'actions' && !artifact?.manifest?.actions?.some(action => action.id === input.actionId)) {
          return send(res, 403, { error: 'This action is not declared by the pinned generated interface.' })
        }
        const session = grant ? grant.session : await sessionFor(job)
        const result = suffix === 'approve'
          ? await session.approve({ taskRevision: input.taskRevision, proposalDigest: input.proposalDigest })
          : await session.invoke(input.actionId, input.payload || {})
        return send(res, 200, { result, ...(result?.approvalRequest ? { approvalRequest: result.approvalRequest } : {}) })
      }
      if (!owns) return send(res, 403, { error: 'A verification session cannot manage builds.' })
      if (suffix === 'retry') {
        if (running.has(job.id)) return send(res, 409, { error: 'This build is already running.' })
        void run(job)
        return send(res, 202, { build: publicBuild(job) })
      }
      if (suffix === 'verify' && job.artifact) {
        if (running.has(job.id)) return send(res, 409, { error: 'This build is already running.' })
        running.add(job.id)
        void (async () => {
          try { const report = await verify(job, await sessionFor(job), job.artifact)
            job.status = report.status === 'passed' ? 'ready' : 'failed'
            job.promotedRevision = report.status === 'passed' ? job.artifact.revision : null
          } catch (error) { job.status = 'failed'; job.error = cleanError(error) }
          finally { running.delete(job.id); save(job) }
        })()
        return send(res, 202, { build: publicBuild(job) })
      }
      return send(res, 404, { error: 'Build operation not found.' })
    } catch (error) { return send(res, 400, { error: cleanError(error) }) }
  }
  return { handle, async shutdown() { await explore.shutdown(); await source.shutdown?.() } }
}

function verificationPage(job, revision) {
  const artifact = job.revisions.find(item => item.revision === revision)
  const config = { base: `/api/builds/${job.id}`, revision, channel: artifact.bridgeChannel }
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Raising Kane · generated interface verification</title><style>body{margin:0;padding:24px;font:16px system-ui;background:#f7f8f5;color:#202820}h1{font-size:24px}iframe{width:100%;min-height:900px;border:1px solid #cbd2c6;background:white}#approval{border:2px solid #546c36;padding:18px;margin:18px 0;white-space:pre-wrap}button{padding:14px;font:inherit}#status{white-space:pre-wrap}</style>
<h1>${escapeHtml(job.title || 'Raising Kane')} · Synthetic sandbox verification</h1><p>Kane is testing generated revision ${revision}. Every source action uses a separate synthetic record.</p><section id="approval" hidden aria-label="Trusted sandbox approval"><h2>Review exact sandbox terms</h2><pre id="terms"></pre><button id="approve">Approve this sandbox action</button></section><p id="status" role="status"></p><iframe id="preview" title="Generated task interface" sandbox="allow-scripts" src="${escapeHtml(artifact.previewUrl)}"></iframe>
<script>const config=${safeJson(config)},frame=document.getElementById('preview'),status=document.getElementById('status');let request=null;
async function post(path,body){const r=await fetch(config.base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,revision:config.revision})});const data=await r.json();if(!r.ok)throw Error(data.error||'Action failed');return data;}
window.addEventListener('message',async e=>{const m=e.data;if(e.source!==frame.contentWindow||m?.type!=='raising-kane:action'||m.channel!==config.channel)return;try{const data=await post('/actions',{actionId:m.actionId,payload:m.payload});if(data.approvalRequest||data.result?.approvalRequest){request=data.approvalRequest||data.result.approvalRequest;document.getElementById('terms').textContent=JSON.stringify(request,null,2);document.getElementById('approval').hidden=false;}e.source.postMessage({type:'raising-kane:result',channel:m.channel,requestId:m.requestId,ok:true,result:data.result},'*');}catch(error){status.textContent=error.message;e.source.postMessage({type:'raising-kane:result',channel:m.channel,requestId:m.requestId,ok:false,error:error.message},'*');}});
document.getElementById('approve').onclick=async()=>{if(!request)return;try{await post('/approve',{taskRevision:request.taskRevision,proposalDigest:request.proposalDigest});status.textContent='Exact synthetic terms approved. Continue in the generated interface to submit.';document.getElementById('approval').hidden=true;request=null;frame.src=frame.src;}catch(e){status.textContent=e.message;}};</script></html>`
}
