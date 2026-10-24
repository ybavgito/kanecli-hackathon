# Raising Kane: tested tasks, a simpler interface, verified outcomes

Decision memo, October 24, 2026. This refines the product brief; it does not claim the full proposed product is implemented. The shared POC branch now contains a partial return implementation; see its [verification status](verification.md). The separate [rc.3 experiments](../kane-validation/report.md) establish specific CLI behaviors on synthetic fixtures.

## Recommendation

**Let people start with a website, then choose from a small set of tested tasks. Keep exact-request verification inside every task.**

The person need not arrive with a carefully written prompt. They connect a supported website, see what Raising Kane can help them do, and select a task. The app turns that task into plain decisions backed by the actual source website. They can change their mind, inspect alternatives, approve the final proposal, and return to a durable receipt.

The promise is: **“Use a complicated website through a simpler view, with your choices checked before anything is finalized.”**

This is more complete than a chat box that performs one instruction. Its useful persistent objects are connected sites, a tested task catalog, unfinished tasks, preserved preferences and completed receipts. The product can grow through supported integrations without pretending every URL immediately becomes a safe, fully functional replacement website.

## Should we test before showing the simplified interface?

Yes, with two distinct meanings of verification:

| Check | Question it answers | When |
| --- | --- | --- |
| Integration rehearsal | Can this version of this site support this bounded workflow, including known adverse branches? | Before making a task available |
| Current-session discovery | Which records and options are available to this person now? | On connection and task entry |
| Exact-draft verification | Does the refreshed source review match this person's current choices? | On “Check my choices” and before submission |
| Result verification | Did the approved change actually persist, with the expected identifier and fields? | After submission and reconciliation |

A previously passing test never means the current booking is available or today's refund is correct. Conversely, running every scenario for every person would waste time and could change their account. Rehearse scenarios using test accounts and resettable sandbox data. In a real account, inspect only authorized paths and prepare reversible drafts where the integration explicitly supports that behavior.

Show the app shell immediately. Show each task with an honest status: **Available**, **Checking**, **Needs sign-in**, **Needs recheck**, or **Not supported yet**. Do not make the person watch an entire test suite before they can read the page. An unknown site's discovered actions can be presented as observations, but they must not become enabled transactional capabilities merely because Explore found buttons.

## Website-first experience

1. **Connect a site.** Select a prepared supported integration or paste its URL. Display its identity and the account being used. For the demo, label both sites as sandboxes and disclose prepared sessions.
2. **See useful tasks.** The merchant offers “Return an item” and a small read-only “View return status” path. The service portal offers “Change an appointment” and “View appointment details.” Cards come from a reviewed capability manifest linked to executed checks.
3. **Choose the object.** Select the order/item or appointment Kane actually observed. Ambiguous matches require a choice.
4. **Make plain decisions.** Show one meaningful decision at a time. Preserve the selected records and constraints in a visible summary.
5. **Explore a consequence.** “What if I can't print?” or “What if I need Saturday morning?” invokes a bounded source check. Show observed options, including those that fail a constraint and why.
6. **Review and approve.** Refresh the actual draft; compare exact values; block conflicts. Present the current amount, fee, destination or slot before approval.
7. **Finish with evidence.** Verify the resulting record, save the receipt, and state the next physical action. Reloading the app restores the task without resubmitting it.

Changing the website URL selects a different capability manifest and a separate source session. It does not carry over permissions, approved drafts, private records or source-specific terminology. A shared user preference can be suggested again, but the person must confirm anything material to the new task.

## The two strongest demo workflows

### 1. Partial return: preserve intent through a conditional branch

User goal: return the red shoes, keep the jacket, refund the original payment method. Later: “I don't have a printer.”

**The source website:** a believable merchant account with order history, shipment groups, item-level eligibility, return reasons, method selection, a refund-destination choice, policy details and a final review. Use normal readable controls. The difficulty comes from dispersed information and dependencies, not deliberately unreadable text or a wall of fake buttons.

**The simpler interface:** item pictures/names and quantities; a persistent “Keep the jacket” exclusion; reasons from the merchant; clear method choices such as “Drop off with QR — no printer — $5 deducted”; a final “$75 to your original payment method” proposal. Keep meaningful restrictions and the next action visible.

**The live complication:** the sandbox deliberately changes the destination to store credit when the draft switches to the QR method. Label this as a seeded source defect. Kane refreshes the review and a separate exact-destination validator fails. The app shows the mismatch and leaves submission disabled. A separate correction job restores the destination; the unchanged validator passes; the person approves; the source atomically commits; Kane checks the saved return. The receipt says “Return requested; refund pending.”

**Why it is the hero:** an apparently helpful action can violate an earlier preference. The failure is concrete, understandable and consequential. Kane's browser work both causes the useful draft change and independently checks its result.

### 2. Appointment change: choose among valid-looking options

User goal: move Friday's repair to Saturday morning, keeping Maya, the same service/address and no additional fee.

**The source website:** account navigation, existing booking details, a multi-day calendar, a technician filter, time slots, a fee quote and a final reschedule review. Do not require the user to cancel their old booking first.

