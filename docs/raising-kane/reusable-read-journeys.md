# Raising Kane reusable read journeys

**When websites raise hell, raise Kane**

Implemented against Kane CLI **0.10.0-rc.3**, October 24, 2026.

## Runtime contract

The explorer opts a public source read into recording by passing
`journey: {readOnly: true, sourceUrl, goal, account, requirements}` to `runKane`.
The worker hashes the exact URL, goal, requirements, account class, and complete
guarded objective. Keep the task context stable: include material action and
option facts, answers and constraints, but omit randomly assigned UI/evidence IDs.

The first read is a real `kane-cli run --name` recording. Kane writes its own test
definition and recordings. Raising Kane never hand-authors a `_test.md` for a
runtime journey. Artifacts stay inside ignored, private `data/kane-journeys/`
directories and never enter the shared assurance suite or its coverage totals.

A passing extraction is only a candidate. The controller still independently
checks the current source/account, every fact, the summary, and the task
requirements using the analyzer. It passes the raw source and analyzer results to
`confirmKaneJourney({result, verification})`. Only all-true verdicts from this
worker, from the same browser and generation, completed after extraction, promote
the recipe. A fabricated, prior, false, unknown, interrupted, or different-browser
check cannot promote it. Persisted metadata contains digests and timestamps, never
previous extracted answers.

A matching proven journey executes through actual `kane-cli testmd run` with the
connection's current private CDP endpoint. Success requires both `test_md_done`
with `overall_status: passed` and process exit zero; an inner `run_end` is
insufficient. The worker records the CLI's replay/author counts and healing flag.

**RC.3 limitation observed in an actual replay:** the replay stream supplies no
fresh extraction variables. Raising Kane therefore runs a fresh Kane source read
after successful replay, then requires the independent analyzer again. It never
reads previous `Result.md`, recording variables, or cached final state to populate
the answer. This implementation makes no speed or cost saving claim.

`result.journeyEvidence` holds the replay's separate evidence record;
`result.evidencePackPath` remains the fresh extraction's pack. The controller
should retain both and the independent verification evidence. `result.journey`
reports `mode` (`recorded`, `replayed`, `healed`, or `authored`), `status`
(`candidate`, `proven`, or `not_saved`), replay/author counts, `healingUsed`,
`requirementsPreserved`, and the fresh-verification requirement. The normal
`result.mode` remains `action`/`testing`/`analyzer`.

## Healing and scope

Kane's default adaptive healing stays enabled. A replay executes on a private copy
of the proven recipe; a failed or unverified recovery cannot replace the prior
recipe. A changed saved task definition is refused. A successful recovery still
needs a fresh read and all the original independent requirements before promotion.
Healing progress and the eventual healing flag are reported, rather than silently
calling a new authoring run a replay.

Reuse currently accepts public, read-only sources without URL queries or fragments.
Signed-in, unknown-account, and potentially credential-bearing contexts use live
reads. Named recordings that observe a nonpublic/failed source are not eligible.
Changed source, goal, requirements, or guarded objective needs a new recording.
Recipe metadata expires after seven days; answers are always read again. Cache
failures do not turn a valid live read into a false cached success.

## Executed evidence

An isolated Books to Scrape Travel-category read completed the following actual
sequence, without touching the app's existing connection browsers or changing the
source:

1. Named recording passed and extracted **It's Only the Himalayas — £45.17**.
2. Independent current-page analysis passed **3/3** conditions and promoted it.
3. A second private browser replayed **1 step**, with **0 authored replay steps**,
   in about **15 seconds**, and produced its own sealed evidence pack.
4. A separate live source read returned the current title and price.
5. A second independent analysis passed **3/3** conditions and promoted the recipe.
6. The isolated browser was disconnected and its profile removed.

Local proof records are in `data/replay-validation/results.json`. The recording
session was `5a1ade38-47f8-4eb9-90a5-7d7a98d8a3f8`; the accepted replay session was
`095ae737-e727-4267-b1a9-b0d379557aa5`; the fresh-read session was
`926171af-1a26-446d-8880-52b057074b66`.

The unchanged public source did **not** trigger healing. Recovery signaling,
unchanged-definition enforcement, isolation, exact-match reuse and promotion
guards have focused regression coverage; live drift recovery is not claimed.
The runtime adapter proof does not substitute for the app's own Kane UI checks.
