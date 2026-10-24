# Raising Kane

## When websites raise hell, raise Kane.

Tell Raising Kane what you need. Make the choices that matter. See what the website actually did.

Complete product, scope, architecture and hackathon demo brief. October 24, 2026.

**Status:** product implementation in progress. The shared POC branch contains the return interface, task controller and Kane worker; its actual runtime and UI checks are listed in [verification notes](verification.md). Submission and the appointment workflow remain incomplete. Separate synthetic rc.3 feature experiments support specific browser, validation, correction and assurance patterns; see [measured results](../kane-validation/report.md). They do not prove the full product, commercial integration or transaction contracts. The [workflow and demo decision memo](workflow-and-demo-design.md) refines the entry experience and two-site presentation.

**Review revision:** specifies the sandbox's atomic approval/commit contract, stable operation keys for duplicate prevention, browser continuity, mandatory completion evidence, persisted receipts, and a deliberately failing Kane validation followed by a green rerun. These are implementation requirements, not results already obtained.

**Two-website scope revision:** the core demo now includes two independently working source websites and different workflows: a merchandise return and an existing home-service appointment change. The second website is essential scope. Earlier research recommending one source is superseded by this decision; arbitrary-site support remains outside scope.

## 1. The project in one paragraph

Raising Kane turns a supported, complicated web task into a short sequence of understandable decisions. A person connects a supported website and chooses from its tested task catalog, or describes what they want within that supported scope. An OpenAI-powered agent uses Kane CLI to inspect and operate the original website. Raising Kane preserves the person's choices as the website introduces new steps and conditions, checks for mismatches before approval, and verifies the resulting record after submission. The person leaves with a completed request, a readable receipt and a clear next step. The hackathon scope has two supported source websites: a partial merchandise return and a constrained home-service appointment change.

### The 30-second pitch

“You know what you want. The website makes it complicated. Raising Kane gives you a simpler way to finish the task. Tell it to return the shoes, keep the jacket and refund your original payment method. When a later choice changes the website's defaults, Kane catches the mismatch, the agent corrects it, and you approve the exact result. Raising Kane then checks what the website saved and gives you the confirmation.”

### The demo's defining moment

The user says, **“I don't have a printer.”**

The agent changes the return method. The website resets the refund destination to store credit. Raising Kane notices that the new draft conflicts with the earlier request for an original-payment refund. Kane corrects the draft and verifies it again.

The user sees a system that follows their intent across a changing task, with the source evidence available to inspect.

## 2. The person and the problem

The initial user understands the desired outcome but finds the merchant's return process confusing: unfamiliar terminology, multiple steps, competing refund choices and instructions that change with the selected method. They may usually ask someone else to help.

The difficulty is often not deciding what they want. It is translating that decision into the website's controls while remembering every earlier choice.

Raising Kane should reduce the number of decisions the person must interpret, expose their consequences, and preserve the decisions already made. This audience and demand are hypotheses; no user research in this project has yet established adoption or willingness to pay.

The interface can benefit people with different reading, attention, language or interaction preferences. The MVP makes no accessibility-certification or disability-specific effectiveness claim. Use plain text, explicit controls and keyboard-friendly interactions as ordinary product quality.

### Why this is a product

Raising Kane owns the user's task from request through completion. It provides a persistent intent record, grounded questions, an editable proposal, approval, recovery from uncertainty and a useful receipt. A person can return to the task and understand its status without reconstructing an agent conversation.

The workflow is how the product delivers that outcome. The source website remains the system where the actual request exists.

## 3. Two supported websites and workflows

### Website one: merchandise return

**Partial return of an order containing multiple items.**

Example request:

> Return the red shoes, keep the jacket, and refund my original payment method.

The first task supports one exact order, one item and quantity to return, one required return reason, a choice between supported return methods, a refund preference, an observed deduction, and submission of the approved request.

The user can revise one decision before submission. The product must carry the other choices forward.

The completed output is a return request and its next-step instructions. It is not proof of warehouse acceptance, a bank settlement or a completed refund.

### Demonstration environment

Build a separate, working fictional merchant portal with synthetic data and persistent records. Label it **“Merchant sandbox — simulated order”** throughout the demonstration.

The portal must have real forms, dependent choices, a draft, a submission action and a retrievable confirmation. Kane must operate those forms. Raising Kane must obtain operational source facts through the browser or its explicitly documented corroborating read path, rather than receiving hidden fixture answers.

The source includes one deliberately configured behavior: changing the return method resets the refund destination. This is a seeded demonstration condition, not a claim about any real retailer.

A commercial integration would materially strengthen the product evidence, but is not established or included in the baseline completion claim.

### Website two: home-service appointment change

Use a distinct home-service website with an existing washing-machine repair appointment. The user asks:

> Move my Friday afternoon repair to Saturday morning. Keep Maya as the technician, keep the same service and address, and do not add a fee.

