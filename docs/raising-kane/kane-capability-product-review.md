# Kane capability and consumer-product review

24 October 2026. Independent desk review of tagged 0.10.0-rc.3 documentation, installed `run --help`, selected bundled adapter code, and supplied research files. Only help was executed; no browser experiments, accounts, transactions, implementation, or external mutations. Rankings are hypotheses, with no validated demand or consensus.

## Capability corrections that change the product decision

**Kane can perform a consumer's browser task directly. It need not sit behind an app generator.** The [tagged agent guide](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/agents.md) describes E2E, browser automation and native-app testing. “Coding agent” describes a supported caller, not a restriction to developer workflows. A product backend can launch the CLI as a job, consume JSON lines and artifacts, and return a consumer result. This is an integration design, not a verified hosted SDK or concurrency guarantee. The engine is not an in-browser JavaScript dependency.

**URL/browser is the main web execution surface, not the entire capability boundary.** [Direct API calls](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/features/api-calls.md) can send explicit HTTP requests, store responses and mix assertions with UI actions. [DevTools checkpoints](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/features/checkpoints/devtools/overview.md) query network, console, performance, cookies, storage and a test clipboard. These are captured-data queries, not an agent opening DevTools. [Network capture](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/features/checkpoints/devtools/network.md) is scoped per step, caps bodies at 64KB and requests at 5,000; extract needed values before advancing. A successful HTTP status does not establish business success. An accessible, sufficient API remains preferable to a mandatory UI detour.

**Important rc.3 flags:** installed `run --help` advertises `--chrome-profile`, `--cdp-endpoint`, `--ws-endpoint`, DOM assertions with vision fallback, visual-only assertions, and optional final validation **off by default**. `--mode action` hard-stops on authentication/blocked/error states; default testing mode is lenient. `--agent` selects NDJSON presentation, not a safety policy. The bundled adapter forwards CDP/WebSocket endpoints to the runner. Do not carry the old v0.9 “no Chrome profile” limitation into rc.3 `run`, or assume every subcommand accepts identical flags. Strict action mode is useful for consumer jobs but does not supply action-level authorization.

**Authentication has two layers.** Kane/TestMu credentials authenticate the runtime; target-site sessions authenticate the consumer. Attaching to Chrome or providing a dedicated profile can expose an existing target session, but does not prove remote session transfer, MFA completion, CAPTCHA handling, or account isolation. The [running guide](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/running-tests.md) documents session reuse and browser-state actions. Build around one explicit session per user/job; never assume server Chrome inherits the user's personal browser. Login/setup and artifact retention are product work. Agent docs say default runs upload test cases/screenshots/run details to TestMu; a locally served evidence viewer does not make the entire run local.

**Explore maps and designs; it does not execute its generated tests.** The [tagged exploration guide](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/exploration.md) scopes one exploration URL per project, not all Kane commands. Local exploration supports 1–4 browsers, remote 1–20; this is not a testrun capacity claim. Remote acceptance is not completion. Defaults are mutating, and reruns reset policy/options. Read-only blocks write methods, with setup/allowlisted-POST exceptions and no protection against mutation through page loads. Thus POST blocking can break legitimate reads. A prompt is not an enforced scope boundary, and read-only is not a semantic safety guarantee.

**Mobile is native-app execution.** The [mobile overview](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/mobile/overview.md) requires an app build/id; mobile targets do not currently take a website URL. Local virtual devices require Apple Silicon macOS; real cloud devices and remote virtual suites have account/plan requirements. Real-device replay lacks adaptive healing. Do not promise consumer phone automation or mobile-web coverage from these features.

**Exports and evidence are substantial, but bounded.** [Saved-flow docs](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/testmd/running.md) document first-run authoring, replay, healing, and Python/JavaScript Playwright export. Export is not a new consumer runtime by itself. [Evidence packs](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/evidence.md) are ZIPs containing definitions, outcomes, screenshots, logs and failure records; integrity validation checks the pack, not the truth of conclusions. Persist a named run or saved test when the product needs a project copy. Consume explicit outcomes and correlate run, user, input and artifact revision.

