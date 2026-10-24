# VisitFit: commitments, dependent steps, and scenario checks

October 24, 2026. This memo refines the product around completed commitments rather than a generic itinerary. A small local fixture is being used to test orchestration mechanics, not venue compatibility or consumer demand.

## The improved product

The useful job is: “Help me complete this outing without making later choices that contradict what is already confirmed.” Store each step's actual outcome, its evidence, and its dependencies. Distinguish suggested, selected, externally confirmed, and unconfirmed actions. A hypothetical branch never changes a real booking.

Example progression: confirmed museum ticket → lunch/transfer constraints → choose a compatible next admission → check the complete plan → rehearse a delay → propose a minimal repair preserving confirmed commitments. A user may complete a purchase manually on the provider's website. Importing or entering a receipt does not automatically establish current provider booking status; corroborate when accessible and disclose the evidence scope.

## Where Kane fits

Before a choice: operate the supported provider configuration and observe actual date, party, prices and offered options. After an action: reopen an authoritative result when accessible and compare identity/time/status with the intended action. Between steps: execute the next bounded mission using context assembled by the app. In a draft: walk through changed inputs and check downstream selection, warnings and final summary. During a repair: recheck only affected provider configurations.

Ordinary code manages the dependency graph, time arithmetic, scenario enumeration, state/versioning and invariants. The application orchestrator selects the next mission and passes relevant context. Kane is the browser executor and evidence collector, not a turnkey persistent workflow engine. A browser rendering a booking as confirmed proves only the visible state unless its authority is established.

## Scenario rules

- Preserve the baseline revision and externally confirmed commitment identity.
- Explicitly identify the scenario delta, such as delayed departure or hypothetical rain.
- Determine affected downstream nodes, then calculate constraints before browsing.
- Check new live provider configurations only when needed.
- Keep hypothetical availability, weather and delays distinct from actual observations.
- Do not force a successful plan; “no offered alternative fits” is a useful outcome.
- Do not auto-cancel, rebook or pay as part of a rehearsal.

## Local feasibility setup

Fixture and orchestrator: `/tmp/visitfit-context-spike/server.py` and `continue.py`. They serve a clearly labeled fictional outing on localhost. No external booking, purchase, provider inventory or weather was used.

The fixture displays confirmed locked museum booking DEMO-MUSEUM-42, 2026-11-07, 10:00–12:00. It offers Aquarium 12:30, Aquarium 14:00 and Garden walk 14:00. Lunch is 60 minutes and transfer is 30 minutes; independently computed earliest next activity is 13:30. A hypothetical rain preference excludes the garden. A hypothetical 90-minute extension moves the earliest next activity to 15:00, so none of the offered choices fits. These are reviewed fixture expectations, not discovered travel facts.

Run 1 attempted to verify and extract multiple values with an eight-step budget. It extracted information but repeated analyses and failed at the step limit. Reported runtime: 77.3 seconds; credits: 42.41227. This is an automation failure, not a fixture bug or successful validation.

The shorter retry requested one stored end time and confirmed/locked assertions. It passed, reporting 22.8 seconds and 15.7271575 credits, and returned booking_end = 12:00 in structured context memory. The orchestrator accepted only the passed retry, extracted that value, calculated 13:30 in Python, and constructed the next mission. It did not assume implicit cross-run memory.

The next mission checked rain exclusions, selected the later aquarium, then changed to the delay scenario and checked that the selection was cleared and the original booking unchanged.

### Scenario run: actual failure and fix

The first scenario run failed after a reported 119.4 seconds and 42.5105575 credits. It reported `render is not defined` and `Unexpected string` in the browser console. The fixture's Python string literal had consumed JavaScript escape characters, producing invalid JavaScript. This was an accidental implementation error in the fixture, not a deliberately planted failure and not evidence of a provider defect. The repeated native-selector actions were therefore not sufficient grounds to blame the selector implementation alone.

The coding agent read the failure, changed the HTML literal to a raw string, extracted the served JavaScript and ran `node --check` successfully. It then reran the same orchestrator-generated scenario objective. That run passed, reporting 177.7 seconds and 65.1359025 credits. It selected hypothetical rain, checked disabled choices, selected Aquarium 14:00, checked the saved selection, changed to the hypothetical delay, checked no offered next activity fits and selected=null, and checked the original confirmed/locked booking remained unchanged.

This provides an actual browser-failure → agent fix → green rerun sequence. It is a local fixture journey, not a completed consumer product or a third-party integration. One earlier disabled-control assertion was reported passed despite the broken page; the overall run still failed. Future missions should require controls to exist before checking their disabled state, and should not promote intermediate assertions into whole-task success.

Elapsed stream-start to terminal-event time for the successful scenario was approximately 192 seconds, versus 177.7 reported execution seconds. The invocation included `--timeout 150`; that flag did not bound this observed end-to-end wall time. Enforce an external job-wide deadline instead of assuming it does. No general throughput/cost benchmark is implied, and credits are not converted to currency here.

Raw local records: `/tmp/visitfit-context-spike/commitment.ndjson`, `commitment-retry.ndjson`, `inherited-context.json`, `scenario-objective.txt`, `scenario-before-fix.ndjson`, and `scenario.ndjson`.

Evidence session IDs: first extraction `1363d455-023b-4dbf-b237-a7e32c41c725`; passed extraction `4e9609ef-6401-4db7-9c42-dadee0104ddb`; failed scenario `7c69dc30-3ddd-424b-afa6-f5a37d70cfe9`; passed scenario `92c7ddb0-9aa7-4b89-9abb-ad7c294ab422`.

Both local server instances were stopped after the runs. No research server or active Kane job was intentionally left running.

## What would establish real product usefulness

This fixture can show that context extraction, orchestration and browser branches work for these cases. It cannot show that the same pattern is necessary for a fixed first-party UI: direct application/API checks may be simpler. Stronger product evidence requires one real supported provider observation that materially affects a subsequent choice, and a completed flow that saves the organizer work. No planted fixture failure should be presented as a naturally discovered provider bug.

The clearest demo is one commitment, one consequential next choice, one realistic changed assumption, and an evidence-backed repair or honest no-fit result. More personas and weather branches do not compensate for an unproven live integration.
