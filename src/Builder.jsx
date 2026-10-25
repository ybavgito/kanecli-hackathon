import { useEffect, useState } from 'react'
import {
  ArrowRight,
  ArrowLeft,
  ArrowSquareOut,
  CheckCircle,
  CircleNotch,
  MagnifyingGlass,
  WarningCircle,
  Code,
  GitBranch,
  Image,
  CaretDown,
} from '@phosphor-icons/react'
import './builder.css'
import LandingExample from './LandingExample.jsx'
async function api(path, body) {
  const r = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const d = await r.json()
  if (!r.ok) throw Error(d.error || 'Request failed.')
  return d
}
const titles = {
  connecting: 'Connecting to your website',
  exploring_source: 'Learning the original website',
  investigating: 'Following a meaningful choice',
  building: 'Building your simpler interface',
  exploring_preview: 'Exploring the new interface',
  verifying: 'Checking the complete journey',
  repairing: 'Repairing from Kane’s evidence',
  ready: 'Your simpler interface is ready',
  blocked: 'This build needs attention',
}
const display = (value) =>
  typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) : String(value || '')
function Observation({ value }) {
  let parsed = value
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value)
    } catch {
      /* Plain English is already readable. */
    }
  }
  const terms = {
    print_label: 'Print a shipping label',
    qr_dropoff: 'Printer-free QR drop-off',
    original_payment: 'Original payment',
    store_credit: 'Store credit',
  }
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return (
      <dl className="builder-observation">
        {Object.entries(parsed).map(([key, val]) => (
          <div key={key}>
            <dt>{key.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ')}</dt>
            <dd>{typeof val === 'string' ? terms[val] || val : display(val)}</dd>
          </div>
        ))}
      </dl>
    )
  }
  return <p>{display(value)}</p>
}
const brand = (
  <span className="wordmark">
    raising<span>kane</span>
    <span className="brand-stop">.</span>
  </span>
)
export default function Builder() {
  const [catalog, setCatalog] = useState(null),
    [build, setBuild] = useState(null),
    [url, setUrl] = useState(''),
    [goal, setGoal] = useState(''),
    [error, setError] = useState(''),
    [pending, setPending] = useState(false),
    [tab, setTab] = useState('journeys'),
    [selectedImage, setSelectedImage] = useState(null)
  const buildId = new URLSearchParams(location.search).get('build')
  useEffect(() => {
    api('/api/builder')
      .then((d) => {
        setCatalog(d)
        if (!url) setUrl(d.sources[0]?.url || '')
      })
      .catch((e) => setError(e.message))
  }, [])
  useEffect(() => {
    if (!buildId) return
    let live = true
    const refresh = () =>
      api('/api/builder/' + buildId)
        .then((d) => {
          if (live) setBuild(d.build)
        })
        .catch((e) => {
          if (live) setError(e.message)
        })
    refresh()
    const timer = setInterval(refresh, 1800)
    return () => {
      live = false
      clearInterval(timer)
    }
  }, [buildId])
  async function start(e) {
    e.preventDefault()
    setPending(true)
    setError('')
    try {
      const d = await api('/api/builder', { url, goal })
      location.href = '/?builder=1&build=' + d.build.id
    } catch (e) {
      setError(e.message)
      setPending(false)
    }
  }
  async function openRecorded(id) {
    setPending(true)
    setError('')
    try {
      const d = await api('/api/builder/demo/' + id, {})
      location.href = '/?build=' + d.build.id
    } catch (e) {
      setError(e.message)
      setPending(false)
    }
  }
  async function open() {
    setPending(true)
    try {
      const d = await api(`/api/builder/${build.id}/session`, {})
      location.href = `/builder-preview/${build.id}/${build.promotedRevision}?session=${d.sessionId}`
    } catch (e) {
      setError(e.message)
      setPending(false)
    }
  }
  async function readTest(candidate) {
    try {
      const record = await api(`/api/builder/${build.id}/verification/${candidate.revision}`)
      setSelectedImage({ facts: record, at: record.capturedAt })
    } catch (e) {
      setError(e.message)
    }
  }
  async function rebuild() {
    setPending(true)
    try {
      const result = await api(`/api/builder/${build.id}/rebuild`, {})
      setBuild(result.build)
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setPending(false)
    }
  }
  const current = build?.candidates.at(-1),
    running = build && !['ready', 'blocked'].includes(build.status),
    evidence =
      build?.evidence.filter((e) => ['overview', 'primary', 'alternative'].includes(e.branch)) || []
  return (
    <div className="builder-page">
      <header className="app-header">
        <a className="builder-brand" href="/?builder=1" aria-label="Raising Kane builder home">
          {brand}
          <small>When websites raise hell, raise Kane</small>
        </a>
        <nav>
          <a href="/?legacy=1">
            Task workspace <ArrowSquareOut size={15} />
          </a>
        </nav>
      </header>
      <main className="builder-main">
        {!buildId ? (
          <>
            <LandingExample
              catalog={catalog}
              pending={pending}
              onOpen={openRecorded}
              onUse={(exampleUrl, exampleGoal) => {
                setUrl(exampleUrl)
                setGoal(exampleGoal)
                document
                  .getElementById('build-interface')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                document.getElementById('task-goal')?.focus({ preventScroll: true })
              }}
            />
            <section
              id="build-interface"
              className="rk-build-section"
              aria-labelledby="build-title"
            >
              <div className="rk-section-heading">
                <span className="rk-kicker">YOUR STARTING POINT</span>
                <h2 id="build-title">
                  A URL is enough.
                  <br />
                  <em>A goal makes it yours.</em>
                </h2>
                <p>
                  Start with either demo website. Your intent guides what Kane investigates and what
                  the coding agent builds.
                </p>
                <ol className="rk-process">
                  <li>
                    <span>01</span>
                    <div>
                      <strong>Kane discovers</strong>
                      <p>Actual pages, choices and unexpected branches.</p>
                    </div>
                  </li>
                  <li>
                    <span>02</span>
                    <div>
                      <strong>The agent builds</strong>
                      <p>React shaped by screenshots and observed behavior.</p>
                    </div>
                  </li>
                  <li>
                    <span>03</span>
                    <div>
                      <strong>Kane checks again</strong>
                      <p>A failed journey feeds the repair loop. The source outcome must match.</p>
                    </div>
                  </li>
                </ol>
              </div>
              <form className="builder-form" onSubmit={start}>
                <h3>Build your interface</h3>
                <label htmlFor="website-url">Website URL</label>
                <input
                  id="website-url"
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-website.com"
                />
                <div className="builder-sources">
                  {catalog?.sources.map((s) => (
                    <button
                      type="button"
                      className={url === s.url ? 'selected' : ''}
                      key={s.kind}
                      onClick={() => setUrl(s.url)}
                    >
                      {s.name}
                      <small>Synthetic website</small>
                    </button>
                  ))}
                </div>
                <label htmlFor="task-goal">
                  What would you like to do? <span>Optional</span>
                </label>
                <textarea
                  id="task-goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Leave blank to discover the website’s flows, or describe what matters to you."
                  rows={2}
                />
                <p className="builder-hint">
                  {goal.trim()
                    ? 'Kane will prioritize the flows around your task.'
                    : 'No task required. We’ll map reachable flows and build an overview first.'}
                </p>
                <div className="builder-start">
                  <p>
                    This release supports the two demonstration websites above. Exploration and
                    testing use synthetic records. Page content and screenshots are processed by
                    TestMu AI and OpenAI.
                  </p>
                  <button className="builder-primary" disabled={pending || !catalog?.configured}>
                    {pending ? <CircleNotch className="spin" /> : <ArrowRight />}
                    {pending ? 'Starting…' : 'Explore & simplify'}
                  </button>
                </div>
                {catalog && !catalog.configured && (
                  <p role="status">
                    Add OPENAI_API_KEY to the server environment to enable the builder.
                  </p>
                )}
              </form>
            </section>
            {catalog?.recordedDemos?.length > 0 && (
              <section id="recorded-demos" className="builder-history rk-demo-section">
                <div className="rk-demo-heading">
                  <span className="rk-kicker">SKIP THE GENERATION WAIT</span>
                  <h2>Demo now</h2>
                </div>
                <p>
                  Open an actual recorded, verified build immediately. Its capture date stays
                  visible. Start a fresh task to watch Kane operate and verify the source live.
                </p>
                <div className="rk-demo-options">
                  {catalog.recordedDemos.map((d) => (
                    <button
                      className="builder-primary"
                      type="button"
                      disabled={pending}
                      key={d.id}
                      onClick={() => openRecorded(d.id)}
                    >
                      <span>
                        {d.title}
                        <small>
                          {d.id === 'store-overview'
                            ? 'No intent · read-only discovery'
                            : d.id === 'store-focused'
                              ? 'Return intent · focused flow'
                              : d.id === 'linden'
                                ? 'Appointment intent · different website'
                                : 'Earlier verified return build'}
                        </small>
                      </span>{' '}
                      <ArrowRight />
                    </button>
                  ))}
                </div>
              </section>
            )}
            {catalog?.builds.length > 0 && (
              <section className="builder-history">
                <h2>Your interfaces</h2>
                {catalog.builds.map((b) => (
                  <a href={'/?builder=1&build=' + b.id} key={b.id}>
                    <span>
                      <strong>
                        {b.kind === 'return' ? 'Northstar Outfitters' : 'Linden Home'}
                      </strong>
                      <small>{b.goal || 'Website overview · no intent supplied'}</small>
                    </span>
                    <span>
                      {titles[b.status] || b.status}
                      <ArrowRight />
                    </span>
                  </a>
                ))}
              </section>
            )}
          </>
        ) : build ? (
          <>
            <a className="builder-back" href="/?builder=1">
              <ArrowLeft /> All interfaces
            </a>
            <section className="builder-heading">
              <div>
                <span className="builder-eyebrow">
                  {build.contract.mode === 'overview'
                    ? 'Website overview'
                    : 'Task-focused interface'}{' '}
                  · {build.kind === 'return' ? 'Northstar Outfitters' : 'Linden Home'}
                </span>
                <h1>{titles[build.status]}</h1>
                <p>
                  {build.goal ||
                    'You supplied a URL without a task. Kane is mapping observed flows before you choose where to start.'}
                </p>
                <a href={build.url} target="_blank" rel="noreferrer">
                  Open the original website <ArrowSquareOut size={15} />
                </a>
                {build.parentBuildId && (
                  <p>
                    <a href={'/?build=' + build.parentBuildId}>Back to the read-only overview</a>
                  </p>
                )}
              </div>
              {build.status === 'ready' ? (
                <button className="builder-primary" disabled={pending} onClick={open}>
                  {build.contract?.version >= 2 && build.contract.mode === 'overview'
                    ? 'Open site overview'
                    : 'Use my interface'}{' '}
                  <ArrowRight />
                </button>
              ) : running ? (
                <span className="builder-working">
                  <CircleNotch className="spin" /> Working from real browser evidence
                </span>
              ) : (
                <WarningCircle size={36} />
              )}
            </section>
            {build.importedDemo && (
              <div className="builder-alert" role="status">
                <div>
                  <strong>Recorded generated build</strong>
                  <p>
                    Verification captured {new Date(build.recordedAt).toLocaleString()}. Artifact
                    bytes are unchanged. Your next task uses fresh synthetic records and live Kane
                    jobs.
                  </p>
                </div>
              </div>
            )}
            <ol className="builder-stages">
              {[
                ['exploring_source', 'Explore'],
                ['building', 'Build'],
                ['verifying', 'Verify'],
                ['ready', 'Use'],
              ].map(([key, label], i) => {
                const index = ['connecting', 'exploring_source', 'investigating'].includes(
                  build.status,
                )
                  ? 0
                  : ['building'].includes(build.status)
                    ? 1
                    : ['exploring_preview', 'verifying', 'repairing'].includes(build.status)
                      ? 2
                      : build.status === 'ready'
                        ? 3
                        : -1
                return (
                  <li className={i === index ? 'active' : i < index ? 'done' : ''} key={key}>
                    <span>{i < index ? <CheckCircle size={20} /> : i + 1}</span>
                    {label}
                  </li>
                )
              })}
            </ol>
            {build.error && (
              <div className="builder-alert" role="alert">
                <WarningCircle />
                <div>
                  <strong>No unverified interface was published.</strong>
                  <p>{build.error}</p>
                  {build.sourceMap && evidence.length > 0 && (
                    <button disabled={pending} onClick={rebuild}>
                      Rebuild from captured evidence
                    </button>
                  )}
                  <a href="/?builder=1">Start another build</a>
                </div>
              </div>
            )}
            <div className="builder-grid">
              <section className="builder-work">
                <div className="builder-tabs" role="tablist" aria-label="Build evidence">
                  {[
                    ['journeys', 'What Kane found', GitBranch],
                    ['decisions', 'What it changed', Code],
                    ['checks', 'What was checked', CheckCircle],
                  ].map(([key, label, Icon]) => (
                    <button
                      key={key}
                      role="tab"
                      aria-selected={tab === key}
                      onClick={() => setTab(key)}
                    >
                      <Icon size={18} />
                      {label}
                    </button>
                  ))}
                </div>
                {tab === 'journeys' && (
                  <>
                    <div className="builder-section-heading">
                      <h2>The original journey</h2>
                      <span>
                        {build.sourceMap
                          ? `${build.sourceMap.screens.length} screens observed`
                          : 'Waiting for Explore'}
                      </span>
                    </div>
                    {!build.sourceMap ? (
                      <div className="builder-empty">
                        <MagnifyingGlass size={34} />
                        <h3>First, understand the website.</h3>
                        <p>
                          Kane Explore is following reachable paths. Its discoveries will appear
                          here as actual screens, choices and findings.
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="builder-scope">
                          Captured {new Date(build.sourceMap.capturedAt).toLocaleString()}.{' '}
                          {build.sourceMap.complete
                            ? 'This bounded exploration finished.'
                            : 'Partial exploration. Flow names describe candidates; only reached states and explicit checks establish behavior.'}
                        </p>
                        <div className="builder-screen-list">
                          {build.evidence
                            .filter((e) => e.branch === 'explore')
                            .map((e) => (
                              <button key={e.id} onClick={() => setSelectedImage(e)}>
                                {e.imageUrl && (
                                  <img src={e.imageUrl} alt={`Kane capture: ${e.facts.name}`} />
                                )}
                                <span>
                                  {e.facts.name}
                                  <Image size={16} />
                                </span>
                              </button>
                            ))}
                        </div>
                        <div className="builder-transitions">
                          {evidence.map((e, i) => (
                            <article key={e.id}>
                              <div className="builder-step-number">{i + 1}</div>
                              <div>
                                <h3>
                                  {e.branch === 'overview'
                                    ? 'Browse the observed website paths'
                                    : e.branch === 'primary'
                                      ? 'Observe the original choice'
                                      : 'Change the choice. Follow the consequences.'}
                                </h3>
                                <Observation value={e.facts.source_terms} />
                                <Observation value={e.facts.source_transition} />
                                <button onClick={() => setSelectedImage(e)}>
                                  <Image size={16} /> View Kane’s reached state
                                </button>
                                <small>
                                  {new Date(e.at).toLocaleTimeString()} · Browser run {e.status}
                                </small>
                              </div>
                            </article>
                          ))}
                        </div>
                        <details className="builder-details">
                          <summary>
                            Explore flow records <CaretDown />
                          </summary>
                          {build.sourceMap.flows.map((f, i) => (
                            <p key={f.id || i}>
                              {f.name || f.title || f.id}{' '}
                              <small>{f.status || 'Observed candidate'}</small>
                            </p>
                          ))}
                        </details>
                        <details className="builder-details">
                          <summary>
                            Accessibility and other findings ({build.sourceMap.findings.length}){' '}
                            <CaretDown />
                          </summary>
                          <p>
                            Reported findings are not automatic proof of a violation or its repair.
                          </p>
                          {build.sourceMap.findings.map((f, i) => (
                            <div key={f.id || i}>
                              <p>
                                <strong>{f.title || f.rule_id || f.category || 'Finding'}</strong> ·{' '}
                                {f.confirmed ? 'Confirmed by tool' : 'Not independently confirmed'}
                              </p>
                              <p>{f.description}</p>
                              {f.occurrences?.[0]?.detail?.rule && (
                                <small>Reported rule: {f.occurrences[0].detail.rule}</small>
                              )}
                            </div>
                          ))}
                        </details>
                        {build.sourceMap.detailReads && (
                          <p className="builder-scope">
                            Detailed API evidence:{' '}
                            {build.sourceMap.detailReads.filter((r) => r.status === 'read').length}{' '}
                            records read.{' '}
                            {build.sourceMap.detailReads.filter((r) => r.status !== 'read').length}{' '}
                            unavailable.
                          </p>
                        )}
                        {build.sourceMap.writeup?.status === 'read' && (
                          <details className="builder-details">
                            <summary>
                              Explore’s account of the website <CaretDown />
                            </summary>
                            <p>
                              Observed context from run {build.sourceMap.writeup.runId}; this is
                              evidence for the builder, not a verified specification.
                            </p>
                            <pre className="builder-evidence-text">
                              {build.sourceMap.writeup.markdown}
                            </pre>
                          </details>
                        )}
                      </>
                    )}
                  </>
                )}
                {tab === 'decisions' && (
                  <>
                    <div className="builder-section-heading">
                      <h2>Evidence shaped the interface</h2>
                      <span>{current ? 'Revision ' + current.revision : 'Not built yet'}</span>
                    </div>
                    {current?.decisions?.length ? (
                      current.decisions.map((d, i) => (
                        <article className="builder-decision" key={i}>
                          <Code size={20} />
                          <div>
                            <h3>{d.component}</h3>
                            <p>{d.change}</p>
                            <small>
                              Revision recorded {new Date(current.createdAt).toLocaleString()}
                            </small>
                            <div>
                              {d.evidenceIds.map((id) => {
                                const e = build.evidence.find((e) => e.id === id)
                                return e ? (
                                  <button key={id} onClick={() => setSelectedImage(e)}>
                                    Source evidence <ArrowSquareOut size={13} />
                                  </button>
                                ) : null
                              })}
                            </div>
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="builder-empty">
                        <Code size={34} />
                        <h3>Every change needs a reason.</h3>
                        <p>
                          The builder’s decisions will link back to the source screenshots and
                          transitions that informed them.
                        </p>
                      </div>
                    )}
                    {current?.previewUrl && (
                      <a
                        className="builder-preview-link"
                        href={current.previewUrl + '?inspect=1'}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Inspect generated revision {current.revision} <ArrowSquareOut />
                      </a>
                    )}
                  </>
                )}
                {tab === 'checks' && (
                  <>
                    <h2>Revisions & verification</h2>
                    {build.candidates.length ? (
                      build.candidates.map((c) => (
                        <article className="builder-candidate" key={c.revision}>
                          <div>
                            <strong>Revision {c.revision}</strong>
                            <span className={'builder-verdict ' + c.status}>{c.status}</span>
                          </div>
                          <p>
                            {c.verification?.summary ||
                              c.failure?.message ||
                              c.failure?.summary ||
                              'Preparing this candidate.'}
                          </p>
                          {c.verification && (
                            <ul>
                              <li>Browser journey: {c.verification.status}</li>
                              {c.verification.replay && (
                                <li>
                                  Replay attempts: {c.verification.replay.replayedSteps}; steps
                                  authored: {c.verification.replay.authoredSteps}
                                </li>
                              )}
                              <li>
                                Saved source outcome:{' '}
                                {c.verification.sourceMatch ? 'Confirmed' : 'Not confirmed'}
                              </li>
                              <li>
                                Same frozen requirements:{' '}
                                {c.verification.contractHash === build.contractHash ? 'Yes' : 'No'}
                              </li>
                            </ul>
                          )}
                          {c.verification?.testFile && (
                            <button onClick={() => readTest(c)}>
                              Read Kane’s English test <ArrowSquareOut size={14} />
                            </button>
                          )}
                          <small>
                            Recorded {new Date(c.verification?.at || c.createdAt).toLocaleString()}{' '}
                            ·{' '}
                            {c.hash
                              ? 'Artifact ' + c.hash.slice(0, 16)
                              : 'No compiled artifact yet'}
                          </small>
                        </article>
                      ))
                    ) : (
                      <div className="builder-empty">
                        <CheckCircle size={34} />
                        <h3>Built is not verified.</h3>
                        <p>
                          Kane will use the generated controls, check the source result and send
                          failures back to the builder.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </section>
              <aside className="builder-timeline">
                <h2>Build journal</h2>
                <p>Actual events, kept with this build.</p>
                <ol>
                  {build.events
                    .slice(-20)
                    .reverse()
                    .map((e) => (
                      <li key={e.sequence}>
                        <time>
                          {new Date(e.at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </time>
                        <p>{e.summary}</p>
                        {e.revision && <small>Revision {e.revision}</small>}
                      </li>
                    ))}
                </ol>
              </aside>
            </div>
          </>
        ) : (
          <p className="builder-loading" role="status">
            Restoring your build…
          </p>
        )}
        {error && (
          <p className="builder-alert" role="alert">
            {error}
          </p>
        )}
      </main>
      {selectedImage && (
        <div
          className="builder-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Kane source evidence"
        >
          <button autoFocus onClick={() => setSelectedImage(null)}>
            Close evidence
          </button>
          <figure>
            {selectedImage.imageUrl ? (
              <img src={selectedImage.imageUrl} alt="Actual Kane source capture" />
            ) : (
              <pre className="builder-evidence-text">
                {selectedImage.facts?.journey
                  ? selectedImage.facts.requirements +
                    '\n\n--- Kane-designed journey ---\n\n' +
                    selectedImage.facts.journey
                  : display(selectedImage.facts)}
              </pre>
            )}
            <figcaption>
              {display(selectedImage.facts?.source_terms || selectedImage.facts?.name)} · Recorded{' '}
              {selectedImage.at}
            </figcaption>
            {selectedImage.facts?.affordances?.length > 0 && (
              <details className="builder-details">
                <summary>
                  Observed source controls <CaretDown />
                </summary>
                {selectedImage.facts.affordances.map((control, index) => (
                  <p key={control.key || index}>
                    {control.name} · {control.role} ·{' '}
                    {control.scope === 'policy_blocked'
                      ? 'Blocked by exploration policy'
                      : control.walked
                        ? 'Interacted with'
                        : 'Seen, not operated'}
                  </p>
                ))}
              </details>
            )}
          </figure>
        </div>
      )}
    </div>
  )
}
