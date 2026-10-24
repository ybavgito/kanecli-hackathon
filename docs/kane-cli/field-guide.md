# Kane CLI field guide: how to run it, and what it is good and bad at

Measured with `@testmuai/kane-cli` v0.9.0 on small test apps, one machine, October 2026. Independent field notes for developers evaluating browser-test workflows; this is not official guidance. Treat timings as indicative, not as benchmarks.

## TL;DR

Kane CLI is a replay-first browser agent: author a flow once, replay the recording, and use `testrun` for parallel suites. The table after this list distinguishes reported run observations from package checks and documentation; a separate section records fresh reproduction results.

1. **Author once, then replay.** A 3 to 4 step flow took about 2 minutes to author; passing replays took 14 to 18 seconds in these small examples.
2. **`--url` does not retarget a replay.** Verified with server logs on a clean recording: the original port took all 6 requests and the new one took none. A recording damaged by a healed run is re-authored instead, which took 84 seconds. Use a `{{base_url}}` variable.
3. **Parallel runs go through `testrun run --parallel N`.** Concurrent standalone `testmd run` processes can interfere with each other. A fresh two-process check produced one pass and one failure; both passed as a suite.
4. **Healing is a separate pass.** On 5 members it took 96 s against 35 s for strict replay. It rewrote `execution.json`, a step's actions and `Result.md`; a strict replay only appended to the run history in `meta.json`.
5. **`failed` does not mean a bug was found.** In the evidence pack, a genuine assertion failure and an infrastructure error are both `broken`. Tell them apart by the message in `failure.yaml`: `assertion_failed` or `TargetClosedError`.
6. **Every run needs internet, including a pure replay.** Offline, a replay exits 2 with "TMS did not return an org\_id".
7. **Build on the terminal event and the exit code.** `run_end` (run), `test_md_done` (testmd), `testrun_done` (testrun). Exit codes are 0 pass, 1 fail, 2 error, 3 timeout or cancel.
8. **The evidence pack is a plain zip** with screenshots, a HAR, console logs and a failure record. In failing runs its model-written triage named the actual bug.
9. **`--analyzer-only` works.** It judged 3 conditions on a Chrome started separately in 15 seconds, and exited 0 even though one condition was false.
10. **Kane verifies stated expectations well and discovers problems poorly.** Give it explicit, single-clause assertions and decide numeric invariants in your own code.
11. **Not run at all:** mobile, the assurance commands, the agent skill install, the GitHub Action and headless login with an access key. Their details come from the docs.

## How much of this is verified

"Verified by run" labels observations reported in the original field notes. The original raw artifacts are not included here; this label does not mean every observation has been independently reproduced. Fresh checks are listed separately below.

| Claim | Status | Evidence |
| --- | --- | --- |
| Authoring, replay and failure timings | Reported observations | Small test apps on one machine |
| `--url` does not retarget a replay | Verified by run | Clean recording, `replay_decisions: 3`, request counts per server |
| `testrun --parallel` works; concurrent standalone `testmd` runs interfere | `testrun`: reproduced. Interference: reproduced (1 of 2 failed); cause not established | Original notes sampled both Chrome processes on port 9222 and saw `TargetClosedError`; a fresh two-process check gave one pass and one failure, and both passed as a suite |
| Healing rewrites recordings, strict replay does not | Verified by run | Checksums of the test folder before and after |
| Healing passes a cosmetic change and still fails real bugs | Verified by run, small sample | 1 cosmetic variant, 3 real bugs |
| A replay needs internet | Verified by run | Network namespace with loopback only, exit 2 |
| `--analyzer-only` against an external Chrome | Verified by run | 3 conditions, correct verdicts |
| Stream shapes, `run_end` keys, exit codes | Verified by run | Captured `run`, `testmd` and `testrun` streams |
| Evidence pack layout and `failure.yaml` | Verified by run | Unzipped packs from these runs |
| Loops (`@while`) and the live event stream | Verified by run | One run each |
| Recordings survive a re-implementation of the same UI | Verified by run, simple pages only | Several separately written servers |
| Flag lists | Verified in the package | Installed `--help` output |
| `testrun` needs `< /dev/null`; `ask_user` is off without a terminal | Documented only | Docs; stdin was always redirected |
| Agent skill, status strip, GitHub Action | Documented only | Not installed or run |
| Mobile and real devices, plan requirements | Documented only | Not run |
| Assurance commands (`context`, `design`, `cover`) | Documented only | Not run |
| Headless login with an access key | Documented only | OAuth was used |

## Fresh reproduction checks

Checked on October 24, 2026, with the installed v0.9.0 CLI on macOS. Two local HTTP servers served the same page containing a single heading. One step navigated to the first server's literal URL and asserted that heading. Adaptive healing was disabled throughout.

