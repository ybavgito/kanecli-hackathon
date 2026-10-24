# ClearPath — a simpler way to finish a complicated web task

Product recommendation, October 24, 2026. Research and design only: no new tests, browser experiments, or implementation. Incorporates the [independent Sol review](./clearpath-sol-review.md), the earlier [consumer research](./kane-consumer-fresh-paths.md), and the primary sources below.

Follow-up: the [rc.3 feature audit](./clearpath-kane-feature-audit.md) recommends adding transaction-specific network/result checks, a claim-by-claim receipt, and reusable recorded phases. It also clarifies that native coverage needs requirement linkage, sealed evidence is not a live screenshot stream, and documentation support is not demonstrated integration reliability.

## Recommendation

Build ClearPath as a task-specific interface that preserves a person's choices across a supported website's changing steps. Kane supplies the live browser observations, actions and checks that let the simpler interface stay connected to the underlying task.

**Promise: “Tell us what you need. Make the choices that matter. See that the website did what you approved.”**

Start with one partial-return flow. The person wants to return the shoes, keep the jacket, avoid printing, and receive the refund through the original payment method. The product completes the supported request and leaves them with a usable confirmation and next physical step.

The return is the first supported task, not evidence that arbitrary websites work. A future appointment-change or registration task would require its own supported integration. Do not build those today.

The main improvement over the earlier idea is continuity: the user's intent stays visible and binding while the source website reveals new options, changes defaults, requests information, or reports failure. Kane observations must change the product's behavior. Adding more browser calls without that consequence does not improve it.

## The complete experience

### 1. Start with an actual goal

The user chooses the supported store and gives a request in ordinary language. ClearPath resolves it against the observed order, including the exact item variant and quantity. If two red shoes appear, it asks which one. It asks for the return reason; it does not invent one.

The interface keeps a short, editable “What you want” section visible throughout:

- Return one pair of red shoes, size 8.
- Keep the jacket.
- Refund the original payment method.
- Use a return method that does not require a printer.

This is an application record, not merely a sentence in the model's chat history. Explicit exclusions are as important as requested actions. A remembered preference may suggest a choice; it must not silently authorize a transaction.

### 2. Answer only the decisions the site actually requires

Kane observes the current source flow. OpenAI explains its options in plain language. Fixed UI components display item choices, questions, costs, instructions and review screens.

For example, the source might offer store drop-off and prepaid mail, with different requirements. ClearPath should show the observed options and their conditions. It should not invent a printer-free option merely because that would satisfy the request.

An “Explain this” control can clarify an observed term without another Kane call. A question about changed availability or a new option does require fresh source evidence.

The interface should be usable without reading a long conversation: one focused question, explicit buttons, a short explanation when necessary, and the ability to revise an answer.

### 3. Preview consequences before committing

Let the user ask “What changes if I choose this?” For a supported, reversible draft flow, Kane can inspect the resulting terms of a second choice. ClearPath compares the actual observed consequences: deduction, refund destination, packaging requirement or next step.

This is a useful form of the previously discussed simulation idea. It rehearses a real supported branch using the user's current order context. It does not simulate a fictional person or predict a refund from generic policy text.

Do this only when branch inspection cannot submit a request or create another consequential side effect. A local sandbox can expose resettable drafts. An external website may not. In that case, present already-observed options or mark the alternative unverified. A fresh browser profile does not automatically clone an authenticated order or restore its state.

For the hackathon, implement one branch caused by a user change. Do not build a scenario grid over every combination.

### 4. Check that the website still matches the request

Add a meaningful **“Check my choices”** action at review. It re-observes relevant source state and compares it with the latest intent revision. The same check also runs automatically before submission.

Example result:

- Shoes, quantity one: matches.
- Jacket excluded: matches.
- Printer-free method: matches the source instructions.
- Refund destination: does not match; the source currently shows store credit.

ClearPath should explain the consequence: “The website currently has store credit selected. You asked for the original payment method.” If changing it is an allowed draft action, the agent corrects the choice and rechecks. If the requested option is unavailable, ask the user instead of substituting it.

This is the strongest Kane moment. Its observation changes what the agent does next and prevents the simpler interface from showing a stale or misleading summary.

Do not label the whole task verified because one assertion passed. Every required field needs evidence or an explicit unknown state. Missing content is not proof of a successful exclusion; check that the relevant order or summary is present first.

### 5. Approve the current proposal and complete it once

