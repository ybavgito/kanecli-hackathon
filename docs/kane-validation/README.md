# rc.3 validation artifacts

Start with [the measured report](report.md) and [results.json](results.json). These are synthetic CLI experiments, not the finished Raising Kane application.

The evidence folder contains a real failed guard and its passing rerun after a separate Kane correction. Published copies replace only account username/email metadata; [provenance](evidence/provenance.json) records original hashes, published hashes and integrity results. The original local sealed files are retained separately. Screenshots show synthetic data only.

## Reproduction harness

`extended_checks.py` starts isolated HTTP fixtures and Chrome profiles, executes bounded Kane jobs, records source requests independently, and stops owned processes. It uses the **active Kane account and credits**. Use a fresh output directory for each run. Linux/macOS with Python 3, Chrome and authenticated Kane rc.3 are required; Windows process handling is not implemented.

```bash
export KANE_CLI=/path/to/kane-cli
export KANE_CHROME=/path/to/google-chrome
KANE_TEST_ROOT=/tmp/kane-freshness-recheck python3 docs/kane-validation/extended_checks.py freshness
KANE_TEST_ROOT=/tmp/kane-repair-recheck python3 docs/kane-validation/extended_checks.py repair
```

Modes: `runtime`, `freshness`, `repair`, `suite`, `explore`, `assurance`. Explore additionally requires `KANE_EXPLORE_PROJECT` pointing to a dedicated project with no conflicting exploration. Never use the team's real exploration project for this disposable fixture. Assurance intentionally uses a local store in the scratch directory; it does not link this repository to a shared project.

The harness has been consolidated for reproduction: executable paths are configurable, and the originally separate assurance continuation is combined into the assurance mode. The result log records the original executions. Retain fresh output as a new experiment; do not overwrite the checked-in results and claim they are the same run.

Most probes isolate a CLI behavior using small hand-authored objectives/recordings. They were created before adopting this repository's skill workflow and are retained as research fixtures. They are **not** the pattern for new product acceptance suites: generate those from actual requirements through assurance. The assurance experiment did generate and execute its test through that pipeline.

Raw NDJSON, authenticated profiles, recordings and the context store stay outside the repository. `results.json` is a reduced result ledger. Source-event logs record only synthetic paths and states. No account credentials are needed in a commit.

## Reading the results

Exit zero is not synonymous with every condition passing. Expected failures are essential to these experiments. Read the report's interpretation alongside each command, the command-specific terminal event and source state.

The original stale-page probe intentionally remains in the ledger. Its apparent negative-case pass is explained by the page not being refreshed, with source request logs as corroboration. The corrected freshness probe is recorded separately.
