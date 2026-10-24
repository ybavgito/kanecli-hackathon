# Raising Kane

**When websites raise hell, raise Kane**

A calm interface for getting a difficult website task done without losing your choices.
Kane operates the source website during the user's workflow, checks its review against
saved preferences, and verifies the resulting confirmation. The app blocks submission
until that review passes and the user approves the exact proposal.

Two working, clearly labeled sandboxes ship together:

- **Northstar Outfitters:** return the red shoes, keep the jacket, choose a return
  reason and refund destination, and get a persistent return receipt with a demo QR.
  Changing to printer-free drop-off exposes a source-site trap: it resets the refund
  to store credit. Kane catches the mismatch; a correction and the same validator
  must pass before approval.
- **Linden Home:** move a service visit to Saturday morning while keeping the same
  technician and avoiding an extra fee. Compare three actual source slots, approve
  a verified choice, and get a saved appointment confirmation. Losing availability
  invalidates approval; the existing booking remains until a valid move commits.

The sites are synthetic. This is a supported-integration demonstration, not arbitrary
website automation, a real merchant return, or a real appointment service.

## Run locally

Use Node 24 (tested), Chrome, an authenticated Kane account with credits,
and the checked CLI release:

```bash
npm ci
npm install -g @testmuai/kane-cli@0.10.0-rc.3
npx @testmuai/kane-cli-skill
kane-cli login --oauth
npm run check:kane
npm run dev
```

Open **http://127.0.0.1:5173**. The source sites run on ports **5174** and **5175**.
Set `PORT` to change the app port; sources default to the next two ports. All three
servers bind to loopback. Use `npm run dev` for the complete application;
`npm run preview` serves only the built frontend and cannot run workflows.

Optional: copy `.env.example` to `.env` and set `OPENAI_API_KEY` for bounded natural
language return interpretation. Without it, the UI explicitly identifies a limited
sample parser. The recorded verification used that fallback, not a live parser API
call. Browser operation still uses real Kane jobs. Never commit credentials.

Task records, source records, approval grants and browser profiles persist under
ignored `data/`. Keep this directory to resume receipts after restart. This is a
single-process local demo; it is not a hosted multi-tenant service.
Tasks created by the older PoC without an owner session remain read-only in this
build. Start a new task to exercise the completed workflow; existing records are
not deleted or silently adopted by another browser.

## Experience and demo

Choose a supported website → make plain-language choices → watch the current Kane
step → resolve any mismatch → approve exact terms → send → receive verified proof.
Previous choices collapse behind **Change preferences**. The source page is optional,
read-only inspection. The evidence panel keeps failures as well as passing runs.
Only the browser session that started a task can approve, submit or download its pack.

Start with the [implemented product and demo guide](docs/raising-kane/implementation-and-demo.md).
The [verification report](docs/raising-kane/verification.md) distinguishes real runtime
jobs, UI checks, deterministic tests and historical PoC evidence.

## Check the implementation

```bash
npm test
npm run build
# With the app running and Kane authenticated:
npm run verify:kane
```

`npm test` covers source-owned approval, stale revisions, duplicate prevention,
availability changes, mandatory extracted fields and recovery after a commit timeout.
These are contract tests; some inject a worker double and are not Kane evidence.

Requirements are in `requirements/raising-kane-completion.md`. Kane assurance generated
three `_test.md` checks under `.testmuai/tests/`. Their variables are deliberately blank:
complete real tasks first and supply their actual URLs, using Kane's object format:

```json
{
  "return_receipt_url": { "value": "http://127.0.0.1:5173/?taskId=YOUR_RETURN_ID", "secret": false },
  "appointment_receipt_url": { "value": "http://127.0.0.1:5173/?taskId=YOUR_APPOINTMENT_ID", "secret": false },
  "start_url": { "value": "http://127.0.0.1:5173", "secret": false }
}
```

```bash
kane-cli testmd run .testmuai/tests/inspect-and-reload-the-completed-synthetic-return-receipt_test.md --agent --headless --variables-file /path/to/local-variables.json
```

Do not run multiple standalone `testmd` processes against the default Chrome port.
The product uses its own task browser profiles and serializes Kane jobs. Local assurance
was used for this build; derived criteria remain unapproved, so this is not a claim of
human-approved assurance coverage. See the [field guide](kane-field-guide.md) before
using shared-project assurance or Explore.

## Architecture and boundaries

React/Vite interface → Node task controller → Kane CLI → separate source website.
The controller stores intent, checks typed browser observations against source records,
and manages recovery. Each source atomically consumes a grant bound to the exact
proposal, draft revision and operation ID. Repeated delivery of the same operation
returns its original result. After an uncertain submission the app looks up that
operation before retrying. A successful click alone never produces a completed receipt.

Approval enforcement depends on these cooperating source adapters. Browser instructions
alone cannot provide atomic transactions on arbitrary third-party websites. Source
JSON writes are atomic within this one server process, not a distributed database.
The demo's records are readable locally; session checks protect actions, not tenant privacy.

## Further documentation

- [Project specification](docs/raising-kane/raising-kane-project-brief.md)
- [Implementation and live demo](docs/raising-kane/implementation-and-demo.md)
- [Evidence and verification](docs/raising-kane/verification.md)
- [Kane CLI field guide](kane-field-guide.md)
- [Research packet index](docs/raising-kane/README.md)
- [Historical PoC audit](docs/raising-kane/poc-review-and-build-priorities.md)
- [Earlier CLI experiments](docs/kane-validation/report.md)
- [Current review bundle](docs/raising-kane-current-review.zip)
