---
assurance:
  id: t-1
  base: sha256:f07b45ba68c4ef1785e072befc41559f4498b7ff0e5f5472d806f2ebeeaddde3
---
# Approved appointment change retains the saved receipt after reload

> Complete the supported browser journey from loaded booking through verified review, trusted approval and saved confirmation, then reload to compare the receipt.

## Step 1

Open http://127.0.0.1:5240/builder-preview/c4af2431-30ac-45a5-a5f2-d9c5c706d9a3/1?session=4a4be78b-9723-422c-a945-4efcd6a72d0e in the browser; on the generated task interface, use Start this task if visible and wait for the source booking to load.

## Step 2 @verifies ac-10, ac-11, ac-12

In the generated appointment-change interface for the loaded source booking, choose the available Saturday October 31 11:00 slot with Maya Chen and no added fee, then assert the selected available slot is Saturday October 31 11:00, is with Maya Chen, and has no added fee.

## Step 3 @verifies ac-7, ac-8, ac-9

After choosing that slot, wait for the source review to be verified; in the verified source review, inspect the appointment terms, then assert Maya Chen, Saturday morning, and $0 added fee appear there.

## Step 4 @verifies ac-1

In the trusted host approval panel for these verified terms, use Approve exact terms before submitting anything, then assert the exact terms were approved through that trusted panel before submission.

## Step 5 @verifies ac-3, ac-4, ac-5, ac-6

In the trusted host panel, use Submit approved request and wait for the saved confirmation, then assert it shows Appointment change confirmed, the new Saturday October 31 11:00 time, Maya Chen, and no added fee.

## Step 6

capture baseline: the entire visible saved appointment-change confirmation receipt, including its confirmed status, new time, Maya Chen and no-added-fee terms

## Step 7 @verifies ac-2

Reload the same browser page containing the saved appointment-change confirmation and wait for the receipt to load, then assert the entire visible saved receipt equals the receipt captured before reload.
