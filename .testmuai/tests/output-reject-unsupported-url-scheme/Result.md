---
test: ../reject-unsupported-url-scheme_test.md
status: passed
started: 2026-10-24T22:26:24.459Z
duration_s: 44
session_id: 0bfe7785-fce2-4706-8a68-eb7e95787437
---

# Reject unsupported URL scheme — Result

## Step 1 ✓ passed (0.14s)
md5: fa5204e6e5aa760d79d68a5a68a084a6
Open Raising Kane at {{start_url}} and reach its website URL entry point.

## Step 2 ✓ passed (27.9s)
md5: 0e54568ad1ebe56e96878751aa8a15ff
Submit ftp://example.invalid as the website URL, then assert the non-HTTP(S) URL is rejected rather than accepted for inspection.
