# Explore-driven builder: implementation record

Implementation in progress, October 24, 2026. This record supplements the
[architecture plan](explore-driven-builder-plan.md); only the attached verification
results establish tested behavior.

## Product entry and scope

The default entry accepts a supported website URL and an optional intent. Blank intent
is stored as null and selects overview mode. A supplied intent guides the exploration
prompt and the generated composition. This is focus, not permission to expand the source
adapter's supported transaction scope. The person explicitly starts the supported task
shown in the trusted host before any user-session source draft is prepared.

This release accepts Northstar and Linden entry URLs from the local server configuration.
An external URL, credential-bearing URL, another source route or supplied task parameter
is rejected. It does not yet generate arbitrary cross-site applications. Source records
and all transactions are explicitly synthetic. The earlier workflows are preserved at
`/?legacy=1`; existing `?taskId=` links still open their original task.

URL-only mode maps reachable screens and candidate flows within a budget, generates an
overview, and shows observed alternate branches. It does not promise an exhaustive crawl
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
5. Choose a demonstration URL, optionally enter an intent, and start the build.

Both OpenAI generation and Kane exploration/execution consume their respective account
credits. A build performs multiple browser jobs and can take several minutes; elapsed
stages are visible and no fabricated percentage is shown. Generated artifacts and raw
local evidence are stored under the private data directory, excluded from git.

## Verification status

See the implementation verification report once published. Unit tests and a frontend
build are necessary checks but do not establish the full browser journey. Earlier input
experiments remain separate from this runtime integration.
