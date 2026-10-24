# Raising Kane verification and maintenance

**When websites raise hell, raise Kane**

Commands checked on October 24, 2026 with Kane CLI **0.10.0-rc.3**.
The shared project is **KaneAI Generated** (`01M5QFXVQKQ0KCCE24PC0BJXYP`).
Keep `.testmuai/assurance.json`; do not create a local `.context/` store.

## Commands

| Command | What it does |
| --- | --- |
| `npm test` | Runs the Node unit checks. |
| `npm run build` | Builds Raising Kane. |
| `npm run verify:kane:plan` | Validates the two generated URL-validation tests with two workers; executes no browser steps. |
| `npm run verify:kane:suite` | Validates that plan, then runs it in local headless Chrome. |
| `npm run verify:kane:public -- --dry-run` | Plans the seven generated public inspection tests; blocks until their actual variables are filled. |
| `npm run verify:kane:suite -- --suite all --dry-run` | Plans every current generated test, including the human-prepared connection checks. |
| `npm run kane:coverage` | Reads counted shared coverage and writes a machine-readable report. |
| `npm run kane:maintain` | Reads shared sources, use cases, open sessions, coverage and local requirement hashes. No reconciliation or redesign occurs. |

The default `ui` suite contains `reject-unsupported-url-scheme_test.md` and
`reject-embedded-credential-url_test.md`. The latter submits the synthetic URL
already present in the generated requirement test; it never signs in or receives
real website credentials. Both checks are independent and leave source sites
unchanged. `public` selects only read-only inspection tests. `all` is explicit:
it includes takeover, disconnect and a separately prepared human connection,
which are unsuitable for unattended cloud execution.

The shell entry point `scripts/run-suite.sh 2 --dry-run` uses the same wrapper.
It no longer targets the obsolete `tests/*_test.md` glob or accidentally includes
historical/superseded tests. Explicit generated files can also be named:

```sh
npm run verify:kane:suite -- .testmuai/tests/accept-https-without-task-description_test.md --dry-run
```

Start the application with `npm run dev`. The selected tests need real values
in the ignored `.testmuai/variables/assurance.json`; only `start_url` is necessary
for the default UI suite. `KANE_URL` overrides `start_url` for that invocation.
The wrapper does not print values, invent placeholders, or modify the source
variable pool. Missing, empty, conflicting or unresolved variables block the run.
Kane's `valid: true` plan alone does **not** prove that variables are resolved.

Each invocation creates a linked run folder with the selected files directly
under its `.testmuai/tests/` and only the required variable entries. Local run
folders live under ignored `data/verification/`. This isolates concurrent URL
overrides and preserves shared Test Manager case/coverage identity. The wrapper
uses `testrun run` with stdin closed, `--agent`, and an explicit file list.
It never hand-writes or edits a generated test.

The existing strict regression policy is retained: `--no-adaptive-heal` makes a
replay miss fail. Explicit `--adaptive-heal` opts into Kane's normal healing;
a healed result still needs evidence review. `--parallel N` or `KANE_PARALLEL`
sets the worker count. First runs author browser steps and can cost roughly
30–85 credits per test; replay/healing costs vary. A clean CI checkout does not
contain ignored action tapes, so its first runs author from the generated tests.
Metadata without action tapes is not treated as a reusable recording.

Recordings and sealed evidence remain in the linked run folder. Once inspected,
reuse those recordings explicitly without overwriting the source test files:

```sh
npm run verify:kane:suite -- --recordings-from data/verification/kane-suite-XXXXXX
```

Read `data/verification/kane-suite.json` for the actual folder, counts, status and
execution ID. A plan is labeled `planned`; absent terminal results are
`incomplete`. Success requires the suite completion event, complete passing
counts and a zero process exit. A cloud run additionally requires its remote
completion event and exit status. These scripts never equate a plan, skipped
job, authenticated session, or successful build with a browser pass.

## Requirements maintenance

Update the actual requirements document and `.testmuai/context.md` when behavior
changes. First inspect `npm run kane:maintain`, review the source ID and changed
requirement, then explicitly invoke:

