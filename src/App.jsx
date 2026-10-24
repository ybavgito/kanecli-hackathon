import { useEffect, useState } from 'react'
import MerchantDemo from './MerchantDemo.jsx'

const CONNECTION_KEY = 'raising-kane-connection-id'
const WORKFLOW_KEY = 'raising-kane-workflow-id'
const params = new URLSearchParams(window.location.search)

function Icon({ name, size = 18 }) {
  const paths = {
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    link: <><path d="M10 14 21 3m-8 0h8v8" /><path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" /></>,
    eye: <><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" /><circle cx="12" cy="12" r="2.4" /></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
    spark: <><path d="m12 2 1.7 6.3L20 10l-6.3 1.7L4 10l6.3-1.7L12 2Z" /><path d="m19 17 .7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7L19 17Z" /></>,
    reload: <><path d="M20 11a8 8 0 1 0-2.4 6" /><path d="M20 4v7h-7" /></>,
    pause: <><path d="M9 4v16M15 4v16" /></>,
    close: <><path d="M5 5l14 14M19 5 5 19" /></>,
    check: <path d="m4 12 5 5L20 6" />,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

async function api(path, body) {
  const response = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || data.message || `Request failed (${response.status})`)
  return data
}

function safeUrl(value) {
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null
  } catch { return null }
}

function normalizeUrl(value) {
  const trimmed = value.trim()
  if (!trimmed) throw new Error('Paste a website URL to begin.')
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    throw new Error('Use an HTTP or HTTPS website URL.')
  }
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(trimmed)
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `${local ? 'http' : 'https'}://${trimmed}`
  const url = safeUrl(candidate)
  if (!url) throw new Error('Use an HTTP or HTTPS URL without a username or password.')
  return url
}

function textOf(value) {
  if (value == null || value === '') return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map(textOf).filter(Boolean).join(', ')
  return value.label || value.text || value.summary || value.value || JSON.stringify(value)
}

