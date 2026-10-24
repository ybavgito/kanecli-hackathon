# Raising Kane: actual Explore integration

**When websites raise hell, raise Kane**

Verified CLI: **0.10.0-rc.3**, October 24, 2026. This adapter calls the actual
`kane-cli explore run` command. It is not the existing one-page `run` discovery
with a different label.

## Runtime contract

`server/kane-explore.mjs` exports:

```js
const explore = createKaneExplore({ projectId, onUpdate })
const job = explore.start({ connectionId, url, goal, maxLeases: 4, timeoutMs: 240000 })
explore.get(job.id)
explore.list(connectionId)
await explore.refresh(job.id)
await explore.stop(job.id)
await explore.shutdown()
```

`start` returns a persisted `starting` snapshot immediately. Preflight and the
browser run continue in the background. `onUpdate` receives safe public snapshots;
it cannot change the job. `get` and `list` are synchronous. `refresh` reconciles
service status after a restart; it does not start another exploration. `stop`
requests a graceful stop and awaits confirmed stop or rejects with a blocked state; poll until a terminal status.

Statuses: `starting`, `running`, `stopping`, `completed`, `budget`, `stopped`,
`timed_out`, `error`, `interrupted`. **`budget` is a bounded partial map, not a
complete crawl or a passed user task.** After a server restart, unresolved jobs
must be refreshed or stopped before a new job starts. Only one Explore runner is
active per adapter. Shutdown also waits for pending preflight work, so a delayed
preflight cannot open a browser after shutdown.

Public snapshots contain:

- `id`, `connectionId`, `url`, `entryUrl`, `projectId`, `projectName`,
  `explorationId`, `runId`, `cliVersion`, and timestamps.
- `policy: 'read_only'`, `browserContext: 'separate_public_browser'`,
  `assuranceContext: 'disabled'`, `maxLeases`, `maxParallel`, `depthCaps`, `timeoutMs`.
- `screens: [{id,title,heading,url,observedInRun,knowledge,evidenceId,controls}]`.
  Each control has `name`, `role`, and `status`: observed, walked or policy_blocked.
- `flows: [{id,title,from,to,knowledge:'navigation_observed',kaneStatus,evidenceId}]`.
  Kane's flow status is retained separately; it never changes a workflow receipt
  to `result_verified`.
- `actions` in the existing connection action shape, with `source:'kane-explore'`
  and `availability:'discovered'`. These may be added to discovered cards and must
  still run the normal extraction and independent analyzer before a saved result.
- `findings`, `leases`, `credits`, `committedDeltaCount`, `progress`, `events`,
  `error`, `mapError` when applicable, `limitations`, and `evidence`.
  Completion also reports `pendingDeltaCount` and `mapComplete`; a lease-limited
  run normally has `mapComplete:false` even when its committed evidence is usable.

No local filesystem path, CDP endpoint, browser profile, raw DOM, generated
navigation code, request body, screenshot bytes, or credential is returned in a
public job. Existing connection pause/disconnect handlers should also call
`stop` for that connection's active Explore jobs. Controllers should expose this
feature only for public exploration and display the separate-browser limitation.

## Project allocation

One Kane Explore project supports one entry URL. The adapter keeps an origin to
project binding in its own ignored `data/kane-explore/jobs.json`. A later page on
the same origin extends the same map from its existing `entryUrl`.

The optional constructor `projectId` is used only to reuse an existing map of the
same origin. New origins use the official `projects list/create --agent` commands
to find or create **Raising Kane Explore <host>**. This does not call `config
project`, alter `.testmuai/assurance.json`, create a local `.context/`, or move the
team's assurance coverage. Projects are allocated lazily, once needed. A project
with active exploration or enabled automatic assurance design is refused without
changing its policy or context settings.

## Bounds and evidence

Each invocation explicitly passes `--policy read_only`, `--local-orchestration`,
`--browser local`, `--max-parallel 1`, `--max-leases 4` by default,
`--depth-caps 0:2,1:1`, `--no-recheck`, and `--no-context`. Allowed lease budgets
are 1–8 and elapsed limits are 10–600 seconds. Leases are units of work, not an
exact page, action or credit cap. The CLI's host allowlist includes subdomains;
the objective further directs same-origin navigation and returned actions are
strictly filtered to the original origin.

