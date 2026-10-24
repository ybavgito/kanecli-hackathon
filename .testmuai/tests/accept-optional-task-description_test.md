---
assurance:
  id: t-8
  base: sha256:63eeca489fa9356005e91ac9e8d4f19fe7d4010f5bd072c03ab4aeccfc51eda8
---
# Accept optional task description

> Supply a valid URL together with a task description and establish the description does not become a mandatory gate or invalidate the URL.

## Step 1

Open Raising Kane at {{start_url}} and reach its website URL entry point.

## Step 2 @verifies ac-14

Supply {{https_site_url}} as the website URL together with the task description 'find available actions', then assert the valid URL accompanied by that task description is accepted.
