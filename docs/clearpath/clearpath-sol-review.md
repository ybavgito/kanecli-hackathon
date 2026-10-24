# ClearPath: independent Sol product review

October 24, 2026. Research only. No CLI execution, tests, browser automation, implementation, external mutations, or additional agents. Inputs: [baseline](./kane-consumer-fresh-paths.md), [field guide](./kane-cli-field-guide.md), rc.3 source-review documents, and primary sources linked below. The supplied rubric and 6 PM deadline are planning constraints; earlier field-guide timing and deadline advice is not a current guarantee.

## Recommendation: one return, with an intent that survives the website

Choose **partial apparel returns for shoppers who understand their purchase but find the merchant's return terminology confusing**, initially in one language and on one supported merchant flow. The task is “return these shoes, keep this jacket, send the refund to the original payment method.” Do not market to everyone who dislikes websites. Do not claim an accessibility intervention validated with disabled users. This narrower audience is a hypothesis requiring interviews, not established demand.

Compare this with **rescheduling a home-service appointment while preserving the service and avoiding a fee**. Rescheduling has an equally understandable before/after, but availability can disappear, appointment changes may cancel the original slot, and service-specific rules expand scope. Returns offer concrete item identities, quantities, refund destinations and a useful label or confirmation artifact. Their weakness is episodic demand and the physical work still left afterward. For today, partial returns produce the clearer demonstration; appointment changes are a later vertical, not a second integration.

The complete promise should be: **“Finish this supported return, understand what you approved, and leave with the next step.”** “Refund verified” is too broad. A return request, warehouse acceptance and money arriving are different events. Nike's UK help, for example, describes refund initiation after receipt of the items; this is evidence of the distinction, not a proposed Nike integration or universal policy. [Nike refund help](https://www.nike.com/gb/help/a/refund-info/app).

## Competition changes the pitch

