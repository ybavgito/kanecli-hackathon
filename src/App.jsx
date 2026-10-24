import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowSquareOut,
  Check,
  CheckCircle,
  CircleNotch,
  Clock,
  Package,
  CalendarBlank,
  CaretDown,
  ArrowClockwise,
  WarningCircle,
  Receipt,
  Fingerprint,
  Printer,
  QrCode,
  X,
  MagnifyingGlass,
  DownloadSimple,
} from '@phosphor-icons/react'
import '@fontsource-variable/dm-sans'

const EXAMPLE = 'Return the red shoes, keep the jacket, and refund my original payment method.'
const money = (value, currency = 'USD') =>
  value == null
    ? 'Not confirmed'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value / 100)
const destination = (value) =>
  value === 'store_credit' ? 'Store credit' : 'Original payment method'
const expectedMethodFromTask = (task) => (task.intent.noPrinter ? 'qr_dropoff' : 'print_label')
const method = (value) =>
  value === 'qr_dropoff' ? 'Printer-free drop-off' : 'Printed shipping label'
const timestamp = (value) =>
  value
    ? new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : 'Not checked'
const pretty = (value) =>
  String(value || '')
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
const appointmentTime = (value) =>
  value
    ? new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/Los_Angeles',
      }).format(new Date(value))
    : 'Choose a time'
const working = (t) =>
  Boolean(t?.progress) || ['created', 'working', 'submitting'].includes(t?.status)
