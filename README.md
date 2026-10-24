# Raising Kane

**When websites raise hell, raise Kane**

Paste a website URL. Describing a task is optional. Raising Kane uses Kane CLI to
discover actions on the current page, show actual options and consequences, and
check a chosen outcome. A dedicated visible browser supports direct human sign-in.
The generic connection/workflow engine replaces the fixed return entry; the
merchant remains a labeled regression demo at `?demo=merchant`.

The current URL-first contract is [here](docs/raising-kane/url-first-contract.md).
Read the [browser processing audit](docs/raising-kane/browser-privacy-audit.md)
before using personal accounts. Kane processes page content and screenshots
externally; local Chrome is not a local-only guarantee. Sign in only while Kane
is paused, then acknowledge the notice to continue in the same browser.

## Build together

Start with the [two-person build plan](docs/raising-kane/two-person-build.md).
It defines file ownership, the integration contract, and the one-hour POC goal.
The [current project brief](docs/raising-kane/raising-kane-project-brief.md) is the
authoritative specification. Supporting research is indexed in
[the review packet](docs/raising-kane/README.md).

The implementation is in progress. A passing build does not establish that the
full browser journey works. Current verification status is tracked in
[the acceptance context](.testmuai/context.md).

- [Review packet index](docs/raising-kane/README.md)
- [Original review packet ZIP](docs/raising-kane-review-packet.zip)
- [Document replacement and verification notes](docs/raising-kane/repository-notes.md)
- [Website-first workflow, preflight checks and two-site demo](docs/raising-kane/workflow-and-demo-design.md)
- [UX research, interaction rules and demo direction](docs/raising-kane/ux-research-and-demo-direction.md)
- [Interactive design storyboard — illustrative states](docs/raising-kane/demo-storyboard.html)
- [50 recorded rc.3 experiment invocations and findings](docs/kane-validation/report.md)
- [Current review bundle](docs/raising-kane-current-review.zip)

The full product contracts remain partly unimplemented. Separate synthetic
CLI experiments now demonstrate browser checks, a real failure/correction/rerun,
parameterized replay with explicit refresh, session/context handling, Explore and
local assurance. Our return POC has its own [runtime and UI evidence](docs/raising-kane/verification.md).
Neither establishes a completed two-site product. Historical research and the
original packet ZIP remain available for provenance.

The current direction is URL-first discovery on unfamiliar websites, with no
per-site workflow code in the generic engine. Reusable action, question, comparison,
review and receipt components use actual observations. Unsupported or inaccessible
flows stay explicit. The older fixed return/appointment plan is historical.
See [verification notes](docs/raising-kane/verification.md) for executed results;
the presence of an API or a discovered link does not establish a completed flow.

The [original ClearPath brief](docs/clearpath/clearpath-complete-project-brief.md)
and its [earlier gap review](docs/clearpath/gap-review.md) remain available as history.
The packet now includes the previously missing background research. Its historical
technical review still cites three unavailable machine-local paths, listed in the
repository notes.

## Run the proof of concept

```bash
npm install
npm run dev
```

Raising Kane runs at `http://127.0.0.1:5173`. The separate merchant portal is at
`http://127.0.0.1:5173/merchant`. Both use synthetic data. Runtime task and
merchant records are saved in ignored `data/` files.

To enable OpenAI interpretation, copy `.env.example` to `.env` and set
`OPENAI_API_KEY` locally. Without it, the UI explicitly labels its limited sample
parser. Keep `.env` out of Git.

## Verify with Kane

Install the event release candidate and official skill, then authenticate:

```bash
npm install -g @testmuai/kane-cli@rc
npx @testmuai/kane-cli-skill
kane-cli --version
kane-cli login --oauth
```

With the app running, use these commands in another terminal:

```bash
npm run check:kane
npm run verify:kane
```

`verify:kane` emits Kane's NDJSON result. To target another deployment or flow,
set `KANE_URL` and `KANE_OBJECTIVE`:

```bash
KANE_URL=https://your-deployment.example KANE_OBJECTIVE='Verify Raising Kane loads and identifies its merchant sandbox.' npm run verify:kane
```

Keep the user flow, acceptance criteria, and any test data in `.testmuai/context.md`.

## Saved tests and parallel suites

One-off checks use `verify:kane`. Generate new requirements-linked tests through the official Kane
skill's assurance workflow below. First execution records the steps; later runs
replay the recording.

| Path | Purpose |
| --- | --- |
| `.testmuai/tests/*_test.md` | Generated or recorded Kane journeys |
| `output-<name>/` | Recordings next to each test (created on first run; commit these) |
| `scripts/run-suite.sh` | Legacy suite runner for `tests/*_test.md`; pass generated paths explicitly to `testrun` |

```bash
# One test (app must be running)
kane-cli testmd run .testmuai/tests/raising-kane-smoke_test.md --agent --headless

# The whole suite in parallel (use this, not several concurrent testmd runs)
scripts/run-suite.sh 4

# Validate the selection without executing anything
scripts/run-suite.sh 4 --dry-run
```

Exit codes: `0` passed, `1` failed, `2` error, `3` timeout or cancelled.
A failed run is not necessarily a product bug: read `failure.yaml` in the evidence pack.

Guidelines:

- Write one clause per assertion, and end each step with a check on the page state.
- Keep a single objective under about 15 steps; split longer flows.
- Pass the target through `{{base_url}}`; `--url` did not replace literal recorded navigation in the local reproduction check.
- Decide numeric invariants in your own code from values extracted with `store X as 'name'`.
- `.testmuai/evidence/` (sealed run packs) and `.context/` are git-ignored.

## Shared projects and generated tests (0.10 RC)

Use the team's existing Test Manager project ID. Create `requirements.md` from
the actual requirements first, then ingest it and save the returned session:

```bash
kane-cli projects list --agent
kane-cli context ingest requirements.md --project <project-id> --mode agent
kane-cli context sessions save <session-id> --yes --mode agent
kane-cli context list --mode agent
```

Review the proposed use cases before designing. In a shared project, use cases
saved by an agent remain proposed; after review, design uses `--allow-unreviewed`.
Save that design too, fill the requested variables, then run the returned files:

```bash
kane-cli design tests --use-case <use-case-id> --allow-unreviewed --mode agent
kane-cli context sessions save <design-session-id> --yes --mode agent
kane-cli testrun run .testmuai/tests/<generated>_test.md --agent < /dev/null
kane-cli cover --mode agent
```

Replace placeholder IDs and paths with the returned values. Session completion
alone does not save work. Keep generated tests directly in `.testmuai/tests/`
so runs count against the scenario's Test Manager case. Coverage can take up to
five minutes to reflect a run.

A teammate can join and download the project's tests with:

```bash
kane-cli context pull --project <project-id> --mode agent
```

The link is `.testmuai/assurance.json` and applies only to its containing folder.
A folder cannot have both that link and a local `.context/` store. Ordinary
`kane-cli run` uploads still use the profile's configured project.

The suite script selects only legacy `tests/*_test.md` files. Run generated
`.testmuai/tests/` files explicitly as above. This documentation update does not
link the checkout or migrate the existing test.

## Exploration (0.10 RC)

`kane-cli explore` maps screens, flows and findings, and can design tests into
the shared project. It does not execute those tests. Cloud exploration queues on
HyperExecute by default; local orchestration is also available. Exploration
defaults to allowing app data changes; select `--policy read_only` when that is
not intended. Cloud access to localhost needs a LambdaTest tunnel.

See the [current RC field guide](kane-field-guide.md) and the
[measured Explore findings](docs/kane-validation/report.md#explore-scope-and-limits).

## Field guide

See the [Kane CLI field guide](kane-field-guide.md) for current RC workflow notes
and separately labeled v0.9.0 measurements.
