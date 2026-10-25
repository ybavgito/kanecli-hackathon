import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateBuilderVerification, verifyGeneratedInterface } from '../../server/builder-verifier.mjs'

const browser = { status: 'passed', evidencePath: '/synthetic/test.evidence', steps: [{ status: 'done' }] }
const source = { status: 'passed', contractHash: 'synthetic-contract', mode: 'test', synthetic: true,
  sourceEnvironmentId: 'raising-kane-local-sandbox-v1', recordScope: 'bld_synthetic',
  receipt: { id: 'synthetic-receipt' }, checks: [{ id: 'preserved-intent', passed: true }] }
const verdict = (b = browser, s = source) => evaluateBuilderVerification({ browser: b, source: s, revision: 2, artifactDigest: 'synthetic-artifact', contractDigest: 'synthetic-contract' })

test('generated interface promotion needs both Kane evidence and independent source confirmation', () => {
  assert.equal(verdict().status, 'passed')
  assert.equal(verdict({ ...browser, evidencePath: null }).status, 'failed')
  assert.equal(verdict({ ...browser, status: 'error' }).status, 'failed')
  assert.equal(verdict(browser, { ...source, receipt: null }).status, 'failed')
  assert.equal(verdict(browser, { ...source, checks: [] }).status, 'failed')
  assert.equal(verdict(browser, { ...source, checks: [{ id: 'intent', passed: false }] }).status, 'failed')
  assert.equal(verdict(browser, { ...source, checks: [{ id: 'intent' }] }).status, 'failed')
  assert.equal(verdict(browser, { ...source, contractHash: 'different-contract' }).status, 'failed')
  assert.equal(verdict(browser, { ...source, mode: 'live' }).status, 'failed')
  assert.equal(verdict(browser, { ...source, recordScope: 'external-record' }).status, 'failed')
})
test('failed step and false analyzer verdict defeat a passing terminal summary', () => {
  assert.equal(verdict({ ...browser, steps: [{ status: 'failed' }] }).status, 'failed')
  assert.equal(verdict({ ...browser, allConditionsTrue: false }).status, 'failed')
})
test('infrastructure interruptions do not trigger a speculative generated-code repair', () => {
  for (const status of ['error', 'cancelled', 'timed_out']) assert.equal(verdict({ ...browser, status }).repairable, false)
  assert.equal(verdict({ ...browser, status: 'failed' }).repairable, true)
  assert.equal(verdict().revision, 2)
  assert.equal(verdict().artifactDigest, 'synthetic-artifact')
})
test('read-only overview requires Kane evidence and an unchanged inspect record, without a transaction receipt', () => {
  const overview = { ...source, mode: 'inspect', receipt: null,
    checks: [{ id: 'no-writes', passed: true }, { id: 'source-observed', passed: true }] }
  const args = { browser, source: overview, revision: 1, artifactDigest: 'synthetic-artifact',
    contractDigest: 'synthetic-contract', mode: 'overview' }
  assert.equal(evaluateBuilderVerification(args).status, 'passed')
  assert.equal(evaluateBuilderVerification({ ...args, source: { ...overview, receipt: { id: 'transaction' } } }).status, 'failed')
  assert.equal(evaluateBuilderVerification({ ...args, source: { ...overview, mode: 'test' } }).status, 'failed')
  assert.equal(evaluateBuilderVerification({ ...args, source: { ...overview, checks: [{ id: 'no-writes', passed: false }] } }).status, 'failed')
})

test('focused verification requires a separate Kane receipt check after source completion', async () => {
  const calls = []
  const worker = async options => {
    calls.push(options)
    return { ...browser, summary: calls.length === 1 ? 'Matching draft.' : calls.length === 2 ? 'Submitted once through generated controls.' : 'Saved receipt displayed.',
      evidencePath: `/synthetic/phase-${calls.length}.evidence`, testUrl: `https://example.test/run-${calls.length}` }
  }
  let reads = 0
  const session = {
    async state() { reads++; return reads === 1 ? { status: 'submitted_unverified' } : { status: 'complete', receipt: source.receipt, sourceReturn: {} } },
    verifyResult() { return source },
  }
  const args = { buildId: 'synthetic-build', revision: 1, artifactDigest: 'synthetic-artifact',
    contractDigest: 'synthetic-contract', contract: { kind: 'return' }, url: 'https://example.test/preview',
    source: session, worker, completionPollMs: 1, completionTimeoutMs: 1000 }
  const passed = await verifyGeneratedInterface(args)
  assert.equal(passed.status, 'passed')
  assert.equal(passed.browser.draftTestUrl, 'https://example.test/run-1')
  assert.equal(passed.browser.journeyTestUrl, 'https://example.test/run-2')
  assert.equal(passed.browser.testUrl, 'https://example.test/run-3')
  assert.equal(calls.length, 3)
  assert.match(calls[0].objective, /Do not claim the task is complete in this phase/)
  assert.match(calls[1].objective, /Then click Submit once/)
  assert.match(calls[2].objective, /Do not click Submit/)
  const failed = await verifyGeneratedInterface({ ...args, worker: async options => {
    const result = await worker(options)
    return calls.length === 6 ? { ...result, status: 'failed' } : result
  } })
  assert.equal(failed.status, 'failed')
})