async function api(path, body) {
  const r = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await r.json()
  if (!r.ok) throw Error(data.error || 'We could not complete this step.')
  return data
}
function Brand() {
  return (
    <span className="wordmark">
      raising<span>kane</span>
      <span className="brand-stop">.</span>
    </span>
  )
}
function Elapsed({ since }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  if (!since) return null
  const seconds = Math.max(0, Math.floor((now - new Date(since)) / 1000))
  return (
    <span className="elapsed">
      {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')} elapsed
    </span>
  )
}
function Pill({ status }) {
  const labels = {
    ready: 'Ready for review',
    conflict: 'A choice changed',
    needs_attention: 'Needs a check',
    needs_reason: 'Your choice',
    needs_slot: 'Choose a time',
    approved: 'Approved',
    complete: 'Verified result',
    working: 'Checking the website',
    submitting: 'Submitting',
    reconciling: 'Checking outcome',
    submitted_unverified: 'Checking confirmation',
  }
  return (
    <span className={`status-pill ${status}`}>
      <span />
      {labels[status] || pretty(status)}
    </span>
  )
}
function Button({ children, icon: Icon = ArrowRight, secondary = false, ...props }) {
  return (
    <button className={secondary ? 'button secondary' : 'button'} {...props}>
      {children}
      {Icon && <Icon size={18} />}
    </button>
  )
}
function Row({ label, children }) {
  return (
    <div className="summary-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}
function Comparison({ task }) {
  const [showAll, setShowAll] = useState(false),
    rows = task.checks || [],
    important =
      task.kind === 'appointment'
        ? ['slot', 'technician', 'fee', 'availability']
        : ['items', 'jacket', 'destination', 'method', 'deduction', 'refund']
  const visible = showAll ? rows : rows.filter((r) => important.includes(r.key)),
    conflicts = rows.filter((r) => r.status === 'conflict')
  return (
    <section className="comparison-section" aria-label="Choices compared with source">
      <div className="section-heading">
        <h2>Your choices, checked.</h2>
        <span>
          {task.validation
            ? 'Browser + source checked'
            : conflicts.length
              ? `${conflicts.length} difference${conflicts.length > 1 ? 's' : ''}`
              : 'Browser check pending'}
        </span>
      </div>
      <div className="comparison-table">
        <div className="comparison-header">
          <span>What matters</span>
          <span>You chose</span>
          <span>Website now</span>
          <span className="sr-only">Result</span>
        </div>
        {visible.map((row) => (
          <div className={`comparison-row ${row.status}`} key={row.key}>
            <span className="comparison-label">{row.label}</span>
            <span>{String(row.expected ?? 'Not chosen')}</span>
            <strong>{String(row.observed ?? 'Not observed')}</strong>
            <span
              className="comparison-symbol"
              title={row.status === 'match' ? 'Source matches' : 'Needs attention'}
            >
              {row.status === 'match' ? <Check size={18} /> : <WarningCircle size={19} />}
              <span className="sr-only">{row.status}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="comparison-footer">
        <button className="text-button" onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Show key choices' : `See all ${rows.length} source checks`}
          <CaretDown className={showAll ? 'rotated' : ''} size={14} />
        </button>
        <span>Source snapshot · {timestamp(task.observedAt)}</span>
      </div>
      {task.verificationFields?.some((f) => f.status !== 'match') && (
        <details className="check-details">
          <summary>Browser evidence still needed</summary>
          {task.verificationFields
            .filter((f) => f.status !== 'match')
            .map((f) => (
              <p key={f.key}>
                <strong>{pretty(f.key)}:</strong> expected {String(f.expected)}, observed{' '}
                {String(f.observed ?? 'missing')}.
              </p>
            ))}
        </details>
      )}
    </section>
  )
}
function Evidence({ task }) {
  const entries = task.evidence || []
  return (
    <section className="evidence-section">
      <div className="section-heading">
        <h2>The verification trail</h2>
        <span>{entries.length} runs</span>
      </div>
      <p className="small muted">
        Actual browser runs. Failed checks remain visible after correction.
      </p>
      {entries.length ? (
        <ol className="evidence-list">
          {entries
            .slice()
            .reverse()
            .map((item, index) => (
              <li key={`${item.at}-${index}`}>
                <span className={`evidence-icon ${item.status}`}>
                  {item.status === 'passed' ? <Check size={15} /> : <WarningCircle size={16} />}
                </span>
                <div>
                  <div className="evidence-title">
                    <strong>{pretty(item.phase)}</strong>
                    <span>
                      {item.status === 'passed'
                        ? 'Passed'
                        : item.status === 'failed'
                          ? 'Failed'
                          : 'Incomplete'}
                    </span>
                  </div>
                  <p>
                    Choice revision {item.taskRevision} · {timestamp(item.at)}
                    {item.durationMs ? ` · ${Math.round(item.durationMs / 1000)}s` : ''}
                  </p>
                  <details>
                    <summary>See observation</summary>
                    <p>{item.summary || 'The run did not return a completed observation.'}</p>
                    {Object.keys(item.finalState || {})
                      .filter((k) => k !== 'url')
                      .map((key) => (
                        <div className="observed-field" key={key}>
                          <span>{pretty(key)}</span>
                          <strong>
                            {typeof item.finalState[key] === 'object'
                              ? JSON.stringify(item.finalState[key])
                              : String(item.finalState[key])}
                          </strong>
                        </div>
                      ))}
                  </details>
                  {task.canControl && item.packAvailable && (
                    <a href={item.packUrl} download>
                      Download evidence pack <DownloadSimple size={13} />
                    </a>
                  )}
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noreferrer">
                      Open Kane report <ArrowSquareOut size={13} />
                    </a>
                  )}
                </div>
              </li>
            ))}
        </ol>
      ) : (
        <div className="evidence-empty">
          <Fingerprint size={30} />
          <p>The first source check will appear here.</p>
        </div>
      )}
      <a
        className="download-link"
        href={`/api/tasks/${task.id}/evidence`}
        target="_blank"
        rel="noreferrer"
      >
        <DownloadSimple size={16} /> Open evidence index
      </a>
    </section>
  )
}
function SourceView({ task }) {
  const [open, setOpen] = useState(false)
  return (
    <section className="source-section">
      <div className="section-heading">
        <h2>The original website</h2>
        <span className="read-only">Read-only</span>
      </div>
      <p className="small muted">
        Inspect the current source without changing the draft. This is a separate page view, not the
        agent’s live screen.
      </p>
      <button className="source-open" onClick={() => setOpen((v) => !v)}>
        <span>
          {task.kind === 'appointment' ? 'Linden Home' : 'Northstar Outfitters'}
          <small>Simulated {task.kind === 'appointment' ? 'booking' : 'order'}</small>
        </span>
        <MagnifyingGlass size={23} />
      </button>
      {open && task.sourceViewUrl && (
        <iframe
          key={`${task.id}-${task.merchant?.revision}`}
          title="Read-only source website"
          src={task.sourceViewUrl}
          className="source-frame"
        />
      )}
      {task.sourceViewUrl && (
        <a className="source-external" href={task.sourceViewUrl} target="_blank" rel="noreferrer">
          Open read-only source <ArrowSquareOut size={14} />
        </a>
      )}
    </section>
  )
}
function ReceiptView({ task }) {
  const r = task.receipt,
    isReturn = task.kind === 'return'
  return (
    <section className="receipt-sheet" aria-live="polite">
      <div className="receipt-top">
        <span className="receipt-check">
          <Check size={28} />
        </span>
        <span>
          Verified in the source
          <br />
          <small>{timestamp(r.verifiedAt)}</small>
        </span>
        <Receipt size={30} weight="light" />
      </div>
      <h2>
        {isReturn ? (
          <>
            Return requested.
            <br />
            <span>Refund pending.</span>
          </>
        ) : (
          <>
            A new time.
            <br />
            <span>The same service.</span>
          </>
        )}
      </h2>
      <p>
        {isReturn
          ? 'Your shoes are included. Your jacket stays with you.'
          : 'Your old appointment was replaced. Exactly one active booking remains.'}
      </p>
      <dl>
        {isReturn ? (
          <>
            <Row label="Return request">{r.requestId}</Row>
            <Row label="Item">Red running shoes · size 8 · quantity 1</Row>
            <Row label="Refund to">{destination(r.refundDestination)}</Row>
            <Row label="Return method">{method(r.method)}</Row>
            <Row label="Deduction">{money(r.deductionCents)}</Row>
            <Row label="Expected refund">
              <span className="receipt-amount">{money(r.expectedRefundCents)}</span>
            </Row>
          </>
        ) : (
          <>
            <Row label="Confirmation">{r.requestId}</Row>
            <Row label="Booking">{r.bookingId}</Row>
            <Row label="Previous time">{appointmentTime(r.oldStartsAt)}</Row>
            <Row label="New time">{appointmentTime(r.startsAt)}</Row>
            <Row label="Technician">{r.technician}</Row>
            <Row label="Service">{r.service}</Row>
            <Row label="Address">{r.address}</Row>
            <Row label="Additional fee">{money(r.feeCents)}</Row>
            <Row label="Timezone">{r.timezone}</Row>
          </>
        )}
      </dl>
      <div className="next-step">
        <span>What to do next</span>
        <p>{r.nextStep}</p>
        {r.qrUrl && (
          <a href={r.qrUrl} target="_blank" rel="noreferrer">
            Open your demo QR code <QrCode size={18} />
          </a>
        )}
      </div>
      <a className="receipt-source" href={r.sourceUrl} target="_blank" rel="noreferrer">
        View saved source confirmation <ArrowSquareOut size={17} />
      </a>
      <p className="receipt-footnote">
        Saved with this task. Reloading this page will not submit it again.
        <br />
        Sandbox result. No real refund, shipment or appointment.
      </p>
    </section>
  )
}
function ReturnChoices({ task, busy, onAction }) {
  const [reason, setReason] = useState(task.reason || ''),
    disabled = busy || !task.canControl || task.submissionStarted
  useEffect(() => setReason(task.reason || ''), [task.reason])
  return (
    <section className="decision-section">
      <div className="section-heading">
        <h2>{task.reason ? 'Your return preferences' : 'Why are you returning the shoes?'}</h2>
        <span>From the merchant</span>
      </div>
      <div className="field-group">
        <label htmlFor="reason">Return reason</label>
        <div className="input-action">
          <select
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={disabled || !task.baseline}
          >
            <option value="">Choose a reason</option>
            {task.merchant?.reasons?.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <Button
            secondary
            disabled={disabled || !reason || reason === task.reason || !task.baseline}
            onClick={() => onAction('choice', { reason })}
          >
            Save reason
          </Button>
        </div>
      </div>
      {task.reason && (
        <>
          <fieldset disabled={disabled}>
            <legend>How would you like to send it back?</legend>
            <div className="method-choices">
              {[
                {
                  value: false,
                  icon: Printer,
                  title: 'Printed label',
                  detail: 'Use a printer · no deduction',
                },
                {
                  value: true,
                  icon: QrCode,
                  title: 'Printer-free drop-off',
                  detail: 'Show a QR code · $5 deduction',
                },
              ].map(({ value, icon: Icon, title, detail }) => (
                <button
                  key={String(value)}
                  className={`choice-option ${task.intent.noPrinter === value ? 'selected' : ''}`}
                  aria-pressed={task.intent.noPrinter === value}
                  onClick={() => onAction('choice', { noPrinter: value })}
                  disabled={disabled || task.intent.noPrinter === value}
                >
                  <Icon size={25} weight="light" />
                  <span>
                    <strong>{title}</strong>
                    <small>{detail}</small>
                  </span>
                  <span className="radio-mark">
                    {task.intent.noPrinter === value && <Check size={12} />}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
          <div className="field-group refund-choice">
            <label htmlFor="destination">Where should the refund go?</label>
            <select
              id="destination"
              disabled={disabled}
              value={task.intent.refundDestination}
              onChange={(e) => onAction('choice', { refundDestination: e.target.value })}
            >
              {task.merchant?.destinations?.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </section>
  )
}
function AppointmentChoices({ task, busy, onAction }) {
  const disabled = busy || !task.canControl || task.submissionStarted,
    options = task.candidates || []
  return (
    <section className="decision-section">
      <div className="section-heading">
        <h2>A Saturday that works for you</h2>
        <span>Oct 31 · Pacific time</span>
      </div>
      <div className="appointment-preferences">
        <label>
          <input
            type="checkbox"
            checked={task.intent.keepTechnician}
            disabled={disabled}
            onChange={(e) => onAction('choice', { keepTechnician: e.target.checked })}
          />
          <span>
            Keep Maya Chen<small>Your current technician</small>
          </span>
        </label>
        <label className="fee-limit">
          Additional fee limit
          <select
            aria-label="Additional fee limit"
            value={task.intent.maxFeeCents}
            disabled={disabled}
            onChange={(e) => onAction('choice', { maxFeeCents: Number(e.target.value) })}
          >
            <option value={0}>No extra fee</option>
            <option value={2500}>Up to $25</option>
          </select>
        </label>
      </div>
      {options.length > 0 && !options.some((s) => s.issues.length === 0) && (
        <div className="notice warning">
          <WarningCircle size={22} />
          <div>
            <strong>No time matches every choice.</strong>
            <p>
              Your existing booking is unchanged. Adjust the fee limit or technician preference to
              see other options.
            </p>
          </div>
        </div>
      )}
      <div className="slot-list">
        {options.map((slot) => (
          <button
            className={`slot-option ${task.intent.slotId === slot.id ? 'selected' : ''}`}
            key={slot.id}
            disabled={
              disabled || !task.baseline || slot.issues.length > 0 || task.intent.slotId === slot.id
            }
            onClick={() => onAction('choice', { slotId: slot.id })}
          >
            <span className="slot-time">
              {new Intl.DateTimeFormat('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                timeZone: 'America/Los_Angeles',
              }).format(new Date(slot.startsAt))}
            </span>
            <span>
              <strong>{slot.technician}</strong>
              <small>
                {slot.issues.length ? slot.issues.join(' · ') : 'Matches all your choices'}
              </small>
            </span>
            <span className="slot-fee">
              {slot.feeCents ? `+${money(slot.feeCents)}` : 'No extra fee'}
            </span>
            {task.intent.slotId === slot.id ? (
              <CheckCircle size={23} weight="fill" />
            ) : (
              <ArrowRight size={20} />
            )}
          </button>
        ))}
      </div>
      <p className="small muted">
        Your Friday appointment stays booked until you confirm this change.
      </p>
    </section>
  )
}
function TaskWorkspace({ task, busy, error, onAction, onBack, onDismiss }) {
  const isWorking = busy || working(task),
    pending = task.submissionStarted && !task.receipt,
    ready = task.status === 'ready',
    conflict = task.status === 'conflict',
    approved = task.status === 'approved',
    complete = task.status === 'complete' && task.receipt
  const canEdit = task.canControl && !isWorking && !task.submissionStarted,
    d = task.merchant || {}
  const title =
    task.kind === 'return'
      ? 'Your return, on your terms.'
      : 'A different time. Everything else intact.'
  return (
    <>
      <div className="task-top">
        <button className="back-link" onClick={onBack}>
          <ArrowLeft size={16} /> All tasks
        </button>
        <span>
          {task.kind === 'return'
            ? 'Northstar Outfitters / Return an item'
            : 'Linden Home / Move a service visit'}
        </span>
        <Pill status={task.status} />
      </div>
      <div className="task-heading">
        <div>
          <h1>{title}</h1>
          <p>
            {task.kind === 'return'
              ? 'Return the red shoes. Keep the jacket. Preserve your refund choice.'
              : 'Keep the service and address. Choose the time and terms that suit you.'}
          </p>
        </div>
        <span className="revision-label">Choices · revision {task.revision}</span>
      </div>
      {!task.canControl && (
        <div className="notice">
          <Fingerprint size={23} />
          <div>
            <strong>You’re viewing a saved task.</strong>
            <p>Only the browser session that started it can change or approve it.</p>
          </div>
        </div>
      )}
      {error && (
        <div className="notice error" role="alert">
          <WarningCircle size={23} />
          <div>
            <strong>That step needs attention.</strong>
            <p>{error}</p>
          </div>
          <button aria-label="Dismiss error" onClick={onDismiss}>
            <X size={19} />
          </button>
        </div>
      )}
      <div className="workspace-grid">
        <div className="task-main">
          {isWorking && (
            <div className="progress-notice" role="status" aria-live="polite">
              <CircleNotch className="spin" size={24} />
              <div>
                <strong>{task.progress?.text || 'Starting the next step'}</strong>
                <p>Your choices are saved. We’ll show what the website actually does.</p>
              </div>
              <Elapsed since={task.progress?.startedAt} />
            </div>
          )}
          {complete ? (
            <ReceiptView task={task} />
          ) : (
            <>
              {!task.baseline && !isWorking && (
                <div className="notice warning">
                  <WarningCircle size={24} />
                  <div>
                    <strong>First, we need to confirm the source record.</strong>
                    <p>
                      {task.error || 'The initial check hasn’t finished. Your request is saved.'}
                    </p>
                    <Button
                      secondary
                      disabled={!task.canControl}
                      onClick={() => onAction('check', {})}
                      icon={ArrowClockwise}
                    >
                      Retry reading the source
                    </Button>
                  </div>
                </div>
              )}
              {pending && (
                <section className="pending-result">
                  <Clock size={34} />
                  <h2>
                    {approved
                      ? 'The same approved request is ready to retry.'
                      : 'Checking whether it went through.'}
                  </h2>
                  <p>
                    {task.error ||
                      'We will look up the original operation and verify its saved result. We will not create a second request.'}
                  </p>
                  <Button
                    disabled={isWorking || !task.canControl}
                    onClick={() => onAction(approved ? 'submit' : 'check', {})}
                    icon={ArrowClockwise}
                  >
                    {approved ? 'Retry the same request' : 'Check the saved result'}
                  </Button>
                </section>
              )}
              {!pending && (
                <>
                  {conflict && !isWorking && (
                    <div className="conflict-banner" role="status">
                      <WarningCircle size={28} />
                      <div>
                        <span>Submission blocked</span>
                        <h2>A later choice changed the website’s terms.</h2>
                        <p>
                          {task.checks
                            .filter((c) => c.status === 'conflict')
                            .map(
                              (c) =>
                                `${c.label}: you chose ${c.expected}; the website has ${c.observed}.`,
                            )
                            .join(' ')}
                        </p>
                        <Button
                          disabled={!canEdit}
                          onClick={() => onAction('check', { repair: true })}
                          icon={ArrowClockwise}
                        >
                          Restore my choices & check again
                        </Button>
                      </div>
                    </div>
                  )}
                  {task.baseline &&
                    ((task.kind === 'return' && !task.reason) ||
                      (task.kind === 'appointment' && !task.intent.slotId)) &&
                    (task.kind === 'return' ? (
                      <ReturnChoices task={task} busy={isWorking} onAction={onAction} />
                    ) : (
                      <AppointmentChoices task={task} busy={isWorking} onAction={onAction} />
                    ))}
                  {task.baseline &&
                    ((task.kind === 'return' && task.reason) ||
                      (task.kind === 'appointment' && task.intent.slotId)) && (
                      <details
                        className="preferences-disclosure"
                        key={
                          conflict
                            ? 'conflict'
                            : ready
                              ? 'ready'
                              : approved
                                ? 'approved'
                                : 'editing'
                        }
                      >
                        <summary>
                          <span>
                            Change{' '}
                            {task.kind === 'return'
                              ? 'return preferences'
                              : 'appointment preferences'}
                          </span>
                          <span>
                            {task.kind === 'return'
                              ? `${method(expectedMethodFromTask(task))} · ${destination(task.intent.refundDestination)}`
                              : 'Time, technician and fee limit'}
                          </span>
                        </summary>
                        {task.kind === 'return' ? (
                          <ReturnChoices task={task} busy={isWorking} onAction={onAction} />
                        ) : (
                          <AppointmentChoices task={task} busy={isWorking} onAction={onAction} />
                        )}
                      </details>
                    )}
                  {task.baseline &&
                    ((task.kind === 'return' && task.reason) ||
                      (task.kind === 'appointment' && task.intent.slotId)) && (
                      <Comparison task={task} />
                    )}
                  {task.status === 'needs_attention' && task.baseline && !isWorking && (
                    <div className="notice warning">
                      <WarningCircle size={23} />
                      <div>
                        <strong>The browser check needs another look.</strong>
                        <p>{task.error}</p>
                        <Button
                          secondary
                          disabled={!canEdit}
                          onClick={() => onAction('check', {})}
                          icon={ArrowClockwise}
                        >
                          Check the current proposal
                        </Button>
                      </div>
                    </div>
                  )}
                  {(ready || approved) && (
                    <section className="approval-section">
                      <div>
                        <span className="section-label">
                          {approved ? 'Your exact terms are approved' : 'Your proposal is ready'}
                        </span>
                        <h2>
                          {task.kind === 'return'
                            ? `${money(d.expectedRefundCents)} to ${destination(d.refundDestination).toLowerCase()}`
                            : appointmentTime(d.startsAt)}
                        </h2>
                        <p>
                          {task.kind === 'return'
                            ? `${method(d.method)} · ${money(d.deductionCents)} deduction · jacket kept`
                            : `${d.technician} · ${money(d.feeCents)} additional fee · same address`}
                        </p>
                      </div>
                      <Button
                        disabled={!task.canControl || isWorking}
                        onClick={() => onAction(approved ? 'submit' : 'approve', {})}
                      >
                        {approved
                          ? task.kind === 'return'
                            ? 'Send approved return'
                            : 'Confirm approved change'
                          : 'Approve these exact terms'}
                      </Button>
                      <p className="approval-explanation">
                        {approved
                          ? 'The next step sends this approved version to the sandbox. Changed terms cannot use this approval.'
                          : 'Nothing is submitted yet. Approval is tied to these terms and this source revision.'}
                      </p>
                    </section>
                  )}
                  {task.baseline &&
                    task.reason &&
                    !isWorking &&
                    !approved &&
                    task.status !== 'needs_attention' && (
                      <button
                        className="text-button recheck"
                        disabled={!canEdit}
                        onClick={() => onAction('check', {})}
                      >
                        <ArrowClockwise size={16} /> Check my choices again
                      </button>
                    )}
                </>
              )}
            </>
          )}
        </div>
        <aside className="task-aside">
          <section className="intent-summary">
            <span className="section-label">Always preserved</span>
            <h2>{task.kind === 'return' ? 'Your original intention' : 'What stays the same'}</h2>
            <dl>
              {task.kind === 'return' ? (
                <>
                  <Row label="Return">Red shoes · size 8</Row>
                  <Row label="Keep">Black jacket</Row>
                  <Row label="Refund to">{destination(task.intent.refundDestination)}</Row>
                  <Row label="Printer">
                    {task.intent.noPrinter ? 'Not needed' : 'Printed label'}
                  </Row>
                </>
              ) : (
                <>
                  <Row label="Service">Washer repair</Row>
                  <Row label="Technician">
                    {task.intent.keepTechnician ? 'Maya Chen' : 'Any available technician'}
                  </Row>
                  <Row label="Fee limit">{money(task.intent.maxFeeCents)}</Row>
                  <Row label="Address">42 Linden Street, San Francisco</Row>
                </>
              )}
            </dl>
            <p>
              <Fingerprint size={16} /> Checked against choice revision {task.revision}
            </p>
          </section>
          <SourceView task={task} />
          <Evidence task={task} />
          <details className="activity-details">
            <summary>Task activity</summary>
            <ol>
              {task.events
                .slice()
                .reverse()
                .map((event, i) => (
                  <li key={i}>
                    <time>{timestamp(event.at)}</time>
                    <span>{event.text}</span>
                  </li>
                ))}
            </ol>
          </details>
          {task.interpretation?.source === 'sample-parser' && (
            <p className="parser-note">
              Example request parser used. OpenAI interpretation was not connected for this task.
            </p>
          )}
        </aside>
      </div>
    </>
  )
}
export default function App() {
  const [task, setTask] = useState(null),
    [restoring, setRestoring] = useState(
      Boolean(new URLSearchParams(location.search).get('taskId')),
    ),
    [status, setStatus] = useState(null),
    [history, setHistory] = useState([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [site, setSite] = useState(null),
    [request, setRequest] = useState(EXAMPLE),
    [connectionError, setConnectionError] = useState(false)
  const taskRef = useRef(null)
  const update = useCallback((t) => {
    const previous = taskRef.current
    if (
      previous?.id === t?.id &&
      (previous.revision > t.revision || previous.updatedAt > t.updatedAt)
    )
      return
    taskRef.current = t
    setTask(t)
    if (t) {
      const u = new URL(location.href)
      u.searchParams.set('taskId', t.id)
      window.history.replaceState(null, '', u)
    }
  }, [])
  const load = useCallback(
    async (id) => {
      setError('')
      try {
        const data = await api('/api/tasks/' + encodeURIComponent(id))
        update(data.task)
      } catch (e) {
        setError(e.message)
      } finally {
        setRestoring(false)
      }
    },
    [update],
  )
  useEffect(() => {
    api('/api/status')
      .then(setStatus)
      .catch(() => setStatus({ kane: { available: false } }))
    api('/api/tasks')
      .then((d) => setHistory(d.tasks))
      .catch(() => {})
    const id = new URLSearchParams(location.search).get('taskId')
    if (id) load(id)
  }, [load])
  useEffect(() => {
    if (!task?.id) return
    const id = task.id
    const timer = setInterval(() => {
      api('/api/tasks/' + id)
        .then((d) => {
          setConnectionError(false)
          if (taskRef.current?.id === id) update(d.task)
        })
        .catch(() => setConnectionError(true))
    }, 2000)
    return () => clearInterval(timer)
  }, [task?.id, update])
  const action = async (path, body) => {
    setBusy(true)
    setError('')
    try {
      const d = await api('/api/tasks/' + task.id + '/' + path, body)
      update(d.task)
    } catch (e) {
      setError(e.message)
      const d = await api('/api/tasks/' + task.id).catch(() => null)
      if (d) update(d.task)
    } finally {
      setBusy(false)
    }
  }
  const start = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const d = await api('/api/tasks', {
        kind: site,
        request: site === 'return' ? request : undefined,
      })
      update(d.task)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  const home = () => {
    taskRef.current = null
    setTask(null)
    setRestoring(false)
    setSite(null)
    setError('')
    const u = new URL(location.href)
    u.searchParams.delete('taskId')
    historyReplace(u)
    api('/api/tasks')
      .then((d) => setHistory(d.tasks))
      .catch(() => {})
  }
  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to task
      </a>
      <header className="app-header">
        <button className="brand-button" onClick={home} aria-label="Raising Kane home">
          <Brand />
        </button>
        <span className="tagline">When websites raise hell, raise Kane</span>
        <div className="header-status">
          <span className={status?.kane?.available ? 'online-dot' : 'offline-dot'} />
          {!status
            ? 'Checking connection'
            : status.kane?.available
              ? 'Kane connected'
              : 'Kane unavailable'}
        </div>
      </header>
      <main id="main" className={task ? 'main workspace' : 'main'}>
        {connectionError && (
          <div className="notice warning" role="status">
            Connection interrupted. Showing saved information; it may be out of date.
          </div>
        )}
        {restoring ? (
          <section className="notice" role="status">
            <CircleNotch className="spin" size={22} /> Restoring your saved task…
          </section>
        ) : task ? (
          <TaskWorkspace
            task={task}
            busy={busy}
            error={error}
            onAction={action}
            onBack={home}
            onDismiss={() => setError('')}
          />
        ) : (
          <>
            <section className="home-intro">
              <span className="section-label">Your intention. Carried through.</span>
              <h1>
                The website can be complicated.
                <br />
                <span>Your next step shouldn’t be.</span>
              </h1>
              <p>
                Choose a task. Make the decisions that matter. Kane checks the website before you
                approve—and verifies what it saves.
              </p>
            </section>
            <section className="site-picker" aria-label="Choose a supported website">
              <div className="section-heading">
                <h2>What would you like to get done?</h2>
                <span>Two supported sandbox websites</span>
              </div>
              <div className="site-options">
                {[
                  {
                    kind: 'return',
                    name: 'Northstar Outfitters',
                    title: 'Return an item',
                    detail: 'Return the shoes, keep the jacket, and preserve your refund choice.',
                    icon: Package,
                    example: 'Partial return · sample order ORD-1042',
                  },
                  {
                    kind: 'appointment',
                    name: 'Linden Home',
                    title: 'Move a service visit',
                    detail:
                      'Find a new time without changing your technician or paying an unexpected fee.',
                    icon: CalendarBlank,
                    example: 'Washer repair · sample booking BOOK-2048',
                  },
                ].map(({ kind, name, title, detail, icon: Icon, example }) => (
                  <button
                    key={kind}
                    className={`site-option ${site === kind ? 'selected' : ''}`}
                    onClick={() => {
                      setSite(kind)
                      setError('')
                    }}
                    aria-pressed={site === kind}
                  >
                    <div className="site-option-top">
                      <span className="site-monogram">
                        <Icon size={30} weight="light" />
                      </span>
                      <span>{name}</span>
                      <ArrowRight size={22} />
                    </div>
                    <h3>{title}</h3>
                    <p>{detail}</p>
                    <small>{example}</small>
                  </button>
                ))}
              </div>
            </section>
            {site && (
              <form className="start-form" onSubmit={start}>
                <div>
                  <h2>
                    {site === 'return'
                      ? 'Let’s keep your choices intact.'
                      : 'Keep the repair. Change the time.'}
                  </h2>
                  <p>
                    {site === 'return'
                      ? 'We’ll confirm the order first, then ask for the return reason.'
                      : 'We’ll look for Saturday morning with Maya and no extra fee. You can change these preferences after we read the booking.'}
                  </p>
                  {site === 'return' && (
                    <details>
                      <summary>Describe the return in your own words</summary>
                      <label className="sr-only" htmlFor="request">
                        Your request
                      </label>
                      <textarea
                        id="request"
                        value={request}
                        onChange={(e) => setRequest(e.target.value)}
                        rows={3}
                      />
                    </details>
                  )}
                </div>
                <Button
                  disabled={
                    busy || !status?.kane?.available || (site === 'return' && !request.trim())
                  }
                >
                  {busy
                    ? 'Starting your task'
                    : site === 'return'
                      ? 'Start my return'
                      : 'Find a better time'}
                </Button>
              </form>
            )}
            {error && (
              <div className="notice error" role="alert">
                {error}
              </div>
            )}
            {status && !status.kane?.available && (
              <div className="notice warning">
                <WarningCircle size={22} />
                <div>
                  <strong>The browser worker is not ready.</strong>
                  <p>
                    Connect Kane on this host before starting a task. Your saved tasks are still
                    available below.
                  </p>
                </div>
              </div>
            )}
            {history.length > 0 && (
              <section className="recent-tasks">
                <div className="section-heading">
                  <h2>Pick up where you left off</h2>
                  <span>Saved on this demo host</span>
                </div>
                {history.map((t) => (
                  <button key={t.id} className="recent-task" onClick={() => load(t.id)}>
                    {t.kind === 'appointment' ? <CalendarBlank size={22} /> : <Package size={22} />}
                    <span>
                      <strong>
                        {t.kind === 'appointment' ? 'Move a service visit' : 'Return the red shoes'}
                      </strong>
                      <small>
                        {new Date(t.createdAt).toLocaleDateString()} · {t.id.slice(0, 8)}
                      </small>
                    </span>
                    <Pill status={t.status} />
                    <ArrowRight size={18} />
                  </button>
                ))}
              </section>
            )}
            <div className="home-principle">
              <Fingerprint size={25} weight="light" />
              <p>
                <strong>Your choices are the reference.</strong> When a website changes a detail,
                Raising Kane checks it against what you asked for. You approve the exact result.
              </p>
            </div>
          </>
        )}
      </main>
      <footer className="app-footer">
        <Brand />
        <span>Two sandbox websites. Synthetic orders and bookings. No real transactions.</span>
        <span>Built with OpenAI · Verified with Kane</span>
      </footer>
    </div>
  )
}
function historyReplace(url) {
  window.history.replaceState(null, '', url)
}
