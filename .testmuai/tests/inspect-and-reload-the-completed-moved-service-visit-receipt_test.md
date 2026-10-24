---
assurance:
  id: t-2
  base: sha256:ae539f4f42bfb818d6129b24b9a520dde7553cfed91c0114aac06aa9fddf62f1
---
# Inspect and reload the completed moved-service-visit receipt

> At the actual completed Linden Home appointment task, inspect BOOK-2048 and its source confirmation, then reload the saved receipt to check persistence and the single active booking without making a new submission.

## Step 1 @verifies ac-23, ac-24, ac-25, ac-26, ac-27

Open {{appointment_receipt_url}} in the browser and reach the real completed Linden Home appointment task's Raising Kane receipt for BOOK-2048; then assert it shows the move from Friday October 30 to Saturday October 31, 2026 at 11 AM Pacific time, Maya Chen, Washer repair, 42 Linden Street, San Francisco, and no extra fee.

## Step 2 @verifies ac-19, ac-22

From that completed appointment task, inspect its persistent source confirmation for BOOK-2048 without changing the booking; then assert the source's appointment terms match the Raising Kane receipt and the old booking is replaced with exactly one active booking.

## Step 3 @verifies ac-21, ac-28

Return to the same completed appointment task and reload its browser page without submitting the move again; then assert the same completed receipt and the appointment's source confirmation remain available.
