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

## Later branch updates during verification

The PoC advanced again to `63db8e4`, through `3f5b334` and `7008bba`. It now has a
parallel implementation of generated artifacts, an inspection broker, source contracts,
bounded code repair and separate preview execution. Its latest change makes blank-intent
builds strictly read-only overviews and starts a separate focused build after task choice.
It also retains the earlier public-site reading view. Those are useful product directions.

This is substantial implementation work, not just a design sketch. Its own
`runtime-builder-status.md` nevertheless reports landing verification only and explicitly
says the complete live OpenAI/Kane builder loop has not passed there because the API key
was unavailable in that checkout. Unit/build success should not be presented as that proof.

The two implementations use different artifact props/manifests, source-session models,
API routes and controllers. A blind merge would install competing builders and could
disconnect the verification boundary. Keep main's current builder intact while its live
verification runs, and preserve the PoC branch. A deliberate follow-up can adopt its overview→focused-build journey and public
reading entry; copy the interaction design with compatible tests rather than transplanting
its 1,100-line source broker alongside the existing transaction controller.

Meanwhile, main received the independent generic field guide in `c2472ad`. That commit
was merged intact before pushing the next builder checkpoint; no force push or teammate
history rewrite was used. The generic guide is at [docs/kane-cli/field-guide.md](../kane-cli/field-guide.md).

## Final comparison with PoC `e98e98e`

Reviewed the code, not just its README: builder controller, source broker, generator,
artifact compiler, verifier, public-read journey store and network corroboration module.
The newest commit adds source-probe evidence and generator tests; it does not establish
an end-to-end generated transaction. Its status report explicitly says that remains
unverified because its checkout lacked an OpenAI key. Its 88 unit checks are useful,
but test counts do not establish comparative runtime correctness.

| Area | PoC advantage | Main advantage / decision |
| --- | --- | --- |
| URL without a task | A strictly read-only generated overview; choosing a task starts a separate focused build. This better separates discovery from commitment. | Main explicitly starts a supported task before a user-session draft, but rehearses the synthetic transaction during build even for blank intent. Keep that distinction visible. Adopt the two-stage journey later, not two controllers today. |
| Actual generated transaction | Strong code structure and independent source oracle, but the branch reports no full live proof yet. | Main's Linden generation, seven-step Kane journey, exact source result and reload have passed. Northstar's latest progress is recorded in the builder verification report. Keep main as the shipping base. |
| Replay | `kane-journeys.mjs` records and reuses independently corroborated **public, read-only** journeys. It checks test digests, isolates attempted healing and expires recipes. | Main now retains assurance-designed candidate tests and recordings across unchanged requirements. These are different replay paths. The PoC helper intentionally excludes our task-ID query URLs and account transactions; copying it would not speed these source jobs. |
| Generated-code boundary | Blocks more reflective/DOM capabilities and uses a script-hash CSP. | Adapted its additional global, reflective-property and DOM-ref rejection into main, with regression cases. Both remain defense in depth, not formal JavaScript sandboxes. The broader artifact protocol is incompatible and was not copied. |
| Source response checks | Can corroborate public facts from observed same-origin GET responses; it distinguishes HTML from JSON and unknowns from conflicts. | Main independently checks exact synthetic source records and receipts. Adding a further browser network job now would duplicate that check and increase latency. Useful when public-site reading becomes a supported product path. |
| Artifact and action protocol | Manifest-bound `bridge.invoke`, expiring test capability and explicit source execution context. | Main uses `task, act`, an opaque generated frame, host-owned approval and the existing source grant protocol. A direct merge would break the generated-code/API contract. |
| Verification | One-shot browser objective plus independent outcome checks. | Main has requirements ingestion, assurance-designed committed journeys, coverage, preview Explore, retained failures and replay reporting. Keep those. |
| CI and arbitrary-site reading | Additional suites, cloud workflow and public-site discovery are already implemented. | They depend on the PoC's script names, stores and APIs. Port deliberately after the two supported generated workflows; do not install nonfunctional CI entries just to increase the feature count. |

Decision: main is the release candidate. Preserve the PoC work. Its best product follow-up
is overview → explicit task → focused generation; its best replay follow-up is the
proven-public-read cache when main supports that reading workflow. No branch was reset,
force-pushed or overwritten. Compatible code-boundary improvements were adapted rather
than cherry-picking the competing builder wholesale.