- **Authoring baseline:** the one-step test passed (exit 0).
- **URL override:** replaying with `--url` pointing to the second server passed (exit 0), with one replay decision and zero author decisions. During that run the original server received 2 requests; the second received 0. This confirms that `--url` did not replace the recorded literal navigation in this test.
- **Concurrent standalone runs:** two copies of that recording ran simultaneously. One passed (exit 0); one failed (exit 1), with `action_failed: navigate @ step 1` in its evidence pack. This reproduces interference, but does not establish its cause or mean both processes always fail.
- **Parallel suite:** those two test copies both passed under `testrun run a_test.md b_test.md --parallel 2 --agent --headless --no-adaptive-heal < /dev/null` (exit 0; 2 passed, 0 failed or broken).

The copies had separate test filenames and output folders. These checks cover a tiny static page, two workers and a literal recorded URL; they do not establish behavior for every app, variable-based navigation or larger suites. Other measurements below remain historical observations from the original field notes.

## Integration surface

Build integrations around the CLI's NDJSON stdout, exit codes and evidence files. Use `run` for one-off checks, `testmd run` for a saved test and `testrun run` for a suite. The sections below describe those interfaces and how to read their results.

## Setup

Install, sign in and run one flow before relying on it, so the first real run is not also the first install.

1. **Install:** `npm install -g @testmuai/kane-cli` (Node 18 or newer), or `brew install LambdaTest/kane/kane-cli`. Google Chrome (stable) must be installed. A non-standard path goes in `KANE_CLI_CHROME_PATH`.
2. **Sign in:** `kane-cli login --oauth`. The CLI waits on a `http://127.0.0.1:<port>/callback` address, so the browser that completes the sign-in must run on the same machine. It opens the system default browser, which decides which Google session is used. Headless machines are documented to use `kane-cli login --username <user> --access-key <key>`, with the key from the TestMu dashboard under Settings, Keys; this was not run.
3. **Check:** `kane-cli whoami`. Confirm `whoami` shows the account you intend after every login.
4. **Run one flow:** `kane-cli run "Go to https://example.com and assert the page title contains 'Example'" --agent --headless`.
5. **Keep the internet on.** Verified: with only a loopback interface, a replay exits 2 in 2 seconds with "TMS did not return an org\_id".
6. **Agent skill (optional, documented, not run):** `npx @testmuai/kane-cli-skill` for Claude Code, Codex CLI and Gemini CLI, then restart the agent. Cursor and Copilot read an `AGENTS.md` instead. `npx @testmuai/kane-cli-skill strip enable` adds a live status line to Claude Code and edits its settings file with a backup.
7. **Mobile (documented, not run):** on an Apple Silicon Mac with Xcode 16 or newer, `kane-cli doctor --target simulator --install`. Check the current product documentation for real-device access requirements.

Each run is saved to a Test Manager project (the first sign-in auto-selected one). Tag runs with `KANE_CLI_USER_AGENT=<your-agent>` as the skill documents; its effect was not checked.

## Commands worth knowing

Four commands do almost everything: `run` for one-offs, `testmd run` for one saved test, `testrun run` for suites, and `evidence` for proof. All flags below were confirmed in the installed v0.9.0 `--help`.

| Command | Use it for | Notes |
| --- | --- | --- |
| `kane-cli run "<objective>" --agent --headless --timeout N` | One-shot task or check | Start the objective with `Go to <url> and`. `--name x` writes `.testmuai/tests/x_test.md` and a pack in `.testmuai/evidence/` (verified). |
| `kane-cli testmd run <file> --agent` | Author a saved test, or replay it | Verified in `--help`: `--no-adaptive-heal`, `--author`, `--variables`, `--variables-file`, `--on-lock-conflict`, `--bug-detection`, `--name`, `--timeout`. There is no `--chrome-profile` (it errors with `unknown option`). |
| `kane-cli testrun run [paths] --parallel N < /dev/null` | A suite as one execution, one exit code, one evidence pack | Verified in `--help`: `--match`, `--tags`, `--parallel`, `--on-failure`, `--dry-run`, `--remote`, `--no-adaptive-heal`, `--author`, `--bug-detection`, `--headless`, `--stream-members`. There is no `--timeout` and no `--variables`. It takes file paths, or none to scan the current folder; a folder argument is refused. |
| `kane-cli run --analyzer-only --condition "..." --agent` | Judge true or false conditions on the current page | Verified: 3 conditions on an external Chrome (`--cdp-endpoint`, `--allow-missing-url`) took 15 s. Verdicts come in `run_end.condition_results` in condition order. Exit 0 means judged, not true. |
| `kane-cli evidence serve\|validate\|merge` | Open, check or combine evidence packs | In `--help`. Packs were read with `unzip`; these subcommands were not run. |
| `kane-cli context ingest\|extract\|review`, `design tests`, `cover`, `cover gaps`, `maintain reconcile` | Requirements to tests to coverage | Documented, not run. Interactive by default; use `--mode agent` or `--mode ci` when headless. |
| `kane-cli login`, `whoami`, `profiles`, `config` | Account and defaults | `login --oauth` and `whoami` verified. |
| `kane-cli devices list`, `apps list`, `doctor --target ...` | Mobile setup | Documented, not run. Simulator and emulator need an Apple Silicon Mac. |