Kane opens the actual booking, reads its details, enters the rescheduling flow and inspects the calendar and resulting quotes. The synthetic source offers these Saturday options:

- 9 AM: another technician, no extra fee.
- 10 AM: Maya, a $25 additional fee.
- 11 AM: Maya, no extra fee.

The first two options violate different constraints. Raising Kane explains why 11 AM fits, prepares that proposal and asks for approval. The expected result comes from the user's request and the observed source terms; it must not be hardcoded as “always pick 11 AM.”

Until approval and atomic commit, the Friday appointment remains active. After approval, the source atomically updates the existing appointment when its current version and slot availability still match. Kane verifies the resulting appointment, technician, service, address, local date/time, timezone and zero additional charge. The receipt shows the old and new time, booking identifier and an optional calendar download generated from those verified values.

This is a calendar/availability workflow that changes an existing record. The merchandise flow creates a return request and produces return instructions. The two source apps must have distinct interfaces, record models and workflow definitions, with separately isolated data and sessions. A shared underlying technology stack is acceptable; duplicating the same form under two logos is not the proposed demo.

If no slot satisfies all constraints, Raising Kane leaves the existing booking unchanged and asks which constraint the user wants to revise. It must not silently replace the technician, add a charge or cancel the old booking. Slot loss at commit rejects the proposal and returns to source inspection and review.

### Shared product and support boundary

The same Raising Kane interface and controller operate both workflows. Source-specific adapters define the supported entry points, record fields, draft actions, approval boundary and result checks. The user chooses a supported source/task, rather than the product promising arbitrary URLs.

Both source websites are working, labeled sandboxes in the baseline: “Merchant sandbox — simulated order” and “Service sandbox — simulated appointment.” Two commercial-site integrations are not established. Each source should have its own visible origin in the demonstration; use separate local ports or hostnames if running locally.

## 4. The complete user journey

The detailed journey below uses the return example. The service task follows the same inspect, clarify, prepare, verify, approve, commit and reconcile lifecycle with appointment-specific fields.

### Start

The user connects or selects a supported website and sees its tested task catalog. They choose a task and its relevant records; they can also enter a request or select a plainly labeled example. An example fills the input; it does not fabricate an execution result.

Raising Kane starts a task and shows honest progress while Kane reads the source. A prepared demo session is identified as prepared.

### Identify the right records

Kane observes the order and available items. Raising Kane resolves “red shoes” to the exact order line, variant and quantity. If the reference is ambiguous, it asks the user to select the item.

An explicit “keep the jacket” instruction becomes an exclusion, not an incidental phrase that can disappear from model context.

### Preserve the user's choices

A short **“What you want”** section remains visible:

- Return one pair of red shoes, size 8.
- Keep the jacket.
- Refund the original payment method.

The user can edit it. An edit creates a new task revision and invalidates any previous approval that depends on the changed terms.

### Resolve missing information

Raising Kane asks only questions needed by the observed source flow. For example: “Why are you returning the shoes?” with the merchant's available reasons expressed clearly.

OpenAI may explain an option, but cannot invent a return reason or eligibility rule. Material instructions and costs must remain visible even when wording is simplified.

### Show real alternatives and consequences

The product presents methods currently offered by the source, together with observed requirements, deductions and uncertainties.

The user can ask “What changes if I choose this?” On a supported reversible draft, Kane can inspect the alternative and return its actual terms. The MVP implements one such branch, not an exhaustive comparison engine.

An unobserved option stays unverified. A fresh browser is not assumed to be a copy of the user's authenticated draft.

### Adapt when the user changes a requirement

The user adds “I don't have a printer.” Raising Kane updates the task record, discovers the relevant supported option and revises the draft. The original-payment preference and jacket exclusion remain required.

Kane's next observation determines whether that revision worked. A new source state must not be accepted merely because the previous action completed.

### Check the current proposal

The user can press **“Check my choices.”** The same verification happens before submission.

**Raising Kane blocks submission until the user approves the exact proposal and Kane verifies the merchant review against those same constraints. The merchant must atomically reject a changed or unauthorized draft. Raising Kane marks the task complete only after Kane verifies the resulting merchant confirmation and the required fields match the approved proposal.** A browser check alone does not close the gap between verification and commit; the source-side transaction described below does that in the sandbox.

Each requirement is shown as matching, conflicting or not yet verified. A conflict explains the concrete difference:

> The website has store credit selected. You asked for your original payment method.

Raising Kane may correct an allowed draft choice and check again. If the desired choice is unavailable, it asks the person what to do. A model must not weaken the requirement to obtain a passing result.

The demonstration validator ends with an explicit assertion about the refund destination. On the deliberately conflicting draft, that bounded validation run must fail. The controller retains that failed result, dispatches a separate permitted correction job, then reruns the same assertion with the same expected user preference. Do not put correction inside the validator and conceal the failed observation behind one overall green run.

### Approve

The review presents the exact item and quantity, reason, return method, refund destination, observed deduction and remaining physical action. The user approves this current proposal.

