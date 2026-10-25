---
assurance:
  id: t-1
  base: sha256:81fa0eaff2a6a4410115a27685e6893a6c559c134ce855a2936d0afad4961304
---
# Inspect Raising Kane landing-page examples without initiating a task

> Follow the specified landing-page sequence: inspect the Just the URL preview, select URL + a goal and apply that example, return to Just the URL and apply it, inspect Demo now, and stop without leaving the page or initiating any task, build, approval or submission.

## Step 1 @verifies ac-1, ac-2, ac-3

At http://127.0.0.1:5260, inspect the Raising Kane landing page and its example selector, then assert the heading The same website and both Just the URL and URL + a goal example controls are visible.

## Step 2 @verifies ac-4, ac-5, ac-6, ac-7

On the Raising Kane landing page, select Just the URL and inspect its captured preview, then assert the site guide contains Shop, My orders and Help centre.

## Step 3 @verifies ac-8

On the same landing page, select URL + a goal in the example selector and inspect its captured preview, then assert it displays Return the red shoes. Keep the jacket.

## Step 4 @verifies ac-9, ac-10

On the URL + a goal example, use Use this example to populate the landing-page inputs, then assert Website URL contains the local Northstar /store URL and the optional task contains the printer-free shoes return intent.

## Step 5 @verifies ac-11, ac-12

Return to the landing page's example selector, select Just the URL, and use Use this example, then assert the optional task is empty and Website URL still contains the local Northstar /store URL.

## Step 6 @verifies ac-13, ac-14, ac-15, ac-16, ac-17, ac-18

On the Raising Kane landing page, inspect the Demo now offer without opening a build or using Explore & simplify, and stop there without starting a task, approving or submitting, then assert recorded verified builds are offered and the browser remains on the landing page with no opened build, started task, approval or submission.
