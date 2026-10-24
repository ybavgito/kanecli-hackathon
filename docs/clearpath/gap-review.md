# ClearPath brief: gaps and decisions before implementation

Reviewed October 24, 2026 against the [supplied project brief](clearpath-complete-project-brief.md).
The brief is preserved unchanged. This review proposes decisions; it does not
silently amend the scope or claim any ClearPath implementation has passed.

## Assessment

The product outcome, sandbox disclosure, pivotal method-change scenario and
distinction between a return request and a settled refund are clear. The brief
also correctly calls for revision-bound approval, serialized jobs and uncertain
submission recovery. The main gaps are the concrete contracts that make those
promises enforceable and independently verifiable.

Resolve the first four items before implementing submission. The remaining
items can be settled while building the first vertical slice.

## 1. Approval must be enforced in the same transaction as submission

**Priority: blocking. Brief sections 7, 8 and 10.**

The brief requires approval for an exact revision, but does not define how trusted
ClearPath approval reaches the merchant, how the caller is authenticated, or what
happens if the draft changes between the final check and the commit.

Recommended contract:

- Approval binds the task, synthetic account, order, draft ID/revision and every
  material proposal field: line and quantity, exclusions, reason, method, refund
  destination, currency, deduction and expected refund.
- Only trusted controller logic records approval after an explicit user action.
  The browser agent cannot mint approval or change the approved snapshot.
- The merchant validates approval and the current draft version atomically with
  creating the return. Any mismatch rejects submission and requires fresh review.
- A revision change invalidates approval in storage as well as in the UI. Include
  source changes, not just changes typed into ClearPath.

Acceptance evidence needed: an attempted commit without approval creates no
return; a source mutation after approval rejects that approval; concurrent draft
change and submission cannot commit terms different from the approved snapshot.

## 2. Reconciliation needs a durable identity and duplicate-prevention rule

**Priority: blocking. Brief sections 4, 8 and 10.**

“Establish whether a matching request already exists” is insufficient without
defining a match. Two requests can have the same item and amount. The document
also leaves the retry decision unspecified when the source lookup is unavailable.

Recommended contract: persist a submission-attempt ID before dispatch, associate
it with the approved draft, and have the controlled merchant enforce uniqueness
for that attempt. Repeated delivery returns the same request. Record the intent
and attempt before the worker clicks submit; store the resulting merchant ID when
known. A documented, read-only source lookup may reconcile by attempt ID.

An unavailable lookup keeps the task uncertain. A retry is allowed only after
an authoritative result establishes no commit, or through an idempotent operation
that cannot create a second return. Do not claim exactly-once behavior for external
merchants that do not offer the necessary contract.

Acceptance evidence needed: simulate a lost response after the merchant commits,
restart the worker/controller, and demonstrate one return and the same receipt.
Also cover a failure before commit and an unavailable reconciliation lookup.

## 3. Browser ownership and session continuity are unproven

**Priority: blocking feasibility check. Brief sections 6–8 and 15.**

The journey separates inspection, preparation, correction and submission into
jobs, but does not choose how they share the authenticated browser and merchant
draft. A Kane session/context identifier alone does not establish browser reuse.
One operation per task also does not prevent two different tasks from sharing a
browser or profile by accident.

Decide between a worker-owned external Chrome connection and a supported way to
reopen a persisted draft. Define browser/profile ownership, cleanup, worker restart
behavior and the mapping from task to account and draft. For the demo, explicitly
limit execution to one active task on one worker unless isolation is demonstrated.

Run a feasibility check before the full UI: inspect a draft, end that job, resume
it in a second job, change the method, and confirm the same account/order/draft and
the expected reset. Prove old-revision results are retained only as history.

The pinned [saved-execution documentation](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/testmd/running.md)
documents external Chrome attachment; it is a capability to validate, not proof
that this product's lifecycle is already supported end to end.

## 4. Exact source observations and the completion predicate need schemas

**Priority: blocking. Brief sections 6, 8, 10 and 13.**

The brief asks for structured facts and correlated network evidence without
defining their fields, completeness rules or which evidence is mandatory for
completion. It calls API corroboration optional, network checks a core demo goal,
and defers those checks in implementation order. Clarify the final release gate.

Define a minimal observation contract: task/revision, account/order/draft identity,
source revision, selected lines and quantities, method, reason, destination,
currency, amounts, observation time, job ID and evidence reference. Missing data
must remain unknown; an empty selected-item list cannot prove the jacket is excluded
unless the observation is known to contain the complete return selection.

Specify the matching submission endpoint and correlation fields. Extract the
response during the submission step: Kane's [network documentation](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/features/checkpoints/devtools/network.md)
says capture is per-step, with capped bodies and bounded retention. A later job
cannot assume the earlier traffic remains available.

Recommended completion rule: a durable source return exists, its identity and all
mandatory fields match the approved snapshot, and the required evidence is stored.
If a return exists but confirmation is incomplete or conflicting, show a specific
result-needs-attention state. Define what evidence may replace a lost network
response during reconciliation. A passing CLI exit alone is insufficient.

## 5. Reload persistence is both promised and deferred

**Priority: scope correction. Brief sections 2, 5 and 9.**