If the source terms change before the commit, Raising Kane returns to review. Approval does not cover an unspecified future version of the task.

### Submit and reconcile

Kane performs the supported submission. Raising Kane examines the result and reopens the resulting record when needed.

If the worker times out after submission may have occurred, the task becomes **“Checking whether it went through.”** It does not immediately offer a blind retry. First establish whether a matching request already exists.

### Receive the result

The final screen provides the request identifier, exact item, observed amount and destination, source confirmation, timestamp, available label or QR link, and next physical step.

The headline is **“Return requested; refund pending.”** A claim that lacks evidence remains visibly unresolved.

## 5. The product screens

### Task start

A website selector or URL entry identifies a supported integration. Show its small tested task catalog, current sign-in status and integration readiness. A person can choose a task before composing a goal; natural-language input remains optional. Unknown sites can have a read-only discovery preview, but no enabled transactional task until its integration is reviewed and rehearsed. Keep the primary action obvious. See [the complete website-first journey](workflow-and-demo-design.md).

### Task workspace

The current decision is the visual focus. The user's intent stays nearby. A compact status line reports actual progress, such as “Checking the return options,” with elapsed time when useful.

A secondary **“See the original”** control reveals the latest source observation and its timestamp. Avoid making ordinary users interpret raw CLI output.

### Choice preview

The source-backed options show their consequences. “Explain this” provides a short explanation using already observed information. New questions about current source state trigger a fresh observation when necessary.

### Review and correction

Display the proposal and requirement checks together. A conflict draws attention to the affected choice and the action taken. Successful correction remains visible in the history rather than disappearing behind a generic green badge.

### Receipt

Lead with the task outcome and next step. Evidence is expandable. The receipt should remain available after a page reload.

### Visual direction

Use generous space, readable typography, plain controls and a restrained palette. Communicate status through text as well as color. Keep the original merchant evidence visually distinct from Raising Kane's explanation so the user can tell observation from interpretation.

The impressive contrast is the source's multi-step complexity becoming a few understandable decisions. Avoid fake live screenshots, invented progress percentages or a terminal-themed consumer experience.

## 6. How Kane is involved

Kane is present during the user's actual task. Its observations affect questions, decisions, corrections and completion.

### Explore: learn the supported source

Use Explore during integration preparation to identify screens, paths and conditional behavior, and to inform checks. Review the discovered map against the intended task. Mapping is not proof of exhaustive coverage, permission or reversibility. Exploration and execution remain separate activities. [Explore documentation](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/exploration.md).

Rehearse supported branches on resettable fixtures before enabling a task in the catalog. Distinguish integration rehearsal, current-session discovery, exact-draft verification and final-result verification. Never run a mutating scenario suite on a person's account merely because they connected a URL. Runtime validation must explicitly refresh/refetch the review; our rc.3 experiments found that a same-URL saved check could otherwise read stale rendered state. Source version binding remains mandatory at commit.

### Browser operation: carry out the task

Kane navigates the original source and operates its controls. Bounded jobs cover discovery, draft preparation, correction and approved submission. Explicit outcome checks end each phase. The worker consumes actual completion results, not a model's narrative claim that the task is done. [Execution documentation](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/running-tests.md).

### Extraction and branching: let observations change the next action

Extract the current options, item identity and relevant terms. Use conditional behavior for observed states such as an unavailable method or a changed selection. Raising Kane supplies the durable intent and decision boundaries. [Checkpoint documentation](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/features/checkpoints/overview.md).

### Validation: compare against explicit requirements

Use source observations and targeted assertions to evaluate the current proposal. Current-page analyzer mode is useful for a page already in view; it does not navigate through the entire task. Its condition results must be inspected individually. Code performs exact comparisons where structured values are available.

### DevTools: inspect what the source sent and returned

For the matching transaction, inspect relevant request and response fields and correlate them with the order and request identifiers. Preserve needed fields in the step where they are captured. Network data has scope and size limits. Observing a wrong request after submission detects a problem; it cannot prevent the already-sent action. [Network assertions](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/features/checkpoints/devtools/network.md).

### API corroboration: read a supported result when available

A documented read endpoint can provide additional evidence of the resulting record. This is optional and source-specific. It should not become a hidden shortcut that performs the entire demonstrated browser task. Where an API is the best real integration, use it honestly rather than forcing browser interaction. [API objectives](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/features/api-calls.md).

### Saved journeys: reuse supported phases

Commit parameterized `_test.md` journeys for stable phases. Replay is a possible latency improvement, with re-authoring available for supported failures. Keep approval-sensitive submission separate and reconcile uncertain completion before any retry. No measured Raising Kane replay performance is claimed. [Saved execution](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/testmd/running.md).

### Evidence: explain what happened

Retain run results, source observations and relevant screenshots. Link receipt claims to their supporting evidence and preserve the initial mismatch alongside the correction. Sealed packs are completed-run artifacts, and pack validation concerns integrity rather than semantic truth. [Evidence documentation](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/evidence.md).

