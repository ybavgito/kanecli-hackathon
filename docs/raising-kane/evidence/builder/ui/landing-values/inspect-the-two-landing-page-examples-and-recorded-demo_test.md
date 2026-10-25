---
assurance:
  id: t-1
  base: sha256:7ac6672d7fad7bab9b13a13a2b7d387539e948169a620c79ba95a4c30a63fcfb
---
# Inspect the two landing-page examples and recorded demo without taking action

> Complete the one ordered landing-page journey: example URL + a goal, read actual values, switch to Just the URL, read cleared goal and retained URL, then observe Demo now and recorded build buttons without starting a task.

## Step 1

Open the synthetic sandbox landing page at http://127.0.0.1:5260 and locate its example choices and task setup fields.

## Step 2 @verifies ac-6, ac-7, ac-8, ac-9

On the landing page select “URL + a goal” in the example and use “Use this example”; inspect the actual #website-url input and #task-goal textarea value properties with read-only DevTools DOM assertions, then assert #website-url.value equals exactly http://127.0.0.1:5261/store, #task-goal.value equals exactly “Return my red shoes without a printer, keep the jacket, and refund my original payment method.”, both observations came from the value properties rather than labels or placeholders, and no manual form-value entry occurred.

## Step 3 @verifies ac-7, ac-10, ac-11

On the same landing page return to the example, select “Just the URL” and use “Use this example” again; inspect the actual #website-url input and #task-goal textarea value properties with read-only DevTools DOM assertions, then assert #website-url.value still equals exactly http://127.0.0.1:5261/store and #task-goal.value equals the empty string.

## Step 4 @verifies ac-1, ac-2, ac-3, ac-4, ac-5, ac-12, ac-13

At the end of that landing-page inspection, examine the demo area and stop without activating its controls, then assert “Demo now” and recorded build buttons are present and the browser interaction trace contains no generation-start, build-opening, task-start, approval, or submission action.
