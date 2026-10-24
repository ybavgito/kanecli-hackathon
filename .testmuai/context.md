# Raising Kane

When websites raise hell, raise Kane.

## Product

A website-first interface for two supported synthetic tasks: a Northstar Outfitters partial return and a Linden Home appointment change. The local Node server runs the product plus two source origins. Kane operates the sources during actual tasks, extracts every mandatory review field, repairs conflicting drafts, submits only user-approved terms and verifies persistent confirmations.

## Current implementation

- Run `npm run dev`; app defaults to port 5173, source portals to 5174 and 5175.
- Website/task selection, persisted task links, current-phase progress and source comparisons.
- User choices can be revised in either direction; old approval is invalidated.
- Source inspection is read-only. A source change invalidates stale displayed verification.
- Failed discovery is restored before preparation, including the unchanged-item baseline.
- Source-owned revision/digest grants and duplicate-safe commits; operation reconciliation.
- Task control belongs to the browser session that started it. Kane source profiles are separate.
- Complete return and appointment receipt UI; source confirmation and synthetic QR pages.
- The return source deliberately resets refund destination when the method changes. A separate Kane check must expose the conflict before correction and the same check reruns.
- The appointment source offers three different technician/fee combinations and a clearly labeled fixture availability control. No old booking is cancelled before approved commit.
- OpenAI intent interpretation remains optional with a clearly labeled bounded sample parser fallback. Do not claim a live OpenAI call unless observed.

## Acceptance requirements

`requirements/raising-kane-completion.md` defines the current acceptance requirements. `npm test` checks source contracts and controller failure paths using explicit test doubles where described. Real product jobs and generated Kane acceptance tests supply browser evidence. Code being implemented does not by itself mean either workflow has passed end to end; record actual runs in `docs/raising-kane/verification.md`.

## Evidence

Keep red and green review attempts, source operation identity, exact approved terms and final confirmation. Never publish credentials or runtime browser profiles. Local acceptance assurance is separate from the team's shared Test Manager project. Do not link a shared project into a folder containing a local `.context/` store.

## Generated-interface builder (new implementation under verification)

Default entry is now the URL-first builder. Existing prebuilt workflows remain at
`/?legacy=1` and existing task URLs remain valid. The builder accepts an optional
intent; URL-only builds preserve overview mode. See `requirements/raising-kane-builder.md`.
Only configured synthetic source entrypoints are accepted. Actual Explore, source
screenshots, model-generated React, isolated preview checks and bounded repair history
must be visible. Do not treat a compiled candidate as verified or a verified build as a
completed user transaction. All source mutations in this release use synthetic records.
