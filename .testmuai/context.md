# Raising Kane: product and verification context

## Product

Product name: **Raising Kane**. Tagline: **When websites raise hell, raise Kane**.
Current specification: `docs/raising-kane/raising-kane-project-brief.md`.
The latest workflow decision is `docs/raising-kane/workflow-and-demo-design.md`:
connect a supported website, choose a rehearsed task, then verify the user's
current source state during execution. Integration rehearsal is not approval of
a live request. The return and appointment demos both require fresh review,
preserved constraints and verified receipts. These remain target requirements;
the status section below records the current return POC. Use ClearPath only to
reference historical documents.

Raising Kane helps a person finish a confusing website task while preserving the
exact outcome they requested. Kane operates the source website. The application
stores intent, checks proposals, records approvals and verifies the outcome.
OpenAI request interpretation is used when configured; the fallback sample parser
must be disclosed and does not establish OpenAI execution.

The first implemented task is a partial return in a separate, working fictional merchant portal with synthetic order data and persistent records. Label the source "Merchant sandbox — simulated order." The full MVP also requires a distinct home-service appointment source and a website-first task catalog. Those are not implemented yet; arbitrary website support is outside scope.

## Intended user journey

1. A person states a request such as: "Return the red shoes, keep the jacket, and refund my original payment method."
2. Raising Kane shows the interpreted intent: item, quantity, exclusions, preferred refund method, and any genuinely missing details. The person can correct it.
3. Kane reads the current order and return options in the source website. The application separates observed facts from unknowns or suggestions.
4. The person adds "I don't have a printer." Kane changes to a supported printer-free return method. In the sandbox, this change resets the refund destination to store credit and introduces a $5 deduction. Raising Kane preserves the person's original-payment preference and jacket exclusion.
5. Kane prepares the return up to the source site's review screen. The application compares the proposed item, quantity, reason, return method, refund destination, deduction, and next physical step with the approved intent. It identifies the store-credit conflict, corrects the draft if allowed, and verifies the correction. If the desired choice is unavailable, it asks the person what to do.
6. After the person approves the exact proposed transaction, Kane completes the supported sandbox flow and checks the source confirmation. The application issues a receipt linked to Kane's evidence.
7. The receipt states what was actually confirmed, including the return request ID when available. It does not claim that a refund has been paid merely because a request was submitted.

## Acceptance criteria for the first implementation

- The person's requested item, quantity, item to keep, and refund preference remain visible and editable before approval.
- OpenAI may interpret or explain the request, but the application stores the approved values as structured constraints. Unknown values stay unknown.
- Kane reads the source site and explicitly extracts the fields needed to compare the proposed transaction with those constraints.
- Each source job explicitly reloads the page before operating or verifying it;
  review acceptance still compares the extracted revision to the current source.
- One exact order containing red shoes and a jacket is resolved from source observations. An ambiguous item asks for clarification. The jacket remains excluded when the return method changes.
- The user-driven printer-free change updates the task revision and the source draft. A late Kane result from an older revision cannot replace the current proposal.
- A source default that conflicts with an approved constraint is corrected where possible or surfaced for a decision before completion.
- A newly disclosed deduction or unavailable requested refund method prevents automatic completion and is shown plainly.
- A consequential submission runs only after approval of the final, current proposal. The sandbox enforces approval for that exact draft revision; Kane instructions alone are not the approval gate. If source state changes after approval, the proposal must be checked again.
- Completion requires Kane to verify the resulting source state and extract a confirmation identifier or equivalent evidence; CLI process exit alone is insufficient.
- A failure, missing value, or ambiguous result appears as "needs attention" with evidence. A timeout after a possible submission enters "checking whether it went through" and inspects the source before any retry.
- The persisted receipt says "Return requested; refund pending" and states the actual item, expected amount, destination, source confirmation, and next physical step. It must survive page reload.
- Evidence shared with a user or judge excludes credentials and secret test values.
- The demo uses controlled test accounts and transactions; it does not create real refunds or charges.

## Appointment and website-first acceptance criteria (not implemented)

- Select a supported website and see its reviewed task catalog and truthful readiness.
- Keep the existing Friday repair active while inspecting Saturday alternatives.
- Preserve Maya as technician, the service and address, and zero additional charge.
- Choose only a currently observed matching slot; explain rejected alternatives.
- If no slot matches, leave the booking unchanged and ask for a revised preference.
- Refresh the proposal before approval; bind commit to the booking version and slot availability.
- Atomically update one booking, then require Kane to verify the exact saved date,
  timezone, technician, service, address, fee and identifier before issuing a receipt.
- Keep source data and sessions isolated; display the service on a distinct origin.

## Kane's roles

- **Discover (setup):** map the supported source workflow and its branches. Kane exploration can provide a source-site map and propose tests; that exploration does not itself run those tests.
- **Operate (product runtime):** use short Kane browser jobs to read options, prepare the transaction, and, after approval, submit it. Parse agent-mode NDJSON and explicitly requested `final_state` extractions.
- **Prove (product runtime):** require source-page assertions after each phase; retain Kane's evidence pack and the verified confirmation. Compare observed values with the person's approved intent in application code.
- **Maintain (development):** generate requirement-linked tests through Kane assurance, run the main Raising Kane journey, inspect evidence, and use replay/coverage to catch regressions. Never handwrite Kane test cases.

## Current implementation status

A React interface, persistent task controller, OpenAI interpreter with a labeled
sample fallback, and task-owned Kane browser worker are implemented. Build checks
pass. Kane has passed the landing-page smoke check, source discovery, draft
preparation, method change and refund correction. The seeded store-credit case
produced a real failed review-validation run. The identical review check passed after correction; all stored constraints match source draft revision 6.
The saved landing journey is `.testmuai/tests/raising-kane-smoke_test.md`.

An attempted approval of the conflicting draft returned HTTP 409 and created no
source return. Browser restart testing exposed a process-lifetime problem; Chrome
now detaches from the server and the subsequent method-change run reconnected
successfully. Evidence references now point to existing sealed packs.

The complete return journey has not passed Kane. Merchant source-owned grants,
operation lookup, persistent confirmation and synthetic QR are assigned to the
teammate. The product disables submission until the source grant and operation
APIs exist. No live OpenAI request has been verified; the current local task used
the explicitly labeled sample parser. See the two-person build plan for ownership.

Kane also caught an enabled approval button while source submission was unavailable.
Both approval and submit controls now require the source capability. A fresh
read-only Kane check passed the saved proposal, preserved intent, evidence history,
both disabled controls and the unavailable message. The backend independently
refuses approval with HTTP 503 and creates no source return.

After merging the main-branch stale-page research, the controller now explicitly
reloads before every source job. A runtime review passed with that instruction:
Kane reloaded the page, extracted source revision 6 and verified the shoes-only,
QR, original-payment, $5 deduction/$75 refund proposal. The task returned to ready
with no approval or submission.
