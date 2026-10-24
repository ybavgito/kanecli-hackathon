# Independent technical review: Kane products for the agent community

Research date: October 24, 2026. Perspective: skeptical integration engineer. This is an independent, read-only review; no other reviewers or agents were contacted. Only this report was written. No Kane runs, external agents, skills, installs, or product experiments were executed in this review.

## Decision

**First spike: AppProof Studio, narrowly a generator for interactive MCP tool views whose displayed data and human edits are checked through a real browser.** Its useful deliverable is an exportable working app, not a verification dashboard. **Second: Handoff Lab**, a portable browser contract suite for agent applications' edit/approve/cancel/resume journeys. **Third: Tool Witness**, an outcome receipt for a tool action, observed through the destination application's UI.

These are conditional engineering priorities, not win probabilities or measured demand. The first has the strongest product demo but the largest integration uncertainty. The second has the clearest independent oracle and community reuse, but it is a harness in a crowded testing market. The third has broad relevance but an unusually strong “why not just query the API?” objection. None is validated yet.

Do not carry forward Drop/Fair Launch as the default. The supplied experiments do not establish the agent-generated failures on which that pitch relied. Rulebook and ProofSheet are plausible products for other briefs, but their primary users are not the agent community. Rebranding their users as agent builders does not fix that mismatch.

The best theme is **preserving intent across the boundary between an agent, a browser interface, and a human's final choice**. This makes browser verification consequential while keeping expected results explicit. It avoids claiming Kane can judge arbitrary AI answers correctly.

## What the evidence supports

I read the [local field guide](/home/harish/code/kane-cli-field-guide.md), the [previous product research](/home/harish/code/kane-ai-app-research.md), local public documentation, selected bundled 0.9.0 JavaScript, and a recorded browser trajectory. I also fetched release-pinned 0.10.0-rc.3 documentation and primary competitor sources.

**Recovered runtime evidence, not independently rerun here:** the guide reports 0.9.0 strict replay detecting three injected shop defects, approximately 14–18 second passing replays on tiny flows, occasional false acceptance of a compound invariant, and successful exact extraction followed by a code comparison. Standalone parallel `testmd` processes collided; `testrun` worked within the measured local browser limit. Hard-coded replay URLs did not retarget with `--url`; a base URL variable worked. Healing changed recording files. These are small, version-specific observations. The supplied 0/288 permission violations and stock/cart successes weaken a failure-led security/load pitch; they do not prove future agents cannot fail.

**Directly inspected 0.9.0 source:** the bundled analyzer exit function checks that the expected number of boolean verdicts exists; it does not require every boolean to be true. A complete set of false verdicts can therefore coexist with exit 0. I also saw terminal event handling for `run_end`, `test_md_done`, and `testrun_done`. These are integration surfaces, not evidence that the underlying closed runner has any particular semantic accuracy.

**Directly inspected recording:** [this baseline tape](/tmp/kane-research/urltest-1792833849/tests/output-shop/.internal/steps/1-35020f4d/flows/0/actions.ndjson) contains a literal navigation URL, a DOM extraction locator, `expected_value: "20"`, an `extract_number` transform, and an assertion tree recording the author's successful comparison. A saved `passed` value in that tape is historical data. Reading it is not a fresh evaluation. The tape illustrates how an English requirement becomes a narrower executable predicate; it does not, by itself, prove every predicate or extraction is reevaluated correctly on replay.

