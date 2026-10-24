# Kane CLI rc.3: measured feature validation

October 24, 2026 · Linux x64 · installed CLI `0.10.0-rc.3` · synthetic local HTTP sites and owned Chrome profiles.

**The core pattern worked: browser action → failed independent check → separate Kane correction → the same check passing.** The experiments also exposed stale-page validation, action drift after a failed assertion, packaging prerequisites and cloud evidence problems that the application must handle.

This report covers **50 recorded CLI invocations**, including execution, expected failures, exploration, assurance and inspection commands. Their exit counts are 38 zero, 11 one and 1 two. These are **not a pass rate**: some failures are required negative checks, and some zero exits describe incomplete exploration or a false analyzer condition. Additional evidence-tool checks and the repository smoke check are described separately. See [machine-readable results](results.json).

This is CLI capability validation, not acceptance testing of the complete Raising Kane product. The source pages are intentionally small fixtures. No real purchases, returns, appointments or customer records were operated.

## Outcomes that affect implementation

| Experiment | Measured result | Implication |
| --- | --- | --- |
| Observe the browser's draft API response | Author passed in 38.84 s; injected wrong destination failed replay in 14.02 s; restored source passed in 9.65 s | Network assertions can catch a concrete intent mismatch |
| Check displayed draft values | Author 53.55 s; wrong destination failed in 26.43 s; restored source passed in 16.43 s | A visible review can provide a separate exact-value check |
| Kane correction loop | Separate red validator 31.59 s, Kane correction 28.43 s, unchanged green replay 7.89 s | An actual failure can drive the next browser job; do not hide repair inside the validator |
| Parameterized replay after explicit refresh | Original-payment baseline passed; changed expected/source value Store credit passed in 29.03 s; mismatch failed in 32.25 s | Variables worked in this recorded path once the source was refreshed |
| Fresh one-shot with a variable | Passed in 31.29 s | Tested an alternative to recorded replay for dynamic checks |
| Extract booking and pass context to another process | Extraction 27.26 s; next-job comparison 25.54 s, both passed | Returned context supplied booking ID APPT-1, Maya and 11:00 to the next job |
| Same CDP / fresh browser authentication | Existing browser passed signed-in check; new browser failed it | Browser authentication belongs to the browser, not extracted context |
| Analyzer with one true and one false condition | Exit 0, status passed, `[true, false]` | Inspect each requested condition |
| Absolute-URL API call and extraction | Passed in 40.75 s; retrieved FIXTURE-OP-1 and 7500 cents | Direct calls and page-network observation are separate operations |
| Failed job after successful save | Exit 1; source had Store credit and saved count 1 | Failure does not roll back earlier actions |
| Assertion failure: continue versus stop | Both ultimately failed; continue took 65.12 s and performed an unrequested save; stop took 31.26 s and stopped at the failed check | Use stop for runtime validators; still enforce allowed actions outside the model |
| Final validation enabled | Objective passed in 26.17 s | Flag exercised; this experiment did not independently isolate its added checkpoint semantics |
| Two-worker saved suite | Two tests passed in 8.58 s after authoring | Small independent suites work; this is not a throughput benchmark |
| Explore read-only | Two mapped junctions, one verified flow; a write attempt aborted; no source mutations; 47.15 s | Useful discovery and an observed policy block, not exhaustive certification |
| Explore budget termination | Exit 0 with `complete: false`, `stop_reason: budget_leases` | Completion must be interpreted from the command-specific result |
| Different entry URL in same exploration project | Refused before browser work, exit 2 | Use a separate exploration project for a separate source |
| Local assurance pipeline | Ingest → extraction → design → generated test execution passed; coverage changed 0/5 to 5/5 criteria | Requirement-linked checks work in the repaired local installation |

Timings are wall-clock observations from one machine. Runs overlapped on independent fixtures; do not sum them into a promised user latency or assume these timings transfer to a commercial site.

## The stale-page finding and its correction

The first parameter experiment changed server state from Original payment to Store credit while keeping the same browser page open. The saved test contained only an assertion. Its configured start URL matched the current page, and the run did not fetch the review again. Server request logs confirmed no new review request.

As a result, expecting Store credit failed against the still-rendered Original payment. Expecting Original payment then passed, even though server state was Store credit. The assertion described the old page correctly; it did not establish current backend state. This is not evidence that variable substitution failed.

We added an explicit **Refresh review** action to the test. The positive changed-value replay passed and the mismatched expectation failed. A fresh one-shot using the same variable also passed. Compare [original request logs](runtime-source-events.json) and [refreshed request logs](freshness-source-events.json).

**Application rule:** refresh/refetch the source review, extract its version and compare exact values before granting approval. The commit endpoint must still reject a later version change atomically; browser freshness alone does not close that race.

## The real failure/correction evidence

