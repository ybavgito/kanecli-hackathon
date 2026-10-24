# Independent judge review: a useful Kane project for the agent community

Research date: October 24, 2026. Perspective: skeptical hackathon judge and community-tool builder. This is an independent, read-only review; no other reviewers were consulted, no agents or downloaded skills were executed, and no proposed implementation or new Kane runtime experiment was run. Only this report was written.

## Decision

**My first spike would be Second Try: a small, reusable recovery lab where builders test what their agent does after a person changes the task or the underlying app.** Ship a working browser workspace, an agent adapter, reviewed outcome contracts, and exportable scenarios. The useful deliverable is a place to reproduce and fix recovery behavior, not a Kane dashboard or a model leaderboard.

My second choice is **ToolWitness**, narrowly an add-on that checks an MCP action against the ordinary application's actual state and user interface. My third is **SkillPatch**, release tests and evidence-backed repairs for browser-workflow skills. These are conditional engineering preferences, not measured scores or win probabilities. All have meaningful competitors. None has demonstrated demand or implementation feasibility in this review.

The most important research finding is negative: **“we test agent outcomes, not just tool schemas” is already occupied territory.** MCPJam documents goal-completion evaluations, deterministic checks, app UI testing, client comparison, skills, and CI. A project pitched against an imaginary schema-only incumbent would lose credibility. [MCPJam overview](https://www.mcpjam.com/blog/mcpjam-mcp-server-testing)

I would drop Drop/Fair Launch from this decision. Their investigated failure premise weakened, and their main user is not the agent community. I would also demote Rulebook and ProofSheet: they may be useful vertical products, but the latest goal does not become satisfied simply because an agent builds them. Rebranding either as an “agent tool” would add positioning without adding community utility.

## Evidence and limits

**Verified in this review:** the linked primary pages and repositories were inspected. This verifies that the authors publish these capabilities and artifacts; it does not independently verify their runtime accuracy, completeness, or customer adoption. Competitor comparisons below identify documented overlap and a proposed distinction. Silence in documentation is not evidence of absence.

**Inherited experimental evidence:** I read the [prior research](./kane-ai-app-research.md) and [field guide](./kane-cli-field-guide.md). Their measurements are prior local observations, not experiments I repeated. On 0.9.0, strict replay caught three injected UI defects; the old free-exploration mode found none of those three. A compound invariant false-passed in one of three attempts. Exact extraction plus independent code comparison was more promising. Analyzer execution could exit zero while a condition was false. Tiny passing replays took roughly 14–18 seconds; authoring could take around two minutes. Separate testmd processes collided on the local CDP port. These small samples do not establish universal behavior or current-release limits.

The later stock, email-limit, and family-cart experiments reported six successful implementations per specification; earlier permission checks reported zero violations in 288 attempts. Those results weaken the corresponding proposed failure stories. Handwritten bad code does not establish what a coding agent naturally produces. A disclosed mutation is a detector check, not evidence of spontaneous agent failure.

**Current release documentation:** [0.10.0-rc.1](https://github.com/LambdaTest/kane-cli/releases/tag/0.10.0-rc.1) introduces the distinct `explore` command suite, remote HyperExecute exploration with up to 20 browsers, screen/flow/junction maps, evidence-backed findings and rechecks, accessibility/performance checks, and shared project context. [0.10.0-rc.3](https://github.com/LambdaTest/kane-cli/releases/tag/0.10.0-rc.3) changes remote exploration to production CDP infrastructure and improves provisioning diagnostics. These are documented capabilities, not runtime validations here. The old exploration experiment does not evaluate this suite. Twenty remote exploration browsers says nothing about local testrun capacity.

**Strategic implication:** new exploration can help discover routes, gather evidence and identify conventional web defects. It does not supply an independent oracle for “the agent respected the latest request.” Maps show visited structure, not proven business correctness. I would make the core demo work with explicit replay and deterministic outcome checks; explore is an optional source of additional scenarios, never a dependency for the verdict.

**All candidate pains, likely failures, differentiation and build estimates below are hypotheses.** A green full user journey is acceptable evidence. No candidate should depend on eliciting a red result on demand.

## 1. Second Try — reproduce and repair agent recovery

**User and pain.** A developer building a task agent needs to know whether it can recover when a user revises a request, edits a record, or resumes a partially finished task. A happy-path transcript does not answer that. The product is a small browser-based practice workspace with reusable, versioned recovery exercises and a documented adapter for the developer's agent.

**Usable flow and agent role.** A builder selects an issue-triage exercise, connects an agent implementing `start`, `resume`, and `status`, and gives it the task. An OpenAI-powered example agent reads issues and proposes label/priority changes through tools. At an explicit pause, the builder edits an issue in the ordinary board or changes the instruction. The agent resumes. The builder receives a precise outcome comparison and can export the seed, intervention, expectations and Kane test. Someone cloning the repository can use the workspace to test their own adapter. That last step is essential community utility.

**Why Kane materially helps.** Kane acts as the intervening user in the actual UI, then visits the board in a fresh session to check the visible result. It exercises edit-save-resume-refresh, not merely a function accepting an amended JSON prompt. Screenshots, console/network evidence and replay help separate a lost UI edit, an adapter error, and wrong agent reasoning. API tests still check the state machine cheaply; Kane verifies that the person can actually make and observe the intervention. Kane is not the task agent and is not the sole correctness judge.

**Independent oracle.** Use reviewed fixtures and an external evaluator over immutable event IDs and final state. Example: issues A and B begin in release R1; a person moves B to R2 while the agent is paused; the latest instruction covers R1 only. Expected final state changes A, preserves B's human revision, and leaves unrelated issue C untouched. Compare fields by stable ID, preserve unrelated fields, and check exact visible values after reload. A final-state check alone is insufficient for detecting an overwrite later repaired; retain the event sequence too. Expectations are frozen before the agent acts.

**Failure to probe.** Reusing a stale plan after a revision, replaying an already completed operation, or overwriting the intervening human edit. These are plausible candidates, not demonstrated failures. The basic supported behavior can pass on its first run.

**One-day cut.** One issue board, a local database, three issue fields, one task-agent implementation, one adapter interface, and three exercises: revised intent, human edit, and resume after one completed action. Explicit checkpoints replace arbitrary process-crash orchestration. No multi-framework matrix, training, huge benchmark, real GitHub integration, or universal chaos engine. A plain working board matters more than a polished results gallery.

**Three-minute demo.** Start with Kane's actual report and its bound task/build IDs. Show the original task, the agent's pause, and the user moving B to R2. Resume; inspect the resulting board and exact state comparison. Show the coding agent reading the evidence and changing the recovery logic if there was a genuine defect, followed by replay. If it was green, show the real evidence-informed next change and its verification, without inventing a failure. End by exporting and replaying the exercise through a second adapter configuration, if implemented.

**Closest competitors and difference.** [LangWatch Scenario](https://github.com/langwatch/scenario) already supports simulated users, multi-turn control, custom checks and agent adapters. [MM-ToolSandbox](https://github.com/apple-aiml-research/ml-mmtoolsandbox) explicitly includes goal revisions, error corrections and state mutations. [BrowserGym](https://github.com/ServiceNow/BrowserGym) supplies extensible browser-task environments. The proposed distinction is a very small, human-operable recovery workbench for a builder's own agent, with the same intervention reproducible through the user UI and a portable exact-state contract. This is a focused community kit, not an invention of stateful agent testing.

**Fatal objection.** If a second adapter needs the author to rewrite the whole exercise, it is a canned demo. If interventions can only be triggered by hidden test hooks and the ordinary UI cannot reproduce them, the browser story is weak. If the team spends its day building a generic evaluation framework, it will lose to existing tools and probably miss 6 PM.

## 2. ToolWitness — did the MCP action become the user's result?

**User and pain.** An MCP-server maintainer needs release evidence that a tool changed the intended entity and that another person can see and use that change. Valid arguments and a plausible success message are insufficient. Deliver an outcome-contract kit that can sit beside an existing server and test suite.

**Usable flow and agent role.** The maintainer registers a server, an app URL and a reviewed scenario. The example OpenAI agent is asked to move a particular issue and add a triage note. The tool executes; a separate browser reader opens the ordinary issue page, reloads it, and follows the linked entity. The maintainer receives the tool result, observed state and evidence for the exact server/app revision. Export a contract pack suitable for local use or CI. Use stable issue IDs; “similarly named issue” is a task ambiguity to test explicitly, not a surprise answer key.

**Why Kane materially helps.** A returned payload can be correct while the app displays a stale row, links the wrong entity, or hides the result behind a broken filter. Kane checks the user's follow-through and provides screenshots/network evidence. Direct API assertions remain the stronger source for record identity and stored values. Do not send every backend assertion through a browser merely to increase Kane usage.

**Independent oracle.** A fixture defines the target issue ID, exact expected priority, note content, and untouched controls. A separate read-only state adapter checks the database or authoritative read API; Kane extracts visible values and the linked issue ID for comparison. Never reuse the mutating tool's response as its own proof. A receipt binds the fixture, app/server revision, test revision and run ID; a rerun against another build cannot inherit green.

**Failure to probe.** An adapter maps a tool argument to the wrong application field, returns before persistence, omits pagination during target selection, or succeeds in storage while the browser still shows the old result. No claim that today's coding agent will make any particular mistake.

**One-day cut.** One bundled issue app and its MCP server; one transport supported and documented; three operations; a small contract format; one OpenAI runner; exportable evidence. No registry, OAuth debugger, arbitrary server execution in hosted infrastructure, or emulation of every AI client. The sample app is the reference integration, not a claim that every MCP server is supported.

**Three-minute demo.** Lead with the report, point to the exact intended entity, let the agent execute a real request, and open that entity as an ordinary reader. Show state/UI agreement, a follow-up action, and a strict replay. Show the coding-agent response to real evidence and the resulting commit. Finish by changing the fixture's target ID without rewriting the test machinery.

**Closest competitors and difference.** [MCPJam](https://www.mcpjam.com/blog/mcpjam-mcp-server-testing) already documents end-to-end outcomes, deterministic and model-based checks, UI rendering, skills and CI. [MCPMark](https://github.com/eval-sys/mcpmark) has reproducible tasks in real MCP environments with isolated sandboxes and programmatic verification. The defensible proposed difference is packaged parity between an external app's ordinary UI and its MCP mutation, with reviewed state adapters and reusable app-specific contracts. This could sensibly be an integration for an incumbent rather than a replacement platform. I have not established that incumbents cannot already implement it.

**Fatal objection.** Without an independently useful contract pack for another maintainer, this is an MCPJam subset with Kane branding. If the only result is a green badge around the same JSON response, reject it. This overlap is why it is second, despite a simpler completion path than Second Try.

## 3. SkillPatch — ship a browser skill with executable examples

**User and pain.** A maintainer distributing a browser-workflow skill needs to know whether a release still helps a fresh agent complete the promised tasks. A well-written Markdown file and installation count do not prove that. Users need a specific working recipe; maintainers need a reproducible repair path when that recipe drifts.

**Usable flow and agent role.** A maintainer selects their local skill and a supported app fixture, reviews three promised outcomes, and runs a task agent in a fresh context using that skill. The app observes outcomes and exports a package containing the skill revision, fixtures, tests and evidence. When a documented workflow stops working, the coding agent reads Kane's evidence and proposes a small skill patch; the same held-fixed exercises run again. The day-one deliverable is a tested useful issue-triage recipe plus a template another maintainer can adopt. Do not execute arbitrary uploaded packages on a public server.

**Why Kane materially helps.** The skill promises browser actions, so the test must include the user interface it describes. Kane independently checks the result, follows a linked record and reloads the app rather than trusting the acting agent's narrative. Exploration could identify a changed screen or link, but it cannot determine whether the skill improves the agent. Strict recorded checks provide the more dependable demo path.

**Independent oracle.** Human-reviewed outcome fixtures, fresh app state and stable record IDs. Hold goals, seed and verifier fixed between skill revisions. Record the agent/harness/model configuration and the actual skill text loaded. A successful run proves that configuration completed those examples; it does not prove general utility or improvement. A comparison with no skill or the prior version is informative, but one run per condition is not a causal performance study.

**Failure to probe.** A skill assumes an obsolete workflow, skips the final save, uses a display name as identity, or repeats an action when the app already reflects completion. These are behavior hypotheses. Do not intentionally corrupt an instruction and then advertise the repair as a naturally discovered failure.

**One-day cut.** One runtime, one local trusted recipe, one app, three fixtures, a versioned release folder and a patch diff. No universal skill marketplace, automatic package installation, cross-model league table or generalized skill induction.

**Three-minute demo.** Begin with the evidence for the exact recipe revision. Show the promised task completed in a fresh workspace, one workflow revision, and the coding agent reading the resulting evidence before updating the recipe. Replay; open the updated skill and downloadable test package. Make the artifact useful enough that a builder would copy it without caring about the hackathon.

**Closest competitors and difference.** [SkillsBench](https://www.skillsbench.ai/) already evaluates skill effectiveness across agent/harness/model configurations. [Doc Detective](https://docs.doc-detective.com/docs/get-started/introduction) tests instructions against APIs and browser workflows. MCPJam also documents skill support, so “testing skills” itself is not a new category. The proposed distinction is a maintainer's lightweight release-and-repair package for their own browser recipe, including explicit outcome contracts and a working reference app. That is workflow packaging, not a new evaluation method.

**Fatal objection.** If all the skill does is repeat the exercise's literal click instructions, it teaches nothing and the demo proves little. If only the author can recreate the environment, the community artifact is unusable. Fresh execution and a real reusable recipe are mandatory.

## 4. Toolsmith — turn a reviewed browser workflow into an agent tool

**User and pain.** An agent builder wants a narrow reusable action on an app that has no suitable API. Repeating open-ended browsing for every invocation adds latency and maintenance work. The useful product is the generated callable workflow with parameters, not its verification screen.

**Usable flow and agent role.** A user describes a workflow on a supported reference app: find the exact issue, assign a priority, and save a note. An AI author proposes inputs, constraints and a reusable browser procedure. The user reviews it. Kane executes acceptance examples; after they pass, the builder exports an MCP wrapper and calls it from an OpenAI task agent with new inputs.

**Why Kane materially helps.** The browser is the action surface, so API-only tests cannot exercise the generated procedure. Kane can independently re-open the resulting record, check persistence and capture where the procedure failed. Keep the generated performer and verifier separate. If Kane both performs and declares its own success, corroborate with the independent state oracle and label the shared dependency.

**Independent oracle.** Reviewed parameter-to-state examples and a separate state reader for the reference app. Bind tool export to the tested workflow hash. For arbitrary third-party sites lacking authoritative state access, promise only visible sampled outcomes, not general correctness.

**Failure to probe.** Parameter substitution updates the wrong row, a hidden default overrides an input, or a procedure navigates successfully but does not save. New input combinations can expose mistakes; none is established in this review.

**One-day cut.** One app, one workflow, three parameters, three examples and a downloadable local wrapper. No universal website discovery, credentials vault, CAPTCHA handling, persistent remote browser fleet or hosted execution of arbitrary code. New explore maps might help authoring, but integrating undocumented output formats would add risk.

**Three-minute demo.** Show Kane's report, author the narrow tool, call it from the task agent with an unseen issue ID, and inspect the ordinary app result. Show a real evidence-informed correction and a fresh call. End with the exported wrapper and reviewed limits.

**Closest competitors and difference.** [Skyvern](https://www.skyvern.com/) documents natural-language workflow creation and MCP integration. [Browser Use's changelog](https://browser-use.com/changelog) documents reusable scripts generated by its agent. [WindTunnel](https://github.com/nekuda-ai/WindTunnel) already compares structured WebMCP actions with other browser-agent interfaces. The proposed difference is exporting a narrowly scoped tool together with explicit independent acceptance examples and revision-bound evidence. That distinction is modest; generation of reusable browser tools is already shipping. Native WebMCP would introduce another implementation dependency; [Chrome's documentation](https://developer.chrome.com/docs/ai/webmcp) should govern any such choice rather than assumptions about browser support.

**Fatal objection.** A universal “website to tools” promise is not a one-day product. A one-app demo may be competent but insufficiently original. I would not choose this unless the team already has a concrete workflow and a user waiting for the exported tool.

## 5. Rewind Desk — review and verify compensation for an agent's edits

**User and pain.** Someone using an issue-triage agent wants to undo a batch of unwanted changes while preserving later human work. A new conversation telling the agent to “put it back” can be hard to review. The product offers a before/after ledger and an explicit compensation plan for a narrow set of supported operations.

**Usable flow and agent role.** An OpenAI task agent edits issue labels and priorities through a journaling adapter. The user inspects the resulting board, selects a batch to reverse, and reviews a plan. If a person edited a field after the batch, the product flags the conflict instead of blindly restoring its snapshot. The user applies a supported plan and sees the restored board. The agent explains ambiguous conflicts; deterministic code computes supported inverses.

**Why Kane materially helps.** Kane exercises review, conflict resolution and the restored user view, including a fresh reload and follow-up edit. Evidence exposes a UI claiming “restored” while stale or conflicting fields remain. Backend/API tests should handle most compensation correctness; Kane's role is end-to-end user completion, not discovering the inverse operation.

**Independent oracle.** Before-state snapshots plus versioned event history define which fields the batch owns. Check exact supported restorations and preservation of later edits against a separately implemented fixture evaluator. A compensating write does not reverse notifications or other external consequences. Never advertise a universal rollback.

**Failure to probe.** A reverse plan wipes out a later human priority change, reverses operations in the wrong dependency order, or claims full restoration after one compensation fails. These are candidate errors, not established incidents.

**One-day cut.** One issue app, two reversible field operations, one batch, optimistic version checks and visible unresolved conflicts. No email, payments, file-system rollback, distributed transactions or cross-provider proxy. A real external adapter is optional only after the reference path works; do not imply the bundled fixture is already a GitHub integration.

**Three-minute demo.** Lead with the restoration report. Let the agent triage, make a human edit, review the compensation diff, resolve the conflict and open the resulting issues. Show Kane replaying the user journey and a code change motivated by real evidence.

**Closest competitors and difference.** [Unwind](https://github.com/bhaskargurram-ai/unwind) already publishes an MCP proxy with inverse operations, checkpoints and an undo ledger. [mcp-compensator](https://github.com/mohithhhh/mcp-compensator) journals mutating calls and offers compensation, explicitly distinguishing it from erasing all side effects. The proposed difference is a user-facing, conflict-aware review flow with demonstrated UI restoration for one app. I did not verify that these projects lack that capability. Their published implementations are substantial overlap, not evidence of production maturity.

**Fatal objection.** The generic “Ctrl-Z for agents” headline is already crowded. If avoiding overwrite is merely a normal version check and the remaining product is a ledger, originality is weak. If Kane adds only a screenshot after a deterministic API rollback, it should remain supporting validation rather than the product's claimed technical breakthrough. I would not select this for the event.

## 6. SourceWalk — hand off agent research with inspectable source evidence

**User and pain.** A person receiving a research agent's report wants to inspect whether a cited source supports a particular statement and whether the cited page is still the same revision. A list of links pushes the verification burden back to the reader.

**Usable flow and agent role.** Import a Markdown agent report, extract claims and associated sources, and present a reader workspace with exact quotations, page evidence and reviewer decisions. An OpenAI agent proposes claim/source associations and revisions; the reader approves ambiguous cases. Export a corrected report plus an evidence bundle. Keep source text within appropriate quotation and storage limits.

**Why Kane materially helps.** Kane can open a cited live page, reproduce a navigation path or interactive filter, capture what a reader sees and identify a dead link or inaccessible claim. That matters for a source whose content depends on UI state. For ordinary static text, HTTP retrieval and exact text checks are simpler; browser automation adds little. A screenshot does not establish that a paraphrase is logically supported.

**Independent oracle.** For the demo, use human-annotated claim/source pairs and exact quote checks with source revision hashes. Separate “page reached,” “quote present,” and “claim supported.” Only the first two have straightforward automatic oracles. Semantic support remains human-reviewed or a fallible model judgment; do not turn it into a universal truth badge.

**Failure to probe.** The agent cites a real page with the wrong version, omits a qualifier, links to the right site but wrong document, or quotes text that disappears after a filter changes. These are useful checks, not measured failures in a built product.

**One-day cut.** One report, five claims, three allowed source types, explicit review and a corrected export. No universal crawler, paywall access, scientific truth engine, browser extension or continuous web monitoring.

**Three-minute demo.** Start with the source-check report. Open one claim's actual evidence, reproduce an interactive source state, review a limited correction, regenerate the report and replay the reader journey. Clearly label manual judgments and infrastructure failures.

**Closest competitors and difference.** [Firecrawl Agent](https://www.firecrawl.dev/agent) already retrieves and structures web information, including interactive content. [Amazon's RefChecker](https://github.com/amazon-science/RefChecker) implements claim extraction, reference checking and source localization; its repository is archived. The proposed distinction is recipient-controlled review with reproducible browser state and revision-specific evidence. This is a usability/product proposal, not a new fact-checking method.

**Fatal objection.** The hardest question is semantic support, which new Kane exploration does not solve. On static sources the browser is mostly decorative; on arbitrary live sources reliability and access become the demo risk. I would not choose this over the top three.

## Ranking against the actual rubric

**1. Second Try.** Strongest alignment with the latest user and a visible browser intervention that naturally changes what an agent should do. A reusable recovery exercise is a legitimate harness product with direct community use. Its main risks are adapter portability, incumbent overlap and orchestration scope. Choose it only if the spike below works.

**2. ToolWitness.** Clearest narrow completion path and strongest exact oracle. Browser/API agreement gives concrete evidence, but MCPJam's current documented product sharply reduces originality. Position it as an outcome-contract integration; a broad competing platform is the wrong scope.

**3. SkillPatch.** Most tangible distributable community artifact: a useful recipe with reproducible examples and repair evidence. Completion is plausible with one runtime. It falls behind because skill evaluation and executable documentation are established, and a meaningful recipe is harder than a toy instruction file.

The top three could share an issue-app fixture technically, but should not be combined into one all-purpose platform during the day. Pick the user and exported artifact first.

**Kane, 25 points.** For proof's eight points, demonstrate an actual fail/fix/green or a green full user journey. For the nine-point agent feedback category, preserve the coding agent's evidence read, its specific next action, the commit and the rerun; a task agent acting in the app alone does not demonstrate the coding agent changing its work. For the range's eight points, commit/replay `_test.md` scenarios and use Kane as the product's browser observer/intervening user, with independent API/state checks. An additional documented feature is worth attempting only after the core works. Do not promise a particular score for a feature count.

**Uniqueness, 25 points.** Name the narrow user and the actual reusable artifact for the seven-point problem category. The ten-point originality category is the top three's weakest area: comparisons must acknowledge the shipped tools above. For verification's eight points, explain what an ordinary API assertion misses in the proposed user journey. “Kane is easier than writing Playwright” can justify implementation choice; it does not by itself establish product originality.

**Completion, 25 points.** For the live flow's 12 points, a visitor must select an exercise, run/resume the agent, inspect the actual workspace and export/replay the result. For the six-point scope category, publish exactly which runtime, transport, app, fields and interventions work. For the seven-point reproducibility category, ship fixtures, independent verifier, adapter example, pinned versions, README and evidence. The reference app must run from a clean clone; another builder must not need private author state.

**GTM, 25 points.** Reserve time for the actual deliverables: a 2–4 minute voiceover video leading with the Kane report (seven points), deck (four), blog (four), LinkedIn tagged TestMu with the official event hashtag (three), X tagging `@kane_cli` with that hashtag (three), Show HN (two), and outside engagement (two). The exact current event hashtag must be checked before posting; do not guess it from older events. Outside engagement cannot be guaranteed. This review did not post, contact anyone or draft an unverified claim of engagement.

**Gates and three completion bars.** Keep today's implementation commits in a public repo, demonstrate explicit OpenAI use in the build, and attach Kane evidence. Preserve build/run identity. A person completes the product flow; Kane catches something or proves the supported journey; the coding agent reads Kane and changes its next work. A green-only demo may satisfy proof while giving weaker evidence for the separate feedback category. If no bug appears, show a genuine new requirement or coverage gap shaping the next implementation and rerun; do not manufacture history to fill that category.

The [earlier winners](https://www.testmuai.com/blog/kane-cli-hackathon-winners/) and [current showcase](https://www.testmuai.com/kane-cli/) establish overlap with demo generation, coding-agent stop gates, escape rooms, acceptance proof, semantic regression, falsification and game playtesting. They are not today's standings. Merely wrapping Kane in another general gate is insufficient differentiation.

## One concrete falsification spike: 60 minutes for Second Try

This is a proposed experiment, not work performed during this read-only review. The team should run it before committing to the full product. Its purpose is to falsify the browser/orchestration fit and portability premise, not force a model failure.

1. **Minutes 0–15: freeze the contract.** Seed a minimal board with issues A, B and C and explicit revision numbers. Write a reviewed, separate evaluator for one exact sequence: the agent plans R1 triage; a human moves B to R2 and changes its priority; the updated request covers R1; the resumed agent changes A and preserves B and C. Include expected event ownership and final visible fields. Keep evaluator expectations outside the agent's editable work. Test the evaluator on a known-good outcome and a plainly labeled wrong outcome so false-green detection itself is checked.
2. **Minutes 15–30: one real agent and real intervention.** Use an OpenAI-powered task agent with an explicit pause and resume boundary. Have Kane perform the actual board edit, read the saved revision, then resume the task agent using a small coordinator. Author a focused saved browser check and extract exact IDs/values. Evaluate them in code. Record the task-agent transcript and state events. No unbounded agent repair loop.
3. **Minutes 30–45: prove replay and binding.** Reset to the same seed and repeat the full exercise twice. Verify the app/build ID actually visited, strict recording behavior, field values after reload and the event sequence. Preserve infra failures separately from product mismatches. These two repeats are a demo feasibility check, not a reliability estimate. Measure total wall-clock time, including agent execution and Kane authoring/replay.
4. **Minutes 45–60: portability and feedback.** Connect a second, simple adapter implementation or independently configured wrapper using the same manifest and unchanged evaluator. Let the coding agent read the genuine Kane report and implement the next justified fix or requested behavior. Keep its commit and rerun. Confirm an exported scenario can be loaded from a fresh directory without private state. A true fresh-clone setup check remains required before submission.

**Kill or reduce scope if any of these happens:**

- By minute 30, the UI edit cannot be reliably saved and observed before resume. Replace asynchronous orchestration with one explicit checkpoint; if that still fails, abandon Second Try.
- By minute 45, a short complete replay cannot fit roughly 75 seconds on the event setup, or two ordinary resets produce contamination or contradictory verdicts. This is a chosen demo budget, not a claimed Kane limit. Cut to one intervention and serial browser use. If it remains unstable, prefer ToolWitness's simpler serial flow.
- The known-wrong oracle self-test gets approved, the wrong build can inherit a pass, or a false/missing assertion is treated as green. Stop expanding features until the gate is trustworthy; if unresolved in the spike, kill the reliability claim.
- The second adapter requires changing the oracle or hard-coding that agent's trace. Reduce the compatibility claim to one documented runtime; if the remaining kit has no reusable value, kill the product.
- No one can identify a useful exported artifact beyond a screenshot and score. This is the dashboard failure mode; do not proceed under a new name.
- New explore is inaccessible, slow or inconclusive: drop exploration and keep explicit replay. This alone does **not** kill the idea.
- All natural agent attempts are correct: **do not kill on that basis.** Keep the green evidence, demonstrate a legitimate task revision and evaluate whether community users still need the recovery kit. A naturally green agent is a successful user outcome.

If the spike passes, freeze functionality well before the demo deadline. Allocate the remaining build time to the working board/adapter/export flow, then evidence and the clean-clone path, then the voiceover and submission assets. Optional exploration maps, mobile, CI and multiple agent frameworks come last. Credits do not rescue a late integration or a missing three-minute story.

## Final judgment

Second Try is my best next experiment because the browser can participate in a meaningful change of user intent and the exported scenario can help another agent builder. Its novelty is a narrow, usable recovery workflow, not the existence of stateful evaluation. ToolWitness is the safer serial fallback, with substantial MCPJam overlap. SkillPatch is viable if the team can ship a recipe someone actually wants.

The rc.3 release improves available exploration machinery, but it does not resolve the central product questions: who needs the artifact, what independently defines success, and can a fresh user complete the whole flow before 6 PM? None of the six proposals earns a broad “agents are now reliable” claim. A small useful tool with exact, reproducible evidence is the defensible submission.
