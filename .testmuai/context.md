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

The generic controller, observation parsers and URL-first state/API are implemented.
The frontend and browser handoff changes are being integrated. They are not yet
Kane-verified. Current build checks pass. The generic engine uses Kane-native
analysis/extraction; it does not use the limited shoes parser from the legacy demo.
Assurance stage1 requirements are in .testmuai/requirements/url-first-stage1.md,
linked to existing Test Manager project 01M5QFXVQKQ0KCCE24PC0BJXYP. Test design and
execution results will be recorded separately. No complete generic authenticated
or consequential journey is claimed yet.

## Existing merchant regression evidence (historical)

The prior return POC remains at ?demo=merchant and existing taskId links, using
/api/tasks and the teammate-owned merchant source. Kane previously passed source
discovery, preparation, method change, intentional store-credit mismatch detection,
correction and the identical review validator after correction. A UI approval
button defect was found, fixed, rebuilt and passed. Explicit-refresh review passed.
The source submission contract remains teammate work, so that demo disables approval
and submission. No complete merchant return has been verified. These results do
not prove the new generic engine. See docs/raising-kane/verification.md.