**Flags that matter**

- `--agent` gives NDJSON on stdout and the UI on stderr (verified). The help text says it turns on by itself when stdin is not a terminal.
- `--headless` is needed on a machine without a display (documented).
- `--no-adaptive-heal` makes a replay miss final. Verified: it left the recording content alone and only added a history entry in `meta.json`.
- `--cdp-endpoint <url>` attaches to a Chrome started with remote debugging. Verified with `--analyzer-only`; not tried with a normal run. `--ws-endpoint` attaches to a Playwright websocket (documented).
- `--assertion-mode dom|visual` defaults to `dom` with a vision fallback (from the help text).
- `--bug-detection off|stop|continue` flags suspected product bugs while authoring. A confirmed one is documented as `result_code: "740"` plus a verdict.
- `--session-context <json>` chains runs by passing the `context` object from a previous `run_end` (documented, not run).
- `--dataset-id` and `--dataset-row` use a Test Manager dataset row as the parameters (in the help text, not run).

## Authoring, replay and healing

Every saved test works the same way: the first run authors each step with the AI and records it, later runs replay the recording with no AI, and a replay that breaks may trigger healing.

**The test file.** A `_test.md` has YAML frontmatter, then one `## Heading` per step with a plain-English objective. Useful frontmatter keys: `mode`, `url`, `tags`, `max_steps`, `variables`, `chrome_profile`, `target`, `headless`. A step can be a single `@import ./helpers/login.md` line.

**Where recordings live.** Next to the test: `output-<name>/Result.md` (human report) and `output-<name>/.internal/` (`execution.json`, `steps/`, `meta.json`). The folder is commit-safe, so teammates and CI replay the same recordings.

**When a step replays.** A step replays only if its recording exists, its text and its YAML block are unchanged, and no earlier step was invalidated. Editing step N re-authors step N and every authorable step after it. `--author` forces re-authoring. Steps marked `@db`, `@api`, `@js`, `@smartui`, `@network_query` or `@network_assertion` are replay-only and cannot be re-authored.

**What a replay stores.**

- A step that navigates to a hard-coded URL keeps that URL, and `--url` on a replay does not change it. Verified: with a clean recording and `--url` pointing at a second server, the original server took all 6 requests and the second took none.
- With `{{base_url}}` in step 1, the recording stored the URL as a variable value, and a run with another value went to the new address. Verified: a replay with `base_url` set to a broken variant's port failed at the step that variant breaks.
- Variables given with `--variables` appear in the recording as `{{global.name}}`. Variables set in the file's frontmatter worked the same in a solo replay (verified).
- Kane adds steps of its own to a recording. `refresh`, `clear_local_storage` and `wait` steps appeared in a pack's `result.yaml`.
- Assertions default to DOM checks with a vision fallback (documented). DOM checks and vision checks were not measured separately.

**Adaptive healing.** When a replay step fails, the runner tries up to three shrinking replay windows, then re-authors the failing steps (documented; only `adaptive_heal.triggered` being true was confirmed). Observed:

- Verified by checksum: a healing run on a failing replay rewrote `execution.json`, a step's `actions.ndjson`, `meta.json` and `Result.md`, and marked that run `valid: false` in the run history. A strict run changed only `meta.json`, which gained one history entry.
- Verified: the damaged recording was not replayed on the next run. All 3 steps were re-authored (`author_decisions: 3`), which took 84 seconds.
- Timing: one failing step took 79 seconds with healing, against 35 seconds without. Five members took 96 seconds against 35 seconds.
- Effect: it did not hide any of 3 real bugs, and it passed 1 renamed button after 90 seconds. That is a small sample.

**Recordings survive a re-implementation of the same UI.** A flow recorded on one hand-written app replayed 5 of 5 on three separately written servers, and an email flow recorded on one app also ran correctly on two others. This held while the pages kept the same visible labels (button text, field label), which suggests recordings match elements by what they say, not by app-specific selectors. Only simple pages were tried.

**Writing objectives that replay well (documented guidance; only the store-as pattern was verified).**

- Name the start URL or use `url:` in frontmatter. Phrase actions as goals and keep exact values literal or in variables.
- End every step with a claim about the page state, such as `then verify the cart shows 2 items`. A closing assertion is what makes a replay pass or fail on the real end state.
- Use `store X as 'name'` for anything you need back. Vague words like `read` or `tell me` observe without saving.
- Keep a single objective under about 15 steps. Split longer flows.

