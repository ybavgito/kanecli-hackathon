# Raising Kane verification

## October 24, 2026: initial shared checkpoint

- `npm run build`: passed.
- `npm run verify:kane` with recorded name `raising-kane-smoke`: passed.
- Scope: product branding, the request textbox and the explicit fictional merchant
  and simulated order disclosure. The check did not start a return task.
- Kane duration: 52.7 seconds; five completed browser steps; 14.99 credits.
- Saved journey: `.testmuai/tests/raising-kane-smoke_test.md`.
- [Kane run in Test Manager](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5QVMV2RDQVTG3AY1BN5SE5A/dashboard/share/US_0V4U8KY97VOPRHS54Y1LFO7UOW0UX10S8BS80DNAFCC8OH7C4LLSTRGQKPAZDOYD?type=summary&agentView=true&fqdn=summary-page).

The complete return flow, source-owned approval grants, uncertain-submission
recovery and final confirmation verification remain unverified at this checkpoint.
Native assurance coverage was not measured by this smoke check.

## Runtime return checks

These were real Kane jobs dispatched by the product controller through its HTTP
API. This is not yet a full test of every frontend interaction or completed
submission. All records are synthetic.

| Phase | Kane result | Duration | Observed scope |
| --- | --- | --- | --- |
| [discover](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5QW0B18KX6EJD7QGAFWVPP3/dashboard/share/US_VJES3140Z4I2X39VZ6GC79LYJC5VEQ2CCBHW1NEPL075QJ9RK90HR451WP9VSSCT?type=summary&agentView=true&fqdn=summary-page) | passed | 45s | Read order ORD-1042 and both items. |
| [prepare](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5QW2KY9R09Z1QCXE896MG28/dashboard/share/US_ZQOTGSEZY4VJMMZ7KPJ24W623BUZSSLEK5FITXNFJK2UQSAZJZRKRR7ANT7Z4382?type=summary&agentView=true&fqdn=summary-page) | passed | 106s | Prepared shoes only, kept jacket, original payment, $80. |
| [change-method](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5QWA3JZW5G7235B9DP6GQYB/dashboard/share/US_BIXBWNTQH0JCM15FXABXESKZ1Q0THDYI07TX7SM4O0XBQMZW1N836OE4FVT1FKWS?type=summary&agentView=true&fqdn=summary-page) | failed | 42s | Restart test exposed browser process loss; source unchanged. |
| [change-method](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5QWFSV5G8Q2Z9MYSMJP5NBR/dashboard/share/US_JNXR9J2PVNL76GJNG3M85LFNM380Q82A8C1HNHUYOT6GM65I6JQCKWHOT8M26ORA?type=summary&agentView=true&fqdn=summary-page) | failed | 48s | An ambiguous pre-edit assertion failed; source unchanged. |
| [change-method](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5QWN4HJ1RRN85XRF5C12JG1/dashboard/share/US_RYFIC6AVIB88GGL9NADAYUC1OUFH76AFTBYLBU8LWYJF353PK0HQ6ZO4D8HP3HX1?type=summary&agentView=true&fqdn=summary-page) | passed | 64s | Reconnected after server restart; selected QR, source reset to store credit and $75. |
| [validate-review](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5QWT5P03WEWRD75FZ93CD72/dashboard/share/US_0TYNCNGXBPKMGU8M0BHEOEUSO6X4FQP8Y4R8509FDQR8P3G3I96D9CC3TAXWCCR4?type=summary&agentView=true&fqdn=summary-page) | failed | 84s | Expected failure: store credit conflicts with original-payment intent. |
| [correct](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5QWZDTPWVS71A7V6PEV80ZR/dashboard/share/US_Y6M5LWZZHZ1SRBQ5BUYRONIJTNPGS0RQ9AO7KS8VYYTAXFBTKHH79NCVNEIN6ITK?type=summary&agentView=true&fqdn=summary-page) | passed | 60s | Changed source refund destination back to original payment. |
| [validate-review](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5QX183K2AN6MNSZRMW47BYX/dashboard/share/US_BKKG2NSVVFVDXBNN4L9HEO1X3A3FOULLUDIYY0MCV7D13CIYRBID3DVVQUOIL2BH?type=summary&agentView=true&fqdn=summary-page) | passed | 85s | Same review validator passed: source revision 6, shoes only, jacket kept, QR, original payment, $5 deduction, $75 expected refund. |

