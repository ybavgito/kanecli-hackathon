# What evidence does the interface builder need?

October 24, 2026. **Executed API experiment using `gpt-6.1-sol`, with actual Kane source
screenshots and browser inspections.** This is a small input comparison on one synthetic
fixture, not a general benchmark or the completed Raising Kane application.

## Question and design

Can the builder see enough from HTML? What do Kane screenshots add? Can it request missing
source states, and can a prepared multi-state screenshot bundle substitute for those requests?

The source fixture is a read-only return-method page. Its HTML contains method buttons
and an image reference. The image visibly says QR drop-off requires photo ID and limits
parcels to 4 kg; those words are absent from the supplied HTML. Selecting either method
fetches a read-only quote and reveals destination, deduction and refund. Those six values
are also absent from the initial HTML and initial screenshot.

Every model condition used the same task, instructions, output schema, `gpt-6.1-sol`,
medium reasoning and 6,000 output-token cap. The requested artifact was a small standalone
HTML/CSS/JS comparison that switches methods and shows known facts or explicit unknowns.
It was deliberately an **offline evidence preview** with no transaction or source bridge.
The model did not receive fixture implementation, oracle values or source API responses
unless an allowed Kane inspection actually extracted them.

## Results

| Condition | Evidence supplied | Correctly known target facts | Unknown target facts | Incorrect claimed target facts | Model/loop wall time |
| --- | --- | --- | --- | --- | --- |
| HTML only | Initial source HTML | 0/8 | 8 | 0 | 19.70 s |
| Initial screenshot | HTML + Kane's initial rendered screenshot | 2/8 | 6 | 0 | 18.16 s |
| Agentic inspection | Same initial inputs + bounded Kane method-inspection tool | 8/8 | 0 | 0 | 102.42 s |
| Prepared flow bundle | HTML + initial, printed-label and QR Kane screenshots, with state labels; no extracted quote values or tool | 8/8 | 0 | 0 | 21.45 s |

The first two conditions behaved appropriately by retaining unknowns. These are evidence
completeness measurements, not claims that those model runs were erroneous. All eight
claimed values in the last two conditions matched the independently defined source oracle.

Wall times exclude the common initial screenshot capture (47.68 s). Agentic time includes
two actual Kane source inspections and three model requests. Prepared-bundle time excludes
the earlier Kane work that produced its images; it is **not free discovery or a fair
end-to-end latency comparison**. No repeated samples, seeds, alternative models or external
websites were tested.

[Comparison checks](comparison-checks.json) · [Model usage/tool ledger](comparison.json) ·
[Common builder instructions](builder-instructions.txt) · [Source HTML](source.html).

## What the agent actually requested

The Responses API exposed one typed function, `inspect_return_method`, accepting only
`label` or `qr`. It dispatched a real Kane mission to the fixed synthetic source, clicked
the selected method, checked the reached state, extracted its terms and returned a source
screenshot. It could not choose another site, submit, edit fixture code or make arbitrary
HTTP requests. The model voluntarily requested **Printed label**, then **QR drop-off**,
before generating the final artifact.

Kane observed:

- Printed label: Original payment, $0.00 deduction, $80.00 USD refund.
- QR drop-off: Store credit, $5.00 deduction, $75.00 USD refund.

Both source runs passed. The final generated interface marks QR's store-credit destination
as a conflict with the user's original-payment preference. The screenshot-enabled outputs
turn image-only instructions into readable text in the simplified interface.

[Initial Kane result](initial-result.json) · [Printed-label result](tool-label-result.json) ·
[QR result](tool-qr-result.json).

## Actual screenshots and generated code

- [Kane initial screenshot](initial-last.jpg)
- [Kane printed-label screenshot](tool-label-last.jpg)
- [Kane QR screenshot](tool-qr-last.jpg)
- [HTML-only generated preview](generated/html-only.html)
- [Initial-screenshot generated preview](generated/screenshot.html)
- [Agentic generated preview](generated/agentic.html)
- [Prepared-flow-bundle generated preview](generated/flow-bundle.html)