### Assurance: define supported behavior

If time permits, derive a small reviewed set of acceptance criteria for the integration and associate execution with them. Native coverage requires this linkage; an aggregate project score must not be presented as proof of one user's current task. Keep requirement management out of the consumer interface. [Assurance design](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/assurance/design.md), [coverage](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/assurance/coverage.md).

## 7. Responsibilities and architecture

### Raising Kane frontend

Renders a fixed set of components: request input, item selection, question, choice preview, requirement status, approval and receipt. It receives structured state and displays it. It does not generate arbitrary source code or browser pages at runtime.

### OpenAI planner

Interprets the user's request, proposes the next allowed action and explains source observations. Its outputs conform to a bounded schema. Allowed decisions include asking for missing input, requesting source observation, preparing an allowed draft change, proposing a correction and presenting a result.

The model cannot invent source facts, approve on behalf of the user or redefine the task as successful when mandatory evidence is missing.

### Application controller

Owns task revisions, job dispatch, exact comparisons, approvals, state transitions and recovery. It serializes browser jobs for a task and checks that each result belongs to the intended session and revision.

A late result from an older revision can remain in history but must not overwrite the current proposal.

### Kane worker

Runs the CLI in a backend environment with browser access. It captures progress, terminal outcomes and evidence references. Use a persistent process or job worker suited to long-running browser work, rather than keeping the entire task inside a short-lived frontend request.

The MVP can run locally on the demo machine. A hosted interface is useful only when connected to a functioning worker. The documented deployment must match what actually runs.

### Task storage

A small persistent store is sufficient. Each task records its source, status, intent revisions, observations, job history, checks, approval and result. The choice of familiar framework and database should serve completion; there is no need for a distributed agent platform.

### Source portal

Each source owns its business records, drafts and committed operations: orders and returns for the merchant; appointments and available slots for the service portal. In the sandbox, commit enforcement checks approval for the exact draft revision. The worker cannot create approval merely by clicking an earlier source control. Raising Kane's user approval is recorded by trusted application logic.

External sites do not automatically expose this enforcement. Until the supported external boundary is established, use a human final submit and state that scope explicitly. Kane's `action` mode is not a transaction-approval firewall.

### Runtime coding agent

None is required. Codex or another coding agent builds Raising Kane and responds to development findings. The customer interacts with Raising Kane's product UI, not a Codex chat interface.

## 8. Data and state that make the product reliable

### Intent revision

Store the exact source/account context, order identifier, selected order line and quantity, exclusions, return reason, refund preference and user constraints. Record which facts came from the user and which came from the source.

### Observation

Record the task revision, source URL, time, observed fields, run identifier and evidence reference. Missing fields remain missing. An older observation is not automatically valid for a new draft.

### Requirement result

For each requirement, retain the expected value, observed value, result and supporting evidence. Useful results are **matches**, **conflicts**, **not verified** and **needs a user decision**. Avoid a numerical confidence score that implies an unmeasured reliability rate.

### Approval

Bind approval to the exact current proposal and source draft revision. Include the item, quantity, destination, deduction and method. A changed proposal needs another review.

### Job

Retain job type, task revision, browser/session association, start/end times, completion status and evidence locations. Progress is distinct from final completion. An interrupted job can leave the source changed.

### Task states

The normal path is: request received; source inspection; user input needed; draft prepared; checking; approval needed; submitting; checking result; completed.

Exceptions include source unavailable, session intervention needed, conflicting terms, uncertain submission and result needing attention. These states should provide a specific next action rather than an opaque failure.

### Important implementation details

Keep one active browser operation per task/session. Supply the current expected values explicitly. Do not use shared global context as the customer's task database. Inspect command-specific terminal events and process exit: a step result is not necessarily whole-job completion.

After a timeout, reconcile before resubmitting. Before declaring an exclusion correct, establish that the right source record is present. After submission, distinguish a request created from a refund settled.

### Contract A: atomic approval and commit in the sandbox

Each source database is authoritative for its drafts, approval grants and committed operations. The following description uses the merchant case; the service portal applies the same grant/version/idempotency mechanism to appointment updates. Each semantic draft edit increments a monotonic `draft_version`. The canonical proposal includes source/account identity, order ID, exact line IDs and quantities, reason, return method, refund destination, currency, refund subtotal, deduction, resulting amount and any material instructions the user approved. Monetary values use integer minor units. Store a deterministic digest of that proposal; an amount-only or timestamp-only approval is insufficient.

After the user approves and the matching Kane validation passes, trusted controller logic registers an approval grant through a protected server-to-server path. It binds the proposal digest, draft version, intent revision, operation ID and validation-run reference. Browser-agent credentials cannot create or modify grants. The source checks the current draft when registering the grant and again when committing it. Changes to material terms invalidate its applicability.

