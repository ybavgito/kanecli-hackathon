import { useCallback, useEffect, useRef, useState } from 'react'
import '@fontsource-variable/dm-sans'
import './builder.css'

const ACTIVE = new Set(['preparing', 'exploring', 'inspecting', 'generating', 'building', 'verifying', 'repairing', 'queued'])
const STAGES = {
  preparing: ['Preparing your website', 'Setting the task boundary before Kane starts.'],
  queued: ['Waiting to start', 'Your interface build is queued.'],
  exploring: ['Kane is exploring the website', 'Following the relevant paths and recording what the source actually shows.'],
  inspecting: ['Understanding the choices', 'Inspecting the task, its alternatives, and the details your interface must preserve.'],
  generating: ['Creating your simpler interface', 'The coding agent is turning Kane’s observations into a React interface for this task.'],
  building: ['Building the preview', 'Compiling the generated interface so Kane can check it in a browser.'],
  verifying: ['Kane is testing the interface', 'Checking the generated experience against the task and source behavior.'],
  repairing: ['Repairing the interface', 'The coding agent is using the reported failure to create another revision.'],
  ready: ['Your interface is ready', 'This revision passed the recorded Kane verification.'],
  needs_configuration: ['One setup step is needed', 'Your build is saved. Complete the server setup, then retry.'],
  failed: ['This build needs attention', 'The build stopped before it could produce a verified interface.'],
}