**The simpler interface:** “Keep Maya · Saturday morning · No extra fee,” followed by real observed options. For the fixture: 9 AM has another technician; 10 AM has Maya but costs $25; 11 AM has Maya at no extra charge. Explain the rejected options plainly; select the valid one only after the source supports it.

**The live complication:** change a constraint or use the supported “11 AM just became unavailable” fixture event. The app invalidates the old proposal, checks again and asks for a different choice if nothing matches. It preserves the Friday booking until an approved atomic change succeeds. The receipt includes the new date, source timezone, technician, address, fee and booking ID; verification confirms exactly one active booking for the task.

**Why it complements returns:** this is a temporal, availability-sensitive decision with a preservation requirement. It demonstrates that the same app engine handles another site's workflow rather than presenting the same refund form with a different logo.

For the main timed demo, show the return defect and one successful appointment constraint comparison. Keep the slot-race variant available for judges; adding every adverse branch to the stage narrative would obscure the product.

## What the interface should look like

The main view is a calm workspace with a small connected-site switcher, a task title, the current decision and a compact “Your choices” summary. Use ordinary controls: item selectors, dates, option rows and an explicit approval button. Chat is optional assistance, not the only way to use the product.

Default to a single current decision rather than exposing the full workflow graph. A “See original” panel reveals the latest source screenshot, what was observed and when. A separate judge/developer view may show actual Kane jobs and evidence; users should not have to read terminal output.

During work, display truthful phases: “Reading available methods,” “Refreshing the review,” “Checking your refund choice,” or “Confirming the saved request.” A failed check should explain the exact conflict and the next available action, not merely turn a badge red. No progress percentage unless it reflects a real finite step count.

Use fixed, reviewed UI components bound to discovered data. OpenAI can interpret intent, normalize terminology and choose the next supported step. Generating arbitrary frontend code from every website is unnecessary for this MVP and makes the interface harder to trust.

## What is prepared, and what is live?

**Prepared before the demo:** both working source sites; resettable synthetic records; an Explore map per site; reviewed task definitions; the condition matrix; generated acceptance tests and actual runs; saved validators; source-side approval/idempotency contracts; evidence from rehearsals.

**Live for the person:** source/account identification; current records and available choices; branch selection; refreshed review; exact constraint checks; correction; approval; submission; confirmation and receipt. Every result must use current task/source values, not a predetermined success object.

The catalog stores workflow/version, source scope, prerequisites, supported input limits, expected outcomes, prohibited transitions, rehearsal evidence and last-checked time. Runtime state separately stores account, record IDs, intent revision, source draft version, observations with timestamps, approval and operation ID. Never collapse catalog confidence and transaction approval into one “verified” boolean.

An integration can remain available for reading while a broken submission path is marked “Needs recheck.” A new source version or changed flow should invalidate the affected rehearsals; it need not disable every unrelated task.

## Rehearsal coverage to prioritize

| Return scenarios | Appointment scenarios |
| --- | --- |
| One item returned; excluded item unchanged | Valid slot meets date, technician and fee constraints |
| Printed label versus no-printer branch | Different technician rejected |
| Unexpected destination or fee blocked | Unexpected additional charge rejected |
| Expired/ineligible item explained | No matching slot leaves original booking intact |
| Draft changes after approval rejected by source | Slot changes after review invalidate approval |
| Submission timeout reconciles one operation | One active booking after a successful update |
| Receipt survives frontend reload | Receipt survives frontend reload |

Generate acceptance tests from the reviewed requirements using assurance. Keep deliberate mutations labeled. Use a separate source-state oracle for exact amounts, versions, uniqueness and committed operations. Browser screenshots cannot establish database atomicity.

Do not run every possible combination. Cover critical boundaries and interacting constraints first. Run independent resettable scenarios in a suite; serialize jobs sharing one person's browser or draft.

## Demo narrative

Lead with the real red/green Kane evidence, then explain the shopper problem. Show the ordinary merchant portal briefly, connect it and reveal the tested task catalog. Complete the return through the simple interface. Add “no printer,” reveal the actual failure and correction, then approve and show the durable receipt. Switch to the service site, reveal its different task menu and demonstrate the three-slot comparison and verified update.

End by reloading the app and opening a saved receipt. That makes the product feel complete: a useful task, preserved choices, an accountable result and something the person can return to.

Record a 2–4 minute narrated video with honestly labeled time compression if needed. Our feature checks include runs lasting tens of seconds; a four-minute fully live end-to-end demo has not been measured. Table demos can show the longer live path. Reserve time for the submission assets; the rubric assigns GTM a full quarter of the score.

## Honest differentiation and scope

“AI simplifies websites” is too broad to be a defensible novelty claim. Our sharper demonstration is a simpler task view whose availability is supported by rehearsal, whose choices are grounded in the current source, and whose execution is stopped by independent browser checks when intent is lost.

This is a proposed differentiation, not a validated market gap. Two sandboxes prove an integration pattern; they do not prove arbitrary commercial-site support. The hackathon MVP should ship two complete supported tasks with clear limits. Unknown sites can be a discovery preview, but must not be advertised as ready to transact.

The strongest cut is therefore: **two websites, two complete transactional tasks, one small read-only path per site, one convincing failure/correction loop, and persistent receipts.** Defer universal website conversion, cross-site autonomous planning, voice, real checkout and broad accessibility claims.
