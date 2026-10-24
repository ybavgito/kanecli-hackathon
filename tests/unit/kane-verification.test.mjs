import assert from 'node:assert/strict'
import test from 'node:test'
import { checkPlan, suiteOutcome, validateUrl, coverageSummary } from '../../scripts/lib/kane-tools.mjs'

test('a valid Kane plan still refuses missing variables and a different selection', () => {
  const result = { code: 0, events: [{ type: 'testrun_plan', valid: true, members: [{ path: 'one_test.md' }] }] }
  assert.equal(checkPlan(result, 1).valid, true)
  assert.throws(() => checkPlan(result, 2), /incomplete/)
  assert.throws(() => checkPlan({ ...result, events: [...result.events, { type: 'warning', code: 'unresolved_variables' }] }, 1), /unresolved variables/)
  assert.throws(() => checkPlan({ code: 0, events: [{ type: 'testrun_plan', valid: true, members: [{ unresolved: ['start_url'] }] }] }, 1), /unresolved variables/)
})

test('a successful process or dry run alone never means the suite passed', () => {
  assert.equal(suiteOutcome({ code: 0, events: [] }, false).status, 'incomplete')
  assert.equal(suiteOutcome({ code: 0, events: [{ type: 'testrun_plan', valid: true }] }, false).status, 'incomplete')
  assert.equal(suiteOutcome({ code: 0, events: [{ type: 'testrun_done', overall_status: 'passed' }] }, false).status, 'incomplete')
})

const passedEvents = [
  { type: 'testrun_summary', totals: { tests: 2, passed: 2, failed: 0, broken: 0, skipped: 0 } },
  { type: 'testrun_done', overall_status: 'passed', execution_id: 'synthetic-execution' },
]

test('local success requires complete counts, final status, and successful process exit', () => {
  assert.equal(suiteOutcome({ code: 0, events: passedEvents }, false, 2).status, 'passed')
  assert.notEqual(suiteOutcome({ code: 1, events: passedEvents }, false, 2).status, 'passed')
  assert.notEqual(suiteOutcome({ code: 0, events: passedEvents }, false, 3).status, 'passed')
  assert.notEqual(suiteOutcome({ code: 0, events: [{ type: 'testrun_summary', totals: { tests: 2, passed: 1, skipped: 1 } }, passedEvents[1]] }, false, 2).status, 'passed')
})

test('cloud success waits for the remote wrapper and its exit status', () => {
  assert.notEqual(suiteOutcome({ code: 0, events: passedEvents }, true, 2).status, 'passed')
  assert.notEqual(suiteOutcome({ code: 0, events: [...passedEvents, { type: 'remote_done', status: 'failed', exit: 1 }] }, true, 2).status, 'passed')
  assert.equal(suiteOutcome({ code: 0, events: [...passedEvents, { type: 'remote_done', status: 'passed', exit: 0 }] }, true, 2).status, 'passed')
})

test('cloud targets refuse loopback, private addresses, userinfo, and local hostnames', () => {
  for (const value of ['http://127.0.0.1:5173', 'https://localhost:5173', 'https://127.1', 'https://[::1]', 'https://10.4.5.6', 'https://172.16.1.2', 'https://192.168.1.3', 'https://169.254.1.2', 'https://100.64.0.1', 'https://app.local', 'https://app.internal', 'https://account:password@public.example.com']) assert.throws(() => validateUrl(value, { remote: true }), /HTTP|credentials/)
  assert.equal(validateUrl('https://raising-kane.example.com', { remote: true }).protocol, 'https:')
  assert.equal(validateUrl('http://source.example.com', { remote: true, httpsOnly: false }).protocol, 'http:')
  assert.equal(validateUrl('http://127.0.0.1:5173').hostname, '127.0.0.1')
})

test('coverage distinguishes a measured partial result from unavailable data', () => {
  const result = coverageSummary({ code: 0, events: [{ type: 'coverage', pct: 1.88, criteria: { proven: 1, total: 38 }, source: 'project' }, { type: 'done', status: 'complete', exit_code: 0 }] })
  assert.equal(result.status, 'measured')
  assert.equal(result.criteria.proven, 1)
  assert.equal(coverageSummary({ code: 0, events: [] }).status, 'unavailable')
  assert.equal(coverageSummary({ code: 1, events: [{ type: 'coverage', pct: 100 }] }).status, 'unavailable')
})
