# Kane CLI field guide: how it works, setup, mistakes, best practice

> **Version update, October 24:** The experiments below used **0.9.0**. The event installer now intentionally installs **0.10.0-rc.3** (`rc` npm tag; `latest` still points to 0.9.0 at verification). The [0.10.0-rc.1 release](https://github.com/LambdaTest/kane-cli/releases/tag/0.10.0-rc.1) introduces a distinct `explore` suite, remote exploration with up to 20 cloud browsers, shared linked projects, and revised agent-mode behavior. [rc.3](https://github.com/LambdaTest/kane-cli/releases/tag/0.10.0-rc.3) switches remote exploration to production infrastructure and improves provisioning errors. Earlier free-exploration failures do **not** benchmark the new `explore` system. Earlier timing, port limits, assertion behavior and replay observations remain version-specific pending retesting. The cloud exploration limit is not evidence that local test suites now support 20 browsers. Release capabilities are documented, not runtime-verified here.

Oct 24, 2026 · @Harish

## TL;DR

Kane CLI is a replay-first browser agent: you pay credits to author a flow once, replay it for free in seconds, and parallelize only through `testrun`. Measured on a small shop app on the box on 24 Oct 2026 with v0.9.0. The table after this list marks every claim as verified by a run, verified in the source, documented only, or inferred.

1. **Authoring is the expensive step.** A 3 to 4 step flow took about 2 minutes and 55 credits; a 1 step probe took 13. A passing replay costs 0 credits and takes 14 to 18 seconds. A failing replay costs about 1 to 4 credits (2.1 to 4.0 one at a time, about 1.25 each inside a 5-member suite).
2. **`--url` does not retarget a replay.** Verified with server logs on a clean recording: the original port took all 6 requests and the new one took none. A recording damaged by a healed run is re-authored instead, which cost 24.5 credits and 84 seconds. Use a `{{base_url}}` variable.
3. **Parallel runs go through `testrun run --parallel N`.** Separate `testmd run` processes all launch Chrome on debug port 9222 and close each other's browser. Even two concurrent runs failed.
4. **Healing is a separate, costly pass.** On 5 members it took 96 s and 85 credits against 35 s and 5 credits. It rewrote `execution.json`, a step's actions and `Result.md`; a strict replay only appended to the run history in `meta.json`.
5. **`failed` does not mean a bug was found.** In the evidence pack, a genuine assertion failure and an infrastructure error are both `broken`. Tell them apart by the message in `failure.yaml`: `assertion_failed` or `TargetClosedError`.
6. **Every run needs internet, including a pure replay.** Offline, a replay exits 2 with "TMS did not return an org\_id". The engine process holds HTTPS connections to LambdaTest-fronted addresses, so reasoning is probably remote, but that is not proven.
7. **Build on the terminal event and the exit code.** `run_end` (run), `test_md_done` (testmd), `testrun_done` (testrun). Exit codes are 0 pass, 1 fail, 2 error, 3 timeout or cancel.
8. **The evidence pack is a plain zip** with screenshots, a HAR, console logs and a failure record. In my failing runs its model-written triage named the actual bug.
9. **`--analyzer-only` works.** It judged 3 conditions on a Chrome I started myself in 15 seconds for 5.3 credits, and exited 0 even though one condition was false.
10. **Not run at all:** mobile, the assurance commands, the agent skill install, the GitHub Action and headless login with an access key. Their details come from the docs.

## How much of this is verified

Each row says how I know it; "verified by run" means I ran it on the box and checked the output, not just read the docs.

| Claim | Status | Evidence |
| --- | --- | --- |
| Authoring, replay and failure costs and times | Verified by run | Credit balance before and after each run |
| `--url` does not retarget a replay | Verified by run | Clean recording, `replay_decisions: 3`, request counts per server |
| `testrun --parallel` works; concurrent `testmd` fails because of one shared debug port | Verified by run | Sampled Chrome processes (both on port 9222), `TargetClosedError` in a pack |
| Healing rewrites recordings, strict replay does not | Verified by run | Checksums of the test folder before and after |
| Healing passes a cosmetic change and still fails real bugs | Verified by run, small sample | 1 cosmetic variant, 3 real bugs |
| A replay needs internet | Verified by run | Network namespace with loopback only, exit 2 |
| `--analyzer-only` against an external Chrome | Verified by run | 3 conditions, correct verdicts |
| Stream shapes, `run_end` keys, exit codes | Verified by run | Captured `run`, `testmd` and `testrun` streams |
| Evidence pack layout and `failure.yaml` | Verified by run | Unzipped packs from these runs |
| Closed native engine, Nuitka-packed, 127 MB | Verified in the package | Downloaded and inspected the platform package |
| Flag lists | Verified in the package | Installed `--help` output |
| Reasoning runs server-side | Inferred | Engine makes HTTPS calls; offline fails; model and prompts not visible |
| Kane runs on OpenAI models | Documented only | Event page; not checkable from the source |
| `testrun` needs `< /dev/null`; `ask_user` is off without a terminal | Documented only | Docs; I always redirected stdin |
| Agent skill, status strip, GitHub Action | Documented only | Not installed or run |
| Mobile and real devices, plan requirements | Documented only | Not run |
| Assurance commands (`context`, `design`, `cover`) | Documented only | Not run |
| Headless login with an access key | Documented only | I used OAuth |

## Architecture

Kane CLI is a thin, readable Node app wrapped around two closed native engines; the open part is what you can build against.

- **`kane-cli` (Node and TypeScript).** An Ink terminal UI plus Commander. It handles login, flags, orchestration, the NDJSON emitter, sessions, evidence packs, context sync and the skill installer. The npm package ships it as bundled, minified `dist/` files. The GitHub repo holds docs, the agent skill and integrations, not the CLI source. Verified by unpacking the package.
- **`v16-runner` (closed).** A 127 MB signed native binary per platform, packaged with Nuitka, delivered as `@testmuai/kane-cli-<os>-<arch>`. It drives Chrome over the DevTools Protocol, and devices over Appium according to the docs. During a run its process held HTTPS connections to Cloudflare-fronted LambdaTest addresses and one AWS address, and the evidence pack records `environment.model: v16-alpha`. Which service each connection reaches, and whether reasoning happens there, is not visible. The CLI itself calls a controller API (`kaneai-api.lambdatest.com/v16-controller/v1`) for credentials and screenshot uploads, seen in the bundle. I could not inspect the engine or its prompts.
- **`assurance-agent` (closed).** A second native binary the CLI spawns with JSON over stdin and stdout, seen in the bundle. It handles `context`, `design`, `cover` and `maintain`, streaming `progress`, `ask_user`, `graph_query`, `proposal`, `design`, `tool_activity`, `usage` and `session_paused`. Sessions can pause and resume with `--resume`, `--answer` and `--message`. I did not run any of these commands.
- **Cloud services named in the bundle.** Test Manager (test cases, projects, datasets), a signed-URL screenshot store, the hosted evidence viewer, an analytics endpoint, a cloud browser grid, HyperExecute for `--remote`, and a mobile device hub. I did not test whether analytics data is sent or what `KANE_TELEMETRY` controls.
- **Launcher.** `bin/kane-cli.cjs` respawns itself onto a bundled Node 24 runtime; `KANE_CLI_SYSTEM_NODE=1` forces the system Node, which I used for every run.
- **OpenAI claim.** The event page says Kane runs on OpenAI models. Nothing I could see confirms or contradicts that. Runs consumed KaneAI credits from the account balance (verified). Whether any OpenAI billing is involved is unknown.

The machine-facing surface is small: NDJSON on stdout, exit codes, files on disk, attaching to an existing Chrome with `--cdp-endpoint`, and a stdin answer protocol that works only in a terminal. Everything you build integrates through those.

```text
 Agent or script ──▶ kane-cli (open: Node + TypeScript) ──▶ v16-runner (closed native engine:
 reads NDJSON,         run | testmd run | testrun run          drives Chrome over CDP, devices over Appium)
 exit code,            NDJSON stream + events.ndjson     ──▶ assurance-agent (closed, JSON over stdio:
 evidence packs        sessions + evidence packs               context, design, cover, maintain)
                              │                                          │
                              └───────── login, uploads, calls ──────────┘
                                                 ▼
              TestMu cloud: controller (reasoning appears to run here), Test Manager,
                            evidence viewer, cloud browser grid, device hub
```

*Architecture: 3 local parts and 1 cloud layer.*

Your tools touch only the accent box; the two closed engines and the cloud sit behind it.

## Setup

Install, sign in, confirm credits and run one flow before the event; the room-wide install at 10:05 AM is what the organizers warn about.

**Pre-flight checklist**

1. Install: `npm install -g @testmuai/kane-cli` (Node 18 or newer), or `brew install LambdaTest/kane/kane-cli`. Google Chrome (stable) must be installed. A non-standard path goes in `KANE_CLI_CHROME_PATH`. I installed v0.9.0 with npm into a sandbox folder.
2. Sign in: `kane-cli login --oauth`. The CLI waits on a `http://127.0.0.1:<port>/callback` address (it was port 18392), so I infer the browser that completes the sign-in must run on the same machine. Headless machines are documented to use `kane-cli login --username <user> --access-key <key>`, with the key from the TestMu dashboard under Settings, Keys; I did not run that.
3. Check: `kane-cli whoami` and `kane-cli balance`. A fresh sign-in on the box showed 1,200 credits.
4. Run one flow: `kane-cli run "Go to https://example.com and assert the page title contains 'Example'" --agent --headless`.
5. Keep the internet on. Verified: with only a loopback interface, a replay exits 2 in 2 seconds with "TMS did not return an org\_id".
6. Install the agent skill (documented, not run): `npx @testmuai/kane-cli-skill` for Claude Code, Codex CLI and Gemini CLI, then restart the agent. Cursor and Copilot read an `AGENTS.md` instead.
7. Optional, Claude Code only (documented, not run): `npx @testmuai/kane-cli-skill strip enable` adds a live status line and edits `~/.claude/settings.json` with a backup.
8. Mobile only (documented, not run): on an Apple Silicon Mac with Xcode 16 or newer, `kane-cli doctor --target simulator --install`. Real devices need KaneAI Max, or credits plus Real Device Plus Automation Cloud.

**Account and credits.** Every builder gets 3 months of KaneAI Pro starting on event day. Local runs use credits from the account you signed in with. Each run is saved to a Test Manager project (the box account auto-selected "KaneAI Generated").

**On the box.** Chrome is at `/usr/bin/google-chrome` and `--headless` works. The default browser is Firefox, so the OAuth page opens there and uses that browser's Google session. The account that signed in was `harishm6250`, which differs from the email on file (`harishm6259`); confirm it is the intended one. In the sandbox install used for these tests, run the CLI with `KANE_CLI_SYSTEM_NODE=1`.

**On the Mac (event day).** I have not run Kane on the Mac. Suggestions: complete the sign-in in Chrome so the Google account is the one you intend, and tag runs with `KANE_CLI_USER_AGENT=<your-agent>` as the skill documents (I set it on every run but did not check its effect). Expect every run, even a replay, to need the TestMu service.

## Commands worth knowing

Four commands do almost everything: `run` for one-offs, `testmd run` for one saved test, `testrun run` for suites, and `evidence` for proof. All flags below were confirmed in the installed v0.9.0 `--help`.

| Command | Use it for | Notes |
| --- | --- | --- |
| `kane-cli run "<objective>" --agent --headless --timeout N` | One-shot task or check | Start the objective with `Go to <url> and`. `--name x` writes `.testmuai/tests/x_test.md` and a pack in `.testmuai/evidence/` (verified). |
| `kane-cli testmd run <file> --agent` | Author a saved test, or replay it | Verified in `--help`: `--no-adaptive-heal`, `--author`, `--variables`, `--variables-file`, `--on-lock-conflict`, `--bug-detection`, `--name`, `--timeout`. There is no `--chrome-profile` (it errors with `unknown option`). |
| `kane-cli testrun run [paths] --parallel N < /dev/null` | A suite as one execution, one exit code, one evidence pack | Verified in `--help`: `--match`, `--tags`, `--parallel`, `--on-failure`, `--dry-run`, `--remote`, `--no-adaptive-heal`, `--author`, `--bug-detection`, `--headless`, `--stream-members`. There is no `--timeout` and no `--variables`. It takes file paths, or none to scan the current folder; a folder argument is refused. |
| `kane-cli run --analyzer-only --condition "..." --agent` | Judge true or false conditions on the current page | Verified: 3 conditions on an external Chrome (`--cdp-endpoint`, `--allow-missing-url`) took 15 s and 5.3 credits. Verdicts come in `run_end.condition_results` in condition order. Exit 0 means judged, not true. |
| `kane-cli evidence serve\|validate\|merge` | Open, check or combine evidence packs | In `--help`. I read packs with `unzip` and did not run these. |
| `kane-cli context ingest\|extract\|review`, `design tests`, `cover`, `cover gaps`, `maintain reconcile` | Requirements to tests to coverage | Documented, not run. Interactive by default; use `--mode agent` or `--mode ci` when headless. Costs credits. |
| `kane-cli login`, `whoami`, `balance`, `profiles`, `config` | Account and defaults | `login --oauth`, `whoami` and `balance` verified. |
| `kane-cli devices list`, `apps list`, `doctor --target ...` | Mobile setup | Documented, not run. Simulator and emulator need an Apple Silicon Mac. |

**Flags that matter**

- `--agent` gives NDJSON on stdout and the UI on stderr (verified). The help text says it turns on by itself when stdin is not a terminal.
- `--headless` is needed on a machine without a display (documented). I used it on every run.
- `--no-adaptive-heal` makes a replay miss final. Verified: it left the recording content alone and only added a history entry in `meta.json`.
- `--cdp-endpoint <url>` attaches to a Chrome you started with remote debugging. Verified with `--analyzer-only`; not tried with a normal run. `--ws-endpoint` attaches to a Playwright websocket (documented).
- `--assertion-mode dom|visual` defaults to `dom` with a vision fallback (from the help text).
- `--bug-detection off|stop|continue` flags suspected product bugs while authoring. A confirmed one is documented as `result_code: "740"` plus a verdict. Not run.
- `--session-context <json>` chains runs by passing the `context` object from a previous `run_end` (documented, not run).
- `--dataset-id` and `--dataset-row` use a Test Manager dataset row as the parameters (in the help text, not run).

## Authoring, replay and healing

Every saved test works the same way: the first run authors each step with the AI and records it, later runs replay the recording with no AI, and a replay that breaks may trigger healing.

**The test file.** A `_test.md` has YAML frontmatter, then one `## Heading` per step with a plain-English objective. Useful frontmatter keys: `mode`, `url`, `tags`, `max_steps`, `variables`, `chrome_profile`, `target`, `headless`. A step can be a single `@import ./helpers/login.md` line.

**Where recordings live.** Next to the test: `output-<name>/Result.md` (human report) and `output-<name>/.internal/` (`execution.json`, `steps/`, `meta.json`). The folder is commit-safe, so teammates and CI replay the same recordings.

**When a step replays.** A step replays only if its recording exists, its text and its YAML block are unchanged, and no earlier step was invalidated. Editing step N re-authors step N and every authorable step after it. `--author` forces re-authoring. Steps marked `@db`, `@api`, `@js`, `@smartui`, `@network_query` or `@network_assertion` are replay-only and cannot be re-authored.

**What a replay stores.**

- A step that navigates to a hard-coded URL keeps that URL, and `--url` on a replay does not change it. Verified: with a clean recording and `--url` pointing at a second server, the original server took all 6 requests and the second took none.
- With `{{base_url}}` in step 1, the recording stored the URL as a variable value, and a run with another value went to the new address. Verified: a replay with `base_url` set to a mutant's port failed at the step that mutant breaks.
- Variables given with `--variables` appear in the recording as `{{global.name}}`. Variables set in the file's frontmatter worked the same in a solo replay (verified).
- Kane adds steps of its own to a recording. I saw `refresh`, `clear_local_storage` and `wait` steps in a pack's `result.yaml`.
- Assertions default to DOM checks with a vision fallback (documented). Passing replays cost 0 credits, which fits no AI call, but I did not separate DOM checks from vision checks.

**Adaptive healing.** When a replay step fails, the runner tries up to three shrinking replay windows, then re-authors the failing steps. Observed on the shop app:

- Documented: after a replay failure the runner tries up to three shrinking replay windows, then re-authors the failing steps. I confirmed only that `adaptive_heal.triggered` was true.
- Verified by checksum: a healing run on a failing replay rewrote `execution.json`, a step's `actions.ndjson`, `meta.json` and `Result.md`, and marked that run `valid: false` in the run history. A strict run changed only `meta.json`, which gained one history entry.
- Verified: the damaged recording was not replayed on the next run. All 3 steps were re-authored (`author_decisions: 3`), which cost 24.5 credits and 84 seconds.
- Cost: one failing step took 79 seconds and 13 credits with healing, against 35 seconds and 2.6 credits without. Five members took 96 seconds and 85 credits, against 35 seconds and 5.
- Effect: it did not hide any of 3 real bugs, and it passed 1 renamed button after 90 seconds. That is a small sample.

**Writing objectives that replay well (documented guidance; only the store-as pattern was verified).**

- Name the start URL or use `url:` in frontmatter. Phrase actions as goals and keep exact values literal or in variables.
- End every step with a claim about the page state, such as `then verify the cart shows 2 items`. A closing assertion is what makes a replay pass or fail on the real end state.
- Use `store X as 'name'` for anything you need back. Vague words like `read` or `tell me` observe without saving.
- Keep a single objective under about 15 steps. Split longer flows.

## Output contract for scripts and agents

With `--agent`, stdout is one JSON object per line and the last meaningful line differs by command, so key on the terminal event plus the exit code.

| Command | Terminal event | Other events worth reading |
| --- | --- | --- |
| `run` | `run_end` | Untyped progress lines `{step, status, remark}` where status is `running`, `done` or `failed`. There is no `run_start` in this stream. |
| `testmd run` | `test_md_done` | `test_md_step_start`, `test_md_step_end`, inner `step_event` lines (screenshot, reasoning, action, assertion), `test_md_summary` with `replay_decisions`, `author_decisions` and `adaptive_heal.triggered`. |
| `testrun run` | `testrun_done` | `testrun_plan`, `testrun_member_end` (path, status, duration\_s), `testrun_summary` with `totals`. |

**Fields in `run_end`** (verified from a real run): `status`, `summary`, `one_liner`, `reason`, `reason_code`, `result_code`, `duration`, `credits_consumed`, `final_state`, `context`, `run_id`, `session_dir`, `run_dir`, `test_url`, `total_runs`, `bifurcated`, `per_flow_metadata`, `v` and `ts`. `final_state` also held the values the objective asserted (`pay_button_visible: "true"`) and the final `url`. A confirmed product bug is documented as `result_code` 740 with a `verdict` object; I did not trigger one.

**Exit codes:** 0 passed, 1 failed, 2 error (login, setup, a bad flag, no network), 3 timeout or cancelled. I observed 0, 1 and 2; 3 is documented.

**Rules for a parser**

- Skip any line that is not JSON, ignore unknown fields and event types, and never assume the first line is a progress line. A plain `run` printed `stream_start`, `recording_state`, `skill_update_available`, `memory`, `bifurcation` and `test_md_bundle_sync` lines among the progress lines.
- Every line carries `v` and `ts`, and the first line is `stream_start` with `cli_version` and `surface`. Verified for `run`, `testmd` and `testrun`.
- Progress lines in a plain `run` are untyped `{step, status, remark}`. The blog's `step_start`, `step_end` and `step_event` names describe the inner stream of `testmd`, where I saw them.
- The same failure is named differently by surface. `test_md_done.overall_status` said `failed`, the evidence pack said `broken`, and `testrun_summary.totals` counted `failed`. Read `failure.yaml` to learn why.
- Always check the exit code too. A refusal can exit without the normal terminal event.
- Documented, not reproduced: with a terminal on stdin, `testrun run` waits for a keypress, so end its lines in `< /dev/null`. I always redirected stdin.
- Documented, not reproduced: `ask_user` prompts are disabled when stdin is not a terminal, so write objectives that never need an answer.

**Other signals.** Every stream is also written to `<session_dir>/events.ndjson`. A live run leaves a pointer file at `~/.testmuai/kaneai/sessions/active/<pid>.json`, so another process can follow it. Hints such as `evidence: view locally with ...` go to stderr, not stdout.

## Evidence packs and files on disk

Every run seals one `.evidence` file, a plain zip you can read with `unzip`, and that file is the only place run logs now live.

**Inside a pack** (per test, under `tests/<test-id>/`):

- At the root: `run.yaml` (title, status, `environment.run_kind` such as `replay`, `environment.origin` such as `testmd`, and `totals` of passed, failed, broken and skipped) and a run-level `failure.yaml` when something failed.
- `test.md` and `result.yaml` (status, a per-step list with kind and duration, user and project IDs, and `environment.model`, which read `v16-alpha`).
- `steps/<n>-<flow>-<m>/`, for example `1-0-1/`, with `screenshot.jpg` (a JPEG, not a PNG), `step.json` (kind, status, summary, duration, URL, action ID) and, on action steps, `annotated.png`.
- `logs/` with `<n>-actions.ndjson`, `<n>-console.ndjson`, `<n>-network.har` and `<n>-run.log` per run index, plus `runner-stderr.log`, `tui.log` and `meta.yaml`. For a local page the HAR was about 1 KB and the console files were empty. I did not check how the logs are attributed to steps.
- `auteur/execution.json`, the full execution trajectory.

`failure.yaml` holds `error.type` and `error.message`, `page_state`, pointers into the console and network logs, and a `triage` block with a root cause, category, confidence, severity and a suggested fix, written by an agent named `v16-investigation/replay`. Two messages I saw: `assertion_failed: @ step 11` for a genuine wrong total, and `replay_dispatch_error: TargetClosedError` when a concurrent run closed the browser. Both were recorded as status `broken`, so the message is what separates a found bug from an infrastructure error. In my runs the triage named the real bug ("Cart total includes an unexplained $2 charge"). The docs advise treating it as a lead, not an instruction.

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

Use `testrun run --parallel N` and nothing else for concurrent browser runs; five separate `testmd run` processes gave wrong results.

| Approach | Result | Verdict |
| --- | --- | --- |
| 5 concurrent `testmd run`, inline `--variables`, default profile | The good build failed at step 2; failing steps differed from solo runs | Do not use |
| Same, with `chrome_profile:` set per copy | The good build failed at step 1 in 0.2 s, on the `{{global.base_url}}` navigation | Do not use |
| Same, with `base_url` in each copy's frontmatter and its own profile | The good build still failed at step 1 | Do not use |
| 2 concurrent `testmd run` of a clean recording, no variables | Both failed at step 1 | Do not use |
| `testrun run --parallel 5`, five copies of the test, each with its own `base_url` in frontmatter | 35 s wall, about 5 credits, good build passed, all 4 mutants failed | Use this |

**Cause (verified).** Sampling Chrome while two runs overlapped showed both launching with `--remote-debugging-port=9222`, each with its own temp profile under `/tmp/kane-clean-*`. They share one debug port and attach to each other's browser. A pack from the earlier five-way run recorded `replay_dispatch_error: TargetClosedError: ... browser has been closed`, status `broken`. A per-run profile therefore does not help. The docs say `testrun` gives each worker an isolated Chrome, and it worked with 5 members, but I did not inspect its ports. Untested alternative: start your own Chrome per run on distinct ports and pass `--cdp-endpoint`.

**How to set up a variant suite**

1. Author the test once on the good build, with the URL in a `{{base_url}}` variable.
2. Copy the test file and its `output-<name>/` folder once per variant (`good_test.md`, `nv_test.md`, ...), renaming the output folder to match.
3. Put each variant's `variables: base_url: value: http://localhost:<port>` in its own frontmatter.
4. From the folder that holds them, run `kane-cli testrun run --parallel 5 --no-adaptive-heal --headless --agent < /dev/null` and read `testrun_member_end` per file.

**Limits not yet measured:** how many workers one laptop sustains, and what 20 or more members do to Chrome memory and credits. `--remote` moves a suite to the cloud grid but needs a HyperExecute plan.

## Spike results

Strict replay failed on every real bug in 20 to 35 seconds, and healing passed the one cosmetic change at 17 times the credits. All runs used a tiny Node shop app in `/home/harish/code/kane-spike/` with a good build and four variants: no email validation, wrong cart total, hidden "Add to cart" button, and a renamed button label. Credits started at 1,200 and stood at about 883 after the audit runs.

**Timings and credits**

| Run | Wall time | Credits | Outcome |
| --- | --- | --- | --- |
| Author 3-step flow on the good build | 120 s | about 55 | passed |
| Author 4-step flow with `{{base_url}}` | 101 s | 55.0 | passed |
| Author a 1-step probe with `store as` and `--name` | 18 s run time | 13.2 | passed |
| Replay on the good build, solo | 18 s | 0 | passed |
| Strict replay, mutant on the recorded port: no validation | 31 s | 4.0 | failed at step 2 |
| Strict replay: wrong total | 35 s | 2.6 | failed at step 1 |
| Strict replay: hidden button | 20 s | 2.1 | failed at step 1 |
| Healing on, wrong total | 79 s | 13.3 | failed, recordings rewritten |
| Run after that, `--url` pointed at the no-validation build | 84 s | 24.5 | recording rejected, all 3 steps re-authored, failed at step 2 |
| Solo replay retargeted by `{{base_url}}` to the no-validation build | 26 s | not measured | failed at step 3, as expected |
| Clean recording, `--url` to a second server | not measured | not measured | passed, but every request went to the original server |
| `testrun --parallel 5`, healing off | 35 s | 5.0 | good passed, 4 mutants failed |
| `testrun --parallel 5`, healing on | 96 s | 84.6 | good and renamed label passed, 3 failed |
| Replay with only a loopback interface | 2 s | 0 | exit 2, "TMS did not return an org\_id" |
| 2 concurrent `testmd run` | not measured | not measured | both failed at step 1 |
| `--analyzer-only`, 3 conditions | 15 s | 5.3 | verdicts true, false, true; all correct |

**Strict versus healed outcome by variant**

| Variant | Real behavior change? | Strict | Healed |
| --- | --- | --- | --- |
| Good build | no | passed | passed |
| No email validation | yes | failed | failed |
| Wrong total | yes | failed | failed |
| Hidden button | yes | failed | failed |
| Renamed button label | no | failed | passed after 90 s |

**Reading it.** In this sample, a replay that failed strict and passed healed was cosmetic drift, and one that failed both was a real regression. That is one cosmetic variant against three bugs, so treat it as a promising pattern to retest, not a rule. A passing replay cost a fixed 8 seconds or so for browser start plus about 1 second per step. A strict kill also reports as `broken` in the pack, so classify it by the `failure.yaml` message.

## Swarm spike: five browsers against a race condition

Five parallel Kane buyers oversold a naive limited-stock drop in 4 of 4 runs and a safe build held in 3 of 3, but Kane's own verdict on the oversell was unreliable unless the check was phrased narrowly or done in code. Small samples, one machine, 24 Oct 2026.

**Setup.** `/home/harish/code/kane-spike/drop.js` sells 3 units. The naive build reads the stock, waits 2.5 seconds for a simulated payment, then decrements. The safe build reserves the unit first. The buyer journey was authored once on the naive build (69 seconds), then copied per buyer as `testrun` members with the URL in frontmatter. Every buyer flow "passed" even when the build oversold, so the invariant has to be checked separately.

| Run | Wall time | Result |
| --- | --- | --- |
| 5 buyers, naive build, 4 runs | 25 to 26 s | sold 5, stock -2 every time |
| 5 buyers, safe build, 3 runs | 29 to 33 s | sold 3, stock 0 every time |
| 8 buyers, naive build | 28 s | sold 8, stock -5 |
| 16 buyers, naive build | 28 s | 9 passed, 7 `broken` with "CDP ports 9222-9230 are in use" |

Local parallelism is capped at 9 Chromes by that port range. More needs `--remote`.

**Checking the invariant (stock -2, sold 5 on the naive ledger)**

| Method | Outcome | Note |
| --- | --- | --- |
| One-shot run, compound assertion: stock not negative and sold at most 3 | failed twice, passed once | One false pass in 3 runs, so the verdict is flaky |
| One-shot run, single clause: assert the stock value in the ledger response body is greater than or equal to 0 | failed correctly with a fix hint; passed on the safe ledger | About 36 s |
| Extract with `store as` and compare in code | stock "-2", sold "5" returned exactly | Deterministic; the best option |
| `--analyzer-only` on the JSON page via an external Chrome | `condition_results` false, false | Exit 0 and status passed; read the booleans |
| One-shot run with an API call but no start URL | exit 1, status `failed`, 0 credits, reason "No start URL provided" | Looks like a failed check; read the reason |

**Takeaways**

1. Decide invariants in your own code from extracted values, and treat Kane's pass or fail as corroboration. Where a model-judged assertion matters, use one clause per assertion and require agreement across runs.
2. A race needs a realistic window. A 2.5 second payment step made 5 browsers starting within seconds collide every time.
3. Pass a start URL on every one-shot run, even one that only calls an API.

## Ballot spike: attackers against a voting app

Kane attackers stuffed a weak poll every time and were stopped by server-side token checks, but only a provenance check caught forged tokens. Five attackers finished in 11 to 14 seconds per run. One run per cell, one machine, 24 Oct 2026.

**Setup.** `/home/harish/code/kane-spike/poll.js` has three modes. Weak allows one vote per browser cookie. Strong requires a check-in token like `tok3`, checked only for format and single use. Strict also requires the token to be in the issued list. The attacker flow was authored once on the weak build (66 seconds): vote, clear all cookies and localStorage, reload, vote again. Each of 5 attackers got its own token and ran through `testrun --parallel 5`.

| Attack (5 attackers) | Weak | Strong (format check) | Strict (issued list) |
| --- | --- | --- | --- |
| Vote, wipe cookies and storage, vote again | 10 votes from 5 attendees: violated | 5 votes: held | 5 votes: held |
| Vote with tokens that were never issued | not run | 5 forged votes accepted: violated | 0 votes: held |

**What it showed**

1. Kane's documented browser actions (clear cookies, clear localStorage, reload) worked as authored. Nothing was needed beyond plain English.
2. A count invariant alone missed the forged tokens: votes equalled attendees (5 and 5). Only a provenance counter (`forged`, votes whose token was never issued) caught it. Define invariants about where each counted item came from, not just totals.
3. Both checks were computed from the server's own summary endpoint, not from Kane's English verdict.

## Newer features tested: loops and the live event stream

Both features work, with one hard limit on loops. One run each, 24 Oct 2026.

**Loops (`@while`, `@if`).** The marker goes after a step label, for example `## Waiting room is showing @while` with the condition as the step body, then the loop steps, then `## Queue is over @end-while`. A marker with no label is refused at parse time with a message that shows the fix. On a drop app with a waiting room, a buyer authored in 74 seconds waited in a 20 second queue (3 iterations of a 2 second wait) and bought. A recorded loop is dynamic: it waits a different number of times each run. But a loop has a default cap of 5 iterations, a 500 ms settle and fail-on-exhaustion (seen in the CLI bundle). With a 40 second queue the replay looped 5 times, moved on with the room still closed, and failed. For long queues put a long wait inside the loop (for example 10 seconds).

**Live event stream.** With `testrun run --stream-members`, a 5-buyer swarm produced 161 stdout events in 25.6 seconds: a plan, a start, a member start and progress event per buyer at 0.7 s, 135 per-step member events as the run went, member ends at about 23 s and a summary at 24.9 s. Events arrive during the run, in bursts, not at the end, so a live swarm board can be driven from them. On a remote grid the per-member detail arrives only after the job ends and `testrun_progress` is not emitted (documented, not tested).

**Not tested:** real devices and mobile from any machine, remote grid runs, Test Manager dataset rows, the assurance commands and the GitHub Action.

## More usage learnings: result codes, portable recordings, suite mechanics and costs

Four things I only learned after the first version of this guide. Small samples, one machine.

**Result codes and verdicts (22 runs).** Read `result_code` and `verdict.family`, not `reason`.

| `result_code` | Status | Verdict family and category | Seen |
| --- | --- | --- | --- |
| 100 | passed | none | 13 runs |
| 740 | failed | `application_issue`: `validation_defect`, `functional_defect`, `ui_data_defect` | 5 runs, all genuine defects |
| 330 | failed | `automation_bug`: `agent_misstep` | 2 runs, where Kane blamed itself for a wrong total and a missing button |
| none | failed | none | 2 runs, both refusals (no start URL) |

The `reason` text "AP determined agent is stuck - no viable actions remain" appeared for both 330 and 740 outcomes, so it does not say who is at fault.

**Recordings survive a re-implementation of the same UI.** A buyer recorded on one hand-written app replayed 5 of 5 on three separately agent-written servers (6 of 6 swarm runs). An email buyer recorded on one agent-written app also ran correctly on two others. This held while the pages kept the same visible labels (button text, field label), which suggests recordings match elements by what they say, not by app-specific selectors. Only simple pages were tried.

**Suite mechanics (verified).**

- Each member is its own `_test.md` file, with its own `output-<stem>/` folder copied from the recording. `<stem>` is the file name without `_test.md`, so `m0_test.md` needs `output-m0/`.
- Per-member values (URL, email) go in each file's frontmatter `variables:`.
- Easiest way to build a variant suite: author once, copy the file and its output folder N times, then edit the variables.
- Control-flow tests (`@while`, `@if`) are documented in the CLI's own error text as agent-mode only, so run them with `--agent` (all my runs did). Marker lines count as steps in the totals, and each loop iteration emits its own step events.

**What a call costs (credits, measured).**

| Call | Credits | Time |
| --- | --- | --- |
| Author a 3 to 4 step flow | about 55 | 66 to 120 s |
| Author a 1 step probe | 13 | 18 s |
| Free exploration with bug detection | 17 to 24 | 74 to 83 s |
| Unscripted attack goal | 21 to 24 | 150 to 200 s |
| API-call invariant check, one-shot | 6.7 to 17.2 | 36 s |
| `--analyzer-only`, 3 conditions | 5.3 | 15 s |
| Passing replay | 0 | 14 to 18 s |
| Failing strict replay | about 1 to 4 | 20 to 35 s |
| 5-member swarm, strict / healed | about 5 / 85 | 35 s / 96 s |

This session went from 1,200 to about 316 credits over dozens of runs. Authoring and one-shot runs dominate; replays are nearly free.

## What Kane is good and bad at (measured)

Kane is strong at checking stated expectations in a real browser and weak at discovering problems on its own. Small samples, one machine, 24 Oct 2026.

| Test | Result |
| --- | --- |
| Spec-driven check, expectations stated as single-clause assertions, 5 shop builds | 5 of 5 verdicts correct: good and renamed-label builds passed; wrong total, missing validation and hidden button failed |
| Same check, classification of the 3 real bugs | 2 of 3 correct. Missing validation and hidden button came back as confirmed application defects (`result_code` 740) with usable fix hints. The wrong total came back as `agent_misstep`, blaming the agent |
| Free exploration with bug detection on, same 5 builds | 0 of 3 real bugs found. It called a $22 total for two $10 widgets "correct". For the hidden button it blamed its own steps. No false alarms on the good and renamed-label builds |
| Unscripted attack goal against the poll (goal only, no techniques) | Weak build: found the hole on its own by clearing cookies and voting again. Strong build: tried a new tab and a reload, missed forged tokens, and reported "no" |
| Authoring, replay, extraction, parallel browsers, evidence packs | All worked as described earlier in this guide |

**Design rules this implies**

1. Give Kane explicit expectations, one clause each. Do not rely on it to notice what is wrong.
2. Treat `agent_misstep` or `automation_bug` classifications as inconclusive and re-run before blaming the product or the agent.
3. Do not sell "Kane attackers" as creative. It runs a small playbook (refresh, clear cookies, new tab, double click) and misses anything else. Script the attacks you care about.
4. Decide numeric and provenance invariants in your own code from extracted values.

## Mistakes to avoid

Most of these cost me a run or hid a bad result; the first three give a false pass.

| Mistake | What happens | Fix |
| --- | --- | --- |
| Pointing `--url` at another build during a replay | The recording still goes to its original URL, so the replay passes against the wrong build (verified with server logs) | Use a `{{base_url}}` variable in step 1, or serve each variant on the recorded port in turn |
| Reading exit 1 or `failed` as "a bug was found" | A browser closed by a concurrent run and a real assertion failure look alike; the pack calls both `broken` | Read `failure.yaml`: `assertion_failed` is a finding, `TargetClosedError` is infrastructure |
| Leaving adaptive healing on for strict checks | A harmless UI change is healed and passes; a failing step costs about 5 times the credits and 2 times the time | `--no-adaptive-heal` first, healing as a labelled second pass |
| Healing against a bad build with your only copy of the test | The recording is rewritten and marked invalid, so the next run re-authors every step (24.5 credits, 84 s) | Give each variant its own copy of the test folder |
| Running several `testmd run` processes at once, or trusting `chrome_profile` to isolate them | They all use debug port 9222 and close each other's browser | Use `testrun run --parallel N` |
| Giving `testrun` a folder, `--timeout` or `--variables` | `not a *_test.md file` or `unknown option`, exit 2 (verified) | Give file paths or none, and put values in frontmatter |
| Giving `testmd run` a `--chrome-profile` flag | `unknown option`, exit 2 in about 1 second (verified) | Set `chrome_profile:` in the file's frontmatter |
| Relying on a replay without internet | Exit 2 in 2 seconds: "TMS did not return an org\_id" (verified) | Keep the machine online; check the demo room's Wi-Fi |
| Piping `testrun run` without `< /dev/null` | Documented: it waits for a keypress on a terminal | End every `testrun` line in `< /dev/null` |
| Writing `read the price` instead of `store the price as 'price'` | Documented: Kane observes but saves nothing to `final_state` | Use the `store ... as '<name>'` pattern (verified: it filled `final_state`) |
| Asserting the trigger, such as `verify the Submit button is visible` | Documented: it fails exactly when the action worked | Assert the outcome on the page |
| Writing a long objective | Documented: runs drift and stall past about 15 steps | Split it and run the parts in parallel |
| Expecting `ask_user` answers in CI | Documented: prompts are disabled without a terminal and the step fails | Write objectives that never need an answer |
| Trusting the `failure.yaml` triage blindly | It is a model's opinion; it was right in my runs, but the docs warn against pasting its fix into a test | Check the HAR, console and screenshot first |
| Committing `.testmuai/evidence/` or `.context/` | Documented: large binary packs, and a corrupted single-writer store if merged | Commit only `output-*/` and `.testmuai/context.md` |
| Calling `kane-cli` for the first time at the event | The organizers warn a room-wide install costs the first hour | Install, log in and run one flow beforehand |
| Using a shell variable in a redirect path, or `rm -rf` on a relative path, on the box | The box's safety hook blocks the command (seen 3 times) | Use literal scratch paths and move instead of deleting |
| Using `pkill -f` or `pgrep -f` with a pattern that also appears in your own command line | It kills the calling shell (exit 144, seen 3 times) | Put the command in a script file, or kill by PID from `ss -ltnp` |
| Assuming which account signed in | The box signed in as `harishm6250`, not the email on file | Check `kane-cli whoami` after every login |

## Best way to use Kane

Author each flow once and early, replay everything strict and in parallel, and spend credits only on authoring and on failures you need explained. Status: patterns 1 and 2 are built from measured behavior but I have not run them end to end with a coding agent; patterns 5 and 7 rest partly on documentation, and the GitHub Action was not run.

**1. The agent loop (the pattern the event rewards, minus the plain stop hook)**

1. The coding agent changes code. A hook or the agent itself runs `kane-cli testmd run <file> --agent --headless --no-adaptive-heal` for the affected flow.
2. Read only the terminal event (`test_md_done`) and the exit code. If it passed, stop.
3. If it failed, open the pack: `failure.yaml`, the failing step's `annotated.png`, and the HAR and console slice for that step. Map the failing request or element to code and fix.
4. Rerun. Cap the loop at 3 attempts, then hand a short evidence summary to a human.

**2. Variant suites (mutants, rewrites, PR builds)**

- Author once on the baseline with `{{base_url}}`. Copy the test and its `output-<name>/` folder per variant, with each `base_url` in that copy's frontmatter.
- Run `testrun run --parallel N --no-adaptive-heal`, then run only the failures again with healing on.
- Read results from `testrun_member_end` and the summary; keep each variant's pack for evidence.

**3. Credit budgeting**

- Authoring is the main cost: about 55 credits for a 3 to 4 step flow and 13 for a 1 step probe. Plan 6 to 10 flows at most, and author them in the first two hours (my recommendation).
- Passing replays are free. Failing replays cost about 1 to 4 credits. A healing pass cost 13 credits for one failing step and 85 for five members.
- Check `kane-cli balance` before and after any batch. Event day adds KaneAI Pro, but its credit amount was not stated.

**4. Give Kane context**

- Put test accounts, routes, seeded data and known quirks in `.testmuai/context.md`. Let the builder agent keep it current.
- Put secrets in variables marked `secret: true`. They are masked in logs.

**5. CI**

- Use the composite GitHub Action `LambdaTest/kane-cli/integrations/github-action/kane-cli-browser-run@main`. It needs `LT_USERNAME` and `LT_ACCESS_KEY` secrets, uploads the evidence pack and comments the verdict on the pull request.
- Always pass `--headless`, authenticate with `--username` and `--access-key`, and gate on the exit code.

**6. Layered use, because judges rewarded it**

- Use Kane as the builder's verifier, as a performer that does tasks and extracts values, and as the app's own test. The August gold winner used all three.
- Keep the verifier independent of the builder. A verifier that was not scripted to pass is the strongest story.

**7. Demo safety**

- Demo a replay, not a live authoring run: it takes about 15 to 20 seconds and costs nothing.
- Record a full passing run and keep a backup deploy. Submissions lock at 5 PM and no fixes are allowed during demos.
- Check that the service and your Wi-Fi are up in the demo room before the slot.

## Open questions and what I did not verify

These are the claims I could not confirm; check them before building on them.

- **Where reasoning runs and which models it uses.** The engine is closed and compressed. It makes HTTPS calls to LambdaTest-fronted addresses and one AWS address, but I could not tell which service each one is.
- **Analytics.** The bundle names an analytics endpoint and `KANE_TELEMETRY`. I did not test what is sent.
- **A concurrency alternative to `testrun`.** Whether one Chrome per run on distinct ports, passed with `--cdp-endpoint`, avoids the shared-port failure.
- **Scale of `testrun --parallel`.** I tested 5 members. Laptop limits, Chrome memory and credit use at 20 or more are unknown.
- **Whether the healed-versus-strict split holds.** One cosmetic variant against three bugs is too small a sample.
- **Log attribution on a real app.** The shop app makes no network calls, so the HAR and console were nearly empty and I could not check per-step attribution.
- **Whether a failed replay's investigation can be skipped.** It costs about 1 to 4 credits; I found no flag for it.
- **Not run at all:** mobile and real devices, the assurance commands, the agent skill and status strip, the GitHub Action, and headless login with an access key.
- **Event-day credit amount.** The event gives 3 months of KaneAI Pro and $250 in OpenAI credits, but not how many Kane credits.
- **Which Google account signed in.** The box used `harishm6250`; confirm it is the intended one.

## Reference

**Environment variables.** The first group is in the docs; the second I found only as names in the bundle and have not tested.

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
| `KANE_DEV_MODE`, `KANE_TRACE_REASONING`, `KANE_REPLAY_TRACE`, `KANE_TELEMETRY`, `KANE_CLI_GRID` | Names only; behavior unverified |

**Service names seen in the bundle:** `kaneai-api.lambdatest.com` (controller), `test-manager-api.lambdatest.com` (Test Manager), `accounts.lambdatest.com` (OAuth), `evidence.lambdatest.com` (viewer), `wss://cdp.lambdatest.com/playwright` (cloud browser).

**Files created for these tests**, all in `/home/harish/code/kane-spike/`: `app.js` (shop app with switchable bugs and request logging), `tests/shop_test.md`, `tests/shop2_test.md`, and the scripts `replay.sh`, `replay2.sh`, `parallel.sh`, `parallel2.sh`, `testrun-par.sh`, `urltest.sh`, `healcheck.sh`, `probe.sh`, `offline-inner.sh`, `conc2.sh` and `analyzer.sh`. A sandbox install of the CLI is at `/tmp/kane-research/inst`, and the cloned repo, package tarballs and per-run output folders are under `/tmp/kane-research`.

**Sources**

- [Kane CLI repository](https://github.com/LambdaTest/kane-cli)
- [Kane CLI on npm](https://www.npmjs.com/package/@testmuai/kane-cli)
- [Kane CLI introduction](https://www.testmuai.com/support/docs/kane-cli-introduction/)
- [Kane CLI skills for coding agents](https://www.testmuai.com/docs/kane-cli-skills.md)
- [Kane CLI NDJSON agent mode](https://www.testmuai.com/blog/kane-cli-ndjson-agent-mode/)
- [Kane CLI hackathon winners](https://www.testmuai.com/blog/kane-cli-hackathon-winners/)
- [Kane CLI Hack Day](https://luma.com/kane-cli-hack-day)

Command output, timings and credit figures above come from runs on the box on 24 Oct 2026 with `@testmuai/kane-cli` 0.9.0.

---

## Appendix A: Product ideas considered and how they ranked

This appendix is not in the shared doc. It records the idea search for the Kane CLI Hack Day and the decision so far.

**Method.** 38 ideas were collected over the session. Eight independent reviewer personas (a TestMu AI co-founder, an OpenAI engineer, a hackathon veteran, a skeptical investor, a product designer, a feasibility red-teamer, a past Kane hackathon winner and an audience developer) each scored every idea for Win (chance to place in the top 3 if perfectly executed) and Feas (feasibility in 7 hours for 4 people). They were given the event page, the past winners, everything measured about Kane, and the research findings. The reviewers are personas of one model, and Drop and Clean Vote were the only ideas with real measurements behind them, which likely helped them.

Tags: L = standalone product with Kane as a reliability layer, M = in between, K = Kane is effectively the product.

| Rank | Idea | Tag | Win | Feas |
| --- | --- | --- | --- | --- |
| 1 | Drop (limited-stock sale, swarm-rehearsed, naive/safe switch) | L | 7.88 | 6.6 |
| 2 | Fair Launch (community registration with provable lottery and a rehearsal gate) | L | 7.75 | 3.9 |
| 3 | Trust Room (voting plus prize drop with an integrity panel) | L | 7.00 | 5.9 |
| 4 | Clean Vote (audience poll attacked live) | L | 6.50 | 7.9 |
| 5 | Bug Report to Verified Fix | M | 6.25 | 5.6 |
| 6 | Agent Duel (two coding agents refereed by Kane) | K | 5.88 | 5.0 |
| 7 | Ballot Court / Fair Drop hybrids | L | 5.88 | 5.5 |
| 8 | Proof (verified app builder) | L | 5.62 | 5.0 |
| 9 | Playtest Lab | M | 5.62 | 5.9 |
| 10 | Converge (real-time collaboration proven to converge) | L | 5.50 | 5.3 |
| 11 | Docs That Can't Lie | L | 5.38 | 6.4 |
| 12 | Launch Rehearsal standalone | K | 5.12 | 6.5 |
| 13 | Break My App | K | 4.88 | 5.8 |
| 14 | Live Bug Bounty | M | 4.88 | 5.1 |
| 15 | Receipts for AI Agents | M | 4.75 | 4.8 |
| 16 | Agent Guard | M | 4.62 | 5.0 |
| 17 | Cannot-Double-Book | L | 4.62 | 7.1 |
| 18 | Spec-to-Proof scoreboard | K | 4.50 | 6.1 |
| 19 | Rewrite With Proof | L | 4.38 | 3.1 |
| 20 | LLM-App Red Team | K | 4.38 | 5.8 |
| 21 | Mutation Lab | K | 4.12 | 5.4 |
| 22 | PR Behavior Diff | K | 3.88 | 5.9 |
| 23 | ReadableSTEM checks | L | 3.88 | 7.8 |
| 24 | Site-to-Tool Factory | K | 3.75 | 3.9 |
| 25 | A11y/Persona Auditor | K | 3.62 | 5.8 |
| 26 | Verified Briefs (Holdbrief) | L | 3.38 | 6.5 |
| 27 | Agent Arena | K | 3.38 | 4.6 |
| 28 | Submission Grader | K | 3.25 | 6.6 |
| 29 | Gift Health | L | 3.25 | 6.4 |
| 30 | Slot Finder | K | 3.00 | 4.6 |
| 31 | Consent Court | K | 2.88 | 6.4 |
| 32 | English Synthetic Monitoring | K | 2.75 | 7.4 |
| 33 | Perf-aware coding agent | M | 2.75 | 6.8 |
| 34 | Cross-platform parity matrix | M | 2.50 | 2.5 |
| 35 | Session-to-Flows | K | 2.38 | 3.4 |
| 36 | Sign-off | K | 2.25 | 5.9 |
| 37 | Kane MCP server | K | 2.25 | 8.1 |
| 38 | Vendor Portal Bridge | K | 2.25 | 3.5 |

**Patterns in the ranking**

- Drop was ranked 1st to 3rd by every judge. Fair Launch was polarized: five judges ranked it 1st, but the red-teamer ranked it 9th and the veteran 19th, over scope.
- The top four are one family: fair or limited-capacity live moments checked by a swarm of browsers.
- Ideas where Kane is the product ranked low; the best of them, Agent Duel, was 6th.
- The most named overrated ideas were Proof (crowded category), Rewrite With Proof and Agent Duel.

## Appendix B: Product decision so far

**Recommendation: Drop's core inside the Fair Launch frame.**

- A capacity-safe drop and registration platform that stands alone as a product.
- Kane in the agent loop: a swarm re-buys after each agent edit, and the fix merges only when the server-side invariant holds.
- Live demo: a naive/safe runtime switch (a flag flip, not a code push), a Verification Timeline built from real build-day evidence, and the audience attacking from phones.
- Stretch goals: the lottery with a public recompute page, the waitlist, and a live canary buyer.

**Why.** Documented pain (opening-day crashes of parks camp registration, double-sold seats); Kane's measured strengths map directly (explicit journeys, parallel buyers, replay, evidence); and the invariants are decided in the product's own code, so Kane's weaknesses are avoided.

**Evidence behind it** (small samples, one machine, 24 Oct 2026): 5 parallel Kane buyers oversold a 3-unit naive checkout in 4 of 4 runs and a safe build held in 3 of 3; 8 parallel buyers also worked; local parallelism is capped at 9 Chromes. See the "Swarm spike" and "Ballot spike" sections above.

**Risks.** Every Kane run needs the internet; the 9-browser cap; a compound English assertion can falsely pass (about 1 in 3 in one test), so decide invariants in code; no fixes can be pushed during demos, so keep a recorded failure-then-fix run as a fallback; scope must be cut hard to fit 7 hours.

**Ideas suggested by reviewers and not tested:** a hostile-audience Drop, a "Test Drive" pull-request bot, a real-time auction with a fairness invariant, and a deterministic invariant gate for agent merges.


## rc.3 follow-up smoke probes — October 24, 2026

Installed separately and inspected help/tagged docs: `/tmp/kane-rc3-review`, confirmed0.10.0-rc.3. New explore has local1–4/remote1–20 browsers, separate from testrun. Explore designs tests but never executes them; remote exit0 means queued; local completed/budget is not application proof.

On an isolated handwritten $10 widget/$11 total fixture, one guided, read_only exploration (max3leases,no-context) stopped after2leases/~40seconds, one click, and found only missing html lang. It did not report the arithmetic defect or finish the requested2-item check. This is one bounded probe, not a detection benchmark.

An explicit named run failed on the fixture; however its RCA wrongly described empty cart/$0 while the inspected final pack screenshot shows1item/$11. Correct fixture rerun passed and re-authored once. Next unchanged run passed via cached replay (1.32s runner,5s testmd summary). Restoring wrong pricing made the same strict recording fail at the exact price assertion (20.84s runner,25s summary), extracting Total:$11. This time RCA described the correct price defect but confirmed:false because citation verification could not mechanically verify the contradiction. Keep assertion outcomes, confidence, confirmation and cause attribution separate. No broad reliability or speed claim follows from one run per condition.

Full details and evidence paths: [community research](./kane-community-agent-research.md). Source: https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/exploration.md
