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

## Card-to-result integration repair

The first UI click-through passed the four card/source-evidence assertions and
clicked Travel, then failed to show information. Kane had observed the correct
books/prices. Inspection of the completed runtime event established the actual
integration defect: its `final_state` was a renamed human-readable summary,
while the exact requested values were present in `context.variables` as
nonsecret memory entries. The worker discarded those named values. This was an
application parser bug, not an ineligible account or inaccessible source.

The repair retains explicitly allowed nonsecret memory observations. Missing
account extraction no longer implies that the person changed accounts. The
read-only product path is also simpler: retrieve facts, independently check each
fact plus goal/account/source, then save a receipt. Information retrieval needs
no transaction approval. Its live two-site proof is recorded below when complete.

### First complete read-only journey: Books to Scrape

- Real Kane UI verification clicked the discovered **Travel** card and observed
  the corresponding source task start. The four cards and source labels passed.
  [Card click evidence](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5R173R5ZR764AT2ACVW1KSB/dashboard/share/US_KGR66SVBDJQHTHCTZDAZMWJ0BHMSB5DG6W3SQDS7U9FM9VHY3QWOZ72IY486VKHP?type=summary&agentView=true&fqdn=summary-page).
- The runtime extracted Travel, 11 results, **It's Only the Himalayas**, and
  **£45.17** from the actual catalog. A separate analyzer matched **8/8** conditions:
  source/account, four facts, task goal, selected source context, and answer summary.
  It then persisted workflow `9e225a25-de87-48ee-8baa-9a2995074cca` with a verified
  receipt at `2026-10-24T22:43:40.792Z`.
  [Source extraction evidence](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5R18Y1NFY7GJDAZYBWNKCH9/dashboard/share/US_1BVT7YDVENHZ6GIIIN0B6257G4FAS2NRHT2WBCR8AE7CKWLGON0S5PA34YC43Y3V?type=summary&agentView=true&fqdn=summary-page).
- A subsequent Kane UI run passed the receipt facts/source/check-count assertions,
  refreshed the page, checked the unchanged verification time, then returned to
  All discovered actions and reopened the saved Travel result. The action log
  records a successful browser refresh at `22:44:37.384Z`.
  [Persistence and history evidence](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5R1BS0QYPJ00Y5WMZZZE0Z0/dashboard/share/US_PY5DFM4RUTYY42Z95RZQ4W9PKU0OOMMZ5LRZKBP4ZGC6GTFDGY788HZ01ZDRIGDO?type=summary&agentView=true&fqdn=summary-page).
- A before/after API comparison confirmed receipt and evidence were unchanged:
  reloading/reopening did not run the task again. The receipt on disk matched the API.

Books to Scrape is explicitly a synthetic catalog with random demonstration prices.
This proves a read-only information journey, not a real purchase or transaction.

### Second complete read-only journey: Wikipedia

The unchanged generic engine discovered Wikipedia article cards. The first UI
progress-only check clicked the right card but ended stuck in the test runner;
its failure is not counted as a passing UI run. Runtime retrieval and all 8
independent source checks still passed. A fresh end-to-end UI run then clicked
Battle of Schliengen, waited for its saved verified receipt, checked its source
facts and 8/8 checks, refreshed the browser and confirmed unchanged facts, source
link and verification time. It passed in 178.4 seconds, 43.87 credits.

[Complete Wikipedia UI proof](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5R1Q8NHH4F9N5CNZ0R5JF7A/dashboard/share/US_JD6GYZMJBGX4R79DXEEH6UE074PBK34XQFTTC54WL86LPDZ6KPHLIHUB8795Y5VD?type=summary&agentView=true&fqdn=summary-page).

Saved workflow: `c349050d-76d5-422d-8986-4bf8ef7abbc1`. Verified at
`2026-10-24T22:52:11.484Z`. The receipt contains date, location, result and
commanders as observed on the source. Neither website required a site-specific
adapter. These prove two read-only examples, not universal transaction support.

## Extended Kane integration checkpoint

Bounded real Explore runs mapped additional public screens on both origins. A
real named journey was recorded, independently verified, replayed in a new
browser, read again for fresh fields and independently verified again. No live
healing recovery was needed or claimed. A real Books HTTP response corroborated
four saved facts; its label-keyed extraction required the strict parser fallback
for unique expected labels. These modules are now connected to the controller
and interface; their combined UI verification remains pending at this checkpoint.
CI/cloud workflows are configured but were not dispatched. See the Explore,
reusable-journey and regression/maintenance documents for detailed limits.
