# Raising Kane: UX research and demo direction

October 24, 2026. Research synthesis and proposed interaction design; no usability study of Raising Kane has been conducted. This extends [the workflow decision memo](workflow-and-demo-design.md). The [interactive storyboard](demo-storyboard.html) uses illustrative states, not a live Kane connection.

## The central decision

Give the shopper a small, understandable task workspace. Give the demo audience an expandable evidence view of the same task. Both views must read the same persisted task state.

The visible spine is **Your choices → Current website state → Verified result**. The impressive moment is a specific disagreement between those columns that actually prevents submission, followed by a separate browser correction and a new verification. A browser moving through pages establishes activity; a changed decision backed by evidence establishes usefulness.

This is our design inference, informed by the research below and our [measured CLI experiments](../kane-validation/report.md). It is not proof of usability or a market gap.

## What the research changes

Microsoft's human–AI interaction guidelines emphasize communicating capability limits, making correction efficient, and adapting when the user's intent is uncertain. For Raising Kane, show the supported tasks, retain editable preferences and explain conflicts at the decision where they matter. Avoid a universal “AI can handle this” message. [Microsoft Research](https://www.microsoft.com/en-us/research/?p=564561).

The Magentic-UI paper reports a 12-person qualitative study. It identifies latency, verbose histories and repetitive screenshots as problems; participants wanted better support for revising plans and checking meaningful evidence. Some found repeated approvals excessive, while clarification could be useful. The study is small and does not establish downstream productivity gains. Our implication: use concise state summaries, meaningful source snapshots and revision-aware choices, with approval concentrated on consequential actions. Collaborative browser agents and action guards already exist, so these features alone are not a novelty claim. [Magentic-UI report, sections 7.4 and 8](https://www.microsoft.com/en-us/research/wp-content/uploads/2025/07/magentic-ui-report.pdf).

GOV.UK's question pattern supports focused questions and avoiding repeated requests for information already supplied. Its check-answers pattern lets people edit previous answers and return to review without traversing the entire transaction again. For us, group tightly related inputs when they belong to one decision; do not turn three known preferences into three separate agent waits. [Questions](https://design-system.service.gov.uk/patterns/question-pages/), [check answers](https://design-system.service.gov.uk/patterns/check-answers/).

Google PAIR recommends helping users calibrate trust and providing recovery paths when AI fails. Our implication: explain the observed mismatch and what remains unknown; expose a safe next action. A percentage such as “98% safe” would conceal which requirements were actually checked. [Explainability and trust](https://pair.withgoogle.com/guidebook-v2/chapter/explainability-trust/), [errors and recovery](https://pair.withgoogle.com/guidebook-v2/chapter/errors-failing/).

NN/g's guidance on long waits supports informative progress and the ability to continue other work. Our jobs have taken tens of seconds, so they need a named current activity, elapsed time, retained inputs and an honest boundary for stopping. Do not invent a completion percentage when the amount of work is unknown. [Long waits and interruptions](https://www.nngroup.com/articles/designing-for-waits-and-interruptions/).

GOV.UK's confirmation pattern pairs the result with a reference and what happens next. Our receipt should say “Return requested; refund pending,” with the source ID and drop-off instructions. A generic success animation is insufficient. [Confirmation pages](https://design-system.service.gov.uk/patterns/confirmation-pages/).

## A better first minute

The person selects a connected supported site. Show its account, two or three useful tasks, and the scope of support. For a prepared demo integration, say it was prepared. Do not stage a theatrical “scanning the entire website” animation over a cached manifest.

After “Return an item,” Kane obtains the current order details. Show the item chooser as soon as the required observations are available. The person's first interaction should be a recognizable choice, not configuration of an agent or inspection of an Explore graph.

Use a consistent workspace: task heading, current decision, editable intent summary, current activity and an optional original-site panel. Keep the main action in one location as state changes. Do not rearrange the entire page when a new source option appears.

The introductory sentence can be: “Choose what you want to change. We'll check the website before you approve.” The task selection authorizes the stated preparation scope; final submission remains separately approved.

## What to ask, show and do

**Connect:** show the website and account identity. Ask for sign-in only if required. Show supported tasks from the reviewed manifest. A new URL may enter a discovery preview; it does not inherit another site's passing tests.

**Select:** show current records, recognizable labels and eligibility. Ask only to resolve ambiguity. If the user said “red shoes,” highlight the observed matching item; require a choice if there are two plausible matches.

**Clarify:** ask for facts the source requires and preferences that affect the next branch. Return reason and preferred refund destination can share a short decision screen if both are known to be necessary. Never invent the reason. Preserve any preference already expressed.

**Choose a method:** show observed methods with meaningful consequences together: printer requirement, fee, location requirement and estimated refund if supported. “No printer” should be an ordinary user control, not a demo-only hidden command.

**Prepare:** acknowledge the selected choice immediately; mark source-dependent values as checking. Keep earlier inputs visible. Kane traverses the source pages needed for the bounded phase, then checks the result. Do not optimistically display “Website updated” before confirmation.

**Resolve a conflict:** show expected and observed values in plain words. If the correction is inside the already authorized reversible preparation scope, perform it and expose progress; otherwise ask the user to choose. Do not require approval merely to restore an existing preference, and do not silently accept a changed fee or destination.

**Review:** show the whole proposal, not only the last changed field. Include exact items, exclusions, amount, deduction, method and refund destination. Offer “Change” beside each relevant group. After editing, revisit only dependent checks and return to review.

**Approve and finish:** label the button with the actual action, such as “Request this return.” Obtain version-bound approval, commit through the supported source boundary, verify the saved record and produce a durable receipt. Unknown completion stays unknown until reconciled.

## Page and hyperlink policy

Use a small entry scan to identify the supported site and session. Explore only the selected task's dependency path during execution. Link depth is a budget hint, not a correctness criterion: a task may need three subpages, while most first-level links may be irrelevant.

Ordinary navigation can be grouped in a single bounded job. “Account → Orders → Order details → Eligibility” supports one user decision: choosing an eligible item. Do not invoke a new validation run just because the browser crossed a URL boundary.

Create checkpoints when a new source fact affects a choice, a draft action might violate intent, the user revises constraints, approval is imminent, or a saved result must be confirmed. Purely explanatory links and browser Back within our interface should not automatically launch Kane again.

Opening the original site is allowed as an inspection action. If the person takes control and changes source state, pause the agent's ownership and invalidate affected observations. Reinspect before resuming. Simultaneous human and agent writes in one source session are outside the MVP.

## Make verification legible

For each material requirement, retain the user value, observed source value, check status, observation time, task revision, source draft version and evidence reference. Render a short comparison:

| Your choice | Website now | Result |
| --- | --- | --- |
| Original payment | Store credit | Conflict — submission blocked |
| Keep the jacket | Jacket excluded | Matches |
| No printer | QR drop-off | Matches |

These rows must be populated from source observations and completed checks. Never turn a model's explanation into a passing result. Avoid declaring a partially inspected proposal globally “verified.” If one mandatory check is unknown, show which one and keep submission unavailable.

The ordinary user sees the conflict and next action. Expanding “What was checked?” reveals source URL, timestamp, exact assertion, current execution status and a relevant screenshot. The evidence panel preserves the failed attempt beside the passing rerun. Our merge experiment showed that top-level pack totals can favor the latest success, so retain explicit attempt history.

The screenshot must support the displayed claim. If only a completed-job screenshot is available, label it “Last captured” with its time. Continuous live streaming and arbitrary-site iframe embedding are not established capabilities of our current implementation. The reliable demo fallback is the actual owned browser window beside the app plus post-run evidence; neither should be relabeled as a live embedded stream.

## Show the causal chain in the demo

Use two display modes backed by the same task data:

- **Task view:** decisions, intent, consequences and receipt.
- **Evidence view:** the current source observation, requirement comparison and concise job history. Hide raw logs behind a deeper inspection link.

The evidence view should make five events easy to follow: selected option, source change, failed requirement, corrective action, passing rerun. Reveal the source field at the moment it matters. Avoid a wall of constantly scrolling events.

A meaningful advanced demonstration is to keep the validator's expected destination visible and unchanged while the source is corrected. This shows that the system fixed the draft instead of relaxing the test. A separate source-state inspection can confirm no return was submitted during the failure.

“Independent validation” here means a separate job checked against user-derived expectations. It does not mean an independent model or a guarantee against correlated errors. Deterministic application checks should corroborate exact fields, amounts and versions; the source transaction must enforce approval and uniqueness.

Inspect the expected value as well as the observed one. During the storyboard check, Kane extracted the full receipt heading but compiled a shorter expected string at its semicolon, producing a false failure. The UI must distinguish a real source mismatch from a malformed check. Compare extracted business facts with the immutable task intent in code; do not accept a model-written diagnosis as proof of the failure's cause.

## The strongest live variation

Let the judge choose a supported preference through the real user interface. For example, choose a printer-free method or change the appointment's fee constraint. The resulting source observations must determine the next action.

For a further technical check, allow the sandbox's normal controls to change the source before validation. Keep this explicitly labeled as a sandbox variation. Fresh Kane checks should detect the new state. The product must not read a hidden fault-injection flag as a substitute for inspecting the source.

Do not promise arbitrary challenges. Offer the bounded inputs whose behavior has been implemented and rehearsed. A non-predetermined result within a supported scope is more credible than an unrestricted prompt box whose outcome is secretly scripted.

## Stage narrative and timing

The mandatory narrated video should open with the actual red/green report. Then show one useful journey and explain the discrepancy Kane caught. The live table demo can begin with the source/task comparison and let a judge choose a supported input.

Suggested 3–4 minute video allocation, with waiting compressed and labeled where necessary:

1. **0:00–0:20:** real failed check and passing rerun; one sentence about the shopper's problem.
2. **0:20–0:50:** the merchant source and the simpler task view; show the user's preserved choices.
3. **0:50–2:20:** add no-printer, show the source changing, show the exact failure, correction and unchanged passing check. Approve and verify the result.
4. **2:20–3:20:** switch to the service site and its different task menu; compare technician/fee constraints and show the verified appointment update.
5. **3:20–3:45:** reload a saved receipt, show the source ID and explain the next action. State the two-site support boundary.

These are editorial allocations, not measured runtime promises. The measured red/correction/green segment alone took about 68 seconds on the small fixture, and a complete two-source live flow has not been timed. If a short stage slot cannot accommodate both, keep both fully live-capable at the table and use an explicitly prepared state for the shorter stage segment. Never present old evidence as a new live result.

While a real job runs, explain the relevant source choice and let the evidence view show its status. Do not insert invented activity to fill time. If the job fails operationally, preserve the state and distinguish that from a detected source conflict. A labeled recorded backup is useful; it does not replace the live completion criterion.

## Waiting, edits and recovery

Use event-backed progress such as “Reading available methods” or “Refreshing the merchant review,” with elapsed time. A long job must retain the person's current decisions. Do not promise an exact ETA from a single fixture measurement.

An edit during a job creates a new intent revision. A result produced for the old revision may be retained as history, but cannot approve the new proposal. Serialize jobs touching one draft. Debounce rapid edits and run the dependent checks for the latest settled revision.

Keep three kinds of state distinct in the interface: **the person's desired change**, **what the source has acknowledged**, and **what has been verified**. Selecting QR can immediately update “Your choice,” while “Website method” remains checking. If the selection fails, preserve the person's preference and explain the mismatch instead of silently reverting their intent. This makes the app responsive without inventing a successful source update.

An eventual “Compare options” control should compare observed consequences, not simulated facts. Reuse still-valid observations where possible; fetch missing quotes. If inspecting an alternative mutates a shared draft, serialize it and verify restoration before returning to the original proposal. Parallel browser workers are not automatically safe branches of one person's transaction. For the MVP, one supported reversible comparison is enough.

Offer “Stop after this check” only if the controller can honor that boundary. Show “Stop requested” until the worker acknowledges it. Cancellation does not undo earlier actions; a possibly submitted operation must be reconciled.

When returning to a task, show what is done, what is pending, what needs the person's input and whether any submission occurred. A small status summary is more useful than asking the person to reconstruct a transcript.

## What would make the demo weaker

- Long setup or a complete exploration run before the first useful choice.
- A generic chatbot plus a browser video, without an explicit requirement comparison.
- A red badge driven by a demo toggle rather than an actual failed Kane run.
- An agent silently correcting the problem inside one overall green run.
- Repeated approvals for ordinary navigation, or a confirmation that hides the total consequence.
- Claiming universal site support from two known sandbox adapters.
- Spending the stage slot on an Explore graph instead of the user outcome.
- Showing “Refund complete” when only a refund request was accepted.

## Lightweight human review before freezing the demo

Ask a teammate who did not build the flow to use it without narration. Observe whether they can identify what will change, notice the refund conflict, distinguish checking from completion, revise a choice without restarting, and find what to do after the receipt. These are proposed qualitative checks, not findings already obtained.

For judges, test whether a short viewing lets them answer: “What did Kane observe?”, “Which check failed?”, “What did the agent change because of it?” and “What proves the final result?” If those answers require terminal logs, improve the evidence view before adding features.

The most valuable next implementation is the exact-choice comparison and its real blocking behavior, followed by the persistent receipt. A beautiful loading animation or a larger scenario catalog cannot compensate for a missing causal link between Kane's result and the product's next action.

## Storyboard verification

The standalone HTML was checked in local Chrome at 728px and 390px widths, with all six stage selectors exercised. T3's preview browser was blocked by host AppArmor, so local screenshots were inspected instead. JavaScript syntax and the repository build passed.

The first Kane check was confounded by a styling edit during the Vite-served run. A static-server rerun revealed a separate assertion-compilation issue: the observed heading was complete, but the expected value had been truncated at a semicolon. A final run passed after the complete expected text was supplied as a variable; it also checked the conflict message and disabled submission control. [Recorded checks](../kane-validation/storyboard-verification.json).

These checks validate the illustrative document's navigation and labels. They do not turn the storyboard into a working return integration or prove that an approval gate has been implemented.
