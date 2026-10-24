---
assurance:
  id: t-4
  base: sha256:928d0d582018015a0fb32a0b56b0b20d757925fd7d9ee160b29777588a1cafad
---
# Show honest status for blocked page

> For a blocked or inaccessible supplied page, show an honest status without inventing actions.

## Step 1

Open Raising Kane at {{start_url}} and reach its website URL entry point.

## Step 2 @verifies ac-7, ac-8

Submit {{blocked_site_url}} without a task description and reach the failed-inspection result, then assert the page is reported inaccessible or blocked and no invented actions are offered for it.