The merchant commit endpoint performs one database transaction, with a row lock or equivalent conditional-update mechanism: check the operation key for an existing result; otherwise require an active matching grant and exact draft version/digest; create the return; consume the grant; and persist the operation result. The grant consumption, unique operation record and return creation commit together. A stale draft or mismatched payload is rejected without creating a return.

Do not implement this as an unlocked “check approval, then insert return” sequence. Do not depend on the Raising Kane and merchant databases committing atomically with each other: the source commit record is authoritative, and Raising Kane reconciles its own state from it.

An edit or revocation must be recorded at the source before Raising Kane acknowledges it as effective. While submission is in progress, the MVP locks task edits until its outcome is known. If commit wins a concurrent race, report the committed result; never imply a later edit retroactively canceled it. This contract applies to the controlled source only.

### Contract B: uncertain submission without duplicates

Create and persist an `operation_id` before the first submission attempt. Carry it into the source draft/commit request. Enforce uniqueness by source account and operation ID in the merchant database. Store the request digest and committed request ID with that operation.

A repeat with the same key and same payload returns the original result, including after the approval grant has been consumed. A repeat with the same key but a different payload is rejected. A genuinely revised proposal gets a new operation only after the earlier operation is conclusively uncommitted or otherwise resolved. For the service portal, the operation result identifies the updated appointment and its new version; retrying must not create a second booking.

After timeout, reconnect and query the authoritative operation status. If committed, read its confirmation. If processing or unavailable, remain unresolved. If absent, a delayed first request could still arrive: any retry therefore uses the same operation ID and payload, never a fresh key. The source's atomic uniqueness contract handles two attempts arriving together.

If the worker crashes after the source commits but before Raising Kane stores the response, startup reconciliation recovers the source result using the persisted operation ID. A missing toast, failed Kane exit or empty local receipt is not evidence that the transaction failed.

An arbitrary external merchant without idempotency and a reliable lookup does not inherit this guarantee. There, ambiguous submission requires reconciliation or human intervention rather than automatic resubmission.

### Contract C: browser continuity across bounded jobs

For the MVP, the worker owns one Chrome instance and dedicated profile per active task/account context. Successive one-shot Kane jobs attach to that same browser through the documented CDP connection mechanism. A task-level lock permits one browser job at a time. Store the browser association, source identity and current task revision in durable application state; keep credentials and browser control endpoints private.

Each resumed job verifies the intended account and order before performing another write. Supply current expected values and relevant prior observations explicitly. `--session-context` is contextual input, not a browser restoration mechanism. A fresh batch worker is not a continuation of the same shopper session.

Reloading the Raising Kane frontend reloads the existing task and job status; it does not launch another Chrome instance, start a duplicate job or resend submission. After browser/process loss, reconnect or reauthenticate, then reconcile the source draft/operation before resuming. If that cannot be established, pause for intervention. Browser survival through an OS restart is not an MVP guarantee.

CDP support is documented, but this multi-job integration remains unexecuted for Raising Kane. The contract must be demonstrated during the eventual build before claiming continuity.

### Contract D: evidence required for completion

For the return task, completion requires all of the following for the same task, operation and approved proposal:

1. An explicit user approval tied to the proposal digest and revision.
2. A passing Kane review-validation result for that exact proposal; a failed or stale validation cannot authorize commit.
3. A committed source operation and durable return-request identifier.
4. A fresh Kane observation of the correct source confirmation/record, with matching order, returned line IDs and quantities, return method, refund destination, currency, deduction and expected refund amount.
5. Confirmation that the jacket is excluded from this return and its relevant order-line state was not changed by the operation, using the recorded baseline and resulting source state.
6. The actual next-step instructions and, when required by the selected method, a retrievable label or QR artifact. In the sandbox this is explicitly a demonstration artifact, not a real shipping entitlement.
7. A passing final verification job, its terminal result and stored evidence references. For the sandbox demo, retain the correlated submission response as corroboration as well.

Correlate network evidence with the operation/request ID. If confirmation and response disagree, do not choose the more favorable one. A source-committed task with missing mandatory verification is “submitted; verification incomplete”; a conflicting result is “needs attention.” Neither receives the fully verified completion state, and neither is automatically resubmitted.

Optional facts such as an estimated bank settlement date may remain unknown. They are distinct from the mandatory submission-result fields. Persist the receipt fields and evidence references; do not depend on a temporary viewer URL as the only record.

For the appointment task, retain the same approval, validation, operation and final-job evidence. Replace return-specific fields with the appointment ID, before/after revision, old and new local date/time, timezone, technician ID, service ID, address and additional charge. Verify that exactly one active appointment remains for the operation and that no independent cancel/new-book side effect was introduced. Slot availability and the old booking version must be checked in the same source transaction that updates the appointment; an earlier browser observation is insufficient to reserve a slot.

### Contract E: reload persistence is essential

