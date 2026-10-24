---
assurance:
  id: t-1
  base: sha256:602cfb0c5cf50363f6ed9053379f6fba9a67158b27c95ebdc710adc36a77333c
---
# Compare visible offline return method terms without submitting

> In the offline preview, compare the visible refund destination, deduction and USD refund for each selectable method, switch between them, inspect the QR preference conflict and instructions, and remain within the read-only comparison.

## Step 1 @verifies ac-3, ac-4, ac-5

Open http://127.0.0.1:38491/generated/agentic.html and inspect the offline return comparison's user context, then assert Blue shoes alone is being returned, Green jacket is kept, and original payment is the user's preference.

## Step 2 @verifies ac-1, ac-2, ac-6, ac-7

Inspect the generated interface's return-method controls and read-only comparison state, then assert Printed label and QR drop-off are both selectable, no return submission is offered, and no completed return is claimed.

## Step 3 @verifies ac-8, ac-9, ac-10

Select Printed label in the offline comparison and inspect its visible refund terms, then assert that this selected method shows Original payment as destination, $0.00 deduction, and $80.00 USD refund rather than relying on hidden markup.

## Step 4

capture baseline: selected return method in the offline comparison

## Step 5 @verifies ac-11, ac-12, ac-13, ac-14, ac-15, ac-16, ac-17

Change the offline comparison from Printed label to QR drop-off and inspect the selected method's visible terms and instructions, then assert QR drop-off is now selected, its destination is Store credit, its deduction is $5.00, its refund is $75.00 USD, its visible explanation identifies the conflict with the user's original-payment preference, and its instructions say photo ID is required and the maximum parcel is 4 kg.
