import { useCallback, useEffect, useRef, useState } from 'react'

const EXAMPLE = 'Return the red shoes, keep the jacket, and refund my original payment method.'
const TASK_KEY = 'raising-kane-task-id'

function Icon({ name, size = 18 }) {
  const paths = {
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    check: <path d="m4 12 5 5L20 6" />,
    eye: <><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" /><circle cx="12" cy="12" r="2.4" /></>,
    link: <><path d="M10 14 21 3m-8 0h8v8" /><path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" /></>,
    refresh: <><path d="M20 11a8 8 0 1 0-2.4 6" /><path d="M20 4v7h-7" /></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
    spark: <><path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Z" /><path d="m19 17 .7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7L19 17Z" /></>,
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

const pretty = value => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
const money = (cents, currency = 'USD') => cents == null || Number.isNaN(Number(cents))
  ? 'Not confirmed'
  : new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(cents) / 100)
const sourceDraft = task => task?.merchant?.draft || task?.merchant || {}

function EventLine({ event }) {
  const eventText = typeof event === 'string' ? event : event.text || event.summary || event.message
  const rawTime = typeof event === 'object' && (event.at || event.time)
  const time = rawTime && !Number.isNaN(new Date(rawTime).getTime())
    ? new Date(rawTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null
  return <li className="event-line"><span className="event-dot" /><div><p>{eventText}</p>{time && <small>{time}</small>}</div></li>
}

export default function App() {
  const [request, setRequest] = useState(EXAMPLE)
  const [task, setTask] = useState(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState(null)
  const [reason, setReason] = useState('too_small')
  const [viewSource, setViewSource] = useState(false)
  const taskRef = useRef(null)

  const updateTask = useCallback(next => {
    if (!next) return
    taskRef.current = next
    setTask(next)
    if (next.id) localStorage.setItem(TASK_KEY, next.id)
  }, [])

  useEffect(() => {
    api('/api/status').then(setStatus).catch(() => setStatus({ kaneAvailable: false }))
    const previous = localStorage.getItem(TASK_KEY)
    if (previous) api(`/api/tasks/${encodeURIComponent(previous)}`)
      .then(data => updateTask(data.task || data))
      .catch(() => localStorage.removeItem(TASK_KEY))
  }, [updateTask])

  useEffect(() => {
    if (!task?.id) return undefined
    const timer = setInterval(() => {
      api(`/api/tasks/${encodeURIComponent(task.id)}`)
        .then(data => {
          const next = data.task || data
          if (next.id === taskRef.current?.id) updateTask(next)
        })
        .catch(() => {})
    }, 2200)
    return () => clearInterval(timer)
  }, [task?.id, updateTask])

  useEffect(() => {
    const draftReason = sourceDraft(task).reason
    if (draftReason) setReason(draftReason)
  }, [task?.merchant?.draft?.reason, task?.merchant?.reason])

  const action = async (name, path, body) => {
    setError('')
    setBusy(name)
    try {
      const data = await api(path, body)
      updateTask(data.task || data)
    } catch (failure) {
      setError(failure.message)
      if (taskRef.current?.id) api(`/api/tasks/${encodeURIComponent(taskRef.current.id)}`)
        .then(data => updateTask(data.task || data)).catch(() => {})
    } finally {
      setBusy('')
    }
  }
  const start = event => {
    event.preventDefault()
    if (request.trim()) action('start', '/api/tasks', { request: request.trim() })
  }

  const taskId = task?.id
  const draft = sourceDraft(task)
  const intent = task?.intent || {}
  const checks = Array.isArray(task?.checks) ? task.checks : []
  const events = Array.isArray(task?.events) ? task.events : []
  const evidence = Array.isArray(task?.evidence) ? task.evidence : []
  const receipt = task?.receipt
  const approval = task?.approval
  const hasConflict = checks.some(check => ['conflict', 'mismatch', 'failed'].includes(check.status))
  const hasUnknown = checks.some(check => ['unknown', 'pending', 'unverified'].includes(check.status))
  const allMatch = checks.length > 0 && !hasConflict && !hasUnknown
  const method = draft.method || draft.returnMethod
  const destination = draft.destination || draft.refundDestination
  const sourceUrl = taskId ? `/merchant?taskId=${encodeURIComponent(taskId)}` : '/merchant'
  const isWorking = Boolean(busy) || ['running', 'working', 'checking', 'submitting', 'reconciling'].includes(task?.status)

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="/" aria-label="Raising Kane home"><span className="brand-mark"><Icon name="spark" size={21} /></span><span>raising<span className="brand-accent">kane</span><span className="brand-period">.</span></span></a>
      <div className="topbar-right"><span className="header-label">When websites raise hell, raise Kane</span><span className={`connection-pill ${status?.kane?.available ? 'connected' : ''}`}><span className="connection-dot" />{status === null ? 'Checking Kane' : status.kane?.available ? 'Kane ready' : 'Kane unavailable'}</span></div>
    </header>

    <main>
      <section className="intro">
        <div className="intro-copy"><div className="section-kicker"><span className="kicker-line" /> YOUR INTENT, INTACT</div><h1>Websites are complicated.<br /><em>Getting things done</em> shouldn’t be.</h1><p>Tell Raising Kane what you want. It works through the real website, remembers your choices, and shows you exactly what happened.</p></div>
        <div className="intro-art" aria-hidden="true"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-center"><Icon name="shield" size={36} /></div><span className="art-tag tag-intent">Your request</span><span className="art-tag tag-source">The website</span><span className="art-tag tag-result">A checked result</span></div>
      </section>

      {!task ? <section className="start-layout" aria-label="Start a return task">
        <div className="start-card"><div className="card-index">01 / START HERE</div><h2>What do you need to do?</h2><p className="muted">Start with a return. Say it in your own words.</p><form onSubmit={start}><label className="field-label" htmlFor="request">Your request</label><textarea id="request" value={request} onChange={event => setRequest(event.target.value)} rows={4} placeholder="For example: Return the red shoes, keep the jacket…" /><div className="form-footer"><button className="text-button" type="button" onClick={() => setRequest(EXAMPLE)}>Use example</button><button className="primary-button" type="submit" disabled={Boolean(busy) || !request.trim()}>{busy === 'start' ? 'Starting…' : 'Start with Raising Kane'} <Icon name="arrow" /></button></div></form></div>
        <aside className="start-side"><div className="mini-step"><span>1</span><div><strong>Say what matters</strong><p>Return the shoes. Keep the jacket. Refund the card.</p></div></div><div className="mini-step"><span>2</span><div><strong>See the real choices</strong><p>Kane works through the merchant’s actual forms.</p></div></div><div className="mini-step"><span>3</span><div><strong>Approve the exact result</strong><p>See changes, costs, and source confirmation.</p></div></div><div className="sandbox-note"><span className="sandbox-icon">i</span><p><strong>Demo environment</strong><br />This flow uses a fictional merchant and a simulated order.</p></div></aside>
      </section> : <section className="workspace" aria-label="Return task workspace">
        <div className="workspace-heading"><div><div className="section-kicker"><span className="kicker-line" /> ACTIVE TASK <span className="task-id">{task.id}</span></div><h2>Your return, without the maze.</h2><p>We’ll keep your choices in view as the website changes.</p></div><a className="source-link" href={sourceUrl} target="_blank" rel="noreferrer">Open merchant sandbox <Icon name="link" size={15} /></a></div>
        <div className="workspace-grid"><div className="main-column">
          {task.error && <div className="task-alert" role="status">{task.error}</div>}
          {task.interpretation?.source === 'sample-parser' && <p className="parser-note">Sample request parser is active. OpenAI interpretation is not connected for this task.</p>}
          <article className="panel intent-panel"><div className="panel-topline"><span className="panel-label">WHAT YOU WANT</span><span className="revision-pill">Revision {task.revision || 1}</span></div><p className="request-quote">“{task.request || request}”</p><div className="intent-list"><div><span className="intent-symbol return">↗</span><span><small>RETURN</small><strong>{intent.item || 'Red shoes · size 8'}</strong></span></div><div><span className="intent-symbol keep">✓</span><span><small>KEEP</small><strong>{intent.exclude || 'Jacket'}</strong></span></div><div><span className="intent-symbol refund">$</span><span><small>REFUND TO</small><strong>{pretty(intent.refundDestination || 'Original payment method')}</strong></span></div>{intent.noPrinter && <div><span className="intent-symbol no-printer">◒</span><span><small>RETURN METHOD</small><strong>No printer needed</strong></span></div>}</div>{!intent.noPrinter && !receipt && <button className="intent-revise" type="button" disabled={isWorking} onClick={() => action('choice', `/api/tasks/${taskId}/choice`, { method: 'qr', noPrinter: true })}>I don’t have a printer <Icon name="arrow" size={16} /></button>}</article>

          {receipt ? <article className="panel receipt-panel" aria-live="polite"><div className="receipt-icon"><Icon name="check" size={25} /></div><span className="panel-label">RETURN CONFIRMED IN SOURCE</span><h3>Return requested.<br /><em>Refund pending.</em></h3><p>The merchant sandbox recorded this return request. Save the request ID and follow the next step below.</p><div className="receipt-grid"><div><small>REQUEST ID</small><strong>{receipt.id || receipt.requestId || receipt.returnId || 'Pending confirmation'}</strong></div><div><small>REFUND DESTINATION</small><strong>{pretty(receipt.destination || receipt.refundDestination || destination)}</strong></div><div><small>EXPECTED REFUND</small><strong>{money(receipt.refundCents ?? receipt.expectedRefundCents ?? draft.expectedRefundCents, receipt.currency || draft.currency)}</strong></div><div><small>NEXT STEP</small><strong>{receipt.nextStep || 'Bring the shoes to the drop-off point.'}</strong></div></div></article> : <article className="panel decision-panel"><div className="panel-topline"><span className="panel-label">THE DECISIONS</span><span className={`status-chip ${isWorking ? 'working' : ''}`}>{isWorking ? 'Kane is working' : pretty(task.status || 'Ready')}</span></div><h3>Make the choices that matter.</h3><p className="muted">The available options come from the merchant sandbox.</p><div className="choice-block"><label htmlFor="reason">Why are you returning the shoes?</label><div className="choice-row"><select id="reason" value={reason} onChange={event => setReason(event.target.value)} disabled={isWorking}><option value="too_small">Too small</option><option value="changed_mind">Changed my mind</option><option value="damaged">Damaged</option></select><button type="button" className="secondary-button" disabled={isWorking} onClick={() => action('choice', `/api/tasks/${taskId}/choice`, { reason })}>Save reason</button></div></div><div className="choice-block method-block"><span className="choice-label">How would you like to return it?</span><div className="method-options"><div className={`method-option ${method === 'label' || method === 'print_label' ? 'selected' : ''}`}><strong>Print a label</strong><small>Current standard option</small></div><button type="button" className={`method-option ${method === 'qr' || method === 'qr_dropoff' ? 'selected' : ''}`} disabled={isWorking} onClick={() => action('choice', `/api/tasks/${taskId}/choice`, { method: 'qr', noPrinter: true })}><strong>No printer · QR drop-off</strong><small>Merchant may deduct $5</small></button></div></div><button className="check-button" type="button" disabled={isWorking} onClick={() => action('check', `/api/tasks/${taskId}/check`, {})}><Icon name="refresh" size={17} /> {busy === 'check' ? 'Checking…' : hasConflict ? 'Repair the mismatch' : 'Check my choices'}</button></article>}

          {!receipt && checks.length > 0 && <article className={`panel checks-panel ${hasConflict ? 'has-conflict' : ''}`}><div className="panel-topline"><span className="panel-label">CHECKED AGAINST YOUR REQUEST</span><span>{hasConflict ? 'Needs attention' : allMatch ? 'All matched' : 'Some checks pending'}</span></div>{checks.map((check, index) => <div className={`check-row check-${check.status || 'unknown'}`} key={`${check.label}-${index}`}><span className="check-symbol">{['match', 'passed', 'ok'].includes(check.status) ? '✓' : ['conflict', 'mismatch', 'failed'].includes(check.status) ? '!' : '·'}</span><div><strong>{check.label || check.name}</strong><p>{check.detail || check.message}</p></div></div>)}{hasConflict && <p className="conflict-explainer">The merchant changed a choice that matters. Raising Kane will show the difference before you approve anything.</p>}</article>}

          {!receipt && <article className="panel review-panel"><div className="panel-topline"><span className="panel-label">REVIEW &amp; APPROVE</span><Icon name="shield" /></div><h3>The exact proposal</h3><div className="review-summary"><div><span>Return</span><strong>{draft.selectedLines?.map(line => `${line.name} (${line.variant})`).join(', ') || 'Not yet observed'}</strong></div><div><span>Method</span><strong>{pretty(method) || 'Not selected'}</strong></div><div><span>Refund to</span><strong>{pretty(destination) || 'Not confirmed'}</strong></div><div><span>Deduction</span><strong>{money(draft.deductionCents ?? draft.feeCents, draft.currency)}</strong></div><div className="review-total"><span>Expected refund</span><strong>{money(draft.expectedRefundCents ?? draft.refundCents, draft.currency)}</strong></div></div><div className="review-actions"><button className="secondary-button" type="button" disabled={isWorking || !allMatch || Boolean(approval)} onClick={() => action('approve', `/api/tasks/${taskId}/approve`, {})}>{approval ? 'Approved for this revision' : 'Approve this proposal'}</button><button className="primary-button" type="button" disabled={isWorking || !approval || !allMatch} onClick={() => action('submit', `/api/tasks/${taskId}/submit`, {})}>{busy === 'submit' ? 'Submitting…' : 'Submit return request'} <Icon name="arrow" /></button></div><p className="approval-note">Submission requires your approval of this exact version. If the merchant changes it, we’ll ask again.</p></article>}
        </div><aside className="side-column"><article className="panel source-panel"><div className="panel-topline"><span className="panel-label">THE ACTUAL WEBSITE</span><Icon name="eye" size={17} /></div><h3>Source, not guesswork.</h3><p>Raising Kane uses Kane CLI to operate the merchant’s live form. You can inspect the same source.</p><div className="source-frame-header"><span className="source-dot" /><span>Merchant sandbox — simulated order</span></div>{viewSource ? <iframe title="Merchant sandbox — simulated order" src={sourceUrl} className="source-frame" /> : <div className="source-preview">{draft.orderId ? <><div className="preview-order">Order <strong>{draft.orderId}</strong></div>{draft.lines?.map(line => <div className="preview-line" key={line.id}><span>{line.name}</span><strong>{draft.selectedLineIds?.includes(line.id) ? 'Selected for return' : 'Keep'}</strong></div>)}<div className="preview-divider" /><span className="preview-caption">Last corroborated source draft. Open the source for its current state.</span></> : <p>Waiting for Kane’s first source observation.</p>}</div>}<button type="button" className="source-toggle" onClick={() => setViewSource(current => !current)}>{viewSource ? 'Hide source preview' : 'Show live source preview'} <Icon name="arrow" size={15} /></button></article><article className="panel evidence-panel"><div className="panel-topline"><span className="panel-label">KANE EVIDENCE</span><span className="evidence-count">{evidence.length} checks</span></div>{evidence.length ? <ul>{evidence.map((item, index) => <li key={`${item.phase}-${index}`}><span className={`evidence-state ${item.status || ''}`} /> <div><strong>{pretty(item.phase || 'Browser check')}</strong><p>{item.summary || item.message || pretty(item.status)}</p>{item.url && <a href={item.url} target="_blank" rel="noreferrer">Open evidence ↗</a>}</div></li>)}</ul> : <p className="empty-evidence">Kane browser checks will appear here as they complete.</p>}</article><article className="panel activity-panel"><div className="panel-topline"><span className="panel-label">ACTIVITY</span><span className="live-pulse" /></div>{events.length ? <ol>{events.slice().reverse().slice(0, 7).map((event, index) => <EventLine event={event} key={`${index}-${typeof event === 'object' ? event.at : event}`} />)}</ol> : <p className="empty-evidence">Your task activity will appear here.</p>}</article></aside></div>
      </section>}
      {error && <div className="error-toast" role="alert"><strong>Couldn’t finish that step.</strong><span>{error}</span><button type="button" onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}
    </main>
    <footer className="footer"><span>raising<span className="brand-accent">kane</span>.</span><p>One supported return flow · Merchant sandbox with simulated data · Powered by Kane CLI</p></footer>
  </div>
}
