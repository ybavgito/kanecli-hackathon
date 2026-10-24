const checklist = [
  ['Build', 'Choose a sharp user problem and make the core flow real.'],
  ['Verify', 'Run the flow through Kane and read the NDJSON evidence.'],
  ['Ship', 'Deploy a stable version that survives the live demo.'],
]

export default function App() {
  return (
    <main className="shell">
      <section className="hero" aria-labelledby="app-title">
        <p className="eyebrow">Hackathon control room</p>
        <h1 id="app-title">KaneCLI Hackathon</h1>
        <p className="lede">
          This starter is live, testable, and ready for the idea worth shipping.
        </p>
      </section>

      <section aria-label="Hackathon readiness checklist">
        <h2>Ready to build</h2>
        <ol className="checklist">
          {checklist.map(([label, detail], index) => (
            <li key={label}>
              <span aria-hidden="true">{index + 1}</span>
              <div>
                <strong>{label}</strong>
                <p>{detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  )
}
