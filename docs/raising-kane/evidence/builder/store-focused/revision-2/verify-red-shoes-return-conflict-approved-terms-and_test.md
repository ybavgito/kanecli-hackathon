---
assurance:
  id: t-1
  base: sha256:9e91293b645ead28025b2c1ac5f33304db02e45b5a1656de39a89d99a6821eb9
---
# Verify red-shoes return conflict, approved terms and persistent receipt

> Follow the sole specified sandbox browser journey from initial printed-label review through QR conflict, restored terms, trusted host approval, saved confirmation and reload.

## Step 1

At http://127.0.0.1:5300/builder-preview/0f6166ea-0a24-4e54-88cf-4a0634b46c43/verify?key=043c0593-95c0-41de-855a-8b1ded330dac, start this sandbox task if Start this task is visible and wait for the source order to load, using only visible browser controls.

## Step 2 @verifies ac-17, ac-18, ac-19, ac-20

In the generated return interface for the source order, choose Size or fit issue under Return reason and wait for the resulting source work to finish; on its initial printed-label review, then assert that the red shoes are the only item for return, the jacket is kept, Original payment method is displayed and the refund is $80.

## Step 3 @verifies ac-11, ac-12, ac-13, ac-14, ac-15

On the return review, change Return method to Printer-free QR drop-off and wait for the source check to finish; then assert a conflict is visible, the deduction is $5, the refund is $75, the requested destination is Original payment method and the observed destination is Store credit.

## Step 4 @verifies ac-1, ac-2, ac-16

On the conflicting return review, use Restore my choices and wait for the source review to be verified; then assert the verified review displays Original payment method and a $75 refund.

## Step 5 @verifies ac-3

Through the trusted host approval panel, approve the restored terms using Approve exact terms, then assert those exact terms have been approved through that panel.

## Step 6 @verifies ac-4

Through the trusted host panel after approving exact terms, use Submit approved request and wait for the saved confirmation; then assert the approved request has reached its saved confirmation.

## Step 7 @verifies ac-5, ac-6, ac-8, ac-9, ac-10

On the saved return confirmation, store the request identifier, status, refund amount, refund destination and jacket-kept status as pre_reload_receipt; then assert it displays Return requested; refund pending, a request identifier, a $75 refund, Original payment method and jacket kept.

## Step 8 @verifies ac-7

Reload the saved return confirmation in this sandbox browser journey and compare its request identifier, status, refund amount, refund destination and jacket-kept status with pre_reload_receipt; then assert the same saved receipt remains, including Return requested; refund pending, $75, Original payment method and jacket kept.
