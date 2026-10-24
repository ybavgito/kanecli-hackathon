import test from 'node:test'
import assert from 'node:assert/strict'
import { generateInterface, validateGeneratedArtifact, validateArtifactSource, normalizeBuilderOverview } from '../../server/builder-generator.mjs'

const screenshot = { id: 'screen-1', description: 'Kane observed options screen', dataUrl: 'data:image/png;base64,aW1hZ2U=' }
const allowedActions = [{ id: 'review', label: 'Review', kind: 'read', inputSchema: { type: 'object' } }]
const artifact = () => ({
  title: 'Review your observed options', summary: 'A task-specific review built from Kane observations.',
  appSource: `import React, {useState} from 'react';
export default function App({bridge,initialState}) {
 const [status,setStatus]=useState('Ready');
 async function review(){try {const result=await bridge.invoke('review',{});setStatus(result.status)}catch(error){setStatus(error.message)}}
 return <section><h1>Review options</h1><p>{initialState.method}</p><button type="button" onClick={review}>Review</button><p role="status">{status}</p></section>
}`,
  css: 'section{max-width:42rem;padding:1rem}button:focus-visible{outline:3px solid green}',
  actions: [{ id: 'review', label: 'Review', evidenceIds: ['screen-1'] }], evidenceIds: ['screen-1'],
  decisions: ['Show the observed method before requesting a fresh review.'], unknowns: ['Final source outcome has not been checked.'],
})
const input = () => ({ contract: { id: 'contract-1', goal: 'Inspect options', constraints: ['Preserve original payment'] }, sourceModel: { screens: [{ id: 'screen-1', text: 'Review choices' }] }, screenshots: [screenshot], allowedActions, initialState: { method: 'Observed option' } })
const response = (value, extra = {}) => ({ ok: true, status: 200, json: async () => ({ id: 'resp_unit_test', status: 'completed', model: 'model-test', usage: { input_tokens: 20, output_tokens: 10, total_tokens: 30 }, output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }], ...extra }) })
const options = extra => ({ apiKey: 'unit-test-key-not-real', model: 'model-test', ...extra })

test('Responses request includes actual inline screenshots, frozen contract and store false', async () => {
  let request
  const supplied = input()
  const before = structuredClone(supplied)
  const result = await generateInterface(supplied, options({ fetchImpl: async (url, init) => { request = { url, ...init }; return response(artifact()) } }))
  const body = JSON.parse(request.body)
  assert.equal(request.url, 'https://api.openai.com/v1/responses')
  assert.equal(body.store, false)
  assert.equal(body.model, 'model-test')
  assert.equal(body.input[0].content.find(part => part.type === 'input_image').image_url, screenshot.dataUrl)
  assert.deepEqual(JSON.parse(body.input[0].content[0].text).contract, before.contract)
  assert.deepEqual(supplied, before)
  assert.equal(result.artifact.appSource, artifact().appSource)
  assert.equal(result.metadata.calls[0].usage.total_tokens, 30)
  assert.equal(result.metadata.contractDigest.length, 64)
  assert.ok(!JSON.stringify(result).includes('unit-test-key-not-real'))
})

test('inspection loop returns function outputs and newly observed screenshot bytes to the model', async () => {
  const requests = [], inspections = []
  const result = await generateInterface(input(), options({
    fetchImpl: async (_, init) => {
      requests.push(JSON.parse(init.body))
      return requests.length === 1 ? response(null, { output: [{ type: 'function_call', name: 'inspect_source', call_id: 'call_1', arguments: JSON.stringify({ question: 'What changes after choosing the other option?', evidenceIds: ['screen-1'] }) }] }) : response({ ...artifact(), evidenceIds: ['screen-1', 'screen-2'] })
    },
    inspect: async args => { inspections.push(args); return { observation: { status: 'observed', id: 'screen-2', method: 'Second method' }, screenshots: [{ ...screenshot, id: 'screen-2' }] } },
  }))
  assert.equal(inspections.length, 1)
  assert.equal(requests.length, 2)
  const output = requests[1].input.find(item => item.type === 'function_call_output')
  assert.equal(output.call_id, 'call_1')
  assert.equal(JSON.parse(output.output).method, 'Second method')
  assert.equal(requests[1].input.at(-1).content.at(-1).type, 'input_image')
  assert.deepEqual(result.metadata.inspections[0].screenshotIds, ['screen-2'])
})