**Loops (`@while`, `@if`).** The marker goes after a step label, for example `## Waiting room is showing @while` with the condition as the step body, then the loop steps, then `## Queue is over @end-while`. A marker with no label is refused at parse time with a message that shows the fix. A flow authored against a waiting room waited out a 20 second queue (3 iterations of a 2 second wait) and finished. A recorded loop is dynamic: it waits a different number of times each run. But a loop has a default cap of 5 iterations, a 500 ms settle and fail-on-exhaustion (reported observation; not independently reproduced). With a 40 second queue the replay looped 5 times, moved on with the room still closed, and failed. For long waits put a long wait inside the loop (for example 10 seconds). Control-flow tests are documented in the CLI's own error text as agent-mode only, so run them with `--agent`. Marker lines count as steps in the totals, and each loop iteration emits its own step events.

## Output contract for scripts and agents

With `--agent`, stdout is one JSON object per line and the last meaningful line differs by command, so key on the terminal event plus the exit code.

| Command | Terminal event | Other events worth reading |
| --- | --- | --- |
| `run` | `run_end` | Untyped progress lines `{step, status, remark}` where status is `running`, `done` or `failed`. There is no `run_start` in this stream. |
| `testmd run` | `test_md_done` | `test_md_step_start`, `test_md_step_end`, inner `step_event` lines (screenshot, reasoning, action, assertion), `test_md_summary` with `replay_decisions`, `author_decisions` and `adaptive_heal.triggered`. |
| `testrun run` | `testrun_done` | `testrun_plan`, `testrun_member_end` (path, status, duration\_s), `testrun_summary` with `totals`. |

**Fields in `run_end`** (verified from a real run): `status`, `summary`, `one_liner`, `reason`, `reason_code`, `result_code`, `duration`, `final_state`, `context`, `run_id`, `session_dir`, `run_dir`, `test_url`, `total_runs`, `bifurcated`, `per_flow_metadata`, `v` and `ts`. `final_state` also held the values the objective asserted (`pay_button_visible: "true"`) and the final `url`.

**Exit codes:** 0 passed, 1 failed, 2 error (login, setup, a bad flag, no network), 3 timeout or cancelled. 0, 1 and 2 were observed; 3 is documented.

**Result codes and verdicts (22 runs).** Read `result_code` and `verdict.family`, not `reason`.

| `result_code` | Status | Verdict family and category | Seen |
| --- | --- | --- | --- |
| 100 | passed | none | 13 runs |
| 740 | failed | `application_issue`: `validation_defect`, `functional_defect`, `ui_data_defect` | 5 runs, all genuine defects |
| 330 | failed | `automation_bug`: `agent_misstep` | 2 runs, where Kane blamed itself for a wrong total and a missing button |
| none | failed | none | 2 runs, both refusals (no start URL) |

The `reason` text "AP determined agent is stuck - no viable actions remain" appeared for both 330 and 740 outcomes, so it does not say who is at fault.

**Rules for a parser**

- Skip any line that is not JSON, ignore unknown fields and event types, and never assume the first line is a progress line. A plain `run` printed `stream_start`, `recording_state`, `skill_update_available`, `memory`, `bifurcation` and `test_md_bundle_sync` lines among the progress lines.
- Every line carries `v` and `ts`, and the first line is `stream_start` with `cli_version` and `surface`. Verified for `run`, `testmd` and `testrun`.
- Progress lines in a plain `run` are untyped `{step, status, remark}`. The names `step_start`, `step_end` and `step_event` describe the inner stream of `testmd`.
- The same failure is named differently by surface. `test_md_done.overall_status` said `failed`, the evidence pack said `broken`, and `testrun_summary.totals` counted `failed`. Read `failure.yaml` to learn why.
- Always check the exit code too. A refusal can exit without the normal terminal event.
- Documented, not reproduced: with a terminal on stdin, `testrun run` waits for a keypress, so end its lines in `< /dev/null`.
- Documented, not reproduced: `ask_user` prompts are disabled when stdin is not a terminal, so write objectives that never need an answer.

**Other signals.** Every stream is also written to `<session_dir>/events.ndjson`. A live run leaves a pointer file at `~/.testmuai/kaneai/sessions/active/<pid>.json`, so another process can follow it. Hints such as `evidence: view locally with ...` go to stderr, not stdout.

**Live event stream.** With `testrun run --stream-members`, a 5-member suite produced 161 stdout events in 25.6 seconds: a plan, a start, a member start and progress event per member at 0.7 s, 135 per-step member events as the run went, member ends at about 23 s and a summary at 24.9 s. Events arrive during the run, in bursts, not at the end. On a remote grid the per-member detail arrives only after the job ends and `testrun_progress` is not emitted (documented, not tested).

