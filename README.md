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
