# Raising Kane: Explore-driven interface builder

Planning revision: October 24, 2026, after the bounded Explore capability experiment. **Complete implementation plan; proposed successor architecture, not shipped behavior.**

This is the current plan for the user-requested agentic builder. It supersedes conflicting
fixed-interface/no-runtime-builder scope in earlier product documents. Implementation
claims remain governed by their actual verification records.

**When websites raise hell, raise Kane**

The person supplies a website URL and optionally a task. Kane Explore investigates a
bounded workflow. A coding agent uses the observed behavior to generate a simpler,
task-specific interface. Kane explores and tests the preview, and failures drive repairs.
During normal use, Kane continues obtaining current facts, operating supported source
actions and verifying outcomes.

The user gets a working task interface and a saved result, not a developer report.
Discovery and evidence remain inspectable without becoming the main user experience.

## What is established, and what is still a hypothesis

`main` at `ed24246` completes two prebuilt sandbox workflows. The URL-first PoC at
`ff1294a` accepts URLs and goals, preserves extracted source observations, renders generic
components, supports browser takeover/resume, and adds independently checked read-only
results. Neither branch contains the runtime builder or the complete Explore-to-generation
repair loop. A new, isolated Explore capability experiment was performed for this revision;
it does not establish that the proposed product is implemented. See the
[experiment report](../kane-builder-validation/report.md).

The actual `explore` command must be invoked and its map/findings must influence the
builder. Calling `run` with an objective containing the word “explore” is not this stage.

## Accessibility: verified capability and boundary

Inspection of the installed `@testmuai/kane-cli` **0.10.0-rc.3** found:

- Explore's schema includes an `accessibility` observation/finding category in
  `dist/chunk-HK62JVQM.js`.
- Its map viewer includes that category and describes it as “A WCAG 2.2 A or AA rule
  the screen breaks” in `dist/chunk-GQRU3B54.js`.
- `explore run --help` has no dedicated accessibility-enablement flag. Do not invent one.

The new controlled Explore run goes beyond schema inspection: it produced real
accessibility findings with rule IDs, WCAG references, screen references and occurrence
evidence metadata. Inspect the [experiment report](../kane-builder-validation/report.md)
for the exact rules and coverage. Observed rule types were `html-has-lang`, `image-alt`, `label` and `color-contrast`.
The returned `confirmed` field must remain intact;
a reported finding is not automatically independently reproduced or resolved.

