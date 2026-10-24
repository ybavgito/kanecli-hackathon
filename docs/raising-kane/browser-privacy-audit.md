# Raising Kane browser privacy audit

**When websites raise hell, raise Kane**

Audited October 24, 2026, before using personal accounts. Installed release:
`kane-cli 0.10.0-rc.3`, macOS arm64. This is a source/configuration audit of that
installed build, not a network capture, vendor retention promise, or independent
security certification. Recheck after upgrading Kane.

## What leaves the computer

A dedicated local Chrome profile does **not** make Kane local-only. Treat the
website's page content, visible account data, screenshots, objective, extracted
values, and execution diagnostics as externally processed while Kane is running.
Ordinary `action` and `testing` runs use the same upload pipeline when the saved
Kane identity permits it. Action mode changes blocker behavior; it is not a
privacy setting.

Evidence inspected in the installed npm package at
`/opt/homebrew/lib/node_modules/@testmuai/kane-cli/`:

- `dist/index.js`: normal agent runs create evidence, prepare a remote Test
  Manager test, drain the screenshot queue, execute `UploadPipeline`, persist a
  recorded session, and sync its bundle. Upload eligibility does not depend on
  action versus testing mode. The worker does not request a local-only mode.
- `dist/chunk-VZ4A6WMK.js`: the screenshot queue obtains signed upload parameters
  from the controller and sends screenshot bytes with HTTP PUT. It can convert
  screenshots to JPEG. A remote logger is started using the saved Kane identity.
- `dist/chunk-WXJCJL5L.js`: the local runner receives the configured remote V16
  server host and authentication. Its configuration enables a media-upload
  endpoint when identity fields are present; it supplies a telemetry proxy unless
  the CLI's telemetry opt-out is set. Runner stderr is written to the local
  session directory. No blanket masking guarantee was found here.
- `dist/chunk-D36V5OX6.js`: production destinations include the Kane controller
  (`kaneai-api.lambdatest.com`), Test Manager (`test-manager-api.lambdatest.com`),
  the media/share API and telemetry (`dd-proxy.lambdatest.com`). Signed blob URLs
  can name additional hosts. This is not an exhaustive network allowlist.
- The official skill's `references/evidence.md` and `references/parsing.md`
  describe local evidence packs containing per-step screenshots, console and
  network logs, definitions and results, plus session event streams. The worker
  returns selected structured fields to its controller; it does not stream raw
  stderr or CDP details into the application UI.

`--analyzer-only` internally sets local mode, suppresses the ordinary evidence /
Test Manager save path, and returns individual condition verdicts. It still
starts the runner and is **not** an offline inference or no-logging guarantee.
Source shows remote logger initialization independently of the screenshot queue.
The CLI's hidden `--local` suppresses Test Manager integration, not all remote
inference/media/telemetry; Raising Kane does not advertise it as a privacy boundary.

The installed binary's complete inference payload and server-side retention,
redaction and downstream processing were not proven by this audit. No personal
account was opened for this audit; no cookie database or credential store was
read. Do not claim that passwords, page secrets, cookies in network artifacts, or
all personally identifying information are automatically excluded from every
Kane artifact.

## Manual sign-in boundary

Before credential entry, takeover waits for all active Kane processes for the
connection to stop and cancels queued jobs. The CLI trampoline launches a bundled
Node runtime and ignores parent-only SIGTERM, so the worker launches Kane in its
own process group and sends TERM followed by KILL to that group. Chrome is in a
separate group and stays open. Requests arriving while paused cannot start Kane.
Generation checks prevent work queued before takeover from starting after resume.
Kane runs remain globally serialized. Opening or focusing an idle/paused browser
uses a separate per-connection lifecycle queue, so human sign-in does not wait
for an unrelated connection’s Kane run. It still rejects a connection with its
own queued/running Kane work, and pause/disconnect track and cancel lifecycle
operations too. Subsequent Kane work waits for its connection’s open operation.
The takeover request must finish successfully before the UI invites sign-in.

The person enters passwords, OTPs, passkeys and CAPTCHA answers directly on the
original website. Raising Kane must never request them as task fields, put them
in objectives, copy them into application history, or log them. After signing in,
the person should leave credential forms for the intended account page before
continuing. Before resume, show this disclosure and require its acknowledgement:

> While Kane runs, website content, visible account information and screenshots
> may be processed by TestMu AI and its services, and run evidence may be stored
> there. Sign in directly in the open website while Kane is paused. Continue only
> when the intended account page is ready.

The worker's pause guarantee concerns its owned local runner processes. It cannot
recall a request already sent remotely, erase uploaded evidence, or undo a website
operation that completed before cancellation. An interrupted submission needs a
read-only source reconciliation. Account changes invalidate approvals in the
controller.

## Browser ownership and deletion

Each connection uses a private profile under ignored `data/chrome-tasks/`, with
owner-only directory permissions, a hashed connection path and an ownership
record. It does not copy the person's everyday browser profile. CDP binds to
loopback and its address is never returned in public browser state. Loopback CDP
is still accessible to other software running as the local user; this is not
protection against a compromised machine.

Direct CDP usage is limited to browser endpoint readiness, tab creation / focus,
and lifecycle. DOM reading, page assertions, extraction and clicks belong to
Kane. Opening an existing connection focuses its existing page, preserving sign-in
context. Live verification found that CDP tab activation alone did not bring
Chrome above Codex. On macOS, open/focus now also makes a best-effort native
frontmost request through `osascript` / System Events for the exact Chrome PID
whose command line was verified against this connection’s private profile. It
reads no window content, page DOM, credentials, or cookies. The helper allows
1.5 seconds, then terminates the helper process group (with a 2-second hard-kill
grace period). Native focus is tracked inside the lifecycle operation; takeover
and disconnect cancel it and wait for it before returning. A native permission
error or timeout leaves opening successful and returns `focused:false`,
`focusStatus:"manual"` and a manual window-selection message. Only a successful
script response confirming `frontmost` returns `focused:true`; operating-system
focus can subsequently change.

Current-page runs omit `--url`; a custom saved Kane default URL is
rejected because that CLI preference otherwise causes navigation on resume.

Disconnect cancels queued work, stops the owned runner group, verifies the Chrome
process belongs to this exact profile, closes it, waits for exit, then removes the
private profile including locally stored cookies. A failed ownership or exit
check retains the profile and reports failure instead of claiming successful
cleanup. A disconnected control remains a tombstone against late requests in the
same server process; the controller persists disconnected connection state.

Disconnect does **not** delete application records, prior local Kane sessions /
evidence, already uploaded screenshots / tests / logs, remote site sessions or
records, OS backups, or guarantee forensic secure erasure. Website logout and
vendor evidence deletion are separate operations. The implementation does not
read or expose cookie contents.

## Verification boundary

`node --check server/kane-worker.mjs` and `npm run build` passed after the worker
changes. Backend parser/cancellation fixtures and a disposable visible Chrome lifecycle
check passed: true/false/null/missing verdicts, current-page CLI flags, repeated
child step identifiers, pause/resume, process-group cancellation of a runner that
ignores TERM, queued cancellation behind unrelated work, profile removal and
disconnected-request rejection. A separate queue fixture confirms open lifecycle
operations execute while unrelated Kane work is still running. Native-focus
fixtures passed exact-PID selection, confirmed-focus reporting, denied-focus
fallback and cancellation while focus was pending, without invoking native UI
automation or touching the person’s signed-in browser. These are
implementation checks, not proof that the URL-first user journey passed
Kane. Actual Kane E2E results are recorded separately in `verification.md`; old
merchant results do not verify this new workflow.