Task status, intent revisions, approval reference, operation ID, receipt and evidence references survive a frontend reload. This is baseline scope. Restoring a lost browser session without intervention and adding rich historical search are separate extensions. The earlier scope entry that deferred reopening after reload is removed below.

## 9. Hackathon scope

### Essential: the complete vertical slice

1. One Raising Kane task interface and two working source websites: a merchant sandbox and a service-appointment sandbox.
2. OpenAI-backed request interpretation and grounded question wording.
3. One order with two distinct items and exact item selection.
4. A required return reason and two supported return methods.
5. Persistent intent, including the excluded item and refund preference.
6. One user-driven change with one observable source-side consequence.
7. Kane preparation, mismatch detection, correction and final verification.
8. Revision-bound approval and supported commit enforcement.
9. A persisted result, useful receipt and source evidence.
10. Honest progress, blocked states and reconciliation of uncertain submission.
11. Public same-day code, run instructions, OpenAI usage and Kane evidence.
12. Persisted task and receipt after frontend reload, without duplicate job dispatch.
13. A documented injected return-flow failure that produces a genuinely failed Kane validation, followed by correction and a passing rerun of the same check.
14. An appointment workflow with calendar/quote discovery, preserved technician/service/address constraints, atomic rescheduling and a verified booking receipt.
15. Isolation between the two source sessions and data, with shared task orchestration and evidence presentation.
16. A reviewed capability manifest and executed rehearsal for each enabled task, with separate live-task verification. Explore observations inform the manifests; they are not passing tests by themselves.

The runtime network check should verify fields the sandbox actually exposes. It is a core demonstration goal, not permission to claim commercial-site support.

### Add after the full task works

Broader scenario coverage, historical task search, and a polished evidence drawer. Keep the minimum task manifest, rehearsal evidence and live verification in the essential scope.

### Stretch features

A third independently supported portal, a short task explanation in another language, an on-demand status recheck, or comparison of one additional reversible branch. Each must be labeled according to what runs. Two source integrations are already essential scope; a third is deferred.

### Outside the hackathon scope

Arbitrary websites, a browser replacement, voice conversations, autonomous financial services, automatic account onboarding, family account delegation, live refund settlement tracking, native mobile apps, broad persona simulation, and a marketplace of integrations.

No added feature should displace the completed task, evidence pack or required GTM assets.

## 10. Definition of done

These are implementation acceptance criteria, not claims of checks already performed:

- A user can load Raising Kane, give the supported request, answer the necessary questions, approve and receive the actual result.
- Item selection is grounded in the observed order; ambiguity asks a question.
- The jacket remains excluded when the return method changes.
- The original-payment preference survives the printer-free branch.
- A mismatched source draft produces a specific conflict, not a green summary.
- The injected wrong-destination case produces a failed Kane validation run, and no submission is authorized from that result.
- A permitted correction is verified from the source before review advances.
- A changed draft invalidates approval; the source commit requires the current approved revision.
- No return exists before approved submission in the sandbox.
- Submission results are correlated with the exact task and resulting request.
- The receipt shows what is supported by evidence and identifies pending or unknown outcomes.
- An uncertain submission does not trigger an automatic duplicate attempt.
- A repeated sandbox submission with the same operation key returns the original request; a different payload under that key is rejected.
- A source draft changed after validation is rejected atomically at commit, without creating a return.
- A frontend reload recovers the current task and receipt without issuing another job or submission.
- Source screenshots and worker progress are genuine and correctly labeled.
- Both source workflows complete end to end, with different workflow definitions and source-derived results.
- Rescheduling preserves the original appointment until approved commit, checks the current slot atomically and leaves exactly one active booking with the approved technician, service, address and charge.
- An unavailable matching slot leaves the original appointment unchanged and asks for a user decision.
- The repo includes a reproducible setup, the supported scope and the relevant evidence.

For independent evaluation of the sandbox, inspect its persisted records and transaction history against the user-approved intent. The runtime agent should not obtain a scripted success answer from that evaluation mechanism.

## 11. The two-website demo story

**Opening line: “When websites raise hell, raise Kane.”**

The demonstration shows the same product handling two different source workflows. The return story proves detection and correction. The appointment story proves contextual selection and preservation of an existing commitment. Both must be implemented and capable of live end-to-end completion.

### What the audience sees

Raising Kane has two supported task entries: “Return an item” and “Change an appointment.” The central interface presents the current choice and persistent constraints. A source-evidence panel shows the distinct merchant or service website, with timestamps. A verification view explains matches and conflicts; the final task list contains two separate receipts.

Keep source observations genuine. There is no assumed live screenshot feed; show the latest completed observation unless a real feed has been implemented.

### Act one: the return that changed its terms

The user asks: “Return the red shoes. Keep the jacket. Refund my original payment method.” They then add: “I don't have a printer.”

Kane operates the merchant's return flow. In the labeled fixture, switching to the printer-free method resets the refund destination to store credit. A separate validator explicitly checks the original-payment requirement and fails. Raising Kane withholds submission and shows the conflict. A correction job restores the intended destination, and the same validation passes before approval and commit.

