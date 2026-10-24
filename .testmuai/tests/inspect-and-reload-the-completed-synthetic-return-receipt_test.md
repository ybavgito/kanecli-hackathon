---
assurance:
  id: t-1
  base: sha256:b34a8022e1058f372fb6e3d3676cdc59cea8b596c495ebbfdb93884966c07757
---
# Inspect and reload the completed synthetic return receipt

> At the actual completed Northstar Outfitters return task, verify the saved red-shoes-only, printer-free synthetic outcome and its evidence, inspect the source confirmation without changing it, and reload to confirm persistence without resubmitting.

## Step 1 @verifies ac-8, ac-9

Open {{return_receipt_url}}, the real completed Northstar Outfitters return task in the Raising Kane browser application, then assert the return receipt shows Return requested and Refund pending.

## Step 2 @verifies ac-1, ac-2, ac-3, ac-4, ac-5, ac-6, ac-7

On that completed return receipt, inspect the item and refund summary, then assert only red shoes are returned, the jacket is kept, the return is printer-free, the refund destination is the original payment method, the deduction is $5, the expected refund is $75, and the result is explicitly synthetic rather than a real refund.

## Step 3 @verifies ac-10, ac-11, ac-12, ac-13

On the saved return receipt, inspect its identification and next-step area, then assert it contains a return request ID, next-step instructions, a demo QR link, and a persistent source-confirmation link.

## Step 4 @verifies ac-16, ac-17

On the saved return receipt, inspect its review evidence trail, then assert it records a failed review followed by a passing review after correction.

## Step 5

capture baseline: the saved return receipt contents and return request ID before source inspection and reload

## Step 6 @verifies ac-18

From the saved return receipt, inspect its source-confirmation link and return to the receipt, then assert source inspection caused no return modification by comparing the receipt and request ID with the captured baseline and observing no return-modifying request from the inspection.

## Step 7 @verifies ac-13, ac-14, ac-15

Reload the completed return task at {{return_receipt_url}} and inspect its restored receipt and browser network activity, then assert the receipt contents and return request ID match the captured baseline, the source-confirmation link remains available, and the reload caused no new return submission.
