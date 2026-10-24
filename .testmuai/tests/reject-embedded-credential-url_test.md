---
assurance:
  id: t-1
  base: sha256:9c8287c4d740b1c237200c85d1097cbe65e5c3064667f9c2e11146c97408a103
---
# Reject embedded-credential URL

> Submit a URL containing userinfo and establish it is rejected rather than inspected.

## Step 1

Open Raising Kane at {{start_url}} and reach its website URL entry point.

## Step 2 @verifies ac-1

Submit http://user:pass@example.invalid as the website URL, then assert this credential-bearing URL is rejected rather than accepted for inspection.