## Evidence packs and files on disk

Every run seals one `.evidence` file, a plain zip you can read with `unzip`, and that file is the only place run logs now live.

**Inside a pack** (per test, under `tests/<test-id>/`):

- At the root: `run.yaml` (title, status, `environment.run_kind` such as `replay`, `environment.origin` such as `testmd`, and `totals` of passed, failed, broken and skipped) and a run-level `failure.yaml` when something failed.
- `test.md` and `result.yaml` (status, a per-step list with kind and duration, user and project IDs, and `environment.model`, which read `v16-alpha`).
- `steps/<n>-<flow>-<m>/`, for example `1-0-1/`, with `screenshot.jpg` (a JPEG, not a PNG), `step.json` (kind, status, summary, duration, URL, action ID) and, on action steps, `annotated.png`.
- `logs/` with `<n>-actions.ndjson`, `<n>-console.ndjson`, `<n>-network.har` and `<n>-run.log` per run index, plus `runner-stderr.log`, `tui.log` and `meta.yaml`. For a local page the HAR was about 1 KB and the console files were empty; how logs are attributed to steps was not checked.
- `auteur/execution.json`, the full execution trajectory.

`failure.yaml` holds `error.type` and `error.message`, `page_state`, pointers into the console and network logs, and a `triage` block with a root cause, category, confidence, severity and a suggested fix, written by an agent named `v16-investigation/replay`. Two messages seen: `assertion_failed: @ step 11` for a genuine wrong total, and `replay_dispatch_error: TargetClosedError` when a concurrent run closed the browser. Both were recorded as status `broken`, so the message is what separates a found bug from an infrastructure error. In these runs the triage named the real bug ("Cart total includes an unexplained $2 charge"). The docs advise treating it as a lead, not an instruction.

**Useful commands:** `unzip -l <pack>`, `unzip -p <pack> "tests/*/result.yaml"`, `kane-cli evidence serve <pack>` (local server, nothing uploaded), `kane-cli evidence validate <pack>`, `kane-cli evidence merge <packs> --run-id <id>`.

**Where files go**

| Path | What | Commit it? |
| --- | --- | --- |
| `output-<name>/` next to a test | Recordings and `Result.md` | Yes |
| `.testmuai/evidence/*.evidence` | Sealed packs for named runs, testmd and testrun | No |
| `.testmuai/context.md` | Project notes for the agent | Yes |
| `.testmuai/variables/*.json` | Project variables (mark secrets with `secret: true`) | No secrets |
| `.testmuai/tests/` | Tests recorded with `run --name` | Move into the repo |
| `.context/` | Assurance store, append-only and single-writer | No. Never merge it with git. |
| `~/.testmuai/kaneai/sessions/<id>/` | Session log, `events.ndjson`, the pack | No |
| `~/.testmuai/kaneai/` | `config.json`, `tui-config.json`, `global-memory.md`, `profiles/`, `chrome-profile/`, `variables/` | No |

## Parallelism: what works and what breaks

Use `testrun run --parallel N` for concurrent browser runs. The original notes reported interference between standalone `testmd run` processes; the fresh check below also had one standalone failure.

| Approach | Result | Verdict |
| --- | --- | --- |
| 5 concurrent `testmd run`, inline `--variables`, default profile | The good build failed at step 2; failing steps differed from solo runs | Do not use |
| Same, with `chrome_profile:` set per copy | The good build failed at step 1 in 0.2 s, on the `{{global.base_url}}` navigation | Do not use |
| Same, with `base_url` in each copy's frontmatter and its own profile | The good build still failed at step 1 | Do not use |
| 2 concurrent `testmd run` of a clean recording, no variables | Original notes: both failed at step 1. Fresh check: one passed, one failed | Do not use |
| `testrun run --parallel 5`, five copies of the test, each with its own `base_url` in frontmatter | 35 s wall, good build passed, all 4 broken variants failed | Use this |

**Reported cause in the original field notes.** Sampling Chrome while two runs overlapped showed both launching with `--remote-debugging-port=9222`, each with its own temp profile. They share one debug port and attach to each other's browser. A pack from the five-way run recorded `replay_dispatch_error: TargetClosedError: ... browser has been closed`, status `broken`. A per-run profile therefore does not help. The docs say `testrun` gives each worker an isolated Chrome, and it worked with 5 members, but its ports were not inspected. Untested alternative: start your own Chrome per run on distinct ports and pass `--cdp-endpoint`.

**Local cap.** Local parallelism is capped at 9 Chromes by the 9222-9230 port range. In a 16-member run, 9 passed and 7 ended `broken` with "CDP ports 9222-9230 are in use". More needs `--remote`, which needs a HyperExecute plan.

**Suite mechanics (verified).**

