# AI app opportunities for Kane CLI Hack Day

Research date: October 24, 2026. Decision memo for a team building a web app in one day.

> **Release correction after this memo:** The event installer uses **0.10.0-rc.3**, while all recovered experiments used **0.9.0**. The [rc.1 notes](https://github.com/LambdaTest/kane-cli/releases/tag/0.10.0-rc.1) document a new `explore` command suite with maps, evidence-backed findings, rechecks and up to 20 remote cloud browsers, plus shared projects. [rc.3](https://github.com/LambdaTest/kane-cli/releases/tag/0.10.0-rc.3) fixes its production remote-browser endpoint and provisioning diagnostics. The statement below about a marketing page labeling exploration “Coming soon” is superseded as an availability assessment by these release notes. The old free-exploration results do not evaluate this new system. Its semantic correctness detection, plan access and runtime behavior remain untested here; revalidate the shortlist with the event version.

## Recommendation

The best next direction to validate is **Rulebook: turn a small business's pricing policy into a customer-facing quote flow, and test its behavior before publication**. The second finalist is **ProofSheet, narrowed to a recurring operational report with explicit metric definitions and checked drill-downs**.

This is a provisional engineering and demo recommendation, not evidence of customer demand or a measured probability of winning. Neither new product has been implemented or tested in this research pass. The right next experiment is a short generation-and-verification spike on both, not another round of speculative numeric rankings.

The strongest product pattern is: a user supplies business knowledge; AI turns it into an interactive deliverable; Kane uses that deliverable as a customer would; independent expectations decide whether the observed behavior is correct. The user gets useful software even without seeing the testing machinery.

## Context recovered from the earlier work

The team wants a real web product with substance beyond Kane. Kane should be an important reliability layer. Credits are not the binding constraint; engineering time, verification latency, deployment and demo reliability are. The project should be more impressive than a small registration app and different from earlier winners.

The earlier eight-reviewer ranking favored Drop and Fair Launch, but it was based on the old brief, descriptions written by one assistant, and reviewers using one model family. Those ratings were opinions, not win probabilities. More importantly, later experiments undermined the proposed failure story: three agents per specification implemented the small stock, email-limit and family-cart tasks correctly in the tested runs. A handwritten naive implementation overselling did not establish that an agent would naturally write that bug.

The latest rubric is authoritative for this decision: 25 points each for Kane usage, originality, completion and GTM. Nine points specifically reward the coding agent reading Kane's result and changing its subsequent work. A full green user journey qualifies for proof; an injected failure is not required. Public repository, code written today, OpenAI used in the build, and the attached evidence pack are gates. The original event FAQ discussed existing projects, but eligibility for any reused code should be checked against the latest organizer instructions rather than inferred from that older FAQ.

Primary local reference: [Kane CLI field guide](./kane-cli-field-guide.md). Historical raw material remains in `/tmp/kane-research` and `/home/harish/code/kane-spike`. The results below are recovered measurements, not new experiments or a broad reliability benchmark.

### Measurements that matter for the new direction

- Explicit strict replay detected three injected UI defects in the small shop tests. Free exploration found none of those three. Do not make spontaneous bug discovery the center of the product.
- One compound invariant falsely passed once in three attempts. Exact extraction followed by code comparison was more dependable in that experiment. Split checks into individual claims and keep arithmetic outside a model verdict.
- Five browsers exercised checkout journeys successfully, but each buyer could pass while the overall system oversold. A green interaction is not equivalent to a correct business outcome.
- Analyzer-only mode returned exit zero even with false condition results. Parse the actual booleans; do not use process success as approval.
- Passing replay took about 14–18 seconds on the small tested flows. Authoring could take roughly two minutes. These are observations on that machine, not latency promises for generated apps.
- Concurrent standalone `testmd run` processes collided on CDP ports. The tested suite mechanism was `testrun`; local port allocation limited that environment to nine browsers.
- A hard-coded recorded URL was not retargeted by `--url` in the clean replay experiment. Use a base URL variable and verify the visited URL and artifact version.
- Healing rewrote recordings. For acceptance evidence, preserve strict results and treat any repaired recording as a new test artifact.
- A replay needed internet. An infrastructure error and a product assertion failure could both appear as broken. The UI must distinguish them.
- Streaming suite progress worked. This can make real verification visible, but a progress dashboard alone is not the product.
- Loops worked, with a five-iteration default cap observed in the installed version. Do not assume an arbitrary long AI generation can be awaited with that default.
- Mobile, remote execution and the assurance commands were not run in the earlier experiments. Treat their availability and integration effort separately from the proven desktop path.

## What the current landscape actually establishes

Vendor documentation establishes feature overlap, not comparative accuracy, adoption, missing features across the whole market, or willingness to pay. No competitor was hands-on benchmarked in this pass. Absence of a feature in a page is not proof the vendor lacks it.

### AI analytics: substantial overlap with the first ProofSheet proposal

[Quadratic](https://www.quadratichq.com/) generates code, formulas and charts in a spreadsheet. [Julius](https://julius.ai/home/ai-report-generator) documents generating reports from executed analysis. [Hex Threads](https://learn.hex.tech/docs/explore-data/threads) integrates conversational analysis with workspace context.

More significantly, [Hex Evals](https://learn.hex.tech/docs/agent-management/evals) already supports versioned rubric-based suites, context comparisons and scheduled evaluation. Its [Context Suggestions](https://hex.tech/blog/introducing-context-suggestions/) product also reviews analysis conversations to improve reusable context.

Therefore, neither “AI reports with code you can inspect” nor “analytics with evals” is a defensible uniqueness claim. A plausible narrower angle is a report recipient checking a specific published claim against its contributing records, metric definition and revision. That is a proposed positioning, not an established market gap.

Research supports treating analysis correctness as more than executable code: a [22-person study of AI-assisted analysis verification](https://arxiv.org/abs/2309.10947) examines how analysts verify seemingly plausible work. [Spider 2.0](https://spider2-sql.github.io/) evaluates enterprise SQL workflows; [SpreadsheetBench](https://spreadsheetbench.github.io/) covers spreadsheet manipulation and newer workflow-level tasks. These motivate realistic tests but do not establish how often our small app or today's chosen model will fail.

### Meeting commitments: most of the obvious product already exists

[Granola's action-item workflow](https://www.granola.ai/blog/action-item-tracker-template) describes extracting commitments, owners and deadlines, querying across meetings with citations, and sending tasks into other tools. [Fathom](https://www.fathom.ai/overview) offers transcript, summary and action-item workflows.

PromiseCheck needs to center on corrections, retractions, uncertain dates and approval of the final commitment, not merely citations or task extraction. Its weakness for this hackathon is the oracle: whether a natural-language commitment is sufficiently explicit can require human judgment, and much of the extraction evaluation could run without a browser.

### Support agents: simulations are already mature product territory

[Decagon Simulations](https://decagon.ai/blog/decagon-simulations) tests agent operating procedures and can derive scenarios from historical conversations. [Fin's testing documentation](https://www.intercom.com/help/en/articles/14077180-simulations-vs-batch-tests-vs-previews) distinguishes automated procedure simulations, batch answers and interactive previews. Fin states that its simulations do not invoke live external APIs; previews can.

That boundary suggests testing conversation-to-system-state agreement, but does not prove nobody offers it. A narrow support application with an actual sandbox order ledger is more defensible than another generic support-agent testing console.

### AI forms and calculators: Rulebook also has real competitors

[Jotform AI](https://form.jotform.us/ai/features/) builds and edits forms, logic and test submissions. [involve.me](https://help.involve.me/en/articles/1962018-using-calculators) generates calculator formulas from prompts. It also has a [formula test mode](https://help.involve.me/en/articles/10233473-calculator-formula-builder-test-mode). [Fillout](https://www.fillout.com/pricing) includes conditional logic and calculations. [Process Street](https://www.process.st/help/docs/conditional-logic/) supports branching operational workflows.

“AI builds a calculator” is not original. Rulebook's proposed angle is a policy change carried through a customer-facing quote, checked examples, retained old expectations, and a publication gate tied to the exact revision. This packages generation, behavioral verification and business review into one narrow workflow. It remains a new angle on a known category, not a new category.

### Document reconciliation and learning tools are also occupied

[Nanonets](https://nanonets.com/blog/what-is-two-way-matching/) documents document extraction plus two-, three- and four-way matching. InvoiceResolve is therefore not differentiated by purchase-order reconciliation alone.

[Mindsmith](https://www.mindsmith.ai/experiences) generates interactive learning experiences, including branching behavior. Its [branching documentation](https://help.mindsmith.ai/en/articles/14095647-branching-scenarios) describes scenes and connections. An AI training simulation would need learning-specific correctness and a subject-matter advantage, not just generated dialogue plus playtesting.

### Verification itself is especially crowded in the Kane ecosystem

The [official earlier winners](https://www.testmuai.com/blog/kane-cli-hackathon-winners/) were demo.studio, GuardianKane and KANE vs. ABLE. The reusable lesson is visible evidence that changes the builder's next action. Their domains are not templates we should simply repeat.

The [current public showcase](https://www.testmuai.com/kane-cli/) also links:

- [Signed Off](https://github.com/PhiBao/signed-off): freelance-scope acceptance proof.
- [LENS](https://github.com/Enoch208/lens): semantic regression checks around agent changes.
- [mutiny](https://github.com/sneg55/mutiny): a falsification gate for agent-built apps.
- [Playtest Studio](https://github.com/Jiyungi/playtest-studio): browser game generation and automated playtesting.

These are overlap signals, not predictions about today's competitors or event standings. They weaken the case for another general proof dashboard, mutation lab or game-playtesting studio. A detector self-test can still be a useful secondary feature.

## Finalist A: Rulebook — policy to working quote flow

### User, pain and standalone product

A small catering or event-service business has pricing in a document, and staff repeatedly translate it into customer quotes. Discounts, rush fees and exceptions can be applied inconsistently. This pain hypothesis needs direct user validation; the research found established tools in the adjacent category, not interviews with this target buyer.

The business pastes its pricing rules. AI produces a hosted customer flow, line-item quote and staff review screen. The owner resolves ambiguous rules and confirms a few worked examples. Customers can use the published flow and save a quote. This is useful independently of the Kane dashboard.

### Where the AI does substantive work

The model extracts fields, dependencies, conditions, formula expressions and explanations into a restricted schema. A trusted renderer produces the interface. Do not allow arbitrary server-side generated code in the one-day version. The generator can still misinterpret a condition, connect the wrong field or omit an exception; schema validity is not semantic correctness.

Use an explicit draft → owner review → verification → publish lifecycle. Unsupported rules stay visible as unsupported. Do not silently approximate them.

### Kane's real work

Kane opens the generated flow, enters scenario values, changes previous answers, saves a quote, and checks the customer-visible and stored results. It extracts amounts and identifiers; an independent reference calculation evaluates the expected totals for the reviewed fixture policies. A network/API check corroborates that the saved quote matches the displayed quote. A fresh visitor exercises the published revision.

The browser is justified: stale conditional values, a missing option, wrong input binding and preview-versus-published discrepancies can survive correct standalone formula tests.

### Concrete demonstration fixture

Use a fictional policy, not actual tax guidance:

1. Minimum 20 guests; $25 food per guest.
2. At 50 or more guests, discount food by 10%.
3. Service charge is 8% of discounted food.
4. Delivery costs $40, waived at 100 guests.
5. Events less than 48 hours away add a rush fee of 15% of discounted food.
6. Exactly 48 hours is not rushed. Round each charge to the nearest cent using the documented rounding rule.

Reviewed expected examples, normal lead time:

- 49 guests: $1,225 food + $98 service + $40 delivery = **$1,363**.
- 50 guests: $1,125 discounted food + $90 service + $40 delivery = **$1,255**.
- 100 guests: $2,250 discounted food + $180 service = **$2,430**.
- 50 guests, rush: add $168.75; total **$1,423.75**.

The lower total at 50 than at 49 is intentional under these rules. A generic assertion that every added guest must increase the total would be wrong. Good tests encode the actual policy, not an intuitively appealing invariant.

### Tests with a reason to exist

- Minimum boundary: 19 rejected; 20 accepted.
- Discount boundary: 49 versus 50, including the correct charge base.
- Delivery boundary: 99 versus 100.
- Time boundary: 47:59 versus exactly 48:00 relative to a frozen test clock.
- Change a rush event to a later event: the old fee disappears from screen and saved quote.
- Backtrack from a discounted party to a smaller party: no stale discount remains.
- Update the policy's discount threshold: reviewed changed expectations change; unrelated examples retain their previous expected behavior.
- Verify preview and published quotes for the same revision; an old receipt must not approve a new revision.

### Independence and honest limits

For fixture policies, humans review a small reference table or separate reference implementation before generation. The model must not derive both the implementation and the authoritative expected values in the same step. A second model is useful criticism, but does not establish correctness.

For arbitrary uploaded policies, there is no automatic universal oracle. Ask the owner to approve the extracted rules and worked examples. Describe the result as “these scenarios passed for revision X,” not “every quote is correct.” Keep untested branches visible.

### Red → repair → green

First try ordinary generation on challenging but reasonable policies, and preserve any genuine mistake. Feed observed wrong amounts and scenario inputs back to the generation agent; hold expectations fixed. The agent changes the formula or field binding and Kane replays it.

Do not require a genuine model failure to appear on demand. If the first version works, show a genuine policy edit and regression suite. A disclosed injected defect can prove the detector catches a known fault; it cannot be presented as a naturally discovered generation error.

### Scope and failure conditions

Build one vertical, a small fixed set of input types, a restricted expression language, draft/public versions and saved quotes. Skip payment processing, CRM integrations, general app generation and automatic interpretation of arbitrary contracts.

Reject or reduce this idea if owners must effectively program the entire quote tool, if all example rules are hard-coded rather than generated, if new rule sets require extensive engineering, or if the only convincing artifact is the verification dashboard. The main demo must include a customer using a generated quote flow.

## Finalist B: ProofSheet — a report whose published claims remain inspectable

### Narrower product than the earlier proposal

Focus on a weekly operating report for a small online store: orders and refunds, a metric definition sheet, a few supported questions, an interactive report and a shared read-only page. Avoid “an AI analyst for any data.” The user gets a useful recurring report; verification is the release condition.

AI chooses the relevant fields and analysis plan and produces the narrative and chart configuration. Calculations execute deterministically. Preserve the question, metric definition, source files and report revision.

### Highest-value failure modes

- Counting refunded revenue as retained revenue.
- Duplicating orders through a one-to-many refund join.
- Using creation date where refund date was intended.
- Comparing a partial current week to a full previous week without disclosure.
- Averaging percentages instead of dividing totals.
- Leaving a conclusion unchanged after a filter changes.
- Showing correct figures in the editor but stale figures in the published report.

These are candidate errors to probe, not measured failures in our app. The app should clarify ambiguous metric definitions rather than quietly choose one.

### What to verify

Use a reviewed dataset with independently known totals and row membership. Kane uploads it, asks the supported question, adjusts filters, opens source rows, saves and publishes. Compare the visible value, chart values, contributing row IDs and published value to the reference.

Additional relationship tests can help without checking every sentence: reordering records must not change an order-independent aggregate; adding a zero-value record must not change revenue; adding a refund changes the relevant metric by the defined amount. These properties depend on the question's semantics. Duplicating a record is not necessarily supposed to preserve totals.

### Why it is second

The correctness oracle is stronger than for open-ended language. But Hex and other analytics products have considerable overlap, and much of the analysis correctness can be checked directly with code. Kane earns its place through interactive and published behavior, not by reading JSON from an analysis API. The product needs a polished drill-down and update experience to stand out.

Do not label a correct recomputation of a wrong analysis plan as proof of the intended answer. Metric semantics and row selection need review too.

## Other candidates: when they deserve selection

### PolicyPilot / ResolutionDesk

An AI returns assistant for one small store, with actual order lookup, a sandbox refund ledger and an approval flow. Kane checks what the assistant promised against what the ledger records. Use mixed eligible/final-sale items, an already-refunded line, a cancellation and a policy revision.

Strong outcome visibility; large competitor overlap; more state and UI to build. Choose it if the team has support-domain expertise or a working store shell. Do not rebuild a generic simulator or connect real payments for the demo.

### PromiseCheck

Convert a transcript into a reviewed commitment ledger, preserving proposals, reassignments and withdrawn dates. The strongest case is an ambiguous statement the app refuses to convert into a firm task. Kane verifies source navigation, user edits and exported task consistency; reviewed fixtures grade the extraction.

Easy to understand; weaker browser necessity and heavy competition. Choose it if there is a specific high-value user workflow beyond ordinary meeting notes. Do not promise to prove intent from any transcript.

### InvoiceResolve

Resolve discrepancies across invoice, purchase order and receipt before producing an approved export. Extraction, matching and accounting workflow vendors already address this. A few synthetic fixtures do not establish general document accuracy.

Choose it only with a distinctive real exception workflow or existing domain assets. The oracle is good for arithmetic but harder for damaged or ambiguous document content.

### AI training simulation / accessible interactive lesson

Generate a branching practice exercise, then exercise incorrect-answer, retry and completion paths. A strong subject-specific oracle could check that a learner cannot pass by choosing known wrong answers and that the final explanation agrees with the source.

This offers visual depth, but Mindsmith already generates branching experiences and the Kane showcase includes game playtesting. Choose it only if the team has educational content expertise and a concrete learning outcome; avoid another escape room.

## The verification architecture that fits the evidence

Use three distinct checks:

1. **Semantic agreement:** a person reviews the source rule or metric definition and important expected examples.
2. **Computational agreement:** an independent evaluator compares structured observations with those expectations.
3. **Experienced behavior:** Kane traverses the actual interface and publication flow, collecting screenshots and other evidence.

None replaces the others. [Anthropic's agent-evaluation guidance](https://www.anthropic.com/research/demystifying-evals-for-ai-agents) distinguishes code-, model- and human-based grading and warns that model judges need calibration. Use that combination pragmatically, not as a reason to create a large eval platform.

### Two loops, two kinds of change

**Development loop:** coding agent → source change → Kane journey → failure evidence → coding-agent patch → strict rerun. This directly addresses the rubric's agent-and-Kane points. Preserve commits and terminal history showing the feedback affected work.

**Product loop:** user source → generated artifact → reviewed examples → Kane verification → publish or return to draft. A model repairing a generated quote schema is not, by itself, evidence that the coding agent changed the app. Show the development loop separately.

### Tests and artifact identity

Commit stable `_test.md` journeys and their reviewed expectations. Parameterize base URL, artifact ID and scenario values where supported. Confirm the target URL and revision in every run. Changing test steps can trigger re-authoring, and a recorded assertion may be specific to its original expected content. Dynamic generated output is not automatically re-evaluated semantically merely because a saved recording passes.

Inspect the authored assertions for the chosen workflow. Test one known-wrong result before trusting the gate. Keep the reference evaluator outside the candidate implementation; do not compute “expected” by calling the same formula code or model-generated query under test.

Use a versioned receipt containing artifact and policy/data hashes, app commit, test and expectation versions, time, scenarios run, outcomes and evidence path. Hashes bind evidence to a revision; they do not establish correctness. Any input or artifact change invalidates approval unless the defined revalidation policy permits it.

### Result states

Show separate states for: passed tested scenarios, product assertion failed, test automation failed, infrastructure unavailable, and untested. For analyzer-only calls inspect condition results. For other modes parse their terminal event and exit status together. Model-written blame is a hint: earlier runs sometimes attributed real defects to automation.

### Runtime and deployment

The public app enqueues a job to a local or separately hosted worker that can run Chrome and Kane. Do not assume a normal serverless request handler can execute the CLI and browser. The worker streams actual progress to the UI, and stores the result with the artifact revision. For a one-day demo, a reliable local worker plus a public web app is acceptable if documented honestly and reachable.

Use the tested `testrun` path for parallel scenarios, isolate per-scenario state, and keep a small smoke suite for the stage. Pre-author representative flows; demonstrate a new data/rule variation live rather than a completely unknown app generation pipeline. Each replay still needs connectivity in the measured version.

### Appropriate use of newer Kane capabilities

- Saved test replay is the foundation, not just a one-off run at submission.
- Direct API calls seed isolated scenarios and corroborate stored output; browser actions must still exercise the customer journey. [API-call documentation](https://github.com/LambdaTest/kane-cli/blob/main/docs/user-guide/features/api-calls.md)
- Network/DOM assertions support observing the values actually used by the interface. Inspect generated checks rather than treating their existence as correctness.
- Streamed progress gives an honest visible timeline.
- Evidence packs preserve what ran and what was observed. [Evidence documentation](https://www.testmuai.com/docs/kane-cli-evidence)
- Assurance can link requirements to scenarios if time permits, but it was not exercised in the local experiments. The current [assurance page](https://www.testmuai.com/assurance-loop/) labels its illustrated exploration stage “Coming soon”; do not assume every marketing example is currently available in the installed CLI.
- Mobile and remote grid execution add little to these web-only first-day products until the core loop works.

## Selection experiment before committing the whole day

Time-box a 45–60 minute comparison, not full implementations of two products.

For Rulebook: use two reviewed policies, one with thresholds and one with interacting exclusions; generate a restricted quote configuration; exercise three boundary scenarios and one backtracking scenario; inspect observations and assertions. For ProofSheet: use an orders-plus-refunds fixture, a metric definition and two questions; inspect totals, row IDs and a filter update.

Repeat a few fresh generations rather than replaying the same successful generated artifact. Record total attempts, ordinary successes, semantic failures, UI failures, infrastructure failures, missed defects, repair attempts and wall time. A handful of runs cannot establish a failure rate or guarantee a demo result.

Require evidence for these selection questions:

- Is AI doing a useful interpretation task rather than filling a fixed template?
- Can a customer complete the resulting main flow?
- Does the independent expectation distinguish correct and incorrect outcomes?
- Does Kane catch a wrong customer experience, including a mismatch that unit checks alone would miss?
- Can an agent repair it while the reviewed expectation stays fixed?
- Does the rerun fit the demo time budget?

If both pass every meaningful case, that is a valid outcome. Do not deliberately use a weaker model to create a failure story. Choose the better user product and demonstrate a real update plus regression verification. If neither has a credible oracle or customer flow, reduce scope immediately.

## Rubric-specific execution and submission

Do not assign invented win probabilities or precise predicted scores. These are execution requirements:

**Kane, 25:** full customer journey; agent feedback visible in commits/run history; saved tests committed and replayed; one useful extension such as API corroboration or an artifact publication gate. More features do not automatically mean more range credit.

**Originality, 25:** name a specific user and failure; explicitly acknowledge adjacent products; show the special workflow in action. The strongest honest claim is a focused packaging of generation and verification, not “the first AI that can verify AI.”

**Completion, 25:** working public entry point, one complete generated artifact, understandable unsupported states, repeatable clone/run commands and evidence included in the repo/submission. A local worker dependency must be explicit.

**GTM, 25:** video 7, deck 4, blog 4, LinkedIn 3, X 3, Show HN 2, external engagement 2. Owned deliverables total 23; the reach bonus depends on someone outside the team and is not guaranteed. Have a teammate produce assets in parallel once the first complete journey exists. Use the organizer's exact current hashtag and required tags. Do not publish to accounts without authorization.

A workable team split is customer flow and rendering; AI generation and source review; Kane worker and independent expectations; deploy, evidence and GTM. Freeze features early enough to record the 2–4 minute voiceover and verify every submission link. Put the actual failed/green evidence first in the video if a genuine failure exists; otherwise lead with the full successful journey report and describe precisely what it demonstrates.

## Final decision

Rulebook has the best fit between a substantial standalone web app, generated behavior, observable correctness and browser-essential verification. ProofSheet has a stronger arithmetic oracle but heavier established-product overlap and a greater risk that Kane is only checking presentation around a code evaluator.

The unresolved issue is empirical: can either generate and repair a meaningful artifact within the demo budget? This research narrows the decision; it does not claim that experiment has already been run.