The fixture uses an $80 refundable subtotal, a $5 deduction and a $75 expected refund. These are synthetic demonstration amounts. The final source record and receipt show the shoes only, original-payment destination, deduction and return instructions. The jacket remains untouched.

### Required failure evidence

Retain the fixture configuration, validator objective, expected preference, actual source value and real failed Kane result. Verify through source state that the failed validation did not authorize a return. Preserve the correction and passing rerun of the same assertion, followed by the separately approved submission and final verification.

Label this as intentional fault injection. Do not fabricate a red status, change the expectation to pass, or describe the seeded behavior as a spontaneously discovered production bug. If Kane does not detect the mismatch, the readiness criterion has not been met. A separate coding-agent response to Kane output remains necessary for that judging criterion.

### Act two: a new appointment without losing the old one

Switch to the distinct service website through the same Raising Kane interface. The user asks to move the existing Friday repair to Saturday morning, keeping Maya, the service and address, with no added fee.

Kane reads the original appointment and inspects the offered times and quotes. The UI explains why the 9 AM slot changes the technician and the 10 AM slot adds a fee. It proposes the observed 11 AM option, which matches all constraints.

Before approval, show that the original Friday appointment is still active. The user approves the matching proposal. Kane operates the source rescheduling action; the source checks the slot and booking version and updates the appointment atomically. Kane then reads the confirmation and verifies the exact new state. The second receipt shows the updated time, unchanged details and zero additional charge.

This act does not need another injected failure. Its value is making the agent select a valid option and preserving an existing booking until an approved change succeeds.

### Close with both outcomes

Show the two completed tasks: the return receipt and the updated appointment. Each opens its source confirmation and evidence. Explain that source-specific workflows share the same intent, verification, approval and recovery mechanisms.

Closing line: **“Two websites. Two different tasks. Your choices carried through, with evidence of the result.”**

### Four-minute submission video

Target approximately 15 seconds for the Kane report and pitch, 100 seconds for the return, 100 seconds for the appointment, and 25 seconds for both receipts and the supported-scope statement. Trim waiting periods in the recorded video and label time compression; preserve real execution results and voiceover.

This is an editorial plan, not a measured execution budget. Earlier Kane observations took tens of seconds to minutes. Do not promise that both entire workflows will execute within four uninterrupted live minutes.

### Live table and stage demonstration

At the table, be ready to complete both workflows live. Prepare authentication, synthetic records and any initial discovery explicitly labeled as prepared; no commit occurs during preparation. Present the full sequence with actual browser progress.

If the stage time limit cannot accommodate both complete live runs, choose live segments based on measured timings and explicitly label previously recorded or completed portions. Do not silently drop the second website from the product or present a static receipt as a fresh live result. The stage limit and actual timings remain to be established.

A full recording is backup for service failure or a long run, not evidence that an unimplemented second workflow works. Neither source integration nor the failure/green sequence has been executed for this specification.

## 12. Evidence and judging strategy

