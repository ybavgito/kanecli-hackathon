---
assurance:
  id: t-2
  base: sha256:e021f8badb92a1ba2b8f13bcbd4dcb1e324dba5b59b5a2a38452825992c4c935
---
# Inspect actual unfamiliar site without changing it

> Inspect the supplied unfamiliar site with no description, preserving read-only behavior and requiring observed evidence for its offered actions without claiming workflow verification or substituting the sandbox.

## Step 1

Open Raising Kane at {{start_url}} and reach its website URL entry point.

## Step 2 @verifies ac-3, ac-4, ac-5, ac-6

Submit {{unfamiliar_site_url}} without a task description and let Raising Kane inspect that page, then assert its offered actions carry observed evidence from that page, the actual unfamiliar site is used rather than the merchant sandbox, none is labeled a verified completed workflow, and the inspection performs no site-changing operation.
