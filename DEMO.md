# Raising Kane — demo runbook

**When websites raise hell, raise Kane.**

## Start

```bash
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. Kane CLI `0.10.0-rc.3`, Chrome and an authenticated
Kane account are needed for live browser operations. Put `OPENAI_API_KEY` in ignored
`.env` for new generation. The coding model defaults to `gpt-6.1-sol`.

**Demo now** opens real recorded generated builds immediately, without a model call.
The app labels their capture date and checks the original artifact hash. Opening a
recorded interface does not import an old customer task, receipt or approval. Starting
a task uses fresh synthetic records and real Kane jobs. Do not present a recorded build
as a fresh generation.

## Show the product difference

1. Open **the original Northstar website** at `http://127.0.0.1:5174/store`.
   Follow Shop → Red running shoes → size 9 (sold out). Open My orders → ORD-0938
   (return window closed) → warranty. Then ORD-1042 → return policy → return form.
   These are actual linked pages, not decorative navigation.
2. Show the build made with **URL only**. Its generated read-only guide offers local
   Shop, My orders and Help views based on captured evidence. No transaction starts.
   The latest broad Explore run observed 8 screen states and 10 flow records; it was
   bounded, not exhaustive.
3. Show the build made with a **return intent**. The generated UI centers on the selected
   shoes, kept jacket, method fee and refund destination. The source branch images show
   why those controls and comparisons exist. This is a different generated artifact.
4. Open **What Kane found → What it changed → What was checked**. Show the actual
   screenshots, evidence-linked code decisions, English test and candidate result.
5. Exercise one live source operation. For a short stage slot, prepare a fresh return
   draft before the presentation and disclose that preparation. Changing to QR drop-off
   is the live action: the source resets the destination to store credit; Kane detects
   the mismatch and approval is blocked. Restore the original choice and show the green
   source check. Approval and submission are separate trusted-host controls.

A return receipt confirms a **request with refund pending**, not money already refunded.
For Linden, the result is a changed Saturday appointment with Maya, zero added fee and
one active booking. Both source websites are fictional local sandboxes.

## Timing and evidence

Fresh generation and first-time browser authoring can take many minutes. The measured
first Linden build took about 14 minutes. Use the recorded build entry for a predictable
start; source jobs still run live and can take minutes. The recorded two-step receipt
check took 155 seconds to author and 35 seconds on its final successful pure replay.
That comparison applies to that read-only check, not the entire application.

The source fixtures retain state under ignored `data/`. Keep that directory and the
browser session to resume work. Do not clear records during a live task. A timed-out
submission is reconciled against its operation ID before another delivery is attempted.

See [verification and retained failures](docs/raising-kane/builder-verification.md) and
[reviewed evidence packs](docs/raising-kane/evidence/builder/packs/provenance.json).
