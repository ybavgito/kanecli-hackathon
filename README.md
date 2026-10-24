# Raising Kane

**When websites raise hell, raise Kane**

This `main` checkout contains the starter and maintained research. The working
PoC is on [`codex/raising-kane-poc`](https://github.com/ybavgito/kanecli-hackathon/tree/codex/raising-kane-poc),
reviewed at `0ad30e5`. It uses Kane during return preparation, conflict detection
and repair; submission remains disabled pending the merchant contract. Read the
[implementation review and priorities](docs/raising-kane/poc-review-and-build-priorities.md)
before treating the full specification as implemented. The checked release is
`0.10.0-rc.3`, October 24, 2026.

## Current product specification

The product is **Raising Kane**: a simpler interface for completing a supported
web task while preserving the user's choices and verifying the source result.
Use the name and tagline above for all new product copy and documentation.

Start with the [Raising Kane project brief](docs/raising-kane/raising-kane-project-brief.md).
It is the current consolidated specification and supersedes the earlier brief
where requirements differ. It adds atomic approval/commit, idempotent submission,
browser continuity, mandatory completion evidence, reload persistence and an
explicit failed-validation/correction demonstration.

- [Review packet index](docs/raising-kane/README.md)
- [Original review packet ZIP](docs/raising-kane-review-packet.zip)
- [Document replacement and verification notes](docs/raising-kane/repository-notes.md)
- [Website-first workflow, preflight checks and two-site demo](docs/raising-kane/workflow-and-demo-design.md)
- [UX research, interaction rules and demo direction](docs/raising-kane/ux-research-and-demo-direction.md)
- [Interactive design storyboard — illustrative states](docs/raising-kane/demo-storyboard.html)
- [50 recorded rc.3 experiment invocations and findings](docs/kane-validation/report.md)
- [Current review bundle](docs/raising-kane-current-review.zip)

The PoC implements part of the specification and has its own runtime evidence.
The atomic source transaction, completed receipt and second source remain open.
Separate synthetic CLI experiments demonstrate parameterized replay with explicit
refresh, session/context handling, Explore and local assurance; they do not prove
those features are integrated into the product. Historical research and the
original packet ZIP remain available for provenance.

The recommended experience is website-first: connect a supported site, choose
from its tested task catalog, make plain decisions, and approve an exact verified
proposal. Rehearse integrations before enabling tasks; recheck the current source
during each user's workflow. The target demo covers a partial return and an appointment
change on two labeled sandboxes.

The [original ClearPath brief](docs/clearpath/clearpath-complete-project-brief.md)
and its [earlier gap review](docs/clearpath/gap-review.md) remain available as history.
The packet now includes the previously missing background research. Its historical
technical review still cites three unavailable machine-local paths, listed in the
repository notes.

## Start building

```bash
npm install
npm run dev
```

The app runs at `http://127.0.0.1:5173` by default.

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
KANE_URL=https://your-deployment.example KANE_OBJECTIVE='Verify a user can create a project and see it in the list.' npm run verify:kane
```

Keep the user flow, acceptance criteria, and any test data in `.testmuai/context.md`.

## Saved tests and parallel suites

One-off checks use `verify:kane`. The existing `tests/example_test.md` is a legacy
smoke test. Generate new requirements-linked tests through the official Kane
skill's assurance workflow below. First execution records the steps; later runs
replay the recording.

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