function Glyph({ name = 'arrow', size = 19, ...props }) {
  const paths = {
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    external: <><path d="M14 4h6v6m0-6-9 9" /><path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></>,
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" /><path d="m20 2 .5 1.5L22 4l-1.5.5L20 6l-.5-1.5L18 4l1.5-.5L20 2Z" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    code: <><path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18" /></>,
    shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></>,
    repeat: <><path d="M20 10a8 8 0 1 0-1 7M20 4v6h-6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    package: <><path d="m12 3 9 5v9l-9 5-9-5V8l9-5ZM3 8l9 5 9-5M12 13v9M7 5.8l9 5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 2v6m10-6v6M3 11h18m-13 5h3" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>
}

function text(value) {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(', ')
  return value.message || value.summary || value.title || value.label || value.detail || JSON.stringify(value)
}

function safeUrl(value) {
  if (!value || typeof value !== 'string') return null
  try {
    const url = new URL(value, window.location.origin)
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null
  } catch { return null }
}

function normalizeUrl(value) {
  const input = value.trim()
  if (!input) throw new Error('Enter a website URL to begin.')
  if (/^[a-z][a-z\d+.-]*:/i.test(input) && !/^https?:\/\//i.test(input) && !/^localhost:\d+/i.test(input)) throw new Error('Use an HTTP or HTTPS website URL.')
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(input)
  const candidate = /^https?:\/\//i.test(input) ? input : `${local ? 'http' : 'https'}://${input}`
  const result = safeUrl(candidate)
  if (!result) throw new Error('Enter a valid website URL without a username or password.')
  return result
}

function date(value) {
  const parsed = new Date(value)
  return value && !Number.isNaN(parsed.getTime()) ? parsed.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''
}

function host(value) {
  try { return new URL(value).host } catch { return value || 'Website' }
}

function array(value) { return Array.isArray(value) ? value : [] }

async function api(path, body) {
  const response = await fetch(path, { method: body === undefined ? 'GET' : 'POST', headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(text(data.error) || `The request could not be completed (${response.status}).`)
  return data
}

function StateBadge({ status }) {
  const label = status === 'ready' ? 'Kane verified' : status === 'needs_configuration' ? 'Setup needed' : status === 'failed' ? 'Needs attention' : text(status).replaceAll('_', ' ') || 'Not started'
  return <span className={`kb-badge ${status || ''}`}>{ACTIVE.has(status) ? <span className="kb-spinner" /> : <span className="kb-status-dot" />}{label}</span>
}

function Brand() {
  return <span className="kb-brand"><span className="kb-brand-symbol">K</span><span>Raising Kane<span className="kb-brand-dot">.</span></span></span>
}

function Evidence({ build }) {
  const model = build.sourceModel || {}
  const explore = model.exploration || build.exploration || {}
  const screens = array(model.screens || explore.screens)
  const findings = array(model.findings || explore.findings)
  const evidence = array(build.evidence || model.evidence)
  const screenshots = [...array(model.screenshots || build.screenshots), ...evidence.filter(item => item.thumbnailUrl)]
  const limits = array(model.limitations || explore.limitations)
  return <details className="kb-disclosure"><summary><span><Glyph name="eye" size={16} /> What Kane found</span><span>{screens.length ? `${screens.length} screens` : 'Source evidence'}</span></summary><div className="kb-disclosure-body">
    <p className="kb-small">These are source observations. They do not establish that every path was explored or that a reported source issue was fixed.</p>
    {screens.length > 0 && <ul className="kb-observations">{screens.map((screen, index) => <li key={screen.id || index}><strong>{screen.title || screen.heading || screen.url || `Observed screen ${index + 1}`}</strong>{safeUrl(screen.url) && <a href={safeUrl(screen.url)} target="_blank" rel="noreferrer">Open source <Glyph name="external" size={12} /></a>}</li>)}</ul>}
    {screenshots.length > 0 && <div className="kb-captures">{screenshots.map((shot, index) => { const url = safeUrl(typeof shot === 'string' ? shot : shot.thumbnailUrl || shot.imageUrl || shot.url); return url && <a key={shot.id || index} href={url} target="_blank" rel="noreferrer"><img src={url} alt={shot.title || shot.description || `Kane source capture ${index + 1}`} loading="lazy" /><span>{shot.title || shot.state || `Source capture ${index + 1}`}</span></a> })}</div>}
    {findings.length > 0 && <ul className="kb-observations">{findings.map((finding, index) => <li key={finding.id || index}><strong>{text(finding.title || finding.ruleId || finding.kind || 'Source finding')}</strong><p>{text(finding.description || finding.summary)}</p>{finding.confirmed !== undefined && <small>{finding.confirmed ? 'Reported as confirmed by Explore' : 'Not independently confirmed'}</small>}</li>)}</ul>}
    {evidence.length > 0 && <ul className="kb-observations">{evidence.map((item, index) => <li key={item.id || index}><strong>{text(item.title || item.phase || item.kind || 'Source observation')}</strong><p>{text(item.summary || item.message)}</p>{safeUrl(item.url) && <a href={safeUrl(item.url)} target="_blank" rel="noreferrer">Open evidence <Glyph name="external" size={12} /></a>}</li>)}</ul>}
    {limits.length > 0 && <ul className="kb-limitations">{limits.map((limit, index) => <li key={index}>{text(limit)}</li>)}</ul>}
    {!screens.length && !evidence.length && !findings.length && !screenshots.length && <p className="kb-empty-copy">Source evidence will appear when Kane records it.</p>}
  </div></details>
}

function Timeline({ build }) {
  const events = array(build.events)
  return <section className="kb-timeline" aria-label="Build activity"><div className="kb-side-title"><h2>Build activity</h2><span>{events.length} events</span></div>{events.length ? <ol>{events.slice(-10).reverse().map((event, index) => <li key={event.id || `${event.at}-${index}`} className={event.status || event.level || ''}><span className="kb-event-dot" /><div><strong>{text(event.message || event.summary || event.title || event.stage || event.type)}</strong>{event.detail && <p>{text(event.detail)}</p>}<small>{[event.stage && text(event.stage).replaceAll('_', ' '), date(event.at || event.timestamp)].filter(Boolean).join(' · ')}</small></div></li>)}</ol> : <p className="kb-small">No build events have been recorded yet.</p>}</section>
}

function Reports({ build }) {
  const revisions = array(build.revisions)
  const reports = build.reports || build.verification
  const sourceUrl = safeUrl(build.artifact?.sourceUrl || build.artifact?.codeUrl)
  const code = build.artifact?.source || build.artifact?.code
  return <details className="kb-disclosure"><summary><span><Glyph name="code" size={16} /> Revisions & verification</span><span>{build.artifact?.revision ? `Revision ${build.artifact.revision}` : 'Build details'}</span></summary><div className="kb-disclosure-body">
    {revisions.length > 0 && <ol className="kb-revisions">{revisions.map((revision, index) => <li key={revision.revision || revision.id || index}><div><strong>Revision {revision.revision || index + 1}</strong><span>{text(revision.status || revision.verification?.status).replaceAll('_', ' ') || 'Recorded'}</span></div>{(revision.summary || revision.error) && <p>{text(revision.error || revision.summary)}</p>}</li>)}</ol>}
    {reports && <details className="kb-raw-details"><summary>Recorded verification reports</summary><pre>{JSON.stringify(reports, null, 2)}</pre></details>}
    {sourceUrl && <a className="kb-source-code" href={sourceUrl} target="_blank" rel="noreferrer"><Glyph name="code" size={15} /> Open generated React source <Glyph name="external" size={13} /></a>}
    {code && <details className="kb-raw-details"><summary>Generated React source</summary><pre>{text(code)}</pre></details>}
    {build.artifact?.digest && <p className="kb-digest">Artifact {build.artifact.digest.slice(0, 16)}</p>}
    {!revisions.length && !reports && !code && !sourceUrl && <p className="kb-empty-copy">The generated code and verification record will appear here when they are available.</p>}
  </div></details>
}

function Approval({ request, busy, error, onApprove, onCancel }) {
  const proposal = request.proposal || request.terms || {}
  const rows = Array.isArray(proposal) ? proposal.map((item, index) => [item.label || `Detail ${index + 1}`, item.value ?? item.detail]) : Object.entries(proposal).filter(([, value]) => value != null)
  const valueLabel = (key, value) => {
    if (/Cents$/.test(key) && Number.isFinite(value)) return new Intl.NumberFormat('en-US', { style: 'currency', currency: proposal.currency || 'USD' }).format(value / 100)
    if (key === 'selectedLines' && Array.isArray(value)) return value.map(line => `${line.quantity} × ${line.id}`).join(', ')
    if (key === 'startsAt' && value) return new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'short', timeZone: proposal.timezone || 'America/Los_Angeles' }).format(new Date(value))
    const labels = { original_payment: 'Original payment method', store_credit: 'Store credit', qr_dropoff: 'Printer-free QR drop-off', print_label: 'Printed shipping label', too_small: 'Too small', changed_mind: 'Changed my mind', damaged: 'Damaged' }
    return labels[value] || text(value)
  }
  return <section className="kb-approval" aria-labelledby="kb-approval-title"><div className="kb-section-eyebrow"><Glyph name="shield" size={17} /> REVIEW BEFORE THE SOURCE CHANGES</div><h2 id="kb-approval-title">{request.title || 'Approve this sandbox action'}</h2><p>{request.summary || 'Review the source-checked proposal below. Approval applies to this exact task revision.'}</p>{rows.length > 0 && <dl>{rows.map(([key, value]) => <div key={key}><dt>{key.replace(/Cents$/, '').replace(/([A-Z])/g, ' $1').replaceAll('_', ' ')}</dt><dd>{valueLabel(key, value)}</dd></div>)}</dl>}{array(request.checks).length > 0 && <ul>{request.checks.map((check, index) => <li key={check.id || index}><Glyph name={['match', 'matched', 'passed'].includes(check.status) ? 'check' : 'eye'} size={14} /><span><strong>{text(check.label || check.name)}</strong>{check.detail && ` — ${text(check.detail)}`}</span></li>)}</ul>}{error && <p className="kb-inline-error" role="alert">{error}</p>}<div className="kb-approval-actions"><button className="kb-secondary" onClick={onCancel} disabled={busy}>Cancel</button><button className="kb-primary" onClick={onApprove} disabled={busy}>{busy ? 'Saving approval…' : 'Approve this sandbox action'}<Glyph name="check" size={17} /></button></div><small>This approval is handled by Raising Kane, outside the generated interface.</small></section>
}

export default function Builder() {
  const [build, setBuild] = useState(null)
  const [builds, setBuilds] = useState([])
  const [url, setUrl] = useState('')
  const [goal, setGoal] = useState('')
  const [busy, setBusy] = useState('')
  const [restoring, setRestoring] = useState(Boolean(new URLSearchParams(location.search).get('buildId')))
  const [error, setError] = useState('')
  const [connectionError, setConnectionError] = useState(false)
  const [approval, setApproval] = useState(null)
  const [approvalError, setApprovalError] = useState('')
  const [previewEpoch, setPreviewEpoch] = useState(0)
  const [previewError, setPreviewError] = useState('')
  const [actionCount, setActionCount] = useState(0)
  const [width, setWidth] = useState('desktop')
  const [service, setService] = useState(null)
  const frameRef = useRef(null)
  const buildRef = useRef(null)
  const seenRequests = useRef(new Set())
  const selectionRef = useRef(0)

  const update = useCallback(next => {
    if (!next) return
    const current = buildRef.current
    if (current?.id === next.id && current.updatedAt && next.updatedAt && new Date(current.updatedAt) > new Date(next.updatedAt)) return
    buildRef.current = next
    setBuild(next)
    setBuilds(items => [next, ...items.filter(item => item.id !== next.id)])
    const locationUrl = new URL(location.href)
    for (const key of ['taskId', 'connectionId', 'workflowId', 'demo']) locationUrl.searchParams.delete(key)
    locationUrl.searchParams.set('mode', 'builder')
    locationUrl.searchParams.set('buildId', next.id)
    window.history.replaceState(null, '', locationUrl)
  }, [])

  const openBuild = useCallback(async id => {
    const selection = ++selectionRef.current
    setRestoring(true); setError(''); setApproval(null)
    try {
      const data = await api(`/api/builds/${encodeURIComponent(id)}`)
      if (selection === selectionRef.current) update(data.build || data)
    } catch (failure) { if (selection === selectionRef.current) setError(failure.message) }
    finally { if (selection === selectionRef.current) setRestoring(false) }
  }, [update])

  useEffect(() => {
    let live = true
    api('/api/builds').then(data => { if (live) { setBuilds(array(data.builds)); setService(data.configuration || data.capabilities || null) } }).catch(failure => { if (live) setError(failure.message) })
    const id = new URLSearchParams(location.search).get('buildId')
    if (id) openBuild(id)
    return () => { live = false }
  }, [openBuild])

  useEffect(() => {
    if (!build?.id) return
    const id = build.id
    const timer = setInterval(async () => {
      try {
        const data = await api(`/api/builds/${encodeURIComponent(id)}`)
        if (buildRef.current?.id === id) { setConnectionError(false); update(data.build || data) }
      } catch { if (buildRef.current?.id === id) setConnectionError(true) }
    }, ACTIVE.has(build.status) ? 1600 : 4500)
    return () => clearInterval(timer)
  }, [build?.id, build?.status, update])

  useEffect(() => {
    seenRequests.current.clear()
    setApproval(null); setApprovalError(''); setPreviewError('')
    const receive = async event => {
      const current = buildRef.current
      const artifact = current?.artifact
      const message = event.data
      if (event.source !== frameRef.current?.contentWindow || !artifact?.bridgeChannel || message?.channel !== artifact.bridgeChannel) return
      if (message.type === 'raising-kane:runtime-error') { setPreviewError('The generated interface could not render. Run Kane verification to check this revision.'); return }
      if (message.type !== 'raising-kane:action') return
      if (typeof message.requestId !== 'string' || message.requestId.length > 180 || typeof message.actionId !== 'string') return
      const requestKey = `${artifact.revision}:${message.requestId}`
      if (seenRequests.current.has(requestKey)) return
      seenRequests.current.add(requestKey)
      const target = event.source
      const reply = (ok, result, errorMessage) => target.postMessage({ type: 'raising-kane:result', channel: artifact.bridgeChannel, requestId: message.requestId, ok, result, error: errorMessage }, '*')
      if (message.actionId === 'approve') { reply(false, null, 'Approval must happen in the Raising Kane review panel.'); return }
      setActionCount(count => count + 1)
      try {
        const data = await api(`/api/builds/${encodeURIComponent(current.id)}/actions`, { revision: artifact.revision, actionId: message.actionId, payload: message.payload || {} })
        if (buildRef.current?.id !== current.id || buildRef.current?.artifact?.revision !== artifact.revision) { reply(false, null, 'The interface revision changed. Reload it before continuing.'); return }
        if (data.build) update(data.build)
        const approvalRequest = data.approvalRequest || data.result?.approvalRequest
        if (approvalRequest) {
          if (approvalRequest.taskRevision == null || !approvalRequest.proposalDigest) throw new Error('The source did not provide a complete approval request. Check the proposal again.')
          setApproval({ ...approvalRequest, buildId: current.id, artifactRevision: artifact.revision })
          setApprovalError('')
        }
        reply(true, data.result ?? data)
      } catch (failure) { reply(false, null, failure.message) }
      finally { setActionCount(count => Math.max(0, count - 1)) }
    }
    window.addEventListener('message', receive)
    return () => window.removeEventListener('message', receive)
  }, [build?.id, build?.artifact?.revision, build?.artifact?.bridgeChannel, build?.status === 'ready', update])

  const start = async event => {
    event.preventDefault(); setError(''); setBusy('start')
    try { const normalized = normalizeUrl(url); const data = await api('/api/builds', { url: normalized, goal: goal.trim() || undefined }); selectionRef.current += 1; update(data.build || data) }
    catch (failure) { setError(failure.message) }
    finally { setBusy('') }
  }

  const mutate = async action => {
    if (!build) return
    setBusy(action); setError('')
    try { const data = await api(`/api/builds/${encodeURIComponent(build.id)}/${action}`, {}); update(data.build || data) }
    catch (failure) { setError(failure.message) }
    finally { setBusy('') }
  }

  const approve = async () => {
    if (!approval || approval.buildId !== build?.id || approval.artifactRevision !== build?.artifact?.revision) { setApprovalError('The interface changed. Request a fresh source check before approving.'); return }
    setBusy('approve'); setApprovalError('')
    try {
      const data = await api(`/api/builds/${encodeURIComponent(build.id)}/approve`, { revision: approval.artifactRevision, taskRevision: approval.taskRevision, proposalDigest: approval.proposalDigest })
      if (data.build) update(data.build)
      setApproval(null); seenRequests.current.clear(); setPreviewEpoch(epoch => epoch + 1)
    } catch (failure) { setApprovalError(failure.message) }
    finally { setBusy('') }
  }

  const home = () => {
    selectionRef.current += 1; buildRef.current = null; setBuild(null); setApproval(null); setError(''); setRestoring(false); setConnectionError(false)
    window.history.replaceState(null, '', `${location.pathname}?mode=builder`)
  }

  const preset = kind => {
    setUrl(new URL(kind === 'return' ? '/merchant' : '/appointments', window.location.origin).href)
    setGoal(kind === 'return' ? 'Return the red shoes, keep the jacket, and refund my original payment method. I do not have a printer.' : 'Move my service visit to Saturday, October 31 in the morning. Keep Maya Chen, the same service and address, and no extra fee.')
    setError('')
  }

  const artifact = build?.artifact
  const candidatePreview = safeUrl(artifact?.previewUrl || build?.previewUrl)
  const previewUrl = candidatePreview && new URL(candidatePreview).origin === window.location.origin ? candidatePreview : null
  const active = ACTIVE.has(build?.status)
  const stage = STAGES[build?.status] || [text(build?.status).replaceAll('_', ' ') || 'Build saved', 'Follow the recorded activity below.']
  const sourceUrl = safeUrl(build?.sourceUrl || build?.url)
  const configuration = build?.configuration || service
  const missing = array(configuration?.missing)

  return <div className="builder-app">
    <a className="kb-skip" href="#builder-main">Skip to interface builder</a>
    <header className="kb-header"><button className="kb-brand-button" onClick={home} aria-label="Raising Kane builder home"><Brand /></button><nav aria-label="Product views"><a className="kb-nav-active" href="?mode=builder" aria-current="page">Interface builder</a><a href="?mode=discover">Website discovery</a><a href="?mode=fixtures">Sandbox demos <Glyph name="external" size={12} /></a></nav><span className="kb-header-tag">Built with Kane</span></header>
    <main id="builder-main" className={build ? 'kb-main kb-build-main' : 'kb-main'}>
      {restoring && <div className="kb-notice" role="status"><span className="kb-spinner" /> Loading your saved interface…</div>}
      {error && <div className="kb-notice kb-error" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error"><Glyph name="close" size={16} /></button></div>}
      {connectionError && <div className="kb-notice" role="status">The server connection was interrupted. Showing the last saved build; its status may have changed.</div>}
      {!build ? <>
        <section className="kb-hero"><div className="kb-section-eyebrow"><span className="kb-tiny-line" /> When websites raise hell, raise Kane</div><h1>A simpler way<br />to <em>get it done.</em></h1><p>Bring the website and the task. Kane explores the source, a coding agent builds your interface, and Kane tests it before you use it.</p></section>
        <div className="kb-start-layout"><section className="kb-start-form"><div className="kb-form-heading"><span className="kb-section-eyebrow">YOUR WEBSITE. YOUR TASK.</span><span className="kb-sandbox-label">SANDBOX BUILD</span></div><form onSubmit={start}><label htmlFor="builder-url">Website URL <span>Required</span></label><div className="kb-url-field"><Glyph name="globe" size={21} /><input id="builder-url" type="text" inputMode="url" autoComplete="url" placeholder="https://website.com" required value={url} onChange={event => setUrl(event.target.value)} /></div><label htmlFor="builder-goal">What would you like to do? <span>Optional</span></label><textarea id="builder-goal" rows={3} value={goal} onChange={event => setGoal(event.target.value)} placeholder="Tell Kane the task and what matters to you." /><div className="kb-form-footer"><p>Start with a supported sandbox below. Other websites can use <a href="?mode=discover">website discovery</a>.</p><button className="kb-primary" type="submit" disabled={Boolean(busy)}>{busy === 'start' ? 'Starting your build…' : 'Build my interface'}{busy === 'start' ? <span className="kb-spinner" /> : <Glyph name="arrow" />}</button></div></form><div className="kb-presets"><span>TRY A SOURCE</span><button type="button" onClick={() => preset('return')}><Glyph name="package" size={16} /> Return an item <span>Northstar</span></button><button type="button" onClick={() => preset('appointment')}><Glyph name="calendar" size={16} /> Move a visit <span>Linden</span></button></div></section>
        <aside className="kb-how"><div className="kb-how-top"><span className="kb-how-icon"><Glyph name="spark" size={29} /></span><h2>The task comes first.<br />The interface follows.</h2></div><ol><li><span>01</span><div><strong>Kane explores</strong><p>Real screens, choices, and consequences become the brief.</p></div></li><li><span>02</span><div><strong>A coding agent builds</strong><p>A simpler React interface is generated for the task you chose.</p></div></li><li><span>03</span><div><strong>Kane tests and checks</strong><p>Failures drive repairs. A passing revision becomes your workspace.</p></div></li></ol><div className="kb-processing-note"><Glyph name="shield" size={17} /><p>Source content and screenshots are processed by TestMu AI and the coding model. These builds use synthetic sandbox records.</p></div></aside></div>
        {builds.length > 0 && <section className="kb-history"><div className="kb-history-heading"><div><span className="kb-section-eyebrow">PICK UP WHERE YOU LEFT OFF</span><h2>Your interfaces</h2></div><span>{builds.length} saved</span></div><div className="kb-history-list">{builds.map(item => <button key={item.id} className="kb-history-item" onClick={() => openBuild(item.id)} disabled={restoring || Boolean(busy)}><span className="kb-site-initial">{(item.title || host(item.url)).slice(0, 1).toUpperCase()}</span><span className="kb-history-copy"><strong>{item.title || item.goal || host(item.url)}</strong><small>{host(item.url)}{item.updatedAt ? ` · ${date(item.updatedAt)}` : ''}</small></span><StateBadge status={item.status} /><Glyph name="arrow" size={18} /></button>)}</div></section>}
      </> : <>
        <div className="kb-workspace-heading"><div><button className="kb-back" onClick={home}>← All interfaces</button><div className="kb-section-eyebrow">YOUR GENERATED WORKSPACE <span className="kb-sandbox-label">SANDBOX</span></div><h1>{build.title || host(build.url)}</h1>{build.goal && <p>{build.goal}</p>}</div>{sourceUrl && <a className="kb-source-link" href={sourceUrl} target="_blank" rel="noreferrer">Open original website <Glyph name="external" size={15} /></a>}</div>
        <div className="kb-workspace-grid"><div className="kb-preview-column">
          <section className={`kb-stage-panel ${build.status}`} aria-live="polite"><span className="kb-stage-symbol">{active ? <span className="kb-spinner" /> : <Glyph name={build.status === 'ready' ? 'check' : 'spark'} size={23} />}</span><div><h2>{stage[0]}</h2><p>{stage[1]}</p></div><StateBadge status={build.status} /></section>
          {(build.error || build.status === 'needs_configuration') && <section className="kb-build-error"><h2>{build.status === 'needs_configuration' ? 'Connect the builder on your server' : 'Why the build stopped'}</h2><p>{text(build.error || configuration?.message) || 'The server is missing configuration needed to continue.'}</p>{missing.length > 0 && <p className="kb-config-keys">Missing: {missing.map(text).join(', ')}</p>}<button className="kb-secondary" onClick={() => mutate('retry')} disabled={Boolean(busy) || active}>{busy === 'retry' ? 'Retrying…' : 'Retry build'}<Glyph name="repeat" size={15} /></button></section>}
          {approval && <Approval request={approval} busy={busy === 'approve'} error={approvalError} onApprove={approve} onCancel={() => { setApproval(null); setApprovalError('') }} />}
          {previewError && <div className="kb-notice kb-error" role="alert">{previewError}</div>}
          <section className="kb-preview-shell" aria-label="Generated interface preview"><div className="kb-preview-toolbar"><div><span className="kb-window-dots"><i /><i /><i /></span><strong>{build.status === 'ready' ? 'Your interface' : 'Generated preview'}</strong>{artifact?.revision && <span className="kb-revision-label">v{artifact.revision}</span>}</div><div className="kb-preview-controls">{previewUrl && <><div className="kb-width-toggle" aria-label="Preview width"><button type="button" aria-pressed={width === 'desktop'} onClick={() => setWidth('desktop')}>Desktop</button><button type="button" aria-pressed={width === 'mobile'} onClick={() => setWidth('mobile')}>Mobile</button></div><button className="kb-icon-button" onClick={() => { seenRequests.current.clear(); setPreviewEpoch(epoch => epoch + 1) }} aria-label="Reload generated preview"><Glyph name="repeat" size={16} /></button></>}</div></div>
            {previewUrl ? <><div className={`kb-frame-surround ${width}`}><iframe key={`${build.id}-${artifact?.revision}-${build.status === 'ready' ? 'ready' : 'preview'}-${previewEpoch}`} ref={frameRef} title={`${build.title || 'Raising Kane'} generated task interface`} src={previewUrl} sandbox="allow-scripts" referrerPolicy="no-referrer" /></div><div className="kb-preview-caption"><span><Glyph name={build.status === 'ready' ? 'shield' : 'eye'} size={14} />{build.status === 'ready' ? 'This revision passed the recorded Kane check.' : 'Preview only · This revision has not passed verification.'}</span>{actionCount > 0 && <span className="kb-action-running"><span className="kb-spinner" /> Checking the source…</span>}</div></> : <div className="kb-preview-empty"><span className="kb-preview-empty-icon"><Glyph name="code" size={34} /></span><h2>Your interface will appear here</h2><p>{active ? 'Kane’s source observations guide the generated layout, choices, and actions. You can follow the real activity alongside this preview.' : 'A compiled artifact is not available for this build yet.'}</p><div className="kb-preview-empty-line"><span>Source</span><Glyph name="arrow" size={15} /><span>Generated interface</span><Glyph name="arrow" size={15} /><span>Kane check</span></div></div>}
          </section>
          {previewUrl && !active && <div className="kb-preview-actions"><p>Recheck the current revision against its saved task contract.</p><button className="kb-secondary" disabled={Boolean(busy)} onClick={() => mutate('verify')}>{busy === 'verify' ? 'Starting verification…' : 'Run Kane verification'}<Glyph name="shield" size={15} /></button></div>}
        </div><aside className="kb-build-sidebar"><section className="kb-build-summary"><div className="kb-side-title"><h2>Built for your task</h2><Glyph name="spark" size={17} /></div><p>{build.goal || text(build.contract?.goal || build.contract?.request) || 'The task will be established from the source observations.'}</p><dl><div><dt>Source</dt><dd>{host(build.url)}</dd></div><div><dt>Environment</dt><dd>Synthetic sandbox</dd></div>{artifact?.revision && <div><dt>Interface revision</dt><dd>{artifact.revision}</dd></div>}</dl></section><Timeline build={build} /><Evidence build={build} /><Reports build={build} /><div className="kb-trust-note"><Glyph name="shield" size={17} /><p>Source actions go through Raising Kane. Final approval stays outside the generated interface.</p></div></aside></div>
      </>}
    </main><footer className="kb-footer"><span>When websites raise hell, raise Kane</span><span>Explore. Build. Verify.</span></footer>
  </div>
}
