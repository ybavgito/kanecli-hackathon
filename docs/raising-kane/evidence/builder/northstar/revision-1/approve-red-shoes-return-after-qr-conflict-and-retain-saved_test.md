---
assurance:
  id: t-1
  base: sha256:392a57d94dc8ee377425d8ad646de806c425d09b3a25e2e3a0b5f70c32eb5213
---
# Approve red-shoes return after QR conflict and retain saved receipt

> Complete the exact sandbox journey: printed-label $80 review, QR conflict and $75, restore original payment, trusted approval, saved $75 receipt preserved after reload.

## Step 1

Open http://127.0.0.1:5220/builder-preview/c9970e0e-3fbf-4863-b72f-8febf206cea0/1?session=82c15ac9-cee1-478b-ae77-fbb399430953 in the browser; start this task if offered and wait for the source order to load.

## Step 2 @verifies ac-13, ac-14, ac-15, ac-16

In the generated return interface, choose Size or fit issue under Return reason and wait for source work to finish; on the printed-label review, then assert that only red shoes are returned, the jacket is kept, the refund goes to original payment and its amount is $80.

## Step 3 @verifies ac-5, ac-6, ac-7, ac-8, ac-9

In the return review, switch Return method to Printer-free QR drop-off and wait for the source check to finish, then assert a visible conflict, a $5 deduction, a $75 refund, requested Original payment and observed Store credit.

## Step 4 @verifies ac-10, ac-11, ac-12

On the conflicting return review, use Restore my choices and wait for the source review to finish, then assert the source review is verified and shows Original payment and a $75 refund.

## Step 5 @verifies ac-1, ac-2, ac-3, ac-17, ac-18, ac-19

In the trusted host approval panel, approve the exact reviewed terms with Approve exact terms before using Submit approved request; wait for saved confirmation, then assert it displays Return requested; refund pending, a request identifier, a $75 refund, original payment and jacket kept.

## Step 6

capture baseline: saved confirmation receipt's request identifier, Return requested; refund pending status, $75 refund, original payment destination and jacket kept disposition

## Step 7 @verifies ac-4

Reload the browser page showing the saved return confirmation, then assert the same saved receipt remains, including its captured request identifier, status, refund amount, destination and jacket disposition.
