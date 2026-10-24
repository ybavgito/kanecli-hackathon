# KaneCLI Hackathon

A web-app starter wired for Kane CLI verification.

## Start building

```bash
npm install
npm run dev
```

The app runs at `http://127.0.0.1:5173` by default.

## Verify with Kane

Authenticate once in a separate terminal:

```bash
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
KANE_URL=https://your-deployment.example KANE_OBJECTIVE='Verify a user can create a project and see it in the list.' npm run verify:kane
```

Keep the user flow, acceptance criteria, and any test data in `.testmuai/context.md`.

## Saved tests and parallel suites

One-off checks use `verify:kane`. For flows you want to repeat, save them as
`tests/*_test.md`: the first run authors and records the steps, and later
runs replay the recording.

| Path | Purpose |
| --- | --- |
| `tests/*_test.md` | Tests: YAML frontmatter, then one `## Heading` per step |
| `output-<name>/` | Recordings next to each test (created on first run; commit these) |
| `scripts/run-suite.sh` | Runs all tests as one parallel suite |

```bash
# One test (app must be running)
kane-cli testmd run tests/example_test.md --agent --headless

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

## Field guide

See the [Kane CLI field guide](kane-field-guide.md) for v0.9.0 observations, scripting interfaces, replay behavior and verification limits.