The supplied wrong-total probe and IKEA exploration are cautionary observations, not benchmarks: exploration missed an arithmetic defect; an explicit check caught it; one triage contradicted a screenshot; the consumer exploration had no assertions. A screenshot supports what was rendered. It cannot independently prove correctness, refund entitlement, reversibility, durable server state or pedagogical value. Use deterministic calculations, authoritative state, or reviewed contracts as appropriate; another model agreeing is not an independent oracle.

## Five directions, ranked by runtime fit and consumer value

This ordering favors a real task whose answer depends on current browser state. It is **not** an overall hackathon-win prediction. New actor-led ideas rank above generated artifacts on necessity; their external-access risk can reverse the build-day choice.

### 1. QuoteLens — compare the actual stay I am considering (new)

**Input → operations:** two or three user-supplied accommodation URLs, exact dates, party composition, currency and optional pet. An OpenAI agent resolves the comparison schema; Kane opens each supported site, sets those inputs, opens the price breakdown and extracts visible total, included charges, cancellation terms and configuration. No reservation or payment action.

**Checked facts → failure → output:** assert dates/guest counts/property identity next to the quote; independently sum disclosed charges and normalize nights/currency without inventing missing taxes. Mismatched configuration triggers one correction; blocked/login-only/incomplete totals become unresolved rows. Return a side-by-side decision packet with timestamped screenshots, exact configuration and source links. Refresh on explicit request, not a continuous polling promise.