The conflicting draft could not be approved: the product API returned HTTP 409,
while the source contained zero submitted returns. After correction, the same
review validator passed and every stored constraint matched source revision 6.
No return has been submitted by this task.

Source writes were real browser actions. Controller comparisons use the merchant
module’s read-only draft view, which exposes the same state as
`GET /merchant/api/state`. The source grant, operation lookup, persistent
confirmation and synthetic QR remain the teammate’s integration work. Product
submission is disabled until the required source APIs exist.

## Saved review screen and coding-agent repair

A read-only Kane check of the saved product screen found a real frontend defect:
the approval button remained enabled while the backend refused unsupported
submission. The source stayed unchanged. The coding agent added the source
capability gate to both approval and submit controls, rebuilt, and reran Kane.

- [Failing UI check](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5QX74S9NXWWDWC7GVSTEYC6/dashboard/share/US_OBGTSJS6GA9L814VCF87PAQ27QMX16NW9CTZCPBCIKGDLHOVY5GHXQ4KNBH7XO31?type=summary&agentView=true&fqdn=summary-page): 38 seconds.
- [Passing UI check](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5QXC74TP6TYVQBZENFCC8GV/dashboard/share/US_L8CQNJJHI4NPNQO2BFMNVA5I8L5MDAFM6AR2T4D3Q35GG8NROD7WXCGZEMNAQNBN?type=summary&agentView=true&fqdn=summary-page): 43 seconds,
  nine completed steps, 15.73 credits.
- Preserved intent, QR drop-off, original payment, $5 deduction, $75 expected
  refund, matching constraints and both failed/passed review evidence were checked.
- Approval disabled, submission disabled and the unavailable message each passed
  a separate assertion. The rerun used the same expected behavior.
- The backend also returned HTTP 503 for unsupported approval, preserving the
  ready task with no approval and zero source returns.

The passing run's narrative summary mistakenly calls this a jacket return.
Its explicit intent assertion keeps the jacket; the proposal and source state
return only the shoes. Summary prose is not used as transaction evidence.

`npm run build` passed after the fix. This verifies the saved review UI, not a
complete user-driven submission or the future appointment workflow.

## Explicit source refresh

The merged rc.3 research found that repeated same-URL checks can read stale page
state. The product controller now instructs every source job to reload before
continuing. It still requires the extracted draft revision to match the source
before accepting review evidence.

[The runtime review rerun passed](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5QXH1148AM456M0F8CR102F/dashboard/share/US_IQ3OHKL6KTX0WPHB8MCUFM37MELVMAAYX4YB7G9CYVIOJD2VDUP8MD878F8XZ8W7?type=summary&agentView=true&fqdn=summary-page)
in 67.5 seconds using 14.69 credits. Kane reloaded the source and verified
ORD-1042, revision 6, shoes only, jacket excluded, the fit reason, QR drop-off,
original payment, a $5 deduction and a $75 expected refund. The controller
accepted the extracted fields and restored `ready`, without approval or a source
return. Build passed. This tests the refreshed review path; full submission and
the appointment flow remain unverified.

## Integrated two-source implementation — October 24, 2026

This section supersedes the earlier checkpoint's unfinished-submission statements.
Both sources now reach real, persistent synthetic confirmations through product-dispatched
Kane CLI **0.10.0-rc.3** jobs. The QA driver made product API requests; Kane performed
source-browser operations. This is not a claim that the driver clicked every frontend control.

### Product runtime results