This does **not** establish the complete automated rule inventory, whether every screen
gets every check, or accessibility of our generated application. Accessibility-tree use
for browser interaction is separate. Do not identify the scanner engine from familiar
rule names alone.
Sources: [pinned package](https://www.npmjs.com/package/@testmuai/kane-cli/v/0.10.0-rc.3),
[Explore documentation](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/exploration.md).
W3C explains that automated tools cannot determine accessibility alone and require
human judgement: [evaluation-tool limits](https://www.w3.org/WAI/test-evaluate/tools/selecting/).

## Scope and reading order

**Build target:** one fully generated partial-return interface on the existing merchant
sandbox, then the appointment website through the same pipeline. Do not build a
universal website platform before this works.

Read the eight stages below for the user flow; the later sections specify agent tools,
persistence, visible journeys, equivalence checks, rebuilds, implementation packages and
the demo. The key measured dependencies and caveats are in the linked experiment report.

**New measurements:** a four-lease Explore run yielded two screens and five accessibility
findings; a separate focused Kane run established the two refund branches. Machine-readable
viewer responses and screenshots were retrieved. No generated UI, code rebuild or preview
accessibility repair has yet been demonstrated.

## Product decisions

1. **URL is required; task is optional.** No task means shallow discovery followed by
   task selection. An explicit task guides discovery immediately. Do not crawl an
   entire site before asking what matters.
2. **Generate a bounded interface artifact.** The coding agent emits a task-specific
   React module using an approved component library, plus an action manifest. It can
   choose questions, order, conditional branches and review layout. Reusing components
   is compatible with real generation; merely replacing card strings is insufficient.
3. **Keep source execution in the trusted backend.** Generated code has no credentials,
   shell access, direct source-browser control or authority to create approval grants.
4. **Keep user requirements independent.** The builder cannot edit the acceptance
   contract or turn an observed source default into the user's preference.
5. **Check both interface usability and source outcomes.** A green generated screen is
   insufficient. A source issue found during discovery does not mean the preview fixed it.
6. **Do not promise universal transaction support.** Public/read-only tasks can use the
   generic engine. Automated transactions require a demonstrated supported boundary;
   otherwise use human completion and source verification.

## Exact user and system flow

### 1. Connect and establish scope

**Input:** URL; optional goal; optionally a simple preference such as keyboard-only use.

**System:** Validate the URL. Create a connection, source exploration project mapping,
and build job. Bind the allowed origins, source state, task and exploration budget.
For the first demo, use public controlled fixtures, avoiding an unresolved sign-in
handoff between the existing runtime browser and Explore's own browser.

**User sees:** Website identity, task if supplied, and “Inspecting this website.” Explain
that site content is externally processed before authenticated use. Never ask the person
to paste account credentials into the goal.

**Output/gate:** A reachable allowed source, or a specific blocked/authentication state.
A blocked page does not become an empty but supposedly supported interface.

### 2. Run shallow Kane Explore

**Input:** Connection scope and optional task.

**System:** Run the real Explore tool with a small budget and explicit read-only policy.
Capture exploration ID, run ID, map version, stop reason, screens, flows, findings and
evidence references. Preserve what was not reached. Inspect each flow's actual step trace
and reached screen: the capability probe returned `verified` flows with multi-step names
whose recorded path only reached the first options screen. A name/status is not proof
that the named business outcome was reached.

**User sees:** A short observed task list if no task was supplied; otherwise a task-focused
progress summary. Prefer “3 relevant screens observed” to a made-up progress percentage.
The technical map is behind “What Kane found.”

**Output/gate:** Enough observed navigation to identify one candidate task. A link is
only a candidate until its required behavior is established. Budget exhaustion is partial
coverage, not success for every branch.

### 3. Investigate the selected workflow and its alternatives

**Input:** Selected task, observed map and unresolved questions.

**System:** Use focused Explore runs to expand the relevant portion of the map. Use
bounded `run` objectives to reproduce precise transitions and extract exact values.
Record preconditions, action, resulting state, changed facts and evidence. Distinguish
navigation, read-only searches, draft mutations and final commitments.

A real-site read-only pass cannot discover every state-changing branch. For the demo,
use isolated, resettable fixture records and an explicitly authorized mutating Explore
pass with final actions denied. The fixture's server must also reject final submission
without a valid grant; the explorer prompt or deny list alone is not the commit boundary.
Reset between scenarios; never assume browser Back undoes a mutation.

**User sees:** Only consequential clarification: which record, an ambiguous goal or a
choice whose meaning cannot be inferred. Do not ask the user to explain each click.

**Output/gate:** A bounded behavior model for the enabled task. Every enabled action
has evidence or is explicitly labeled as unavailable. Required unknowns block that action.

Example model:

- Review with printed label → choose QR → review with $5 deduction and store credit.
- User still wants original payment → restore destination → review must show $75 to
  original payment, shoes only, jacket kept.

The reset and $5 fee must come from observations. Do not give the builder fixture source
code or hardcoded knowledge of that trap and then call the result discovery-driven.

### 4. Freeze a task contract and produce a build specification

**Input:** User intent, behavior model, selected source record and accessibility findings.

**System:** Store separate objects:

- `TaskContract`: user constraints, expected outcomes and mandatory review fields;
- `SourceModel`: evidence-backed states, transitions, terms, prerequisites and unknowns;
- `AccessibilityFindings`: category, affected element/screen, evidence, reported criterion
  if present, and whether reproduced;
- `InterfaceSpec`: questions, component composition, branches and action bindings.

The optional task changes emphasis and sequence. It must not hide fees, identity,
material alternatives or final approval. Separate observed facts from inferred labels.

**User sees:** “We’ll simplify this task while keeping these choices.” Show the few
material constraints. Ask for clarification only when needed.

**Output/gate:** Versioned contract and specification. Each important field or behavior
can be traced to a user requirement or source observation. Unsupported transitions
cannot become enabled buttons merely because the generator can draw them.

### 5. Generate and build the preview

**Input:** Frozen contract, normalized observations, approved component APIs and action IDs.

**System:** Run a coding-agent job in an isolated build workspace. Produce a React module,
manifest, preview URL and build revision. Typecheck and bundle. The generated module
uses typed backend actions, never arbitrary shell commands or direct credential access.
The builder cannot modify the parent app, source fixture, acceptance contract or evaluator.

The controller—not generated JavaScript—checks action permissions, current source state,
identity and user approval. The generated UI must retain typed amount/identity displays
and explicit unknown states.

**User sees:** A usable preview, clearly marked “Being checked.” Disable consequential
execution until the relevant checks pass. Show what is being built in plain language.

**Output/gate:** An isolated preview that loads, with valid action bindings and no build
errors. Compilation alone does not mark it verified.

### 6. Explore the generated preview

**Input:** Preview URL, contract and intended interaction preferences.

**System:** Run Kane Explore on the preview in a **separate exploration project**. Find
reachable screens, dead ends, broken controls, accessibility findings and missing paths.
Source and preview have different URLs and interfaces; their maps must remain distinct.

Checking a generated interface can trigger its backend. In verification mode its bridge
must target isolated fixture records or read-only source missions. A read-only Explore
policy may block POST-backed preview controls; only known read-only endpoints may be
allowlisted. Full interactive tests use a controlled verification environment.

**User sees:** “Checking your interface.” Show specific issues and repairs when useful,
not an accessibility score with unknown scope.

**Output/gate:** Preview findings with evidence. Source-generated journeys are not assumed
to operate the new controls; their requirements inform new preview journeys.

### 7. Run outcome and accessibility checks; repair the artifact

**Input:** Preview, independent contract, selected scenarios and source baseline.

**System:** Generate requirements-linked Kane tests for the preview through assurance.
Run a small, deliberately chosen matrix. After each task, inspect the source separately.
Compare identifiers, choices, amounts and saved outcomes against the contract and, on
fixtures, an independent deterministic source record. A second model call alone is not
an independent business oracle.

| Scenario | What it must establish |
| --- | --- |
| Normal task | Interface and source produce the requested result |
| Choice changed midway | Dependent fields update; old approval becomes invalid |
| Source defaults conflict | Conflict is visible and execution stops until resolved |
| Required input missing | Clear associated error; no incorrect source action |
| Browser or submission interruption | Unknown result is reconciled before any retry |
| Keyboard-only task | Reach and operate necessary controls without mouse actions; inspect trace |
| Narrow/zoomed view | Necessary content and actions remain usable in the checked configuration |

Add explicit label/name, focus, error-message and status-announcement checks appropriate
to the generated controls. Explore findings guide these checks but do not replace them.
If its accessibility output cannot establish a needed rule, use a separately identified
checker/manual inspection and report provenance. Do not label another tool's result as
Kane output. Real screen-reader usability requires actual assistive-technology testing;
a browser agent or “elderly persona” prompt does not establish that.

Send the coding agent the exact failed expectation, source evidence and affected artifact.
It patches the generated UI or manifest. Rerun the failed scenario and affected regression
cases, preserving original expectations. Cap automated repair at two attempts initially.
A source blocker or unclear user preference requires a different response from a code bug.

**User sees:** A precise status: verified for named scenarios, needs a decision, or blocked.

**Output/gate:** Promote an artifact version only after its required checks pass. Keep
red and green evidence plus the code diff. A healed test recording is not a code repair.

### 8. Let the person use it with live source checks

**Input:** Promoted artifact, current connection and real user choices.

**System:** Re-read volatile facts when loading relevant options; check material terms
before approval; execute only supported authorized actions; verify the saved result.
Reconcile uncertainty rather than blindly retry. Source behavior changes invalidate the
affected binding and can trigger focused Explore plus a new build revision.

Do not run Explore before every hyperlink or rebuild React on every ordinary price change.
Use the learned map for navigation and targeted Kane jobs at meaningful state transitions.
Keep the last verified artifact while checking a replacement, but disable stale actions.

**User sees:** The simple interface, current costs/choices, clear approval where needed,
and a useful persistent receipt. A Validate button rechecks the current proposal; it does
not imply that all unseen branches have been tested.

**Output/gate:** Completion means a source result was verified. Otherwise show unknown or
blocked with a concrete next step. Preserve history across reload.

## How accessibility changes the generated product

| Source finding or observed difficulty | Candidate generated improvement | Evidence needed afterward |
| --- | --- | --- |
| Unlabeled required control | Explicit visible label and programmatic name | Name/label check and successful task use |
| Confusing or inaccessible validation | Associated error text, summary and focus handling | Submit invalid input, find error, correct it and continue |
| Keyboard-inaccessible essential action | Native keyboard-operable control in the new interface | Keyboard-only path, visible focus and trace showing no mouse shortcut |
| Important state conveyed only visually | Text status and appropriate announcement semantics | DOM semantics plus relevant human/assistive-tech check |
| Fee hidden after a choice change | Persistent fee and refund review | Fresh source comparison before approval |

The last row is a task-understanding improvement, not automatically a WCAG violation.
Report functional correctness, accessibility findings and usability observations separately.
Do not compare whole-site issue totals with a small generated task UI as if scope were equal.
No findings returned means none reported in the examined scope, not “fully accessible.”

## Explore command and integration contract

Illustrative first source run, with actual project ID and URL substituted:

```bash
kane-cli explore run --project SOURCE_PROJECT_ID \
  --url SOURCE_URL \
  --prompt "Map the selected task, required inputs, navigation and relevant accessibility findings. Record unknown or blocked paths. Do not infer unsupported outcomes." \
  --policy read_only --max-leases 12 --max-parallel 1 \
  --local-orchestration --no-context --agent
```

Twelve leases is an initial engineering budget, not a guarantee of complete discovery.
`--no-context` is for the first exploration when a map is needed before automatic test
design. If context already exists, inspect its status and manage it explicitly. Later
assurance design is scoped to the selected task, not every screen in the site.

Operational requirements from the pinned [Explore reference](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/exploration.md):

- One project holds one exploration entry URL. Persist source and preview project IDs;
  never reuse a different URL by deleting a teammate's exploration.
- Local orchestration avoids a cloud tunnel for local fixtures. Do not assume it reuses
  the current runtime CDP browser or its authenticated session. Verify that separately.
- Later `--focus` selects a mapped screen, not a persona. Pass the exploration ID where
  required and repeat policy, prompt and budget on each run.
- Queue acceptance/exit zero is not proof of mapped coverage. Inspect the run's actual
  stop state and the relevant flow evidence.
- The probe read JSON from the rc.3 local viewer at `/api/view/summary`,
  `/api/view/junctions`, `/api/view/flows`, `/api/view/findings` and detail routes. These
  are observed implementation endpoints, not a promised stable public SDK. The public
  CLI has no documented `explore export` command. Implement a version-pinned server-side
  reader with pagination and validation; never expose account authentication to the UI.
- Keep separate assurance workspaces for separate linked projects. Do not put a shared
  project link into main's existing local `.context/` workspace.

## Build order and stop conditions

| Order | Deliverable | Completion check |
| --- | --- | --- |
| 1 | Explore ingestion spike | A real run produces imported screens, a transition and finding records; IDs and scope match the tool output |
| 2 | Accessibility capability spike | Inspect a known-defect fixture and record what Explore actually reports; unsupported checks remain explicitly unverified |
| 3 | Contract and behavior model | An observed source branch changes the model without site-specific frontend code |
| 4 | Isolated builder | Same builder produces a versioned preview from that model; no hand-editing the generated result for the demo |
| 5 | Preview Explore and outcome test | Kane operates generated controls and checks a separate source outcome |
| 6 | Repair loop | A genuine failed expectation causes an artifact diff and a passing rerun with the same expectation |
| 7 | Live-use controller and receipt | Current source checks, exact approval where supported, uncertainty handling and persistence work |
| 8 | Second website | Same ingestion/builder path produces a meaningfully different task interface; scope and results recorded separately |

The probe established machine-readable reads through the installed local viewer. The
production reader still needs pagination, schema checks and version handling. If that
integration fails, do not silently replace it with a link scraper. If the builder needs per-site handwritten
frontend code, it has not proved the product. If only the generated UI passes, the outcome
is unverified. If accessibility output is absent, retain Explore for workflow discovery
and show the accessibility capability as unverified rather than inventing an audit.

## Repository integration

Start from the URL-first PoC's connection and discovery work, after checking its latest
head. Bring over main's component styling, evidence/receipt presentation and tested
transaction patterns selectively. Main's return and appointment sites are useful controlled
fixtures, not knowledge baked into the generator. Do not blindly replace either worker:
the PoC adds takeover/cancellation handling while main adds completed source contracts.

New logical modules: Explore runner/reader; behavior-model normalizer; independent task
contract store; isolated builder runner; generated-artifact host; typed action bridge;
preview evaluator; repair coordinator. These are logical boundaries, not a requirement
for eight separate services. One application and worker can host the initial version.

## Demo that proves the idea

Lead with a working generated interface and one actual source result. Then show how it
was created: URL, optional task, Explore map, the discovered rule and the generated code
revision that incorporated it. Demonstrate a reproducible accessibility finding only if
Explore actually emitted it and the preview check demonstrates its resolution.

For the main return example, use isolated source records to investigate the printer-free
branch. Show the observed fee/default change shaping the generated review and execution.
Use a genuine generated-interface failure if one occurs; if a demonstration fault is
injected, label it. Never deliberately break hidden code and claim spontaneous discovery.

Show the second appointment source with a different generated decision structure: time,
technician and fee constraints. Prove one complete generation-and-verification loop first;
add the second complete loop after that gate. A second site's preview-only status must be
stated if that is all the demo achieves.

Fresh generation and testing can take several minutes. Allow a live bounded segment and
keep the full recorded discovery/build/test sequence available. Clearly distinguish cached
artifacts from newly executed work. The final claim is: **Kane's observed behavior shaped
this interface, and named checks demonstrated that this version preserves the task.**

## Concrete first product: an easier partial return

**First website:** the existing synthetic merchant return website in this repository.
**First user:** a shopper returning one item while keeping the others, choosing a
printer-free method and preserving the requested refund destination. **Deliverable:**
a generated, usable return interface, an actual sandbox return and a persistent receipt.

This choice reuses a working source, reset/approval infrastructure and known verification
oracles. It does not require claiming a commercial merchant integration. The generator
receives browser evidence and component/action schemas, not the source implementation.
Treat source-specific execution/approval adapters as disclosed integration code; making
those explicit is compatible with a generalizable generator.

The user must be able to enter the URL, supply the goal, see discovery/build/check progress,
choose the exact item/method/destination, inspect a fresh review, approve, and obtain a
verified receipt. If no goal is supplied, the first discovery offers observed tasks;
unsupported tasks remain clearly unavailable. Do not implement an unrelated task merely
because the URL entry is generic.

**Second website:** the existing synthetic appointment service, only after the first loop
works. Its task is to move a booking into the requested local-time window while preserving
the technician/service/address and avoiding an added fee. A rescheduling UI must be
compositionally different from a return UI: date/time choices rather than line items and
refund methods. The source adapter can differ; the discovery-to-build orchestration,
provenance, artifact host, evaluator and repair mechanism must be reused.

**Generalize now:** tool envelopes, journey/observation schema, component library, builder
inputs, artifact hosting, trace links, verification reports and revision lifecycle.
**Keep specific now:** allowed sites, fixture resets, account/record bindings, commit
adapters, independent business comparators and tested workflows.
**Defer:** arbitrary authenticated websites, automatic credential transfer into Explore,
universal irreversible actions, arbitrary npm dependencies, cross-site transactions,
mobile device clouds and broad disability/persona claims.

The distinction we can defend is a task interface generated from observed behavior,
with a visible explanation of how that behavior shaped the interface and source-backed
checks that can force a rebuild. It is not a validated market moat or universal replacement
for websites. Accessibility supports this proposition; it must not overshadow completion
of the real task.

## Agentic architecture: who actually calls Kane

Use **one orchestrating coding-agent session per build**, a deterministic controller and
Kane workers. Separate roles do not require a swarm of agents or a chat interface.
The person interacts with URL/task inputs and the generated app, not a terminal transcript.

The coding agent can request the following product-owned tools. These names are proposed
Raising Kane interfaces, **not existing Kane CLI commands**:

| Tool | Agent requests | Controller executes and returns |
| --- | --- | --- |
| `inspect_site` | Task focus and remaining unknowns | Actual Explore job, bounded by policy and budget; map snapshot and findings |
| `observe_transition` | A precise unanswered branch question | Bounded Kane `run`; observed values, before/after source states, evidence |
| `read_evidence` | Specific finding, screen or assertion IDs | Sanitized detail and image references with provenance |
| `build_preview` | Candidate module/manifest revision | Deterministic validation/build, immutable artifact hash and preview URL |
| `check_preview` | Candidate ID and selected approved requirement IDs | Preview Explore, Kane journeys, source comparison and immutable result bundle |
| `propose_revision` | Patch plus claimed issue IDs addressed | New candidate revision; old evidence remains attached to old revision |

The agent chooses which unresolved branch to inspect and uses returned findings to alter
its implementation. The controller enforces tool inputs, scope, deadlines and promotion.
No agent can declare its own candidate verified, relax the user's contract or erase a
failed attempt. A successful build tool response is not a verification pass.

For the hackathon, use the installed Codex non-interactive interface behind the builder
runner; its CLI was checked as 0.164.0. Official documentation describes `codex exec
--json`, structured final output, and resuming a particular session. Capture the session
ID and file-change events; feed the failure bundle back to that build's session. There
is no need to build a Codex chat UI. This is a proposed integration, not a new successful
Codex build experiment. [Official non-interactive documentation](https://learn.chatgpt.com/docs/non-interactive-mode).

The builder environment must expose the approved Kane broker tools. Do not grant it
unrestricted source accounts merely because it has an official Kane skill. Mount only
the generated project and supplied observations; the contract/evaluator/source code stay
outside writable scope. A working directory by itself is not isolation. Use the runner's
actual sandbox/container boundary and scoped broker credentials. Build scripts run
without source credentials. Serve generated UI on an isolated origin and bridge only
validated messages/actions to the trusted application.

Conceptual control loop (product pseudocode, not executable CLI syntax):

```text
connection = connect(url, optionalGoal)
sourceMap = agent.inspect_site(connection, boundedReadOnlyScope)
task = optionalGoal or user.choose(observedTasks(sourceMap))
while materialTaskFactsMissing and discoveryBudgetRemaining:
    evidence += agent.observe_transition(nextNecessaryQuestion)
contract = controller.freeze(userIntent, sourceIdentity, checkedObservations)

candidate = agent.generate(contract, evidence, approvedComponents, actionSchemas)
for attempt in [initial, repair1, repair2]:
    preview = controller.build(candidate)
    report = agent.check_preview(preview, immutableContract)
    if controller.requiredChecksPassed(report):
        controller.promote(candidate, report)
        break
    controller.publishFailure(report)
    if report.isSourceBlockedOrIntentAmbiguous or repairBudgetExhausted:
        controller.pauseWithReason()
        break
    candidate = agent.patch(candidate, report, unchangedContract)
```

This is agentic because the next investigation and code revision depend on observed tool
results. The surrounding state machine makes the result inspectable and recoverable.

## Execution lanes and persisted contracts

Use one application/backend with separately scheduled processes; do not begin with
microservices. Persist at least these records, with monotonic sequence numbers for events:

| Record | Required fields and purpose |
| --- | --- |
| Connection | Source origin, allowed origins, site/account binding, browser owner, access state, exploration project/ID |
| Build | Task ID, intent revision, source snapshot IDs, agent session ID, attempt count, state and budget |
| Journey | Ordered observed transitions, initial conditions, resulting facts, branch state and evidence IDs |
| Observation | Fact/value/units, exact source record, run and step IDs, observation time, reproduction status, screenshot/detail refs |
| Artifact | Parent revision, source/contract hashes, module and manifest hashes, preview URL, build result |
| Verification | Artifact hash, contract hash, fixture epoch, scenario inputs, per-claim results, source result and evidence refs |
| Approval | Task/account/record, exact proposal digest, source revision, expiry and operation ID |
| Receipt | Confirmed source operation ID, verified terms, timestamps, evidence and subsequent actions |

Use durable storage (the existing persistence layer initially, or SQLite if introduced
with an explicit migration). A reload subscribes to an existing task/build; it does not
repeat submission or restart discovery. Persist pending jobs so an interrupted process
can be reconciled instead of silently starting a second run.

**Keep three browser contexts distinct:** Explore-owned source browsers; the live source
operator browser; and the preview verifier browser. Cookies, CDP endpoints and state do
not automatically transfer between them. First use public fixture entrypoints and
explicit per-scenario records. Authenticated Explore is a later integration gate.

Each generated artifact has an immutable preview URL. For the first two repair attempts,
allocate a separate preview exploration project per candidate URL; retain the maps with
the artifact. This avoids silently mixing findings from different builds at one URL.
Reuse a source project only for its same entry URL and record its map snapshots. Future
project pooling/version-aware reuse needs its own design, not deletion of active maps.

**Avoid a nested-job deadlock.** The current main worker has one `lastJob` queue. A Kane
job testing the preview can click an action that schedules a source Kane job. If both
wait on that same queue, the source job cannot run until its waiting parent ends. Use:

- a preview-verification lane with its own browser;
- a source-operation lane, serialized per task/account browser;
- an exploration lane with its own browser ownership and separate budget.

A verifier may wait for a source job; it must not hold that source lane's lock. Limit
initial concurrency to the two workers actually needed for a nested flow, pausing
unrelated exploration. A required integration check is that a preview click triggers a
source job which completes before the outer verifier's deadline. Existing prebuilt UI
tests do not establish this new generated-interface dependency.

## Job lifecycle, events and budgets

Persist build phases: `connecting`, `exploring_source`, `needs_task`, `investigating`,
`needs_input`, `building`, `exploring_preview`, `verifying`, `repairing`, `ready`, `blocked`,
`cancelled`. Persist live task phases separately: `preparing`, `reviewing`, `awaiting_approval`,
`submitting`, `reconciling`, `completed`. A build being ready does not mean the user's
transaction is complete.

The controller emits ordered events with `buildId`, `artifactRevision` when applicable,
`sequence`, `timestamp`, `phase`, `kind`, `summary`, `evidenceRefs`, and optional
`decisionId/componentId`. Proposed event kinds include `journey.observed`,
`finding.reported`, `interface.decision`, `artifact.built`, `check.failed`,
`repair.proposed`, `artifact.promoted`, and `source.confirmed`. These are our event types,
not claims about Kane's NDJSON schema. Keep the original tool event alongside the
normalized record. UI reconnect uses the last sequence and replays stored events.

Parse command-specific terminal states: `done` for local Explore (inspect stop reason and
complete), `run_end` for one-shot missions, and `test_md_done` for saved journeys. A process
exit or intermediate passed step cannot promote an artifact. Accept unknown event kinds
without crashing; malformed/missing terminal data yields an unresolved job.

Proposed initial limits: one selected task, one source account/session at a time, one
Explore worker, a 12-lease source budget (the four-lease probe was insufficient for review
branches), and at most two code-repair attempts. A controller deadline surrounds each CLI
job; CLI timeouts alone are not a wall-clock guarantee. Measure full-build latency and
credits before fixing a user-facing completion estimate. Record separate Explore,
source-operation, preview-verification and builder spend; no fixed-price claim is justified.

Cancellation stops only owned jobs, preserves evidence and invalidates outstanding grants.
If an action could have been submitted, reconciliation precedes any restart. Do not cancel
someone else's exploration or kill shared Chrome processes. The first release queues
new builds rather than running unbounded exploration/browser fleets.

## Make Kane's journeys visible and show what they changed

The normal product view remains the simple task UI. A persistent **Kane's journey**
control opens a side panel; the demo can pin it open next to the interface. It must be
backed by stored observations and run events, not a narrative invented after the build.

1. **Observed route:** show the actual screens in order, with branch nodes and visited,
   blocked and unexplored paths distinguished. Each node opens its timestamped screenshot
   and observed inputs/outcome. Distinguish navigation from a successful assertion. A flow named “Review QR outcome”
   that only reached options must display “Reached options; outcome not yet checked,”
   regardless of its raw Explore `verified` label.
2. **Discovery cards:** short facts such as “QR drop-off changed the refund destination,”
   with the source run/step and original values. Separate accessibility, business rules,
   ordinary usability notes and automation failures.
3. **What changed in your interface:** pair each important discovery with its generated
   field/branch and artifact revision. Selecting the card highlights that part of the UI.
4. **Check and repair timeline:** show the failed expectation, observed mismatch, actual
   module/manifest diff summary, new revision and unchanged expectation's rerun result.
5. **Result proof:** show the source confirmation and exact terms behind the receipt.

A provenance row must join actual identifiers:

```text
source observation O17 + user constraint C3
    -> interface decision D4
    -> artifact v2 / RefundChoice field
    -> verification requirement R6
    -> Kane execution K22 / assertion result
    -> saved source confirmation S9
```

These IDs illustrate the schema, not existing results. The builder supplies a proposed
mapping, and the controller checks that the IDs exist and reference the right revision.
A generated explanation alone is not proof of causality. Show a code/manifest diff or
actual changed component along with the evidence.

**Example evidence-to-interface decisions:**

- Observed label/QR alternatives → a printer-free choice placed before refund review.
- Observed fee → deduction and net refund shown together, sourced and timestamped.
- Observed destination reset → explicit original-payment choice and mandatory fresh check.
- Observed inaccessible input → labeled native control and a named accessibility check.
- Observed slot constraints on site two → time-window/technician questions instead of
  copying the return site's form structure.

Do not expose hidden chain of thought. Show tool requests, observable actions, concise
implementation decisions, revisions and evidence. “Live” means new events from the current
job; a recorded screenshot keeps its original timestamp and a recorded label. Progress
uses observed counts and phase names, never fabricated percentages.

## What it means to reflect the original website's flow

Preserve the **task's meaningful states and effects**, not its screen count, visual layout,
confusing terminology or accidental defaults. The generated UI may combine several
source pages, but cannot skip necessary decisions or invent an unsupported operation.

For each generated action, the manifest binds:

- supported source transition(s) and source record;
- input schema, required prerequisites and allowed domain;
- expected state changes and material terms to re-read;
- commit classification and approval requirements;
- independent verification requirements and invalidation dependencies.

Compare source and simplified journeys from equivalent isolated starting records. A
reference journey establishes observed behavior; a separate user-intent contract says
which outcome is acceptable. A merchant's observed store-credit default must not become
our expected outcome when the user requested original payment.

**Meaningful correspondence:** selecting QR in the generated UI invokes the supported
source QR path; the source changes fee/destination; the UI shows the deduction and
preserves or explicitly resolves the destination preference; submission uses the final
review; source confirmation contains the same item, amount and destination. It is fine
that the generated UI needs fewer screens.

**Three distinct verdicts:**

- `interface_check`: generated controls and conditional paths behave as required;
- `source_match`: the source draft/result agrees with the exact expected terms;
- `task_complete`: an authorized action has a separately verified saved confirmation.

A test double is useful for development, but cannot earn `source_match`. Fixture APIs
may reset records, enforce commit grants and provide an independent oracle; Kane must
perform and observe the user-facing workflow being claimed. Label API evidence separately
from browser evidence. On an external site without authoritative state access, narrow
the claim to what the source confirmation actually demonstrates.

## Failure routing and rebuild rules

| Failure class | Product response | Rebuild? |
| --- | --- | --- |
| Generated component, missing branch or wrong action binding | Evidence to builder; revise candidate; rerun original requirement and affected cases | Yes |
| Generated UI misstates a source fee/destination | Block promotion/submission; repair display/binding; compare source again | Yes |
| New source structure invalidates learned transition | Mark action stale; focused Explore, revise source model, rebuild affected UI/manifest | Yes, if binding/structure changes |
| Ordinary fresh price/availability change | Refresh data, show change and invalidate old approval | Usually no |
| User changes goal/constraints | New intent revision; reuse relevant evidence; regenerate affected composition | When structure changes |
| Auth/CAPTCHA/network failure | Pause with precise access/retry/human step; retain evidence | No speculative patch |
| Conflicting or missing user preference | Ask the material question | No until resolved |
| Submission timeout | Reconcile source by operation ID before any retry | Never automatic resubmission |
| Replay failure followed by Kane healing | Preserve both attempts; inspect unchanged expectations and source evidence | Only if actual app defect established |

Promotion binds verification to the exact artifact, contract and source fixture epoch.
Changing any of those invalidates the relevant check. A candidate cannot borrow green
results from its parent. On repair exhaustion, keep the last valid version available only
for still-current actions, disable the failing task and show a specific reason.

For controlled transactions, the source atomically checks approval digest + source
revision + account/record + operation ID at commit. A changed draft rejects the grant.
Persist the operation before attempting submission; reuse that ID during reconciliation.
Kane checks the visible review and later confirmation but does not supply atomicity.
These contracts should reuse main's tested patterns rather than be reimplemented by
arbitrary generated JavaScript.

## Kane capability allocation

Use features because they close a particular product gap, not to maximize command count.
The current field guide and linked validation reports contain exact measured caveats.

| Kane surface | Place in this product | Limit and priority |
| --- | --- | --- |
| Explore maps, flows, findings | Source investigation and generated-preview investigation | Required; bounded maps are incomplete |
| Explore focus, deny, policy, depth/lease limits | Expand only necessary branches and bound discovery | Required; policy is not a universal transaction guard |
| Explore accessibility findings/recheck | Guide accessible generation and track reported defects | Required to ingest honestly; rule-specific claims need actual findings |
| Explore viewer/live step events | Journey panel, branch evidence and discovery progress | Required; local viewer JSON adapter is rc.3-specific |
| `run --agent` with extraction | Resolve branch facts and operate current source drafts | Required; reject missing fields and inspect terminal result |
| Explicit assertions; failure mode stop | Validate required user constraints and retain a real failed check | Required; failed runs can still have effects |
| Variables/context and owned CDP sessions | Carry exact values and account/browser continuity between jobs | Required for live operation; context text is not browser state |
| Assurance ingest/extract/design | Derive preview journeys from independent requirements | Required for committed tests; review criteria, don't trust generated coverage blindly |
| `_test.md` execution | Repeat stable journey checks against a pinned artifact | Required; retain authored/replay/healed distinctions |
| Coverage | Inspect untested requirements and select affected regression checks | Useful; coverage percentage is not task correctness |
| DevTools network/console checks | Confirm saved response fields, spot JavaScript errors, diagnose integration | Useful where semantics and access are established |
| API operations within objectives | Controlled fixture setup or independent result oracle | Optional; not a substitute for demonstrating browser work |
| Analyzer-only conditions | Quick current-screen check during an already-positioned job | Optional; no navigation, check individual conditions rather than exit code |
| Suites/datasets | Isolated combinations of method, destination, input and interruption | Later expansion; isolate source records as well as browsers |
| Evidence validate/serve/merge | Inspectable failure and success packs and demo evidence | Required packs; integrity checks do not validate business truth |
| Explore automatic assurance context | Source-derived suggestions for additional coverage | Optional after the first map; it designs tests, does not execute them |
| Playwright export, remote grids, native mobile, streaming capture | No indispensable role in this bounded web demo | Defer; export failed in an earlier account experiment |

Do not pass all source-generated tests directly to the preview: selectors, controls and
navigation differ. Transfer requirements, predicates and source mappings, then let
assurance design preview-specific journeys. Do not write `_test.md` cases by hand.

## Implementation work packages and acceptance gates

The following are requirements and delivery gates, not fabricated runnable test files.
Generate execution cases through Kane assurance when implementation starts.

| Package | Concrete change | Gate to proceed |
| --- | --- | --- |
| A. Baseline integration | Selectively combine latest URL-first connection/observation work with main's fixtures, styling and source contracts | Existing supported behavior retained; branch merge conflicts resolved consciously |
| B. Explore adapter | Job runner, version-pinned map reader, pagination, snapshot provenance | Import observed screens/flow/finding details from a real run; distinguish partial map |
| C. Agent/tool loop | Bounded broker tools, task contract, decision log, isolated generated workspace | Agent requests Kane evidence and that evidence changes a generated module/manifest |
| D. Artifact host | Build/version store, isolated preview, trusted action bridge | Artifact loads; source actions are scoped; contract/evaluator are not writable |
| E. Verifier | Separate preview/source lanes, preview Explore, assurance journeys, business comparison | Kane uses generated UI and a nested source job completes; independent terms match |
| F. Repair/promotion | Failure classifier, revision diff, same-contract rerun, promotion gate | Actual candidate failure produces actual code change and passing rerun; no silent test weakening |
| G. Customer completion | Fresh review, approval, source commit, reconciliation, persisted receipt | Reload does not repeat action; mismatched draft cannot commit; saved result independently checked |
| H. Journey UX | Observed route, discovery-to-component links, repair history, receipt evidence | Every displayed assertion links to real evidence and correct artifact version |
| I. Second site | Appointment adapter/schema and same builder/evaluator pipeline | Meaningfully different generated UI, no manual per-site frontend implementation |

Recommended code boundaries: `explore-runner`, `explore-reader`, `builder-runner`,
`artifact-store`, `action-broker`, `verification-coordinator`, `journey-store`; UI components
for `BuildProgress`, `GeneratedPreview`, `JourneyPanel`, `DiscoveryImpact` and
`VerificationHistory`. These are proposed modules; don't report them as existing files.

Maintain a single plan/contract source of truth; update `.testmuai/context.md` when the
implementation actually adopts it. Do not replace the currently working verification
suite with unimplemented goals. Keep evidence and generated test files in the public repo
only after inspecting for credentials/customer details.

## Demo script and release scope

A four-minute presentation should show a complete outcome early and use one bounded
live check while the full earlier build run remains inspectable. Full discovery/build/
verification latency is not yet measured; do not promise it finishes during narration.

| Segment | Screen/action | Claim established |
| --- | --- | --- |
| 0:00–0:30 | Lead with actual failed Kane report, resulting repaired version and saved result | Kane affected implementation and the task works |
| 0:30–1:10 | Show the source's difficult return route; user URL and optional printer-free goal | Real, nameable consumer problem and bounded input |
| 1:10–1:50 | Open journey map, select the observed QR consequence, highlight generated review | Discovery shaped the interface; evidence not scripted narration |
| 1:50–2:35 | Use the generated interface; change method; run a fresh Validate check | Runtime Kane and preserved intent |
| 2:35–3:15 | Show failure → code revision → unchanged-check pass; complete sandbox approval/confirmation if latency permits | Repair and verified source outcome |
| 3:15–4:00 | Second site's different generated structure and its actual status; scope and next steps | Reusable engine, with no claim beyond completed work |

Timing is a presentation allocation, not measured run time. Pre-generated artifacts and
recorded runs must be labeled. If a fresh operation is still running, show its actual
state rather than a cached green result. Keep an authorized resettable backup environment
and a voiceover recording; a video does not replace a working main flow.

A failing run is valuable when it exposes a real candidate defect. It is not guaranteed
that every generated candidate fails. Keep genuine failures whenever they occur; if using
an injected fault to demonstrate the repair mechanism, label it explicitly and preserve
the fault introduction. A source constraint violation repaired only by changing a source
draft demonstrates runtime correction, but **does not by itself prove code rebuilding**.

Prioritize a complete first-site loop over an incomplete two-site demo. The second site
is the next expansion target, not permission to cut independent outcome verification.

**Release assets from the supplied rubric:** public repo/run instructions; OpenAI build
usage; Kane evidence pack; 2–4 minute voiced demo; deck; blog with evidence; user-published
LinkedIn/X/Show HN links; any genuine external engagement. Reserve explicit time for those
assets. This plan does not authorize posting to social accounts or guarantee a judging
score. Recheck official requirements at submission. [Official event](https://www.kaneclihack.sh/).

## Final definition of done

For the first website, a new task starts from a URL/goal; real Explore findings enter the
builder; a generated artifact is traceable to those findings; Kane tests its relevant
paths and the source effects; a genuine defect can cause a code rebuild and recheck;
then a person completes the task and receives a persisted, verified source result.
Accessibility findings are reported with their real scope and disposition. Missing
observations, source failures and exhausted repair budgets are explicit states.

Until all these gates are demonstrated, call this a bounded prototype in progress—not
an arbitrary-website simplifier, error-free agent or accessibility-certified product.
