# Raising Kane: two-person POC build

> **Implementation update — October 24, 2026:** The PoC has been merged into `main` and both sandbox workflows now reach verified, persistent confirmations. See [implemented scope and demo](implementation-and-demo.md) and [verification](verification.md) for current behavior and measured results. The analysis/build split below records the earlier checkpoint; statements that submission or the appointment flow are unfinished are historical.

**When websites raise hell, raise Kane**

Current specification: [project brief](raising-kane-project-brief.md).

**Latest direction:** the user now requires generic URL-first discovery and
execution on unrelated websites without per-site workflow code. The contract is
[url-first-contract.md](url-first-contract.md). This chat owns the generic UI,
connection/workflow controller and worker. The human teammate retains the merchant
source files and compatibility contract below; do not overwrite that ongoing work.
The old dedicated appointment-adapter plan below is historical and superseded.
Merchant work remains valuable as controlled regression coverage.
Shared baseline: branch `codex/raising-kane-poc`, including `main` at `b99a39f`.
Pull this branch for the latest implementation and verification notes.

## First POC result to deliver

A person requests: “Return the red shoes, keep the jacket, refund my original
payment method.” Kane prepares the merchant form. The person adds “I don’t have
a printer.” The merchant resets the refund to store credit. A real Kane check
fails, Raising Kane explains the difference, Kane corrects it, and the same check
passes. The person approves the exact terms, Kane submits, and a fresh browser
check verifies the persistent source confirmation.

This is one supported merchant sandbox with synthetic data. The finish line is
“Return requested; refund pending,” with an expected $75 refund after the $5 QR
drop-off deduction. It is not a real refund or arbitrary website support.

The updated main-branch specification also requires a distinct appointment
workflow and a website-first task catalog. That is part of the full MVP, after
this return slice is completed. The current POC does not claim that second flow
works. Its requirements are in the current project brief and
`workflow-and-demo-design.md`.

## Ownership

| Owner | Deliverable | Files |
| --- | --- | --- |
| Vaibhav + this Codex chat | Raising Kane UI, task state, OpenAI interpretation, Kane worker, approval/validation orchestration and integration | `src/**`, `server/index.mjs`, `server/controller.mjs`, `server/intent.mjs`, `server/kane-worker.mjs`, `scripts/kane-verify.mjs`, package files, `.testmuai/context.md`, top-level README |
| Teammate | Merchant forms and persistent source records; source-owned approval grants; duplicate-safe commit; retrievable confirmation and synthetic QR; source contract checks | `server/merchant.mjs`, new `server/merchant-contract.mjs`, new `scripts/merchant-contract-check.mjs`, merchant-specific assets |

Keep edits inside the owned files. Agree on a contract change before editing the
other person's files. The product owner integrates both branches and runs the
complete journey. The teammate can verify the merchant separately.

## Current baseline

- The consumer UI, Node controller and real Kane process worker exist.
- The merchant has real browser forms and JSON persistence in ignored `data/`.
- Changing method to `qr_dropoff` resets the destination to `store_credit` and
  adds a 500-cent deduction.
- The initial source draft selects both items; Kane must explicitly exclude the jacket.
- The OpenAI interpreter is integrated. A live API call has not been verified; the limited fallback is explicitly labeled.
- Builds, the Kane landing check, source preparation, method change and correction
  pass. The same review check genuinely failed for store credit, then passed after
  repair. No complete submission/receipt journey has passed yet.
- The source scaffold still exposes a legacy approval callback. Replace that
  baseline with the source-owned grant contract below. The product controller
  requires the new contract before accepting an approval.
- The latest product controller deliberately keeps submission unavailable until
  `registerGrant` and `getOperation` are implemented. Completing the merchant
  contract below enables the approval and submission integration.

## Merchant contract to implement

Keep `createMerchant()` in `server/merchant.mjs`. Return these functions:

```js
{
  handle(req, res, url), // true if served, false if another handler should respond
  getDraft(taskId),
  registerGrant({ taskId, operationId, intentRevision, proposalDigest,
                  draftVersion, validationRunId }),
  revokeGrant(operationId),
  getOperation(operationId),
  getReturnByAttempt(operationId), // existing compatibility alias
  listReturns(taskId),
  resetTask(taskId)
}
```

`registerGrant` is an internal server function, never a browser-accessible HTTP
endpoint. It atomically checks the current draft version and digest before saving
a grant. It must reject a missing validation-run reference. The product controller
is responsible for calling it only after explicit user approval and a passing Kane
validation for that proposal.

