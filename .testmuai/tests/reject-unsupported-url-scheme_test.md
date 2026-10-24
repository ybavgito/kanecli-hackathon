---
assurance:
  id: t-3
  base: sha256:bf0b981860a1fe967fd3d5434b9c5951c10b833ae308795b7140bbbe4a439b10
---
# Reject unsupported URL scheme

> Reject a supplied URL with a scheme other than HTTP or HTTPS.

## Step 1

Open Raising Kane at {{start_url}} and reach its website URL entry point.

## Step 2 @verifies ac-2

Submit ftp://example.invalid as the website URL, then assert the non-HTTP(S) URL is rejected rather than accepted for inspection.
