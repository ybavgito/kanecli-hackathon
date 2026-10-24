---
mode: testing
max_steps: 50
target: chrome
local_context: >-
  # Raising Kane: product and verification context


  ## Product


  Product name: **Raising Kane**. Tagline: **When websites raise hell, raise
  Kane**.

  Current specification: `docs/raising-kane/raising-kane-project-brief.md`.


  Raising Kane helps a person finish a confusing website task while preserving
  the

  exact outcome they requested. Kane operates the source website. The
  application

  stores intent, checks proposals, records approvals and verifies the outcome.

  OpenAI request interpretation is used when configured; the fallback sample
  parser

  must be disclosed and does not establish OpenAI execution.


  The first supported task is a partial return in a separate, working fictional
  merchant portal with synthetic order data and persistent records. Label the
  source "Merchant sandbox — simulated order." This establishes one real browser
  integration, not support for arbitrary websites. A different source workflow
  is a later integration.


  ## Intended user journey


  1. A person states a request such as: "Return the red shoes, keep the jacket,
  and refund my original payment method."

  2. Raising Kane shows the interpreted intent: item, quantity, exclusions,
  preferred refund method, and any genuinely missing details. The person can
  correct it.

  3. Kane reads the current order and return options in the source website. The
  application separates observed facts from unknowns or suggestions.

  4. The person adds "I don't have a printer." Kane changes to a supported
  printer-free return method. In the sandbox, this change resets the refund
  destination to store credit and introduces a $5 deduction. Raising Kane
  preserves the person's original-payment preference and jacket exclusion.

  5. Kane prepares the return up to the source site's review screen. The
  application compares the proposed item, quantity, reason, return method,
  refund destination, deduction, and next physical step with the approved
  intent. It identifies the store-credit conflict, corrects the draft if
  allowed, and verifies the correction. If the desired choice is unavailable, it
  asks the person what to do.

  6. After the person approves the exact proposed transaction, Kane completes
  the supported sandbox flow and checks the source confirmation. The application
  issues a receipt linked to Kane's evidence.

  7. The receipt states what was actually confirmed, including the return
  request ID when available. It does not claim that a refund has been paid
  merely because a request was submitted.


  ## Acceptance criteria for the first implementation


  - The person's requested item, quantity, item to keep, and refund preference
  remain visible and editable before approval.

  - OpenAI may interpret or explain the request, but the application stores the
  approved values as structured constraints. Unknown values stay unknown.

  - Kane reads the source site and explicitly extracts the fields needed to
  compare the proposed transaction with those constraints.

  - One exact order containing red shoes and a jacket is resolved from source
  observations. An ambiguous item asks for clarification. The jacket remains
  excluded when the return method changes.

  - The user-driven printer-free change updates the task revision and the source
  draft. A late Kane result from an older revision cannot replace the current
  proposal.

  - A source default that conflicts with an approved constraint is corrected
  where possible or surfaced for a decision before completion.

  - A newly disclosed deduction or unavailable requested refund method prevents
  automatic completion and is shown plainly.

  - A consequential submission runs only after approval of the final, current
  proposal. The sandbox enforces approval for that exact draft revision; Kane
  instructions alone are not the approval gate. If source state changes after
  approval, the proposal must be checked again.

  - Completion requires Kane to verify the resulting source state and extract a
  confirmation identifier or equivalent evidence; CLI process exit alone is
  insufficient.

  - A failure, missing value, or ambiguous result appears as "needs attention"
  with evidence. A timeout after a possible submission enters "checking whether
  it went through" and inspects the source before any retry.

  - The persisted receipt says "Return requested; refund pending" and states the
  actual item, expected amount, destination, source confirmation, and next
  physical step. It must survive page reload.

  - Evidence shared with a user or judge excludes credentials and secret test
  values.

  - The demo uses controlled test accounts and transactions; it does not create
  real refunds or charges.


  ## Kane's roles


  - **Discover (setup):** map the supported source workflow and its branches.
  Kane exploration can provide a source-site map and propose tests; that
  exploration does not itself run those tests.

  - **Operate (product runtime):** use short Kane browser jobs to read options,
  prepare the transaction, and, after approval, submit it. Parse agent-mode
  NDJSON and explicitly requested `final_state` extractions.

  - **Prove (product runtime):** require source-page assertions after each
  phase; retain Kane's evidence pack and the verified confirmation. Compare
  observed values with the person's approved intent in application code.

  - **Maintain (development):** generate requirement-linked tests through Kane
  assurance, run the main Raising Kane journey, inspect evidence, and use
  replay/coverage to catch regressions. Never handwrite Kane test cases.


  ## Current implementation status


  A React interface, Node controller, real Kane worker, bounded request
  interpreter,

  and persistent merchant sandbox have been scaffolded. Build and merchant
  contract

  checks have passed. The complete browser journey has not yet passed Kane.

  The current source approval implementation is a baseline; the source-owned
  grant,

  payload digest, retrievable confirmation and final-verification contracts in
  the

  latest brief remain required. See the two-person build plan for ownership.
---

# Session: raising-kane-smoke

## Step 1
Open Raising Kane, verify the Raising Kane branding and Your request textbox are visible, and verify the page clearly says the merchant and order are simulated. Do not start a task.