On success, return `{status:'active', grantId, operationId, proposalDigest,
draftVersion}`. On refusal, throw an error without creating a grant. The product
requires this explicit success response before enabling submission.

Export `canonicalProposal(draft)` and `proposalDigest(draft)` from
`server/merchant-contract.mjs`. The canonical proposal includes account and order,
selected line IDs and quantities, reason, method, destination, currency, all money
fields and the next-step instructions. Use integer cents and deterministic order.
Keep the source revision as a separate `draftVersion` field on the grant.
Return the source-computed `proposalDigest` on `getDraft(taskId)` as well, so the
controller registers the exact digest the source provided without duplicating
canonicalization logic.

`getOperation(id)` returns `{status:'absent'}` or
`{status:'committed', operationId, proposalDigest, requestId, return: record}`.
An unavailable store throws; it must not be reported as absent.

The browser commit must atomically consume the matching grant, create the return,
and persist the operation result. The same operation ID and digest returns the
same result. The same ID with a different digest is rejected. A changed source
draft cannot use an old grant. Document the single-process persistence boundary.

Preserve these routes and add the confirmation routes:

| Route | Purpose |
| --- | --- |
| `GET /merchant?taskId=...&operationId=...` | Browser form and approved submit; accept existing `attemptId` as an alias during integration |
| `GET /merchant/api/state?taskId=...` | Read-only source draft and returns |
| `POST /merchant/api/draft` | Browser draft edits with expected revision |
| `POST /merchant/api/submit` | Browser commit with task, operation ID and proposal digest |
| `GET /merchant/api/operations/:operationId` | Authoritative read-only reconciliation |
| `GET /merchant/returns/:requestId` | Persistent browser confirmation, all mandatory fields and the kept jacket visible |
| `GET /merchant/returns/:requestId/qr` | Retrievable, clearly labeled synthetic QR artifact |

Preserve the existing draft fields and values:

- Order `ORD-1042`, account `DEMO-ACCOUNT-1`.
- Lines `SHOE-RED-8` ($80, quantity 1), `JACKET-BLACK-M` ($120, quantity 1).
- Reasons `too_small`, `changed_mind`, `damaged`.
- Methods `print_label`, `qr_dropoff`.
- Destinations `original_payment`, `store_credit`.
- `revision`, `selectedLineIds`, `selectedLines`, `subtotalCents`,
  `deductionCents`, `expectedRefundCents`, `currency`, `nextStep`.

## First hour

1. **First 20 minutes:** both people complete their side against this contract.
   Teammate proves stale approval rejection and duplicate-safe source commit;
   product owner proves actual Kane navigation and structured observations.
2. **Next 20 minutes:** integrate. Run the seeded store-credit failure, correction,
   and the same validation again. No green label based solely on a CLI exit code.
3. **Last 20 minutes:** approve, submit, verify the persistent source confirmation,
   reload the receipt and check uncertain-submission recovery. Save actual evidence.

After that slice passes, keep the same ownership split for the required second
source: the teammate builds the distinct appointment portal, isolated records,
slot/version checks and atomic booking update; this chat builds its product
adapter, shared task catalog, decisions and receipt. Agree the appointment
contract before parallel edits. Both people integrate and verify the complete
appointment flow before adding optional return edge cases.

The appointment fixture preserves the Friday booking until approval. Saturday
9 AM changes technician, 10 AM adds $25, and 11 AM currently matches Maya with no
fee. Match observed options to the user's constraints; do not hardcode 11 AM as
the answer. Use separate local origins for the two source websites in the final
demo. Additional edge cases include slot loss, unavailable refund methods,
changing fees, ambiguous items and delayed submission responses.

## Teammate handoff

> Pull the latest `main`, then branch from `origin/codex/raising-kane-poc` as
> `codex/raising-kane-merchant`. Read this file and the current project brief.
> Own only the merchant files listed above. Keep the existing source form working,
> implement the source-owned grant and operation contract, add persistent
> confirmation/QR pages, and verify stale approval and duplicate delivery.
> Use Kane for browser verification following AGENTS.md and the official skill.
> Send the resulting commit SHA and any contract differences before integration.

Do not commit credentials, `data/`, `.env`, or raw private run output. Evidence
claims must name checks that actually ran. The original research packet remains
historical; new product work uses Raising Kane throughout.
