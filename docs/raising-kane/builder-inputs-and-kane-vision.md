# Builder inputs: let GPT-6.1 Sol see through Kane

October 24, 2026. Companion to the [complete build plan](explore-driven-builder-plan.md).
The full application integration remains planned. The separate
[input experiment](../kane-builder-input-validation/report.md) records what was actually
executed with the supplied OpenAI API account and Kane.

## Decision

Give the coding agent **a structured evidence bundle containing actual Kane screenshots,
observed transitions and exact values, plus tools to request missing Kane observations**.
It should see the source through Kane and inspect its own generated preview through Kane.
It does not need a second unrestricted browser or access to source credentials.

A URL string does not make an API model browse that page. A filename inside a text prompt
does not send the image pixels either. The builder service must load an authorized
screenshot and attach it as image input, or provide an image-aware tool result. Keep the
screenshot ID and source context next to the image. [OpenAI image inputs](https://developers.openai.com/api/docs/guides/images-vision).

Screenshots reveal visual hierarchy, image-only instructions, clipped content, disabled
appearance and layout. They do not establish hidden validation, what happens after a
selection, saved backend state or whether a transaction succeeded. Pair images with
observed actions and explicit outcome checks. A complete multi-state evidence bundle can
support generation without further browsing; incomplete or stale evidence should trigger
a targeted Kane request instead of a guess.

## What the builder receives

| Input | Exact contents | What it enables |
| --- | --- | --- |
| User contract | Task, record identity, exclusions, preferences, unresolved choices and required result | Preserve intent rather than copy source defaults |
| Source scope | Allowed source/route, inspect/test mode, account-state label, fixture epoch, capture time | Know where observations apply and what actions are forbidden |
| Explore map | Screens, observed edges, blocked/unexplored paths, raw status and actual reached states | Understand navigation and identify missing branches |
| Visual state set | Real screenshots before/after material choices, errors, overlays and review states | Read the rendered page and its important visual content |
| Semantic state | Sanitized visible text, accessible names/roles, selected values, disabled states and relevant DOM relationships when available | Ground labels and interactions precisely; distinguish a visual affordance from an operable control |
| Transition records | Initial state, action, actual resulting state, changed facts, run/step IDs and screenshots | Learn conditional behavior and dependencies |
| Exact observations | IDs, amounts, units/currency, destination, rules, provenance and freshness | Build correct review fields and comparisons |
| Findings | Accessibility/business/automation categories, reproduction status, affected element/state and evidence | Guide specific improvements without claiming universal compliance |
| Approved build contract | Component APIs, allowed action IDs, state types, design tokens, artifact format and verification requirements | Generate an interface that fits the host and cannot invent execution authority |
| Repair input | Candidate hash, failed requirement, source-versus-preview mismatch, screenshots, selected console diagnostics and previous revision | Change code based on evidence while preserving the original expectation |

Do not dump the whole site into the prompt. Begin with the selected journey and a few
important images; expose the rest through indexed evidence tools. Include relevant
modal/error states rather than dozens of redundant full-page captures. Keep original
images available for inspection and crops associated with their original image and region.
Do not upscale a tiny unreadable capture and call it higher-quality evidence.

Raw HTML is optional supporting evidence, not the source of truth. Initial HTML may miss
hydrated content and image/canvas text; rendered DOM may include hidden alternatives or
old values. Record whether a snapshot is initial HTML, current DOM, semantic text or an
accessibility tree. Do not claim Kane has a particular DOM-export API until that surface
is verified. The experiment used fixture HTML plus Kane screenshots/extractions; it did
not establish a generic Kane DOM exporter.

## A screenshot must identify a state

Proposed stored record, with illustrative values:

```json
{
  "id": "shot-qr-review",
  "sourceEnvironmentId": "return-sandbox",
  "runId": "actual-run-id",
  "stepId": "actual-step-id",
  "stateId": "return-review-qr",
  "capturedAt": "actual-capture-time",
  "url": "sanitized-source-url",
  "viewport": { "width": 1440, "height": 900 },
  "scope": "viewport",
  "preconditions": ["Order DEMO selected", "QR method selected"],
  "artifactHash": "sha256-of-image",
  "redactionStatus": "reviewed",
  "observedFactIds": ["refund-destination", "deduction"]
}
```

Use actual recorded metadata; never invent missing viewport/time/step values. In a source
record, `artifactHash` above identifies the screenshot bytes, not the generated application.
The generated candidate has its own independent hash. Before/after images must belong to
the same relevant task/record and compatible source versions; do not connect unrelated
screens just because their URLs look similar.

A source journey should show: initial choice → actual action → resulting screenshot →
observed changed facts. The UI's “What Kane changed” links that observation to a generated
component and later test result. Captured images may be included from recorded runs, but
must carry their original timestamp and be labeled recorded rather than live.

## Where Kane's images come from

The earlier Explore probe retrieved actual source images via its local viewer's
`/api/screenshot?junction=<id>` route and fetched flow/finding details. Those are observed
rc.3 implementation endpoints, not a stable public export SDK. The new input experiment
also extracted screenshots from ordinary Kane sealed execution packs. Its helper selected
the final screenshot for bounded missions ending in a known state and checked the initial
image visually. A production importer must map the pack's step/image metadata explicitly;
lexically choosing a filename is not a sufficient general-purpose state matcher.

For each needed branch, request a bounded Kane mission with a precise stopping state.
Save its output values, step trace and screenshot together. An Explore flow name saying
“review” does not prove it reached that screen: the previous experiment found exactly
that mismatch. Use explicit reached-state checks before giving a purported review image
to the builder.

A finished execution pack is historical evidence, not a live video feed. Live screenshots,
recorded screenshots, extracted values and current source assertions have different
freshness. A screenshot that looked right yesterday cannot authorize a changed quote today.

## Tools the builder can request

These are proposed Raising Kane broker tools, not native Kane commands:

- `get_state_evidence(stateId)`: fetch authorized screenshot, semantic observations,
  provenance and unresolved questions for a previously observed state.
- `inspect_branch(taskId, fromStateId, question)`: ask Kane to resolve one necessary
  behavior under the immutable execution context; return reached states, images and facts.
- `inspect_preview(candidateId, requirementIds)`: operate the generated candidate with
  Kane and return evidence tied to that artifact and the independent requirements.
- `read_finding(findingId)`: fetch the actual finding details and reproduction status.

The model chooses the question. The controller chooses permitted browser actions,
credentials, domains, limits and the environment. It may reject the request. Source
inspection and preview inspection use separate browser ownership and queue lanes.
Never give a repair request authority to bypass a denied source operation.

For the hackathon the source inspector should expose a few typed questions/actions for
the supported workflow rather than arbitrary JavaScript evaluation or unrestricted
click coordinates. Expand capabilities only after the execution boundary is established.
The input experiment's tool accepts only a method enum and invokes a bounded real Kane
mission; it cannot submit, choose another URL or issue arbitrary API requests.

## Model choice and what it changes

Use **`gpt-6.1-sol`** as requested. Its official model page lists image input, coding,
structured output and function calling through the Responses API. The supplied API
account listed the model, and the experiment uses that exact ID. [Model documentation](https://developers.openai.com/api/docs/models/gpt-6.1-sol).

Give it responsibility for understanding the multimodal evidence, deciding which missing
branch to inspect, writing the interface/module and action manifest, and revising code
from verification failures. Deterministic application code still validates schemas,
compares amounts/identities, enforces permissions and promotes a candidate. Kane still
performs the browser observations and outcome checks. Model quality does not substitute
for either boundary.

The production plan can use Codex configured with this model as its code-editing runner,
or a bounded Responses tool loop that emits artifacts. This experiment uses the latter
and produces HTML/CSS/JS previews. It does not prove Codex workspace editing, a React build,
source action integration or automatic rebuilds. Do not describe its offline preview as
the completed Raising Kane product.

Start with the same medium reasoning setting used in the input experiment; measure the
real task before changing effort or processing tier. No need to add multi-agent delegation,
computer-use control or hosted shell merely because the model supports them. The task
already has a browser operator in Kane. Keep model ID/settings/usage with each build.

## Protect the evidence boundary

Source content, images and text can contain instructions aimed at the agent. Treat all
of them as untrusted observations. They cannot change the user's contract, tool policy,
allowed source or promotion rules. Do not give the builder source fixture implementation
or oracle answers and then claim it discovered their behavior visually.

Use a server-side evidence allowlist and task-scoped references. Exclude login/OTP screens,
cookies, authorization headers and raw account HTML/network bodies containing secrets.
Sanitize relevant text/URLs and review/redact screenshots before adding them to a builder
bundle. A `secret: false` extraction flag does not sanitize a screenshot or arbitrary
terminal summary. If redaction cannot preserve the necessary fact safely, stop and show
that limitation. Tests use synthetic records.

The connection notice must cover both recipients: Kane processing through TestMu AI and
the selected observations/images sent to OpenAI for generation. The PoC's existing
TestMu-only wording does not describe that additional builder transfer. Credentials stay
in the worker/broker; they are never included in a model prompt, screenshot or artifact.

## Implement next

1. Reuse the latest PoC's typed observation extraction and persisted result/evidence IDs.
2. Add the version-pinned Kane image importer and state-to-image provenance records.
3. Construct a task-focused bundle with actual image attachments and explicit unknowns.
4. Add one bounded inspection tool so `gpt-6.1-sol` can request missing source branches.
5. Generate the isolated interface/module; show observation → component links.
6. Let Kane operate that candidate and compare it with the independently specified source
   behavior. Feed failures and images back into the coding job; retain revision history.

Promotion still requires the checks in the complete plan. A beautiful screenshot-derived
interface that cannot execute or reflect the source task remains an unverified preview.