Show the exact item, quantity, reason, method, refund destination, observed deduction and remaining physical action. Approval applies to that revision. Changing a choice or discovering different terms invalidates approval.

Dispatch a bounded submission job only after that approval. If a run times out after clicking submit, inspect the source for an existing request before retrying. An interrupted browser job may already have changed the website.

A pending or unresolved result must be understandable: “Checking whether the request went through” is more accurate than “Failed—try again.”

### 6. Leave with something useful

The completed task contains the actual request identifier, item and quantity, observed refund method and amount where shown, the source confirmation, a timestamp, and the next step. Include a label or QR link only if it actually exists.

For a submitted return, say **“Return requested; refund pending.”** Do not imply money has arrived. Fields missing from the confirmation remain unverified unless another source observation supports them.

A task can be reopened to view the receipt or check current status. A later status-check feature would make another explicit browser observation; do not add an unattended monitoring service to the MVP.

## Where Kane adds value

### Prepare the integration with Explore

Explore can map the supported source's screens and paths and inform the implementation. A human-reviewed map helps identify item selection, conditional questions, draft review and confirmation. It does not establish that an action is reversible or that every possible branch was covered. Exploration designs tests; that is separate from executing them. Use it during integration preparation, not before every customer task. [Kane rc.3 exploration documentation](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/exploration.md).

### Observe, operate and check during the user's task

The practical runtime has a few bounded jobs: discover current order and choices; prepare or revise the draft; check the current proposal; submit after approval and inspect the result. Corrections create additional jobs only when needed.

Kane's documented browser objectives, extraction and assertions support these roles. Current-page analyzer mode can evaluate conditions without action steps; code must inspect the returned condition values rather than equating exit zero with all conditions being true. If evidence is elsewhere, explicitly navigate there before checking. [Kane rc.3 execution documentation](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/running-tests.md).

Save stable supported journeys as `_test.md` files where appropriate. Recorded steps can replay, and changed or failed authorable steps may be re-authored. Do not blindly replay a submission after uncertain completion. [Kane rc.3 saved-flow documentation](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/testmd/running.md).

DevTools or a supported source API can corroborate a result when available. Do not add an API call merely to collect another rubric feature. In a controlled demonstration, source-side records can serve as an independent evaluation oracle while ClearPath's operational observations still come through the browser.

### Keep the responsibility boundaries clear

OpenAI interprets the request, asks grounded questions and proposes the next allowed action. Kane observes and operates the browser. Application code stores intent, validates structured outputs, compares exact values, serializes jobs and manages approval and completion state.

Neither Kane nor a second LLM pass guarantees semantic truth. Fresh source observation improves evidence; it is not a mathematically independent verifier. Exact item identifiers, quantities, approved choices and source records provide stronger checks than an unqualified “looks right.”

Kane's `action` mode stops at certain blocking/error conditions; it is not an approval firewall. In the sandbox, the source server can require approval bound to the exact transaction. For an external site, that enforcement is unproven. Use human final submission unless the supported integration establishes a dependable boundary. Do not advertise a hard guarantee based only on an instruction to stop.

## An achievable and memorable demo

Use one visibly labeled fictional merchant with a working, stateful return portal and synthetic order. The demo conditions are deliberate. Do not portray them as defects found on a real retailer.

**Opening, about 20 seconds:** show the genuine Kane report from an already completed run, then the source return interface and ClearPath. Establish the promise: a simple task that survives the website's changing steps. If development produced a real fail-and-repair sequence, show it; do not manufacture one or pretend a seeded condition is a discovered bug.

**Set the task:** “Return the red shoes. Keep the jacket. Refund my original payment method.” The source observation resolves the order; ClearPath asks the necessary return-reason question.

**The user changes one thing:** “I don't have a printer.” ClearPath asks Kane to inspect the supported printer-free branch. In the labeled fixture, changing the return method resets the refund destination to store credit. This is the one deliberate challenge.

**The decisive moment:** the source now offers a valid return that violates the user's earlier instruction. ClearPath displays the precise mismatch, corrects the draft destination through Kane, and checks again. The user sees both the new return method and the preserved original preference. No hidden script marks the mismatch corrected.

**Finish:** the user approves the final proposal. For an illustrative fixture with an $80 return subtotal and a $5 deduction, show a $75 expected refund, clearly identified as fictional demo amounts. Kane submits and opens the resulting confirmation. ClearPath produces the request identifier and next-step artifact; the jacket remains outside the return.

**Close:** open the source confirmation beside the receipt. The takeaway is concrete: the user got the intended task completed, and the browser evidence explains why ClearPath trusts that result.

