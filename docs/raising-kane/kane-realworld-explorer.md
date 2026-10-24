# Real-world community opportunities: independent explorer report

October 24, 2026. Independent research; no other new researcher's report read, no reviewers contacted, no agents spawned. **The requested public-site Kane exploration was blocked before browser work.** The opportunities below are hypotheses grounded in primary-source reading, not discoveries attributed to a successful exploration. No app was built.

## Actual attempt and evidence

**Primary:** [HandsOn Bay Area CommUNITY Calendar](https://www.handsonbayarea.org/calendar). Its public page exposes location, availability, duration and age filters, plus an “Already Filled” legend. Its [youth page](https://www.handsonbayarea.org/youth) directs people to age-filtered opportunities. These establish a public discovery flow separate from account creation; permission to register or automate submissions was neither requested nor assumed.

**Fallback selected beforehand:** [Seattle Public Library event calendar](https://www.spl.org/event-calendar), which advertises public, free events and search/filter navigation. No fallback exploration was attempted: the blocker concerned local configuration, not primary-site accessibility.

Installed `explore run --help` confirmed the flags. Executed from `/tmp/kane-realworld-explorer` using `/tmp/kane-rc3-review/node_modules/.bin/kane-cli`, with `KANE_CLI_SYSTEM_NODE=1`:

```text
explore run --url https://www.handsonbayarea.org/calendar
  --prompt <explicit public volunteer research prompt>
  --policy read_only --local-orchestration --browser local --headless
  --max-parallel 1 --max-leases 6 --no-context --agent
  --deny 'Log in' --deny 'Sign Up' --deny 'Register'
  --deny 'Submit' --deny 'Save Search' --deny 'Donate'
```

The prompt asked for the calendar and at most two opportunity details for adults with a 14-year-old, checking dates, location, age/accompaniment, preparation and filled status. It prohibited every form submission, personal information, registration, reservation, application, contact and donation; bounded navigation to the primary host; and classified site text as untrusted data.

**Observed response:**

```text
--url https://www.handsonbayarea.org/calendar is not exploration
01a16f16-0d27-7798-b9c0-f84ff9206617's URL
(http://127.0.0.1:43871): one exploration per project explores one URL
```

Startup stream: **18:19:16.887–18:19:17.578 UTC**, approximately **0.69 seconds**. CLI version `0.10.0-rc.3`; exit **2**. Final event: `exploration_id:null`, `run_id:null`, `committed:0`, `pending:0`, `complete:false`. The ID in the error belongs to the existing exploration, **not a new research run**. Omitting `--project` resolved existing default state in this environment; the earlier root probe's successful auto-creation does not establish isolation now. I did not change its configuration, reuse its exploration, create a shared project or delete anything.

T3 browser preflight separately returned:

```text
Preview automation open failed: This host blocks the sandbox T3's browser
runs in (AppArmor on Ubuntu 23.10+).
```

No host setup changes were made. One Kane launch attempt; **zero started explorations, public-site browser actions, mapped paths, inspected findings or semantic outcomes**. Finding detection and site accessibility remain unmeasured. No workers/servers were started by this research; a final targeted process check found no matching exploration processes. No remote HyperExecute or assurance jobs were requested.

Evidence: [NDJSON](/tmp/kane-realworld-explorer/handson-run.ndjson), [stderr](/tmp/kane-realworld-explorer/handson-stderr.log), [preview blocker](/tmp/kane-realworld-explorer/preview-blocker.txt). There are no clips/screenshots/findings to inspect or count as bugs.

## What the sources establish—and do not

HandsOn's [FAQ](https://www.handsonbayarea.org/faq) separates discovery from group sign-up and youth-account/accompaniment procedures. Attendance verification is manual; scheduled participation is not verified service. These are documented operational distinctions. They support a hypothesis that organizers need a joined-up preparation brief; they do **not** demonstrate abandonment, user demand or a defective website.

Cross-organization rules cannot be casually merged: [Save The Bay](https://volunteer.savebay.org/youth-volunteering/) says under-16s generally need their parent/legal guardian, rather than a teacher/group leader. Specific opportunity requirements still matter. An agent interpreting “adult present” too broadly is worth probing, not an observed error.

The [tagged Kane guide](https://github.com/LambdaTest/kane-cli/blob/0.10.0-rc.3/docs/user-guide/exploration.md) documents maps, evidence, findings and rechecks; context can design tests but exploration does not execute them. These features could expose missed screens and interaction issues. They do not establish a correct volunteer plan, compatible equipment bundle or approved commitment. Root's fresh synthetic probe also failed to complete its requested arithmetic check despite ending completed; this is context, not a measurement on today's public site.

## Ranked opportunities

Ranking is judgment about usefulness, distinctiveness and one-day delivery, not a win probability. All five can be useful with Kane invisible to users. Each needs reviewed expectations independent of the generating agent.

### 1. CrewReady — a group volunteering departure brief

**User/job:** a neighborhood organizer planning one service outing with mixed-age participants. Listings answer “what exists”; the organizer needs “what must our actual group do before leaving?”

**Flow/agent:** enter age bands, available window and accompaniment relationships; import a few supported public listings and their source rules. Agent proposes a shortlist, explains exclusions and produces participant-specific preparation cards. Organizer resolves unknowns and approves a shareable brief. Registration remains with the host.

**Kane/oracle:** exercise source expansion, profile edits and published participant cards; extract opportunity IDs, dates, constraints and revision IDs for comparison against a separately human-reviewed fixture matrix. API checks alone miss an old preparation card surviving a profile edit or a source link bound to the wrong recommendation. Free Explore can map the journey; explicit saved tests establish these outcomes.

**Failure hypothesis:** agent treats any accompanying adult as a qualifying guardian, or applies one organization's youth rule to another. Unknown requirements must remain unresolved.

**One-day cut:** three pinned source profiles, six opportunities, age bands rather than identities, one locality, one share/export surface. No live sign-up or universal crawler.

**Three-minute demo:** lead with Kane's scoped report; create a brief; change the group relationship; show a reviewed exclusion and updated cards; show the coding agent's actual report-informed change and replay.

**Competition/difference:** [POINT](https://pointapp.org/volunteers/) already offers discovery; HandsOn already filters age. Proposed distinction is the reviewed, group-specific preparation artifact across differing source rules, not another directory.

**Fatal objection:** unsupported/stale source rules could make a reassuring brief worse than reading the host page. Kill broad automation if reliable source attribution and explicit unknowns are not achievable.

### 2. BorrowKit — plan a complete borrowed kit for a community event

**User/job:** a club running a film night or neighborhood games afternoon who knows the activity but not the complete equipment list.

**Flow/agent:** describe the room, audience and owned equipment; agent asks critical missing questions, builds a borrowing list, explains each dependency and offers alternatives. Librarian/organizer approves a packing and return checklist. A public catalogue is input, not permission to book.

**Kane/oracle:** browser edits laptop/connector details, swaps an item and inspects saved/shared lists. Compare exact item IDs, quantities, required dependencies and unresolved fields with an independently reviewed compatibility graph and expected fixtures. A correct planner API can still ship a stale cable after a UI swap or hide an unanswered prerequisite in the printable view.

**Failure hypothesis:** infer compatibility from “USB-C” alone or duplicate an accessory already included in a kit.

**One-day cut:** one imported 12-item event catalogue, two activity templates, no powered-tool advice, payments or reservations. Every supported compatibility relation reviewed.

**Three-minute demo:** Kane report → film-night request → clarify connector → swap projector → complete corrected packing checklist and replay; disclose any detected defect honestly.

**Competition/difference:** [myTurn](https://myturn.com/) already manages inventory, bookings and reminders; [Library of Things](https://www.libraryofthings.co.uk/catalogue/borrow-projector) already supplies product guidance. Proposed distinction is an activity-to-complete-kit conversation and checked substitutions. Not an inventory product.

**Fatal objection:** if a librarian must pre-author every full kit, AI adds little beyond a checklist selector. Test a held-out combination before committing.

### 3. ChangeRelay — carry an event correction into every participant's instructions

**User/job:** a small community center changes a venue, arrival time or task assignment after publishing an event.

**Flow/agent:** organizer pastes the change; agent proposes a field-level impact plan across the public event, volunteer role cards and printable run-sheet. Organizer edits/approves; app publishes one version with a readable change summary. No external messages sent.

**Kane/oracle:** perform approval, backtracking, reload and guest-view checks. Compare the public page, each role card and stored version against a frozen before/after table; require unrelated fields unchanged. API-only correctness misses stale already-open pages and incorrect role-specific rendering.

**Failure hypothesis:** “helpers arrive 30 minutes later” also moves the public start, or the canceled draft remains on a role card.

**One-day cut:** one event, three roles, three output surfaces and version history; no calendar/email integrations.

**Three-minute demo:** Kane report → natural-language correction → human narrows affected role → publish → fresh participant view plus exact checks.

**Competition/difference:** [SignUpGenius](https://www.signupgenius.com/how) already supports updates and current participant views. Proposed distinction is a reviewed semantic change with dependent instructions, not basic event editing.

**Fatal objection:** limited to one app's views, a structured form may solve the problem more simply. Rank third unless the natural-language change materially reduces work.

### 4. ShiftPatch — repair a volunteer rota without discarding people's agreements

**User/job:** a neighborhood association receives a cancellation and two conditional offers shortly before an event.

**Flow/agent:** import a small roster and organizer-approved role requirements; interpret “I can cover cleanup, but only after 3”; propose minimal replacements with explanations; coordinator reviews and publishes personal shift cards.

**Kane/oracle:** edit a proposed assignment, reject another, approve and inspect all affected cards. Separate constraint code checks approved times, qualifications, non-overlap and explicitly locked assignments. Do not require one arbitrary optimal roster when several are valid.

**Failure hypothesis:** agent treats a conditional offer as unconditional or silently moves an unaffected volunteer; rendered personal cards may retain the old assignment.

**One-day cut:** 12 volunteers, four roles, one day, local import/export and no notifications. Browser verification covers intervention-to-published-card agreement.

**Three-minute demo:** Kane report → cancellation → conditional replacement → coordinator correction → actual cards and invariant checks.

**Competition/difference:** [Better Impact](https://support.betterimpact.com/en/articles/13192494-comprehensive-guide-to-scheduling) already supports qualifications, assignments and confirmations. Difference would be interpretation of messy change requests with preserved agreements.

**Fatal objection:** a narrow rescheduling assistant may be a feature incumbents can add; do not rebuild volunteer management.

### 5. ServicePacket — assemble an honest school-service evidence packet

**User/job:** a student/family gathers records from several community organizations without confusing a booking with completed, verified service.

**Flow/agent:** import sanitized attendance records and organizer notes; agent extracts dates, activities and evidence status, asks about conflicts, and drafts a packet. Human confirms facts; app exports source-linked records and an explicit missing-evidence checklist. Never fabricate signatures or guarantee school acceptance.

**Kane/oracle:** correct one attendance record, exclude a canceled booking and inspect downloaded/printable output. Reviewed record IDs, minute totals and status transitions define expectations; independent arithmetic compares displayed and exported totals. Browser testing matters for selection and export disagreement.

**Failure hypothesis:** scheduled hours become verified hours, or a corrected date applies to the wrong repeated event.

**One-day cut:** pasted text/CSV, three statuses, one packet format; no OCR, school integrations or external requests.

**Three-minute demo:** Kane report → mixed records → clarify conflict → pending evidence remains pending → export and exact check.

**Competition/difference:** [Track it Forward](https://www.trackitforward.com/feature/advanced-verification) already has verification and approval. Proposed distinction is assembling heterogeneous existing evidence without enrolling every organization.

**Fatal objection:** demand and differentiation are weakest here; approvals cannot be automated from unverified documents. Rank last.

## One falsification spike before building CrewReady

Time-box **45 minutes**, using a tiny owned app, not production-site actions. Human-review six source/profile cases first, including a non-guardian adult with an under-16 participant, a per-opportunity override, a missing requirement and an ambiguous source conflict. Freeze expected classifications and source references before asking the agent to plan.

Build only import → profile → proposed brief → edit → share. Kane extracts exact recommendation IDs, unresolved requirements and published revision from three saved journeys. Separate code compares to the frozen matrix. Preserve first attempts; a green result is valid. Feed the actual report to the coding agent and retain its next commit/run history.

**Kill/reduce if:** two cases require inventing missing source facts; independent expectations cannot be agreed; published changes cannot be checked end-to-end within the spike; verification exceeds the practical live-demo budget; or the deliverable is merely search results with citations. Do not inject a failure to rescue the story. If source ingestion dominates, switch to organizer-supplied reviewed rules or BorrowKit's bounded catalogue.

New Explore does not remove these kill criteria. Its map is useful build feedback; exact outcome checks, a real participant deliverable and an actual agent response to Kane remain the deciding evidence.