**Official source:** [Kane CLI Hack Day event page](https://www.kaneclihack.sh/), Judging and Rules sections, retrieved October 24, 2026. The directly fetched page confirms the four 25-point categories, eligibility gates, GTM allocation and that either a failure/green-rerun sequence or a full green user journey can satisfy the proof criterion. The event hashtag shown there is `#KaneCLIHackDay`. The rubric below also matches the event text supplied by the user; projected scores or winning odds are not asserted.

### Kane usage and uniqueness — 25 points

The central runtime story is observation, user-driven change, detected conflict, corrected draft and verified result. Retain actual evidence of the journey. A full green journey qualifies for the proof criterion; a seeded condition must not be described as a newly discovered merchant bug.

Separately, retain build history where the coding agent runs Kane, reads a result and changes its next work. The runtime planner's behavior is not a substitute for the rubric's coding-agent criterion.

Meaningful range comes from a saved journey, browser checkpoints, network/result checks, evidence, and an Explore or assurance artifact actually used in the project. Feature count alone does not establish usefulness.

### Uniqueness — 25 points

The problem is a person struggling to carry a clear intent through an unfamiliar multi-step interface. The product angle is a simpler task UI whose decisions remain grounded in the source and whose final claims have evidence.

The demo must show why verification changes the outcome. A successful form-fill with no consequential check would weaken the idea.

### Completion — 25 points

One person must be able to complete both supported flows. The sources can be disclosed sandboxes, but both sets of browser work, state changes and receipts must actually run. Keep claims aligned with supported behavior. Provide a README, setup instructions, tests/evidence produced during the eventual build, and a public repo.

### GTM — 25 points

Prepare the submission assets around this one story:

- **Voiceover video, 7 points:** two to four minutes, starts with the Kane report, shows the task and explains what Kane caught.
- **Deck, 4 points:** problem, product, Kane's role, demonstration, supported scope and next step.
- **Blog, 4 points:** explain the failure mode, architecture, evidence and limitations using actual screenshots.
- **LinkedIn, 3 points:** official TestMu AI page tag and the verified event hashtag.
- **X, 3 points:** `@kane_cli` and the verified event hashtag.
- **Show HN, 2 points:** an honest description from the user's own account with the repo or demo link.
- **Reach bonus, 2 points:** genuine external engagement, if earned; never guaranteed.

Every scored asset must be live and linked in the submission under the supplied rules. Use the officially displayed `#KaneCLIHackDay` hashtag, checking for any organizer updates before publication. This brief neither publishes assets nor authorizes anyone to impersonate the user.

### Eligibility gates

Code written today, public repository, OpenAI used in the build, and Kane evidence pack attached to the submission. Retain timestamps and history that support the claimed work.

## 13. Implementation order

First establish the entire working task with minimal presentation: source order and draft, Raising Kane intent, one Kane job, user input, approval, commit and receipt.

Next add the changed-method branch, explicit requirement comparison and correction. This is the core demonstration value.

Then add correlated network/result verification, evidence links and recovery from ambiguous completion. Preserve real build feedback from the coding agent and Kane.

Then implement the service portal and its appointment workflow using the shared controller and UI. Add the source-specific calendar/quote observations, atomic booking update and exact-result checks. Both complete flows take priority over richer evidence styling or broad assurance coverage. Afterward add reusable recorded phases and, if practical, the integration maps and requirement linkage. Polish the screens around the functioning sequences.

Reserve a substantial final block before the 6 PM deadline for the public repo, evidence pack, video and submission assets. Scope reduction should remove stretch features before it removes the receipt, correction, approval or live completion. Actual time allocation depends on the remaining day and team capacity.

## 14. Differentiation and commercial direction

Raising Kane enters an existing landscape. Happy Returns documents an agentic return integration, and AURA describes adaptive presentations of real pages. Therefore “AI returns” and “AI simplifies websites” are not sufficient originality claims. [Happy Returns](https://developer.happyreturns.com/guides/agentic-returns/), [AURA](https://github.com/Phloraxx/AURA).

The proposed product distinction is persistent user intent across a supported operation, a simpler decision interface, visible handling of conflicting source state and an evidenced result. It is a focused product hypothesis, not a proven technical moat.

After the hackathon, validate usefulness with people who currently need help on the supported task. Measure task completion, assistance required, misunderstood choices, unresolved outcomes and total time. Do not claim the product is faster or more reliable without evidence.

A possible distribution path is an assisted-task interface for organizations operating complicated existing portals. That would require a willing partner, a dependable integration and evidence that the experience helps users. Broader commercial-site support and registration flows remain future integration opportunities. The demonstrated appointment flow is already part of the two-website MVP.

## 15. Known limitations and how they affect the promise

**Latency:** browser execution can take tens of seconds or minutes. Use bounded jobs, truthful progress and eventual replay optimization. Do not promise instant completion.

**Authentication:** browser connection support is not proof of dependable merchant login handoff. The baseline uses a prepared sandbox session.

**Approval:** prompts alone do not enforce the final boundary. Enforce it in the controlled source; narrow external operation to human final submission until a reliable supported mechanism exists.

**Source observations:** a screenshot, DOM value or response may omit important context. Mark missing evidence and corroborate where supported. No “error-free” guarantee is justified.

**Source changes:** recorded paths can become stale. Healing may help navigation, but must not change the expected user outcome or repeat an uncertain commit.

**Sandbox generality:** the demo proves the implemented integration. It does not prove arbitrary merchant compatibility, independent customer demand or production readiness.

**Outcome timing:** a return request and a refund settlement are different. Raising Kane's completion language must reflect the observed stage.

## 16. Final project commitment

Build two polished, complete workflows inside one product. The return demonstrates a changed requirement, a real failed Kane validation and a verified correction. The service appointment demonstrates selecting an option that respects earlier constraints and preserving an existing booking until the approved update commits. Finish both with useful receipts and evidence a judge can inspect.

The product should leave the audience remembering one thing: **Raising Kane kept the person's intent intact while the website changed underneath it.**

## Supporting research

- [Kane feature audit](./clearpath-kane-feature-audit.md) — feature-by-feature rc.3 review and integration recommendations.
- [Independent Sol product review](./clearpath-sol-review.md) — audience, scope, competitors and feasibility objections.
- [Earlier product and demo analysis](./clearpath-product-and-demo.md) — the preceding product proposal and demo narrative.

These are the three research attachments referenced by the review. Their filenames retain the earlier ClearPath working title. All exist in the working directory. Relative links require these sibling files when sharing the brief; sending only this Markdown file will not include them. They are background material, not missing runtime components or evidence that execution has occurred. Where earlier scope differs, this revised consolidated brief governs the proposed implementation.

This consolidated brief is the primary project description; the supporting documents preserve the capability research and critical analysis behind its decisions.
