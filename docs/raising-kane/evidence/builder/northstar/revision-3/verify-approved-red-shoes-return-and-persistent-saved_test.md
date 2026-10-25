---
assurance:
  id: t-1
  base: sha256:ff7b1174966d453958cf341ea02b72573dba6477efe5fd0b3d15ea5075e5a948
---
# Verify approved red-shoes return and persistent saved receipt

> Follow the specified sandbox browser journey: review only red shoes with printed-label $80 original-payment refund; switch to QR to observe the $5 deduction, $75 refund and payment-method conflict; restore to verified $75 original-payment review; approve in the host panel; submit and reload the same saved pending receipt.

## Step 1

Open the sandbox generated interface at http://127.0.0.1:5220/builder-preview/c9970e0e-3fbf-4863-b72f-8febf206cea0/3?session=962b02b2-eb7f-4321-9e63-e839cffb0770 and start this task if offered; wait for the source order to load.

## Step 2 @verifies ac-1, ac-3, ac-4

In the generated interface for the source order, choose Size or fit issue under Return reason and wait for source work to finish; then assert the return review includes only the red shoes while the jacket is kept, and shows an $80 printed-label refund to Original payment method.

## Step 3 @verifies ac-5, ac-6, ac-7, ac-8

In the return review, change Return method to Printer-free QR drop-off and wait for the source check to finish; then assert a conflict is visible, the deduction is $5, the refund is $75, and requested Original payment method differs from observed Store credit.

## Step 4 @verifies ac-9, ac-10, ac-11

In the QR conflict review, use Restore my choices and wait for the source review to be verified; then assert the verified review displays Original payment method and a $75 refund.

## Step 5 @verifies ac-2, ac-12, ac-13, ac-14, ac-15

In the trusted host approval panel, approve the exact terms, then submit the approved request and wait for the saved confirmation; then assert the approval preceded submission and the saved confirmation displays Return requested; refund pending, a request identifier, a $75 refund and Original payment method, with the jacket kept; store the receipt's identifier and displayed terms as receipt_before_reload.

## Step 6 @verifies ac-16

Reload the sandbox browser page with the saved confirmation; then assert the same saved receipt remains, matching receipt_before_reload in request identifier, pending status, $75 refund, Original payment method and jacket kept.