### Presentation and timing

The main view should emphasize the current question and the user's choices. A secondary “See the original” area shows actual captured evidence with its time, not a fake live browser stream. Keep raw CLI logs behind an evidence control for judges.

A three-to-four-minute narrated story is a target, not an established runtime. Earlier unrelated fixtures took tens of seconds to several minutes per run. Start from a prepared authenticated state; use the short supported branch for the live portion. An already-discovered order must be labeled as prepared, not presented as newly discovered. Preserve a timestamped recording of the full run as backup and identify it explicitly if used.

If only a sandbox runs, say so. It demonstrates a working product loop; it does not prove commercial merchant compatibility. A real supported integration would strengthen the pitch materially, but no such integration has been established in this research.

## Scope that can actually be finished

Build one task page with focused question components, persistent intent, editable answers, source evidence, review and receipt. Add the backend worker and serialized Kane jobs, a bounded OpenAI decision schema, a durable task record, revision-bound approval and timeout reconciliation. A prepared demo session avoids spending the whole project on account connection.

Do not build a general browser, arbitrary-site generator, full voice interface, multilingual translation system, family-account platform, multi-agent simulator or refund-monitoring service. Pause/resume of the task record is useful; restoring arbitrary expired source sessions is a separate capability.

There is no need for a Codex chat interface or a runtime coding agent. The user-facing interface consists of components we write once and populate with observed options. The coding agent helps build the product and responds to Kane findings during development.

Future product completeness comes from reliable recovery, more supported tasks, user preferences and useful receipts—not from accumulating autonomous actions.

## Originality and the strongest objections

Research found an important new competitor: **Happy Returns already documents an MCP-based agentic return flow**, including option selection, submission and confirmation. That undermines “AI returns assistant” as an originality claim. Its integration requires partner credentials; it is not an integration we have implemented. Where a supported API solves the task, forcing browser execution is weak engineering. [Happy Returns agentic integration](https://developer.happyreturns.com/guides/agentic-returns/).

Loop also documents store-credit incentives appearing again on the review page after a shopper selected a refund. That supports the importance of preserving the user's preference, but it does not establish that Loop resets selections or contains the fictional demo behavior. [Loop bonus-credit documentation](https://help.loopreturns.com/en/articles/1912193).

[Guide](https://www.guideinteraction.com/) already provides AI interface assistance. [AURA](https://github.com/Phloraxx/AURA) describes personalized adaptive presentations of real pages. ClearPath cannot honestly claim to invent adaptive interfaces. Its proposed distinction is a simple, persistent task representation carried through a supported cross-page operation, with observed mismatches corrected and a useful outcome receipt. This is a focused product hypothesis, not a proven moat.

The largest objection is speed: if the original site takes two minutes and ClearPath takes five plus setup, convenience may not justify it. The initial audience must value reduced confusion and assistance, and that demand remains unvalidated. Do not frame the product as faster without evidence.

The second objection is the controlled source: building both sides makes execution more predictable but weakens claims of generality and browser necessity. Keep the source separately operated, use actual browser-derived facts, and disclose the boundary. Ultimately, a real supported portal is needed to validate the integration thesis.

The third is reliability: source changes, omitted details and ambiguous results can defeat a confident-looking agent. Explicit unknowns, exact comparisons, approval enforcement and recovery are product requirements, not reasons to promise “error-free.”

## How it addresses the supplied judging rubric

Runtime Kane work is central because source observations determine questions, corrections and completion. The saved journeys and Explore map add range only when they were genuinely used. The evidence should show the changed user requirement, observed mismatch, corrective action and final source result.

The coding-agent criterion is separate: retain actual history showing the coding agent running Kane, reading a result and changing its next work. A runtime OpenAI planner alone may not satisfy that wording. A full green user journey qualifies for the proof criterion; an artificial failure is unnecessary.

Completion means a user can start, answer, approve and receive the evidenced result. Keep the public same-day repository cloneable, name the exact supported integration, document OpenAI use, and attach the evidence pack. Use synthetic personal data in publicly shared demonstration artifacts.

Reserve time for the required voiceover video, deck, blog and submission links. The video should open with the Kane report and show this single story. GTM is a quarter of the score; extra product breadth cannot replace missing assets. No publishing or external messaging is performed by this research.

**Decision:** pursue ClearPath with one supported return task, a real user-driven branch, a visible intent mismatch and an evidenced final receipt. Make those complete before adding a second task or more Kane commands.
