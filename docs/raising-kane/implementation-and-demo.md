# Raising Kane — implemented product and demo

Implementation checkpoint: October 24, 2026. The PoC is integrated into `main`.
This document describes shipped behavior; older research remains historical context.
The exact tagline is **When websites raise hell, raise Kane**.

## What a person gets

A simpler way to complete a supported website task while keeping the choices that
matter: which item is returned, where the money goes, who visits the home, and what
it costs. The useful output is a saved, verified source receipt, not a chat answer.

The entry page offers two supported websites. Each explains the task before asking
for input. The task view puts the current decision first, with saved preferences and
source evidence beside it. After a choice is made, prior controls collapse rather
than pushing the next decision below a long form. Progress names the current browser
job and shows elapsed time. It does not claim an instantaneous result or a live video.

The desktop uses a clear main column and an evidence sidebar; narrow screens stack
these in decision order. DM Sans is self-hosted. Keyboard focus, disabled/busy states,
connection errors and reduced-motion behavior are explicit. Source inspection is a
read-only view on a separate origin; it does not compete with the agent's controls.

## Two complete workflows

### Return the shoes, keep the jacket

1. Choose Northstar and start the supported partial return. Kane reads the real
   synthetic order. The original jacket record becomes a preserved baseline.
2. Choose a reason. Kane prepares only the shoes and checks all required terms.
3. Change to printer-free drop-off. The source applies a $5 deduction and resets
   the refund destination to store credit. This is an intentional, labeled demo
   trap in the source behavior; the resulting failed Kane check is real.
4. Raising Kane shows the conflict with the original-payment preference and blocks
   approval. Choose to restore the preference. Kane corrects the source; the same
   review validator runs again. The old failed evidence stays visible.
5. Review shoes only, jacket kept, original payment, $5 deduction, $75 expected
   refund and the printer-free method. Approve this proposal, then send it.
6. The source consumes the exact approval grant and saves one return. Kane reads
   the persistent confirmation. Only then does the app show **Return requested**
   and **Refund pending**, with the request ID, next step, demo QR and source link.
7. Reload. The same receipt remains; reloading does not submit again.

The QR is a real generated QR image containing a synthetic marker, not a usable
shipping label. No refund is issued and no real order is modified.

### Move the visit without losing the original booking

1. Choose Linden Home. Kane reads the existing Friday washer-repair appointment.
2. The user wants Saturday morning, the same technician and no additional fee.
   The app evaluates actual source options: 9 AM has another technician; 10 AM
   keeps Maya but adds $25; 11 AM keeps Maya with no fee.
3. The user can change either constraint. Choices are visible and reversible;
   the app does not silently accept a fee or substitute a technician.
4. Select the matching 11 AM slot. Kane selects it on the source and extracts the
   saved date, time zone, technician, service, address, fee and revision.
5. Review, approve, and send. The source atomically moves the existing booking;
   it does not create a second active booking. Kane reads the saved confirmation.
6. The receipt preserves booking ID, confirmation ID, time, technician and fee.

For the stale-state demonstration, the source sandbox's labeled demo control can
remove the 11 AM slot. A source revision change invalidates a previously green
review and its grant. No matching option means no forced choice; the original
booking remains. This scenario has deterministic source-contract coverage; see
verification for the exact live browser scope.

## Where Kane does real work

| Point | Browser responsibility | Application responsibility |
| --- | --- | --- |
| Start | Read order/booking identity in the source | Save intent and original baseline |
| Prepare | Operate real source controls and extract saved terms | Compare source constraints and typed observations |
| Changed choice | Perform bounded edit, then validate refreshed review | Invalidate prior approval; keep failure history |
| Correction | Restore the requested source value | Keep expectations unchanged and require a new passing check |
| Submission | Click the single approved source action | Enforce grant, digest, revision and operation at source commit |
| Result | Read persistent confirmation and extract final fields | Reconcile operation, compare approved terms, save receipt |
| Building | Run generated receipt/entry checks and report failures | Fix actual faults, preserve evidence and publish accurate scope |

