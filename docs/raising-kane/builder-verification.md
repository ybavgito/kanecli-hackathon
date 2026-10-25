# Generated builder verification — October 24, 2026

This report concerns the Explore-driven builder, not only the earlier prebuilt task UI.
All sources and transactions below are explicitly synthetic. Kane CLI was `0.10.0-rc.3`;
the runtime coding model was `gpt-6.1-sol` through the Responses API. No mocked model
output or mocked browser worker was used for the runtime results.

## End-to-end results

| Source | Input | Generated candidate | Browser result | Independent source result |
| --- | --- | --- | --- | --- |
| Linden Home | URL plus a request for Saturday morning, Maya and no extra fee | Revision 1 | All seven assurance-designed steps passed | CHG-1001; October 31, 2026 at 11 AM Pacific; Maya Chen; $0; one active booking |
| Northstar Outfitters (earlier v1 contract) | URL with blank intent; explicit task start in its generated overview | Revision 3 | All six assurance-designed steps passed | RET-1001; QR drop-off; $75 original-payment refund pending; jacket kept; final confirmation verified |

The app used actual Explore maps, detailed findings, reached-state screenshots and two
bounded source-branch observations to generate React/CSS. Explore itself reached limited
read-only states on these autosaving forms; the branch observations establish the
conditional behavior. Generated decisions cite those observations. Each candidate was
compiled and checked in a separate preview browser; source execution used its own browser
and fresh synthetic task. Promotion requires both the Kane verdict and the exact saved
source outcome, with matching candidate/contract hashes.

The build workspace's seven-step evidence inspection also passed: source captures,
transitions, generated decisions, retained candidate results and capture times remained
available. Requirements and the designed English journey can be inspected from a completed
candidate. Initial URL presets and optional blank intent passed a separate browser check.

## Navigable store and optional intent (current v2 contract)

Northstar now has linked product, category, order, delivery, help, returns and warranty
pages. Size availability and return eligibility differ by product/order. This gives
URL-only and task-focused exploration meaningfully different inputs.

The URL-only build `a292d00c-7281-4b24-bf7f-141123d3a3fa` passed all four browser
steps. Its generated Shop / My orders / Help views are read-only; independent comparison
confirmed the source draft and return list were unchanged. Explore recorded **eight screen
states and ten flow records**, including two home states, not eight unique URLs or an
exhaustive crawl. The host offers a separate focused-build action; that generation action
was deliberately not triggered during the read-only acceptance run.

The focused-store acceptance result is recorded in the selected build evidence. Its
Explore run observed four states and four flow records; separate bounded source jobs
reached the actual return branches. Do not attribute all branch discoveries to Explore.

**Demo now** imports the exact verified compiled artifact with its captured evidence and
hashes. No previous source task, approval or receipt is reused. Fresh sessions run Kane
against fresh synthetic records. The UI labels recorded generation explicitly. The old
v1 return artifact remains available alongside the new modes for reproducibility.

## What failed, and what changed

- The synthetic merchant changes the refund destination to store credit when QR drop-off
  is selected. Kane's source validation failed on that state. The controller independently
  found the same mismatch and blocked approval. Restoring original payment was followed by
  a green source check. This is the real negative business case.
- Northstar candidate 1's outer UI check failed despite the conflict values being present.
  The evidence identified a brittle exact-label comparison (`Original payment` versus
  `Original payment method`) and difficulty recognizing the conflict layout. The model
  changed the component and CSS using the failed preview, and the verifier was corrected
  to the actual full label. This is **not** presented as a newly discovered merchant bug.
- Candidate 2 was interrupted to apply that correction and the source-job speed changes.
  It is labeled interrupted, not failed or passed. Candidate 3 reused captured source
  evidence and used a new synthetic verification task.
- The first recorded-demo inspection moved off the build page prematurely, then started a source task despite the read-only instruction. Its failure is retained. The shared assurance wrapper also added an irrelevant receipt expectation to read-only checks; that wording was removed. Transaction objectives still explicitly require reload persistence.
- The first new focused-store run exposed a source-worker misstep: while changing the return method, Kane also restored the destination despite being told not to. The combined objective had asked it to assert the desired final destination. That job now extracts actual terms without an instruction to make them pass; the independent controller compares them and leaves correction as an explicit user action. The interrupted candidate and original action trace are retained. This is not claimed as a successful negative case.
- Earlier setup attempts exposed screenshot decoding, AST filtering and React development
  runtime resolution problems. Those were repaired and covered by targeted checks. They
  are implementation problems, not fabricated Kane browser failures.

## Replay and latency

The implementation now keeps a per-build verification workspace keyed by unchanged
requirements. It preserves the assurance-designed test and recordings, and uses a stable
sandbox-only URL bound to the candidate's fresh test session. Every candidate retains a
separate evidence snapshot. Changed requirements get a different workspace. Recorded failures remain visible. Following the replay probes, the implementation now
allows Kane to refresh stale recordings, while checking the English test digest before
and after execution. Altered expectations cannot be accepted.

The evidence-page test actually replayed its first three steps, then stopped on a stale
layout-dependent assertion. An explicitly separate run with Kane's default healing
refreshed the recording and passed all seven steps. Its requirements were unchanged.
This does not establish a speedup for an unchanged full transaction.

A separate two-step integration probe exercises the new cache against an isolated copy
of a completed appointment receipt. The first run authored and passed both steps. The
next replay failed to recognize fields buried below the generated form. The trusted host
was improved to show the result, request and terms together, with technical details
collapsed. After the receipt layout and timezone wording were clarified, the unchanged test passed
with recording recovery. The next run passed both steps using pure replay: **35 seconds**,
**two replayed steps and zero authored steps**, versus **155 seconds** for first authoring.
The English test digest was unchanged. This is a measured improvement for that read-only
check, not a whole-product speed claim. The app counts observed replay starts rather
than treating all planned replay decisions as executed steps.

The first complete Linden build took about **14 minutes**. Initial discovery, generation
and first-time browser authoring remain expensive. Repairs can skip discovery and test
design; changing/restoring a return method now combines the action and validation into
one browser job each. Source transactions still use fresh bounded objectives. Do not
promise instantaneous first builds or claim that all source operations use replay.

## Evidence and reproducibility

- [Selected build evidence](evidence/builder/summary.json): build/candidate metadata,
  generated source, observation images, requirements, designed tests and result events.
- [Pack provenance](evidence/builder/packs/provenance.json): authentic Kane evidence packs
  with only account-name/email YAML metadata redacted, original and published SHA-256
  digests, and an explicit list of modified entries. Outcomes and images are unchanged.
- [Implementation and run instructions](builder-implementation.md).
- [Branch comparison](api-and-branch-review.md): why main remains the shipping base and
  which compatible PoC improvements were adapted.

Local data includes raw private packs and persisted task/build state. The public files
are reviewed derivatives, not a replacement for that state. Build URLs contain local
ports; another machine must run its own configured source servers and user sessions.

## Checks and limits

29 unit checks and the production build pass. Unit checks include source approval,
stale revisions, duplicate reconciliation, exact outcome matching, generated-code
boundaries, replay workspace identity, replay reporting and readable escaped receipts.
Worker doubles in unit tests are not counted as browser evidence.

This is a complete bounded implementation for the two configured synthetic source
workflows with both transaction acceptance gates passed. It is not arbitrary-website generation,
production merchant access, an exhaustive crawl, or accessibility certification. The
optional direct Explore write-up API is implemented but was not exercised live without
its separate environment credentials. No cross-application performance guarantee is made.
