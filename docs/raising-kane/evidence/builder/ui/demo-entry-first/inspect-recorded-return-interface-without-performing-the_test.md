---
assurance:
  id: t-1
  base: sha256:98ba8f61f8bfed9491a47223cbeb4b73ddb8bebcc5a6fcc02e732281d4410cb7
---
# Inspect recorded return interface without performing the task

> Follow the one permitted sandbox browser journey from homepage through recorded build evidence and candidate results to the preview; never perform task or approval actions; reload and compare the receipt.

## Step 1 @verifies ac-7, ac-8, ac-9

Open http://127.0.0.1:5260 in the browser and inspect the homepage's task-entry area and Demo now section, then assert a website URL input, optional task inputs, and the Verified return interface entry under Demo now are available.

## Step 2 @verifies ac-10, ac-11

From Demo now open Verified return interface and inspect its recorded build page, then assert it says Recorded generated build and explains that verification was captured previously.

## Step 3

capture baseline: recorded artifact visible on the recorded build page before inspecting its evidence and preview

## Step 4 @verifies ac-12

On the recorded build page inspect the source evidence using visible browser controls, waiting for source browser jobs to finish if necessary, then assert the source evidence is inspectable.

## Step 5 @verifies ac-13

On the recorded build page inspect the candidate results using visible browser controls, waiting for source browser jobs to finish if necessary, then assert the candidate results are inspectable.

## Step 6 @verifies ac-14, ac-15

On the recorded build page open Use my interface and move to its preview tab if a new tab opened, then assert the generated return interface renders with Start this task available without pressing it.

## Step 7

capture baseline: receipt visible on the recorded build page before browser reload; return to the recorded build tab if the preview opened separately

## Step 8 @verifies ac-1, ac-2, ac-3, ac-4, ac-5, ac-6

Reload the recorded build page in the browser and inspect its receipt and artifact without starting a task, changing source choices, approving, or submitting, then assert the receipt matches its pre-reload baseline, the recorded artifact matches its pre-inspection baseline, and this verifier's browser journey contained no task-start, source-choice-change, approval, or submission action.
