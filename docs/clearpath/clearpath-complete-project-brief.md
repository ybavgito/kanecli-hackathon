# ClearPath

## A clearer way through complicated websites

**Tell ClearPath what you need. Make the choices that matter. See what the website actually did.**

Complete product, scope, architecture and hackathon demo brief. October 24, 2026.

**Status:** proposed implementation, informed by the Kane CLI 0.10.0-rc.3 documentation audit and independent product review. This document does not claim that ClearPath has been built, that a commercial merchant integration works, or that the proposed runtime has been measured. No new tests or implementation were performed to produce this brief.

## 1. The project in one paragraph

ClearPath turns a supported, complicated web task into a short sequence of understandable decisions. A person describes what they want, and an OpenAI-powered agent uses Kane CLI to inspect and operate the original website. ClearPath preserves the person's choices as the website introduces new steps and conditions, checks for mismatches before approval, and verifies the resulting record after submission. The person leaves with a completed request, a readable receipt and a clear next step. The first implementation handles a partial merchandise return in one supported merchant flow.

### The 30-second pitch

“You know what you want. The website makes it complicated. ClearPath gives you a simpler way to finish the task. Tell it to return the shoes, keep the jacket and refund your original payment method. When a later choice changes the website's defaults, Kane catches the mismatch, the agent corrects it, and you approve the exact result. ClearPath then checks what the website saved and gives you the confirmation.”

### The demo's defining moment

The user says, **“I don't have a printer.”**

The agent changes the return method. The website resets the refund destination to store credit. ClearPath notices that the new draft conflicts with the earlier request for an original-payment refund. Kane corrects the draft and verifies it again.

The user sees a system that follows their intent across a changing task, with the source evidence available to inspect.

## 2. The person and the problem

The initial user understands the desired outcome but finds the merchant's return process confusing: unfamiliar terminology, multiple steps, competing refund choices and instructions that change with the selected method. They may usually ask someone else to help.

The difficulty is often not deciding what they want. It is translating that decision into the website's controls while remembering every earlier choice.

ClearPath should reduce the number of decisions the person must interpret, expose their consequences, and preserve the decisions already made. This audience and demand are hypotheses; no user research in this project has yet established adoption or willingness to pay.

The interface can benefit people with different reading, attention, language or interaction preferences. The MVP makes no accessibility-certification or disability-specific effectiveness claim. Use plain text, explicit controls and keyboard-friendly interactions as ordinary product quality.

### Why this is a product

ClearPath owns the user's task from request through completion. It provides a persistent intent record, grounded questions, an editable proposal, approval, recovery from uncertainty and a useful receipt. A person can return to the task and understand its status without reconstructing an agent conversation.

The workflow is how the product delivers that outcome. The source website remains the system where the actual request exists.

## 3. The first supported task

**Partial return of an order containing multiple items.**

Example request:

> Return the red shoes, keep the jacket, and refund my original payment method.

The first task supports one exact order, one item and quantity to return, one required return reason, a choice between supported return methods, a refund preference, an observed deduction, and submission of the approved request.

The user can revise one decision before submission. The product must carry the other choices forward.

The completed output is a return request and its next-step instructions. It is not proof of warehouse acceptance, a bank settlement or a completed refund.

### Demonstration environment

Build a separate, working fictional merchant portal with synthetic data and persistent records. Label it **“Merchant sandbox — simulated order”** throughout the demonstration.

The portal must have real forms, dependent choices, a draft, a submission action and a retrievable confirmation. Kane must operate those forms. ClearPath must obtain operational source facts through the browser or its explicitly documented corroborating read path, rather than receiving hidden fixture answers.

The source includes one deliberately configured behavior: changing the return method resets the refund destination. This is a seeded demonstration condition, not a claim about any real retailer.

A commercial integration would materially strengthen the product evidence, but is not established or included in the baseline completion claim.

## 4. The complete user journey

### Start

The user opens ClearPath and sees the supported task and source. They enter the request or select a plainly labeled example. An example fills the input; it does not fabricate an execution result.

ClearPath starts a task and shows honest progress while Kane reads the source. A prepared demo session is identified as prepared.

### Identify the right records

