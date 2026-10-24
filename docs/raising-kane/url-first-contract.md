# URL-first implementation contract

The October 24 user direction supersedes the fixed two-sandbox product scope.
The URL is required; a goal is optional. Discovery is bounded and read-only.
Unknown sites are inspected as themselves, never replaced with the merchant.

## Ownership

Root: `server/explorer-controller.mjs`, `server/observations.mjs`, routing,
requirements and integration. Frontend agent: `src/**`. Worker agent:
`server/kane-worker.mjs` and browser privacy audit. Assurance agent: generated
tests and their design notes. The human teammate retains all merchant source
files and transaction contracts. Existing merchant APIs remain compatible.

## API and public state

All routes return `{connection}` or `{workflow}` unless specified otherwise.
Failures return `{error}`. Mutation routes accept JSON. Background jobs return
202 and clients poll the corresponding GET every 2 seconds.

- `GET /api/connections` -> `{connections}` (public snapshots).
- `POST /api/connections` with `{url, goal?}` -> `{connection}`; starts discovery.
- `GET /api/connections/:id` -> `{connection, workflows}`.
- `POST /api/connections/:id/inspect` -> bounded read-only discovery.
- `POST /api/connections/:id/open` -> opens the owned visible browser.
- `POST /api/connections/:id/takeover` -> pauses automation, leaves browser open.
- `POST /api/connections/:id/resume` with `{acknowledgeProcessing:true}` ->
  reconnects and rediscovers current page/account after human sign-in.
- `POST /api/connections/:id/disconnect` -> cancels jobs, closes browser and
  removes its profile. Does not silently reuse the old account later.
- `POST /api/workflows` with `{connectionId,actionId,goal?}` -> inspect selected action.
  A read-only card retrieves useful source facts, independently verifies each
  fact and the task/account/page through Kane's individual analyzer verdicts,
  and saves a receipt automatically. No submission approval is needed to read.
- `GET /api/workflows/:id` -> `{workflow,connection}`.
- `POST /api/workflows/:id/answer` with `{answers, constraints?}` -> refresh options.
- `POST /api/workflows/:id/choose` with `{optionId}` -> selects an observed option,
  invalidates previous approval and refreshes its terms.
- `POST /api/workflows/:id/check` -> prepare only an explicitly reversible draft
  when necessary, then independently check the current proposal.
- `POST /api/workflows/:id/approve` with `{revision}` -> approve current checked proposal.
- `POST /api/workflows/:id/execute` -> recheck terms, then perform the exact approved
  action once. Unsupported/unknown submission controls require human takeover.
- `POST /api/workflows/:id/reconcile` -> read-only source inspection after uncertainty.

Connection: `{id,url,origin,siteTitle,goal,status,account,actions,records,evidence,
events,progress,error,observedAt,processingNotice}`. Status is `discovering`,
`ready`, `needs_sign_in`, `human_control`, `blocked`, `disconnected`, or `error`.
Account: `{status:'unknown'|'public'|'signed_in',label}`. Actions:
`{id,title,description,href,kind:'read'|'draft'|'consequential'|'unknown',
prerequisites:[],sourceQuote,evidenceId,availability:'discovered'}`.
Records: `{id,title,details,url,sourceQuote}`. Evidence:
`{id,phase,status,summary,url,at,mode,steps,credits}`. No CDP endpoint or raw logs.

Workflow: `{id,connectionId,action,goal,revision,status,constraints:[],answers:{},
questions:[],records:[],options:[],selectedOptionId,proposal,approval,checks:[],
receipt,evidence:[],events:[],progress,error,observationStage,limitations:[]}`.
Statuses: `inspecting`, `needs_input`, `options_observed`, `draft_checked`,
`approved`, `submitting`, `result_unknown`, `result_verified`, `needs_sign_in`,
`blocked`, `error`. Questions: `{id,label,type:'text'|'number'|'date'|'select',
required,options:[{value,label}]}`. Never render secret input questions.
Options: `{id,label,price,requirements:[],changes:[],nextSteps:[],sourceQuote,
url,reversible,knowledge:'terms_observed'}`. Proposal:
`{summary,changes:[],terms:[{label,value}],requirements:[],nextSteps:[],
sourceUrl,submitControl,executionKind:'read'|'draft'|'consequential'|'unsupported',
digest,checkedAt}`. Checks: `{label,status:'match'|'conflict'|'unknown',detail}`.
Receipt: `{title,summary,sourceUrl,recordId,fields:[{label,value}],nextSteps:[],
verifiedAt,evidenceId}`. A read-only result receipt must say no changes were made.
Read-only receipts also carry `verificationEvidenceId`, pointing to the recorded
independent analyzer checks. All verdicts must be true; exit code zero alone is
insufficient. The extraction retains its normal sealed evidence pack. Saved
receipts are loaded from the server after reload and can be reopened from their
website's saved results. An uncertain read-only result can be refreshed and
verified again; consequential reconciliation never repeats submission.

Observation labels are distinct: option discovered, terms observed, draft checked,
action submitted, result verified, result unknown. No link is a verified workflow.
Material changes clear approval. Timeout never automatically repeats submission.
The controller and worker serialize work per connection and reject stale results.

## Legacy regression entry

Preserve the existing return UI under `?demo=merchant` (and existing `taskId`
URLs), with the existing `/api/tasks` routes. Mark it a simulated regression demo.
The main entry uses the generic connection/workflow APIs above.