- Each member is its own `_test.md` file, with its own `output-<stem>/` folder copied from the recording. `<stem>` is the file name without `_test.md`, so `m0_test.md` needs `output-m0/`.
- Per-member values (URL, email) go in each file's frontmatter `variables:`.
- Easiest way to build a variant suite: author once, copy the file and its output folder N times, then edit the variables.

**How to set up a variant suite**

1. Author the test once on the good build, with the URL in a `{{base_url}}` variable.
2. Copy the test file and its `output-<name>/` folder once per variant (`good_test.md`, `variant1_test.md`, ...), renaming the output folder to match.
3. Put each variant's `variables: base_url: value: http://localhost:<port>` in its own frontmatter.
4. From the folder that holds them, run `kane-cli testrun run --parallel 5 --no-adaptive-heal --headless --agent < /dev/null` and read `testrun_member_end` per file.

**Limits not yet measured:** how many workers one laptop sustains, and what 20 or more members do to Chrome memory.

## Measured results

Strict replay failed on every real bug in 20 to 35 seconds, and healing passed the one cosmetic change. These runs used a tiny shop app with a good build and four variants: no email validation, wrong cart total, hidden "Add to cart" button, and a renamed button label.

**Timings**

| Run | Wall time | Outcome |
| --- | --- | --- |
| Author 3-step flow on the good build | 120 s | passed |
| Author 4-step flow with `{{base_url}}` | 101 s | passed |
| Author a 1-step probe with `store as` and `--name` | 18 s run time | passed |
| Replay on the good build, solo | 18 s | passed |
| Strict replay, variant on the recorded port: no validation | 31 s | failed at step 2 |
| Strict replay: wrong total | 35 s | failed at step 1 |
| Strict replay: hidden button | 20 s | failed at step 1 |
| Healing on, wrong total | 79 s | failed, recordings rewritten |
| Run after that, `--url` pointed at the no-validation build | 84 s | recording rejected, all 3 steps re-authored, failed at step 2 |
| Solo replay retargeted by `{{base_url}}` to the no-validation build | 26 s | failed at step 3, as expected |
| Clean recording, `--url` to a second server | not measured | passed, but every request went to the original server |
| `testrun --parallel 5`, healing off | 35 s | good passed, 4 variants failed |
| `testrun --parallel 5`, healing on | 96 s | good and renamed label passed, 3 failed |
| Replay with only a loopback interface | 2 s | exit 2, "TMS did not return an org\_id" |
| 2 concurrent `testmd run` | not measured | original notes: both failed at step 1; fresh check: one passed, one failed |
| `--analyzer-only`, 3 conditions | 15 s | verdicts true, false, true; all correct |

**Strict versus healed outcome by variant**

| Variant | Real behavior change? | Strict | Healed |
| --- | --- | --- | --- |
| Good build | no | passed | passed |
| No email validation | yes | failed | failed |
| Wrong total | yes | failed | failed |
| Hidden button | yes | failed | failed |
| Renamed button label | no | failed | passed after 90 s |

**Reading it.** In this sample, a replay that failed strict and passed healed was cosmetic drift, and one that failed both was a real regression. That is one cosmetic variant against three bugs, so treat it as a promising pattern to retest, not a rule. A passing replay took about 8 seconds for browser start plus about 1 second per step. A strict kill also reports as `broken` in the pack, so classify it by the `failure.yaml` message.

## Checking invariants under concurrency

Several parallel browsers exercising a shared-state app (a counter that must not go negative, a vote that must count once) showed what Kane can and cannot judge. Small samples, one machine.

- Five parallel members against a naive shared-counter build hit the race in 4 of 4 runs, and a safe build held in 3 of 3. Eight parallel members also worked. Every member flow "passed" even when the build was wrong, so the invariant has to be checked separately.
- A race needs a realistic window. A 2.5 second simulated step made 5 browsers starting within seconds collide every time.
- A member flow can run a scripted attack playbook (vote, clear cookies and localStorage, reload, vote again) from plain English alone.
- A count invariant alone can miss a provenance problem: totals matched while forged tokens were accepted. Only a counter of items whose source was never issued caught it. Define invariants about where each counted item came from, not just totals.

| Method for checking the invariant | Outcome | Note |
| --- | --- | --- |
| One-shot run, compound assertion (value not negative and total at most 3) | failed twice, passed once | One false pass in 3 runs, so the verdict is flaky |
| One-shot run, single clause: the value in the response body is greater than or equal to 0 | failed correctly with a fix hint; passed on the safe build | About 36 s |
| Extract with `store as` and compare in code | exact values returned | Deterministic; the best option |
| `--analyzer-only` on a JSON page via an external Chrome | `condition_results` false, false | Exit 0 and status passed; read the booleans |
| One-shot run with an API call but no start URL | exit 1, status `failed`, reason "No start URL provided" | Looks like a failed check; read the reason |