test('unapproved, unknown-reference, parallel and out-of-budget inspection calls never reach broker', async () => {
  for (const scenario of ['name', 'reference', 'parallel', 'budget']) {
    let inspections = 0
    const call = { type: 'function_call', name: scenario === 'name' ? 'execute_shell' : 'inspect_source', call_id: 'call_1', arguments: JSON.stringify({ question: 'Inspect terms', evidenceIds: scenario === 'reference' ? ['invented'] : ['screen-1'] }) }
    await assert.rejects(generateInterface(input(), options({ maxInspections: scenario === 'budget' ? 0 : 2, inspect: async () => { inspections++; return {} }, fetchImpl: async () => response(null, { output: scenario === 'parallel' ? [call, call] : [call] }) })), error => ['invalid_tool_call', 'tool_budget_exceeded'].includes(error.code))
    assert.equal(inspections, 0)
  }
})

test('tool budget remains enforced across model turns', async () => {
  let inspections = 0, requests = 0
  await assert.rejects(generateInterface(input(), options({ maxInspections: 1, inspect: async () => { inspections++; return { observation: { status: 'observed' } } }, fetchImpl: async () => { requests++; return response(null, { output: [{ type: 'function_call', name: 'inspect_source', call_id: `call_${requests}`, arguments: '{"question":"Inspect terms","evidenceIds":["screen-1"]}' }] }) } })), error => error.code === 'tool_budget_exceeded')
  assert.equal(inspections, 1)
  assert.equal(requests, 2)
})

test('missing or remote-only screenshots cannot silently become vision evidence', async () => {
  let requests = 0
  for (const screenshots of [[], [{ id: 'screen-1', dataUrl: 'https://example.test/image.png' }]]) {
    await assert.rejects(generateInterface({ ...input(), screenshots }, options({ fetchImpl: async () => { requests++; return response(artifact()) } })))
  }
  assert.equal(requests, 0)
})

test('unsafe source imports, browser access, HTML injection and CSS network loads are rejected', () => {
  const sources = [
    "import x from '../../server/merchant.mjs'; export default ()=>null",
    "import x from 'https://example.test/x.js'; export default ()=>null",
    'export default ()=>fetch("/api/submit")',
    'export default ()=>globalThis["fetch"]("/api")',
    'export default ()=>({})["constructor"]',
    'export default ()=>import("react")',
    'export default ()=> <iframe src="/merchant"/>',
    'export default ()=> <div dangerouslySetInnerHTML={{__html:"x"}}/>',
    'export default ()=> <a href="/merchant">Go</a>',
    'export default ()=> <form action="/api/submit"/>',
  ]
  for (const source of sources) assert.throws(() => validateArtifactSource(source), { code: 'invalid_artifact' })
  assert.throws(() => validateArtifactSource(artifact().appSource, '@import "https://example.test/font.css";'))
  assert.throws(() => validateArtifactSource(artifact().appSource, 'body{background:url(/api/side-effect)}'))
})

test('manifest rejects invented actions, evidence, undeclared bindings and extra file outputs', () => {
  const valid = artifact()
  for (const invalid of [
    { ...valid, actions: [{ id: 'submit-live', label: 'Submit', evidenceIds: ['screen-1'] }] },
    { ...valid, evidenceIds: ['invented'] },
    { ...valid, appSource: valid.appSource.replace("'review'", "'submit-live'") },
    { ...valid, actions: [] },
    { ...valid, files: { '../server/index.mjs': 'bad' } },
  ]) assert.throws(() => validateGeneratedArtifact(invalid, { allowedActions, evidenceIds: ['screen-1'] }))
})

test('invalid model source can be repaired only within the fixed turn budget', async () => {
  let requests = 0
  const invalid = { ...artifact(), appSource: 'export default ()=>fetch("/api")' }
  const result = await generateInterface(input(), options({ maxTurns: 2, fetchImpl: async () => response(++requests === 1 ? invalid : artifact()) }))
  assert.equal(requests, 2)
  assert.match(result.metadata.calls[0].validationError, /fetch/)
  requests = 0
  await assert.rejects(generateInterface(input(), options({ maxTurns: 2, fetchImpl: async () => { requests++; return response(invalid) } })), error => error.code === 'invalid_artifact' && error.metadata.calls.length === 2)
  assert.equal(requests, 2)
})

