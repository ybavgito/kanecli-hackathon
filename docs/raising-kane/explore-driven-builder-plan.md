# Raising Kane: Explore-driven interface builder

Planning revision: October 24, 2026. **Proposed successor architecture, not shipped behavior.**

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
`4b13ff6` accepts URLs and goals, extracts source observations, renders generic components,
and supports browser takeover/resume. Its ledger reports real catalog observations and
resumed sign-in discovery, but not a complete generated-interface journey. Neither
branch contains the runtime builder or the complete Explore-to-generation repair loop.
No new browser runs were performed for this planning revision.

The actual `explore` command must be invoked and its map/findings must influence the
builder. Calling `run` with an objective containing the word “explore” is not this stage.

## Accessibility: verified capability and boundary

Inspection of the installed `@testmuai/kane-cli` **0.10.0-rc.3** found:

- Explore's schema includes an `accessibility` observation/finding category in
  `dist/chunk-HK62JVQM.js`.
- Its map viewer includes that category and describes it as “A WCAG 2.2 A or AA rule
  the screen breaks” in `dist/chunk-GQRU3B54.js`.
- `explore run --help` has no dedicated accessibility-enablement flag. Do not invent one.

This establishes support for accessibility findings. It does **not** establish the
underlying engine, exact automated rule inventory, whether every screen gets every
check, or a successful accessibility scan on our application. Accessibility-tree use
for browser interaction is a separate capability. The first implementation spike must
inspect real finding output on a controlled fixture before promising specific detections.

Sources: [pinned package](https://www.npmjs.com/package/@testmuai/kane-cli/v/0.10.0-rc.3),
[Explore documentation](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/exploration.md).
W3C explains that automated tools cannot determine accessibility alone and require
human judgement: [evaluation-tool limits](https://www.w3.org/WAI/test-evaluate/tools/selecting/).

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
evidence references. Preserve what was not reached.

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
- Obtain machine-readable map/findings through the verified installed/API integration.
  The public CLI has no documented `explore export` command. Implement and validate a
  small version-pinned reader; do not scrape a screenshot of the map into a presumed API.
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

If machine-readable Explore ingestion fails, the central dependency is unresolved: do
not silently replace it with a link scraper. If the builder needs per-site handwritten
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
