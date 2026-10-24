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
const evidenceSummary = item => item.phase === 'validate-review' && item.status !== 'passed'
  ? 'Kane could not confirm that this draft matched your saved choices. Your request stays unchanged.'
  : item.summary || item.message || pretty(item.status)

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
  const [reason, setReason] = useState('')
  const [viewSource, setViewSource] = useState(false)
  const taskRef = useRef(null)

  const updateTask = useCallback(next => {
    if (!next) return
    taskRef.current = next
    setTask(next)
    if (next.id) {
      localStorage.setItem(TASK_KEY, next.id)
      const url = new URL(window.location.href)
      if (url.searchParams.get('taskId') !== next.id) {
        url.searchParams.set('taskId', next.id)
        window.history.replaceState(null, '', url.toString())
      }
    }
  }, [])

  useEffect(() => {
    api('/api/status').then(setStatus).catch(() => setStatus({ kaneAvailable: false }))
    const sharedTask = new URLSearchParams(window.location.search).get('taskId')
    const previous = sharedTask || localStorage.getItem(TASK_KEY)
    if (previous) api(`/api/tasks/${encodeURIComponent(previous)}`)
      .then(data => updateTask(data.task || data))
      .catch(error => {
        if (sharedTask) setError(`Could not open the shared task: ${error.message}`)
        else localStorage.removeItem(TASK_KEY)
      })
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
    const observed = sourceDraft(task)
    setReason(task?.reason || observed.reason || observed.reasons?.[0]?.value || '')
  }, [task?.reason, task?.merchant?.draft?.reason, task?.merchant?.reason, task?.merchant?.reasons?.length])

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
  const startAnother = () => {
    taskRef.current = null
    localStorage.removeItem(TASK_KEY)
    const url = new URL(window.location.href)
    url.searchParams.delete('taskId')
    window.history.replaceState(null, '', url.toString())
    setTask(null)
    setRequest(EXAMPLE)
    setReason('')
    setError('')
    setViewSource(false)
  }

  const taskId = task?.id
  const draft = sourceDraft(task)
  const intent = task?.intent || {}
  const checks = Array.isArray(task?.checks) ? task.checks : []
  const events = Array.isArray(task?.events) ? task.events : []
  const evidence = Array.isArray(task?.evidence) ? task.evidence : []
  const receipt = task?.status === 'complete' ? task.receipt : null
  const sourceReturn = task?.sourceReturn
  const approval = task?.approval
  const hasConflict = checks.some(check => ['conflict', 'mismatch', 'failed'].includes(check.status))
  const hasUnknown = checks.some(check => ['unknown', 'pending', 'unverified'].includes(check.status))
  const allMatch = checks.length > 0 && !hasConflict && !hasUnknown
  const proposalReady = Boolean(task?.reason) && ['ready', 'conflict', 'approved'].includes(task?.status)
  const method = draft.method || draft.returnMethod
  const destination = draft.destination || draft.refundDestination
  const reasonOptions = Array.isArray(draft.reasons) ? draft.reasons : []
  const methodOptions = Array.isArray(draft.methods) ? draft.methods : []
  const reasonLabel = reasonOptions.find(option => option.value === draft.reason)?.label || (draft.reason ? pretty(draft.reason) : '')
  const sourceUrl = taskId ? `/merchant?taskId=${encodeURIComponent(taskId)}` : '/merchant'
  const isWorking = Boolean(busy) || ['created', 'running', 'working', 'checking', 'submitting'].includes(task?.status)
  const canEdit = !isWorking && !task?.submissionStarted && !sourceReturn && !['submitted_unverified', 'reconciling', 'complete'].includes(task?.status)
  const needsRecheck = ['submitted_unverified', 'reconciling'].includes(task?.status) || (task?.status === 'complete' && !receipt)
  const step = !task ? null : receipt
    ? { number: 4, title: 'Return confirmed', detail: 'Kane checked the merchant record. Your refund is pending.' }
    : needsRecheck
      ? { number: 4, title: 'Check the submitted return', detail: 'The source may have saved this request. Verify its result before claiming completion.' }
      : task.status === 'submitting'
        ? { number: 4, title: 'Submitting your approved return', detail: 'Kane is checking the source confirmation.' }
        : task.status === 'approved'
          ? { number: 3, title: 'Your proposal is approved', detail: task.retryReady ? 'A retry uses the same operation and approved terms.' : 'Submit this exact version to the merchant sandbox.' }
          : task.status === 'conflict'
            ? { number: 2, title: 'The website changed a choice', detail: checks.find(check => check.status === 'conflict')?.detail || 'The source differs from your request. Repair and check it.' }
            : task.status === 'ready'
              ? { number: 3, title: 'Review the exact proposal', detail: 'Your choices match the merchant draft. Approve what is shown below.' }
              : task.status === 'needs_reason'
                ? { number: 2, title: 'Choose a return reason', detail: 'Pick one of the reasons the merchant offers, then Kane can prepare the draft.' }
                : { number: task.reason ? 2 : 1, title: isWorking ? 'Kane is working on the source' : 'Check the merchant source', detail: 'The current merchant state is still being established.' }

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
        <div className="workspace-heading"><div><div className="section-kicker"><span className="kicker-line" /> ACTIVE TASK <span className="task-id">{task.id}</span></div><h2>Your return, without the maze.</h2><p>We’ll keep your choices in view as the website changes.</p></div><div className="workspace-links"><a className="source-link" href={sourceUrl} target="_blank" rel="noreferrer">Open merchant sandbox <Icon name="link" size={15} /></a><button className="new-demo-button" type="button" disabled={isWorking} onClick={startAnother}>Start another demo</button></div></div>
        <section className="current-step" aria-live="polite" aria-label="Current progress"><span className="current-step-number">{step.number} / 4</span><div><span className="panel-label">CURRENT STEP</span><h3>{step.title}</h3><p>{step.detail}</p></div>{needsRecheck && <button className="primary-button" type="button" disabled={Boolean(busy)} onClick={() => action('check', `/api/tasks/${taskId}/check`, { repair: task.status === 'conflict' })}>Check the submitted return <Icon name="arrow" /></button>}<div className="step-track" aria-hidden="true"><span style={{ width: `${step.number * 25}%` }} /></div></section>
        <div className="workspace-grid"><div className="main-column">
          {task.error && <div className="task-alert" role="status">{task.error}</div>}
          {task.interpretation?.source === 'sample-parser' && <p className="parser-note">Sample request parser is active. OpenAI interpretation is not connected for this task.</p>}
          <article className="panel intent-panel"><div className="panel-topline"><span className="panel-label">WHAT YOU WANT</span><span className="revision-pill">Revision {task.revision || 1}</span></div><p className="request-quote">“{task.request || request}”</p><div className="intent-list"><div><span className="intent-symbol return">↗</span><span><small>RETURN</small><strong>{intent.item || 'Red shoes · size 8'}</strong></span></div><div><span className="intent-symbol keep">✓</span><span><small>KEEP</small><strong>{intent.exclude || 'Jacket'}</strong></span></div><div><span className="intent-symbol refund">$</span><span><small>REFUND TO</small><strong>{pretty(intent.refundDestination || 'Original payment method')}</strong></span></div>{intent.noPrinter && <div><span className="intent-symbol no-printer">◒</span><span><small>RETURN METHOD</small><strong>No printer needed</strong></span></div>}</div>{!intent.noPrinter && !receipt && !sourceReturn && <button className="intent-revise" type="button" disabled={!canEdit || !task.reason} onClick={() => action('choice', `/api/tasks/${taskId}/choice`, { method: 'qr', noPrinter: true })}>I don’t have a printer <Icon name="arrow" size={16} /></button>}</article>

          {receipt ? <article className="panel receipt-panel" aria-live="polite">
            <div className="receipt-icon"><Icon name="check" size={25} /></div>
            <span className="panel-label">RETURN CONFIRMED IN SOURCE</span>
            <h3>Return requested.<br /><em>Refund pending.</em></h3>
            <p>The merchant sandbox recorded this return request and Kane verified its result.</p>
            <div className="receipt-grid">
              <div><small>REQUEST ID</small><strong>{receipt.requestId || receipt.id || receipt.returnId}</strong></div>
              <div><small>REFUND DESTINATION</small><strong>{pretty(receipt.refundDestination || receipt.destination)}</strong></div>
              <div><small>EXPECTED REFUND</small><strong>{money(receipt.expectedRefundCents ?? receipt.refundCents, receipt.currency)}</strong></div>
              <div><small>NEXT STEP</small><strong>{receipt.nextStep}</strong></div>
            </div>
          </article> : needsRecheck ? <article className="panel pending-panel" aria-live="polite">
            <span className="panel-label">SUBMISSION NEEDS VERIFICATION</span>
            <h3>We’re checking whether it went through.</h3>
            <p>{sourceReturn ? 'A merchant return record exists. Kane still needs to confirm its final details.' : 'The submission result is uncertain. Raising Kane will check the source before any retry.'}</p>
            {sourceReturn?.requestId && <p className="pending-reference">Source record: {sourceReturn.requestId}</p>}
          </article> : <article className="panel decision-panel">
            <div className="panel-topline"><span className="panel-label">THE DECISIONS</span><span className={`status-chip ${isWorking ? 'working' : ''}`}>{isWorking ? 'Kane is working' : pretty(task.status || 'Ready')}</span></div>
            <h3>Make the choices that matter.</h3>
            <p className="muted">The available options come from the merchant sandbox.</p>
            <div className="choice-block">
              <label htmlFor="reason">Why are you returning the shoes?</label>
              {reasonOptions.length ? <div className="choice-row"><select id="reason" value={reason} onChange={event => setReason(event.target.value)} disabled={!canEdit}>{reasonOptions.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}</select><button type="button" className="secondary-button" disabled={!canEdit || !reason || task.reason === reason} onClick={() => action('choice', `/api/tasks/${taskId}/choice`, { reason })}>Save reason</button></div> : <p className="choice-waiting">Waiting for Kane to read the merchant’s reasons.</p>}
            </div>
            <div className="choice-block method-block"><span className="choice-label">How would you like to return it?</span>
              {methodOptions.length ? <div className="method-options">{methodOptions.map(option => option.value === 'qr_dropoff'
                ? <button type="button" key={option.value} className={`method-option ${method === option.value ? 'selected' : ''}`} disabled={!canEdit || !task.reason || intent.noPrinter} onClick={() => action('choice', `/api/tasks/${taskId}/choice`, { method: 'qr', noPrinter: true })}><strong>{option.label}</strong><small>{option.detail}</small></button>
                : <div key={option.value} className={`method-option ${method === option.value ? 'selected' : ''}`}><strong>{option.label}</strong><small>{option.detail}</small></div>)}</div> : <p className="choice-waiting">Return methods will appear after Kane observes them.</p>}
            </div>
            {task.reason && <button className="check-button" type="button" disabled={!canEdit} onClick={() => action('check', `/api/tasks/${taskId}/check`, { repair: task.status === 'conflict' })}><Icon name="refresh" size={17} /> {busy === 'check' ? 'Checking…' : task.status === 'conflict' ? 'Repair the mismatch' : 'Check my choices'}</button>}
          </article>}

          {!receipt && proposalReady && checks.length > 0 && <article className={`panel checks-panel ${hasConflict ? 'has-conflict' : ''}`}><div className="panel-topline"><span className="panel-label">CHECKED AGAINST YOUR REQUEST</span><span>{hasConflict ? 'Needs attention' : allMatch ? 'All matched' : 'Some checks pending'}</span></div>{checks.map((check, index) => <div className={`check-row check-${check.status || 'unknown'}`} key={`${check.label}-${index}`}><span className="check-symbol">{['match', 'passed', 'ok'].includes(check.status) ? '✓' : ['conflict', 'mismatch', 'failed'].includes(check.status) ? '!' : '·'}</span><div><strong>{check.label || check.name}</strong><p>{check.detail || check.message}</p></div></div>)}{hasConflict && <p className="conflict-explainer">The merchant changed a choice that matters. Raising Kane will show the difference before you approve anything.</p>}</article>}

          {!receipt && !needsRecheck && proposalReady && <article className="panel review-panel">
            <div className="panel-topline"><span className="panel-label">REVIEW &amp; APPROVE</span><Icon name="shield" /></div>
            <h3>The exact proposal</h3>
            <div className="review-summary">
              <div><span>Return</span><strong>{draft.selectedLines ? (draft.selectedLines.length ? draft.selectedLines.map(line => `${line.name} (${line.variant})`).join(', ') : 'No item selected') : 'Not yet observed'}</strong></div>
              <div><span>Reason</span><strong>{reasonLabel || 'Not selected'}</strong></div>
              <div><span>Method</span><strong>{methodOptions.find(option => option.value === method)?.label || (method ? pretty(method) : 'Not selected')}</strong></div>
              <div><span>Refund to</span><strong>{draft.destinations?.find(option => option.value === destination)?.label || (destination ? pretty(destination) : 'Not confirmed')}</strong></div>
              <div><span>Deduction</span><strong>{money(draft.deductionCents, draft.currency)}</strong></div>
              <div className="review-total"><span>Expected refund</span><strong>{money(draft.expectedRefundCents, draft.currency)}</strong></div>
              <div><span>Next step</span><strong>{draft.nextStep || 'Not yet observed'}</strong></div>
            </div>
            <div className="review-actions"><button className="secondary-button" type="button" disabled={!canEdit || !allMatch || task.status !== 'ready' || status?.sourceSubmissionReady !== true} onClick={() => action('approve', `/api/tasks/${taskId}/approve`, {})}>{task.status === 'approved' ? 'Approved for this revision' : 'Approve this proposal'}</button><button className="primary-button" type="button" disabled={isWorking || task.status !== 'approved' || !approval || !allMatch || status?.sourceSubmissionReady !== true} onClick={() => action('submit', `/api/tasks/${taskId}/submit`, {})}>{busy === 'submit' ? 'Submitting…' : task.retryReady ? 'Retry the same approved request' : 'Submit return request'} <Icon name="arrow" /></button></div>
            <p className="approval-note">{status?.sourceSubmissionReady ? 'Submission requires your approval of this exact version. If the merchant changes it, we’ll ask again.' : 'This demo currently supports preview and verification. Submission is unavailable.'}</p>
          </article>}
        </div><aside className="side-column"><article className="panel source-panel"><div className="panel-topline"><span className="panel-label">THE ACTUAL WEBSITE</span><Icon name="eye" size={17} /></div><h3>Source, not guesswork.</h3><p>Raising Kane uses Kane CLI to operate the merchant’s live form. You can inspect the same source.</p><div className="source-frame-header"><span className="source-dot" /><span>Merchant sandbox — simulated order</span></div>{viewSource ? <iframe key={`${taskId}-${draft.revision || 0}`} title="Merchant sandbox — simulated order" src={sourceUrl} className="source-frame" /> : <div className="source-preview">{draft.orderId ? <><div className="preview-order">Order <strong>{draft.orderId}</strong></div>{draft.lines?.map(line => <div className="preview-line" key={line.id}><span>{line.name}</span><strong>{draft.selectedLineIds?.includes(line.id) ? 'Selected for return' : 'Keep'}</strong></div>)}<div className="preview-divider" /><span className="preview-caption">Current merchant draft. Open the source for its latest state.</span></> : <p>Waiting for Kane’s first source observation.</p>}</div>}<button type="button" className="source-toggle" onClick={() => setViewSource(current => !current)}>{viewSource ? 'Hide source website' : 'Show source website'} <Icon name="arrow" size={15} /></button></article><article className="panel evidence-panel"><div className="panel-topline"><span className="panel-label">KANE EVIDENCE</span><span className="evidence-count">{evidence.length} checks</span></div>{evidence.length ? <ul>{evidence.map((item, index) => <li key={`${item.phase}-${index}`}><span className={`evidence-state ${item.status || ''}`} /> <div><strong>{pretty(item.phase || 'Browser check')}</strong><p>{evidenceSummary(item)}</p>{item.url && <a href={item.url} target="_blank" rel="noreferrer">Open evidence ↗</a>}</div></li>)}</ul> : <p className="empty-evidence">Kane browser checks will appear here as they complete.</p>}</article><article className="panel activity-panel"><div className="panel-topline"><span className="panel-label">ACTIVITY</span><span className="live-pulse" /></div>{events.length ? <ol>{events.slice().reverse().slice(0, 7).map((event, index) => <EventLine event={event} key={`${index}-${typeof event === 'object' ? event.at : event}`} />)}</ol> : <p className="empty-evidence">Your task activity will appear here.</p>}</article></aside></div>
      </section>}
      {error && <div className="error-toast" role="alert"><strong>Couldn’t finish that step.</strong><span>{error}</span><button type="button" onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}
    </main>
    <footer className="footer"><span>raising<span className="brand-accent">kane</span>.</span><p>One supported return flow · Merchant sandbox with simulated data · Powered by Kane CLI</p></footer>
  </div>
}
