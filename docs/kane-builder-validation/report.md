# Explore-to-builder capability verification

October 24, 2026. **Synthetic capability experiments, not completed Raising Kane product
verification.** These runs inform the [complete build plan](../raising-kane/explore-driven-builder-plan.md).
No generated React interface or runtime coding-agent repair was executed in this experiment.

## Environment and scope

Installed Kane CLI: `0.10.0-rc.3`. The npm registry still reported `rc = 0.10.0-rc.3`,
`latest = 0.9.0`; rc.3 publication: `2026-10-24T16:27:21.712Z`. Codex `exec --help` was
inspected at CLI `0.164.0`; it was not launched to generate an application.

A new project isolated this experiment from existing exploration maps:
`01M5R13G3F6P8E6Y2P2NDPN60Y` (Raising Kane builder capability probe 20261024).
Source: `http://127.0.0.1:38383/`, a public local read-only quote fixture.
Exploration: `01a17012-2034-795b-a4f1-5834c01bd536`.
Run: `01a17012-20fb-7e86-8a47-baf3499378bf`.

The [fixture source](fixture.py) intentionally omits page language, image alternative
text and an input label, and includes low-contrast text. Its two quote links show different
fees/refund destinations. All source interactions are GET requests; it has no submission,
customer account or saved mutation. It is different from the full Northstar merchant
sandbox in the application. A missing-language result on this fixture says nothing about
the accessibility of the existing app.

## Experiment 1: bounded actual Explore

The run used the actual `explore run` command with `--policy read_only`,
`--max-leases 4`, `--max-parallel 1`, `--local-orchestration`, `--headless`,
`--no-context` and `--agent`. The prompt requested return-path mapping, comparison of the
two review outcomes and accessibility findings.

| Measurement | Observed result |
| --- | --- |
| Process exit | 0 |
| Wall time | 52.54 seconds |
| Terminal state | stopped; budget exhausted; `complete: false` |
| Map | 2 junctions/screens, 3 flow records, 3 observations, 5 findings |
| Full credits breakdown | `credits.total = 8.0411775` |
| Top-level credits field | `credits_consumed = 5.6863075` |
| Actual source path | Home → return options; no review URL requested |

Retain the two returned cost fields as distinct values; this experiment does not establish
why the top-level field excludes some reported phases. Neither field is a pricing promise.

Evidence: [terminal result](result.json), [selected event stream](explore-events.ndjson),
[source request log](requests.json), [map summary](map-summary.json),
[screens](junctions.json), [flows](flows.json), [flow details](flow-details.json).
The event stream is a selected derivative, not the complete raw stream or a sealed pack.

### Machine-readable ingestion is feasible, with a version boundary

Started the official `explore view` server on loopback port 7468 for this exploration.
Read its JSON routes:

- `/api/view/summary`
- `/api/view/junctions`, `/api/view/flows`, `/api/view/findings`
- `/api/view/flows/<id>`, `/api/view/findings/<id>`
- `/api/screenshot?junction=<id>` for two actual source screenshots

The lists returned `rows` and `next: null`; this experiment did not test multiple pages.
Retrieved detail records retain identifiers, occurrence evidence, rule details and
observed actions. These are **observed rc.3 viewer implementation endpoints**, not a
public supported SDK or an `explore export` command. A product adapter must pin version,
validate shape, handle pagination/availability and keep account access server-side.
No viewer token or authentication credential is published here.

[Home screenshot](source-screen-0.jpg) · [Return-options screenshot](source-screen-1.jpg)

### Accessibility output was real, but unconfirmed

| Rule | Screen | Returned WCAG reference |
| --- | --- | --- |
| `image-alt` | Home | 1.1.1 Non-text Content, A |
| `html-has-lang` | Home and return options | 3.1.1 Language of Page, A |
| `label` | Return options | 4.1.2 Name, Role, Value, A |
| `color-contrast` | Return options | 1.4.3 Contrast (Minimum), AA |

