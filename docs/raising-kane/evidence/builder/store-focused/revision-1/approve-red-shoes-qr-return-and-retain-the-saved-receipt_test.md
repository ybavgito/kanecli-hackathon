---
assurance:
  id: t-1
  base: sha256:05ced3dfc053dedba82e394f095105a5a1364b683590589f5b7ae963f89dbbd7
---
# Approve red-shoes QR return and retain the saved receipt

> Complete the prescribed browser journey: inspect printed-label terms, observe the QR payment-method conflict and deduction, restore original payment method, approve and submit through the trusted host panel, then reload the saved receipt.

## Step 1

Open http://127.0.0.1:5173/builder-preview/87fb50e3-35c8-49ae-8fea-06f43f171105/verify?key=f851e64f-0038-4752-8326-0216e78d4a21 in the browser; start the task if offered and wait for the source order to load.

## Step 2 @verifies ac-3, ac-4, ac-5, ac-6

In the generated return interface for the source order, choose Size or fit issue under Return reason; wait for source work to finish, then assert the printed-label review shows only red shoes returned, jacket kept, Original payment method and an $80 refund.

## Step 3 @verifies ac-7, ac-8, ac-9, ac-10, ac-11

In the return review, change Return method to Printer-free QR drop-off; wait for the source check, then assert the review displays a conflict, a $5 deduction, a $75 refund, requested Original payment method and observed Store credit.

## Step 4 @verifies ac-12, ac-13, ac-14

In the conflicted review, choose Restore my choices and wait for the source review to become verified, then assert the verified review displays Original payment method and a $75 refund.

## Step 5 @verifies ac-1

In the trusted host approval panel for the verified $75 Original payment method review, approve the exact terms using Approve exact terms, then assert the exact terms were approved through the trusted host panel rather than generated code.

## Step 6 @verifies ac-2, ac-15, ac-16, ac-17, ac-18, ac-19

In the trusted host panel, use Submit approved request and wait for the saved confirmation, then assert the host-panel submission produces Return requested; refund pending, a request identifier, a $75 refund, Original payment method and jacket kept.

## Step 7

capture baseline: saved receipt's request identifier, status, refund amount, payment method and jacket-kept state immediately before reload

## Step 8 @verifies ac-20

Reload the browser page containing the saved return confirmation, then assert the same saved receipt remains, including the captured request identifier, Return requested; refund pending, $75 refund, Original payment method and jacket kept.