Jobs explicitly navigate and reload. A persistent per-task Chrome profile preserves
browser continuity, but current source records are always re-read. Lost browser
state is recovered from the source; a browser session is not treated as a transaction.
Explore is useful for integration research and was tested in the earlier CLI study.
It is not run on every user page transition and is not claimed as automatic discovery
of arbitrary sites in this implementation.

## Approval and recovery contract

The approved canonical proposal contains business terms, including identity, selected
items or appointment slot, amounts and next steps. The grant additionally binds the
source revision, intent revision, validation reference and operation ID. The source
checks and consumes it synchronously with the persisted result. Any draft change
revokes active grants. Unsupported or incomplete browser observations block approval.

A timeout is not proof that nothing happened. The controller persists the operation
before sending, reads source operation status afterward, and verifies a committed
record even if the browser job reported an error. A retry reuses the same operation;
changed terms cannot ride an old approval. A server restart clears interrupted busy
states and offers source reconciliation. Receipts and evidence metadata persist.

The human app session and Kane's source browser profile are separate. A source
browser cannot approve another session's task. These safeguards are implemented
for cooperating sandbox sources; they are not a universal permission layer for the web.

## A convincing live demo

Lead with the actual failed Kane report and the corrected green report. Then open
the saved return task, explain the preserved preference, and show the persistent
receipt and the source confirmation. That establishes proof immediately.

For fresh interaction, start an appointment and show its three constraint-sensitive
choices. While Kane runs, explain the existing booking and compare the source view.
Show the extracted values, exact approval and final confirmation. If time permits,
start a new return and change the method to trigger the source trap live.

Budget honestly: the measured browser jobs take tens of seconds to roughly two
minutes each, and the complete return with correction has eight jobs. A 2–4 minute
video cannot show all waiting in real time. Use clearly marked time cuts, retain
unabridged run reports, and have already completed tasks available. Do not present
saved results as freshly executed. A live demo should allow several minutes for
one complete workflow, with an existing receipt available if the service is slow.

The strongest moment is a source change that visibly conflicts with the user's
saved choice, followed by blocked approval, actual correction and a verified result.
Two styled sites alone are not the claim; preserving meaning across different source
workflows and refusing to confuse a click with completion is the claim.

## Scope and remaining limits

- Both sources are implemented adapters with synthetic records. External login,
  CAPTCHA, third-party atomic commit and arbitrary URL onboarding are not shipped.
- The optional OpenAI intent parser needs a key. This verification used the labeled
  fallback; Kane ran for real. We do not claim an untested parser integration passed.
- Runtime browser jobs were orchestrated through the product API. Separate generated
  UI tests inspect entry and completed receipts. That combination is narrower than
  a full browser-only end-to-end test of every click.
- State is local JSON in one server process. Browser approvals are session-bound;
  task reads are not a production tenant-privacy boundary.
- Requirements were ingested into a local assurance store. Generated criteria were
  not promoted to trusted without human review; passing runs are not a 100% trusted
  coverage claim.
- No automatic guarantee of error-free behavior, accessibility certification or
  real-world merchant compatibility is made.

See [verification](verification.md) for measured outcomes and evidence links.

## Parallel branch discovered during this build

The later PoC commit [`bc68ffe`](https://github.com/ybavgito/kanecli-hackathon/commit/bc68ffee9ca6254000eaa56d676dd2af72f31d31)
adds a generic URL explorer and human browser handoff on `codex/raising-kane-poc`.
It appeared while this implementation was being verified. Its own verification
ledger reports initial public-site extraction failures and pending corrected runs,
sign-in resume and generic completion proof. It is preserved on that branch, not
silently represented as part of this build or overwritten. Integrating its controller,
worker lifecycle and UI with these completed source transactions is separate work.
The completed two-source runtime in `main` starts from the reviewed `0ad30e5` PoC.

## Actual interface captures

These are screenshots of the running implementation and completed synthetic tasks,
not design mockups. The source transaction evidence is linked separately above.

- [Desktop entry](evidence/screens/home-1366.png) · [narrow entry](evidence/screens/home-390.png)
- [Desktop return receipt](evidence/screens/return-1366.png) · [narrow return receipt](evidence/screens/return-390.png)
- [Desktop appointment receipt](evidence/screens/appointment-1366.png) · [narrow appointment receipt](evidence/screens/appointment-390.png)