**Takeaways**

1. Decide invariants in your own code from extracted values, and treat Kane's pass or fail as corroboration. Where a model-judged assertion matters, use one clause per assertion and require agreement across runs.
2. Pass a start URL on every one-shot run, even one that only calls an API.
3. Compute checks from the server's own state or summary endpoint, not from Kane's English verdict.

## What Kane is good and bad at (measured)

Kane is strong at checking stated expectations in a real browser and weak at discovering problems on its own. Small samples, one machine.

**Good at**

- Authoring a flow from plain English, then replaying the recording quickly.
- Verdicts on explicit single-clause assertions: 5 of 5 correct across 5 shop builds (good and renamed-label builds passed; wrong total, missing validation and hidden button failed).
- Extracting values with `store X as 'name'` exactly.
- Browser actions such as clearing cookies and localStorage, reloading, and waiting out queues with loops.
- Running parallel browsers through `testrun`, and replaying across re-implementations of the same UI when visible labels match.
- Sealing a complete evidence pack whose triage usually names the real bug.

**Bad at**

- Discovering bugs unprompted: unscripted exploration with bug detection on found 0 of 3 real bugs. It called a $22 total for two $10 widgets "correct" and blamed its own steps for a hidden button. It raised no false alarms on the good and renamed-label builds.
- Classifying failures reliably: of 3 real bugs, missing validation and hidden button came back as confirmed application defects (`result_code` 740) with usable fix hints, but the wrong total came back as `agent_misstep`, blaming the agent.
- Creative attacks: given only a goal, it found a cookie-based hole on a weak build by clearing cookies and revoting, but on a stronger build it tried a new tab and a reload, missed forged tokens, and reported "no". It runs a small playbook (refresh, clear cookies, new tab, double click) and misses anything else.
- Compound English assertions: one false pass in 3 runs on a two-part check.

**Design rules this implies**

1. Give Kane explicit expectations, one clause each. Do not rely on it to notice what is wrong.
2. Treat `agent_misstep` or `automation_bug` classifications as inconclusive and re-run before blaming the product or the agent.
3. Script the attacks or edge cases you care about; do not expect creativity.
4. Decide numeric and provenance invariants in your own code from extracted values.

## Mistakes to avoid

The first three give a false pass or a hidden bad result.

| Mistake | What happens | Fix |
| --- | --- | --- |
| Pointing `--url` at another build during a replay | The recording still goes to its original URL, so the replay passes against the wrong build (verified with server logs) | Use a `{{base_url}}` variable in step 1, or serve each variant on the recorded port in turn |
| Reading exit 1 or `failed` as "a bug was found" | A browser closed by a concurrent run and a real assertion failure look alike; the pack calls both `broken` | Read `failure.yaml`: `assertion_failed` is a finding, `TargetClosedError` is infrastructure |
| Leaving adaptive healing on for strict checks | A harmless UI change is healed and passes; a failing step took about twice as long in this sample | `--no-adaptive-heal` first, healing as a labelled second pass |
| Healing against a bad build with your only copy of the test | The recording is rewritten and marked invalid, so the next run re-authors every step (84 s in this sample) | Give each variant its own copy of the test folder |
| Running several `testmd run` processes at once, or trusting `chrome_profile` to isolate them | Standalone runs can interfere with each other; the original notes observed a shared debug port | Use `testrun run --parallel N` |
| Giving `testrun` a folder, `--timeout` or `--variables` | `not a *_test.md file` or `unknown option`, exit 2 (verified) | Give file paths or none, and put values in frontmatter |
| Giving `testmd run` a `--chrome-profile` flag | `unknown option`, exit 2 in about 1 second (verified) | Set `chrome_profile:` in the file's frontmatter |
| Relying on a replay without internet | Exit 2 in 2 seconds: "TMS did not return an org\_id" (verified) | Keep the machine online |
| Piping `testrun run` without `< /dev/null` | Documented: it waits for a keypress on a terminal | End every `testrun` line in `< /dev/null` |
| Writing `read the price` instead of `store the price as 'price'` | Documented: Kane observes but saves nothing to `final_state` | Use the `store ... as '<name>'` pattern (verified: it filled `final_state`) |
| Asserting the trigger, such as `verify the Submit button is visible` | Documented: it fails exactly when the action worked | Assert the outcome on the page |
| Writing a long objective | Documented: runs drift and stall past about 15 steps | Split it and run the parts in parallel |
| Expecting `ask_user` answers in CI | Documented: prompts are disabled without a terminal and the step fails | Write objectives that never need an answer |
| A short loop on a long wait | The default cap of 5 iterations is exhausted and the flow moves on too early | Put a long wait inside the loop |
| Trusting the `failure.yaml` triage blindly | It is a model's opinion; it was right in these runs, but the docs warn against pasting its fix into a test | Check the HAR, console and screenshot first |
| Committing `.testmuai/evidence/` or `.context/` | Documented: large binary packs, and a corrupted single-writer store if merged | Commit only `output-*/` and `.testmuai/context.md` |
| Assuming which account signed in | The wrong Google session can be picked up by the default browser | Check `kane-cli whoami` after every login |

