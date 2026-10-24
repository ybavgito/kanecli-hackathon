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

## Follow-up extraction and sign-in checks

- Simplifying extraction into direct named values worked. A [read-only Books
  extraction](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5QZM09HGPRAHC7G63RWGYCV/dashboard/share/US_6EU7UO9I4A89WW5QG80IULODOGE699N06Y2Z0KSQZPRP9E1QA3OQT57H1G8FZ5AD?type=summary&agentView=true&fqdn=summary-page)
  returned actual catalog links and three book prices in `actions_text` and
  `records_text`. Four steps, 19.81 credits. The generic parser is being updated
  to use these observed fields; this probe alone did not update the app's cards.
- The user signed in directly on the test site while Kane was paused. A
  [focused resumed-page check](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5QZR320NNZ2W5KV5WH5QXSW/dashboard/share/US_CR29JFSKHG86PS1EQKDS296BKYNE9PPBG9AA3H1RF7UJMJBD6JKR1F7EWIU0OAXK?type=summary&agentView=true&fqdn=summary-page)
  passed with `browserReused:true` and `browserReconnected:true` for the same
  browser ID `b51ced48c74eb42b`, including after a server-only restart. It extracted
  heading `Secure Area`, URL `/secure`, and the visible successful sign-in message.
  Four steps, 16.71 credits. No credentials were entered into Kane or the app.
- A separate current-page analyzer control returned `[true,false]`: the Secure
  Area heading was visible, while unauthenticated login controls were not. CLI
  exit code was zero; the worker correctly returned `failed` and
  `allConditionsTrue:false`. 5.35 credits. This proves why individual analyzer
  verdicts must be read. Analyzer-only checks do not create a normal evidence pack.
- The assurance-generated unsupported-scheme case passed: the form retained
  `ftp://example.invalid`, displayed the rejection and started no inspection.
  The finalized local pack was inspected and validated. Shared coverage at that
  checkpoint was 1 of 34 criteria (2%), not complete stage1 coverage.

The focused sign-in probe proves browser continuity and source state. Generic
discovery still needs to render its accepted fields in the product before the
full sign-in/resume UI journey can be called complete.

## Generic controller acceptance after extraction repair

The resumed sign-in discovery now passes through the actual controller and returns
`ready`, `signed_in`, and the actual `/secure` URL with no error. No useful
read-only links exist on that page, so no actions were fabricated.

The Books connection now accepts Kane's extracted fields and publishes four
evidenced actions (Books, Travel, Mystery, Historical Fiction) and four observed
book/price records. [The runtime run passed](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5R0B6W3FE6CTH5F8E35NNTC/dashboard/share/US_WORATC6PO2ZBKA32R12K0L9LFDQKKB1O5UCNQIAVWV3HL0CAHTAZ3RP0AHSNUAQM?type=summary&agentView=true&fqdn=summary-page),
four steps, 14.95 credits. These values came from the source; no website-specific
adapter or fabricated cards were added. UI click-through and the persisted
verified-result journey remain the next checks.
