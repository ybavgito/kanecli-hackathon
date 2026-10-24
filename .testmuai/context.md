# Kane verification context

## Application

Product name: **Raising Kane**. Tagline: **When websites raise hell, raise Kane**.
Current product specification: `docs/raising-kane/raising-kane-project-brief.md`.
Use it over older briefs where scope differs; its contracts still need implementation
and verification.
Use ClearPath only to reference historical documents. The current UI is still the
starter described below; these naming instructions do not claim the product is built.

This is the KaneCLI Hackathon web app. Its local development URL is `http://127.0.0.1:5173`.

## Current smoke flow

1. Open the application.
2. Confirm the `KaneCLI Hackathon` heading is visible.
3. Confirm the readiness checklist contains Build, Verify, and Ship.

## Agent contract

When the product flow changes, replace this smoke flow with the real user journey and clear acceptance criteria. Run Kane with `npm run verify:kane`, inspect its NDJSON evidence, and fix failures before calling the flow done.