## How to use Kane

Author each flow once and early, use strict replays for checks, and investigate failures before trying healing. Patterns 1 and 2 are built from measured behavior but were not run end to end with a coding agent; pattern 4 rests on documentation, and the GitHub Action was not run.

**1. The agent loop**

1. The coding agent changes code. A hook or the agent itself runs `kane-cli testmd run <file> --agent --headless --no-adaptive-heal` for the affected flow.
2. Read only the terminal event (`test_md_done`) and the exit code. If it passed, stop.
3. If it failed, open the pack: `failure.yaml`, the failing step's `annotated.png`, and the HAR and console slice for that step. Map the failing request or element to code and fix.
4. Rerun. Cap the loop at 3 attempts, then hand a short evidence summary to a human.

Keep the verifier independent of the builder: a verifier that was not scripted to pass is more trustworthy.

**2. Variant suites (alternate builds, rewrites, PR builds)**

- Author once on the baseline with `{{base_url}}`. Copy the test and its `output-<name>/` folder per variant, with each `base_url` in that copy's frontmatter.
- Run `testrun run --parallel N --no-adaptive-heal`, then run only the failures again with healing on.
- Read results from `testrun_member_end` and the summary; keep each variant's pack for evidence.

**3. Give Kane context**

- Put test accounts, routes, seeded data and known quirks in `.testmuai/context.md`. Let the builder agent keep it current.
- Put secrets in variables marked `secret: true`. They are masked in logs.

**4. CI**

- Use the composite GitHub Action `LambdaTest/kane-cli/integrations/github-action/kane-cli-browser-run@main`. It needs `LT_USERNAME` and `LT_ACCESS_KEY` secrets, uploads the evidence pack and comments the verdict on the pull request.
- Always pass `--headless`, authenticate with `--username` and `--access-key`, and gate on the exit code.

**5. Layered use**

- Use Kane as a verifier for generated code, as a performer that does tasks and extracts values, and as an application's own regression test.

## Open questions and what was not verified

- **A concurrency alternative to `testrun`.** Whether one Chrome per run on distinct ports, passed with `--cdp-endpoint`, avoids the shared-port failure.
- **Scale of `testrun --parallel`.** 5 to 16 members were tested. Laptop limits, Chrome memory use at 20 or more are unknown.
- **Whether the healed-versus-strict split holds.** One cosmetic variant against three bugs is too small a sample.
- **Log attribution on a real app.** The test app makes no network calls, so the HAR and console were nearly empty and per-step attribution could not be checked.
- **Not run at all:** mobile and real devices, remote grid runs, Test Manager dataset rows, the assurance commands, the agent skill and status strip, the GitHub Action, and headless login with an access key.

## Reference

**Environment variables.** Consult the installed version's documentation before relying on these settings.

| Variable | Effect |
| --- | --- |
| `KANE_CLI_CHROME_PATH` | Chrome binary to use |
| `KANE_CLI_SKIP_BROWSER_DOWNLOAD` | Skip the Chrome check, use `chrome` on PATH |
| `KANE_CLI_CDP_TIMEOUT_MS`, `KANE_CLI_CDP_RETRIES` | Chrome start timeout (default 30000) and launch retries (default 2) |
| `KANE_CLI_USER_AGENT` | Tags runs with the calling agent, for example `claude-code` |
| `KANE_CLI_SYSTEM_NODE` | Use the system Node instead of the bundled one |
| `KANE_SYNC_GIT_TOKEN`, `KANE_SYNC_S3_ACCESS_KEY_ID`, `KANE_SYNC_S3_SECRET_ACCESS_KEY` | Context sync credentials for CI |
| `KANE_CONTEXT_GITIGNORE` | Set to 0 to keep `.context/` out of `.gitignore` handling |
| `KANE_TESTRUN_MEMBER_DEBUG` | Show per-member output in `testrun` |

**Sources**

- [Kane CLI repository](https://github.com/LambdaTest/kane-cli)
- [Kane CLI on npm](https://www.npmjs.com/package/@testmuai/kane-cli)
- [Kane CLI introduction](https://www.testmuai.com/support/docs/kane-cli-introduction/)
- [Kane CLI skills for coding agents](https://www.testmuai.com/docs/kane-cli-skills.md)
- [Kane CLI NDJSON agent mode](https://www.testmuai.com/blog/kane-cli-ndjson-agent-mode/)

Command output and timings above come from runs with `@testmuai/kane-cli` 0.9.0 in October 2026.
