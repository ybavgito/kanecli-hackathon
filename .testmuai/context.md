# Raising Kane: URL-first product and verification context

Product: Raising Kane. Exact tagline: When websites raise hell, raise Kane.
Current user direction and authoritative spec: docs/raising-kane/raising-kane-project-brief.md.
API/ownership: docs/raising-kane/url-first-contract.md.

## Current journey and acceptance

1. Paste an HTTP/HTTPS website URL. A task description is optional.
2. Kane inspects that page in a dedicated visible Chrome session, without crawling
   the whole site or silently substituting the merchant. Show actual evidenced
   actions, records and access state. No invented options when blocked.
3. Select an observed action; ask only missing non-secret questions. Inspect its
   actual options, costs, requirements, changes and next steps through reusable UI.
   For a read-only information card, retrieve useful facts, then independently
   verify every fact, the task, account and source page with Kane. Save a receipt
   only when all checks pass. Reading information needs no submission approval.
   Reload the saved workflow and retain its exact facts and verification time.
   Prove this entire journey first on Books to Scrape, then on unrelated Wikipedia
   using the same code, without site-specific adapters or seeded result data.
4. Preserve earlier choices. Reversible previews require explicit source support;
   never assume Back undoes a transaction. Show conflicts and unknown terms.
5. Independently recheck current terms before approval. Material changes invalidate
   approval. Execute the exact approved supported action at most once.
6. Inspect the resulting source record. Completion requires passing browser checks,
   structured matching fields and evidence. Uncertainty requires read-only
   reconciliation, not automatic retry. Save a receipt that survives reload.
7. On sign-in/SSO/OTP/passkey/CAPTCHA, stop. Open website, Take over, Continue with
   Kane and Disconnect control the owned visible browser. Continue reuses its
   session and checks account/page again. Account changes invalidate prior tasks.
8. Do not collect secrets in Raising Kane. Explain page/evidence processing before
   authenticated resume. Keep CDP endpoints private; delete the private browser
   profile on disconnect. Automation must be stopped during credential entry.
9. Distinguish option discovered, terms observed, draft checked, action submitted,
   result verified and result unknown. A discovered link is not a verified flow.
10. Prove the generic engine on two unrelated websites without custom site code,
    including a user-signed-in authorized test session. Retain merchant regression.

## Implementation status for this revision

The generic URL-to-card-to-read-to-verified-receipt flow passed on Books to
Scrape and Wikipedia using the same code. Real Kane UI runs clicked cards,
checked source-backed facts, refreshed the browser, and retained the same saved
facts and verification time. Each source result passed 8 independent checks.
See docs/raising-kane/url-first-verification.md for evidence and prior failures.

The next integration checkpoint adds actual bounded Explore maps in separate
public browsers, public read-only journey recording/replay with fresh reads and
independent verification, optional HTTP/API response corroboration, generated
parallel suite commands, coverage/maintenance reporting, and CI/cloud workflows.
Module-level live Explore, replay and HTTP probes passed. Combined UI proof is
still pending at this checkpoint. CI/cloud execution is not claimed: it needs
configured credentials and, for cloud, an externally reachable target.

Replay recipes become proven only after all current-source analyzer conditions
pass. RC.3 replay emits no fresh extracted variables, so replay is followed by a
fresh live read and independent verification. No speed claim is made. Account,
source, goal, requirements or objective drift prevents reuse; signed-in or
query-bearing URLs remain live. Healing must preserve the original requirements.
Explore must finish stopping before takeover claims automation is paused.
Optional response checks distinguish HTTP HTML from API JSON; unavailable checks
retain the timestamped browser receipt, while evidenced conflicts require refresh.

## Existing merchant regression evidence (historical)

The prior return POC remains at ?demo=merchant and existing taskId links, using
/api/tasks and the teammate-owned merchant source. Kane previously passed source
discovery, preparation, method change, intentional store-credit mismatch detection,
correction and the identical review validator after correction. A UI approval
button defect was found, fixed, rebuilt and passed. Explicit-refresh review passed.
The source submission contract remains teammate work, so that demo disables approval
and submission. No complete merchant return has been verified. These results do
not prove the new generic engine. See docs/raising-kane/verification.md.