| Workflow | Jobs | Outcome |
| --- | --- | --- |
| Partial return | discover, prepare, change-method, failed review, correct, passing review, submit, verify-confirmation | `RET-1001`, shoes only, jacket kept, printer-free, original payment, $5 deduction, $75 expected refund; status complete |
| Appointment | discover, prepare, submit, verify-confirmation | `CHG-1001`, booking `BOOK-2048`, Saturday Oct 31 at 11 AM Pacific, Maya Chen, $0 additional fee; one active booking; status complete |

The expected return failure was genuine: changing the source method reset its refund
destination to store credit. Kane's review assertion failed, the application blocked
approval, Kane restored original payment, and the same review validator passed. We did
not change the expected refund destination to make the test green. Missing extractions
on the stopped failed run are unknown, not fabricated successful observations.

Actual Kane durations: return discovery 40s, preparation 125s, method change 42s,
failed review 76s, correction 42s, passing review 74s, submission 54s, confirmation 94s.
Appointment: discovery 52s, preparation 108s, submission 66s, confirmation 59s. These
exclude human thinking time and are measurements, not latency guarantees.

- [All runtime observations and hosted run links](evidence/runtime/runtime-results.json)
- [Original/published pack hashes and exact metadata redactions](evidence/runtime/provenance.json)
- [Failed refund check](evidence/runtime/return-04-validate-review-failed-metadata-redacted.evidence)
- [Corrected passing check](evidence/runtime/return-06-validate-review-passed-metadata-redacted.evidence)
- [Return confirmation check](evidence/runtime/return-08-verify-confirmation-passed-metadata-redacted.evidence)
- [Appointment confirmation check](evidence/runtime/appointment-04-verify-confirmation-passed-metadata-redacted.evidence)

Published packs replace only account name/email metadata; the original local packs
remain untouched. Source data and screenshots are synthetic. The public manifest
records both hashes because redaction changes the archive bytes.

### Deterministic checks

Seven unit/contract tests passed. They cover unapproved and stale source commits,
revision conflicts, duplicate operation delivery, changed appointment availability,
persistent source records, wrong/missing typed observations, session-bound approval,
and reconciliation after a worker commits then throws a timeout. Controller tests
inject a worker double; these establish code contracts, not additional Kane runs.

The timeout case uses a real source commit under the injected worker and verifies that
recovery finds that same operation and leaves one record. The availability case revokes
a stale appointment grant and leaves the original booking until another valid commit.

### UI and local execution notes

Generated receipt and entry tests come from local assurance requirements. Criteria
remain derived/unapproved. The first return receipt check used a flat-string variables
file, emitted `unresolved_variables`, and opened Kane's playground. It is a harness
configuration failure, excluded from product pass/fail claims. The corrected run uses
`{"name":{"value":"actual URL","secret":false}}` and an explicit starting URL.

The initial runtime QA waiter also stopped on the intermediate `submitted_unverified`
state while its confirmation job was active. The app continued to complete correctly;
the waiter was corrected to require no active progress before treating a state as final.

Desktop (1366px) and narrow (390px) pages were inspected in an owned local Chrome
through CDP, with no horizontal document overflow. T3's preview returned an AppArmor
sandbox-unavailable error; the host security configuration was not changed. This
visual inspection is separate from Kane execution evidence.