**Why browser:** configured quotes can differ from search snippets or static descriptions. [Airbnb explains](https://www.airbnb.com/help/article/125) that taxes may appear only at checkout depending on location and that fees vary. Stop earlier and label incomplete if reaching a complete quote requires an unauthorized action. An authorized equivalent API removes the need for UI retrieval.

**Competition/scope:** [Skyvern](https://www.skyvern.com/) already automates browser workflows and extraction. The wedge is carefully matched configurations and missing-cost reconciliation, not “AI browses booking sites.” One supported provider/two listings is a credible day scope only after access succeeds. Anti-bot controls, session privacy, quote drift and multi-minute latency are major risks; prices are observations, never guaranteed offers. No willingness to pay established.

### 2. SlotScout — find a date that satisfies my admission constraints (new)

**Input → operations:** official venue URL, candidate dates, party size and ticket/pass category. Agent creates explicit constraints; Kane selects the correct calendar/category, inspects dates and extracts visible statuses and conditions. It never reserves, joins a queue or creates a hold.

**Checked facts → failure → output:** assert venue/category/month/date, distinguish “available,” “unavailable” and “not checked”; compare chosen candidates against independently parsed dates and user constraints. A calendar reset or wrong category triggers one targeted repeat. Return ranked candidate dates and direct official links; uncertainty stays visible.

**Why browser:** an interactive category-specific calendar can supply current state absent from static opening-hours pages. [Disney's reservation rules](https://disneyland.disney.go.com/en-ca/experience-updates/park-reservations/?redirect=false) tie reservations to availability calendars; this supports the problem, not successful Kane compatibility. A general availability calendar may not establish party-size inventory or eligibility. Do not call its results “bookable for you” without that evidence.

**Competition/scope:** generic agents already navigate websites; a constrained date finder needs fewer steps and clearer unknowns to earn adoption. One calendar adapter and two categories; no accounts initially. If a first-party calendar is already equally easy, or an API supplies equivalent inventory, kill the browser product. Freshness, inaccessible widgets and retries dominate costs. Broader family planning is deliberately outside the day scope.

### 3. PracticeForge — rehearse the exact concept I misunderstood

**Input → operations:** a missed percentage problem plus a familiar context. Agent composes an exercise with request-specific branching or manipulatives. Kane operates the draft URL, submits wrong/right answers, changes controls, resets and reopens it.

**Checked facts → failure → output:** independent integer/rational arithmetic supplies expected results; an explicit transition contract specifies feedback/reset state. One failed journey sends concrete evidence to a bounded repair pass, then reruns that revision. Output is a playable exercise, with unfinished generation honestly withheld.

**Why browser/challenge:** checks can catch stale slider values or feedback attached to the wrong question. But if every request merely changes numbers in one tested template, deterministic schema/content checks carry most value; testing each instance can become manufactured necessity. Generate meaningful composition/branch variation only where it benefits learning, not to create defects for Kane.

**Competition/scope:** [Brilliant](https://brilliant.org/faq/) already combines interactive visual problems and a tutor; [Lovable](https://docs.lovable.dev/features/browser-testing) already tests generated apps through browser journeys. One concept and two reviewed interaction primitives fit the day. Kane checks examples, not teaching quality or universal solvability. This is the strongest controlled-environment fallback, conditional on useful interaction surviving the template objection.

### 4. GatherKit — turn contribution rules into a working gathering page

**Input → operations:** host supplies event details and constraints such as limited dishes/drivers. Agent generates rules and conditional questions; Kane opens the owned draft URL as synthetic guests, claims/edits/withdraws a slot, reloads and checks the host roster.

**Checked facts → failure → output:** independent state transitions determine counts and records. Mismatch repairs the rules/configuration once; success releases a clean event link from the tested immutable configuration, with test participants isolated. Database constraints, not browser evidence, enforce concurrency.

**Why browser/challenge:** guest-to-host rendering and persistence are real browser-observable facts. A fixed renderer with variable labels again weakens per-request necessity. Limit generated rules, and test the specific branches they introduce.

**Competition/scope:** [Jotform AI already previews forms and creates test submissions](https://www.jotform.com/ai/features/preview-forms/); [Partiful](https://help.partiful.com/en-us/articles/15525594-why-use-partiful) already handles invitations, RSVPs and questions. This is crowded and narrower than average-person utility. Guest/host persistence increases one-day work; release isolation must be explicit. Avoid accounts, messaging and payments.

### 5. TaskReceipt — reconcile one completed appointment change

**Input → operations:** a supported confirmation URL and intended new appointment. A product executor performs only an exactly authorized action; Kane independently reopens the authoritative booking view and checks identity, time, timezone and old/new status. This report authorizes no such action.

**Checked facts → failure → output:** corroborate UI with provider read-only API/webhook records where available. A conflict produces “needs reconciliation,” never a blind resubmit. Return the actual new details and unresolved facts, not a generic success badge.

**Why browser/challenge:** useful where only the UI exposes the resulting state. Where APIs already provide sufficient durable truth, mandatory Kane adds little. It cannot infer a cancellation's downstream effects from a button or toast. Authentication, expiring links, duplicate writes and notifications make this the weakest one-day choice despite strong conceptual runtime fit. Generic automation competition is substantial; one real supported integration is required, and a sandbox proves only itself.

## Decision for the parent

Investigate QuoteLens/SlotScout as actor-led alternatives; neither needs generated software to justify browser work. Choose PracticeForge only if external access cannot be responsibly supported and its per-request behavior truly varies. DecisionKit ranks below these: personalized facts in a fixed calculator are primarily a data-validation problem; [Opal](https://developers.google.com/opal/) already builds shareable mini-apps.

For any choice, budget one bounded retry/repair, measure actual wall time and credits, and separate blocked execution from failed assertions. No proposed product has established latency or unit economics. The hackathon needs an honest live consumer outcome, an agent visibly reacting to actual Kane evidence, public same-day code, explicit OpenAI use and reproducible artifacts. Range should come from relevant operations, not unrelated command demonstrations. Preserve time for the required video/deck/blog/distribution work; these remain uncompleted gates, not score claims.