Sections 2 and 5 promise returning to a task and retaining the receipt after reload.
Section 9 places “reopening a task after reload” after the full task works.

Recommended resolution: task IDs, durable state and receipt reload are essential.
Defer a multi-task history/search screen. Define the behavior of a reload during
submission: restore the pending task and reconcile, rather than starting a new job.

## 6. Merchant fixture rules are only partially specified

**Priority: required before implementing exact comparisons. Brief sections 3 and 11.**

The $80 subtotal, $5 deduction and $75 expected refund establish one case, but the
brief leaves the other method, available reasons, currency, taxes/shipping, item
eligibility and repeat-return rules undefined. “One user revision” also needs a
clear UI boundary if the user edits again.

Write one fixture policy with stable order/line IDs, quantities, reason codes,
method requirements and deductions. For the sandbox, explicitly choose whether
tax and shipping are excluded. Calculate money in integer minor units and keep
currency in every comparison. Decide whether repeat edits are supported or clearly
blocked before submission. Specify method/destination availability failures and
the user's recovery choice. Label any QR/label artifact as synthetic and avoid
implying it is valid at a real drop-off location.

## 7. Planner and worker boundaries need a concrete interface

**Priority: implementation contract. Brief sections 7 and 8.**

“Bounded schema” and “next allowed action” do not enumerate actions, their inputs,
state guards or failure responses. No boundary is specified for instructions
embedded in merchant text, invalid model output or a planner timeout.

Define the allowed planner actions and validate them in the controller before
dispatch. Bind them to the current revision and supported merchant origin. Treat
source text as task data, not authority to approve or widen the operation. Specify
fallbacks for missing/invalid output and unavailable model/browser services. Only
the controller can enter submission after checking approval; model output cannot.

Record model/configuration choices and input/output contracts during implementation.
This review does not select a model or claim runtime latency.

## 8. Verification needs negative cases and an independent source of truth

**Priority: required for completion evidence. Brief sections 9, 10 and 13.**

The definition of done is useful but has no acceptance-case mapping, fault-injection
method or evidence checklist. Specify checks for the happy path, method reset and
correction, ambiguous item selection, unavailable desired option, stale approval,
late old-revision result, duplicate dispatch, lost submit response and reload.

Keep the merchant evaluation path read-only and inaccessible to the runtime planner;
check persisted return records and transaction history independently of the receipt.
Distinguish a controller/merchant invariant check from a Kane browser journey.
Generate runnable Kane cases through assurance from the reviewed requirements.
Assurance-based regression tests can be part of development even if a product-facing
coverage demonstration remains optional.

## 9. Delivery and evidence handling need explicit choices

**Priority: demo readiness. Brief sections 7, 9 and 13.**

Choose the backend/persistent store, worker startup and exact demo topology. The
repo currently contains a Vite/React starter, not those components. Document one
reproducible start command, synthetic seed/reset procedure, configuration names,
health checks and how the frontend reaches the worker. Define reset so it cannot
erase an in-flight task or the evidence selected for the demo.

Specify where screenshots/packs are stored, how receipt links remain valid after
reload, and which artifacts are approved for public sharing. Synthetic data should
also avoid incidental account details, tokens and signed links in published evidence.
Choose phase timeouts and measure a complete live path before promising the four-minute
demo. Assign owners and a cutoff for implementation versus submission assets.

## 10. Documentation dependencies and event claims need follow-up

**Priority: documentation accuracy. Brief sections 12–14 and Supporting research.**

- All nine pinned Kane documentation URLs in the supplied brief returned HTTP 200
  during this review. Their existence does not verify the proposed implementation.
- The three relative research links point to files absent from Downloads and this
  repo: `clearpath-kane-feature-audit.md`, `clearpath-sol-review.md` and
  `clearpath-product-and-demo.md`. They remain unresolved in the preserved original.
  Supply those documents or remove their dependency in a future brief revision.
- The Happy Returns page could not be retrieved by the web tool (HTTP 403).
  Its competitive claim remains unverified in this review. AURA's public repository
  does describe adaptive presentation of real pages; that does not establish a moat.
- The exact judging points, eligibility gates and required social tags need a dated
  official source. The event API checked here did not supply that rubric, so this
  review does not certify the numbers or declare every listed asset mandatory.
- `event_get_brief`, checked at 2026-10-24 20:42 UTC, reported submissions due at
  2026-10-25 01:00 UTC (6 PM Pacific on October 24) and explicitly said teams, ideas
  and submissions stay open after their due times. Treat 6 PM as the due time;
  do not infer an automatic portal lock or permission to submit late.

## Recommended next decision sequence

1. Choose the one-worker sandbox topology and demonstrate browser continuity.
2. Specify the atomic approval/commit and idempotent reconciliation contracts.
3. Define fixture terms, observation fields and the exact completion predicate.
4. Resolve reload scope, then derive acceptance checks from the reviewed requirements.
5. Build the complete slice and measure it before adding optional exploration,
   coverage presentation or further integrations.

## Review limits

This was a document review, source-link check and read-only event-status lookup.
No ClearPath code, model calls, browser jobs, failure-injection checks or user study
were performed. Proposed resolutions remain recommendations until incorporated into
the implementation requirements.
