import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:http'
const dir = mkdtempSync(join(tmpdir(), 'raising-kane-contracts-'))
process.env.RAISING_KANE_DATA_DIR = dir
const { createMerchant } = await import('../../server/merchant.mjs')
const { createAppointments } = await import('../../server/appointment.mjs')
const { proposalDigest } = await import('../../server/merchant-contract.mjs')
const merchant = createMerchant(),
  appointments = createAppointments()
const server = createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://localhost')
    if ((await merchant.handle(req, res, u)) || (await appointments.handle(req, res, u))) return
    res.writeHead(404)
    res.end()
  } catch (e) {
    res.writeHead(500)
    res.end(JSON.stringify({ error: e.message }))
  }
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const base = `http://127.0.0.1:${server.address().port}`
async function api(path, body) {
  const r = await fetch(base + path, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  return {
    status: r.status,
    body: (r.headers.get('content-type') || '').includes('json') ? await r.json() : await r.text(),
  }
}
async function returnDraft(id, patch) {
  return api('/merchant/api/draft', {
    taskId: id,
    expectedRevision: merchant.getDraft(id).revision,
    patch,
  })
}
function grant(adapter, id, operationId) {
  const d = adapter.getDraft(id)
  return adapter.registerGrant({
    taskId: id,
    operationId,
    intentRevision: 1,
    proposalDigest: d.proposalDigest,
    draftVersion: d.revision,
    validationRunId: 'contract-test-only',
  })
}
const submit = (id, op, digest) =>
  api('/merchant/api/submit', { taskId: id, operationId: op, proposalDigest: digest })

test('return grants bind exact revision and digest; retries preserve one source record', async () => {
  const id = 'return-contract'
  await returnDraft(id, {
    selectedLineIds: ['SHOE-RED-8'],
    reason: 'too_small',
    refundDestination: 'original_payment',
  })
  let d = merchant.getDraft(id)
  assert.equal((await submit(id, 'no-grant', d.proposalDigest)).status, 409)
  assert.throws(() =>
    merchant.registerGrant({
      taskId: id,
      operationId: 'bad',
      intentRevision: 1,
      proposalDigest: d.proposalDigest,
      draftVersion: d.revision,
      validationRunId: '',
    }),
  )
  const old = grant(merchant, id, 'old-approval')
  await returnDraft(id, { method: 'qr_dropoff' })
  assert.equal(merchant.getDraft(id).refundDestination, 'store_credit')
  assert.equal((await submit(id, old.operationId, old.proposalDigest)).status, 409)
  await returnDraft(id, { refundDestination: 'original_payment' })
  d = merchant.getDraft(id)
  assert.equal(d.expectedRefundCents, 7500)
  assert.equal(d.proposalDigest, proposalDigest(d))
  const g = grant(merchant, id, 'current-approval'),
    body = { taskId: id, operationId: g.operationId, proposalDigest: g.proposalDigest }
  const responses = await Promise.all([
    api('/merchant/api/submit', body),
    api('/merchant/api/submit', body),
  ])
  assert.deepEqual(responses.map((x) => x.status).sort(), [200, 201])
  assert.equal(responses[0].body.return.requestId, responses[1].body.return.requestId)
  assert.equal(merchant.listReturns(id).length, 1)
  assert.equal((await submit(id, g.operationId, 'different')).status, 409)
  assert.equal(merchant.getOperation(g.operationId).status, 'committed')
  assert.equal(
    createMerchant().getOperation(g.operationId).return.requestId,
    responses[0].body.return.requestId,
  )
  const confirmation = await api('/merchant/returns/' + responses[0].body.return.requestId)
  assert.equal(confirmation.status, 200)
  assert.match(confirmation.body, /Refund pending|refund pending/)
  assert.equal(
    (await api('/merchant/returns/' + responses[0].body.return.requestId + '/qr')).status,
    200,
  )
  assert.equal((await returnDraft(id, { reason: 'damaged' })).status, 409)
})
test('stale draft edits and duplicate grants are rejected', async () => {
  const id = 'stale-edit',
    d = merchant.getDraft(id)
  await returnDraft(id, { reason: 'damaged' })
  assert.equal(
    (
      await api('/merchant/api/draft', {
        taskId: id,
        expectedRevision: d.revision,
        patch: { reason: 'too_small' },
      })
    ).status,
    409,
  )
  const g = grant(merchant, id, 'unique-grant')
  assert.throws(() => grant(merchant, id, 'unique-grant'))
  merchant.revokeGrant(g.operationId)
  assert.equal((await submit(id, g.operationId, g.proposalDigest)).status, 409)
})
test('appointment preserves old booking until commit; slot loss invalidates approval', async () => {
  const id = 'appointment-contract',
    before = appointments.getDraft(id)
  let r = await api('/appointments/api/draft', {
    taskId: id,
    slotId: 'sat-1100',
    expectedRevision: before.revision,
  })
  assert.equal(r.status, 200)
  assert.deepEqual(appointments.getDraft(id).currentBooking, before.currentBooking)
  const old = grant(appointments, id, 'slot-grant')
  r = await api('/appointments/api/availability', {
    taskId: id,
    slotId: 'sat-1100',
    available: false,
    expectedRevision: appointments.getDraft(id).revision,
  })
  assert.equal(r.status, 200)
  assert.equal(
    (
      await api('/appointments/api/submit', {
        taskId: id,
        operationId: old.operationId,
        proposalDigest: old.proposalDigest,
      })
    ).status,
    409,
  )
  assert.deepEqual(appointments.getDraft(id).currentBooking, before.currentBooking)
  await api('/appointments/api/draft', {
    taskId: id,
    slotId: 'sat-1000',
    expectedRevision: appointments.getDraft(id).revision,
  })
  const g = grant(appointments, id, 'new-slot'),
    input = { taskId: id, operationId: g.operationId, proposalDigest: g.proposalDigest }
  const first = await api('/appointments/api/submit', input),
    retry = await api('/appointments/api/submit', input)
  assert.equal(first.status, 201)
  assert.equal(retry.status, 200)
  assert.equal(first.body.return.requestId, retry.body.return.requestId)
  assert.equal(first.body.return.activeBookings, 1)
  const after = appointments.getDraft(id)
  assert.equal(after.currentBooking.startsAt, '2026-10-31T10:00:00-07:00')
  assert.equal(after.currentBooking.version, 2)
  assert.equal(
    (await api('/appointments/api/submit', { ...input, proposalDigest: 'wrong' })).status,
    409,
  )
  assert.equal(
    (await api('/appointments/confirmations/' + first.body.return.requestId)).status,
    200,
  )
  assert.equal(createAppointments().getOperation(g.operationId).status, 'committed')
})
test.after(async () => {
  await new Promise((resolve) => server.close(resolve))
  rmSync(dir, { recursive: true, force: true })
})