**Documented 0.10 release capabilities, not runtime validation:** [rc.1](https://github.com/LambdaTest/kane-cli/releases/tag/0.10.0-rc.1) introduces a distinct exploration system, cloud concurrency up to 20, map/evidence/recheck features, and shared assurance projects. Its listed findings emphasize technical symptoms such as network, console, accessibility and performance. [rc.3](https://github.com/LambdaTest/kane-cli/releases/tag/0.10.0-rc.3) changes remote exploration to the production CDP endpoint and improves provisioning diagnostics. Neither release establishes semantic business-correctness detection. The old free-exploration experiment does not evaluate this new system.

**Important additional constraints from the release-pinned [exploration guide](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/exploration.md):** exploration also designs tests, but does not execute those designed tests. A project has one exploration tied to one URL; its map accumulates. Cloud is the default; localhost needs a tunnel. Local orchestration documents up to four local Chromes, separately from cloud exploration's 20 and the old local `testrun` measurement. Policy/options must be supplied again; mutating is the default. Thus an app-map-to-tests product substantially overlaps Kane itself. A map is neither independent expected behavior nor proof of successful test execution.

**Docs require runtime confirmation:** [testmd execution](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/testmd/running.md) documents replay/healing, committed output bundles and replay-only markers. Adding an `@js` or `@api` heading does not create that operation; missing recordings cannot simply be authored through those markers. Also, rc.1's broad agent-flag language and the pinned [agent guide's command-specific flag table](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/agents.md) are not perfectly aligned. Inspect installed `--help`; do not design a universal command wrapper from the release summary.

## Six candidate products

All flows below are proposals. “Failure to probe” means a plausible hypothesis, never a claim that an agent has already made that mistake. Competitor descriptions establish overlap; they are not hands-on comparisons or proof of an unoccupied market.

### 1. AppProof Studio — turn an agent tool's output into a usable interactive app

**User and pain.** An MCP tool author returns a long JSON list that an agent's user must inspect, filter, select and correct through chat. The author wants an interactive view without silently changing which record or edited value returns to the agent.

**Usable flow.** Paste one supported list tool's schema and example output. State which fields the human may edit and what selection should return. The app generates a list/detail/review view, lets the author try it, verifies reviewed examples in a local MCP host, and exports the UI resource, small server adapter, contract fixtures and Kane test. The user can install the exported source in their own project. Example: an agent proposes three issue triage changes; the maintainer edits one assignee and selects two issues; those exact IDs and edited values become the agent's context.

**AI role.** Generate the field mapping, layout and restricted view specification from the existing schema and task. The coding agent builds and fixes the actual integration after reading Kane evidence. Use a trusted renderer and bridge for the one-day version, not arbitrary generated backend code. Unsupported schema shapes are visible limitations.

**Why browser/Kane matters.** A tool JSON test cannot establish that a sort preserves record identity, an edit survives a rerender, the intended control is reachable in the embedded view, or a click delivers the selected payload through the real host bridge. Kane operates inside the embedded view, edits/selects, opens the host's observed message panel and extracts the result. The package is gated on that user journey. This is a visual human-to-agent interface, not an API-only pipeline.

**Independent oracle.** An author-reviewed fixture gives stable record IDs, initial values, prescribed interactions, and exact expected outgoing IDs/values. A handwritten comparator uses those fixtures, independently of the generated mapping. A host-side recorder captures actual incoming bridge messages before the generated view can relabel them. Compare both visible fields and captured output; do not accept an app-generated “sent successfully” label. This proves a bounded round trip, not that the tool's initial real-world data is true.

**Failure to probe.** Row-index identity after sorting; edited value omitted from returned context; old tool result surviving a refresh; null or empty values converted to misleading defaults. First test normal unmodified generation, including unfamiliar field names and reordered examples.

**One-day cut.** One list/detail/select template; primitive fields; one MCP transport; one local host; one export format; three reviewed fixtures. No marketplace, arbitrary server importer, production-host certification, general freeform app builder or authentication service. A local worker runs Kane; a hosted frontend alone cannot spawn the CLI. Basic-host use must be checked against a pinned SDK version.

**Three-minute demo.** 0:00–0:20 Kane report and observed outgoing payload; 0:20–0:55 paste the schema and generate the view; 0:55–1:30 use the resulting triage interface, changing one value; 1:30–2:10 strict replay on a second fixture; 2:10–2:40 coding-agent evidence response/commit history; 2:40–3:00 export and use the package. Show an honest green journey if no natural defect occurs.

