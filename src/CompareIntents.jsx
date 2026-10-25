import { ArrowRight, CheckCircle, MagnifyingGlass } from '@phosphor-icons/react'

const columns = [
  {
    id: 'store-overview',
    image: '/examples/overview.webp',
    icon: MagnifyingGlass,
    label: 'No intent',
    heading: 'A read-only guide to the store',
    alt: 'Captured generated site guide with Overview, Shop, My orders and Help centre navigation.',
    points: [
      'Kane maps the screens it can reach: shop, orders and help.',
      'Nothing is started. Browsing never changes the source.',
      'You choose a task afterwards.',
    ],
  },
  {
    id: 'store-focused',
    image: '/examples/focused.webp',
    icon: ArrowRight,
    label: 'With intent',
    heading: 'One task, the choices that matter',
    alt: 'Captured generated interface headed Return the red shoes. Keep the jacket.',
    points: [
      'Centred on the shoes, the kept jacket, the method fee and the refund destination.',
      'A changed method that moves the refund is surfaced as a conflict.',
      'Approval stays locked until the saved source matches your request.',
    ],
  },
]

export default function CompareIntents({ catalog, pending, onOpen }) {
  return (
    <section className="rk-compare" id="compare-intents" aria-labelledby="compare-title">
      <div className="rk-compare-head">
        <span className="rk-kicker">SAME WEBSITE, TWO STARTING POINTS</span>
        <h2 id="compare-title">Compare the output</h2>
        <p>
          Both interfaces were generated from the same Northstar store. The only difference is
          whether a goal was given.
        </p>
      </div>
      <div className="rk-compare-grid">
        {columns.map((c) => {
          const demo = catalog?.recordedDemos?.find((d) => d.id === c.id)
          const Icon = c.icon
          return (
            <article className="rk-compare-card" key={c.id}>
              <header>
                <span className="rk-compare-label">
                  <Icon size={15} /> {c.label}
                </span>
                <h3>{c.heading}</h3>
              </header>
              <img src={c.image} width="938" height="750" alt={c.alt} loading="lazy" />
              <ul>
                {c.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              {demo ? (
                <button type="button" disabled={pending} onClick={() => onOpen(demo.id)}>
                  <CheckCircle size={15} /> Open verified build
                </button>
              ) : (
                <p className="rk-compare-note">
                  Captured preview. A verified build is not recorded yet.
                </p>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
