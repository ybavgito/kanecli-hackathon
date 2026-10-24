# Community product review for Kane Hack Day

Independent research, October 24, 2026. Perspective: usefulness to people building or using agents, distribution, and reasons to return after the demo.

## Decision

**My first choice is Rehearsal: portable, resettable acceptance tasks that skill authors can ship beside an operational agent skill.** The product is a working practice environment and an exportable task pack, with human-approved outcomes, rather than another agent leaderboard. Start with an issue-triage workspace for open-source maintainers. Its most important uncertainty is whether a maintainer can adapt the pack to their own workflow without effectively building a benchmark.

**Second: FixList**, an editable batch workbench for agent output, initially issue-triage proposals. It has the clearest everyday application utility: users can correct twenty proposed changes in one place and receive an exact final result. Its weakness is originality against existing agent UI frameworks and issue-management products.

**Third: TaskCapsule**, portable reproductions that give a coding agent the starting state, executable journey, and fixed acceptance criteria for a bug. Its community distribution is natural, but Jam, Sentry, and Kane showcase projects occupy much of the surrounding territory.

These are provisional product judgments, not measured demand or win probabilities. None was implemented or runtime-tested in this research. I would spend at most 75 minutes falsifying Rehearsal before committing the team. I would not build a generic skill evaluator, MCP inspector, Stop-hook approval gate, or model arena.

## What this review establishes

I read the supplied [earlier product research](./kane-ai-app-research.md) and [Kane field guide](./kane-cli-field-guide.md), and independently checked primary ecosystem documentation, repositories, vendor product descriptions, and first-person issue reports. I did not run agents, install packages, execute external skills, contact reviewers, publish anything, or conduct customer interviews. Only this assigned report was written.

Evidence labels used below:

- **Documented:** a primary source says the capability exists; I did not test it.
- **Reported:** an identifiable user describes a problem; the report is not an independently reproduced defect or prevalence estimate.
- **Inherited measurement:** an experiment supplied in the brief/local field guide, not rerun here.
- **Proposal/hypothesis:** my product design, predicted failure mode, or adoption inference.

### Ecosystem facts that change the shortlist