The separate local browser has no connection CDP endpoint or signed-in profile.
There are no `--deps`, credential variables, profile uploads, or POST exemptions.
Goal strings with variable placeholders and URLs containing credentials or common
credential query keys are rejected. Sign-in and consequential controls are denied;
read-only search forms can also be refused by the deliberately conservative
Submit deny rule. Authentication remains a boundary, not an automated setup step.

Explore's stdout reports committed delta IDs. The adapter reads the CLI's real
`starting-projection.json` and `pending-deltas.ndjson` from its verified run
directory. Only acknowledged deltas belonging to that run are applied. A torn
last line is ignored. Screen links require an actual observed concrete URL;
`href_pattern` values such as `catalogue/{slug}` are never turned into URLs.
Uncommitted work, cross-origin URLs, credential URLs and sensitive control links
are not promoted to read actions.

Raw NDJSON and stderr remain in the ignored job directory; original CLI map and
screenshot evidence remain in its exploration run directory. This is Explore map
evidence, not a claimed sealed `run` evidence pack. TestMu AI processes the page
content and stores map evidence even though orchestration uses local Chrome.

## Validation

`node --test server/kane-explore.test.mjs` checks real process lifecycle with a
controlled CLI fixture, policy flags, committed-map filtering, project reuse,
reload persistence, stopping a running job, and cancellation during preflight.
These are adapter unit checks, not hand-authored browser test cases.

`node scripts/kane-explore-smoke.mjs <public-url>` exercises the actual adapter
against Books to Scrape or English Wikipedia, using four leases and a four-minute
timeout. It exits unsuccessfully unless the run ends at its budget or completes,
has committed map evidence, and observes an additional actionable screen. Its
default evidence/state directory is `data/kane-explore-validation`; it never
restarts the shared development server.

The first public Books to Scrape run completed at its four-lease limit in about
82 seconds, with 4 committed deltas, 4 screens, 3 flows, 7 findings, and 5.627595
total credits. The actual map produced two useful read actions: **Travel** and
**A Light in the Attic**. `Add to basket` was `policy_blocked`. Context status
confirmed disabled, with no running/pending design job. Exploration ID:
`01a17020-5792-72f5-aa5d-87ceed5eeecf`; run ID:
`01a17020-5868-78c1-9782-1e0e4f3955a5`; original project:
`01M5QFXVQKQ0KCCE24PC0BJXYP`. This first capability probe used the actual team
project; future unrelated origins are isolated by the allocation mechanism above.

The second live run went through the adapter against Wikipedia's **Accessibility**
article. It automatically created **Raising Kane Explore en.wikipedia.org**,
project `01M5R2A41CBV75D03TB3JYB6M7`, and finished at its four-lease limit in about
3 minutes 37 seconds. It retained 4 committed deltas, 3 screens, 2 navigation
flows, 15 reported findings, and 17.184205 total credits. Its concrete read actions
were **Voice recognition software** → Speech recognition and **captioned
telephone** → Telecommunications relay service. A search submission was refused
by the Submit deny rule; it was not promoted to an action. Exploration ID:
`01a17025-1631-7414-9e88-60d9eb6b18f7`; run ID:
`01a17025-16e5-7988-ae62-82cb13b40379`. Reloading the persisted adapter and refreshing
the service status preserved the real map and budget result. Context status
confirmed disabled with no pending or running design jobs. The repository's
assurance link remained `01M5QFXVQKQ0KCCE24PC0BJXYP`.

Installed source inspection also confirmed local Explore creates a fresh temporary
`kane-testrun-chrome-*` directory per browser and deletes it during release. It
does not take the connection worker's browser endpoint or ordinary Chrome profile.

UI verification belongs to the integrated application and must still run through
Kane after the controller and frontend connect these snapshots. Explore does not
execute assurance-designed tests, share a user's local authenticated session, or
prove supported consequential tasks.
