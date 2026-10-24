# ClearPath: Kane feature audit and proposed improvements

October 24, 2026. Documentation audit against Kane CLI **0.10.0-rc.3**, the release reported in the user's installation. No new Kane runs, browser experiments, tests, or implementation. “Documented” means supported by the release documentation, not demonstrated by ClearPath.

## Verdict

The proposed product already has enough meaningful Kane roles to be a strong showcase: source discovery, browser operation, conditional behavior, result verification and retained evidence. None is implemented or proven for ClearPath yet. The improvement should be stronger checks and useful evidence within the same task, rather than more unrelated features.

The earlier specification underemphasized three capabilities: **network assertions**, **reusable recorded journeys**, and **requirement-linked verification**. These can improve the proposed product without expanding to more websites or user groups.

The resulting product promise is: **ClearPath gives you a simpler way to finish a supported web task, and checks that the choices you approved match both the source interface and the resulting record wherever that evidence is available.**

## 1. Verify the proposed transaction and the persisted result

**Documented capability:** Kane DevTools checkpoints can inspect captured HTTP requests and responses, including bodies and status codes. Checkpoints can assert, extract and branch. Capture is scoped to the current step, bodies may be truncated, and older traffic can be dropped at the capture limit. [Network assertions](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/features/checkpoints/devtools/network.md).

**Product improvement:** before approval, compare the observed source draft with the user's explicit choices. After the approved submission, inspect the matching request/response and re-open the resulting return record. Correlate using the actual order/request identifiers; a random recent 200 response is insufficient.

For the partial-return example, the relevant checks are the selected order line, quantity, excluded jacket, refund destination and disclosed deduction. A successful status code or success banner alone cannot establish these.

**Important distinction:** inspecting the submission request after it was sent can detect an incorrect transaction; it cannot prevent that transaction. Prevention relies on checking the draft and enforcing the supported submission boundary. A post-submit mismatch must become “needs attention,” not an automatic repeat submission.

If the source exposes a supported read API, Kane can explicitly fetch the resulting record and assert its fields. Direct API calls are a separate capability from observing browser traffic. Use a supported API as corroboration where available, without assuming arbitrary merchant internals are a stable interface. [API calls](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/features/api-calls.md).

**Priority: highest.** This changes the evidence from “the page looked successful” to “these observed fields match these approved choices.”

## 2. Turn Validate into a specific set of checks

**Documented capability:** Kane supports assertions, extraction and if/else checkpoints over page and browser data. Current-page analyzer mode evaluates explicit conditions without action steps. [Checkpoints](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/features/checkpoints/overview.md), [execution controls](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/running-tests.md).

**Product improvement:** label the control “Check my choices.” It evaluates the latest approved or proposed intent revision against fresh source observations. Display each requirement as matching, conflicting or not yet verified, with the value and source behind that status.

For example, show “Original payment method requested; store credit observed” rather than “Validation failed.” If correction is an allowed draft action, the agent changes that choice and checks again. If the option is unavailable, it asks the user. The expected result remains the user's choice; it must not be weakened merely to obtain a green run.

Some checks require navigation. An analyzer-only call does not retrieve another page or inspect an entire journey. Navigate explicitly first or restrict the claim to the current page. Its exit zero means conditions were evaluated; the returned booleans still need inspection.

Checking that the jacket is absent is meaningful only after confirming that the correct complete return summary is present. An empty or broken page must not pass an exclusion check.

**Priority: highest.** This is the main product interaction, backed by specific assertions and ordinary code comparisons.

## 3. Carry earlier context into later decisions explicitly

**Documented capability:** Kane can extract values for later steps, accept variables and prior session context, and share one browser across sequential saved-test steps. Variables parameterize execution; they are not the application's durable task database. [Variables and context](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/variables-and-context.md), [saved execution](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/testmd/running.md).

**Product improvement:** save the order and item identity, explicit exclusions, return reason, refund preference, latest observed terms and evidence references in ClearPath's task record. Each bounded Kane job receives the current revision and required expected values.

When the user adds “I don't have a printer,” preserve the original-payment requirement. If the source changes a fee or refund destination, invalidate the old proposal and approval. Do not depend on a long chat transcript to retain that dependency.

Our orchestrator controls task identity, revision, job serialization and authorization. A reused browser connection supplies session continuity; it does not by itself establish correct account ownership or reliable login handoff. Those remain integration work.

**Priority: highest.** This is how ClearPath becomes a coherent multi-step product.

## 4. Use recorded journeys to make repeat use practical

**Documented capability:** `_test.md` execution can replay recorded steps, with adaptive healing and re-authoring available when authorable steps fail. Helpers can be composed through `@import`. [Replay](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/testmd/running.md), [composition](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/testmd/composition.md).

**Product improvement:** keep reusable, parameterized routines for opening the exact order, preparing a supported draft, and reading a confirmation. Use dynamic jobs for unfamiliar conditions or changed choices.

Keep preparation and submission separate. A single automatic saved flow from login through submit would bypass the product's interactive approval unless carefully controlled. Never treat healing as permission to repeat a consequential action after ambiguous completion.

Replay is a plausible latency improvement; no ClearPath timings have been measured. Validate whether runtime values remain correctly parameterized before relying on reuse across different orders. This audit does not establish that all extraction and result fields behave identically on authored and replayed paths.