1. **Skills already have a portable distribution format.** Agent Skills packages contain instructions and optional resources; clients discover metadata before loading the relevant instructions. An exported task pack can sit beside a skill in Git, but the skill format itself does not establish behavioral portability. [Agent Skills overview](https://agentskills.io/home). Vercel documents installation across many agent clients; installation support is not a claim that each runtime behaves identically. [Supported agents](https://github.com/vercel-labs/skills/blob/main/docs/agents.md).

2. **“Evals for skills” is already shipping.** Anthropic's skill-creator supports evaluation, benchmarking, comparisons, and trigger tuning. [Anthropic announcement](https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills). Tessl documents reusable scenarios, baseline/skill comparisons, configurable variants, and evaluations against real codebase tasks. A portable suite or an old/new comparison alone is therefore insufficient differentiation. [Tessl task evaluation documentation](https://docs.tessl.io/improving-your-skills/evaluate-skill-quality-using-scenarios.md).

3. **Resettable agent environments and state-based outcomes are established ideas.** BrowserGym supports several benchmark families and extensible browser tasks; TheAgentCompany provides a simulated workplace. Rehearsal cannot claim to invent realistic task environments. Its proposed advantage is a small author-owned package for a particular operational skill, with accessible authoring and browser-visible outcome evidence. [BrowserGym](https://github.com/ServiceNow/BrowserGym), [TheAgentCompany](https://github.com/TheAgentCompany/TheAgentCompany). Browserbase also advertises live-site evaluation with trajectories, final-state review, and recordings. Recording agent runs is not a gap by itself. [Browserbase evaluations](https://www.browserbase.com/evaluations).

4. **MCP UI tooling is substantially more mature than a generic “tools need a face” pitch suggests.** The official MCP Apps repository supplies an SDK, examples, a reference host, and skills for creating apps, adding UI to servers, and converting web apps. [Official MCP Apps repository](https://github.com/modelcontextprotocol/ext-apps). MCPJam advertises cross-client evaluations, widget emulation, desktop/tablet/mobile modes, lifecycle inspection, E2E/CI checks, and tool/server diagnostics. That seriously weakens both a general app inspector and a general MCP UI generator. [MCPJam repository](https://github.com/MCPJam/inspector).

5. **There is concrete reported interoperability pain, but not proof of a large market.** Authors report widgets rendering successfully while subsequent tool calls fail behind namespacing aggregators. Another author describes persistent-workspace problems with inline views. These motivate specific tests, not a claim that all hosts are broken. [Namespacing report #753](https://github.com/modelcontextprotocol/ext-apps/issues/753), [related report #745](https://github.com/modelcontextprotocol/ext-apps/issues/745), [persistent-view request #754](https://github.com/modelcontextprotocol/ext-apps/issues/754).

6. **Agent collaboration UI is also occupied.** CopilotKit already supports interactive human input and resuming agent work; Linear documents agentic triage suggestions. FixList must win on a useful complete batch-correction workflow and a simple integration contract, not on inventing human review or AI triage. [CopilotKit HITL](https://docs.copilotkit.ai/human-in-the-loop), [Linear triage](https://linear.app/docs/triage).

These sources establish overlap and some concrete pain. They do not establish adoption figures, willingness to pay, or that competing products lack an undocumented capability.

### What the new Kane release changes

**Documented:** [0.10.0-rc.1](https://github.com/LambdaTest/kane-cli/releases/tag/0.10.0-rc.1) introduces a distinct `explore` suite, screen/flow/junction maps, evidence-backed findings and rechecks, remote exploration up to twenty browsers, and shared project workflows. Listed findings include console/network problems, broken links, accessibility, and performance. [0.10.0-rc.3](https://github.com/LambdaTest/kane-cli/releases/tag/0.10.0-rc.3) changes the remote CDP endpoint to production and improves provisioning diagnostics.

This makes discovering UI paths and packaging technical findings more promising. It does **not** establish that exploration knows the intended label, correct customer outcome, or meaning of a business instruction. Keep an independent task oracle. Nor does twenty remote exploration browsers establish a twenty-browser local replay limit. Do not make remote parallelism a completion dependency.

**Inherited measurements, version 0.9.0 only:** strict replay caught three injected UI bugs; the older free-exploration path found zero of those three; one compound invariant falsely passed in three attempts. Exact extraction plus independent code comparison was better in that small experiment. Analyzer exit zero did not guarantee true assertions. Tiny passing replays took roughly 14–18 seconds and authoring about two minutes. Separate replay processes collided on CDP ports; the suite path worked within that machine's local limit. These are engineering cautions, not benchmarks of rc.3 or universal rates. The field guide provides detail.

The product should work with explicit saved journeys even if new exploration adds little. Explore is a useful optional second lens, not the semantic judge or the main product.

## Candidate 1 — Rehearsal: ship a practice task with your skill

**User and pain — hypothesis.** A maintainer distributes a skill for operating a community project: triage issues, request missing information, link related reports, and prepare a work queue. The skill reads well, but users cannot cheaply check whether an edit still carries out that team's process. Reviewing the agent's explanation is a poor substitute for inspecting what it actually changed.

**Real usable flow.** The author selects an issue-triage starter, imports a small sanitized set of issues, and writes a task. In a normal board/detail UI they approve the expected final fields and allowed unchanged fields. Rehearsal creates a resettable workspace. The author runs their skill against it, inspects the resulting board and exact mismatches, edits the skill, and exports the workspace fixtures, task definition, verifier, and Kane evidence. A recipient clones the pack and reruns it. The usable artifact is the task/environment package, not a score page.

**AI role.** An operational agent interprets messy issue text and chooses tool actions. An authoring agent may draft the skill and suggest scenarios, but cannot silently approve expected answers. The coding agent building/maintaining the pack consumes Kane output and changes the skill, adapter, or application as warranted. One supported agent integration is enough for day one.

**Why Kane materially helps.** Stored state checks tell us which records changed. Kane checks whether a maintainer can find those records, inspect the linked evidence, use the changed queue, and see the same outcome after navigation/reload. A correct database label with an unusable or stale queue is an incomplete operational result. Kane can also replay the human authoring/export/import journey. Do not count merely opening the benchmark scoreboard as meaningful browser coverage.

**Independent correctness oracle.** Before running the agent, the author approves a fixture keyed by stable issue IDs: expected status, labels, relationship targets, and whether a clarification is required. Use separate deterministic comparison code against a read-only state snapshot. Extract individual visible IDs/fields through Kane and compare them to the same approved contract. Exact prescribed wording is unnecessary unless wording is part of the task. Ambiguous interpretations become human-review cases, not machine-certified answers. Keep expected-state files outside the operational agent's accessible tools in the demo runtime.

**Genuine failures to probe, not predictions.** Linking a similar-looking issue to the wrong original; treating an explicit missing reproduction as confirmed; losing a requested label during a multi-step edit; reporting completion while a record remains in the old queue. Whether any of these occur with the chosen agent is unknown. All-green results remain useful evidence.

**One-day cut.** One three-screen issue workspace; one restricted tool adapter; two task packs with a few cases each; fixture reset; exact comparison; old/new skill runs; export/import from a known JSON schema; one saved Kane journey. No general website cloning, arbitrary skill execution service, public ranking, multi-provider matrix, or hosted untrusted code. A narrow author-owned runner is more credible than a universal skills platform.

**Three-minute demo.** 0:00–0:25: lead with a Kane report tied to a task/skill revision and show precisely what passed or differed. 0:25–1:10: reset the workspace, show the actual task and let the agent work. 1:10–1:50: inspect the changed queue and exact IDs; show a real repair if one exists, otherwise a genuine changed workflow requirement. 1:50–2:25: show the coding agent reading the report, its resulting committed change, and replay. 2:25–3:00: export, reset/import, and open the task as a recipient. Long runs can use clearly labeled earlier build-day footage plus one short live replay.

**Closest competitors and proposed difference.** Anthropic/Tessl already compare skill versions; BrowserGym/TheAgentCompany already supply environments. The narrow distinction is authoring and shipping a maintainable operational acceptance task with both inspectable state and an accessible working UI. This is packaging and usability differentiation, not a new evaluation technique. If the author must code every task or it merely wraps existing eval output, the distinction disappears.

**Distribution and repeat use.** Publish the pack format and useful starter packs beside the repo. A maintainer can attach a pack to a skill PR or version release; recipients can contribute a failing real workflow as a fixture. Return triggers are skill edits, tool changes, and changed project conventions. First success metric: someone outside the building team adapts one task and reruns it on an actual edit. Stars and a one-off benchmark run are weaker signals.

**Fatal objection.** A synthetic issue board may transfer poorly to real GitHub/Linear operation, and authoring the oracle may cost more than reviewing the task manually. Never label a pass as “this skill is reliable everywhere.” Kill this idea if the demo requires hiding that transfer gap or if no nontrivial browser outcome adds information beyond the state test.

## Candidate 2 — FixList: correct agent batches without starting over

**User and pain — hypothesis.** Maintainers and agent builders receive many proposed classifications, links, or record changes. Correcting individual mistakes through repeated chat turns is awkward, especially when users need to keep some proposals, edit others, and leave uncertain items alone.

**Real usable flow.** An agent submits a typed proposal batch to a small API. FixList shows source text alongside before/after fields. A maintainer sorts and filters, changes two proposed labels, excludes a disputed item, saves a draft, and returns later. Confirming produces a concrete final patch/result that the agent or a single adapter consumes. The initial application is community issue triage; the integration contract can later support other record-review jobs. This is a working correction app even if the user never opens a Kane report.

**AI role.** The agent proposes labels and related-issue links with source references, asks about unresolved items, and continues with the corrected result. It does not decide what the human clicked or rewrite an accepted payload from a prose summary. A coding agent reads Kane's browser evidence to repair UI/result discrepancies or extend verified cases.

**Why Kane beyond API tests.** API tests cannot alone establish that editing the third visible sorted row edited the intended issue, that exclusions survive a filter change, or that a restored draft displays what will be returned. Kane performs exactly those user actions, captures the visible identifiers and values, and corroborates the final stored result. This is a substantive browser boundary.

**Independent oracle.** A checked-in fixture declares the source record IDs. A human-authored action script specifies which IDs are edited/excluded and the exact returned patch. Compare normalized payloads deterministically. “Correct final patch for these human edits” is independently decidable; “all AI label suggestions are semantically correct” is not. Let human correction own the latter rather than overclaiming automatic verification.

**Failures worth probing.** Row identity mistaken after sorting; selected items reintroduced after filtering; stale draft restoration; the agent continuing from its original proposal instead of the user's corrected batch. No claim that a fresh implementation will exhibit these bugs.

**One-day cut.** One record schema, one batch proposal API, a browser review page, draft persistence, a deterministic final-result API and downloadable patch. A local issue ledger is a disclosed adapter; if real GitHub write integration is absent, show the exact export rather than claiming issues were updated. Optional MCP wrapper only after the web flow works. Do not build a general UI generator or an integration marketplace.

**Three-minute demo.** Open with Kane's exact browser/result agreement report. Show an agent-generated batch, a human correcting and excluding items while sorting, save/reopen, then let the agent consume the corrected result. Show the matching final ledger or patch. Close with the coding agent's report-driven change and replay evidence.

**Competitors and difference.** CopilotKit already supplies human-input primitives, and Linear has triage intelligence. The proposed product is a ready-to-use, framework-independent batch correction surface with a precise proposal/result contract. It is not novel merely because it pauses an agent or renders forms. If existing components deliver this complete flow with comparable setup, integrate with them or abandon the standalone positioning.

**Distribution and repeat use.** Ship a tiny HTTP client example and a reusable fixture. Distribute to agents/SDK maintainers as a correction surface they can connect without adopting an orchestration framework. Repeated use comes from real recurring batches, not running tests. Measure whether users complete and retain corrected batches; seek a second batch from the same user before assuming retention.

**Fatal objection.** It may be a component rather than a product, while native issue trackers own the workflow. Its Kane proof can also become mostly ordinary UI reliability rather than AI output reliability. The demo must show a useful proposed result becoming a different, user-corrected operational result, not a ceremonial approval button.

## Candidate 3 — TaskCapsule: bugs a coding agent can actually reproduce

**User and pain — partly documented.** Open-source maintainers receive bug descriptions that omit starting state and exact expected behavior. Agent-assisted debugging already has strong products, so the opportunity is narrower than “AI fixes bug reports.” Jam provides recordings/technical context for engineers and agents; Sentry combines telemetry and code context with debugging and connected coding agents. [Jam](https://jam.dev/resolve), [Sentry Seer](https://docs.sentry.io/product/ai-in-sentry/seer), [Sentry's coding-agent handoff](https://blog.sentry.io/seer-mcp-cli-or-coding-agent/).

**Real usable flow.** A maintainer chooses a known app/revision and supplies a report, fixture, and expected result. An agent drafts a short reproduction. Kane executes it; the maintainer corrects mistaken assumptions. TaskCapsule exports a bundle containing the base revision, seed data, variable-based journey, expected outcomes, failure evidence when available, and a minimal resume prompt. A coding agent works from that bundle, then runs the same frozen acceptance journey on its patch.

**AI role.** Turn an incomplete report into a proposed executable repro and identify missing information; then implement a fix from observed evidence. This reduces repeated explanation and gives agent contributors a concrete work item.

**Kane value beyond API tests.** A user-visible ordering, stale screen, inaccessible interaction, or state-dependent navigation problem must be reproduced through the UI. Kane supplies the journey and evidence on the original and fixed revisions. A server-only bug should use a server repro; the product should admit that boundary.

**Independent oracle.** Maintainer-approved expected behavior, seed data, and reference IDs remain fixed. Reproduction on the base revision establishes the environment actually exhibits the reported condition; patch replay checks resolution. Preserve relevant unchanged journeys. The agent must not “repair” acceptance by rewriting expected behavior or silently healing the recording.

**Failures to probe.** Repro visits the wrong URL/revision; seed data is incomplete; agent fixes the visible symptom while corrupting saved state; a stale artifact approves a different patch. These are hypotheses. Reproduce a real bug in the team's own evolving app if available; do not pretend a manually inserted flaw was naturally written by an agent.

**One-day cut.** One known application template and fixture format; one local export/import command; a web capsule viewer; one true reproduction and fixed journey. Skip arbitrary-repo provisioning, automatic dependency installation for unknown projects, and GitHub write integration.

**Three-minute demo.** Start on the original Kane evidence and precise expected result. Import/reset the capsule and replay the reproduction. Show the coding agent consuming the actual evidence and its commit, replay on the fixed revision, then download the capsule a contributor would receive. Without a genuine reproducible issue, this concept loses much of its best demo.

**Competitors and difference.** Jam/Sentry already hand rich context to coding agents. The proposed distinction is a contributor-owned, resettable, executable task with acceptance tied to a base revision, not simply a video or generated diagnosis. The Kane showcase's LENS/mutiny/acceptance projects also create overlap. Do not claim that attaching test evidence to fixes is new. [Kane showcase](https://www.testmuai.com/kane-cli/).

**Distribution and repeat use.** An artifact attached to issues and PRs has a direct community distribution path. Reuse occurs as reporters and agent contributors hand off cases. The hard adoption measure is whether a second person reproduces a case from the export without help. A beautiful report that only works on the author's machine is not the product.

**Fatal objection.** Portable environment reproduction is the hardest part and cannot honestly be universal in one day. Limitations may leave little advantage over an existing repro repository plus Playwright. Rank third because it has a natural user and handoff channel, not because it is uncrowded.

## Candidate 4 — MCP App Clinic: test interactive tool outcomes inside a host

**User and pain — reported.** MCP app authors can have a valid tool/server and a widget that renders, while app-initiated operations fail in an aggregated host. The linked #753/#745 reports provide a concrete example; they do not prove a universal SDK bug.

**Real usable flow.** An author connects a known development server, supplies a small fixture result and expected user action, opens the widget in a reference host, and exercises edit/submit/reopen. Clinic exports a reproducible case plus a targeted repair suggestion. The maintained artifact is a widget interaction contract usable in the author's repository.

**AI role.** A coding agent creates or adapts the widget, reads the actual failing interaction and bridge messages, then repairs app bindings. It must distinguish an app bug from an unsupported or differently behaving host.

**Kane beyond APIs.** Tool calls can succeed while a widget displays stale content or sends a different value from the one edited on screen. Kane operates inside the rendered host/iframe, then evidence is correlated with exact bridge calls. This is a genuine browser use case if Kane can reliably access the frame; that capability needs a spike.

**Oracle.** A controlled server records exact tool names, arguments, result revisions, and request IDs. Independently authored scenarios specify expected visible fields and calls. Host behavior is part of a named tested configuration, never a claim of all-host compatibility.

**Failures to probe.** Rewritten tool names, stale result replacement, losing a user edit after a new tool result, clipped primary control at a narrow width. Some cases are motivated by reports; none has been reproduced here. Do not present an emulator's intentional behavior as a real host defect.

**One-day cut.** One reference host, one real local server, one editable widget, two deterministic scenarios, and an export. No ChatGPT/Claude certification badge, OAuth matrix, broad conformance implementation, or universal patcher.

**Three-minute demo.** Lead with a report showing the exact UI-to-tool mismatch or green outcome; render the real widget, edit it, inspect the recorded call, let the coding agent act on evidence, replay, and export the case.

**Competitors and difference.** MCPJam already offers widget emulation, cross-client evals, message inspection, viewports, and E2E/CI; the official repository supplies app-building skills. The only plausible distinction is a focused library of executable interaction contracts with exact user-action-to-tool outcomes. Absence of that feature in a README is not proof it is absent from MCPJam.

**Distribution/repeat use.** Publish useful contract cases as a small add-on to existing development tools; authors rerun after widget/host changes. An upstream-compatible package is a more credible adoption path than asking users to move into a new inspector.

**Fatal objection.** This is dangerously close to rebuilding MCPJam. I would pursue it only if a short hands-on comparison demonstrates a missing, valuable interaction check. New Kane maps make the demonstration nicer but do not resolve the competitive problem. Not in my top three.

## Candidate 5 — Quickstart Lab: agent tutorials whose result a learner can use

**User and pain — hypothesis.** An agent-tool/SDK maintainer publishes a quickstart with multiple moving parts. Beginners need to reach a working outcome, not just copy a successful command. The maintainer must keep the lesson, starter project, and actual UI synchronized.

**Real usable flow.** A maintainer supplies a known starter repository and a lesson goal. AI generates a short interactive lesson and a corresponding starter/finished project. A learner follows it, runs an agent on a fixture task, inspects the working UI, and downloads the project. Kane walks the learner path before the lesson is published; when dependencies change, the lesson is rechecked.

**AI role.** Author bounded explanations and examples from pinned source APIs, then adapt the starter project to the lesson. A coding agent consumes Kane's findings to fix lesson/code mismatches.

**Kane beyond APIs.** A lesson may compile yet show the wrong output, link to a stale route, omit a required action, or have a blocked editor/preview on a laptop. Browser verification checks the educational product users receive. Correct SDK behavior still needs deterministic tool/result checks; Kane cannot certify that prose teaches the right concepts.

**Oracle.** A maintainer approves one learner task with exact input, expected tool action and visible artifact. Pin the starter revision and dependency lockfile. Check code results independently and extract the visible output through Kane. Human review covers explanation quality and unsupported claims.

**Failures to probe.** An example from the wrong API version, lesson instructions diverging from the initial files, a generated “finished” preview disconnected from the learner's code, or a missing step that the author agent implicitly knew.

**One-day cut.** One lesson for one agent/tool stack; a hosted starter with known files, a few editable fields or a source-download flow, and one live preview. Do not attempt a universal in-browser development environment or unknown repository execution. This scope is much less ambitious than a general learning platform and should be described honestly.

**Three-minute demo.** Start with the lesson's Kane learner-path report; act as a new user, complete a small agent task, change an input and see the real output; show a report-driven lesson/code revision and replay; export the starter.

**Competitors and difference.** TutorialKit already provides interactive code tutorials and live previews. Official MCP Apps resources already teach and scaffold app creation. The proposed distinction is a maintainable, evidence-backed learner outcome for agent integrations. AI-generated instruction pages alone do not distinguish it. [TutorialKit](https://tutorialkit.dev/guides/about/), [MCP Apps resources](https://github.com/modelcontextprotocol/ext-apps).

**Distribution/repeat use.** Embed a lesson in the maintainer's existing documentation. Maintainers return after releases; learners generally use each lesson once. This needs a maintainer distribution partner more than a new destination site. No partner or demand was validated here.

**Fatal objection.** The real product may be a documentation workflow/plugin, and the day-one cut may amount to one nicely tested tutorial. It could be useful, but has less distinctive product depth than Rehearsal and less recurring end-user utility than FixList.

## Candidate 6 — Release Steward: ship agent-tool changes with usable migration examples

**User and pain — hypothesis.** Maintainers of skills, MCP servers, and agent SDKs must turn code changes into release notes, migration instructions, and examples that still work. Users suffer when an announcement is accurate at a high level but its next action is unusable.

**Real usable flow.** Import a bounded repository diff and maintainer notes. AI proposes a release page and migration checklist, each claim linked to a change. Maintainer approves semantic claims. A known example project demonstrates before/after behavior, and Kane checks the published migration journey. Export draft notes, example changes, and evidence. Publishing remains an explicit later user action.

**AI role.** Summarize relevant changes and update example code; a coding agent responds to failed example/user journeys. This is ongoing maintainer assistance rather than an agent evaluation dashboard.

**Kane beyond APIs.** It checks the rendered migration instructions, actual example UI, working deep links, and copyable inputs. It cannot infer from a page that the set of breaking changes is complete. Most substantive release correctness belongs in source/API tests, so the browser contribution is comparatively narrow.

**Oracle.** A maintainer-reviewed manifest lists the expected changed behavior and supported examples; a deterministic test checks their outputs. Kane checks the UI version and exact visible result. Completeness of release prose requires human source review.

**Failures to probe.** Stable and prerelease instructions mixed; example imports from the wrong version; a migration updates one caller but not the visible example; preview and published docs disagree. These are reasonable probes, not observed behavior in a prototype.

**One-day cut.** One repository snapshot/diff, one migration, one example app, draft markdown export, and browser evidence. No publishing integrations, general dependency migration engine, or automated release authorization.

**Three-minute demo.** Lead with the example-journey report. Show a real API change, generated and reviewed instructions, a user following the example to a correct result, and the coding agent's report-driven correction or added coverage. Close with the draft export.

**Competitors and difference.** Release Please generates release PRs from conventional commits; Release Drafter maintains draft release notes. The proposed additional value is executed migration examples for agent-tool users. That could plausibly be an add-on to those tools, not a standalone application. [Release Please](https://github.com/googleapis/release-please), [Release Drafter](https://github.com/release-drafter/release-drafter).

**Distribution/repeat use.** An Action or repository-local command fits the existing release habit. Repeat use follows releases. Making maintainers adopt a separate release workspace adds friction without demonstrated demand.

**Fatal objection.** Kane's part can become decorative because most correctness is decided without a browser. I would not choose this for the hackathon unless a specific agent SDK maintainer and a real broken learner journey are already available.

## Why the previous favorites do not survive this brief

**Drop/Fair Launch:** the user now wants direct utility for the agent community, and the supplied experiments undermine a narrative of common agent-written stock/permission failures. The reported 6/6 correct runs per small specification and 0/288 permission violations do not establish perfect agents; they do remove the demonstrated reason to center this event on those failures. A hand-written oversell implementation would calibrate a detector, not prove an agent naturally created that defect.

**Rulebook:** a policy-to-quote product might help small businesses, but its connection to the community building/using agents is indirect. Recasting it as “agent policy reliability” would not fix the target-user mismatch. Existing form/calculator products also weaken originality. It is not my recommendation under the latest steering.

**ProofSheet:** understandable product utility, but the analytics market and eval overlap remain substantial, and much of the oracle can operate without a browser. Changing the input to “agent logs” risks producing another evaluation dashboard. Only revisit with a concrete recurring reporting user and a browser-dependent decision, not because it previously ranked second.

**Generic agent gates and arenas:** the official previous winners already include GuardianKane and KANE vs. ABLE; current showcase projects occupy semantic regression, falsification, acceptance, and generated-game testing. These are overlap signals, not today's standings. [Past winners](https://www.testmuai.com/blog/kane-cli-hackathon-winners/), [showcase](https://www.testmuai.com/kane-cli/).

## One falsification spike: can Rehearsal be a portable authoring product?

**Proposed next experiment, not executed in this read-only review. Timebox: 75 minutes.** Use the event rc.3 and the already selected build agent/runtime. Do not add a provider or model comparison.

1. **Minutes 0–15: freeze one real task contract.** Use a small maintainer issue-triage process supplied by the team, not a model-invented “gotcha.” Write one task with three issue records: a complete report, a report missing reproduction information, and an explicitly identified follow-up to an existing report. A human declares expected labels/status/relationship and required clarification behavior. Accept legitimate equivalent comments. Record what the oracle cannot determine. No model generates its own authoritative answers.

2. **Minutes 15–30: build the minimum workspace and reset path.** A board, issue detail, tool adapter, fixture reset, and read-only state snapshot. Prove two resets produce the same semantic starting state and fresh run isolation. The agent only accesses operational tools; the judging path can read expected outcomes. Allow stable fixture IDs and new run IDs without treating those as a mismatch.

3. **Minutes 30–45: run the ordinary skill once.** Preserve all actions, state, timings and final message. No manually broken implementation and no “naive/safe” flag. If correct, keep the green result. Then change an authentic workflow instruction or fixture input and rerun from reset; do not modify the expected result after seeing the agent's output merely to create a pass.

4. **Minutes 45–60: verify the browser boundary.** Kane must open the resulting queue, locate exact IDs, inspect the related issue and required clarification, navigate/reload, and extract individual observable fields. Compare them in independent code to the preapproved contract and state snapshot. Check the actual final assertions and artifact revision, not just process exit. Save a variable-based `_test.md` and strict replay. If time permits, try one tightly bounded rc.3 explore run for missing UI paths; its semantic judgment is not a dependency.

5. **Minutes 60–75: test portability and the feedback loop.** Export/import the pack into a fresh workspace, rerun one short journey, and have a teammate unfamiliar with the implementation change one task through the authoring surface. The coding agent reads the Kane report and makes a justified committed change. With all-green outcomes this can be an uncovered journey/authoring issue revealed by the report, followed by another verified task; do not invent a product failure. If there is no report-driven change yet, that rubric requirement remains unproven.

**Kill or substantially pivot if any applies:**

- A different task requires editing application internals instead of changing the supported fixture/task contract.
- The expected outcome can only be supplied by another model judging the first model's explanation.
- Reset/import cannot reproduce the starting state and short journey twice, or cannot identify the tested skill/app/task revisions.
- Kane cannot reliably inspect one nontrivial user-visible outcome that adds value beyond the state check. Browsing a generated result dashboard does not qualify.
- After initial authoring, two short repeats cannot each finish within about 90 seconds, or the team cannot reserve a reliable sub-minute live slice. These are chosen demo-budget thresholds, not claimed Kane performance guarantees.
- The unfamiliar teammate cannot author a variant in ten minutes, or cannot explain when they would reuse the pack after this event. This is a local usability test, not market validation.
- The only compelling story requires hand-inserting a defect, claiming universal skill reliability, or passing synthetic results off as real third-party app compatibility.

**Do not kill merely because the agent succeeds.** A real, independently checked full journey satisfies proof. A small clean sample also cannot establish broad reliability or skill uplift. If the spike passes, test a small held-out task after freezing the skill, and preserve every run rather than selecting only the best one.

## Build and rubric discipline for a 6 PM demo

Choose one main product. For Rehearsal, freeze scope at one workspace/adapter and two small task packs. For FixList, freeze at one batch schema and one local adapter/export. Leave the final hour for evidence capture, deployment rehearsal, README and distribution assets. If time is tight, cut remote exploration, then extra tasks, then optional MCP packaging; preserve the user flow, oracle, saved replay and agent feedback loop.

**Kane, 25 points:** pursue genuine full-journey proof for the 8-point proof category; keep the agent's reading of the report, subsequent diff/commit and rerun for the 9-point feedback category. For range, prioritize committed/replayed `_test.md`, independently checked direct state/API outcomes, and Kane as the product's acceptance mechanism; optionally add bounded exploration or CI once the main flow works. Do not assume that listing features earns the 8 range points or that a map proves task correctness. Preserve strict evidence if healing creates a new recording. Use a suite for concurrency rather than independent replay processes until rc.3 behavior is checked.

**Uniqueness, 25 points:** name a particular maintainer or skill-author job (7), show the exact artifact/workflow difference from shipping competitors (10), and demonstrate a browser-dependent outcome that needs verification (8). Avoid unsupported “first” or “only” claims. Rehearsal has the strongest community alignment, but its novelty remains conditional on low-effort task authoring and portability.

**Completion, 25 points:** a new user must complete the useful flow live (12); explicitly disclose local fixtures, supported adapters, untested hosts and oracle boundaries (6); make the repository cloneable with reset instructions, committed tasks, evidence and revisions (7). Maintain three separate demonstrations: the user gets a usable artifact/result; Kane catches or proves a real outcome; the coding agent reads Kane and changes subsequent work.

**GTM, 25 points:** reserve work for the 2–4 minute voiceover demo leading with the Kane report (7), deck (4), blog (4), LinkedIn post tagging TestMu with the event hashtag (3), X post tagging `@kane_cli` with the hashtag (3), Show HN (2), and genuine outside engagement (2). The event hashtag was not independently verified in this review; get the exact required spelling from the organizer before publication. No public posts were made here. Lead these assets with the community user's job and the resulting portable artifact, not the number of browsers launched.

**Eligibility gates:** write the submitted code today, use a public repository, document actual OpenAI use in the build, and attach real Kane evidence. A replay from an earlier version or an unrelated toy app does not prove today's product. Bind evidence to app commit, skill/content version, fixture/task version, Kane version, observed URL and run ID. Distinguish product failure, unsupported case, and infrastructure error; parse assertions rather than trusting analyzer-only exit zero.

My selection is therefore **Rehearsal first, subject to the spike; FixList second if portable task authoring fails; TaskCapsule third when a genuine reproducible issue and known environment already exist.** The newest exploration features improve evidence collection and path discovery, but do not independently turn a weak product idea into a strong community product.
