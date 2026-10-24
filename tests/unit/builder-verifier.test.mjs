import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateBuilderVerification } from '../../server/builder-verifier.mjs'

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
