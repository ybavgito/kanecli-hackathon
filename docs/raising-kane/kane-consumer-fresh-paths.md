# Fresh consumer directions outside travel

October 24, 2026. Research only; no new tests or implementation. The objective is a useful product for ordinary people with Kane doing consequential work during the user's task. “Winning” remains an aspiration, not a measured probability.

## Recommendation

The strongest new direction from this pass is **ClearPath: a simpler, task-specific interface over a supported real website, with the underlying result checked against what the user intended.** The practical alternative is **MissingPiece: find a model-specific replacement part and show the supporting compatibility evidence**. The interactive-demo alternative is **FirstShift: practice a real customer-service task with an AI customer who checks whether your actions actually fixed their problem**.

These are proposed product refinements within existing categories. Research found substantial competition in all three. I would not represent any of them as an uncontested invention. ClearPath offers the best combination of broadly understandable value, runtime browser necessity, and a visible user experience distinct from an itinerary or report dashboard.

## 1. ClearPath — let me finish the task without fighting the website

### Consumer problem

People can understand what they want while struggling with a site's vocabulary, layout, multi-step forms, or language. A family member may be comfortable answering a few clear questions but need help completing a return, changing a service appointment, or using an unfamiliar registration portal. This is not restricted to a diagnosis or age group.

### Product experience

The user chooses a supported task and connects the relevant website session. The app discovers the current state and asks only the unresolved questions, using ordinary language and large, explicit controls. It translates answers into actions on the real site, reports validation errors in understandable terms, and shows the original evidence next to its summary. Before submitting, it presents the exact proposed action and consequential choices for approval.

For the initial return example: “Return the red shoes. Keep the jacket. Refund the original payment method.” The system must preserve the intended item and quantity, recognize the refund methods actually offered, and report any shipping deduction. It must not substitute store credit because it is the default. After an approved submission, it checks the resulting request, rather than equating a button click with success. No actual refund is claimed until supported by the appropriate later evidence.

The completed output is the real task result and its receipt or confirmation—not just instructions for the user to repeat.

### Kane's runtime contribution

Kane operates the original site's browser and observes its actual fields, options, validation messages, and result. OpenAI translates between the user's intent and a bounded task specification. Ordinary code stores the approved intent, compares observable values and identities, and manages step state. The simple web interface is our product; the source site remains the system where the task occurs.

Do not call Kane for every keystroke. Batch discovery, user questions, execution and final checking into a small number of bounded jobs. Preserve session state explicitly. This research has not established dependable authentication handoff or acceptable latency for any commercial target.

Explore can help prepare the supported workflow. It does not automatically produce a safe or complete semantic action map. A confirmation prompt is not runtime enforcement by itself; the orchestrator must prevent an unapproved commit job from being dispatched, and the supported execution path must honor that boundary.

### Demo

Show a difficult source flow and the simple task interface. The user specifies one item and a refund preference. The source presents a conflicting default or requires an extra choice. The app exposes that choice instead of guessing, then completes the approved path and checks the resulting item/method/amount where shown. A wrong draft can be caught before submission. Any deliberately seeded mismatch must be identified as a demonstration case.

This can use a clearly labeled merchant sandbox for a controlled demo, but a sandbox alone proves only that integration. It must not be sold as “works on any website.”

### Scope

One task, one supported source application, a prepared session, plain-language questions, source-evidence view, approval boundary, and result receipt. No browser replacement, arbitrary website support, generated source code, full voice stack, banking, healthcare or legal applications. A local backend can host the Kane worker; it is not a frontend-only app. No runtime coding agent is required.

### Competition and honest difference

