# Kane CLI field guide — rc.3 and Raising Kane

Updated October 24, 2026. Practical reference for the event release and the two-website Raising Kane project.

**Version checked:** npm currently publishes `rc = 0.10.0-rc.3` and `latest = 0.9.0`. The rc.3 publication timestamp is `2026-10-24T16:27:21.712Z`; its GitHub release is marked prerelease. These are point-in-time registry/release checks, not a reason to upgrade an environment automatically. [npm metadata](https://registry.npmjs.org/@testmuai%2Fkane-cli), [rc.3 release](https://github.com/LambdaTest/kane-cli/releases/tag/0.10.0-rc.3).

**Status labels:** “documented” means the pinned release docs describe it; “observed” means an experiment recorded it; “proposed” means our product must implement and demonstrate it. The user authorized extensive new tests and a separate account profile. See the dated validation section and its report for measured results; examples outside that section remain recipes, not proof of execution. Tests use synthetic local fixtures, not customer transactions.

The original field guide is preserved in [the historical experiment archive](docs/raising-kane/kane-cli-field-guide-0.9-historical.md). Its 0.9.0 timings, credit figures, concurrency behavior and old product rankings are historical. This guide governs current usage; the [Raising Kane project brief](docs/raising-kane/raising-kane-project-brief.md) governs product scope.

## New builder direction and fresh Explore measurements

The [complete builder plan](docs/raising-kane/explore-driven-builder-plan.md) supersedes
fixed-interface scope. The bounded agentic builder is now implemented on main; consult
its [implementation record](docs/raising-kane/builder-implementation.md) for current
verification status. Older sections below describe their dated experiments and do not
establish acceptance of the new runtime loop.

### Runtime integration observations and exposed APIs

The [API and branch review](docs/raising-kane/api-and-branch-review.md) checks the event's
0.1.29 reference bundle against the real rc.3 integration. The event helper version is
separate from the CLI version.

- `explore run` emits `progress`, `skill_updated`, `map_delta` and `done` events in
  the observed stream. `progress.visited` and `frontier` can drive honest progress text;
  they are not a percent-complete estimate. Preserve `done.complete` and the stop reason.
- The local viewer's `/api/screenshot?junction=<id>` returns JSON with a `data_url`,
  not raw JPEG bytes. Decode the image's actual MIME type. Treating JSON as a JPEG
  loses the visual input even when the HTTP request succeeds.
- List rows summarize controls and findings. Read `/api/view/junctions/{id}` for
  affordances/roles and `/api/view/findings/{id}` for occurrence details. Their envelopes
  are `junction` and `finding`; flow detail returns `flow` and `current`. Preserve
  missing observations as unknown. These viewer reads proxy the read-only API using
  the CLI's authentication; they do not start another browser journey.
- The fresh synthetic return exploration reported a color-contrast finding and blocked
  draft POSTs under `read_only`. One reached screen and zero flow records is an honest
  result. Separate sandbox branch missions established the fee/destination transition.
- Detailed API reads recovered seven controls and the accessibility rule. Reported
  findings remained `confirmed:false`; neither API detail nor a screenshot establishes
  that our generated UI repaired the issue.
- The direct exploration `/skill?as_of_run=<run>` endpoint can supply a written account
  of the site. The optional adapter is implemented, but this host did not have the
  separate Basic-auth environment pair, so that direct read is not live-verified.
- Shared project APIs describe shared assurance, not `.context/` on a developer's
  filesystem. Keep local candidate coverage local, or deliberately migrate/save to a
  shared project. Do not mix stores or substitute whole-project coverage for one build.
- A preview journey can trigger source jobs. Give the preview browser a separate owned
  lane; if it holds the same serialized queue it waits on, the product deadlocks.
- Pass screenshots as actual image inputs to the coding model, tied to step IDs and
  observed values. A filename or screenshot URL appearing in prompt text is not vision.

The new [capability experiment](docs/kane-builder-validation/report.md) used a synthetic
read-only fixture and a four-lease rc.3 Explore run. It established:

- Actual machine-readable map/finding reads through the local `explore view` server:
  `/api/view/summary`, `/api/view/junctions`, `/api/view/flows`, `/api/view/findings`
  and detail routes. This is an observed version-specific integration, not a public
  `explore export` command or a promised stable API. Handle `next` pagination.
- Five accessibility findings across two screens, covering `html-has-lang`, `image-alt`,
  `label` and `color-contrast`. Detail records contain rule, impact, WCAG reference and
  evidence metadata. All five returned `confirmed: false`; preserve this distinction.
- Three flows marked `verified`, but two multi-step flow names exceeded the actual
  recorded path. Independent requests showed no review page visited in that short run.
  Inspect reached screens and step evidence; do not authorize a business outcome from
  a flow name or status alone. Use focused `run` checks for missing business facts.
- Budget stop returned exit zero with `complete: false`. The 52.54-second runtime is one
  measurement, not a generated-interface delivery promise. The full `credits.total`
  and top-level `credits_consumed` differed; retain both instead of inventing a cost.

For the next product, use Explore on both source and generated preview, feed observed
journeys into an actual coding-agent build, test outcome correspondence with Kane and
rebuild on generated-code defects. The preview verifier and source operator require
separate queues/browsers to avoid a nested-job deadlock. Automatic accessibility scans
remain partial evidence; an accessibility tree is not a full audit.

## Kane screenshots as builder input

The [input experiment](docs/kane-builder-input-validation/report.md) supplies actual Kane
execution-pack screenshots to `gpt-6.1-sol` as image inputs. Initial screenshots reveal
image-only instructions; distinct branch screenshots and structured observations reveal
the consequences of actions. The model can request bounded Kane missions for missing
states. This does not require an unrestricted browser for the builder.

Preserve the run/step, source record, time, viewport where known, and image hash. Match
screenshots to actual reached states, not inferred flow names or a generic "latest" image.
The experimental helper's final-image selection is not a production metadata importer.
Do not forward login screens, raw account context, or assume secret-variable masking
redacts screenshot pixels. See the [complete input contract](docs/raising-kane/builder-inputs-and-kane-vision.md).

## Guardrails for the planned interface-builder tests

The [testing guardrail contract](docs/raising-kane/explore-driven-builder-plan.md#prevent-real-changes-during-discovery-and-testing)
requires server-owned `inspect`, `test` and `live` contexts. Test workers reach only
isolated sandbox records; external inspect work permits only explicitly supported read
operations. Production actions require a separate live job and scoped authorization.

Kane Explore's `--policy read_only` and `--deny` supplement this boundary; they do not
control generated code, one-shot `run`, direct APIs or the backend source job triggered
by a preview click. Repeat the explicit Explore policy on reruns. `--allow-post` is for
reviewed read semantics only; setup dependencies can still have effects. An HTTP method,
a confirmation dialog or a prompt is not sufficient proof that an operation is harmless.

These are planned enforcement requirements, not newly tested capabilities. Earlier
experiments do not establish a universal no-mutation guarantee. Label sandbox execution
and live observation separately; never let a repair relax policy to obtain a pass.

## Implemented Raising Kane runtime — October 24 follow-up

The integrated `main` implementation now completes both source workflows. Read
[implementation and demo](docs/raising-kane/implementation-and-demo.md) and
[verification](docs/raising-kane/verification.md) for current evidence; old PoC-gap
statements later in this guide describe their recorded checkpoint.

- A product job passes a bounded objective, an explicit source URL and
  `--assertion-failure-mode stop`. Each job explicitly navigates and reloads;
  persistent browser context is not assumed fresh.
- Per-task Chrome profiles and owned CDP endpoints preserve source browser state.
  Kane jobs are serialized. Human approval uses a different app session.
- Review jobs extract every required business field. A passing status with a
  missing currency, wrong amount or changed source revision cannot authorize a
  proposal. Deterministic comparisons supplement, rather than replace, browser
  evidence. The source adapter and Kane observations are labeled separately.
- Kane performs the approved source click. Atomic enforcement and duplicate
  prevention live in the source adapter, not in `--agent` or a natural-language
  instruction. After a timeout, reconcile the operation before retrying.
- A final independent browser job reads the saved source confirmation. Only a
  matching committed record plus all required observed terms creates a receipt.
- User-visible evidence preserves the failed check, correction and green check.
  Sealed pack downloads are available to the task-owning app session. Review packs
  for private metadata before publishing; local availability is not a public URL.
- This build used **local `.context/`**, not a shared assurance link. Generated
  receipt/entry tests remain in `.testmuai/tests/`. Derived criteria are unapproved;
  `--allow-unreviewed` does not make them trusted.
- Variable values must use Kane's object shape:
  `{"return_receipt_url":{"value":"http://127.0.0.1:5173/?taskId=...","secret":false}}`.
  A flat string mapping was not loaded in our first generated test; it emitted
  `unresolved_variables` and opened the playground. That was a harness error, not
  a product regression. Always inspect variable warnings before trusting a run.
- A fresh multi-clause receipt assertion passed, but its saved replay later produced
  empty visual sub-results and failed despite the expected receipt remaining visible.
  Kane automatically re-authored that portion. Preserve both outcomes; a healed pass
  is not a clean replay. See the implementation verification report for the recorded
  assertion. Do not promise replay reliability from an authored pass.
- Explore is integration research, not a prerequisite before every hyperlink.
  This product ships two known adapters; it does not claim arbitrary-site discovery.


## 1. What Kane does, and what our app supplies

Kane executes natural-language objectives in a browser, evaluates explicit checks, extracts values and records evidence. It also supports native mobile execution, recorded journeys, exploration, requirement-driven test design and coverage. The main documented lifecycle is generate, execute and prove. [Guide index](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/README.md).

It is a backend CLI integration, not a frontend SDK or a general-purpose truth engine. An ordinary web page does not acquire control of a user's logged-in browser simply because it invokes our API.

For Raising Kane, OpenAI interprets the goal and explains observed options; Kane observes and operates each supported source; application code stores intent, compares exact values, schedules jobs and enforces approval. The controlled source enforces atomic commit and duplicate prevention. No runtime coding-agent UI is required.

The strongest usage pattern is a bounded action followed by an explicit outcome check. A browser run passing establishes the checks it actually performed, not every implied business promise. A screenshot, a generated test, an Explore map and a model-written explanation each provide different evidence.

## 2. Important corrections to the old guide

- **Explore is available in the event release.** Earlier one-shot “explore this app” prompts did not evaluate the new `explore` command family.
- **Replay costs and timings are observations, not guarantees.** Some old replays consumed zero measured credits; investigation and re-authoring can consume credits. Do not promise free, offline or instant operation.
- **Concurrency is command-specific.** Old concurrent `testmd` processes collided on port 9222. That is not a universal rc.3 limit. Explore's local/cloud limits do not describe suite or app-worker capacity.
- **A failed run can still have changed the site.** Reconcile the source after an interrupted submission.
- **A passed assertion can describe a stale page.** Reusing a CDP session at the same URL did not automatically reload our fixture. Explicitly refresh/refetch the review and bind its source version to approval.
- **Exit code meanings differ.** Analyzer exit zero can include false conditions. Assurance exit three can mean paused. Queued exploration is not a passing application test.
- **`--mode action` is not an approval or read-only boundary.** It concerns blocking/auth/error handling.
- **Healing does not establish correctness.** Keep immutable expectations, preserve the original failure and inspect source evidence.
- **Recorded output is not automatically safe to publish.** Recordings, screenshots and HAR files can contain customer information.
- **The target project requires two source workflows.** Abandoned Drop/Clean Vote recommendations and model-persona “Win” scores are not current decisions or measured winning probabilities.
- **The event deadline is 6 PM**, according to the current official event page; the archived 5 PM advice is superseded. [Event rules and judging](https://www.kaneclihack.sh/).

## 3. Version and setup discipline

For a reproducible rc.3 environment, the explicit package is `@testmuai/kane-cli@0.10.0-rc.3`. Installing the unqualified package can select 0.9.0 because of the current tag assignment. The event installer used `@rc`; that tag can move later.

Useful commands when setup is authorized:

```bash
npm install -g @testmuai/kane-cli@0.10.0-rc.3
kane-cli --version
kane-cli whoami
kane-cli balance
kane-cli run --help
kane-cli testmd run --help
kane-cli explore run --help
```

Record the actual version with artifacts. Use the help for the exact command: flags do not transfer automatically between `run`, `testmd`, `testrun` and `explore`.

Kane authentication and the hackathon event helper's pairing are separate. The user's Mac installer already reported Kane authentication and the Codex skill; this guide is not an instruction to repeat pairing or change the Mac configuration.

Earlier experiments used isolated installations under `/tmp/kane-research/inst` and `/tmp/kane-rc3-review`. `KANE_CLI_SYSTEM_NODE=1` was used there; it is not established as necessary on every machine. Temporary paths may disappear. Prefer a documented project setup over dependence on those historical installations.

## 4. Choose the right surface

**`run`:** a bounded browser mission, extraction or assertion. Suitable for runtime jobs whose values and context change.

**`run --analyzer-only`:** evaluate conditions on the current desktop page without action steps or a saved test. It cannot independently navigate to evidence elsewhere.

**`testmd run`:** execute a named, committed journey with step structure and recorded replay. Good for supported recurring phases and regression checks.

**`testrun run`:** execute multiple test files as a suite. Good for isolated regression scenarios, not automatically for continuing one shopper's session through multiple tasks.

**`explore`:** map a supported app and design scenarios. Good for integration preparation; not proof of task completion.

**Assurance commands:** connect requirements, reviewed criteria, scenarios, execution and gaps. Good for integration coverage, not a full design cycle on every customer request.

**`evidence`:** view, integrity-check and package completed execution artifacts. It does not decide whether the expected business outcome was correct.

The [execution guide](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/running-tests.md) and [saved-flow guide](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/testmd/running.md) are the primary references for these execution surfaces.

## 5. Write objectives that can actually be checked

Name the exact record and expected outcome. Separate navigation from assertions: first open the relevant record, then assert its fields. End each phase with a result check rather than a bare click.

Bad objective: “Finish the return and make sure everything is correct.”

Better objective, illustrative only:

> Open the prepared return review for the specified order. Verify that the review belongs to that order and is fully loaded. Store the selected order-line IDs, quantities, return method, refund destination, currency and deduction. Assert that the selected line and quantity match the supplied intent and that the refund destination is Original payment. Do not submit.

The text “do not submit” helps scope the objective; hard prevention still belongs to the supported source/controller. A model instruction is not atomic enforcement.

Use explicit `store … as …` extraction instructions for values needed downstream. Earlier vague requests to “read” or “tell me” did not reliably create reusable structured output. Normalize returned values in code, reject missing fields and correlate them with the intended record.

Check existence and identity before negative or disabled-state assertions. An empty/broken screen must not pass “the jacket is absent” or “this option cannot be selected.” Compute arithmetic in code from observed numbers and the user's constraints; don't ask a second model to independently invent the correct total.

### Additional flags confirmed in installed rc.3 help

`--assertion-failure-mode stop|continue` controls failed assertions during authoring; replay still stops on failures. Use `stop` for a bounded validator whose failure must remain visible. This differs from `--bug-detection`, which controls bug investigation, and from adaptive healing on recorded execution.

`--task-skills` is present as experimental. Its behavior has not been evaluated here and Raising Kane does not depend on it. Experimental WebSocket/SSE capture flags are on one-shot `run`; do not assume they are valid on saved/suite commands. The installed `run` help includes `--chrome-profile`, while the inspected `testmd run` help does not; saved flows can declare supported root browser settings or attach through CDP.

## 6. Practical runtime command patterns

These examples assume an already authenticated, worker-owned browser and prepared synthetic source. URLs, IDs, files and ports are illustrative. They are not a complete integration or commands to execute against customer accounts.

### Observe a source review

```bash
kane-cli run \
  'Open {{review_url}}. Verify the displayed order is {{order_id}}. Store the refund destination as refund_destination. Store the deduction as deduction. Verify the review summary is visible. Do not submit.' \
  --variables-file ./runtime/task-values.json \
  --cdp-endpoint http://127.0.0.1:9331 \
  --mode action --agent --max-steps 20 --timeout 120
```

An illustrative variables file is:

```json
{
  "review_url": {"value": "http://127.0.0.1:4101/returns/draft/demo-1"},
  "order_id": {"value": "DEMO-ORDER-1"}
}
```

Pass secrets through the documented secret mechanism and keep runtime files outside committed artifacts. When implementing the worker, spawn the CLI with an argument array instead of constructing a shell command from the user's text.

### Check the current page without navigation

```bash
kane-cli run --analyzer-only --agent --allow-missing-url \
  --cdp-endpoint http://127.0.0.1:9331 \
  --condition 'The complete review for DEMO-ORDER-1 is present' \
  --condition 'The refund destination is Original payment'
```

Inspect every `condition_results` value. This command may exit zero even when the second condition is false. For the demo's visibly failed Kane run, use a normal validation objective with a failing assertion instead of displaying analyzer exit zero as a failure.

### Execute a recorded validation phase

```bash
kane-cli testmd run ./flows/return_validate_test.md \
  --cdp-endpoint http://127.0.0.1:9331 \
  --variables-file ./runtime/task-values.json \
  --agent --no-adaptive-heal
```

The referenced file must actually exist and express the current expected values. `--no-adaptive-heal` belongs to saved execution; an earlier attempt to pass it to one-shot `run` was rejected. No such flow files were created or executed by this documentation update.

## 7. Parse completion by command, not by color or prose

For one-shot `run`, use the terminal `run_end` result and process exit. For `testmd run`, use `test_md_done.overall_status`; embedded `run_end` events can end individual steps. Local suites use `testrun_done`; remote execution also has `remote_done`. Generation emits `generate_done`. Assurance has its own envelope and terminal `done`; shared-project sessions can finish without being saved.

Always handle missing terminal events, nonzero exits, malformed output and canceled processes. Progress is useful for display but does not authorize the next transaction phase. Tolerate unknown event types and preserve raw NDJSON for diagnosis.

Classify business outcomes separately from execution outcomes: passed required checks, explicit constraint conflict, automation failure, source unavailable, or ambiguous submission. A partial extraction from a failed job may be useful diagnostically; it is not a successful phase result.

Typical execution exits are 0 passed, 1 failed, 2 setup/usage/error, 3 canceled/timed out. Analyzer and assurance are exceptions with their own contracts. Do not write a single universal “exit zero means safe” handler.

Use a worker-wide deadline as well as CLI limits. In a prior rc.3 fixture, `--timeout 150` accompanied about 192 seconds from stream start to final event. After killing a worker, assume the source may still have changed and reconcile. [Output and command completion](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/running-tests.md).

## 8. Browser state, task context and user intent are different

**Browser state** includes cookies, tabs and the current source page. Sequential steps within a saved execution share a browser. A worker-owned Chrome can be attached through CDP for separate bounded jobs. For Raising Kane this is a proposed integration, not a demonstrated commercial-session handoff.

**Kane context** supplies background and extracted information. `--session-context` does not restore Chrome or authenticate a new profile. Preserve values explicitly; the earlier VisitFit fixture passed a stored value into application code, which constructed the next objective.

**Application intent** includes exact choices, exclusions, revisions and approval. Keep it in the app's durable database, not only model memory or shared context files.

Use one active browser operation per task/account session. The return and service sources get isolated session ownership. On frontend reload, reconnect to the existing task; do not relaunch the task or resubmit. After browser loss, re-establish identity and reconcile the draft/operation before another write.

Within `_test.md`, root settings govern browser/auth context; an imported helper cannot create an independent authenticated role merely by declaring a different profile. [Composition](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/testmd/composition.md).

## 9. Variables, stored values and dates

The documented variable-file format uses entries with a `value` and optional `secret`. Values are strings; numbers are accepted as strings. Boolean/object/array values are not generic variable values. CLI/file overrides and test frontmatter have distinct resolution rules; do not assume arbitrary per-run overrides defeat the file's declarations.

Stored values produced inside a run can be referenced as stored values in later instructions. Do not invent a `{{...}}` variable reference for a value that was never declared or extracted. Missing variables can produce warnings and literal text rather than preventing execution, so prevalidate required values in our controller.

Dataset syntax `${column}` refers to supplied rows. Datasets do not automatically generate meaningful personas or all combinations. Use explicit scenario inputs and separate expected outcomes.

Smart dates are documented in UTC. For appointments, supply the actual source timezone and explicit local date/time; “Saturday morning” must be resolved with the user/task context, not a server's UTC day boundary.

Nonsecret values and shared context may sync to Test Manager. Keep private user state out of broad project instructions. Secret masking does not guarantee that screenshots or server responses contain no personal data. [Variables and context](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/variables-and-context.md).

## 10. Checkpoints and corroboration

Kane supports assertions, extraction and if/else conditions using visual, DOM, URL/title and DevTools evidence. DOM is the documented default with visual fallback; optional final validation is distinct from explicit end assertions. Do not replace exact checks with a broad final “looks good.” [Checkpoint overview](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/features/checkpoints/overview.md).

DevTools checks can query network data, console, performance, cookies, local storage and the test clipboard. The mechanism generates a query over captured data; it is not an omniscient backend inspection. [DevTools](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/features/checkpoints/devtools/overview.md).

Network capture resets per step. The documented cap is 5,000 requests, with oldest entries evicted, and response bodies capped at 64 KB; binary response bodies are skipped. Extract needed values in the same step. Match the intended endpoint, record and operation ID; a nearby HTTP 200 is not enough. Request inspection after submission detects an error but cannot prevent the already-sent transaction. [Network](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/features/checkpoints/devtools/network.md).

An objective can also explicitly make an API call, save its response and use it later. This is distinct from observing page traffic. A supported read endpoint can corroborate a saved result. A seeded record/reset endpoint belongs only to an authorized controlled environment. [API calls](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/features/api-calls.md).

**Fresh rc.3 observation:** an objective phrased as “Assert that the GET /api/draft response…” was interpreted as a new API call and failed on the relative URL. The revised instruction, “Using captured browser network traffic only, assert that the response body for the request whose URL ends with /api/draft… Do not issue a separate API request,” produced an actual `devtool_network` check. It passed, failed when the returned destination changed, and passed after restoration. A separate explicit API objective using an absolute URL successfully retrieved and extracted a synthetic receipt. Inspect the emitted actions; phrasing alone is not an enforcement boundary.

Do not assume an exported HAR contains response bodies. Our initial pack recorded the draft request and HTTP 200 but omitted its body text, even though the server supplied JSON. The later successful network check exposed the actual response in its runtime context. Runtime capture and evidence-export completeness are separate checks.

Cookie/storage operations apply to the relevant origin. The clipboard is an isolated test clipboard, not the person's OS clipboard. These capabilities do not create a general session backup or undo facility. [Browser state](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/features/browser-state.md).

## 11. Saved flows, replay and healing

Tests end in `_test.md`; helpers do not. Steps have H2 headings and a prose objective or one `@import` body. Imported helpers inherit the root browser and variables; mixing an import with prose in the same body is invalid. Do not mark a mandatory business check `optional: true`.

First authoring records supported steps. Replay selection depends on recordings and unchanged objectives/configuration; an edit can invalidate later authorable steps. Adaptive healing can retry/re-author supported failures. Strict validation should preserve failure evidence and keep its expected outcome unchanged. [File format](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/testmd/overview.md), [replay](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/testmd/running.md).

The old experiment showed that changing `--url` did not retarget a recorded hard-coded navigation. Parameterize the source URL and record identity from the start. Do not infer that a rerun used new values merely because the command line changed; establish that during implementation.

For Raising Kane, split discover/prepare, validate, correct, commit and confirm. Saved preparation must not run through user approval automatically. Never replay commit blindly after timeout. A successful navigation repair is not permission to substitute a different refund or booking.

Archive recordings with the applicable test when needed, but inspect and sanitize before publishing. Generated Playwright export is optional; an exported file is not a separate successful execution or proof that the user journey passed.

Loops and conditional markers worked in small old 0.9.0 experiments, with a five-iteration cap observed there. Do not treat that observation as a freshly verified rc.3 contract. Prefer bounded missions and explicit waits; don't build long-running reconciliation around an assumed unlimited browser loop.

## 12. Explore in rc.3

Explore walks a source, creates a map and designs tests. It does not execute those designed tests. A finding is not automatically a confirmed defect; completed exploration is not proof of business correctness.

A project retains one exploration of one URL. Pass `--project` explicitly. For Raising Kane's two sources, use distinct exploration projects and isolated working directories. An earlier public-URL attempt without explicit project selection was rejected because the default project already mapped a different localhost URL.

Remote orchestration is the default; an agent launch can return after queuing. Local orchestration waits for its run, but completed/budget outcomes still are not task passes. Limits inspected in rc.3 were 1–4 local and 1–20 cloud exploration browsers; these are not general suite limits.

Always specify the mutation policy for each run; defaults and most options are not retained. `read_only` has exceptions, including setup actions, allowed POSTs and source behavior that mutates through a page load. GraphQL reads can be blocked as POSTs. Review any allow-list rather than broadly permitting a host. Ctrl+C can detach from a remote run rather than stop it. [Explore](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/exploration.md).

Illustrative local mapping command for a controlled source:

```bash
kane-cli explore run --project YOUR_MERCHANT_PROJECT_ID \
  --url http://127.0.0.1:4101 \
  --prompt 'Map order review, return-method choices and the pre-submit review.' \
  --policy read_only --deny 'Submit return' \
  --local-orchestration --browser local --headless \
  --max-parallel 1 --max-leases 6 --no-context --agent
```

Project and URLs are placeholders; read-only mapping may not reach every draft action. With cloud browsers, localhost needs a supported tunnel and its lifetime must cover the run. Do not combine a local browser with a cloud-only tunnel assumption.

Use Explore during source onboarding. In the product, target the known task rather than explore the entire site per customer. Model interpretation of the map still needs reviewed semantics for approval and consequences.

## 13. Shared projects: avoid state and evidence collisions

Profile project configuration, a folder's assurance link, and an explicitly selected exploration project are different things. A one-shot run can upload to the profile's project even when assurance work is linked elsewhere. Do not change global profile settings concurrently between workers.

A shared-project session finishing is not necessarily saved. Follow the actual save instruction and retain its result. `context pull --project …` can link a fresh directory and retrieve the project's tests; a first local execution may still need authoring. Read the pinned joining instructions rather than relying on older “only ingest/extract can link” prose in the same documentation.

Shared assurance uses `.testmuai/assurance.json`; a local store uses `.context/`. They are different modes. Do not combine them casually or merge an append-only `.context/` store through Git. [Shared projects](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/assurance/shared-projects.md).

A suite must belong to one organization/project. Evidence merge also rejects incompatible projects. If merchant and service evidence live in different projects, keep both original packs and a task manifest/ZIP. Do not rename a ZIP of unrelated packs to claim it is a single valid Kane pack. Select an actual primary pack for submission and link additional evidence.

## 14. Assurance, design, coverage and headless modes

Use reviewed task requirements to establish criteria and expected outcomes, then design bounded scenarios and run them. Generated designs are not executions. Pairwise/3-wise expansion is available for design; it does not manufacture customer personas or clone an authenticated source. [Design](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/assurance/design.md).

`--mode agent` in assurance is different from `--agent` for execution and from execution's `--mode action`. Assurance agent sessions can pause with exit 3 and need a resume/answer. CI and override modes have different decision policies. Consume the actual pending question and next-step contract; don't treat a pause or a finished unsaved session as complete coverage. [Automation](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/assurance/automation.md).

Coverage distinguishes execution evidence and design gaps. Proper test/criterion linkage is required. Shared project coverage can lag new runs by minutes and aggregate others' executions; local lenient views can count stale passed criteria while surfacing staleness. `cover gaps` availability differs by store mode. Do not display any of these aggregate percentages as this customer's verified receipt. [Coverage](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/assurance/coverage.md).

The old guide's blanket “assurance costs credits” was too broad. Extraction/design/maintenance inference consumes credits; local listing/inspection/coverage operations differ. [Lifecycle and costs](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/assurance/overview.md).

For Raising Kane, assurance is integration preparation and development coverage. Immediate task checks and per-claim receipts belong to our runtime controller.

## 15. Evidence files and interpretation

Evidence packs are sealed ZIP-format artifacts containing objectives, results, screenshots and execution logs. Session packs live under the Kane session directory; project-store copying varies: named one-shot sessions and saved/suite executions have documented behavior. Capture returned paths rather than assuming every run appears in the current folder.

`evidence serve` exposes a sealed pack through a local viewer server; it is not a live unsealed screenshot stream. `evidence validate` checks artifact integrity/completeness, not whether the expected refund is true. `evidence merge` requires compatible sealed inputs. [Evidence guide](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/evidence.md).

Keep failure and repair evidence, timestamps, objectives, version, task/intent revisions and operation identity. A readable receipt should link each required claim to its source observation. A missing field stays unknown.

Inspect `failure.yaml`, the screenshot and relevant network/console records together. Prior triage sometimes contradicted the screenshot. `confirmed:false`, confidence, status and result-code family are separate signals. Result code 740 is a useful diagnostic lead, not independent proof of root cause; 330 is not proof the source was correct.

Use synthetic customer data in public evidence. Secret-variable masking does not necessarily redact rendered personal information or arbitrary response bodies. A local viewer's no-upload behavior is distinct from normal execution's Test Manager upload behavior. [Test Manager integration](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/test-manager-integration.md).

## 16. Concurrency, remote execution and mobile

`testrun` gives desktop workers fresh isolated Chrome profiles. That is useful for independent fixture scenarios. It does not share a shopper login, private character knowledge or the exact current draft between workers. Different browser profiles can still hit the same server records; isolate source data too. [Batch runs](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/testrun.md).

The old 0.9.0 separate-process collision and nine-browser limit are historical observations, not rc.3 throughput guarantees. For the proposed runtime, serialize jobs per task; give independently owned browsers distinct control endpoints rather than assuming safe automatic allocation.

`--remote` moves supported suites to HyperExecute and requires its plugin/plan. CDP/WebSocket endpoints instead attach a browser to an execution still running locally. A successful dry run does not prove runtime authentication or source reachability. [Remote execution](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/remote-execution.md).

Native mobile requires an app build and the appropriate device/environment. It does not mean automatic operation of any website in a consumer's existing phone session. Mobile, remote grids and large parallel scenario runs are outside Raising Kane's two-desktop-source MVP.

## 17. Recorded observations: preserve their actual scope

### 0.9.0 synthetic shop and concurrency experiments

Small explicit checks detected injected wrong totals, missing validation and a hidden button. One-shot free exploration missed those defects. Passing replay commonly took 14–18 seconds with zero measured credits; failing replay and healing took additional time/credits. Several parallel buyers exposed overselling in a naive fixture. Those findings concern tiny controlled applications, not general reliability, load capacity, security or current-release pricing. Exact measurements, scripts and limitations remain in the [archive](docs/raising-kane/kane-cli-field-guide-0.9-historical.md).

### rc.3 wrong-total fixture

A bounded Explore run inspected very little and reported a missing HTML language attribute; it did not establish the requested arithmetic result. An explicit assertion failed against the wrong total. One root-cause explanation contradicted the screenshot. A corrected fixture passed; a subsequent recorded replay passed; restoring the wrong total failed the unchanged strict check. This supports explicit assertions and artifact inspection, not a broad detection benchmark. [Research record](docs/raising-kane/kane-community-agent-research.md).

### rc.3 project isolation failure and public-site limitations

A public-calendar exploration without an explicit project was refused because the selected project already belonged to a localhost URL. No public-site browser journey occurred. [Explorer record](docs/raising-kane/kane-realworld-explorer.md).

Earlier IKEA exploration notes recorded navigation drift and no correctness assertions. They do not establish an external consumer integration. Avoid treating a list of blocked background requests as confirmed product defects. [Capability review](docs/raising-kane/kane-capability-product-review.md).

### rc.3 contextual VisitFit fixture

A short extraction passed in 22.8 reported seconds and supplied `booking_end = 12:00`; Python calculated the next allowed time and constructed a subsequent objective. The scenario initially failed on an accidental JavaScript escaping bug. The coding agent read Kane's console finding, repaired the fixture and reran the same objective successfully.

The successful scenario took 177.7 reported seconds, about 192 seconds wall time despite `--timeout 150`. An intermediate disabled-state assertion had passed on the broken page, while the overall run failed. Lessons: explicit cross-job state, independent arithmetic, existence before disabled-state checks, whole-job completion and external deadlines. All travel/weather data was fictional. [Full experiment record](docs/raising-kane/visitfit-commitment-workflow-check.md).

### rc.3 role-handoff attempt

The client run failed after about 87.7 seconds wall time when its step budget ended before final verification, although the source request had been saved. The controller did not start the manager. This demonstrates that failed execution can have effects; it does not establish two-role handoff. Historical local records: `/tmp/kane-role-spike/summary.json` and `run.py`. No retry is performed by this update.

## 18. Raising Kane: runtime design for two websites

**Website one:** merchandise return. Preserve the exact returned line/quantity, jacket exclusion, original-payment preference, chosen method and disclosed deduction.

**Website two:** home-service rescheduling. Preserve technician, service and address, require the requested local time window and no added fee, and keep the existing booking until the approved replacement commits.

Both are working sandboxes proposed by the [project brief](docs/raising-kane/raising-kane-project-brief.md), not completed integrations. The same controller/UI serves both; each has a source-specific adapter, record schema, browser session and checks.

Use bounded phases:

1. Observe the exact account/record and resolve the user's intent.
2. Ask for missing input and discover supported choices.
3. Prepare a reversible draft or quote; preserve earlier constraints.
4. Validate the current draft against exact expected values.
5. If conflicting, withhold submission, correct an allowed draft action or ask the user, and validate again.
6. After explicit matching approval, commit through the supported source boundary.
7. Reconcile the operation and verify the saved record.
8. Persist a claim-by-claim receipt, including unknown/pending outcomes.

Use browser calls for observations and actions, not every keystroke or explanation. Fixed UI components render structured options. Do not build a second coding agent to generate that interface.

## 19. The failed Kane case we must demonstrate

In the merchant sandbox, changing to printer-free return deliberately resets the refund destination to store credit. The validator's expectation remains Original payment.

The validation job must produce a genuine failed assertion/result. Do not silently fix inside that same validator, use an analyzer exit-zero result as a fake red run, or fabricate an evidence pack. Retain the failed run and show that no commit was authorized. Correct the draft in a separate job and rerun the same expected check; retain its green result. Then obtain the exact proposal approval and complete submission/confirmation checks.

A strict saved validator can disable adaptive healing to preserve the observable failure. An explicit one-shot assertion can also serve; don't pass the saved-flow-only flag to it. The expectation must not be rewritten to match the wrong destination.

Label the challenge as intentional fault injection. Whether Kane detects it remains to be demonstrated. Runtime correction is distinct from a coding agent changing implementation after a Kane result; the hackathon asks for the latter interaction too.

## 20. Application contracts Kane cannot supply

**Atomic approval:** the controlled source binds a grant to the exact draft version, canonical payload digest, intent revision and operation ID. The source checks the grant and unchanged draft, creates/updates the record and consumes the grant in one database transaction. Browser checks before that transaction do not close the race by themselves.

**Duplicate prevention:** persist an operation ID before the first commit. The source uniquely records it with the request digest and result. Same-key/same-payload repeats return the original result; a different payload is rejected. After timeout, look up the operation. A missing result can race with a delayed request, so any permitted retry retains the same key. An arbitrary external merchant may not support this guarantee.

**Appointment atomicity:** validate current slot availability and the existing booking revision in the same update transaction. Keep exactly one active booking. If no matching slot exists, leave the original intact and request a user decision.

**Session continuity:** worker-owned browser, task lock, exact account verification after resume, durable job state. Context JSON alone does not restore a browser. A frontend reload reads the existing task and receipt without issuing another commit.

**Completion:** require matching approval, passed review validation, a committed operation ID, fresh confirmation of all mandatory business fields and successful final verification. A committed task with missing evidence is “submitted; verification incomplete,” not fully verified and not automatically resubmitted. A refund request is not a settled refund.

The full schemas, fields and boundaries are in the project brief. These mechanisms are proposed application work, not built-in Kane guarantees.

## 21. Source-specific mission examples

These are objective templates, not executed tests or universal site automation.

**Return validator:** inspect the identified complete review; extract the exact item IDs and quantities, return method, destination, currency, subtotal and fee; assert the approved fields and exclusion. No submission. Compare integer monetary values in application code.

**Return confirmation:** open the exact operation's resulting request; verify request/order identity, returned lines, destination, method and amount. Preserve the corresponding submission response in the step where it is available. Confirm the jacket's relevant state against the baseline.

**Appointment discovery:** inspect the existing booking and source timezone; store its version and details; enumerate the supported Saturday-morning slots and their actual technician/fee quotes. Ask for no booking/cancellation action in this phase, backed by the source's preparation boundary.

**Appointment validation:** check the selected slot's exact local date/time, timezone, technician, service, address and additional charge. Inspect the still-active original booking. A 9 AM slot with a different technician and a 10 AM slot with a fee must not pass just because both are Saturday morning.

**Appointment confirmation:** inspect the updated booking ID/version, approved values and active-booking count for this operation. Use source-side uniqueness/atomicity to prevent duplicates; browser evidence alone cannot guarantee them.

Neither template assumes that a future real merchant uses the same terminology, URLs or internal API shape as the sandbox.

## 22. Coding-agent feedback and demonstration evidence

When implementation is authorized, keep a real record of the coding agent running Kane, reading its result and changing its next action or code. Verify the result again without weakening the requirement. Preserve any failure's provenance: accidental bug, deliberate mutation, unsupported source state or automation failure.

For the live product, show both sources, the user's persistent constraints, the actual failed validation/correction, the appointment options and the final receipts. Replay may reduce waiting; it is not a guaranteed live runtime. Timestamp prepared state and label any compressed recording.

The official rubric accepts a full green user journey as proof as well as a failure/green-rerun sequence. Raising Kane deliberately includes the latter to make the verifier's consequence visible. No score or win probability follows from feature count. [Official event](https://www.kaneclihack.sh/).

## 23. October 24 extensive rc.3 validation

The [validation report](docs/kane-validation/report.md) records the controlled experiments, commands, outcomes and remaining gaps. Runnable fixture code and selected evidence are in [the validation directory](docs/kane-validation/README.md). The tests use the installed `0.10.0-rc.3` binary, isolated local sites and owned Chrome profiles.

Key observations already established:

- Both a network-response check and a displayed-value check detected the injected Original payment → Store credit mismatch. Strict saved replays failed and passed again after harness restoration. This restoration is not an agent repair.
- A browser's session cookie survived separate jobs attached to the same CDP endpoint. A fresh browser without that cookie failed the signed-in assertion as expected. Worker/crash recovery is a different, unverified capability.
- Explicit booking extraction supplied values to a separate job through the returned `context` object and `--session-context`. The next job checked the booking ID, technician and time against those values.
- Analyzer returned exit zero and `status: passed` with `condition_results: [true, false]`. Controllers must inspect the array.
- A read-only Explore run mapped a route and aborted a write attempt with `policy_violation`; source counters remained unchanged. It ended at its lease budget with `complete: false`, despite exit zero. This is a partial map, not a full passing user journey.
- Two recorded tests passed through a two-worker `testrun`; this does not establish authenticated role isolation or production throughput.
- Evidence validation accepted a pack missing a screenshot with a warning; removing `run.yaml` made validation fail. Inspect diagnostics and check required artifacts separately.
- Merging the failed and passing attempts preserved nested attempt evidence, but the merged top-level totals reflected the latest passing attempt. Keep original packs and an explicit failure-to-rerun index.
- Same-URL browser reuse exposed stale-state validation. A mandatory freshness step belongs before checking the draft, not merely before obtaining approval.
- Adding an explicit refresh produced the expected parameterized replay results: changed expected/source values passed, and a mismatched expectation failed. The earlier failure was not proof of broken variable substitution.
- A separate synthetic repair experiment completed the full Kane action → red validator → Kane correction → unchanged green validator sequence. This is stronger evidence than the earlier harness-restored cases, but still not the complete product.
- With assertion-failure mode `continue`, an impossible amount check led to an unrequested draft-changing action before the overall failure. Use `stop` for validators and enforce allowed actions in application/source code; stopping on failure does not undo earlier actions.
- Local assurance ingestion, extraction, design and generated-test execution succeeded after repairing dependency resolution in the isolated installation. Coverage moved from 0/5 to 5/5 generated criteria. Shared-team save/pull was not exercised.
- Some cloud evidence ingests failed with 422/missing-blob errors although local packs existed. Code export also failed with 422. Do not substitute a presumed cloud link for a checked local artifact.

These are synthetic feature tests. They do not mean Raising Kane's complete two-website product, atomic approvals, idempotency or final receipts have been implemented or validated.

**Additional UX-artifact check:** an unquoted receipt heading containing a semicolon was extracted correctly, but one compiled assertion expected only the prefix. Supplying the complete expected text as a variable produced a passing receipt/conflict navigation check on the static storyboard. Inspect emitted expectations as well as observed values; keep deterministic business-value comparisons in the controller. A preceding Vite run was confounded by an edit during execution. These three checks are recorded separately in [storyboard verification](docs/kane-validation/storyboard-verification.json) and do not add merchant-workflow evidence.

## 24. What remains unverified for this project

- Both source workflows running end to end through Raising Kane.
- General authenticated-site recovery and end-to-end product recovery. The PoC now implements owned browser profiles and records selected recovery runs; its failed-discovery prerequisite gap is documented in section 26.
- Correct parameter substitution and structured extraction on the chosen replay paths.
- Complete worker normalization and evidence correlations across error/retry cases. Real PoC jobs have passed; that is partial evidence, not exhaustive verification.
- Atomic grants, idempotent commits, slot races and timeout reconciliation in the sandbox implementation.
- Real commercial-site authentication, source stability and submission enforcement.
- Full workflow latency, credit consumption and fit within a live stage slot.
- Any benefit to real users, accessibility effectiveness or willingness to pay.

Documentation and earlier fixture results inform the implementation; they do not satisfy these project acceptance criteria.

## 25. Sources and maintenance

All CLI feature references above are pinned to `0.10.0-rc.3`. Recheck the registry tags and command-specific help before adopting another version; retain old artifacts with their actual version. A docs/help mismatch is an implementation question, not permission to assume a flag exists.

Primary project references:

- [Raising Kane complete project brief](docs/raising-kane/raising-kane-project-brief.md)
- [Feature audit](docs/raising-kane/clearpath-kane-feature-audit.md)
- [Independent Sol review](docs/raising-kane/clearpath-sol-review.md)
- [Original experiment archive](docs/raising-kane/kane-cli-field-guide-0.9-historical.md)

This repository maintains the current guide at `kane-field-guide.md`. The prior repository guide, including macOS reproduction checks, is preserved in [its archive](docs/raising-kane/kane-field-guide-repo-historical.md). The packet filename redirects here. Historical measurements and abandoned idea rankings are retained as history.


## 26. Applying the guide to the real Raising Kane PoC

The [PoC review](docs/raising-kane/poc-review-and-build-priorities.md) inspects
`codex/raising-kane-poc` at `0ad30e5`. Its controller already runs Kane during the
user workflow, reloads the source before each job, and checks the extracted source
revision. It preserves red/correction/green phases. This is product evidence
separate from the earlier synthetic feature experiments.

Practical updates from that review:

- Pass `--assertion-failure-mode stop` explicitly for validator jobs. The worker
  currently inherits this setting; our research profile is already `stop`.
  Neither a stop flag nor a read-only objective is a source authorization guard.
- Distinguish a worker's passing result from the controller accepting it. Require
  complete typed observations and compare all mandatory business values in code.
  Current pre-approval code checks extracted order, destination and revision but
  does not independently compare every monetary/quantity/currency observation.
- Record observation provenance. The PoC's read-only merchant adapter supplies
  draft/options even after a failed browser launch. Those are source facts, not
  successful Kane extractions. Keep these useful channels visibly distinct.
- Reconnection does not restore business prerequisites. After initial discovery
  failure, preparation can proceed without the baseline needed by final receipt
  verification. Resume the missing phase, not just the next available action.
- Keep source inspection read-only unless explicitly handing over ownership.
  The PoC iframe is a separate editable source view; task polling returns saved
  controller state, not automatically refreshed source state.
- Every stable replay phase still needs freshness, identity and required-result
  checks. Runtime phases presently use new `run` jobs; a saved landing smoke is
  not evidence of optimized runtime replay. Benchmark before promising savings.
- Preserve phase/run/intent/source-version links in an evidence index. A local
  file path or cloud share URL alone is not an attached, inspected evidence pack.
- Keep runtime Chrome profile files outside Vite's watched source tree or exclude
  them explicitly. Fresh PoC logs showed page-reload events from browser-generated
  HTML under `data/chrome-tasks`; this does not prove a user was interrupted.
- `npm run dev` starts the PoC's controller, merchant and Vite. Its `preview`
  script starts only Vite static preview; that is not a working full-app host.

A representative sum of the PoC author's phase timings is 426.5 seconds before
submission. It combines separate runs and is not a measured continuous journey.
Use product timings for demo planning; do not substitute tiny fixture timings.

The [fresh audit ledger](docs/kane-validation/poc-review-checks.json) records the
new checks, including a real product-worker run. Source grants, duplicate-safe
commit, persistent confirmation and the appointment workflow still need complete
product acceptance. More CLI features cannot compensate for an unfinished result.
