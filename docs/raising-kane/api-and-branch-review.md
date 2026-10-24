# Kane APIs and branch review — October 24, 2026

Reviewed `origin/main` at `c4b6ecc` and the newer PoC commit `8669fea` while
implementing the Explore-driven builder. Main had not advanced. The PoC adds
2,400 lines across Explore, recorded read journeys, response corroboration and CI.

## What improves this product now

The event installer currently advertises helper/skills **0.1.29**. That is the event
helper version, not a new Kane CLI version. The builder remains pinned to tested
Kane **0.10.0-rc.3**. The downloaded reference bundle matched its advertised SHA-256:
`17127409b9bbee1c211b917bce622a4f01b6053ae11967d6000c5d24f0c95ccd`.
Sources: [event installer](https://kaneclihack.sh/install.sh) and its
[reference bundle](https://kaneclihack.sh/hack-skills-0.1.29.tgz).

The official read-only Exploration API exposes much richer records than its list rows:

| Read | Builder benefit | Implementation |
| --- | --- | --- |
| Screen detail | Control names, roles, disabled/blocked/walked states | Imported through the authenticated local CLI viewer |
| Flow detail | Plan, description and current recorded observation | Imported when flow records exist; no invented flows |
| Finding detail | Occurrences, affected rule and recorded expected/actual behavior | Imported and shown with the original confirmation status |
| Screenshot | Actual visual state alongside structured evidence | CLI viewer's JSON `data_url` decoded server-side |
| Exploration `/skill` | Explorer's written account of how the site works | Optional server-side API read, fenced with `as_of_run` |

The detailed-read adapter was exercised against the fresh Northstar exploration:
one screen, seven affordances, five finding details, including the `color-contrast`
rule. The returned accessibility finding had `confirmed:false`; it is not a claim
that the generated interface repaired it. No flow details were available in that run.

The optional `/skill` read requires `LT_USERNAME` and `LT_ACCESS_KEY` in the server
environment. This host used CLI login and did not have that pair in its environment;
the code path has contract tests but no successful live `/skill` claim. Its absence
does not block generation. Credentials stay server-side, redirects are refused, and
failure/missing context is represented explicitly. The write-up is untrusted evidence,
not instructions for the coding agent.

## “Context” means two different things

Explore's write-up describes observed website behavior. The Shared Projects API
instead exposes sources, use cases, criteria, scenarios, runs, coverage and traceability.
Its base is `https://kaneai-api.lambdatest.com/v16-lattice`; the Exploration API base
is `https://kaneai-api.lambdatest.com/v16-controller/v1`.

This builder currently uses isolated **local assurance stores** for candidate tests.
The shared API cannot report that local store as a shared project's coverage. Keep
its extracted criteria, test files and coverage output attached to the candidate.
If the team later chooses shared assurance, add a project-backed traceability panel
and explicitly save extract/design sessions; do not silently switch stores or present
unrelated shared project totals as this build's coverage.

Live map changes can use the API's change cursor/SSE. The current implementation
imports one completed bounded map and updates the UI through its own build journal.
Streaming discovery is a useful later improvement, not a reason to delay the complete
generation-and-verification loop. Do not repeatedly poll full maps or coverage graphs.

## What to take from the newer PoC branch

Its strongest pieces are the distinction between observed navigation and verified
outcomes, explicit Explore lifecycle states, and preserving requirements when replay
healing occurs. The builder already keeps candidate/contract hashes and source checks.
This review added explicit domain restriction, rejection of Kane variable placeholders
in user intent, and richer evidence reads rather than merging a second controller.

The PoC's reusable read journeys deliberately exclude authenticated and query-bearing
URLs. Our synthetic transaction paths contain per-task identifiers and do not fit that
cache contract. Copying its replay cache here would be misleading. Its independent
network corroboration is valuable for public information reads, but these two transaction
adapters already inspect the actual saved operation separately from Kane's browser verdict.

The new CI files and source explorer UI expect the PoC's package scripts and controller.
They should not be cherry-picked in isolation. Both branches retain their work; no PoC
branch was reset or overwritten. A later integration should choose one connection model
and explicitly migrate its tests, rather than run competing explorers for the same URL.