Kane observes the order and available items. ClearPath resolves “red shoes” to the exact order line, variant and quantity. If the reference is ambiguous, it asks the user to select the item.

An explicit “keep the jacket” instruction becomes an exclusion, not an incidental phrase that can disappear from model context.

### Preserve the user's choices

A short **“What you want”** section remains visible:

- Return one pair of red shoes, size 8.
- Keep the jacket.
- Refund the original payment method.

The user can edit it. An edit creates a new task revision and invalidates any previous approval that depends on the changed terms.

### Resolve missing information

ClearPath asks only questions needed by the observed source flow. For example: “Why are you returning the shoes?” with the merchant's available reasons expressed clearly.

OpenAI may explain an option, but cannot invent a return reason or eligibility rule. Material instructions and costs must remain visible even when wording is simplified.

### Show real alternatives and consequences

The product presents methods currently offered by the source, together with observed requirements, deductions and uncertainties.

The user can ask “What changes if I choose this?” On a supported reversible draft, Kane can inspect the alternative and return its actual terms. The MVP implements one such branch, not an exhaustive comparison engine.

An unobserved option stays unverified. A fresh browser is not assumed to be a copy of the user's authenticated draft.

### Adapt when the user changes a requirement

The user adds “I don't have a printer.” ClearPath updates the task record, discovers the relevant supported option and revises the draft. The original-payment preference and jacket exclusion remain required.

Kane's next observation determines whether that revision worked. A new source state must not be accepted merely because the previous action completed.

### Check the current proposal

The user can press **“Check my choices.”** The same verification happens before submission.

Each requirement is shown as matching, conflicting or not yet verified. A conflict explains the concrete difference:

> The website has store credit selected. You asked for your original payment method.

ClearPath may correct an allowed draft choice and check again. If the desired choice is unavailable, it asks the person what to do. A model must not weaken the requirement to obtain a passing result.

### Approve

The review presents the exact item and quantity, reason, return method, refund destination, observed deduction and remaining physical action. The user approves this current proposal.

If the source terms change before the commit, ClearPath returns to review. Approval does not cover an unspecified future version of the task.

### Submit and reconcile

Kane performs the supported submission. ClearPath examines the result and reopens the resulting record when needed.

If the worker times out after submission may have occurred, the task becomes **“Checking whether it went through.”** It does not immediately offer a blind retry. First establish whether a matching request already exists.

### Receive the result

The final screen provides the request identifier, exact item, observed amount and destination, source confirmation, timestamp, available label or QR link, and next physical step.

The headline is **“Return requested; refund pending.”** A claim that lacks evidence remains visibly unresolved.

## 5. The product screens

### Task start

A concise explanation of the supported task, a request field, and the source/integration status. Keep the primary action obvious. The MVP should not advertise arbitrary website support through an unrestricted URL box.

### Task workspace

The current decision is the visual focus. The user's intent stays nearby. A compact status line reports actual progress, such as “Checking the return options,” with elapsed time when useful.

A secondary **“See the original”** control reveals the latest source observation and its timestamp. Avoid making ordinary users interpret raw CLI output.

### Choice preview

The source-backed options show their consequences. “Explain this” provides a short explanation using already observed information. New questions about current source state trigger a fresh observation when necessary.

### Review and correction

Display the proposal and requirement checks together. A conflict draws attention to the affected choice and the action taken. Successful correction remains visible in the history rather than disappearing behind a generic green badge.

### Receipt

Lead with the task outcome and next step. Evidence is expandable. The receipt should remain available after a page reload.

### Visual direction

Use generous space, readable typography, plain controls and a restrained palette. Communicate status through text as well as color. Keep the original merchant evidence visually distinct from ClearPath's explanation so the user can tell observation from interpretation.

The impressive contrast is the source's multi-step complexity becoming a few understandable decisions. Avoid fake live screenshots, invented progress percentages or a terminal-themed consumer experience.

## 6. How Kane is involved

Kane is present during the user's actual task. Its observations affect questions, decisions, corrections and completion.

### Explore: learn the supported source

Use Explore during integration preparation to identify screens, paths and conditional behavior, and to inform checks. Review the discovered map against the intended task. Mapping is not proof of exhaustive coverage, permission or reversibility. Exploration and execution remain separate activities. [Explore documentation](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/exploration.md).

