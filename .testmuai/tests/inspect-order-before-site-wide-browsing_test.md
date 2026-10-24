---
assurance:
  id: t-5
  base: sha256:987cfcc4fa759f308860f6de5e6e28dff4527cea4fb47269c2f7b5e559b5e287
---
# Inspect order before site-wide browsing

> Start from an order URL and establish that the order is examined before any whole-site crawl.

## Step 1

Open Raising Kane at {{start_url}} and reach its website URL entry point.

## Step 2 @verifies ac-3, ac-9

Submit {{order_url}} without a task description and let Raising Kane inspect it, then assert inspection stays focused on the supplied order without first crawling the whole site or performing a site-changing operation.