**Priority: next.** Make the core task work before optimizing replay, but include a genuine saved journey in the hackathon scope if feasible.

## 5. Make the receipt a readable record of evidence

**Documented capability:** sealed evidence packs retain objectives, results, screenshots and execution logs. Packs can be inspected, validated and merged under compatibility rules. Integrity validation checks the artifact, not the truth of the task outcome. [Evidence packs](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/evidence.md).

**Product improvement:** each receipt claim links to the observation supporting it. Keep the user's intent revision, task ID and relevant Kane run IDs in ClearPath's own record. Those associations are application work, not automatic Kane task tracking.

The user-facing receipt should answer:

- What was requested and actually submitted?
- What did the source confirm?
- What remains unknown or pending?
- What does the person need to do next?

Keep the mismatch and corrective run in the history. A final green run must not erase the earlier discrepancy. Related compatible packs can be combined for submission, but retain originals and intent revisions.

Progress events can drive the live status display. The sealed evidence viewer is an after-run artifact; it does not establish a live screenshot stream. Until such a stream is implemented and verified, show the latest completed observation with its timestamp.

**Priority: core for a concise receipt; richer evidence browsing afterward.**

## 6. Use Explore and assurance to define what the integration supports

**Documented capability:** Explore maps a source app and designs tests. Assurance can derive reviewed acceptance criteria and scenarios from requirements, and coverage relates execution to those criteria. Design supports bounded scenario selection and pairwise/3-wise expansion where useful. [Explore](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/exploration.md), [design](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/assurance/design.md).

**Product improvement:** prepare a supported integration from an observed map plus an explicit task specification. Record important invariants: excluded items stay excluded; changing a return method does not silently change the approved destination; changed terms require review; an uncertain submission is reconciled before a retry.

This establishes a support boundary instead of claiming a URL can automatically become a reliable integration. Explore alone does not establish action semantics, permission or exhaustive coverage. Its default policy can mutate data; any future exploration must choose the appropriate policy explicitly.

Assurance is best used for integration preparation and regression coverage, not a fresh ingest/design cycle during every user's task. Our immediate per-task receipt is an application feature. Native coverage requires actual requirement/test linkage; it is not created merely by adding several assertions to a one-shot objective.

Coverage also needs careful interpretation: project coverage may take time to update and may include earlier executions; it must not be displayed as proof of this customer's current transaction. Some coverage views count passed-but-stale criteria while surfacing staleness separately. [Coverage](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/assurance/coverage.md).

**Priority: one bounded integration map and a few reviewed criteria if time allows.** Do not build a requirements-management UI for consumers.

## What to defer or avoid

**Parallel simulated people:** different personas do not create useful evidence by themselves. Batch workers have isolated browser profiles, not cloned authenticated task state. Only use scenario runs against genuinely isolated, resettable environments. No such runs were performed in this audit. [Batch execution](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/testrun.md).

**Native mobile and remote grids:** valuable Kane features, but they add no necessary capability to this desktop-web MVP. They would broaden setup and demo risk.

**Performance and general console-error sweeps:** useful when diagnosing a failure, weak as the consumer product's central verification. “No console errors” does not prove the correct shoes were returned.

**Automatic safety-map generation:** an interface map does not prove reversibility. User approval remains application/integration enforcement. `--mode action` is not that enforcement.

**A Kane run for every explanation or rendered field:** a fixed, schema-driven UI can render and compare structured values directly. Use the browser when a new source observation or action is needed.

**Universal cancellation, undo or guaranteed refunds:** none follows from the audited features. A return request is not money arriving, and a timeout is not proof that nothing happened.

## Improved demo

Keep the original single user-driven branch: changing to a printer-free return resets the refund destination in a labeled merchant sandbox. Kane observes the mismatch; ClearPath compares it with preserved intent; Kane corrects the draft and rechecks.

After approval, add one substantive ending: inspect the matching submission response and open the resulting record. Show the correct order line, quantity and destination alongside the receipt. If any field is not exposed, leave that field unverified rather than presenting a universal green check.

This adds depth without a second contrived failure. It shows: **the source changed; the agent noticed; the user's intent survived; the final source record supports the result.**

A screen saying success while the server rejected a request could be an alternative labeled demonstration case, but do not stack both cases into the main demo. Do not automatically retry a submitted financial operation to obtain a theatrical recovery.

## Rubric and implementation decision

The strongest set is browser action plus extraction/conditional checkpoints, draft validation, post-submit network/result checks, one saved reusable journey, and a readable evidence receipt. Explore and a small assurance definition can establish meaningful additional range.

This is enough proposed breadth. The missing evidence is whether the supported integration actually executes reliably, retains the correct session, enforces approval and finishes within the demo budget. Documentation cannot settle those questions, and the user has asked for no further tests at this stage.

The coding-agent feedback criterion still requires actual build history: a coding agent runs Kane, reads the result and changes its next work. A runtime planner responding to source state is useful product behavior, but not a substitute for that specific judging requirement. No score or win probability is established by this audit.

**Recommendation:** strengthen the current ClearPath plan in those areas and keep one complete task. More commands, personas or platforms would dilute the strongest evidence.
