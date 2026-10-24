---
assurance:
  id: t-6
  base: sha256:f6d9ee57d482385466d74f6dd46ac046727ab1525b4d2a0a98ea340d8e1bd77e
---
# Accept HTTPS without task description

> Accept HTTPS as the only required input and allow description-free inspection.

## Step 1

Open Raising Kane at {{start_url}} and reach its website URL entry point.

## Step 2 @verifies ac-11, ac-3, ac-5, ac-6

Submit {{https_site_url}} with no task description and allow page inspection, then assert the HTTPS URL is accepted as the only required input, inspection does not perform site-changing operations, and offered actions carry observed evidence from that page without being labeled verified completed workflows.
