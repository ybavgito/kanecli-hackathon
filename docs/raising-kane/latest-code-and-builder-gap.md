# Latest code checkpoint and the builder gap

Fetched October 24, 2026. Reviewed remote PoC head `945613d6abbbc2b745b9c5af07a3688468b76899`
and main head `f46b64078216f1f08404d3106e0613a4846ff3a1` before this documentation update.
The branches were fetched and read; the PoC was not merged or substituted for main.

## What changed in the PoC

- `ff1294a` preserves exact, explicitly nonsecret named observations from Kane's
  `context.variables` when `final_state` contains renamed or summarized fields. Those
  allowed observations take precedence. The memory merge excludes unapproved variable
  names, secrets, inputs and malformed memory entries. It still copies the existing
  `final_state` summary, including unrelated fields; it is not a complete redactor.
- It adds a read-only path: retrieve source facts, separately check them against the
  selected source/task/account context, then persist a verified result. Retrieval does
  not need transaction approval.
- `945613d` refines discovery instructions to prioritize real actions before broad
  site navigation, and adds four parser regression tests.
- The latest verification ledger records a completed Books to Scrape journey: select
  Travel, read 11 results and a book/price, match 8/8 analyzer conditions, persist a
  receipt, refresh and reopen without rerunning the task. Books to Scrape is an external
  synthetic demonstration catalog, not a real purchase integration.

The four parser tests were run against an isolated copy of the exact remote files and
all passed. The browser result above is the branch author's recorded evidence, not a
fresh rerun of that whole application in this review.

## What this contributes to our plan

Reuse the connection lifecycle, human takeover/resume work, scoped observation names,
evidence references, saved results and reload behavior. The parser fix matters because
the builder must receive the actual extracted values rather than a friendly summary.
Extend that contract with image/state references and an explicit builder-output allowlist;
do not send all raw model context or assume the copied `final_state` is sanitized.

## What is still missing

The PoC invokes bounded `run` objectives and analyzer checks; its runtime does not call
actual Kane Explore. Its frontend renders hand-written generic components. It does not
launch a coding agent, attach a source screenshot bundle to that agent, build/host a new
artifact or rebuild generated code after a failed preview check.

Both branches still have global Kane job serialization patterns. A future preview test
that triggers a nested source operation needs separate queues/owned browsers as specified
in the plan. The PoC's natural-language no-mutation instructions do not establish the new
inspect/test/live enforcement contract.

Main also contains completed return/appointment sandbox behavior and source contracts
that differ from the PoC. A direct whole-file replacement would discard useful work;
integrate the relevant modules deliberately. This review did not perform that merge.

See the [builder input contract](builder-inputs-and-kane-vision.md) and
[complete implementation plan](explore-driven-builder-plan.md) for the next build.
