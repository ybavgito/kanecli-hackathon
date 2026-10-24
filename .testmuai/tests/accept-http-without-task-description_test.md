---
assurance:
  id: t-7
  base: sha256:3e398f816edde705bf00e0591f2712b69137a0543ea3e6cdf0b67d99d682b32d
---
# Accept HTTP without task description

> Accept HTTP as the only required input and allow description-free inspection.

## Step 1

Open Raising Kane at {{start_url}} and reach its website URL entry point.

## Step 2 @verifies ac-10, ac-3, ac-5, ac-6

Submit {{http_site_url}} with no task description and allow page inspection, then assert the HTTP URL is accepted as the only required input, inspection does not perform site-changing operations, and offered actions carry observed evidence from that page without being labeled verified completed workflows.