```sh
npm run kane:reconcile -- --from .testmuai/requirements/url-first-stage1.md --source-id url-first-stage1
```

**Reconcile can record a new source version. It is not a read-only preview.**
The default maintenance command never invokes it. Shared projects on this RC
refuse `maintain reconcile --plan`, `--apply`, `--mode ci` and `cover gaps`.
Use `cover --mode agent` for shared coverage. Reconcile returns review questions
and/or a session; inspect them and save only the intended session explicitly:

```sh
kane-cli context sessions save SESSION_ID --yes --mode agent
```

Inspect every save's `test_files.written`, `refused`, `replaced`, `error`, and
`test_manager.error`/`waiting`. A saved session does not guarantee every file or
case was written. Run the returned current files directly, then read coverage.
Never rewrite generated step wording simply to make a failing run pass.

To ask Kane to redesign a specific changed use case:

```sh
npm run kane:evolve -- uc-1
```

Exit **3** means paused for review, not a passing result or a timeout. Inspect
the blast radius and question before explicitly resuming with its answer. A
fresh use case needs a real reason through `--because "..."`. The wrapper does
not supply approval answers, batch redesign every use case, use `--force`, or
save sessions automatically. New requirements and tests still use official
assurance extraction/design and the shared-project review/save workflow.

## CI and optional cloud

`.github/workflows/verify.yml` builds and runs unit checks on pushes/PRs, then
runs the two generated UI checks in local headless Chrome when repository
secrets **KANE_USERNAME** and **KANE_ACCESS_KEY** exist. Authentication passes
them as process arguments without printing login output. The generated tests
run on the linked project; the configured folder is the existing Untitled
folder (`01M5QFXW4JRPP77HF88D61TWW9`). No secret values are in the repository.

Absent secrets produce a visible **pending / skipped** summary and a skipped
Kane job. Build/unit jobs may still pass. Configure branch protection to require
the checks your release policy needs; this change does not modify GitHub
settings or secrets. Only compact status JSON is uploaded, not variable files,
screenshots, recordings, raw logs or sealed evidence packs. The shared Test
Manager project retains the runs that Kane publishes.

`.github/workflows/kane-cloud.yml` is a separate manual workflow. It requires a
deployed public HTTPS Raising Kane URL and defaults to **plan only**. Selecting
its `execute` input opts into the grid run and its credit usage. It uses the
same two UI tests, installs the `remote-execution` plugin, checks its doctor,
and performs Kane's remote dry run before dispatch. It does not start a local
server and pretend the cloud can reach it.

For a local operator:

```sh
kane-cli plugin install remote-execution
kane-cli plugin doctor remote-execution
KANE_URL=https://your-raising-kane-deployment.example npm run verify:kane:cloud -- --dry-run
KANE_URL=https://your-raising-kane-deployment.example npm run verify:kane:cloud
```

Replace the illustrative URL with a real reachable deployment. Cloud targets
reject localhost, private IP ranges, local hostnames, credential URLs, and
non-HTTPS app URLs. Cloud runs use a separate temporary linked folder containing
only the selected generated tests and their required nonsecret values, so the
repository, application data and `.env` files are not the payload. Cloud runs
author against that deployment instead of copying local recordings that may
contain localhost. A HyperExecute plan with suitable runners is still required;
plugin readiness alone does not prove account capacity or a successful grid run.

## Evidence for this integration

- The generated two-member local parallel plan validated with no missing-variable warning.
- `npm test` and `npm run build` passed after these changes.
- The cloud localhost guard, missing-variable guard and absent-CI-credentials guard each refused with exit 2 before any test launch. Both workflow files parsed as YAML.
- Shared maintenance reads completed with no open sessions and no source changes.
- Counted coverage remained **1/38 criteria proven, 1.8797% risk-weighted**.
- `remote-execution` **0.5.0** was installed locally; plugin doctor confirmed the plugin, binary and authentication.
- No cloud browser run or GitHub workflow was dispatched. Cloud execution awaits a real deployment and configured GitHub secrets.
- Broader public/takeover tests remain unproven unless their actual Kane evidence says otherwise. The known unsupported-scheme recording previously needed healing; this integration does not claim it became a stable replay.
