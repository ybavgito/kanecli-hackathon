---
assurance:
  id: t-1
  base: sha256:3568ffc8b35d02abf885c0846445f486e1e9745510110a74e3782a5919b33bac
---
# Verify approved red-shoes return and persistent $75 receipt

> Complete the printed-label review, reveal the QR payment conflict, restore original payment, approve exact terms in the trusted host panel, submit the return and verify the saved receipt after reload; observe the jacket kept and excluded from returned items.

## Step 1

Open the sandbox generated interface at http://127.0.0.1:5220/builder-preview/c9970e0e-3fbf-4863-b72f-8febf206cea0/2?session=eb147f41-63b5-4a84-8fb5-226d2a783d3c; start the task if prompted and wait for the source order to load.

## Step 2 @verifies ac-1, ac-16, ac-17, ac-18, ac-19

In the generated interface's Return reason section, choose Size or fit issue and wait for source work to finish; on the printed-label review, then assert only red shoes are among returned items, the jacket is absent from returned items and marked kept, original payment is shown, and the refund is $80.

## Step 3 @verifies ac-2, ac-3, ac-4, ac-5, ac-6

In the review's Return method section, change the method to Printer-free QR drop-off and wait for the source check to finish; then assert a conflict is visible, the deduction is $5, the refund is $75, and requested Original payment differs from observed Store credit.

## Step 4 @verifies ac-7, ac-8

In the conflicting return review, use Restore my choices and wait for the source review to be verified; then assert Original payment and a $75 refund are displayed.

## Step 5 @verifies ac-9

In the trusted host approval panel, use Approve exact terms before any submission; then assert the exact-terms approval was performed through that trusted host panel.

## Step 6 @verifies ac-10, ac-11, ac-12, ac-14, ac-15

From the approved return review, use Submit approved request and wait for the saved confirmation; then assert it reads Return requested; refund pending, shows a request identifier and a $75 refund to original payment, and shows the jacket kept.

## Step 7

capture baseline: saved receipt including request identifier, status, refund amount, refund destination and jacket-kept designation before reload

## Step 8 @verifies ac-13

Reload the sandbox browser page and return to the saved confirmation; then assert the saved receipt matches the captured pre-reload receipt, including the same request identifier, status, $75 refund, original payment and jacket kept.
