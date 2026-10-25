---
assurance:
  id: t-1
  base: sha256:2462592820043bc3511cbe2752eb8defe5f031801d8ae4ec7f4b9fb2234c708d
---
# Inspect recorded demo build and same-tab preview without starting task

> From the homepage, inspect the Verified return interface demo's recorded build and source evidence image, close the image on the build page, then open its generated-interface preview in the same tab and stop with Start this task enabled but untouched.

## Step 1 @verifies ac-1, ac-2, ac-3

At http://127.0.0.1:5260, inspect the homepage and its Demo now section without entering or changing any task or website values, then assert a website URL input, an optional task input, and the Verified return interface demo are available.

## Step 2 @verifies ac-4

From the homepage's Demo now section, open Verified return interface using its visible browser control, then assert the resulting build page displays Recorded generated build.

## Step 3 @verifies ac-5

On the Recorded generated build page, open and inspect a source evidence image using the visible browser controls, then assert that the source evidence image is inspectable.

## Step 4 @verifies ac-6, ac-7, ac-8

Close the source evidence image using the visible browser control without leaving the build page, then assert the build page remains in the current tab and both the source evidence and candidate result are available there.

## Step 5 @verifies ac-9, ac-10, ac-11, ac-12, ac-13, ac-14, ac-15, ac-16, ac-17, ac-18

Only after inspecting Recorded generated build, the source evidence image, and the available source evidence and candidate result on the build page, select Use my interface using its visible control and stop at the preview without selecting Start this task or changing or restoring choices, approving, submitting, or inspecting a receipt; then assert the preview opened in the original tab, the generated interface renders with Start this task enabled, and the browser journey did not start a task, change or restore choices, approve, submit, or inspect a receipt.