Guide already markets an AI desktop companion for blindness and low vision that describes content and takes actions. Its FAQ emphasizes targeted assistance, while also offering a mode for complex tasks; its published cautions exclude unattended workflows and sensitive transactions. ClearPath cannot claim to invent independent navigation. [Guide](https://www.guideinteraction.com/).

AURA is closer: its repository describes personalized, reversible presentations of real pages, goal guidance, validated target mappings and schema-constrained model decisions. Its stated consequential-action boundary leaves those actions with the user. These are repository claims, not an independent assessment of reliability. ClearPath's defensible proposed difference is completing a supported cross-page transaction against an explicit, approved task contract and retaining the outcome evidence. That distinction disappears if ClearPath merely simplifies the current screen. [AURA repository](https://github.com/Phloraxx/AURA).

Google's Natively Adaptive Interfaces supplies a broader approach to accessibility embedded in multimodal agents. Adaptive interfaces are consequently an existing design direction, not ClearPath's novel discovery. [Google NAI](https://developers.google.com/natively-adaptive-interfaces).

Against a general browser agent, ClearPath must win on fewer decisions, persistent visible intent, supported-task boundaries and a usable receipt. A general agent could implement the same contract. This is a focused product proposition, not a durable technical moat.

## A complete journey and artifact

1. **Choose the supported task.** The landing screen names the merchant, supported return type and current integration status. A prepared demo session is labeled. A web UI talks to a local backend worker; an ordinary hosted page cannot simply take over the shopper's existing browser.
2. **Establish identity and intent.** Show the observed order and item variants, with masked identity. Resolve “red shoes” to an order-line identifier, size and quantity. Keep the jacket as an explicit exclusion. Ask for a return reason rather than inventing one.
3. **Present actual choices.** Show only options observed on the source flow, including fees, refund destination and packaging/drop-off requirements. Unknown values stay unknown. Explain “original payment” in plain language without implying that every payment arrangement behaves identically.
4. **Prepare and review.** Display one review: exact item, quantity, reason, destination, deduction and next physical step. If the source defaults to store credit, expose the conflict. Never quietly reinterpret the initial preference.
5. **Accept a user change.** Let the user switch from store drop-off to prepaid mail when both are supported. Refresh the observed deduction and instructions. This invalidates the previous approval; approval belongs to this exact revision.
6. **Submit once, then reconcile.** Following approval, dispatch the bounded commit job. If it times out, inspect the resulting state before considering another submission. Ambiguous completion becomes “checking whether it went through,” not a blind retry.
7. **Provide the receipt.** Include order/item identity, request identifier, observed refund destination, amount and deductions where shown, timestamp, source evidence, label/QR link where actually available, and the remaining action. Status reads “return requested; refund pending” when appropriate. Keep an unresolved field visible if the confirmation omits it.

This receipt is the product's endpoint. A cheerful chat message and a screenshot of a clicked button are insufficient.

## Feasible architecture versus unverified integration

The feasible design is a fixed frontend rendering a bounded JSON schema: item selection, single-choice question, fee disclosure, approval and receipt. OpenAI interprets the goal, selects an allowed question type and explains observed errors. Ordinary code validates the schema, stores intent revisions, compares extracted identifiers and amounts, manages the queue, and controls dispatch. No runtime HTML generation, coding-agent platform or arbitrary code execution is needed.

The worker serializes jobs for one task/session, stores run identifiers and consumes NDJSON terminal events. Kane supplies browser actions, observations and evidence; it does not supply the application state machine. Saved context can carry source-specific knowledge, but must not substitute for current observations. Chrome profile/CDP support is a connection mechanism, not proof of authentication handoff. Fresh isolated batch browsers are not a persistent shopper identity. Those limits follow the supplied field guide and source review.

**Unverified:** retaining a real merchant session across jobs; locating an exact safe stopping point; preventing an agent from submitting early; and reading a durable confirmation after an interrupted request. The earlier two-role local attempt failed before the manager and proves no handoff. Neither a written objective nor an approval screen establishes enforcement. A sandbox can enforce the commit boundary at its server; an external merchant cannot be assumed to expose that control. Without a demonstrated external boundary, limit that integration to observation or a human final submit and label it accordingly.

## Six meaningful Kane jobs, with limits

**1. Prepare the supported flow.** Build-time exploration maps screens and helps design scenarios. It does not execute the designed tests. Use a dedicated project/URL and explicitly request `read_only` every exploration run: mutation is the default, settings do not persist, and setup/allow-post exceptions require review. Mapping is preparation, not a live-task success claim. [rc.3 exploration docs](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/exploration.md).

**2. Discover the current order.** Observe the authenticated source and extract actual item IDs, variants and eligibility text. Code resolves the user's selection; ambiguous identity triggers a question. Do not have the model infer an order from a similar photograph.

**3. Prepare the return and capture a branch.** Operate the supported pre-submit steps and extract available methods, deductions and validation messages. Kane becomes substantive when a source observation changes ClearPath's next question. This job is allowed only where the pre-submit boundary is established; otherwise preparation stays manual.

**4. Commit the approved revision.** Dispatch a narrowly scoped objective only after code matches current revision, observed terms and approval. `--mode action` hard-stopping on auth/errors does not make it read-only or implement user approval. Do not sell a prompt as a transaction firewall.

**5. Inspect the result.** Re-observe the source confirmation, extracting request identity and displayed fields. The documented analyzer-only mode can judge conditions on the current page without action steps; its exit zero means conditions were judged, not that they were true. Inspect condition results. Missing fields remain unverified. [rc.3 running docs](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/running-tests.md).

**6. Feed build evidence back to the coding agent.** During development, a genuine observed mismatch in ClearPath's own flow should inform a repair, followed by recorded re-verification. Retain original failure, fix and subsequent evidence. This is a separate build-time use, not runtime code generation. No such loop is executed or claimed in this research.

These jobs span preparation, operation, extraction, verification and feedback. Six commands alone do not establish meaningful range. Batch observations; do not invoke Kane for each keystroke. Prior fixture extraction took 23 seconds and a scenario took 192 seconds wall time. Neither measures the proposed integration. Display honest progress and elapsed time; promise no instant experience.

## Three-minute demo: one changed decision

**0:00–0:25:** Show the source merchant's confusing return screen, then ClearPath's intent: shoes returned, jacket kept, original payment. Keep the source visible enough to establish that an actual browser is involved.

**0:25–1:05:** Show live source observation and one consequential choice. A clearly labeled sandbox may deliberately default to store credit and offer mail versus drop-off. Say these are seeded demonstration conditions, not defects discovered on a named retailer.

**1:05–1:35:** The user changes drop-off to mail. The fee updates from observed source state, and approval is refreshed. This is the single branch: no second persona, surprise website or multi-agent handoff.

**1:35–2:35:** Approve, execute and inspect the resulting confirmation. Show the actual worker state and source evidence, with no fake progress. If the live run exceeds the slot, switch explicitly to a recorded run with timestamps; never present it as the live completion.

**2:35–3:00:** Open the receipt: correct shoes, jacket retained, observed destination, request identifier, label and next step. State precisely whether this was an external merchant or merchant sandbox. A sandbox demonstrates working orchestration and UI; it does not prove commercial-site compatibility.

Because prior observed latency can exceed this entire slot, a three-minute end-to-end external run is a goal, not a research-supported commitment. A prepared authenticated state and a short supported path are necessary; a fallback recording is essential.

## Build priorities and fatal objections

Must build: one source/task, fixed question UI, OpenAI-backed interpretation, revision-bound intent and approval, serialized worker, observable status, timeout reconciliation, source-linked receipt, and honest integration labels. Defer arbitrary sites, voice, multiple languages, refunds tracking across weeks, caregiver access and automated account setup.

**Fatal objection 1: “This is a slower return form.”** If setup plus waiting exceeds the original effort, the product fails. Narrow support and familiar choices must remove enough confusion to justify the delay. No usability evidence presently proves that.

**Fatal objection 2: “The approval is decorative.”** If Kane can submit during preparation, preserving intent in code is insufficient. Enforce the boundary in the sandbox; demonstrate the external stopping mechanism or narrow that claim to human final submission.

**Fatal objection 3: “You built both sides to make the agent look useful.”** A sandbox with direct database reads would weaken Kane's necessity. Runtime facts must come from the source browser. Label seeded conditions, expose limitations and acknowledge that external integration remains unproven.

For the supplied rubric, retain a genuine Kane-to-coding-agent feedback story alongside runtime evidence. The organizer showcases runtime performance and browser-backed repair among previous projects; this supports breadth, not predicted winning odds. [Organizer project showcase](https://www.testmuai.com/kane-cli/). Reserve time before 6 PM for same-day public code, OpenAI usage and the evidence pack, plus the video, deck, blog and social drafts. Do not let polishing consume the 25-point GTM category. Publish only factual claims; no engagement, demand or novelty metrics are established here.