[Guide](https://www.guideinteraction.com/) already offers AI assistance for people with blindness or low vision, including navigation and actions. [AURA](https://github.com/Phloraxx/AURA) describes adapting real websites to a person's needs. Google's [Natively Adaptive Interfaces](https://developers.google.com/natively-adaptive-interfaces) provides a broader design approach for adaptive AI interfaces.

Therefore “AI makes websites accessible” is not a unique claim. ClearPath's proposed focus is one understandable task contract, a simple user interaction, and evidence that the original site's outcome matches that contract. This is a product-quality distinction that needs validation, not a proven market moat. No claim of accessibility certification or user-tested usability is made.

## 2. MissingPiece — find the replacement that actually matches my thing

### Consumer problem and output

An ordinary household loses a vacuum attachment, breaks a drawer component, or needs a replacement accessory. Similar-looking parts and ambiguous model names make generic shopping results unreliable.

The user supplies a photograph, the exact model label when available, and what is missing. The agent identifies candidates and asks for any missing revision or serial information. Kane uses supported parts catalogs, model selectors and compatibility tools. The app returns a specific part number, source-supported model match, observed purchase option, and unresolved compatibility questions. It must separate manufacturer-listed compatibility from an inference based on appearance.

### Memorable demo

A plausible candidate has the right product-family name but does not match the exact model. The catalog observation rejects that candidate; the agent finds the supported part or states that it cannot establish a match. The final result includes the evidence rather than an unexplained confident recommendation.

### Scope and limits

One low-risk accessory family, one model catalog and one seller. No electrical, gas, medical or safety-critical repair advice. No promise that browser checks physically test a part. No purchase needed for the demo. Static documentation may be sufficient for some models; use it directly instead of forcing browser interaction.

### Competition

[iFixit's FixBot](https://www.ifixit.com/Info/FixBot_Pro) already helps diagnose problems, find parts and guide repairs. [PartSelect](https://www.partselect.com/oem) supports model-specific part lookup, and [eReplacementParts](https://www.ereplacementparts.com/faq/) explains model diagrams and parts searches. The opportunity would be resolving an incomplete consumer description across these sources and retaining explicit evidence, not inventing compatibility lookup.

Verdict: clear consumer payoff and suitable browser work, but only moderate originality. This is a broader household need than custom blinds, though the initial supported category must still be narrow.

## 3. FirstShift — practice doing the job, with consequences

### User and outcome

A person preparing for their first support or retail job practices a bounded work task. They receive feedback about the actual state changes they made, not just how convincing their conversation sounded.

The learner handles a fictional customer request in a working support console. An OpenAI-powered customer has a concrete goal and limited knowledge. Kane operates that customer's view to submit the initial request and later inspect the result. If the learner says an address or return was corrected but changed the wrong record, the customer sees the discrepancy and responds to it.

The output is a completed practice session, the relevant transaction history and a factual debrief. It is not an employability score or validated hiring assessment.

### Demo and scope

One learner, one AI customer, one fictional shop, one order and three turns. The customer requests a change; the learner acts; Kane checks the customer's actual view; the customer responds; the learner repairs the mistake. A deterministic server-side record establishes the expected values independently of dialogue. All transactions are simulated.

This is a consumer-focused, much narrower version of Cast. There is no arbitrary-app mapping, scene marketplace, multi-agent world, live voice or automatic role discovery. Sequential turns fit Kane's latency better than real-time conversation. The customer's browser role must be real and separately authenticated; a shared omniscient transcript would invalidate the limited-knowledge story.

### Competition and risk

[FirstDesk](https://firstdeskai.com/) already advertises workplace simulations with AI coworkers and changing deadlines. [Calavion](https://calavion.com/) describes evidence-preserving work simulations, including a cancellation case. [Attensi](https://www.attensi.com/solutions/retail-training/) offers retail simulations and AI role-play.

This is consequently not a novel category. Its attractive feature is customer-view consequences backed by browser observations. The important objection is that a fixed first-party simulation can often use APIs or its event engine instead of Kane. Browser use must add meaningful viewpoint validation, rather than delay an otherwise identical scripted exercise. Training transfer remains unproven.

Verdict: strongest participatory stage demo among the new directions, but weaker originality and browser necessity than its initial excitement suggests.

## 4. RentReality — compare the lease offer for my actual situation

The user supplies listing URLs, move-in date, desired lease duration, pets and parking needs. Kane interacts with supported quote calculators and records the actual configuration. Code separates recurring costs, one-time charges, deposits and unknown usage-based costs. A changed start date or term triggers a new observed quote, rather than only a spreadsheet recalculation.

The demo could show the advertised cheapest apartment becoming more expensive for the required lease term. This must be a real observed quote or a labeled example, not a planned claim about a specific property.

Competition is substantial: [Zillow](https://www.zillow.com/learn/rental-pricing-transparency/) describes total-price display, while [Apartments.com](https://renterhelp.apartments.com/article/1176-how-do-i-estimate-rental-costs-for-a-specific-unit) documents unit-specific estimates with lease-term and, when supplied, move-in-date pricing. It is not enough to promise transparent rent.

Verdict: useful and consumer-facing, but another comparison product with more overlap than originality. Do not lead with it.

## 5. SwitchSafe — leave a service without losing something you need

The user names a service they want to leave. The app proposes a reviewed exit sequence: identify what matters, perform a supported export, check that the export is usable, then prepare cancellation and verify the resulting status after approval. A successfully downloaded ZIP is not proof that the desired contents are recoverable.

This extends a cancellation assistant into a dependency-aware transition. Kane could operate the export and account screens; ordinary parsers and checksums should inspect exported files. One service and one export type would be the limit.

The competition includes [Rocket Money's cancellation service](https://www.rocketmoney.com/feature/manage-subscriptions) and [Purchy's documented browser-based cancellation assistant](https://www.purchy.ai/privacy-policy). Authentication, asynchronous exports, entitlement differences and irreversible actions make this a poor same-day choice without a ready integration. No such integration has been established here.

Verdict: a plausible longer-term consumer product, not today's recommendation.

## Other paths rejected in this pass

- **Generic AI storefront creation:** Shopify already documents [Sidekick](https://help.shopify.com/en/manual/ai-powered-tools/sidekick), and [Hotplate](https://www.hotplate.com/product) already supports preorder drops, pickup windows and inventory. A Kane publication check alone does not create a distinctive new merchant product.
- **Generic refund tracking:** [REFUNDI](https://www.refundi.co/) already markets email-based return/refund tracking; [Returnful](https://www.returnful.com/) offers return assistance. Existing ReturnRun research remains relevant, but rebranding it is not a fresh direction.
- **AI photo books:** [Mixbook Story Mode](https://www.mixbook.com/try-story-mode) already creates personalized photo books. Browser editor automation remains technically risky, and basic generation is not novel.
- **Personalized board games:** [Ludira](https://ludira.io/) advertises AI rules-to-game generation and adversarial testing. This also overlaps the earlier Kane escape-room winner.
- **Home handover guidebooks:** [Touch Stay](https://touchstay.com/features/ai-chatbot) already offers property-specific AI answers in digital guidebooks. A browser check cannot establish that a real door code or physical instruction is correct.

## Hackathon decision

Choose ClearPath if the team wants the strongest new consumer-facing direction and is willing to scope it to one real task. MissingPiece is the practical alternative. FirstShift is the interactive alternative, with explicit competition and browser-necessity concerns.

For ClearPath, the memorable proposition is: **“The website can remain complicated; the person gets a simpler way to complete the task, with the original result checked.”** The product UI, real source interaction, agent adaptation and final artifact can all be visible in one story.

None of these research candidates has validated demand, tested commercial compatibility, or a defensible predicted score. The actual judging opportunity is a coherent consumer outcome plus a consequential Kane observation that changes the agent's behavior. Reserve the required time for the public repo, evidence pack, live completion and GTM assets. No additional tests are proposed or launched in this research pass.
