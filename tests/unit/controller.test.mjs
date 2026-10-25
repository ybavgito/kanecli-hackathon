import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:http'
const dir = mkdtempSync(join(tmpdir(), 'raising-kane-controller-'))
process.env.RAISING_KANE_DATA_DIR = dir
const { createMerchant } = await import('../../server/merchant.mjs'),
  { createController } = await import('../../server/controller.mjs'),
  { expectedTerms } = await import('../../server/workflows.mjs')
const merchant = createMerchant(),
  phases = []
let failDiscovery = true,
  missingField = null,
  wrongAmount = false
let base
const worker = async ({ taskId, phase, url }) => {
  phases.push(phase)
  if (phase === 'discover')
    return failDiscovery
      ? { status: 'error', summary: 'Injected browser startup failure', finalState: {} }
      : {
          status: 'passed',
          finalState: { order_id: 'ORD-1042' },
          testUrl: 'https://example.test/discovery',
        }
  if (phase === 'prepare' || phase === 'correct') {
    const d = merchant.getDraft(taskId)
    await fetch(base + '/merchant/api/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId,
        expectedRevision: d.revision,
        patch: {
          selectedLineIds: ['SHOE-RED-8'],
          reason: 'too_small',
          refundDestination: 'original_payment',
        },
      }),
    })
  }
  if (phase === 'change-method') {
    const d = merchant.getDraft(taskId)
    await api('/merchant/api/draft', {
      taskId,
      expectedRevision: d.revision,
      patch: { method: 'qr_dropoff' },
    })
  }
  if (phase === 'submit') {
    const params = new URL(url).searchParams
    const result = await api('/merchant/api/submit', {
      taskId,
      operationId: params.get('operationId'),
      proposalDigest: params.get('proposalDigest'),
    })
    assert.equal(result.status, 201)
    throw new Error('Injected timeout after source commit')
  }
  const confirmation = phase === 'verify-confirmation'
  const values = expectedTerms(
    'return',
    confirmation ? merchant.listReturns(taskId)[0] : merchant.getDraft(taskId),
    confirmation,
  )
  for (const key of ['subtotal', 'deduction', 'refund'])
    values[key] = (values[key] / 100).toFixed(2)
  if (missingField) delete values[missingField]
  if (wrongAmount) values.refund = '99.00'
  return {
    status: 'passed',
    finalState: values,
    testUrl: 'https://example.test/controlled-worker-result',
    durationMs: 1,
  }
}
const controller = createController({
  merchant,
  baseUrl: 'http://unused',
  worker,
  browserState: async () => ({ status: 'ready' }),
})
const server = createServer(async (req, res) => {
  req.clientId = req.headers['x-test-owner'] || 'human'
  const url = new URL(req.url, 'http://localhost')
  try {
    if (url.pathname.startsWith('/merchant')) return await merchant.handle(req, res, url)
    await controller.handle(req, res, url)
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: e.message }))
  }
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
base = `http://127.0.0.1:${server.address().port}`
async function api(path, body, owner = 'human') {
  const r = await fetch(base + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', 'x-test-owner': owner },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: r.status, body: await r.json() }
}
async function settle(id) {
  for (let i = 0; i < 100; i++) {
    const r = await api('/api/tasks/' + id)
    if (!['working', 'submitting'].includes(r.body.task.status)) return r.body.task
    await new Promise((r) => setTimeout(r, 5))
  }
  throw Error('Controller did not settle')
}
let id
test('failed discovery cannot bypass baseline; recovery redoes discovery before preparing', async () => {
  const r = await api('/api/tasks', { kind: 'return' })
  id = r.body.task.id
  let t = await settle(id)
  assert.equal(t.status, 'needs_attention')
  assert.equal(t.baseline, null)
  failDiscovery = false
  await api('/api/tasks/' + id + '/choice', { reason: 'too_small' })
  t = await settle(id)
  assert.deepEqual(phases, ['discover', 'discover', 'prepare'])
  assert.ok(t.baseline.jacket)
  assert.equal(t.status, 'ready')
  assert.ok(t.verificationFields.every((f) => f.status === 'match'))
})
test('passing worker output with missing currency or wrong amount cannot authorize a proposal', async () => {
  missingField = 'currency'
  await api('/api/tasks/' + id + '/check', {})
  let t = await settle(id)
  assert.equal(t.status, 'needs_attention')
  assert.equal(t.validation, null)
  assert.equal((await api('/api/tasks/' + id + '/approve', {})).status, 409)
  missingField = null
  wrongAmount = true
  await api('/api/tasks/' + id + '/check', {})
  t = await settle(id)
  assert.equal(t.status, 'needs_attention')
  assert.equal(t.validation, null)
  wrongAmount = false
  await api('/api/tasks/' + id + '/check', {})
  assert.equal((await settle(id)).status, 'ready')
})
test('different browser cannot approve; source polling invalidates stale green evidence', async () => {
  assert.equal((await api('/api/tasks/' + id + '/approve', {}, 'source-agent')).status, 403)
  const d = merchant.getDraft(id)
  await api('/merchant/api/draft', {
    taskId: id,
    expectedRevision: d.revision,
    patch: { refundDestination: 'store_credit' },
  })
  const t = (await api('/api/tasks/' + id)).body.task
  assert.equal(t.status, 'conflict')
  assert.equal(t.validation, null)
  assert.equal((await api('/api/tasks/' + id + '/approve', {})).status, 409)
  assert.equal(merchant.listReturns(id).length, 0)
})
test('a timeout after commit reconciles the original operation without a second submission', async () => {
  const d = merchant.getDraft(id)
  await api('/merchant/api/draft', {
    taskId: id,
    expectedRevision: d.revision,
    patch: { refundDestination: 'original_payment' },
  })
  await api('/api/tasks/' + id + '/check', {})
  assert.equal((await settle(id)).status, 'ready')
  assert.equal((await api('/api/tasks/' + id + '/approve', {})).status, 200)
  await api('/api/tasks/' + id + '/submit', {})
  let t = await settle(id)
  assert.equal(t.status, 'reconciling')
  assert.equal(merchant.listReturns(id).length, 1)
  const operationId = t.operationId
  await api('/api/tasks/' + id + '/check', {})
  t = await settle(id)
  assert.equal(t.status, 'complete')
  assert.equal(t.operationId, operationId)
  assert.equal(t.receipt.requestId, merchant.listReturns(id)[0].requestId)
  assert.equal(phases.filter((p) => p === 'submit').length, 1)
  assert.equal((await api('/api/tasks/' + id + '/submit', {})).status, 409)
})
test('one browser job changes and checks a method; one restores and checks without weakening approval', async () => {
  const created = await api('/api/tasks', { kind: 'return' })
  const nextId = created.body.task.id
  await settle(nextId)
  await api('/api/tasks/' + nextId + '/choice', { reason: 'too_small' })
  assert.equal((await settle(nextId)).status, 'ready')
  const beforeChange = phases.length
  await api('/api/tasks/' + nextId + '/choice', { method: 'qr_dropoff' })
  const conflict = await settle(nextId)
  assert.equal(conflict.status, 'conflict')
  assert.equal(conflict.validation, null)
  assert.equal((await api('/api/tasks/' + nextId + '/approve', {})).status, 409)
  assert.deepEqual(phases.slice(beforeChange), ['change-method'])
  const beforeRestore = phases.length
  await api('/api/tasks/' + nextId + '/check', { repair: true })
  const restored = await settle(nextId)
  assert.equal(restored.status, 'ready')
  assert.equal(restored.merchant.refundDestination, 'original_payment')
  assert.equal(restored.merchant.expectedRefundCents, 7500)
  assert.ok(restored.verificationFields.every((f) => f.status === 'match'))
  assert.deepEqual(phases.slice(beforeRestore), ['correct'])
})
test.after(async () => {
  await new Promise((resolve) => server.close(resolve))
  rmSync(dir, { recursive: true, force: true })
})