The fixture begins with Original payment. Kane clicks Save Store credit. The separately recorded guard requires Original payment and fails. The controller then gives a new Kane job the failure and the allowed correction: Restore Original payment. That job changes the source and verifies it. The original guard passes unchanged. No submission occurs.

- [Failed guard screenshot](evidence/red-last-step.jpg)
- [Passing rerun screenshot](evidence/green-last-step.jpg)
- [Failed pack, metadata redacted](evidence/red-metadata-redacted.evidence)
- [Passing pack, metadata redacted](evidence/green-metadata-redacted.evidence)
- [Original and published hashes, redaction record, integrity checks](evidence/provenance.json)
- [Independent source request log](repair-source-events.json)

Published packs are explicitly labeled derivatives: only account username/email metadata was replaced. Test definitions, results, screenshots and failure records are unchanged. The original sealed packs remain local. Both published derivatives pass `evidence validate`; the failed pack retains a status-disagreement warning. Do not describe it as warning-free.

The later failure-mode experiment in the same fixture deliberately asked for the impossible amount $999.00. In continue mode, Kane navigated as requested but also clicked Save Store credit, increasing the source saved counter again. This extra action was not in the objective. Its overall result stayed failed. The earlier guard evidence is a separate pair of runs and must not be conflated with this later experiment.

## Phrasing and API findings

An initial objective said “Assert that the GET /api/draft response JSON…” Kane transformed that into a direct API operation and rejected the relative URL. The run failed despite the fixture's browser request returning HTTP 200. Its narrative also misread a fixture disclaimer. We preserved the failure and changed the wording, not the business expectation.

The successful objective explicitly requested **captured browser network traffic only**, matched the request URL suffix and prohibited a new request. Runtime context contained `analyzer_type: devtool_network` and the actual JSON. Direct API execution was tested separately with an absolute URL and a named response.

The initial exported HAR contained HTTP 200 but omitted response body text. Do not assume runtime capture fields and exported HAR contents are identical. Inspect the artifacts required for the intended claim.

## Explore scope and limits

The read-only run used a dedicated project, one local worker, a three-lease budget and a deny rule for Submit return. It mapped the review-to-appointment route, attempted Save Store credit, and aborted that lease with `policy_violation`. Independent counters remained `saved: 0`, `commits: 0`.

It stopped at budget with an incomplete map. The receipt route remained unproven. This confirms a particular blocked POST path; it does not establish that read-only exploration prevents every possible state change on an arbitrary website. Setup exceptions, unusual GET mutations and source behavior still require integration review.

## Assurance prerequisite and coverage

Initial extraction failed with “assurance agent not found.” The platform package and executable were present and executable. The installed resolver looked beneath the CLI package's own `node_modules`, while npm had placed the platform dependency beside that package.

For this isolated `/tmp` installation only, we added a dependency symlink at the path the resolver expected. We did not alter the user's global CLI installation. Extraction then completed in 12.90 s; one scenario was designed in 35.80 s; its generated two-step test ran in 58.45 s. Context integrity checks passed before and after design. [Before coverage](06-cover-before-execution.json), [after coverage](08-cover-after-execution.json).

This was a **local assurance store**, not a shared-team project save/pull test. Coverage proves the generated criteria selected for this tiny fixture; it is not a claim about the entire return workflow or commercial readiness. The generated test also contains this experiment's ephemeral localhost URL.

## Evidence and export checks

- Original network packs validated. The failure pack had a warning about `broken` versus `failed` status fields; successful packs had no diagnostics.
- Removing one screenshot from a copy produced `valid: true` with a warning. Required screenshots must be checked by the application or submission preparation separately.
- Removing `run.yaml` from another copy produced `valid: false`, exit 1.
- Merge preserved the old failure as nested attempt evidence but reported the latest success in top-level totals. Keep an explicit attempt index and the original red and green packs.
- `evidence serve` delivered the local pack over HTTP; the response bytes matched its SHA-256. Hosted viewer rendering was not tested.
- Some saved runs logged evidence publication failures: HTTP 422 with a missing remote blob/404. Local packs existed. Do not assume a share link or cloud evidence ingest succeeded because execution passed.
- Playwright code export was attempted and failed with HTTP 422, “Failed to get execution data.” Export is not validated working in this account/session.

## What remains untested

Full Raising Kane UI and both transactional source workflows; atomic approval/version binding; commit idempotency and ambiguous timeout reconciliation; slot races; persistent task receipts; worker crash recovery; commercial login/MFA/CAPTCHA; mobile/cloud-device execution; shared assurance collaboration; datasets; streaming-network capture; accessibility outcomes; production load and customer value.

The findings justify bounded implementation choices. They do not justify “error-free,” “works on any website,” or a guaranteed live-demo duration.

## Repository verification

`npm ci` and `npm run build` completed successfully. The existing `npm run verify:kane` starter smoke passed on an isolated local dev port, with a reported execution duration of 20.7 seconds. [Smoke result](repository-smoke.json). This validates the unchanged starter heading/checklist, not the proposed two-source product.
