import { useState } from 'react'
import {
  ArrowRight,
  ArrowSquareOut,
  GitBranch,
  MagnifyingGlass,
  CheckCircle,
} from '@phosphor-icons/react'

const returnIntent =
  'Return my red shoes without a printer, keep the jacket, and refund my original payment method.'
export default function LandingExample({ catalog, pending, onUse, onOpen }) {
  const [focused, setFocused] = useState(false)
  const source = catalog?.sources.find((s) => s.kind === 'return')
  const demo = catalog?.recordedDemos?.find(
    (d) => d.id === (focused ? 'store-focused' : 'store-overview'),
  )
  return (
    <section className="rk-hero" aria-labelledby="landing-title">
      <div className="rk-hero-copy">
        <p className="rk-kicker">
          <span /> A website, on your terms
        </p>
        <h1 id="landing-title">
          The same website.
          <br />
          <em>
            A different
            <br className="rk-desktop-break" /> way through.
          </em>
        </h1>
        <p className="rk-hero-description">
          Give Kane a URL. Add a goal, or explore first. An AI coding agent builds a simpler
          interface from what Kane discovers—then Kane puts it to the test.
        </p>
        <a className="builder-primary rk-hero-cta" href="#build-interface">
          Make it simpler <ArrowRight />
        </a>
        <a className="rk-text-link" href="#recorded-demos">
          Or open a verified demo <ArrowRight size={17} />
        </a>
        <div className="rk-hero-footnote">
          <GitBranch size={18} />
          <span>
            Real browser journeys.
            <br />
            Visible evidence behind the interface.
          </span>
        </div>
      </div>
      <div className="rk-example" aria-label="Compare interfaces with and without intent">
        <div className="rk-example-top">
          <span>ONE WEBSITE. TWO STARTING POINTS.</span>
          <span>{focused ? '02 / 02' : '01 / 02'}</span>
        </div>
        <div className="rk-example-switch" role="group" aria-label="Example intent">
          <button type="button" aria-pressed={!focused} onClick={() => setFocused(false)}>
            <MagnifyingGlass size={17} /> Just the URL <small>Explore first</small>
          </button>
          <button type="button" aria-pressed={focused} onClick={() => setFocused(true)}>
            <ArrowRight size={17} /> URL + a goal <small>Focus the interface</small>
          </button>
        </div>
        <div className="rk-example-input">
          <span>northstar / store</span>
          <p>
            {focused
              ? '“Return the shoes. Keep the jacket. No printer.”'
              : 'No task yet. Show me what I can do here.'}
          </p>
        </div>
        <figure
          className="rk-preview rk-preview-full"
          key={focused ? 'focused' : 'overview'}
          tabIndex={0}
          aria-label="Full generated interface, scrollable"
        >
          <img
            src={'/examples/' + (focused ? 'focused' : 'overview') + '-full.webp'}
            width="1000"
            height={focused ? 1762 : 1569}
            alt={
              focused
                ? 'Captured generated interface headed Return the red shoes. Keep the jacket., with printer-free return requirements.'
                : 'Captured generated site guide with Overview, Shop, My orders and Help centre navigation.'
            }
          />
          <figcaption>
            Full generated interface · scroll to see all · synthetic Northstar website
          </figcaption>
        </figure>
        <div className="rk-example-result" aria-live="polite">
          <div>
            <strong>
              {focused ? 'One task. The choices that matter.' : 'A guide before you commit.'}
            </strong>
            <p>
              {focused
                ? 'Items, method, fees and refund destination shape the return flow.'
                : 'Shop, orders and help become a read-only guide. Choose a task when you’re ready.'}
            </p>
          </div>
          <button
            type="button"
            disabled={!source || pending}
            onClick={() => onUse(source.url, focused ? returnIntent : '')}
          >
            Use this example <ArrowRight size={17} />
          </button>
        </div>
        <div className="rk-example-links">
          {source && (
            <a href={source.url} target="_blank" rel="noreferrer">
              See the original website <ArrowSquareOut size={14} />
            </a>
          )}
          {demo && (
            <button type="button" disabled={pending} onClick={() => onOpen(demo.id)}>
              <CheckCircle size={15} /> Open verified build
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
