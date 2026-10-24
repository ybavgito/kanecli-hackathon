# Kane-first implementation workflow

This app is built for a Kane CLI hackathon. Treat user-visible behavior as unverified until Kane passes it.

1. Keep the intended user journey and acceptance criteria current in `.testmuai/context.md`.
2. Start the app with `npm run dev`.
3. Run `npm run build` after every meaningful change.
4. With Kane authenticated, run `npm run verify:kane`. It streams Kane's NDJSON output in agent mode.
5. Read the evidence and fix the flow until it passes. For a non-local target, set `KANE_URL`; for a new behavior, set `KANE_OBJECTIVE`.

Do not log credentials or put secret test values in source control.