The generated files are unedited model output. The host applied a restrictive preview
CSP, including `connect-src 'none'`, `form-action 'none'`, and `sandbox allow-scripts`.
The fixture exposes no saved mutation/submission route. A static check also found no
external URLs, fetch calls, XHR or WebSocket use in the artifacts; that check alone is
not a general proof of sandbox security.

The source screenshots came from actual Kane evidence packs. The experimental helper
selected the final screenshot of each bounded run and visually inspected the initial
capture. Production must use explicit step/image metadata, not filename ordering alone.
Published results omit local session paths and account/share metadata; these selected
files are not represented as original sealed evidence packs.

## Generated-interface verification

Kane assurance designed a single comparison journey from independent fixture requirements.
It checks visible user intent, method selection, corresponding refund terms, the QR
conflict/instructions, and absence of transaction claims. Its 17 derived criteria remain
unreviewed; execution does not make them human-approved product requirements.

The generated agentic artifact is the browser-verification target. The other three
artifacts have their returned facts and code inspected, but do not receive separate
browser-verification claims.

**Passed:** all five journey steps, 140 seconds, no adaptive healing. Kane locally
reported 17/17 derived criteria proven for this one journey. This is scoped fixture
coverage, not application-wide coverage or human approval of those criteria.

The separate evidence-ingestion event reported `failed`; bundle synchronization and test
upload reported success, and the local sealed pack exists. We retain that limitation
rather than claiming every evidence pipeline stage succeeded.

[Independent requirements](preview-requirements.md) · [Assurance-generated test](preview-assurance-test.md) ·
[Selected terminal events](preview-verification.json) · [Verified QR preview screenshot](preview-qr-verified.jpg).

The check established that the offline generated UI displays and switches the independently
specified facts. It did not submit a return, verify a live source bridge, or exercise an
automatic rebuild. No failure was manufactured to produce a red-to-green demo.

## Interpretation for Raising Kane

**Use Kane as the builder's eyes.** A complete set of state screenshots can be enough for
this initial offline build. Give the agent optional bounded Kane tools to fill missing
branches or refresh stale observations. Pair images with structured exact facts and the
user contract; do not rely solely on visual reading for amounts, identities or saved state.

The latest PoC code already preserves typed observations, evidence references and saved
read-only results. It does not yet supply those images to a runtime coding agent or
perform a generated-code rebuild loop. See the [latest branch review](../raising-kane/latest-code-and-builder-gap.md).

This experiment demonstrates vision input, model-selected Kane calls, actual generated
HTML/CSS/JS and the separately recorded preview checks. It does not demonstrate a full
React/Codex build workspace, live source-action bindings, production authentication,
transaction safety, automated accessibility remediation or code rebuilding after failure.
No defect was intentionally inserted into the generated code.

## Reproduction and credential handling

The [reproduction scripts](reproduce/compare.py) use `OPENAI_API_KEY` from the execution
environment; no credential is included in artifacts or repository files. The original
experiment used only the user-authorized OpenAI account. Source browser operations used
the already-authenticated Kane account. Model and Kane usage are separate.

Prerequisites: Python with Pillow, Chrome, authenticated Kane CLI `0.10.0-rc.3`, an OpenAI
API account with `gpt-6.1-sol`, and a free local port 38491. Copy the reproduction scripts
to a scratch directory, set `RK_INPUT_EXPERIMENT_DIR` to that directory, start `fixture.py`,
then run `kane_helper.py`, `compare.py`, and `flow_bundle.py` in that order. Scripts make
paid model/Kane calls. Captures and generated previews are synthetic; do not substitute
customer accounts without implementing the planned source guardrails.

The fixture, comparison and requirements are separate from the application implementation.
The current API key was not copied into scripts, shell arguments, model prompts, published
logs or git. The key supplied in chat should be rotated because it is now part of the
conversation history.
