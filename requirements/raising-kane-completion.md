# Raising Kane implemented product acceptance

The user asked to implement the reviewed improvements carefully, including a complete useful product and a carefully designed, impressive UX.

## Website-first entry

The application offers two supported sandbox tasks: Return an item at Northstar Outfitters and Move a service visit at Linden Home. Each choice reveals its own start action and scope. The application identifies both sites as synthetic demonstrations. It does not claim arbitrary website support. Starting or viewing a task removes the marketing introduction from the active workspace.

## Verified return receipt

A completed return task displays Return requested and Refund pending. The demonstrated printer-free task returns only red shoes, keeps the jacket, refunds the original payment method, deducts $5, and expects $75. The saved receipt has a return request ID, next-step instructions, a demo QR link and a persistent source-confirmation link. Reloading the task restores the same receipt without a new submission. Its evidence trail preserves a failed review and a passing review after correction. Inspection of the source is read-only. The receipt describes a synthetic result, not a real refund.

## Verified appointment receipt

A completed appointment task shows booking BOOK-2048 moved from Friday October 30 to Saturday October 31, 2026 at 11 AM Pacific time, retaining Maya Chen, Washer repair, 42 Linden Street, San Francisco and no extra fee. These are the fixture's observed matching terms, not a universal choice rule. The old booking is replaced, with exactly one active booking. The task has a persistent source confirmation and survives reload. The source and Raising Kane receipt agree on these terms.

## Exact approval and recovery

Browser evidence must cover all mandatory fields. Missing currency or a wrong observed amount prevents approval even if the browser process reports success. Approval is bound to current intent, source revision and digest. A different browser session cannot approve another session's task. A changed draft invalidates displayed verification. Repeating the same committed operation returns its existing result, while changed terms are rejected. Failed initial discovery must be rerun before preparation so that the baseline exists. A possibly submitted task is reconciled before any retry.

Source contracts and controller fault injection are checked separately using Node's test runner. Saved Kane checks should focus on the implemented website entry and the two real completed task receipts, taking their URLs as variables. They must not create fictional receipts or assume missing tasks are successful.