### Browser operation: carry out the task

Kane navigates the original source and operates its controls. Bounded jobs cover discovery, draft preparation, correction and approved submission. Explicit outcome checks end each phase. The worker consumes actual completion results, not a model's narrative claim that the task is done. [Execution documentation](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/running-tests.md).

### Extraction and branching: let observations change the next action

Extract the current options, item identity and relevant terms. Use conditional behavior for observed states such as an unavailable method or a changed selection. ClearPath supplies the durable intent and decision boundaries. [Checkpoint documentation](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/features/checkpoints/overview.md).

### Validation: compare against explicit requirements

Use source observations and targeted assertions to evaluate the current proposal. Current-page analyzer mode is useful for a page already in view; it does not navigate through the entire task. Its condition results must be inspected individually. Code performs exact comparisons where structured values are available.

### DevTools: inspect what the source sent and returned

For the matching transaction, inspect relevant request and response fields and correlate them with the order and request identifiers. Preserve needed fields in the step where they are captured. Network data has scope and size limits. Observing a wrong request after submission detects a problem; it cannot prevent the already-sent action. [Network assertions](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/features/checkpoints/devtools/network.md).

### API corroboration: read a supported result when available

A documented read endpoint can provide additional evidence of the resulting record. This is optional and source-specific. It should not become a hidden shortcut that performs the entire demonstrated browser task. Where an API is the best real integration, use it honestly rather than forcing browser interaction. [API objectives](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/features/api-calls.md).

### Saved journeys: reuse supported phases

Commit parameterized `_test.md` journeys for stable phases. Replay is a possible latency improvement, with re-authoring available for supported failures. Keep approval-sensitive submission separate and reconcile uncertain completion before any retry. No measured ClearPath replay performance is claimed. [Saved execution](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/testmd/running.md).

### Evidence: explain what happened

Retain run results, source observations and relevant screenshots. Link receipt claims to their supporting evidence and preserve the initial mismatch alongside the correction. Sealed packs are completed-run artifacts, and pack validation concerns integrity rather than semantic truth. [Evidence documentation](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/evidence.md).

### Assurance: define supported behavior

If time permits, derive a small reviewed set of acceptance criteria for the integration and associate execution with them. Native coverage requires this linkage; an aggregate project score must not be presented as proof of one user's current task. Keep requirement management out of the consumer interface. [Assurance design](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/assurance/design.md), [coverage](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/assurance/coverage.md).

## 7. Responsibilities and architecture

### ClearPath frontend

Renders a fixed set of components: request input, item selection, question, choice preview, requirement status, approval and receipt. It receives structured state and displays it. It does not generate arbitrary source code or browser pages at runtime.

### OpenAI planner

Interprets the user's request, proposes the next allowed action and explains source observations. Its outputs conform to a bounded schema. Allowed decisions include asking for missing input, requesting source observation, preparing an allowed draft change, proposing a correction and presenting a result.

The model cannot invent source facts, approve on behalf of the user or redefine the task as successful when mandatory evidence is missing.

### Application controller

Owns task revisions, job dispatch, exact comparisons, approvals, state transitions and recovery. It serializes browser jobs for a task and checks that each result belongs to the intended session and revision.

A late result from an older revision can remain in history but must not overwrite the current proposal.

### Kane worker

Runs the CLI in a backend environment with browser access. It captures progress, terminal outcomes and evidence references. Use a persistent process or job worker suited to long-running browser work, rather than keeping the entire task inside a short-lived frontend request.

The MVP can run locally on the demo machine. A hosted interface is useful only when connected to a functioning worker. The documented deployment must match what actually runs.

### Task storage

A small persistent store is sufficient. Each task records its source, status, intent revisions, observations, job history, checks, approval and result. The choice of familiar framework and database should serve completion; there is no need for a distributed agent platform.

### Source portal

Owns order data, draft state and committed returns. In the sandbox, commit enforcement checks approval for the exact draft revision. The worker cannot create approval merely by clicking an earlier source control. ClearPath's user approval is recorded by trusted application logic.

External sites do not automatically expose this enforcement. Until the supported external boundary is established, use a human final submit and state that scope explicitly. Kane's `action` mode is not a transaction-approval firewall.