function displayDate(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return ''
  return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function updateUrl(connectionId, workflowId) {
  const url = new URL(window.location.href)
  url.searchParams.delete('demo')
  url.searchParams.delete('taskId')
  if (connectionId) url.searchParams.set('connectionId', connectionId)
  else url.searchParams.delete('connectionId')
  if (workflowId) url.searchParams.set('workflowId', workflowId)
  else url.searchParams.delete('workflowId')
  window.history.replaceState(null, '', url.toString())
  if (connectionId) localStorage.setItem(CONNECTION_KEY, connectionId)
  else localStorage.removeItem(CONNECTION_KEY)
  if (workflowId) localStorage.setItem(WORKFLOW_KEY, workflowId)
  else localStorage.removeItem(WORKFLOW_KEY)
}

function Evidence({ entries = [] }) {
  return <section className="rk-panel rk-evidence"><div className="rk-panel-head"><span className="rk-kicker">BROWSER EVIDENCE</span><span className="rk-muted-small">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span></div>
    {entries.length ? <ol>{entries.slice().reverse().map((item, index) => <li key={item.id || `${item.phase}-${index}`}><span className={`rk-evidence-dot ${item.status || ''}`} /><div><strong>{textOf(item.phase) || 'Source observation'}</strong><p>{textOf(item.summary) || textOf(item.status)}</p><div className="rk-evidence-meta">{item.mode && <span>{textOf(item.mode)}</span>}{item.at && <span>{displayDate(item.at)}</span>}{item.steps != null && <span>{item.steps} steps</span>}</div>{safeUrl(item.url) && <a href={safeUrl(item.url)} target="_blank" rel="noreferrer">Open evidence <Icon name="link" size={12} /></a>}</div></li>)}</ol> : <p className="rk-empty">Kane’s source observations will appear here. No result is verified yet.</p>}
  </section>
}

function SourceQuote({ children }) {
  return children ? <blockquote className="rk-source-quote"><span>FROM THE WEBSITE</span><p>“{textOf(children)}”</p></blockquote> : null
}

function ItemList({ title, items }) {
  if (!Array.isArray(items) || !items.length) return null
  return <div className="rk-item-list"><span>{title}</span><ul>{items.map((item, index) => <li key={index}>{textOf(item)}</li>)}</ul></div>
}

function Progress({ value, fallback }) {
  const detail = typeof value === 'string' ? value : value?.message || value?.detail || value?.label || value?.phase
  return <div className="rk-progress" role="status"><span className="rk-progress-pulse" /><span>{textOf(detail) || fallback}</span></div>
}

function CurrentStep({ eyebrow, title, detail, children, busy }) {
  return <section className={`rk-current-step ${busy ? 'rk-running' : ''}`} aria-live="polite"><div className="rk-current-icon"><Icon name={busy ? 'reload' : 'spark'} size={20} /></div><div className="rk-current-copy"><span className="rk-kicker">{eyebrow}</span><h2>{title}</h2><p>{detail}</p></div>{children && <div className="rk-current-action">{children}</div>}</section>
}

function Brand() {
  return <span className="rk-brand"><span className="rk-brand-icon"><Icon name="spark" size={20} /></span><span>raising<span>kane</span><b>.</b></span></span>
}

function UrlProduct() {
  const [connection, setConnection] = useState(null)
  const [workflow, setWorkflow] = useState(null)
  const [connections, setConnections] = useState([])
  const [urlInput, setUrlInput] = useState('')
  const [goalInput, setGoalInput] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState(null)
  const [answers, setAnswers] = useState({})
  const [constraintInput, setConstraintInput] = useState('')
  const [candidateOption, setCandidateOption] = useState('')
  const [processingAcknowledged, setProcessingAcknowledged] = useState(false)
  const [loading, setLoading] = useState(true)

  const refreshHistory = () => api('/api/connections').then(data => setConnections(data.connections || [])).catch(() => {})

  useEffect(() => {
    let cancelled = false
    const requestedWorkflow = new URLSearchParams(window.location.search).get('workflowId') || localStorage.getItem(WORKFLOW_KEY)
    const requestedConnection = new URLSearchParams(window.location.search).get('connectionId') || localStorage.getItem(CONNECTION_KEY)
    Promise.allSettled([api('/api/status'), api('/api/connections')]).then(async results => {
      if (cancelled) return
      if (results[0].status === 'fulfilled') setStatus(results[0].value)
      if (results[1].status === 'fulfilled') setConnections(results[1].value.connections || [])
      try {
        if (requestedWorkflow) {
          const data = await api(`/api/workflows/${encodeURIComponent(requestedWorkflow)}`)
          if (!cancelled) {
            setWorkflow(data.workflow)
            setConnection(data.connection || null)
            updateUrl(data.connection?.id || data.workflow?.connectionId, data.workflow?.id)
          }
        } else if (requestedConnection) {
          const data = await api(`/api/connections/${encodeURIComponent(requestedConnection)}`)
          if (!cancelled) { setConnection(data.connection); updateUrl(data.connection?.id, null) }
        }
      } catch (failure) {
        if (!cancelled) {
          setError(`Could not restore the saved workspace: ${failure.message}`)
          updateUrl(null, null)
        }
      } finally { if (!cancelled) setLoading(false) }
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!connection?.id && !workflow?.id) return undefined
    const connectionId = connection?.id
    const workflowId = workflow?.id
    const timer = setInterval(async () => {
      if (workflowId) {
        try {
          const data = await api(`/api/workflows/${encodeURIComponent(workflowId)}`)
          setWorkflow(current => current?.id === workflowId ? data.workflow : current)
          if (data.connection) setConnection(current => current?.id === data.connection.id ? data.connection : current)
        } catch { /* Retain the last visible state while reconnecting. */ }
      } else if (connectionId) {
        try {
          const data = await api(`/api/connections/${encodeURIComponent(connectionId)}`)
          setConnection(current => current?.id === connectionId ? data.connection : current)
        } catch { /* Retain the last visible state while reconnecting. */ }
      }
    }, 2200)
    return () => clearInterval(timer)
  }, [connection?.id, workflow?.id])

  useEffect(() => {
    setAnswers(workflow?.answers || {})
    setCandidateOption(workflow?.selectedOptionId || '')
    setConstraintInput('')
  }, [workflow?.id])

  const mutation = async (name, path, body, target = 'connection') => {
    setBusy(name)
    setError('')
    try {
      const data = await api(path, body)
      if (data.connection) setConnection(data.connection)
      if (data.workflow) setWorkflow(data.workflow)
      if (target === 'connection' && data.connection) updateUrl(data.connection.id, ['connect', 'disconnect'].includes(name) ? null : workflow?.id || null)
      if (target === 'workflow' && data.workflow) updateUrl(data.connection?.id || connection?.id || data.workflow.connectionId, data.workflow.id)
      refreshHistory()
      return data
    } catch (failure) {
      setError(failure.message)
      return null
    } finally { setBusy('') }
  }

  const createConnection = event => {
    event.preventDefault()
    try {
      const url = normalizeUrl(urlInput)
      setWorkflow(null)
      mutation('connect', '/api/connections', { url, goal: goalInput.trim() || undefined })
    } catch (failure) { setError(failure.message) }
  }
  const openHistory = async id => {
    setBusy('history')
    setError('')
    try {
      const data = await api(`/api/connections/${encodeURIComponent(id)}`)
      setConnection(data.connection)
      setWorkflow(null)
      updateUrl(data.connection.id, null)
    } catch (failure) { setError(failure.message) }
    finally { setBusy('') }
  }
  const openWorkflow = actionId => mutation('action', '/api/workflows', { connectionId: connection.id, actionId, goal: connection.goal || undefined }, 'workflow')
  const backToActions = () => { setWorkflow(null); updateUrl(connection?.id, null); setError('') }
  const newConnection = () => { setWorkflow(null); setConnection(null); setUrlInput(''); setGoalInput(''); setError(''); updateUrl(null, null) }
  const disconnect = async () => {
    const data = await mutation('disconnect', `/api/connections/${connection.id}/disconnect`, {}, 'connection')
    if (data) { setWorkflow(null); setProcessingAcknowledged(false); updateUrl(data.connection?.id || null, null) }
  }
  const resume = async () => {
    if (!processingAcknowledged) return
    const data = await mutation('resume', `/api/connections/${connection.id}/resume`, { acknowledgeProcessing: true })
    if (data) setProcessingAcknowledged(false)
  }
  const submitAnswers = event => {
    event.preventDefault()
    const extra = constraintInput.trim()
    const constraints = [...(workflow.constraints || []), ...(extra ? [extra] : [])]
    const currentAnswers = Object.fromEntries((workflow.questions || [])
      .filter(question => !/password|passcode|one.time|otp|secret|token|captcha|verification code/i.test(`${question.id} ${question.label} ${question.type}`))
      .filter(question => answers[question.id] !== undefined && answers[question.id] !== '')
      .filter(question => question.type !== 'select' || (question.options || []).some(option => option.value === answers[question.id]))
      .map(question => [question.id, answers[question.id]]))
    mutation('answer', `/api/workflows/${workflow.id}/answer`, { answers: currentAnswers, constraints }, 'workflow').then(data => { if (data) setConstraintInput('') })
  }
  const chooseOption = () => candidateOption && mutation('choose', `/api/workflows/${workflow.id}/choose`, { optionId: candidateOption }, 'workflow')

  const connected = connection && connection.status !== 'disconnected'
  const pausing = connection?.status === 'pausing'
  const connectionBusy = ['discovering', 'pausing'].includes(connection?.status) || busy === 'connect' || busy === 'inspect'
  const workflowBusy = ['inspecting', 'submitting'].includes(workflow?.status) || Boolean(busy) || pausing
  const needsHuman = ['needs_sign_in', 'human_control'].includes(connection?.status)
  const workflowActionDisabled = workflowBusy || !connected || needsHuman || connectionBusy
  const actions = Array.isArray(connection?.actions) ? connection.actions : []
  const records = Array.isArray(connection?.records) ? connection.records : []
  const options = Array.isArray(workflow?.options) ? workflow.options : []
  const questions = Array.isArray(workflow?.questions) ? workflow.questions : []
  const checks = Array.isArray(workflow?.checks) ? workflow.checks : []
  const proposal = workflow?.proposal
  const constraints = Array.isArray(workflow?.constraints) ? workflow.constraints : []
  const workflowEvidence = Array.isArray(workflow?.evidence) ? workflow.evidence : []
  const connectionEvidence = Array.isArray(connection?.evidence) ? connection.evidence : []
  const checkable = proposal?.checkedAt && workflow?.status === 'draft_checked' && checks.length > 0 && checks.every(check => check.status === 'match')
  const canAnswer = Boolean(workflow) && ['needs_input', 'options_observed', 'draft_checked', 'error', 'blocked'].includes(workflow.status) && !workflow.executionStarted
  const sensitiveQuestion = question => /password|passcode|one.time|otp|secret|token|captcha|verification code/i.test(`${question.id} ${question.label} ${question.type}`)
  const requiredUnanswered = questions.some(question => question.required && !answers[question.id])

  const connectionStep = pausing
    ? { title: 'Stopping automation', detail: 'Raising Kane is ending the active browser step before giving you control.' }
    : connection?.status === 'discovering'
    ? { title: 'Finding useful actions', detail: 'Kane is inspecting this page in a bounded, read-only pass.' }
    : needsHuman
      ? { title: 'Your sign-in stays with you', detail: 'Take control of the dedicated browser, sign in on the original website, then reconnect Kane.' }
      : connection?.status === 'ready'
        ? { title: actions.length ? 'Choose what you want to do' : 'Inspect the current page', detail: actions.length ? 'These actions were discovered on this website. Choose one to explore its actual options.' : 'No supported actions have been observed yet. Inspect more or open the website.' }
        : connection?.status === 'disconnected'
          ? { title: 'Connection closed', detail: 'Its browser profile is gone. Start a new connection to continue.' }
          : { title: 'Source needs attention', detail: connection?.error || 'The site could not be inspected fully. Open the source or try another bounded inspection.' }

  const workflowStep = pausing
    ? { title: 'Stopping automation', detail: 'Raising Kane is ending the active browser step before giving you control.' }
    : workflow?.status === 'inspecting'
    ? { title: 'Inspecting this action', detail: 'Kane is reading source terms and available choices.' }
    : workflow?.status === 'needs_input'
      ? { title: 'Answer what this action needs', detail: 'These questions come from the observed website flow.' }
      : workflow?.status === 'options_observed'
        ? options.length ? { title: 'Compare the real options', detail: 'Select an observed option, then check the exact proposal before approval.' } : { title: proposal ? 'Check the observed proposal' : 'No options observed yet', detail: proposal ? 'Kane has a source-backed proposal. Check its material terms before approval.' : 'Open the source or inspect again before making a decision.' }
        : workflow?.status === 'draft_checked'
          ? { title: 'Review the checked proposal', detail: 'Inspect the terms and source checks before approving this revision.' }
          : workflow?.status === 'approved'
            ? { title: 'Ready to act', detail: 'You approved this exact proposal. Kane will recheck material terms before execution.' }
            : workflow?.status === 'submitting'
              ? { title: 'Action in progress', detail: 'Kane is operating the source. A browser step alone is not yet a verified result.' }
              : workflow?.status === 'result_unknown'
                ? { title: 'Checking what happened', detail: 'The source result is uncertain. Reconcile before any repeat action.' }
                : workflow?.status === 'result_verified'
                  ? { title: 'Source result verified', detail: 'The receipt below reflects a checked source result.' }
                  : workflow?.status === 'needs_sign_in'
                    ? { title: 'Sign in on the website', detail: 'Raising Kane paused so you can use the dedicated browser directly.' }
                    : { title: 'This action needs attention', detail: workflow?.error || 'The available source information is not enough to continue safely.' }

  return <div className="rk-app">
    <header className="rk-topbar"><button type="button" className="rk-brand-button" disabled={pausing} onClick={newConnection} aria-label="Raising Kane home"><Brand /></button><span className="rk-tagline">When websites raise hell, raise Kane</span><div className="rk-top-right">{status?.kane && <span className={`rk-health ${status.kane.available ? 'ready' : ''}`}><span />{status.kane.available ? 'Kane ready' : 'Kane unavailable'}</span>}<a href="?demo=merchant" className="rk-demo-link">Merchant sandbox ↗</a></div></header>
    <main className="rk-main">
      {!connection ? <><section className="rk-hero"><div className="rk-kicker rk-hero-kicker"><span /> THE WEB, WITHOUT THE MAZE</div><h1>Where do you want<br /><em>to get something done?</em></h1><p>Paste a website. Raising Kane finds useful actions, shows the choices and their consequences, then checks what the website actually did.</p></section><div className="rk-start-grid"><section className="rk-start-card"><div className="rk-panel-head"><span className="rk-kicker">CONNECT A WEBSITE</span><Icon name="link" size={18} /></div><form onSubmit={createConnection}><label htmlFor="site-url">Website URL <strong>Required</strong></label><input id="site-url" type="text" inputMode="url" placeholder="https://example.com/orders/123" value={urlInput} onChange={event => setUrlInput(event.target.value)} required /><label htmlFor="site-goal">What would you like to do? <span>Optional</span></label><textarea id="site-goal" rows={3} value={goalInput} onChange={event => setGoalInput(event.target.value)} placeholder="Leave this blank and discover what you can do here." /><div className="rk-form-bottom"><span>Kane starts with a bounded, read-only inspection.</span><button className="rk-primary" type="submit" disabled={Boolean(busy)}>{busy === 'connect' ? 'Connecting…' : 'Discover actions'} <Icon name="arrow" size={17} /></button></div></form></section><aside className="rk-start-side"><div className="rk-start-illustration"><div className="rk-orbit one" /><div className="rk-orbit two" /><span className="rk-orbit-core"><Icon name="shield" size={30} /></span><span className="rk-orbit-label first">Your website</span><span className="rk-orbit-label second">Your choices</span><span className="rk-orbit-label third">Checked outcome</span></div><div className="rk-privacy-note"><Icon name="shield" size={17} /><p>A dedicated browser keeps this connection separate from your everyday Chrome profile. Page content and screenshots are sent to TestMu AI for processing; evidence may be uploaded to Test Manager.</p></div></aside></div>{connections.length > 0 && <section className="rk-history"><div className="rk-section-head"><div><span className="rk-kicker">PICK UP WHERE YOU LEFT OFF</span><h2>Recent websites</h2></div><span className="rk-muted-small">{connections.length} saved</span></div><div className="rk-history-grid">{connections.map(item => <button type="button" key={item.id} onClick={() => openHistory(item.id)} disabled={Boolean(busy)}><span className="rk-site-avatar">{(item.siteTitle || item.origin || 'W').charAt(0).toUpperCase()}</span><span><strong>{item.siteTitle || item.origin || item.url}</strong><small>{item.origin || item.url}</small></span><span className="rk-history-status">{item.status}</span><Icon name="arrow" size={16} /></button>)}</div></section>}</> : <>
        <div className="rk-workspace-heading"><div><span className="rk-kicker">CONNECTED WEBSITE <span className="rk-workspace-id">{connection.id?.slice(0, 8)}</span></span><h1>{connection.siteTitle || connection.origin || connection.url}</h1><a href={safeUrl(connection.url) || '#'} target="_blank" rel="noreferrer" className="rk-origin-link">{connection.url} <Icon name="link" size={13} /></a></div><div className="rk-header-actions"><button type="button" className="rk-quiet" disabled={pausing} onClick={newConnection}>Connect another website</button>{connected && <button type="button" className="rk-quiet" disabled={Boolean(busy) || pausing} onClick={disconnect}>Disconnect</button>}</div></div>
        {error && <div className="rk-alert" role="alert">{error}<button type="button" onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}
        {(connection.error || workflow?.error) && <div className="rk-alert" role="status">{workflow?.error || connection.error}</div>}
        <div className="rk-session-strip"><span className={`rk-status-dot ${connection.status}`} /><strong>{connection.status?.replaceAll('_', ' ')}</strong><span>{connection.account?.label || (connection.account?.status === 'signed_in' ? 'Signed-in account' : 'Account not confirmed')}</span>{connection.observedAt && <small>Observed {displayDate(connection.observedAt)}</small>}</div>
        <div className="rk-workspace-grid"><div className="rk-main-column">
          {workflow ? <><div className="rk-workflow-nav"><button type="button" disabled={pausing} onClick={backToActions}>← All discovered actions</button><span>WORKFLOW REVISION {workflow.revision || 1}</span></div><CurrentStep eyebrow="CURRENT STEP" title={workflowStep.title} detail={workflowStep.detail} busy={workflowBusy}>
            {workflow.status === 'result_unknown' && <button className="rk-primary" disabled={workflowActionDisabled} onClick={() => mutation('reconcile', `/api/workflows/${workflow.id}/reconcile`, {}, 'workflow')}>Reconcile source result <Icon name="arrow" size={16} /></button>}{workflow.status === 'needs_sign_in' && connection.status === 'ready' && <button className="rk-primary" disabled={workflowActionDisabled} onClick={() => mutation('inspect-action', `/api/workflows/${workflow.id}/answer`, { answers: workflow.answers || {}, constraints: workflow.constraints || [] }, 'workflow')}>Continue this action <Icon name="arrow" size={16} /></button>}{['error', 'blocked'].includes(workflow.status) && <button className="rk-primary" disabled={workflowActionDisabled} onClick={() => mutation('inspect-action', `/api/workflows/${workflow.id}/answer`, { answers: workflow.answers || {}, constraints: workflow.constraints || [] }, 'workflow')}>Inspect this action again <Icon name="arrow" size={16} /></button>}
          </CurrentStep>{workflow.progress && workflowBusy && <Progress value={workflow.progress} fallback="Kane is checking the website." />}
            <section className="rk-panel rk-action-summary"><div className="rk-panel-head"><span className="rk-kicker">SELECTED ACTION</span><span className="rk-stage">{workflow.observationStage || workflow.status?.replaceAll('_', ' ')}</span></div><h2>{workflow.action?.title || 'Selected website action'}</h2>{workflow.action?.description && <p>{workflow.action.description}</p>}<SourceQuote>{workflow.action?.sourceQuote}</SourceQuote>{workflow.goal && <p className="rk-goal"><strong>Your goal:</strong> {workflow.goal}</p>}</section>
            {canAnswer && questions.some(question => !sensitiveQuestion(question)) && <section className="rk-panel"><div className="rk-panel-head"><span className="rk-kicker">WHAT THE WEBSITE NEEDS</span><span className="rk-muted-small">{questions.length} questions</span></div><form className="rk-questions" onSubmit={submitAnswers}>{questions.filter(question => !sensitiveQuestion(question)).map(question => <label key={question.id}>{question.label}{question.required && <b>Required</b>}{question.type === 'select' ? <select value={answers[question.id] ?? ''} required={Boolean(question.required)} onChange={event => setAnswers(current => ({ ...current, [question.id]: event.target.value }))}><option value="">Choose an option</option>{(question.options || []).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type={['number', 'date'].includes(question.type) ? question.type : 'text'} value={answers[question.id] ?? ''} required={Boolean(question.required)} onChange={event => setAnswers(current => ({ ...current, [question.id]: event.target.value }))} />}</label>)}<label className="rk-constraint-input">What should Raising Kane preserve? <span>Optional</span><input type="text" value={constraintInput} onChange={event => setConstraintInput(event.target.value)} placeholder="For example, do not change my refund method" /></label><button className={workflow.status === 'needs_input' ? 'rk-primary' : 'rk-secondary'} type="submit" disabled={workflowActionDisabled}>{busy === 'answer' ? 'Saving…' : 'Save answers and constraints'} <Icon name="arrow" size={16} /></button></form></section>}
            {canAnswer && questions.length === 0 && <section className="rk-panel rk-constraint-only"><div className="rk-panel-head"><span className="rk-kicker">PRESERVE YOUR INTENT</span><Icon name="shield" size={17} /></div><form onSubmit={submitAnswers}><label>What must stay true? <span>Optional</span><input type="text" value={constraintInput} onChange={event => setConstraintInput(event.target.value)} placeholder="For example, keep the original refund method" /></label><button className="rk-secondary" type="submit" disabled={!constraintInput.trim() || workflowActionDisabled}>Save constraint</button></form></section>}
            {!pausing && questions.some(sensitiveQuestion) && <div className="rk-alert rk-soft-alert">A sign-in or verification question was detected. Enter sensitive details directly on the original website using Take over.</div>}
            {constraints.length > 0 && <section className="rk-panel"><div className="rk-panel-head"><span className="rk-kicker">WHAT MUST STAY TRUE</span><Icon name="shield" size={17} /></div><ul className="rk-constraints">{constraints.map((item, index) => <li key={index}><Icon name="check" size={15} />{textOf(item)}</li>)}</ul></section>}
            {options.length > 0 && ['options_observed', 'draft_checked', 'approved', 'submitting', 'result_unknown'].includes(workflow.status) && <section className="rk-panel"><div className="rk-panel-head"><span className="rk-kicker">SOURCE-BACKED OPTIONS</span><span className="rk-muted-small">{options.length} observed</span></div><h2>Compare what changes</h2><div className="rk-options">{options.map(option => <button type="button" className={`rk-option ${candidateOption === option.id ? 'selected' : ''}`} key={option.id} onClick={() => setCandidateOption(option.id)} disabled={workflowActionDisabled || ['needs_input', 'approved', 'submitting', 'result_unknown'].includes(workflow.status)}><span className="rk-option-radio" /><span className="rk-option-body"><strong>{option.label}</strong>{option.price != null && <small className="rk-option-price">{textOf(option.price)}</small>}<ItemList title="WHAT CHANGES" items={option.changes} /><ItemList title="REQUIREMENTS" items={option.requirements} /><ItemList title="AFTERWARD" items={option.nextSteps} /><SourceQuote>{option.sourceQuote}</SourceQuote><span className="rk-knowledge">Terms observed{option.reversible ? ' · Reversible draft' : ''}</span></span></button>)}</div>{workflow.status === 'options_observed' && candidateOption !== workflow.selectedOptionId && <div className="rk-panel-action"><button type="button" className="rk-primary" disabled={!candidateOption || requiredUnanswered || workflowActionDisabled} onClick={chooseOption}>Choose observed option <Icon name="arrow" size={16} /></button></div>}</section>}
            {proposal && ['options_observed', 'draft_checked', 'approved', 'submitting', 'result_unknown'].includes(workflow.status) && <section className="rk-panel rk-proposal"><div className="rk-panel-head"><span className="rk-kicker">EXACT PROPOSAL</span><span className="rk-stage">{workflow.status === 'draft_checked' ? 'Draft checked' : workflow.status?.replaceAll('_', ' ')}</span></div><h2>{proposal.summary || 'Review these terms'}</h2><div className="rk-terms">{(proposal.terms || []).map((term, index) => <div key={index}><span>{term.label}</span><strong>{textOf(term.value)}</strong></div>)}</div><ItemList title="WHAT CHANGES" items={proposal.changes} /><ItemList title="REQUIREMENTS" items={proposal.requirements} /><ItemList title="NEXT STEPS" items={proposal.nextSteps} />{proposal.sourceUrl && safeUrl(proposal.sourceUrl) && <a className="rk-inline-link" href={safeUrl(proposal.sourceUrl)} target="_blank" rel="noreferrer">Inspect proposal on the website <Icon name="link" size={14} /></a>}{checks.length > 0 && <div className="rk-checks">{checks.map((check, index) => <div key={index} className={`rk-check ${check.status}`}><span>{check.status === 'match' ? '✓' : check.status === 'conflict' ? '!' : '·'}</span><div><strong>{check.label}</strong><p>{check.detail}</p></div></div>)}</div>}{workflow.status === 'options_observed' && (!options.length || workflow.selectedOptionId) && <div className="rk-panel-action"><button className="rk-primary" type="button" disabled={workflowActionDisabled || requiredUnanswered} onClick={() => mutation('check', `/api/workflows/${workflow.id}/check`, {}, 'workflow')}>Check this proposal <Icon name="arrow" size={16} /></button></div>}{workflow.status === 'draft_checked' && <div className="rk-panel-action"><button className="rk-primary" type="button" disabled={workflowActionDisabled || !checkable} onClick={() => mutation('approve', `/api/workflows/${workflow.id}/approve`, { revision: workflow.revision }, 'workflow')}>Approve this revision <Icon name="arrow" size={16} /></button></div>}{workflow.status === 'approved' && <div className="rk-panel-action"><p>Raising Kane will recheck the approved terms before acting. If they changed, this approval is invalid.</p><button className="rk-primary" type="button" disabled={workflowActionDisabled} onClick={() => mutation('execute', `/api/workflows/${workflow.id}/execute`, {}, 'workflow')}>{proposal.executionKind === 'read' ? 'Verify source result' : 'Perform approved action'} <Icon name="arrow" size={16} /></button></div>}</section>}
            {workflow.status === 'result_verified' && workflow.receipt && <section className="rk-panel rk-receipt"><div className="rk-receipt-icon"><Icon name="check" size={22} /></div><span className="rk-kicker">RESULT VERIFIED</span><h2>{workflow.receipt.title || 'Source result verified'}</h2><p>{workflow.receipt.summary}</p>{workflow.receipt.recordId && <div className="rk-record-id">Record {workflow.receipt.recordId}</div>}<div className="rk-terms">{(workflow.receipt.fields || []).map((field, index) => <div key={index}><span>{field.label}</span><strong>{textOf(field.value)}</strong></div>)}</div><ItemList title="WHAT HAPPENS NEXT" items={workflow.receipt.nextSteps} />{safeUrl(workflow.receipt.sourceUrl) && <a className="rk-inline-link" href={safeUrl(workflow.receipt.sourceUrl)} target="_blank" rel="noreferrer">Open source record <Icon name="link" size={14} /></a>}{workflow.receipt.verifiedAt && <small>Verified {displayDate(workflow.receipt.verifiedAt)}</small>}</section>}
            {(workflow.limitations || []).length > 0 && <section className="rk-panel"><div className="rk-panel-head"><span className="rk-kicker">CURRENT LIMITS</span></div><ul className="rk-limitations">{workflow.limitations.map((item, index) => <li key={index}>{textOf(item)}</li>)}</ul></section>}
          </> : <><CurrentStep eyebrow="CURRENT STEP" title={connectionStep.title} detail={connectionStep.detail} busy={connectionBusy}>{connection.status === 'needs_sign_in' && <button className="rk-primary" disabled={Boolean(busy)} onClick={() => mutation('takeover', `/api/connections/${connection.id}/takeover`, {})}>Take over sign-in <Icon name="arrow" size={16} /></button>}{connection.status === 'error' && <button className="rk-primary" disabled={Boolean(busy)} onClick={() => mutation('inspect', `/api/connections/${connection.id}/inspect`, {})}>Inspect again <Icon name="arrow" size={16} /></button>}</CurrentStep>{connection.progress && connectionBusy && <Progress value={connection.progress} fallback="Kane is inspecting the website." />}
            {actions.length > 0 && <section className="rk-actions-section"><div className="rk-section-head"><div><span className="rk-kicker">DISCOVERED ON THIS WEBSITE</span><h2>Useful actions</h2></div><span className="rk-muted-small">{actions.length} found so far</span></div><div className="rk-action-cards">{actions.map(action => <button className="rk-action-card" type="button" key={action.id} disabled={Boolean(busy) || connection.status !== 'ready'} onClick={() => openWorkflow(action.id)}><span className="rk-action-top"><span className="rk-kind">{action.kind || 'unknown'} action</span><Icon name="arrow" size={18} /></span><strong>{action.title}</strong>{action.description && <p>{action.description}</p>}<ItemList title="BEFORE YOU START" items={action.prerequisites} /><SourceQuote>{action.sourceQuote}</SourceQuote><span className="rk-card-foot">Action discovered · Terms still to inspect</span></button>)}</div></section>}
            {records.length > 0 && <section className="rk-panel"><div className="rk-panel-head"><span className="rk-kicker">RECORDS ON THIS PAGE</span><span className="rk-muted-small">{records.length} observed</span></div><div className="rk-records">{records.map(record => <article key={record.id} className="rk-record"><h3>{record.title}</h3>{record.details && <p>{textOf(record.details)}</p>}<SourceQuote>{record.sourceQuote}</SourceQuote>{safeUrl(record.url) && <a href={safeUrl(record.url)} target="_blank" rel="noreferrer">Open record <Icon name="link" size={13} /></a>}</article>)}</div></section>}
            {connection.status === 'ready' && <button type="button" className="rk-discover-more" disabled={Boolean(busy)} onClick={() => mutation('inspect', `/api/connections/${connection.id}/inspect`, {})}><Icon name="reload" size={15} /> Discover more from this page</button>}
          </>}
        </div><aside className="rk-side-column"><section className="rk-panel rk-browser-panel"><div className="rk-panel-head"><span className="rk-kicker">YOUR BROWSER SESSION</span><Icon name="eye" size={17} /></div><p>This connection uses a dedicated Chrome session. Open the original website to inspect it yourself.</p><div className="rk-browser-actions"><button type="button" onClick={() => mutation('open', `/api/connections/${connection.id}/open`, {})} disabled={!connected || connectionBusy || workflowBusy}>Open website <Icon name="link" size={14} /></button>{connected && connection.status !== 'human_control' && <button type="button" onClick={() => mutation('takeover', `/api/connections/${connection.id}/takeover`, {})} disabled={Boolean(busy) || pausing}>Take over <Icon name="pause" size={14} /></button>}</div>{(needsHuman || connection.status === 'human_control') && <div className="rk-handoff"><strong>Finish sign-in on the original website.</strong><p>Passwords, OTPs, passkeys and CAPTCHAs stay in that browser. They are never entered here.</p><p>{connection.processingNotice}</p><label><input type="checkbox" checked={processingAcknowledged} onChange={event => setProcessingAcknowledged(event.target.checked)} /><span>I understand Kane sends page content and screenshots to TestMu AI for processing and may upload run evidence when I continue.</span></label><button type="button" className="rk-primary" disabled={!processingAcknowledged || Boolean(busy)} onClick={resume}>Continue with Kane <Icon name="arrow" size={15} /></button></div>}</section><Evidence entries={workflow ? workflowEvidence : connectionEvidence} />{workflow?.records?.length > 0 && <section className="rk-panel"><div className="rk-panel-head"><span className="rk-kicker">RELEVANT RECORDS</span></div><div className="rk-records">{workflow.records.map(record => <article key={record.id} className="rk-record"><h3>{record.title}</h3>{record.details && <p>{textOf(record.details)}</p>}<SourceQuote>{record.sourceQuote}</SourceQuote>{safeUrl(record.url) && <a href={safeUrl(record.url)} target="_blank" rel="noreferrer">Open record <Icon name="link" size={13} /></a>}</article>)}</div></section>}</aside></div>
      </>}
      {error && !connection && <div className="rk-alert rk-start-error" role="alert">{error}<button type="button" onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}
      {loading && <p className="rk-loading">Restoring your workspace…</p>}
    </main><footer className="rk-footer"><Brand /><span>When websites raise hell, raise Kane</span><a href="?demo=merchant">Simulated merchant demo</a></footer>
  </div>
}

export default function App() {
  return params.get('demo') === 'merchant' || params.has('taskId') ? <MerchantDemo /> : <UrlProduct />
}