The corrected generated return receipt test passed **7/7 steps in 247 seconds**,
including source inspection and reload with no new return submission.
[Hosted UI run](https://test-manager.lambdatest.com/projects/01M5QAE5ES2EK54TVKGWS6FHYC/test-cases/01M5QZ8W3JHWN5JGJJ93CZDFYF/dashboard/share/US_T2QR6Z65911Z38LINL09B8KLPZMATL3GM7SY915EINXOIF57PIC0TK8ZWLE7K2FF?type=summary&agentView=true&fqdn=summary-page).

Afterward the app was restarted with the final evidence-download route and interrupted-job
recovery logic. Both receipts retained their original IDs and completed status. Owner
sessions downloaded valid ZIP packs (HTTP 200); a different browser session received
HTTP 403. The final UI also opens the site picker at the root URL, restores explicit
task URLs with a loading state, and displays the appointment confirmation ID.

The generated appointment receipt check passed **3/3 steps in 198 seconds** after
server restart. It inspected the saved BOOK-2048 terms, followed its source confirmation,
checked one active booking, and reloaded the same completed receipt.
[Hosted appointment UI run](https://test-manager.lambdatest.com/projects/01M5QAE5ES2EK54TVKGWS6FHYC/test-cases/01M5QZQ0EX6HGXZEFF326ZT81W/dashboard/share/US_L6V17LMHJW3HVLLU1UPRY20RXV4NME2W57Y43OW9XWOJ0NOTLBVVZ31ZUQWPTLY6?type=summary&agentView=true&fqdn=summary-page).

Narrow-screen inspection found the home heading's sentences touching when its desktop
line break was hidden. The second sentence now becomes a block at that breakpoint.
This was a visual inspection fix, not a claimed Kane-discovered bug.

The generated website-entry check passed **6/6 steps in 185 seconds**. It inspected both sites and their task-specific controls, verified the synthetic scope, then started a real return task and checked that its active workspace removed the marketing introduction.
[Hosted entry UI run](https://test-manager.lambdatest.com/projects/01M5QAE5ES2EK54TVKGWS6FHYC/test-cases/01M5QZXCZ89Y0G8D4Q9GFSHAZA/dashboard/share/US_5UTWVU0JRUOY040DCVBVVT14U38S5PSAXQNKZXE39STDV3FQW53K42RY2NMVJRRD?type=summary&agentView=true&fqdn=summary-page).

[Structured UI results](evidence/runtime/ui-results.json) retain the earlier variable-configuration failure alongside the corrected runs.

Local assurance after these tests reported **33 of 34 derived criteria** covered
(96.43% under its risk-weighted rule). [Raw coverage report](evidence/runtime/coverage.json).
This is not trusted or human-approved coverage. The remaining `ac-20` gap is the
negative appointment approval path with missing mandatory browser evidence; the
one-test design budget omitted that scenario. Shared controller field rejection is
unit-tested on the return adapter, but no extra appointment browser run is invented
for this gap.

The repository-required `npm run verify:kane` also passed on the final interface. It checked branding, both supported task choices, sandbox disclosure and revealing the return start action. It did not submit a task. [Structured smoke result](evidence/runtime/smoke-result.json).

### Saved-test replay limitation

A subsequent replay passed the first receipt step but failed the compound assertion
in step 2. The [recorded failed assertion](evidence/runtime/return-replay-failed-assertion.json)
contains eight empty visual sub-results, with null expected/actual values; its aggregate
is false. The [captured page](evidence/screens/return-replay-failure.png) still shows the
expected receipt. Kane classified it as an automation/configuration issue and started
adaptive re-authoring. This supports a replay-recording limitation; it does not justify
weakening the business expectations or claiming a clean replay. Runtime source jobs
use explicit bounded `run` objectives and their separate deterministic checks, not this
receipt-test recording. The product's actual red/green refund conflict is separate.

The replay attempt ultimately passed 7/7 after adaptive re-authoring in 262 seconds. [Healed run](https://test-manager.lambdatest.com/projects/01M5QAE5ES2EK54TVKGWS6FHYC/test-cases/01M5QZ8W3JHWN5JGJJ93CZDFYF/dashboard/share/US_ME62QFHCVLH5XXG50SX7ADOGZM5J38SKI0QW39H9D1CQQBE6K9MTB0L9BHSKUNHE?type=summary&agentView=true&fqdn=summary-page). Its summary says seven replay decisions and zero author decisions, but the event sequence explicitly records a failed step and `test_md_adaptive_heal` with boundary 1 followed by re-authored steps. We therefore classify this as **passed after healing**, not seven clean cached replays. The original generated test source and business expectations were not edited.