These are five finding records across four rule types. All five returned
`category: accessibility`, `status: open`, and **`confirmed: false`**. The records include
rule, impact, affected element count, WCAG references, screen ID and evidence metadata.
Preserve the raw disposition; no automatic finding was promoted to “reproduced” by us.

[Finding list](findings.json) · [Complete finding details](finding-details.json).

This proves those detections occurred on this fixture. It does not establish all WCAG
rules, exact checker engine, screen-reader usability, generated-interface accessibility,
closed-loop remediation or whole-site compliance. We did not scan a repaired preview.

### Important limitation: a flow label is not a completed business journey

Two flow records were named “Review QR drop-off return outcome” and “Review printed-label
return outcome,” with `status: verified`. However, their detail records contained only
an action to open the return-options link, with `/return` as the reached URL. The
independent server log contains **no `/review` request** in this run.

The evidence does not support a successful method/fee/refund comparison from Explore
alone. Do not interpret those names/statuses as end-to-end business verification, nor
infer hidden review values from them. This is a bounded-run observation, not a general
claim that Explore can never traverse those branches.

**Design change:** build the journey panel from reached screens and recorded steps.
Display “Reached options; review not checked” for these records. Require focused
execution/extraction before an unresolved business fact may influence an enabled action.

## Experiment 2: precise follow-up mission

Ran one Kane `run` objective against the unchanged fixture, with `--agent`, `--headless`,
`--assertion-failure-mode stop`, `--max-steps 18`, and `--timeout 150`.
It navigated to each method, extracted destination/deduction/refund, and asserted shoes
only and jacket kept. The objective did **not** supply the expected fee or destination.

| Quote | Extracted destination | Deduction | Refund |
| --- | --- | --- | --- |
| Printed label | Original payment | $0.00 | $80.00 USD |
| QR drop-off | Store credit | $5.00 | $75.00 USD |

Result: passed, process exit 0, 9 reported completed steps, 56.2 reported execution seconds,
64.64 seconds wall time, 27.2322325 reported credits. Source request logs independently
showed `/review?method=label` and `/review?method=qr`. A deterministic comparison of the
six extracted values with the fixture constants passed. This checks extraction
correctness; it is not a submission or a completed generated-interface workflow.

[Exact objective](focused-objective.txt) · [Selected result and assertions](focused-result.json) ·
[Step events](focused-steps.json) · [Independent source requests](focused-requests.json).

The result is a deliberate publication subset: account/share metadata and verbose runtime
context are omitted. The original local Kane session is
`a930a587-9af5-4b6e-8499-9d5940d766a7`; its sealed pack remains in the local session's
evidence directory. The files linked here are **not** represented as that sealed pack.

## Artifact checks and implementation consequences

[Artifact checks](artifact-checks.json) verified map counts, screen references, preservation
of unconfirmed status, the incomplete Explore path, exact focused extracted values and
both source review requests. The static fixture remains reproducible with Python; run it
on a different port only with a new appropriately scoped exploration project. Do not
repurpose another person's existing exploration.

1. Real Explore can supply the initial map, accessibility findings and screenshots.
2. Its meaningful business facts still need precise corroboration; bind facts to actual
   steps and source identity, not task-like names.
3. A builder can consume normalized observations, but no generator was tested here.
4. A generated preview still needs its own Explore pass and independent outcome checks.
5. Nested preview-to-source Kane calls need separate execution lanes; this is a code-review
   finding in the existing global worker queue, not a measured deadlock in a built loop.
6. The plan's generation, preview/source correspondence, code rebuild, accessibility fix
   verification and complete live user journey remain implementation acceptance gates.

Browser task totals here do not establish full build latency. No further repeated runs
were necessary to answer these capability questions. The probe server and viewer were
stopped after collecting the evidence; the existing application/teammate browsers were
not stopped or reset.