### Runtime coding agent

None is required. Codex or another coding agent builds ClearPath and responds to development findings. The customer interacts with ClearPath's product UI, not a Codex chat interface.

## 8. Data and state that make the product reliable

### Intent revision

Store the exact source/account context, order identifier, selected order line and quantity, exclusions, return reason, refund preference and user constraints. Record which facts came from the user and which came from the source.

### Observation

Record the task revision, source URL, time, observed fields, run identifier and evidence reference. Missing fields remain missing. An older observation is not automatically valid for a new draft.

### Requirement result

For each requirement, retain the expected value, observed value, result and supporting evidence. Useful results are **matches**, **conflicts**, **not verified** and **needs a user decision**. Avoid a numerical confidence score that implies an unmeasured reliability rate.

### Approval

Bind approval to the exact current proposal and source draft revision. Include the item, quantity, destination, deduction and method. A changed proposal needs another review.

### Job

Retain job type, task revision, browser/session association, start/end times, completion status and evidence locations. Progress is distinct from final completion. An interrupted job can leave the source changed.

### Task states

The normal path is: request received; source inspection; user input needed; draft prepared; checking; approval needed; submitting; checking result; completed.

Exceptions include source unavailable, session intervention needed, conflicting terms, uncertain submission and result needing attention. These states should provide a specific next action rather than an opaque failure.

### Important implementation details

Keep one active browser operation per task/session. Supply the current expected values explicitly. Do not use shared global context as the customer's task database. Inspect command-specific terminal events and process exit: a step result is not necessarily whole-job completion.

After a timeout, reconcile before resubmitting. Before declaring an exclusion correct, establish that the right source record is present. After submission, distinguish a request created from a refund settled.

## 9. Hackathon scope

### Essential: the complete vertical slice

1. One ClearPath task interface and one working merchant sandbox.
2. OpenAI-backed request interpretation and grounded question wording.
3. One order with two distinct items and exact item selection.
4. A required return reason and two supported return methods.
5. Persistent intent, including the excluded item and refund preference.
6. One user-driven change with one observable source-side consequence.
7. Kane preparation, mismatch detection, correction and final verification.
8. Revision-bound approval and supported commit enforcement.
9. A persisted result, useful receipt and source evidence.
10. Honest progress, blocked states and reconciliation of uncertain submission.
11. Public same-day code, run instructions, OpenAI usage and Kane evidence.

The runtime network check should verify fields the sandbox actually exposes. It is a core demonstration goal, not permission to claim commercial-site support.

### Add after the full task works

A recorded reusable journey; an Explore map that actually informed the integration; a small linked assurance definition; reopening a task after reload; and a polished evidence drawer.

### Stretch features

A second independently supported portal, a short task explanation in another language, an on-demand status recheck, or comparison of one additional reversible branch. Each must be labeled according to what runs. A second site is a substantial integration, not a cosmetic extension.

### Outside the hackathon scope

Arbitrary websites, a browser replacement, voice conversations, autonomous financial services, automatic account onboarding, family account delegation, live refund settlement tracking, native mobile apps, broad persona simulation, and a marketplace of integrations.

No added feature should displace the completed task, evidence pack or required GTM assets.

## 10. Definition of done

These are implementation acceptance criteria, not claims of checks already performed:

- A user can load ClearPath, give the supported request, answer the necessary questions, approve and receive the actual result.
- Item selection is grounded in the observed order; ambiguity asks a question.
- The jacket remains excluded when the return method changes.
- The original-payment preference survives the printer-free branch.
- A mismatched source draft produces a specific conflict, not a green summary.
- A permitted correction is verified from the source before review advances.
- A changed draft invalidates approval; the source commit requires the current approved revision.
- No return exists before approved submission in the sandbox.
- Submission results are correlated with the exact task and resulting request.
- The receipt shows what is supported by evidence and identifies pending or unknown outcomes.
- An uncertain submission does not trigger an automatic duplicate attempt.
- Source screenshots and worker progress are genuine and correctly labeled.
- The repo includes a reproducible setup, the supported scope and the relevant evidence.

