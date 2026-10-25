# Explore-driven builder: implementation record

Bounded demo implementation, October 24, 2026. This record supplements the
[architecture plan](explore-driven-builder-plan.md); only the attached verification
results establish tested behavior.

## Product entry and scope

The default entry accepts a supported website URL and an optional intent. Blank intent
is stored as null and selects a strictly read-only overview (contract v2). Choosing
**Build a focused interface** creates a separate build with an explicit supported task.
The overview bridge rejects every source operation, including direct requests. A supplied intent guides the exploration
prompt and the generated composition. This is focus, not permission to expand the source
adapter's supported transaction scope. The person explicitly starts the supported task
shown in the trusted host before any user-session source draft is prepared.

This release accepts Northstar and Linden entry URLs from the local server configuration.
An external URL, credential-bearing URL, another source route or supplied task parameter
is rejected. It does not yet generate arbitrary cross-site applications. Source records
and all transactions are explicitly synthetic. The earlier workflows are preserved at
`/?legacy=1`; existing `?taskId=` links still open their original task.

URL-only mode maps reachable screens and candidate flows within a budget, generates an
overview with local detail/navigation controls. It does not rehearse a transaction.
The independent overview check verifies that its source record remained unchanged.
Focused builds separately inspect the supported mutation branches and validate the final
transaction. Earlier v1 build records retain their original behavior and evidence. It does not promise an exhaustive crawl
or executable support for every flow name. A read-only Explore pass may report a single
screen and no flow records on a form-heavy source. Bounded branch missions establish
actual conditional behavior separately, on disposable synthetic records.

## Runtime implementation

- `server/builder/kane.mjs`: actual Kane Explore, a fresh source project and a separate
  preview project, rc.3 viewer import, paginated map reads, step-linked image extraction,
  and assurance-based candidate verification. No account credentials enter the frontend.
- `server/builder/exploration-api.mjs`: bounded detailed screen, flow and finding reads;
  optional run-fenced Explore write-up. See the [API and branch review](api-and-branch-review.md)
  for what was exercised and why local assurance is kept separate from shared context.
- `server/builder/model.mjs`: a Responses API coding-agent loop using `gpt-6.1-sol`,
  actual image attachments and bounded `inspect_branch` calls. It emits a React component,
  CSS and evidence-linked decisions. This implements the bounded Responses alternative;
  it does not invoke Codex CLI or provide a chat terminal.
- The model receives user intent, fixed requirements, source map/findings, screenshots,
  exact observations, the approved task-state/action API, and prior code/failure evidence
  on repair. It does not receive merchant implementation or the independent evaluator.
- A deterministic Vite build compiles only the approved component with installed React.
  No candidate package installation, shell command, Vite config or build plugin runs.
- `server/builder/preview.mjs`: a trusted host plus an opaque sandboxed generated frame.
  The frame has no network, same-origin storage or approval API. Its messages can request
  supported choices and checks. Approval/submission are controls in the trusted host.
- `server/builder/controller.mjs`: persistent builds, candidates, observations, sessions,
  contract/artifact hashes, promotion checks and at most two automatic repair attempts.
  An interrupted build is blocked after restart; it does not automatically resubmit.
- Existing `server/controller.mjs`, merchant and appointment adapters provide source
  execution, identity/revision-bound grants, duplicate reconciliation and confirmed receipts.
  Source operations remain actual Kane browser jobs. Adapter reads independently check
  the final saved operation; an adapter read is not described as Kane browser evidence.
- Preview verification has a distinct owned Chrome process and does not hold the source
  job queue while it waits. Explore has separate browser ownership and isolated projects.

The static generated-code validator is a capability filter, not a formal JavaScript
security proof. The iframe sandbox, CSP and server-side source scope provide additional
boundaries. Do not enable production accounts by adding a URL to the UI.

## What the user can inspect

The build journal shows actual stages and tool results. “What Kane found” shows captured
source screens, observed transitions and raw finding dispositions. “What it changed”
links generated component decisions to evidence. “What was checked” retains candidate
verdicts, timestamps and exact artifact hashes. Failed builds publish no working-task
entry. Read-only previews remain labeled inspection-only.

Generated criteria retain derived trust. The system does not mark them human-approved.
A successful browser journey is still insufficient without the separately checked source
operation and the exact candidate/contract match. Accessibility findings remain findings;
this implementation does not claim WCAG compliance or screen-reader usability.

## Running

1. Install Node dependencies with `npm ci`.
2. Install and authenticate Kane CLI `0.10.0-rc.3`, and install Chrome.
3. Set `OPENAI_API_KEY` in the private server environment or ignored `.env`.
   The builder defaults to `BUILDER_MODEL=gpt-6.1-sol`.
4. Run `npm run dev`, then open `http://127.0.0.1:5173`.
5. For an immediate demonstration, open a recorded interface under **Demo now**. For fresh generation, choose a demonstration URL, optionally enter an intent, and start the build. See [the demo runbook](../../DEMO.md).

Both OpenAI generation and Kane exploration/execution consume their respective account
credits. A build performs multiple browser jobs and can take several minutes; elapsed
stages are visible and no fabricated percentage is shown. Generated artifacts and raw
local evidence are stored under the private data directory, excluded from git.

## Verification status

See the [builder verification report](builder-verification.md). Unit tests and a frontend
build are necessary checks but do not establish the full browser journey. Earlier input
experiments remain separate from this runtime integration.

## Latency and recorded replay

Source method changes now perform the action and extract/verify the resulting terms in
one browser job. The method-change job reads actual resulting terms rather than trying to make them match the desired refund destination; the controller compares those observations independently. Restoring approved choices combines action and validation only after the user requests correction. Exact
field comparisons, approval and post-submission confirmation remain separate gates.

A blocked build can reuse its captured source observations. The journal labels their
original capture time; each candidate still receives a fresh synthetic transaction.

Candidate verification now retains a per-build workspace keyed by the exact requirement
text. An unchanged requirement reuses its assurance-designed `_test.md` and Kane's
recordings. A stable, unguessable sandbox verification URL resolves to the current
candidate's fresh test session; it never opens a real user session. Changed requirements
receive a different workspace. Completed candidate evidence is copied to its own revision
before a later run updates the shared recordings.

Kane decides which steps can replay: unchanged successful recordings replay; missing or
failed steps are authored. Kane may refresh stale recordings through adaptive healing. The test digest is checked
before and after execution; changed English expectations are rejected. A surviving
browser failure is reported to the coding agent. Runtime results retain Kane's actual
replayed/authored step counts. Merely retaining a recording is not proof it replayed.
Source actions still use bounded one-shot objectives; no source-transaction replay speedup
is claimed. The first discovery/generation/verification run remains relatively expensive.

## Navigable Northstar source

The default store entry is `/store`; the existing `/merchant` return flow is preserved.
The store has a product collection and category links, three product-detail pages, size
availability variants, two orders, delivery history, and returns/delivery/warranty help.
One order is eligible for returns; the older equipment order directs the reader toward
warranty information. Size 9 shoes are sold out while size 8 is available. Every internal
link retains the synthetic record and read-only inspection context. There is no pretend
checkout or warranty submission. These paths exist to make broad and task-focused
discovery materially different, not to inflate the map with empty pages.