test('API failures retain bounded status and token metadata without credential or response message', async () => {
  const secret = 'unit-test-private-value'
  await assert.rejects(generateInterface(input(), options({ apiKey: secret, fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({ error: { code: `limit_${secret}`, type: 'rate_limit', message: `Echo ${secret}` } }) }) })), error => {
    assert.equal(error.code, 'api_error')
    assert.equal(error.metadata.calls[0].httpStatus, 429)
    assert.ok(!JSON.stringify(error).includes(secret))
    assert.ok(!error.message.includes(secret))
    return true
  })
  await assert.rejects(generateInterface(input(), options({ fetchImpl: async () => { throw new Error(`network ${secret}`) } })), error => error.code === 'api_request_failed' && !JSON.stringify(error).includes(secret))
})

test('incomplete or refused responses cannot publish partial artifacts', async () => {
  for (const extra of [{ status: 'incomplete' }, { output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'Cannot complete' }] }] }]) {
    await assert.rejects(generateInterface(input(), options({ fetchImpl: async () => response(artifact(), extra) })), error => ['incomplete_response', 'empty_response'].includes(error.code))
  }
})

const overviewActions = [
  { id: 'read_state', label: 'Read current state', kind: 'read', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
  { id: 'check', label: 'Check observations', kind: 'read', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
]
const overviewModel = () => ({
  name: 'Observed service website',
  exploration: {
    status: 'budget', stopReason: 'lease_limit',
    screens: [
      { id: 'screen-1', title: 'Your visits', knowledge: 'screen_observed', evidenceId: 'map-1' },
      { id: 'screen-2', title: 'Available times', knowledge: 'screen_observed', evidenceId: 'map-1' },
      { id: 'inferred-confirmation', title: 'Change confirmed', origin: 'inferred', evidenceId: 'map-1' },
    ],
    flows: [
      { id: 'flow-times', title: 'Choose a time and confirm a visit', from: 'screen-1', to: 'screen-2', knowledge: 'navigation_observed', kaneStatus: 'verified', evidenceId: 'map-1' },
      { id: 'flow-confirm', title: 'Confirm your change', from: 'screen-2', to: 'inferred-confirmation', kaneStatus: 'verified', evidenceId: 'map-1' },
      { id: 'flow-unsupported', title: 'Unknown entry', from: 'missing', to: 'screen-1', evidenceId: 'map-1' },
    ],
    findings: [{ id: 'finding-1', title: 'Missing label', kind: 'accessibility', confirmed: false, evidenceId: 'map-1' }],
    unknowns: ['The confirmation page was not visited.'],
  },
})
const overviewArtifact = () => ({
  ...artifact(), title: 'Your observed service website', summary: 'Explore the screens Kane reached. No task has started.',
  appSource: `import React,{useState} from 'react';export default function App({bridge}){
 const [status,setStatus]=useState('No task has started');
 async function check(){try{const result=await bridge.invoke('check',{});setStatus(result.status)}catch(error){setStatus(error.message)}}
 return <main><h1>Your visits</h1><p>No task has started.</p><details><summary>Available times</summary><p>Navigation observed. Confirmation is unverified.</p></details><button type="button" onClick={check}>Check observations</button><p role="status">{status}</p></main>
}`,
  actions: [{ id: 'check', label: 'Check observations', evidenceIds: ['screen-1'] }],
  decisions: ['Show the reached visit and time screens with their actual observation scope.'],
  unknowns: ['The confirmation page was not visited.'],
})
const overviewInput = () => ({
  ...input(), contract: { id: 'overview-contract', mode: 'overview', intent: null, outcome: 'observed_overview' },
  sourceModel: overviewModel(), allowedActions: overviewActions,
  initialState: { status: 'not_started', kind: 'appointment', intent: { slotId: 'default-slot' } },
})

test('URL-only overview receives generic observed screens and read actions without a default transaction', async () => {
  let payload
  const supplied = overviewInput()
  supplied.allowedActions = [...overviewActions, { id: 'submit', kind: 'synthetic-commit' }, { id: 'choose', kind: 'synthetic-draft' }, { id: 'request_approval', kind: 'review' }]
  const before = structuredClone(supplied)
  const result = await generateInterface(supplied, options({ fetchImpl: async (_, request) => { payload = JSON.parse(request.body); return response(overviewArtifact()) } }))
  const context = JSON.parse(payload.input[0].content[0].text)
  assert.deepEqual(context.allowedActions.map(action => action.id), ['read_state', 'check'])
  assert.equal(context.contract.intent, null)
  assert.equal(context.overview.taskStatus, 'not_started')
  assert.equal(context.overview.coverage.exhaustive, false)
  assert.deepEqual(context.overview.screens.map(screen => screen.title), ['Your visits', 'Available times'])
  assert.match(payload.instructions, /Give observed flows equal prominence/)
  assert.match(payload.instructions, /No task has started/)
  assert.match(payload.instructions, /Never switch this component to a focused transaction/)
  assert.equal(result.metadata.mode, 'overview')
  assert.deepEqual(supplied, before)
})

test('overview preserves reached-state limits instead of promoting a named verified flow to a completed outcome', () => {
  const overview = normalizeBuilderOverview(overviewModel(), [screenshot])
  assert.equal(overview.flows[0].title, 'Choose a time and confirm a visit')
  assert.equal(overview.flows[0].status, 'navigation_observed')
  assert.equal(overview.flows[0].sourceReportedStatus, 'verified')
  assert.equal(overview.flows[0].reached.title, 'Available times')
  assert.equal(overview.flows[0].outcome, 'unverified')
  assert.equal(overview.flows[1].status, 'entry_observed')
  assert.equal(overview.flows[1].reached, null)
  assert.ok(overview.flows.every(flow => flow.execution === 'informational'))
  assert.equal(overview.flows.some(flow => flow.id === 'flow-unsupported'), false)
  assert.ok(overview.unknowns.includes('The confirmation page was not visited.'))
  assert.equal(overview.findings[0].confirmed, false)
  const otherSite = { name: 'Observed shop', discovery: { ...overviewModel().exploration, flows: [], screens: [{ id: 'screen-1', title: 'Orders', knowledge: 'screen_observed' }] } }
  const shop = normalizeBuilderOverview(otherSite, [screenshot])
  assert.equal(shop.siteTitle, 'Observed shop')
  assert.equal(shop.screens[0].title, 'Orders')
  assert.ok(shop.unknowns.some(value => value.includes('No source branch')))
})

test('overview cannot publish transaction actions or mutation payloads even if supplied by a caller', async () => {
  const all = [...overviewActions, { id: 'submit', kind: 'synthetic-commit' }, { id: 'request_approval', kind: 'review' }]
  const mutation = { ...overviewArtifact(), actions: [{ id: 'submit', label: 'Submit', evidenceIds: ['screen-1'] }], appSource: `import React from 'react';export default function App({bridge}){return <button type="button" onClick={()=>bridge.invoke('submit',{})}>Submit</button>}` }
  assert.throws(() => validateGeneratedArtifact(mutation, { allowedActions: all, mode: 'overview' }), { code: 'invalid_artifact' })
  await assert.rejects(generateInterface({ ...overviewInput(), allowedActions: all }, options({ maxTurns: 1, fetchImpl: async () => response(mutation) })), { code: 'invalid_artifact' })
  const repair = { ...overviewArtifact(), appSource: overviewArtifact().appSource.replace("'check',{}", "'check',{repair:true}") }
  assert.throws(() => validateGeneratedArtifact(repair, { allowedActions: all, mode: 'overview' }), /empty payload/)
  const dynamic = { ...overviewArtifact(), appSource: overviewArtifact().appSource.replace("'check',{}", "'check',somePayload") }
  assert.throws(() => validateGeneratedArtifact(dynamic, { allowedActions: all, mode: 'overview' }), /empty payload/)
  // A focused contract retains its existing declared source actions.
  assert.doesNotThrow(() => validateGeneratedArtifact(mutation, { allowedActions: all, mode: 'focused' }))
})

test('overview needs a reached source screen and cannot invent one from an unobserved map', async () => {
  let requested = false
  await assert.rejects(generateInterface({ ...overviewInput(), sourceModel: { screens: [{ id: 'unknown', title: 'Future screen', origin: 'inferred', evidenceId: 'map-1' }] } }, options({ fetchImpl: async () => { requested = true; return response(overviewArtifact()) } })), { code: 'missing_overview_evidence' })
  assert.equal(requested, false)
})

test('focused generation keeps its actions and does not receive an inferred overview', async () => {
  let payload
  await generateInterface({ ...input(), contract: { ...input().contract, mode: 'focused' } }, options({ fetchImpl: async (_, request) => { payload = JSON.parse(request.body); return response(artifact()) } }))
  const context = JSON.parse(payload.input[0].content[0].text)
  assert.deepEqual(context.allowedActions, allowedActions)
  assert.equal(Object.hasOwn(context, 'overview'), false)
  assert.doesNotMatch(payload.instructions, /THIS CONTRACT IS OVERVIEW MODE/)
})
