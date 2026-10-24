# Raising Kane: PoC review and build priorities

> **Implementation update — October 24, 2026:** The PoC has been merged into `main` and both sandbox workflows now reach verified, persistent confirmations. See [implemented scope and demo](implementation-and-demo.md) and [verification](verification.md) for current behavior and measured results. The analysis/build split below records the earlier checkpoint; statements that submission or the appointment flow are unfinished are historical.

Reviewed October 24, 2026. **Implementation baseline:** [`codex/raising-kane-poc` at `0ad30e5`](https://github.com/ybavgito/kanecli-hackathon/tree/0ad30e5fb845a2b724f8ae4fe2a9e8e163371bd5). The review used a separate checkout; it does not merge that implementation into `main`. Read this beside the [product brief](raising-kane-project-brief.md) and [UX research](ux-research-and-demo-direction.md).

## Verdict

Keep this direction and finish the transaction. The PoC already uses Kane inside the customer's task: it operates the source, detects a changed refund destination, repairs the draft and checks it again. That is substantially stronger than a chatbot with an end-of-build smoke test.

The largest gap is delivering the promised result. This revision deliberately stops at a verified proposal because the new merchant approval/operation contract is absent. The next investment should be a genuinely completed, reloadable return, followed by the required appointment workflow. A larger exploration graph, a redesign or more agent personalities would not close that gap.

The defensible product distinction is **preserving earlier choices through later website decisions, with evidence before approval and after completion**. Neither browser agents nor confirmation dialogs alone are novel. The existing one-page merchant is also simple enough that we have not established that Raising Kane is easier or faster for a shopper. The two-source demo can establish reuse; only actual user observation can establish usefulness.

## What was inspected and what counts as evidence

Read the complete controller, Kane worker, merchant, interpreter, frontend, scripts, environment example, acceptance context, build handoff and recorded verification notes. Installed dependencies and built the pinned PoC successfully. Used isolated synthetic task data for targeted reproductions; production accounts and teammate data were not changed.

Three evidence levels must stay separate:

- **Freshly reproduced:** results from this review, recorded in [the audit ledger](../kane-validation/poc-review-checks.json).
- **Previously recorded:** the PoC author's [verification notes and run links](https://github.com/ybavgito/kanecli-hackathon/blob/0ad30e5fb845a2b724f8ae4fe2a9e8e163371bd5/docs/raising-kane/verification.md), including red/green browser checks. Those reports were read; every historical cloud run was not independently replayed.
- **Code-backed or proposed:** behaviors established by implementation inspection, and improvements whose acceptance conditions still need execution. A proposed fix is not a passed test.

The [earlier 50-command feature investigation](../kane-validation/report.md) establishes selected rc.3 behaviors on separate fixtures. It does not substitute for product-level acceptance. Registry tags were rechecked: `rc` remains `0.10.0-rc.3`, `latest` remains `0.9.0` at this review.

## What actually runs

The current product is a local React interface, Node controller, Kane subprocess worker and fictional merchant under `/merchant` on the same origin. `npm run dev` starts the combined app. `npm run build` builds frontend assets; `npm run preview` is Vite's static preview and does **not** start the controller or merchant APIs. Do not use it as the complete demo server.

The user types a bounded request. The interpreter uses OpenAI structured output when configured; otherwise it explicitly labels a limited sample parser. A live OpenAI call was not established by this audit. The controller accepts only the sample shoes/order and known refund destinations. Its subsequent plan, checks and repair branch are ordinary application logic with natural-language Kane objectives, not a general autonomous planner.

Kane reads the order. The source adapter supplies the merchant's reasons, methods and draft fields. The user chooses a reason; Kane edits the real source form. Adding no-printer changes intent, launches a method-change job and then a separate review job. A refund conflict stops progression. The user can request repair; Kane changes the destination and invokes the same review function. The controller checks extracted order, destination and draft revision against its source snapshot before setting `ready`.

Tasks and source drafts are saved in JSON files. Task links and local storage restore the selected task after reload. A task-owned Chrome profile survives bounded jobs; jobs are serialized. Completion/reconciliation functions exist, but their source contract is not yet available. There is no completed return receipt, appointment adapter, website catalog or runtime Explore integration in this pinned revision.

The merchant currently has three sections on **one page**. Its repeated jobs do not demonstrate traversal of a real multi-page return journey. This is an implementation boundary, not a Kane navigation limitation.

## Keep these parts

| Existing strength | Why it matters | Evidence boundary |
| --- | --- | --- |
| Separate method change, red validation, correction and green validation | Shows what Kane changed in the workflow; preserves the failure instead of hiding it inside one green run | Prior runtime verification includes all four phases |
| Source refresh before each job and extracted revision matching | Addresses the stale-page behavior found in the rc.3 experiments | Latest PoC commit and prior refreshed-review run |
| Process exit **and** passing terminal event required | A successfully launched process cannot masquerade as success | Worker implementation |
| Source/intent comparison in application code | Corroborates browser output; checking does not depend only on model prose | Controller implementation, with completeness gaps below |
| Dedicated owned Chrome profile and serialized execution | Avoids naive parallel access to one draft or a shared browser port | Code plus prior recovery observations; not general authenticated-site proof |
| Approval disabled in UI and backend while source contract is missing | Correctly fails closed | Previously recorded failing UI check, coding fix and green rerun; fresh capability check |
| Persisted task, failed and passed evidence entries, resumable task URL | Preserves history and separates task state from a chat transcript | Code and fresh isolated observations |
| Sandbox and sample-parser disclosures | Accurately limits the claim | Frontend and interpreter |

Do not replace these with a single large “do the return” objective. Do not weaken the validator merely to create a smoother demo.

## Priority 0: deliver the outcome and preserve its exact terms

### 1. Complete the merchant contract, not just the button

**Verified gap:** the merchant exposes the legacy synchronous approval callback and attempt lookup, but not `registerGrant`, `revokeGrant`, `getOperation`, persistent confirmation routes or the QR artifact route. The controller requires `registerGrant` and `getOperation` before approval. `/api/status` consequently returns `sourceSubmissionReady: false`.

**Existing mitigation:** unsupported approval/submission is disabled. This is a correct limitation, not an accidental broken button. The merchant already has some duplicate protection by attempt and task; it would be wrong to say it has no idempotency at all. It does not yet implement the agreed source-owned grant/digest contract.

**Smallest useful change:** implement the [pinned teammate contract](https://github.com/ybavgito/kanecli-hackathon/blob/0ad30e5fb845a2b724f8ae4fe2a9e8e163371bd5/docs/raising-kane/two-person-build.md), reconcile the controller's proposal canonicalization with it, and provide the persistent confirmation. Keep operation identity across timeout/retry. Use one transaction or the explicitly documented single-process atomic persistence boundary.

**Acceptance:** unapproved and stale drafts cannot commit; the same approved operation returns the same record; a changed digest is rejected; an accepted-but-timed-out operation is found without resubmission; Kane reads the confirmation; reloading Raising Kane restores the verified receipt. A source record alone must not set `complete`.

### 2. Make pre-approval business comparisons complete

**Code-backed gap:** `refresh()` makes six comparison rows: order/account, selected shoe ID, jacket exclusion, reason, destination and method. `validationObjective()` also asks Kane to check quantity and money, but `acceptValidation()` independently normalizes only three extracted fields: order ID, destination and draft revision. It does not deterministically compare extracted quantity, currency, fee or expected refund before recording the proposal as validated.

**Existing mitigation:** Kane is explicitly asked to check several of those facts, and the source revision and proposal are bound. This is **not evidence that the current app approved a wrong amount**, nor that every passing Kane run is unreliable. It is an incomplete independent check, especially relevant because prior experiments found malformed generated assertions.

**Smallest useful change:** extract the mandatory business facts as typed fields; compare source, observation and approved intent in code. For the known fixture, verify one shoe, quantity one, USD, subtotal 8000 cents and the applicable deduction/total. Bind accepted costs as explicit reviewed terms. For future sources, derive prices and fees from versioned observations and user constraints, not universal constants. Missing or unparsable required values remain unknown.

**Acceptance:** retaining a plausible passing CLI result while removing or changing one mandatory extracted field must not enable approval. A legitimate matching draft still passes. Classify a malformed check separately from a real source mismatch.

## Priority 1: make the product recoverable and the evidence accurate

### 3. Restore discovery prerequisites after failure

The initial browser-launch failure path was exercised in isolation. Despite failed discovery, `browser()` refreshes the merchant adapter snapshot, so the UI can show reason options and allow preparation. This is **not a total UI dead end**: an early inspection suggested that, but runtime observation disproved it.

The actual issue is narrower. After restoring Chrome and submitting the existing task’s reason choice, a real Kane preparation run passed in 127.1 seconds and the controller reached `ready`, still without `baseline`. The baseline jacket record is set only after successful discovery. Choosing a reason after discovery failure dispatches `prepare()` without re-establishing that baseline. Later confirmation verification requires `task.baseline.jacket`. Recovery must restore prerequisites, not merely make the next button usable.

Add an explicit “Retry reading the order” action, and enforce discovery/baseline readiness in the controller before preparation. Preserve the user's request and chosen reason while recovering. Do not invent a historical baseline from a later mutated source.

**Acceptance:** fail discovery, restore the browser, resume the same task through the user interface, obtain a verified baseline, then complete it. Also verify that failures after preparation retain the valid baseline and do not restart the whole journey unnecessarily. See the ledger for how far the fresh reproduction reached; final confirmation remains blocked by the missing source contract.

### 4. Separate inspection from taking over the source

**Confirmed design/code issue:** “Show source website” embeds the normal editable merchant form. The form writes to the source directly. The product's recurring task GET returns the saved controller snapshot; it does not refresh the source. Thus an external edit can leave displayed matches and the proposal stale until another controller action refreshes them.

**Fresh double-check:** an isolated source edit moved the draft from revision 4/original payment to revision 5/store credit while the saved task stayed `ready` with all six checks matching revision 4. A real Kane UI inspection passed, confirming “All matched” alongside store credit in the source iframe and disabled approval/submission. A subsequent approval API request returned HTTP 409, cleared validation and left zero returns.

**Existing mitigation:** approval refreshes and compares the source again, and submission checks the current proposal. Therefore stale display is not proof of a commit bypass. The main current risks are misleading evidence and human/agent edits interleaving before approval.

Use a timestamped screenshot/read-only source view for inspection. If interactive takeover is retained, pause agent ownership, label the handoff, and require a new source check before returning to verified state. Merely disabling the submit button inside an otherwise editable iframe does not address concurrent draft edits. Do not poll expensive Kane jobs just to keep an inspection panel fresh.

**Acceptance:** change the source through takeover while a proposal is displayed; it becomes “Needs recheck,” and old evidence remains available as history rather than being relabeled current. A later matching validation restores eligibility. No simultaneous source writers operate on the same task.

### 5. Support a genuine change of mind

The method API accepts QR/no-printer, but not restoring `print_label`/`noPrinter: false`; the printed-label choice is a noninteractive `<div>`. Refund destination has no post-start edit control. The initial request supports different destinations, so the limitation is specifically revising an existing task.

Implement reversible method and destination choices with dependency invalidation. Keep unaffected reason and item selections. This enables a useful live variation: printer-free plus store credit should not falsely trigger the original-payment conflict. Choosing original payment should detect the source reset. The validator must follow user intent, not an expectation that every demo goes red.

**Acceptance:** QR → printed label changes the method and fee correctly without a new task; an original-payment/store-credit revision changes the expected comparison; obsolete approval cannot survive. Do not automatically change a user's accepted fee or destination just to manufacture a conflict.

### 6. Show what each source actually established

`task.merchant` and the six check rows come from the merchant adapter, not exclusively from Kane extraction. Failed browser discovery can still populate them. This is useful corroboration, but labels such as “Waiting for Kane to read the merchant’s reasons” are too broad for that implementation.

Retain distinct observation provenance: **source adapter**, **Kane browser observation**, **deterministic comparison**. Render expected value, observed value, revision, time and result for material requirements. Persist evidence by attempt, with a directly inspectable red/green pair. The worker records useful fields, but the frontend mostly shows phase summaries; `task.progress.lastStep` and elapsed time are not surfaced.

Render concise event-backed progress. Distinguish “Source conflict,” “Browser unavailable,” and “Evidence incomplete.” The current fixed four-stage bar may remain a stage indicator; it must not imply a measured percentage of runtime. Do not expose raw model summaries as authoritative transaction facts—the existing verification notes already document an incorrect jacket-return summary on an otherwise passing run.

**Acceptance:** a viewer can identify the unchanged expectation, the actual wrong source value, the correction and the new passing evidence without reading terminal logs. Old results cannot look current after an edit. Operational failure cannot look like a detected merchant bug.

### 7. Put the current decision above the fold

The actual [1920×1080 captured viewport](../kane-validation/evidence/poc-stale-display.jpg) shows that the marketing hero remains above the active task and pushes the decision controls below the fold. This is corroborated by `src/App.jsx`: the intro renders unconditionally. The screenshot documents layout; the conflicting refund values lower on the page are established by the separate extracted observations in the ledger, not by this image alone.

Collapse the marketing introduction after a task starts. Keep the brand, task title, short progress message and current decision visible; expand source/evidence on demand. Preserve the existing visual design rather than rebuilding it. This is a targeted space-allocation improvement, not a claim of measured usability gains.

**Acceptance:** on the demo laptop viewport, the active decision and relevant preserved choices are visible without scrolling past the landing pitch. Keyboard order and the receipt remain usable. Do not shrink text merely to fit more panels.

### 8. Keep runtime browser files out of the development watcher

During the fresh preparation run, Vite emitted three `page reload` messages for HTML files created inside `data/chrome-tasks/...`, including Chrome extension and speech-engine files. The app creates Vite with default watching while the worker stores browser profiles under the project root. The installed watcher defaults do not exclude `data/`.

Exclude runtime profile/data directories from watching, or store profiles outside the watched source tree. [Vite documents the watcher configuration](https://vite.dev/config/server-options#server-watch). This is a concrete demo-stability improvement. The observation proves reload events were emitted, not that they interrupted this particular user session; the merchant page is served separately and does not use the Vite client.

**Acceptance:** starting a fresh task browser produces no app reload for its profile files; deliberate source-code edits still update the development UI. Repeat this check on the demo host because Chrome's first-run file activity varies.

## Priority 1: make the demo fit reality

The PoC's own recorded times are more relevant than tiny feature-fixture timings. A representative sum of reported phases is **45 + 106 + 64 + 84 + 60 + 67.5 = 426.5 seconds**, or about **7.1 minutes before submission/receipt**. These are different recorded runs, not one measured uninterrupted journey. The change/red/correction/green segment alone sums to about **4.6 minutes**. A fresh two-site journey in four minutes is not supported by this evidence.

First measure a complete successful product journey. Then consider parameterized saved journeys for stable navigation and field actions, preserving explicit reload, extraction and exact checks. Replay performance must be measured on this app. Avoid an extra full Explore cycle at startup, one job per hyperlink, redundant full rediscovery and concurrent jobs on the same draft.

For the 2–4 minute narrated video, lead with real red/green evidence and label compressed waits. For a short live slot, start from a disclosed prepared proposal, let the judge change a supported constraint, and run the decisive checks live. Both complete workflows must still work at the table. A prepared source state is acceptable evidence of preparation; an old run must never be presented as a fresh result.

## Priority 2: broaden the product after the return closes

Keep the required second source: reschedule a service appointment while preserving technician, service, address and fee constraint. The old booking survives until a versioned atomic update. Choose from actual observed alternatives rather than always selecting the fixture's 11 AM slot.

Introduce a small adapter interface only where the two real implementations differ: supported task manifest, source observation, bounded actions, requirement comparison, approved proposal and confirmation. Avoid building a universal workflow language before the second adapter reveals the needed abstractions.

Add website-first entry with supported tasks. Keep optional text for the person's preferences. A new URL gets a scoped preview, not enabled transactional support. For meaningful subpage behavior, use ordinary source pages such as order → return options → review, with checkpoints at new decisions or commitments. Do not add fake complexity merely to make the simplified UI look good.

## Kane feature fit: use more only when it adds evidence

| Capability | Best use here | Current PoC status |
| --- | --- | --- |
| `run --agent` + structured extraction | Runtime source observation, actions, review and confirmation | Core runtime is implemented; confirmation cannot yet finish |
| Explicit refresh, source version, deterministic comparisons | Prevent stale observations from authorizing changed terms | Refresh/version checks exist; fact comparison needs expansion |
| Saved `_test.md` replay | Stable source phases and product regression journeys | Landing smoke is saved; runtime phases still use `run` |
| Explore | Prepare a reviewed capability map for each integration | Earlier research fixture only; not the PoC runtime |
| Assurance and coverage | Generate tests from actual supported requirements | Separate research result; no full product coverage claim |
| Network/API corroboration | Match commit operation and authoritative result | Merchant adapter is used; planned submit objective requests response capture, unexecuted |
| Evidence packs | Inspect red/green attempts and attach submission evidence | Worker retains paths/share links; ship a reviewed pack/index, not just links |
| Analyzer | Optional focused current-page check | Not needed to finish the MVP; never treat exit zero as all conditions true |
| Batch/mobile | Separate supported scenarios/devices when needed | No demonstrated need in this two-web-source slice |

Pin validator jobs to `--assertion-failure-mode stop` instead of inheriting a mutable profile setting. The audited worker does not pass it explicitly. Our current profile is already `stop`, so this is a portability hardening change, not a reproduction of `continue` in this PoC. Stopping is not an authorization boundary or rollback.

The strongest range evidence is one useful integration Explore artifact, requirement-linked saved journeys, runtime Kane operation and a genuine evidence-backed decision. Enabling every command family would add little value.

## Research implications and limits

The existing [research synthesis](ux-research-and-demo-direction.md) remains applicable. This review rechecked primary guidance on [editing review answers](https://design-system.service.gov.uk/patterns/check-answers/), [confirmation pages](https://design-system.service.gov.uk/patterns/confirmation-pages/) and [AI failure recovery](https://pair.withgoogle.com/guidebook-v2/chapter/errors-failing/). Those sources support editable decisions, useful confirmation and paths forward after failure. They do not validate our particular interface or establish market demand.

The small Magentic-UI study cited in the synthesis supports investigating latency, verbosity and control; it does not prove that all users want automatic correction or that our product is differentiated. Preserve a clearly explained correction within already authorized reversible preparation. Ask again when the tradeoff changes—fee, destination, identity or irreversible result—not for routine navigation.

Before freezing the demo, ask one unfamiliar teammate to finish a supported task without narration. Observe whether they understand the pending fee, notice the conflict, recover after interruption and find the next step. Record observations, not invented usability scores. Compare the task effort with the native source, since a second dashboard can make a simple return harder.

## Build order and honest presentation

1. Complete source grants, operation reconciliation, persistent confirmation and verified receipt.
2. Close pre-approval fact comparison and failed-discovery recovery gaps.
3. Resolve source takeover, allow reversible choices, and expose concise comparison evidence/progress.
4. Time the complete return; optimize stable phases only where measured waiting warrants it.
5. Integrate and verify the required appointment workflow and supported-site entry.
6. Package real product evidence, then publish the required demo video and other GTM assets with accurate claims.

Do not claim arbitrary websites, safe autonomous purchases, real refunds, full production isolation, complete two-site support or accessibility effectiveness from this PoC. A local frontend build is not a deployable hosted browser-worker service. The demo should say exactly which sandboxes work, which state was prepared, which checks ran live and what result was actually saved.


## Pinned implementation references

These links refer to the reviewed commit, not a moving branch:

- [Controller: refresh, validation, recovery, approval and submission](https://github.com/ybavgito/kanecli-hackathon/blob/0ad30e5fb845a2b724f8ae4fe2a9e8e163371bd5/server/controller.mjs): `refresh` at line 69; `acceptValidation` at 184; confirmation baseline at 301; discovery baseline at 380; choices at 394; approval at 453.
- [Kane worker](https://github.com/ybavgito/kanecli-hackathon/blob/0ad30e5fb845a2b724f8ae4fe2a9e8e163371bd5/server/kane-worker.mjs): process arguments at 212; result normalization at 306–358; owned browser lifecycle throughout.
- [Product UI](https://github.com/ybavgito/kanecli-hackathon/blob/0ad30e5fb845a2b724f8ae4fe2a9e8e163371bd5/src/App.jsx): polling at 86; hero at 178; method controls at 219; approval controls at 240; editable source iframe at 243.
- [Merchant implementation](https://github.com/ybavgito/kanecli-hackathon/blob/0ad30e5fb845a2b724f8ae4fe2a9e8e163371bd5/server/merchant.mjs): draft changes at 127; source UI handlers at 224; HTTP routes at 297; exported capabilities at 367.
- [Combined app server](https://github.com/ybavgito/kanecli-hackathon/blob/0ad30e5fb845a2b724f8ae4fe2a9e8e163371bd5/server/index.mjs) and [package scripts](https://github.com/ybavgito/kanecli-hackathon/blob/0ad30e5fb845a2b724f8ae4fe2a9e8e163371bd5/package.json) establish the local hosting boundary.

## Implemented follow-up in main

The pinned observations above remain intact. This follow-up maps their proposed fixes
to the actual implementation; see [verification](verification.md) for scope and runs.

| Audit priority | Implemented change | Evidence boundary |
| --- | --- | --- |
| Finish the transaction | Source-owned grants, atomic commit, operation lookup, persistent confirmations and QR | Real Kane return and appointment reached complete; contract tests cover retries |
| Compare every material term | Typed mandatory fields plus independent source comparisons, exact canonical digest | Wrong amount/missing currency rejected in controller tests; real review extracts all fields |
| Recover discovery | Preparation first restores failed discovery and original baseline | Injected-worker controller test |
| Separate inspection | Read-only source iframe/link on a distinct source origin | UI inspection and generated receipt tests; no generic editable takeover claim |
| Change one's mind | Reversible method/destination and technician/fee controls; invalidate approval | Implemented controls, real method-change run; not every combination browser-tested |
| Accurate evidence/progress | Source/browser provenance, expected/observed values, elapsed phase, retained failed runs and pack downloads | Real red/green trail; generated receipt inspection; owner-download HTTP checks |
| Current decision first | No active-task marketing hero; completed preferences collapse | Actual desktop/mobile screenshots; generated entry check recorded separately |
| Ignore runtime artifacts | Vite excludes data and Kane output folders | Runtime/browser profiles no longer cause source HTML reloads during observed runs |
| Second source | Distinct appointment adapter and source origin, constraint-sensitive options, preserved old booking | Real complete appointment plus deterministic slot-loss contract test |
| Assertion behavior | Worker explicitly passes stop-on-assertion-failure | Failed refund review stops; no completion from its missing fields |
| Requirements and packs | Local assurance-generated tests, public metadata-redacted packs and hash provenance | Criteria remain unapproved; no full trusted-coverage claim |

Generic URL discovery and personal-account handoff remain separate from this supported
transaction implementation. The new PoC branch extension and its unverified edges are
recorded in the [implementation guide](implementation-and-demo.md#parallel-branch-discovered-during-this-build).
