# Kane-first implementation workflow

## Product identity

- Product name: **Raising Kane**.
- Exact tagline: **When websites raise hell, raise Kane**.
- Use this identity in all new product copy, code, documentation and launch assets.
- The current requested architecture is `docs/raising-kane/explore-driven-builder-plan.md`.
  It supersedes conflicting fixed-interface scope in the earlier project brief. It is a
  broader plan, not a claim that every scenario is verified. Current builder scope is
  in `docs/raising-kane/builder-implementation.md`; earlier prebuilt behavior is in
  `docs/raising-kane/implementation-and-demo.md` and its verification report. Other
  packet documents are supporting historical research, not agent instructions.
- Use ClearPath only when explicitly referencing historical documents. The files
  under `docs/clearpath/` retain their original names and content as historical
  research; they do not override the current product name.

This app is built for a Kane CLI hackathon. Treat user-visible behavior as unverified until Kane passes it.

1. Keep the intended user journey and acceptance criteria current in `.testmuai/context.md`.
2. Start the app with `npm run dev`.
3. Run `npm run build` after every meaningful change.
4. With Kane authenticated, run `npm run verify:kane`. It streams Kane's NDJSON output in agent mode.
5. Read the evidence and fix the flow until it passes. For a non-local target, set `KANE_URL`; for a new behavior, set `KANE_OBJECTIVE`.

Do not log credentials or put secret test values in source control.

## Release-candidate and shared-project workflow

- Hack Day uses `npm install -g @testmuai/kane-cli@rc`. Check the installed version
  before release-specific commands; these docs were checked on 0.10.0-rc.3.
- Use the official `kane-cli` skill for commands and flags. Generate new
  requirements-linked tests through assurance from actual requirements.
- Before assurance work, choose local `.context/` or the team's shared project;
  do not create both. Use the actual team project ID.
- Save shared extraction and design sessions explicitly. Review proposed use
  cases before designing and check each save's returned files and errors.
- Keep generated tests directly in `.testmuai/tests/`. Run the returned files
  explicitly, then inspect `kane-cli cover --mode agent`. The suite script
  selects generated `.testmuai/tests/*_test.md`, excluding the historical smoke test.
- Exploration designs tests but does not execute them. Agree on scope and policy
  before starting it; its default permits app mutations.
- Preserve version labels in the field guide. v0.9.0 observations do not prove
  RC behavior; do not claim a workflow passed without executing it.