For independent evaluation of the sandbox, inspect its persisted records and transaction history against the user-approved intent. The runtime agent should not obtain a scripted success answer from that evaluation mechanism.

## 11. The four-minute demo story

The following is a presentation target. Actual browser duration is unmeasured. Prepare the shortest supported live path and label all prepared state. A full end-to-end recording provides backup, but must never be presented as a live run.

### Preparation

Use a synthetic order containing red shoes and a jacket. The refundable subtotal for the shoes is $80 in this fixture; the supported printer-free method has a $5 deduction, producing a $75 expected refund. These are invented demo amounts, not merchant policy claims.

Prepare authentication and, if necessary for timing, an initial draft with the exact order and return reason already resolved. Show **“Prepared draft; no return submitted.”** Start from this state for the stage version; retain the complete journey for the longer recorded walkthrough and table demonstration.

The source's deliberate challenge is that changing the return method resets the refund destination to store credit. Do not add several additional failures to the same story.

### 0:00–0:25 — show the evidence and the problem

Open a genuine Kane report from a completed run. If a genuine development failure and repair exist, show that pair; otherwise show the completed journey evidence.

Say: “ClearPath helps someone finish a complicated web task while preserving the choices they already made. This is our merchant sandbox. Here is the browser evidence behind the result.”

Move immediately to the working product and source portal.

### 0:25–0:55 — establish the user's intent

Show: “Return the shoes. Keep the jacket. Refund my original payment method.”

The persistent intent summary makes all three requirements visible. Show the prepared state honestly or resolve the order live if measured timing permits.

### 0:55–1:30 — let the person change the task

Enter: “I don't have a printer.”

Kane operates the draft branch. The product reports actual progress. The new method appears with its observed deduction and instructions.

### 1:30–2:20 — reveal the consequential mismatch

The check shows: “Refund destination changed to store credit.”

Explain: “The new return method is valid, but it conflicts with the earlier choice.”

Kane corrects the draft. ClearPath checks it again and displays the restored destination. Keep the original observation and correction available in the evidence history.

### 2:20–3:20 — approve and finish

The user reviews the exact proposal: shoes only, printer-free method, $5 deduction, $75 expected refund to the original payment method. They approve.

Kane submits, checks the relevant transaction response and opens the resulting record. The product does not show completed until the required evidence is available.

### 3:20–4:00 — show the useful result

Open the receipt and source confirmation. Show the request identifier, selected item, preserved refund destination and remaining drop-off action. The jacket remains outside the return.

Close with: **“The website changed. The person's choices carried through. Here is the record of what actually happened.”**

### If execution exceeds the slot

Keep the live status truthful. Explicitly switch to a timestamped recorded completion if necessary, then return to the live task when it finishes. Do not fake instant execution, screenshots or a final result. A video-only demonstration weakens the completion score, so a reliably bounded live segment is important.

## 12. Evidence and judging strategy

### Kane usage and uniqueness — 25 points

The central runtime story is observation, user-driven change, detected conflict, corrected draft and verified result. Retain actual evidence of the journey. A full green journey qualifies for the proof criterion; a seeded condition must not be described as a newly discovered merchant bug.

Separately, retain build history where the coding agent runs Kane, reads a result and changes its next work. The runtime planner's behavior is not a substitute for the rubric's coding-agent criterion.

Meaningful range comes from a saved journey, browser checkpoints, network/result checks, evidence, and an Explore or assurance artifact actually used in the project. Feature count alone does not establish usefulness.

### Uniqueness — 25 points

The problem is a person struggling to carry a clear intent through an unfamiliar multi-step interface. The product angle is a simpler task UI whose decisions remain grounded in the source and whose final claims have evidence.

The demo must show why verification changes the outcome. A successful form-fill with no consequential check would weaken the idea.

### Completion — 25 points

One person must complete one real working flow. The source can be a disclosed sandbox, but the browser work, state changes and receipt must actually run. Keep claims aligned with supported behavior. Provide a README, setup instructions, tests/evidence produced during the eventual build, and a public repo.

### GTM — 25 points

Prepare the submission assets around this one story:

- **Voiceover video, 7 points:** two to four minutes, starts with the Kane report, shows the task and explains what Kane caught.
- **Deck, 4 points:** problem, product, Kane's role, demonstration, supported scope and next step.
- **Blog, 4 points:** explain the failure mode, architecture, evidence and limitations using actual screenshots.
- **LinkedIn, 3 points:** official TestMu AI page tag and the verified event hashtag.
- **X, 3 points:** `@kane_cli` and the verified event hashtag.
- **Show HN, 2 points:** an honest description from the user's own account with the repo or demo link.
- **Reach bonus, 2 points:** genuine external engagement, if earned; never guaranteed.

Every scored asset must be live and linked in the submission under the supplied rules. Verify the event hashtag before publication. This brief neither publishes assets nor authorizes anyone to impersonate the user.

### Eligibility gates

Code written today, public repository, OpenAI used in the build, and Kane evidence pack attached to the submission. Retain timestamps and history that support the claimed work.

## 13. Implementation order

First establish the entire working task with minimal presentation: source order and draft, ClearPath intent, one Kane job, user input, approval, commit and receipt.

Next add the changed-method branch, explicit requirement comparison and correction. This is the core demonstration value.

Then add correlated network/result verification, evidence links and recovery from ambiguous completion. Preserve real build feedback from the coding agent and Kane.

Afterward add reusable recorded phases and, if practical, the integration map and requirement linkage. Polish the screens around the already functioning sequence.

Reserve a substantial final block before the 6 PM deadline for the public repo, evidence pack, video and submission assets. Scope reduction should remove stretch features before it removes the receipt, correction, approval or live completion. Actual time allocation depends on the remaining day and team capacity.

## 14. Differentiation and commercial direction

ClearPath enters an existing landscape. Happy Returns documents an agentic return integration, and AURA describes adaptive presentations of real pages. Therefore “AI returns” and “AI simplifies websites” are not sufficient originality claims. [Happy Returns](https://developer.happyreturns.com/guides/agentic-returns/), [AURA](https://github.com/Phloraxx/AURA).

The proposed product distinction is persistent user intent across a supported operation, a simpler decision interface, visible handling of conflicting source state and an evidenced result. It is a focused product hypothesis, not a proven technical moat.

After the hackathon, validate usefulness with people who currently need help on the supported task. Measure task completion, assistance required, misunderstood choices, unresolved outcomes and total time. Do not claim the product is faster or more reliable without evidence.

A possible distribution path is an assisted-task interface for organizations operating complicated existing portals. That would require a willing partner, a dependable integration and evidence that the experience helps users. Broader consumer support, appointment changes and registration flows remain future integration opportunities, not MVP commitments.

## 15. Known limitations and how they affect the promise

**Latency:** browser execution can take tens of seconds or minutes. Use bounded jobs, truthful progress and eventual replay optimization. Do not promise instant completion.

**Authentication:** browser connection support is not proof of dependable merchant login handoff. The baseline uses a prepared sandbox session.

**Approval:** prompts alone do not enforce the final boundary. Enforce it in the controlled source; narrow external operation to human final submission until a reliable supported mechanism exists.

**Source observations:** a screenshot, DOM value or response may omit important context. Mark missing evidence and corroborate where supported. No “error-free” guarantee is justified.

**Source changes:** recorded paths can become stale. Healing may help navigation, but must not change the expected user outcome or repeat an uncertain commit.

**Sandbox generality:** the demo proves the implemented integration. It does not prove arbitrary merchant compatibility, independent customer demand or production readiness.

**Outcome timing:** a return request and a refund settlement are different. ClearPath's completion language must reflect the observed stage.

## 16. Final project commitment

Build one polished, complete demonstration of a person revising a task while ClearPath preserves their earlier choices. Use Kane to discover and operate the source, expose a meaningful mismatch, verify the correction and inspect the saved result. Finish with a receipt the person can use and evidence a judge can inspect.

The product should leave the audience remembering one thing: **ClearPath kept the person's intent intact while the website changed underneath it.**

## Supporting research

- [Kane feature audit](./clearpath-kane-feature-audit.md)
- [Independent Sol product review](./clearpath-sol-review.md)
- [Earlier product and demo analysis](./clearpath-product-and-demo.md)

This consolidated brief is the primary project description; the supporting documents preserve the capability research and critical analysis behind its decisions.