**Closest competition and difference.** The official [MCP Apps SDK](https://github.com/modelcontextprotocol/ext-apps) already offers generation skills and interactive views. Its [testing guide](https://github.com/modelcontextprotocol/ext-apps/blob/main/docs/testing-mcp-apps.md) provides a sandboxed basic-host and message/context panels. Its [contribution guide](https://github.com/modelcontextprotocol/ext-apps/blob/main/CONTRIBUTING.md) documents browser E2E tests with screenshot comparisons. [MCP Inspector](https://github.com/modelcontextprotocol/inspector) is also a substantial tool, not a protocol-only straw man. Our proposed difference is a constrained generator shipping the author's exact data/edit round-trip contract with the output. Generation, preview, screenshots and “uses MCP” are not differences.

**Fatal objection.** If a generated view plus existing MCP examples is equally useful, this is another scaffold with a Kane badge. Kill it if the team cannot demonstrate the independent round-trip check or an exported app that works outside the studio. Kane access to the real sandboxed frame is an untested hard dependency.

### 2. Handoff Lab — prove the human can change the agent's mind

**User and pain.** Agent-app builders have working tool calls but fragile user controls: the edited draft is lost on resume, a late answer replaces a correction, or a canceled run appears finished. These are visible output-reliability problems even when the model's text and individual APIs work.

**Usable flow.** Connect a local agent UI through a tiny adapter; choose a scenario; give the lab a few control labels and expected payload fields. It runs a task, edits the proposed output as a human, resumes or cancels it, then exports a regression case and evidence. The useful product is a reusable scenario pack and adapter, with a working agent note-to-task application as its example. A builder brings an existing app rather than generating another dashboard.

**AI role.** A real agent drafts the plan or task; a coding agent uses the result to repair the app's state handling. AI may propose adapter mappings, but the builder confirms them. The runtime planning model does not write the scenario's success conditions.

**Why browser/Kane matters.** Kane must exercise the rendered edit/approve/cancel controls and reload a thread. A backend interrupt test cannot show whether the human actually approved the current text, saw the right pending state, or resumed with retained edits. The harness joins these interactions to actual received output.

**Independent oracle.** A small reference state machine and append-only receiver log define allowed transitions and exact accepted task contents. Separately label run IDs and draft revisions. For timing cases use a deterministic event barrier, with a fixed delayed response released only after the browser's cancel/edit action is observed. Do not rely on precisely timed clicks or infer cancellation from a green toast.

**Failure to probe.** Edited owner reverts to the original model suggestion; a canceled response appears after a subsequent run starts; approval is applied to an older draft revision; reload drops a pending edit. These require actual app evidence before being described as found defects.

**One-day cut.** React application, one adapter, three scenarios: edit/approve, cancel/late-result, reload/resume. A seeded receiver stores accepted tasks. No email sending, arbitrary framework support, production trace ingestion or generic agent simulator. The deterministic delayed-response case is explicitly a UI control test; one separate live model journey demonstrates the agent integration.

**Three-minute demo.** Start with the Kane report for “accepted task equals human edit.” Run the agent's real note-to-task flow, change owner and text, accept, and show the stored task. Replay cancel/late-result. Show the coding agent's evidence-driven change and export the tests for another app.

**Closest competition and difference.** [CopilotKit's current human-in-the-loop hook](https://docs.copilotkit.ai/reference/v2/hooks/useHumanInTheLoop) already supplies interactive pause/respond workflows. Its [governed-action example](https://docs.copilotkit.ai/a2a/human-in-the-loop/governed-actions) even checks stable action IDs and references. [LangSmith](https://docs.langchain.com/langsmith/evaluation) already supports datasets, code/human/model evaluators and trace-to-regression workflows. Proposed difference: portable browser journeys checking the final human edit against the receiving system, rather than a new pause API or generic evaluator. [GuardianKane](https://www.testmuai.com/blog/kane-cli-hackathon-winners/) makes another stop-hook gate a particularly weak framing.

**Fatal objection.** If every new app needs custom event hooks, selectors and state assertions, the “portable” product is consulting plus three Playwright tests. Kill broad portability claims if a second app cannot be connected quickly. A focused harness is allowed by the challenge, but community value must be demonstrated by reusable fixtures, not its landing page.

### 3. Tool Witness — a receipt for what the agent actually changed

**User and pain.** An agent operator receives “done” or a successful tool response, then manually opens the destination app to find whether the intended object, project, recipient and values actually changed. The receipt should help them inspect the result, not merely watch another trace.

**Usable flow.** Before acting, create a reviewed work order with the destination, stable target IDs and expected changed fields. A tool-using agent performs it. Tool Witness opens the destination UI in a separate observer session, follows the durable object link, checks/extracts the visible state and attaches a receipt. The operator can open the verified object and compare requested versus observed values. Offer a local MCP/CLI callable by an existing agent plus a small inbox.

**AI role.** The acting agent resolves the request and invokes the tool; Kane independently navigates to the result. No model-generated after-the-fact success standard. If the natural-language request is ambiguous, expose that in the work order before execution.

**Why browser/Kane matters.** The proposed wedge is what the recipient sees: a tool changed the correct record but to the wrong project, a draft was saved without becoming visible to the intended user, or the visible content differs from returned JSON. Kane checks the resulting page under the intended observer identity. A backend GET alone does not establish visibility or actual rendered content. API evidence should still corroborate object identity and saved state.

**Independent oracle.** Freeze the work order before the action. Read destination state through the observer, not from the acting tool's claimed receipt. Compare extracted immutable IDs and exact strings to the frozen contract. An authorized source system is still trusted: independent observation does not prove that its backend or business data is correct.

**Failure to probe.** Same-named target selected in the wrong project; tool reports success after creating a draft; intended user's rendered page remains stale; output cites an old record link. These are probe hypotheses, not observed model behavior.

**One-day cut.** One local issue/task application and two operations, such as create and edit. One real agent integration, deterministic fixture data and a second observer. A minimal compatible task board may prove the harness mechanics but is a weak community artifact unless the adapter is reusable. An external production integration must already be available; do not spend the day on OAuth and workspace permission setup.

**Three-minute demo.** Lead with the receipt's Kane evidence. Give an agent a task, then inspect the result as its recipient. Change an exact field and rerun. Show requested/observed fields and a working link, then the coding agent's response to the verification evidence. End by calling the receipt from an ordinary agent workflow.

**Closest competition and difference.** [MCP Inspector](https://github.com/modelcontextprotocol/inspector), [Promptfoo's deterministic and tool-trajectory assertions](https://www.promptfoo.dev/docs/configuration/expected-outputs/), and LangSmith already cover substantial protocol/output/trace evaluation. [Skyvern](https://www.skyvern.com/docs/developers/browser-automation) also documents browser actions, structured extraction and reusable automation. Proposed difference: a precommitted work order and recipient-visible outcome receipt across tools. Do not claim existing platforms cannot implement that pattern.

**Fatal objection.** For most well-designed tools, a cheap API read is the right verification mechanism. If the supported action has no meaningful rendered or observer-visibility condition, Kane is decorative. Arbitrary websites and arbitrary semantic work orders make this a multiweek product; a custom demo board alone is not enough differentiation.

### 4. Repro Capsule — a bug report an agent can actually rerun

**User and pain.** Open-source maintainers receive AI-generated tickets and patches whose reproduction instructions have never been executed. The maintainer needs a runnable claim before delegating investigation to a coding agent.

**Usable flow.** Paste a report and an already-running local/staging URL. Confirm starting data, expected behavior and alleged observed behavior. The product drafts a small reproducible journey, executes it, and exports the test, prerequisites, current observation and evidence. Unreproduced reports remain unreproduced. A maintainer can give the capsule to their coding agent, then rerun against a fix URL.

**AI role.** Translate prose into explicit actions and observations; summarize the captured evidence for the coding agent. The builder agent fixes source after reading the capsule. It does not create a new miniature implementation whose artificial bug merely resembles the original report.

**Why browser/Kane matters.** Reproduction is a sequence of actual UI interactions, often involving hidden state or a change after reload. API assertions cannot establish that the reported user path produces the claimed screen. Kane provides the executable path and the evidence needed for a maintainer's handoff.

**Independent oracle.** Reporter/maintainer approves the expected value separately from the alleged failure. Browser extraction records actual behavior. “The issue was reproduced” requires the alleged behavior actually occurring, not just a failed runner. A screenshot or English allegation alone is not a ground-truth oracle. Ambiguous expectations require review.

**Failure to probe.** Generated steps omit reload, reproduce a different field, silently use stale seed data or pass because the original URL remained recorded. Distinguish application failure, failed reproduction and broken automation.

**One-day cut.** Reports with a supplied working URL and reproducible seed; one app stack; one capsule export; replay against a fixed revision. No arbitrary repository checkout/install, autonomous code minimization or promised root-cause diagnosis. This constraint substantially reduces the “minimal repro generator” ambition.

**Three-minute demo.** Open the Kane report, submit a genuine report with a known expected outcome, show the reproduced path or honest non-reproduction, hand its evidence to the coding agent, and replay after its patch. Export the capsule for a second maintainer.

**Closest competition and difference.** [Jam AI](https://jam.dev/docs/product-features/jam-ai) already generates repro steps; [Jam MCP](https://jam.dev/blog/meet-the-new-jam-mcp/) delivers actions/logs/video to coding agents; [Jam's current developer workflow](https://jam.dev/resolve) includes CLI-published evidence for fixes. Proposed difference: executing and checking the report's allegation, then exporting a replayable source test. “AI bug report with evidence sent to an agent” is already shipping.

**Fatal objection.** If the maintainer must supply the exact steps, fixture and expectation, the product is a thin wrapper around Kane. Automatic minimal repro creation would improve the pitch but breaks the one-day scope and creates an oracle problem: a generated toy bug does not validate the original issue.

### 5. Runbook Capsules — share a browser workflow with its outcome contract

**User and pain.** Agent users repeatedly reconstruct a multi-step browser procedure from a prompt or a stale skill. They want a reusable task package that states inputs, prerequisites, expected outcome and last verified revision.

**Usable flow.** Describe a narrow workflow on a supported app, supply sample inputs and approve the expected result. Kane authors and replays it. Export the procedure, parameterized test, setup fixture and observation contract. Another user substitutes their values and receives either a fresh receipt or a precise unsupported/drift result.

**AI role.** Translate the request into a parameterized procedure, document prerequisites, and revise it after evidence shows drift. Do not execute arbitrary downloaded skills in the hackathon product.

**Why browser/Kane matters.** The deliverable is an executable user journey. Kane supplies real interactions and current screenshots. The publication criterion must be outcome freshness, not successful compilation of the skill description.

**Independent oracle.** Author-approved example outcomes and exact changed object fields, checked in a separate observer view. Record environment assumptions. A replay that succeeds on the original author's fixture is not certification for another account or a newly updated website.

**Failure to probe.** Wrong organization after login, workflow depends on stale IDs, apparently successful action leaves the new value unsaved, parameter substitution continues using an authored literal.

**One-day cut.** One app, two procedures, local export and import, no public marketplace or universal skill format. Do not add discovery, ratings or agent installation management.

**Three-minute demo.** Start with Kane's receipt; turn a real procedure into a capsule, replay with different parameters, open the resulting object, and export. Show a coding-agent revision based on evidence. Avoid live authoring consuming the entire demo.

**Closest competition and difference.** Kane already commits and replays `_test.md` bundles. [Stagehand v3's deterministic agent scripts](https://docs.stagehand.dev/v3/best-practices/deterministic-agent) and [current v4 caching](https://docs.stagehand.dev/v4/best-practices/caching) cover reusable automation. Browser Use's [current legacy-skills page](https://docs.browser-use.com/cloud/legacy/skills.md) says new skill creation/refinement is retired in favor of rerunnable scripts; existing marketplace skills still run. Do not pitch against a stale account of its product. Proposed difference: a portable reviewed outcome contract plus fresh observation, rather than replay alone.

**Fatal objection.** The product overlaps its core dependency and several mature alternatives. A package format and badge are insufficient. Rank below the top three unless a community user supplies a concrete procedure they cannot reliably share today.

### 6. Fixture Foundry — forkable task worlds for testing your own agent

**User and pain.** A small agent-tool project needs reproducible behavioral tasks without managing a large benchmark environment or relying on an LLM to grade its own completion. It wants tests for its tool adapter, not a leaderboard of model brands.

**Usable flow.** Choose a small task world, edit a reviewed task contract, reset the fixture, connect an existing agent runner and execute. Kane independently opens the resulting world and captures evidence. Export a small task pack with initial state, expected state, seed/reset operation and assertions for use in the builder's repository.

**AI role.** The user's real agent solves the task. A coding agent uses failure evidence to improve the tool adapter. AI can suggest new scenarios, but unreviewed generated expected states do not enter the trusted pack.

**Why browser/Kane matters.** Tasks must require an actual interaction or visible UI effect; independent backend checks establish exact state, while Kane proves the user path and visible result. If the agent operates only on a JSON service, a browser verifier adds little. Kane is the external observer, not the contestant, author and sole judge at once.

**Independent oracle.** Small handwritten reference state transitions, immutable initial fixtures, stable IDs and expected deltas. Check untouched objects as well as desired changes. Do not derive expected values from the agent's trace or implement the oracle by calling the same mutation function as the app.

**Failure to probe.** Agent claims completion without final save; selects a same-named object; correct change plus unintended collateral edits; state contamination between cases. These are realistic tasks, but natural failure rates remain unmeasured.

**One-day cut.** One useful miniapp, three tasks, one runner interface and a reliable reset. No arbitrary-world generator, multi-model tournament or large-scale parallel evaluation. A one-app fixture pack is more believable than an unfinished general platform.

**Three-minute demo.** Kane result first, fork a case, run a real agent, inspect the actual resulting object and unchanged neighbors, and export the case. Show the coding agent updating the tool implementation after reading the evidence, or advancing implementation after a green milestone.

**Closest competition and difference.** [BrowserGym](https://github.com/ServiceNow/BrowserGym) already provides extensible web-task environments; [AgentLab](https://github.com/ServiceNow/AgentLab) adds reproducible evaluation experiments; [WorkArena](https://github.com/ServiceNow/WorkArena) targets real knowledge-work workflows. The proposed difference is a tiny, editable pack for an individual tool maintainer, with setup and oracle visible in the repository. Simpler deployment is a hypothesis until measured. The earlier [KANE vs. ABLE winner](https://www.testmuai.com/blog/kane-cli-hackathon-winners/) also makes another agent arena difficult to distinguish.

**Fatal objection.** The strongest utility already exists in established open-source projects. Three toy tasks may be a demo rather than a community product. Do not market adversarial difficulty or a few observed failures as general agent reliability.

## Top-three ranking against the actual rubric

**1 — AppProof Studio, contingent on the iframe spike.** Most direct new app-building utility: the user leaves with an interactive agent tool they can use. Browser testing is central to identity/edit/bridge behavior. Originality remains conditional because generation and preview already exist. Limit the pitch to checked round trips. Completion is threatened by MCP SDK/host packaging and Kane's untested frame behavior.

**2 — Handoff Lab, strongest technical fallback.** The model-to-human-to-model boundary gives a particularly crisp independent oracle and tangible failures to test. Browser controls are essential. A reusable harness is explicitly eligible; it does not need a consumer-app disguise. Its weaknesses are adapter effort and overlap with existing frameworks/eval tools. Demonstrate connection to a second app before claiming portability.

**3 — Tool Witness, only with an existing suitable destination.** Useful to ordinary agent operators and easy to explain, but cannot win the technical argument if the entire result is a reliable backend field. Require a recipient-visible condition and a real reusable adapter. Without those, Repro Capsule becomes the more coherent third option despite Jam overlap.

All three can satisfy the three completion bars: a real user completes a useful flow; Kane executes a relevant browser journey with evidence; the coding agent reads that evidence and changes its next work. None needs a forced failure. Use the actual 25-point categories rather than invented probability scores:

- **Kane, 25:** explicit evidence for proof (8); coding-agent work history tied to Kane feedback (9); committed/replayed tests plus one consequential second capability or product gate (8). Do not implement five unproven features merely to list them.
- **Uniqueness, 25:** name the user and pain (7), state the narrow difference against current tools and the room (10), and show why independent verification is necessary (8). A generic eval dashboard, stop hook, app explorer or arena has weak room differentiation.
- **Completion, 25:** the user journey must work live (12); declare the supported envelope (6); make the repo, fixtures, tests and attached evidence reproducible (7). A hand-edited screenshot or stored verdict does not satisfy this.
- **GTM, 25:** allocate time for the 2–4 minute voiceover led by Kane's report (7), deck (4), blog (4), LinkedIn with TestMu tag and event hashtag (3), X with `@kane_cli` and hashtag (3), Show HN (2), and outside engagement (2). Confirm the event hashtag rather than inventing it. No posting was done in this review.

The public repo, code written today, OpenAI use during the build and attached Kane evidence remain gates. Document OpenAI use explicitly; do not depend solely on an inference about Kane's internal model.

## Integration rules that decide whether the product is credible

1. **Separate desired, observed and judged data.** Desired values come from reviewed contracts frozen before execution. Observed values come from current browser state, actual receiver/bridge traffic and independent state reads. Judgment is a small code comparison. A second LLM reviewing the generator's narrative is not an independent oracle.

2. **Bind every receipt to the thing tested.** Include target origin, actual visited URL, artifact hash or commit, fixture revision, run ID, observer identity and current nonce. Inspect the destination in the new evidence. A receipt for yesterday's deployment does not approve today's export.

3. **Test the test's freshness.** Use `{{base_url}}` in recorded navigation, not a `--url` override as proof of retargeting. Change visible fixture values and expected outgoing payload between runs. Confirm a fresh extracted nonce and current values; never grade using the old recording's `output_value` or assertion-tree booleans. If the comparator reads fresh bridge traffic while Kane only checks controls, label the two verdicts separately. Do not claim Kane detected what only the comparator detected.

4. **Make contracts narrower than English promises.** “Works correctly” is unusable. “After editing issue `i-17` owner to `Mira`, the host receives `i-17` with owner `Mira`, and the visible review shows that value” is checkable. Split assertions, compare stable IDs, define normalization explicitly and check unaffected records when relevant.

5. **Keep source-of-truth controls outside generated code.** A generated UI can lie in its success panel. Capture traffic at the receiving host/service, before summaries. A backend echo of submitted input is corroboration, not proof the user's target record persisted. Reload or open the actual saved object when persistence is part of the promise.

6. **Treat replay/healing as test-version management.** Run strict first with `--no-adaptive-heal`. Preserve recordings and evidence before any healing attempt. A healed journey is a new test artifact that must be checked against the original contract; healing is not repair of the product.

7. **Integrate from terminal output and evidence, not status text.** Retest installed event shapes. Require the expected terminal event and inspect errors and extracted data. Analyzer exit 0 means judgment completed; inspect each condition. Show `verified`, `contract mismatch`, `automation inconclusive` or `infrastructure error` separately. The [evidence documentation](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/evidence.md) describes pack structure and integrity validation; a complete pack does not establish that the acceptance criterion was correct.

8. **Keep the critical path local and bounded.** Start with one worker and serial checks; use supported `testrun` orchestration when needed. Do not assume 0.10 cloud exploration solves old local port collisions. Expose progress, cap repair at two attempts and provide honest failure output. Credits are secondary; authoring and provisioning latency are the real demo risks.

9. **Use new exploration only where it adds evidence.** It could discover a broken resource, console error or unreachable screen on a deployed preview. It does not supply the independent mapping/edit oracle. Do not build an explorer-map UI, test generator or finding lifecycle that recreates Kane's new product. A bounded optional exploration after the core flow works is defensible; making remote provisioning necessary for every generated artifact is not yet justified.

10. **Make the coding-agent loop inspectable.** Preserve the actual command/event log, relevant screenshot/pack, agent interpretation, next source change and subsequent result. A runtime model producing a new answer is not automatically evidence that the coding agent changed its work. If the first run is green, show the agent reading it and moving to the next implementation milestone; do not insert a defect to manufacture a repair story.

## One concrete falsification spike: AppProof's editable-record round trip

**Status: proposed, not executed. Time box: 60 minutes before product commitment.** Use the intended installed rc version and pinned MCP dependencies; no other model/provider comparison is needed.

**Independent fixture, written first.** Three issues with stable IDs: two have the same title, different owners and different priorities. The prescribed interaction sorts descending by priority, selects issue `i-17` by ID, changes its owner from `Lee` to `Mira`, changes selection once, then sends only `i-17`. Expected receiver payload is exactly that final ID/owner pair. A second fixture reorders the records, changes the priority of `i-17`, uses a different nonce, and expects the same identity-preserving operation. Define these expected outputs manually, outside generated mappings.

**Minutes 0–15: compatibility gate.** Render one app through the real SDK bridge in the intended sandboxed host. Have Kane enter the frame, edit a field, submit and read the host's captured result. Fail this stage if it requires flattening the app into an ordinary unsandboxed page, substantial custom automation or pretending a host event occurred. This stage is intentionally small; do not build the studio first.

**Minutes 15–30: first real generation and evidence.** Generate the supported view from the fixture schema using the build's existing OpenAI setup, with normal clear requirements, no requested buggy implementation and no weakening after success. Run the journey with explicit single-clause expectations. Capture actual bridge payload and current visible values. Inspect the emitted stream and pack, and let the coding agent read the result before changing code or advancing the next milestone.

**Minutes 30–45: freshness and detector calibration.** Replay using fixture two and a changed base URL or revision. Confirm current nonce, URL and values in newly captured evidence. Separately introduce a clearly labeled calibration fault that sends the pre-edit owner while retaining the correct visible field. The product gate must reject it; restore the original and confirm green. This checks the verifier, not the prevalence of naturally generated bugs. If Kane's journey stays green and the receiver comparator catches the fault, report that exact division of responsibility.

**Minutes 45–60: repeatability and usable output.** Repeat the corrected journey three times across both fixtures, record actual durations, and export the app to run outside the generator. Three runs can expose integration trouble; they cannot estimate a general reliability rate. Keep a real generated failure if one happens, but a green product path is acceptable.

**Kill or narrow the idea if any condition holds:**

- Kane cannot reliably operate in the actual sandboxed frame within the first 15 minutes.
- The team cannot obtain exact fresh values from the UI and independent receiving host; matching two app-generated success summaries is insufficient.
- The wrong-payload calibration passes the overall product gate, or replay continues reading the original fixture/URL. Fix within the spike; otherwise stop the verification claim.
- Basic correctness requires a second model to interpret ambiguous output instead of a reviewed fixture and code comparison.
- The supported template cannot be exported into a functioning app outside the studio.
- A minimal strict replay repeatedly exceeds 60 seconds, or a supported generation-plus-check repeatedly exceeds two minutes. These are chosen product/demo budgets, not claims about Kane's documented limits. Reduce the template or drop live generation if exceeded; do not hide delays in the demo.
- The only distinct feature after the spike is “official MCP scaffold plus Kane report.” Prefer Handoff Lab's reusable behavioral contract over a falsely differentiated generator.

Absence of a natural red result is **not** a kill condition. Inability to detect a labeled wrong result, identify what ran or give the user a working deliverable is.

## Shipping recommendation

Spend the first hour on the spike, then commit to one product. By halfway through the build day, require one exported/connected artifact, one complete user journey, and fresh independent comparisons. Add a second fixture before adding new templates or clouds. If AppProof fails its frame gate, reuse the contract/receiver approach in Handoff Lab on an ordinary web UI.

Reserve the final 90 minutes before the 6 PM demo for evidence, a fresh clone/replay, voiceover, deck, blog and distribution assets. The research does not establish a submission-lock time; confirm the event's actual deadline. Freeze features before that final block. Preserve a recorded successful journey as a labeled backup, while keeping the live flow functional.

The new release improves Kane's discovery and evidence tooling. It also removes “we map your agent-built app and generate tests” as a compelling differentiator. The opportunity worth testing is a specific useful artifact or agent workflow with an independently defined result that a real browser must prove.
