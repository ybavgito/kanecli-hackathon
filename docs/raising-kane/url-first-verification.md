# URL-first implementation verification

October 24, 2026. This ledger covers the new generic engine. Prior merchant
evidence is preserved separately in `verification.md` and does not prove these
features. Synthetic/public test sites only; no personal account was inspected.

## Recorded checks

- Build and syntax checks pass for the initial generic controller, observation
  parser, session worker and reusable URL-first interface.
- [Landing-page Kane check](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5QYRH0CCMHTEG6XVVG8A713/dashboard/share/US_NPLHYW4DXJQ77OHVOG43D72GWVJ6FIDF1HE46LL5O5DA306HRATVITZZWMP9KN2X?type=summary&agentView=true&fqdn=summary-page):
  passed in 29 seconds, 10.91 credits, seven completed browser steps. Verified
  exact tagline, required URL, optional goal, processing disclosure and preserved
  merchant regression entry. No website connection was started by this check.
- [Login discovery](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5QYTM19BS1V81E9NJ1TYW3Y/dashboard/share/US_TADNZI9MR5BW0VMO6HD3O30JILZGPYMQRTPY8N7CH7Y0VBLU6HKPH2651J630CZI?type=summary&agentView=true&fqdn=summary-page):
  action mode stopped on the synthetic test login's `auth_required_blocker`.
  The controller reached `needs_sign_in`, with no invented actions. The worker
  paused and retained the same dedicated visible Chrome. The user was asked to
  sign in directly; this does not yet establish a successful resume.
- Initial Books to Scrape and Wikipedia discovery jobs failed. The sealed step
  evidence shows accessible pages but extraction stalled because it cannot store
  an empty `account_label`. The correction uses an explicit unknown sentinel.
  Their failure must not be described as inaccessible websites or successful
  discovery. Corrected runs remain pending at this checkpoint.
- Observation-boundary checks rejected non-web schemes, credential URLs,
  unsupported questions, actions without source quotes and cross-origin actions.
- Worker parser/lifecycle checks use a synthetic CLI fixture and disposable
  Chrome. They cover false/null/missing analyzer verdicts, cancellation of queued
  and TERM-resistant running processes, resume and profile deletion. These are
  implementation checks, not live Kane end-to-end proof.

## Required remaining proof

Two unrelated public websites through the same generic discovery/options engine;
user-completed sign-in and same-browser resume; a checked, persisted read-only
receipt; generated assurance checks and coverage; failed/unknown result handling.
Consequential arbitrary-site execution must not be claimed from these checks.
The human teammate's merchant commit/confirmation work remains separate.
