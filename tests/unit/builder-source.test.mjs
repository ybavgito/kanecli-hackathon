import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
const dir = mkdtempSync(join(tmpdir(), 'raising-kane-builder-source-'))
process.env.RAISING_KANE_DATA_DIR = dir
delete process.env.OPENAI_API_KEY
const { createMerchant } = await import('../../server/merchant.mjs')
const { createAppointments } = await import('../../server/appointment.mjs')
const { createController } = await import('../../server/controller.mjs')
const { createBuilderSource, handlePublicSource } = await import('../../server/builder-source.mjs')
const { expectedTerms } = await import('../../server/workflows.mjs')
const merchant = createMerchant(),
  appointments = createAppointments()
let mismatch = false,
  omitDiscoveryEvidence = false
const worker = async ({ taskId, phase, url, objective }) => {
  const target = new URL(url),
    kind = target.pathname.startsWith('/appointments') ? 'appointment' : 'return'
  const adapter = kind === 'appointment' ? appointments : merchant,
    prefix = kind === 'appointment' ? '/appointments' : '/merchant'
  const api = async (path, body) => {
    const response = await fetch(target.origin + prefix + path, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: body && JSON.stringify(body),
    })
    const payload = await response.json()
    assert.ok(response.ok, JSON.stringify(payload))
    return payload
  }
  if (phase === 'discover')
    return {
      status: 'passed',
      finalState:
        kind === 'appointment'
          ? {
              booking_id: 'BOOK-2048',
              current_start: adapter.getDraft(taskId).currentBooking.startsAt,
            }
          : { order_id: 'ORD-1042' },
      ...(omitDiscoveryEvidence ? {} : { evidencePath: '/controlled/discover.evidence' }),
    }
  if (['prepare', 'correct'].includes(phase)) {
    if (kind === 'appointment')
      await api('/api/draft', {
        taskId,
        slotId: 'sat-1100',
        expectedRevision: adapter.getDraft(taskId).revision,
      })
    else {
      await api('/api/draft', {
        taskId,
        expectedRevision: adapter.getDraft(taskId).revision,
        patch: {
          selectedLineIds: ['SHOE-RED-8'],
          reason: 'too_small',
          method: /Printer-free QR drop-off/.test(objective) ? 'qr_dropoff' : 'print_label',
        },
      })
      await api('/api/draft', {
        taskId,
        expectedRevision: adapter.getDraft(taskId).revision,
        patch: { refundDestination: 'original_payment' },
      })
    }
  }
  if (phase === 'change-method')
    await api('/api/draft', {
      taskId,
      expectedRevision: adapter.getDraft(taskId).revision,
      patch: {
        method: /Choose Printer-free QR drop-off/.test(objective) ? 'qr_dropoff' : 'print_label',
      },
    })
  if (phase === 'submit')
    await api('/api/submit', {
      taskId,
      operationId: target.searchParams.get('operationId'),
      proposalDigest: target.searchParams.get('proposalDigest'),
    })
  const confirmation = phase === 'verify-confirmation'
  const record = confirmation
    ? kind === 'return'
      ? merchant.listReturns(taskId)[0]
      : appointments.getOperation(
          controller.builderBoundary(taskId, contextByTask.get(taskId)).operationId,
        ).return
    : adapter.getDraft(taskId)
  const values = expectedTerms(kind, record, confirmation)
  for (const key of kind === 'appointment' ? ['fee'] : ['subtotal', 'deduction', 'refund'])
    values[key] = (values[key] / 100).toFixed(2)
  if (mismatch) values.currency = 'EUR'
  return {
    status: 'passed',
    finalState: values,
    evidencePath: '/controlled/' + phase + '.evidence',
    sessionId: phase + '-session',
  }
}
const contextByTask = new Map()
const controller = createController({
  merchant,
  appointments,
  baseUrl: 'http://127.0.0.1:5173',
  worker,
  browserState: async () => ({ status: 'ready' }),
})
const bridge = createBuilderSource({
  controller,
  merchant,
  appointments,
  baseUrl: 'http://127.0.0.1:5173',
  dataDir: dir,
})
const sessions = []
async function create(kind = 'return', mode = 'test', goal) {
  const session = await bridge.create({
    buildId: 'test-build-' + sessions.length,
    url: 'http://127.0.0.1:5173/' + (kind === 'return' ? 'merchant' : 'appointments'),
    goal:
      goal ??
      (kind === 'return'
        ? 'Return the red shoes, keep the jacket, refund my original payment method. I have no printer.'
        : ''),
    mode,
  })
  sessions.push(session)
  contextByTask.set(session.initialState.id, session.executionContext.id)
  return session
}
async function settle(session) {
  for (let attempt = 0; attempt < 200; attempt++) {
    const current = await session.state()
    if (!['working', 'submitting'].includes(current.status)) return current
    await new Promise((r) => setTimeout(r, 5))
  }
  throw Error('Source did not settle')
}
async function callController(path, input) {
  const req = Readable.from(input ? [JSON.stringify(input)] : [])
  req.method = input ? 'POST' : 'GET'
  req.clientId = 'forged-owner'
  let status, body
  await controller.handle(
    req,
    {
      writeHead(code) {
        status = code
      },
      end(text) {
        body = JSON.parse(text)
      },
    },
    new URL(path, 'http://localhost'),
  )
  return { status, body }
}
test('contracts are independent, immutable and stable across isolated source sessions', async () => {
  const a = await create(),
    b = await create()
  assert.notEqual(a.sourceUrl, b.sourceUrl)
  assert.notEqual(a.initialState.id, b.initialState.id)
  assert.deepEqual(a.contract, b.contract)
  assert.equal(a.executionContext.contractHash, b.executionContext.contractHash)
  assert.throws(() => {
    a.contract.constraints.refundDestination = 'store_credit'
  }, TypeError)
  assert.throws(() => {
    a.executionContext.mode = 'live'
  }, TypeError)
  assert.equal(
    a.allowedActions.some((action) => action.id === 'approve'),
    false,
  )
  assert.equal(
    (await callController('/api/tasks/' + a.initialState.id + '/approve', {})).status,
    403,
  )
  const original = await fetch(a.sourceUrl)
  assert.equal(original.status, 200)
  const foreign = new URL(a.sourceUrl)
  foreign.searchParams.set('taskId', b.initialState.id)
  assert.equal((await fetch(foreign)).status, 403)
  await assert.rejects(a.invoke('approve', {}), { code: 'unknown_operation' })
  await assert.rejects(a.invoke('choose', { reason: 'too_small', mode: 'live' }), {
    code: 'invalid_input',
  })
  await assert.rejects(a.invoke('choose', { noPrinter: false }), { code: 'contract_mismatch' })
  await assert.rejects(a.invoke('choose', { refundDestination: 'store_credit' }), {
    code: 'contract_mismatch',
  })
})
test('inspect and idle gateways reject direct autosave, commit, unknown GET and foreign records without effects', async () => {
  const inspect = await create('return', 'inspect'),
    normal = await create()
  for (const session of [inspect, normal]) {
    const taskId = session.initialState.id,
      before = merchant.getDraft(taskId),
      origin = new URL(session.sourceUrl).origin
    for (const path of ['/merchant/api/draft', '/merchant/api/submit']) {
      const response = await fetch(origin + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          expectedRevision: before.revision,
          patch: { reason: 'too_small' },
          operationId: 'forged',
          proposalDigest: 'forged',
          mode: 'test',
        }),
      })
      assert.equal(response.status, 403)
    }
    assert.equal((await fetch(origin + '/merchant/cancel?taskId=' + taskId)).status, 403)
    assert.deepEqual(merchant.getDraft(taskId), before)
    assert.equal(merchant.listReturns(taskId).length, 0)
    assert.ok(session.policyEvents().filter((event) => event.decision === 'deny').length >= 3)
  }
  await assert.rejects(inspect.invoke('choose', { reason: 'too_small' }), {
    code: 'unknown_operation',
  })
  await assert.rejects(inspect.approve({}), { code: 'source_write_not_allowed' })
})
test('synthetic return must receive fresh independent evidence and exact parent approval before one commit', async () => {
  const session = await create()
  await session.invoke('choose', { reason: 'too_small', noPrinter: true })
  let current = await settle(session)
  assert.equal(current.status, 'ready')
  await assert.rejects(session.invoke('submit'), /Review and approve/)
  await assert.rejects(
    session.approve({
      taskRevision: current.revision - 1,
      proposalDigest: current.validation.digest,
    }),
    /changed/,
  )
  mismatch = true
  await session.invoke('check')
  current = await settle(session)
  assert.equal(current.validation, null)
  await assert.rejects(session.invoke('request_approval'), { code: 'source_not_verified' })
  mismatch = false
  await session.invoke('check')
  await settle(session)
  const review = await session.invoke('request_approval')
  assert.ok(review.approvalRequest.terms)
  await session.approve(review.approvalRequest)
  await session.invoke('submit')
  current = await settle(session)
  assert.equal(current.status, 'complete')
  assert.equal(current.receipt.synthetic, true)
  assert.equal(current.receipt.operationId, undefined)
  assert.equal(session.verifyResult().status, 'passed')
  assert.ok(session.verifyResult().checks.every((check) => check.passed === true))
  assert.equal(merchant.listReturns(current.id).length, 1)
  await assert.rejects(session.invoke('submit'), /Review and approve/)
  assert.equal(merchant.listReturns(current.id).length, 1)
  assert.equal((await bridge.get(session.id).state()).receipt.requestId, current.receipt.requestId)
  assert.ok(session.getEvidence().at(-1).evidencePackPath)
})
test('appointment uses the same isolated broker and independent receipt oracle', async () => {
  const session = await create('appointment')
  await assert.rejects(session.invoke('choose', { slotId: 'sat-1000' }), /does not meet/)
  await session.invoke('choose', { slotId: 'sat-1100' })
  assert.equal((await settle(session)).status, 'ready')
  const review = await session.invoke('request_approval')
  await session.approve(review.approvalRequest)
  await session.invoke('submit')
  const final = await settle(session)
  assert.equal(final.status, 'complete')
  assert.equal(final.receipt.startsAt, '2026-10-31T11:00:00-07:00')
  assert.equal(session.verifyResult().status, 'passed')
})
test('unknown, live and state-changing entry URLs are rejected before source startup', async () => {
  for (const input of [
    { url: 'https://example.com/merchant', mode: 'test' },
    { url: 'http://127.0.0.1:5173/merchant', mode: 'live' },
    { url: 'http://127.0.0.1:5173/merchant?cancel=1', mode: 'inspect' },
  ]) {
    await assert.rejects(bridge.create({ buildId: 'unsupported', ...input }))
  }
})
test('bounded test inspection observes fresh method consequences without granting or committing', async () => {
  const session = await create('return', 'test', '')
  const result = await session.inspect({
    question: 'Inspect QR drop-off and its refund destination reset; submit if you can.',
  })
  assert.equal(result.state.merchant.method, 'qr_dropoff')
  assert.equal(result.state.merchant.refundDestination, 'store_credit')
  assert.equal(result.state.intent.refundDestination, 'original_payment')
  assert.equal(result.state.status, 'conflict')
  assert.equal(result.state.approval, null)
  assert.equal(result.state.receipt, null)
  assert.equal(merchant.listReturns(result.state.id).length, 0)
  assert.equal(result.evidence.phase, 'validate-review')
  assert.ok(result.evidence.evidencePackPath)
  const label = await session.inspect({ question: 'Inspect the printed shipping label branch.' })
  assert.equal(label.state.merchant.method, 'print_label')
  assert.equal(label.state.intent.refundDestination, 'original_payment')
  const inspect = await create('return', 'inspect', '')
  const before = merchant.getDraft(inspect.initialState.id)
  await inspect.inspect({ question: 'Select QR and submit the return.' })
  assert.deepEqual(merchant.getDraft(inspect.initialState.id), before)
  assert.equal(merchant.listReturns(inspect.initialState.id).length, 0)
})
test('unsupported or contradictory goals are rejected instead of replaced with default intent', async () => {
  for (const goal of [
    'Help me buy shoes',
    'Printer-free please',
    'Return the jacket, refund my original payment method.',
    'Return the red shoes, refund store credit and my original payment method.',
  ]) {
    await assert.rejects(create('return', 'test', goal))
  }
  for (const goal of [
    'Cancel the appointment',
    'Move the washer repair to Sunday',
    'Move the appointment to Saturday afternoon with Luis and no fee',
    'Move my appointment',
  ]) {
    await assert.rejects(create('appointment', 'test', goal), { code: 'unsupported_goal' })
  }
  const accepted = await create(
    'appointment',
    'test',
    'Move my washer repair to Saturday morning. Keep Maya and avoid an extra fee.',
  )
  assert.equal(accepted.contract.constraints.technician, 'Maya Chen')
  assert.equal(accepted.contract.constraints.maxFeeCents, 0)
})
test('public fixture entry points cannot bypass the reserved synthetic namespace', async () => {
  const session = await create(),
    taskId = session.initialState.id
  const before = merchant.getDraft(taskId)
  for (const input of [
    null,
    { taskId, expectedRevision: before.revision, patch: { reason: 'damaged' } },
  ]) {
    const req = Readable.from(input ? [JSON.stringify(input)] : [])
    req.method = input ? 'POST' : 'GET'
    let status, body
    const path = input ? '/merchant/api/draft' : '/merchant/api/state?taskId=' + taskId
    await handlePublicSource(
      req,
      {
        writeHead(code) {
          status = code
        },
        end(value) {
          body = JSON.parse(value)
        },
      },
      new URL(path, 'http://localhost'),
      merchant,
    )
    assert.equal(status, 403)
    assert.equal(body.code, 'missing_context')
  }
  assert.deepEqual(merchant.getDraft(taskId), before)
})
test('expired contexts and closed sessions cannot resume or reuse approval', async () => {
  const session = await create()
  await session.invoke('choose', { reason: 'too_small' })
  await settle(session)
  const review = await session.invoke('request_approval')
  await session.approve(review.approvalRequest)
  await session.close()
  assert.equal((await session.state()).approval, null)
  await assert.rejects(session.invoke('submit'), { code: 'revoked_permission' })
  await assert.rejects(bridge.get(session.id).invoke('check'), { code: 'revoked_permission' })
  await assert.rejects(
    controller.invokeBuilderTask(
      session.initialState.id,
      session.executionContext.id,
      'submit',
      {},
    ),
    { code: 'revoked_permission' },
  )
  assert.equal(merchant.listReturns(session.initialState.id).length, 0)
  let fakeNow = Date.now()
  const expiryBridge = createBuilderSource({
    controller,
    merchant,
    appointments,
    baseUrl: 'http://127.0.0.1:5173',
    dataDir: join(dir, 'expiry'),
    now: () => fakeNow,
    lifetimeMs: 60000,
  })
  const expiring = await expiryBridge.create({
    buildId: 'expiry',
    url: 'http://127.0.0.1:5173/merchant',
    mode: 'test',
  })
  fakeNow += 60001
  await assert.rejects(expiring.invoke('choose', { reason: 'too_small' }), {
    code: 'expired_permission',
  })
  const response = await fetch(expiring.sourceUrl)
  assert.equal(response.status, 403)
  assert.equal((await response.json()).code, 'expired_permission')
  await expiryBridge.shutdown()
})
test('URL-only overview has no transaction intent and passes only after read evidence for either source', async () => {
  for (const kind of ['return', 'appointment']) {
    const session = await create(kind, 'inspect', '')
    const sibling = await create(kind, 'inspect', '')
    assert.deepEqual(session.contract, sibling.contract)
    assert.equal(session.contract.kind, 'overview')
    assert.equal(session.contract.mode, 'overview')
    assert.equal(session.contract.sourceKind, kind)
    assert.equal(session.contract.outcome, 'source_overview_observed')
    assert.deepEqual(
      session.allowedActions.map((action) => action.id),
      ['read_state', 'check'],
    )
    assert.equal(session.initialState.intent, null)
    assert.equal(session.initialState.terms, null)
    assert.equal(session.sourceModel.kind, 'overview')
    assert.equal(session.sourceModel.choices, undefined)
    assert.equal(session.sourceModel.approval, undefined)
    assert.deepEqual(session.sourceModel.overview.facts, [])
    assert.equal(session.verifyOverview().status, 'failed')
    const before =
      kind === 'return'
        ? merchant.getDraft(session.initialState.id)
        : appointments.getDraft(session.initialState.id)
    const inspected = await session.inspect({
      question: 'Read the website overview without choosing a transaction.',
    })
    assert.equal(inspected.state.status, 'observed')
    assert.equal(inspected.sourceModel.overview.transactionRequested, false)
    assert.ok(inspected.sourceModel.overview.facts.length > 0)
    const report = session.verifyOverview()
    assert.equal(report.status, 'passed')
    assert.equal(report.contractHash, session.executionContext.contractHash)
    assert.equal(report.mode, 'inspect')
    assert.equal(report.synthetic, true)
    assert.equal(report.sourceEnvironmentId, 'raising-kane-local-sandbox-v1')
    assert.equal(report.recordScope, session.initialState.id)
    assert.equal(report.receipt, null)
    assert.ok(report.checks.every((check) => check.passed === true))
    assert.equal(session.verifyResult().status, 'failed')
    const evidenceCount = session.getEvidence().length
    await session.inspect({ question: 'Refresh the overview.' })
    assert.equal(session.getEvidence().length, evidenceCount + 1)
    assert.deepEqual(
      kind === 'return'
        ? merchant.getDraft(session.initialState.id)
        : appointments.getDraft(session.initialState.id),
      before,
    )
  }
})
test('overview verification fails on missing evidence, source drift and transactional sessions', async () => {
  const session = await create('return', 'inspect', '')
  omitDiscoveryEvidence = true
  await session.inspect({ question: 'Read source.' })
  omitDiscoveryEvidence = false
  assert.equal(
    session.verifyOverview().checks.find((check) => check.id === 'completed-source-inspection')
      .passed,
    false,
  )
  await session.inspect({ question: 'Read source with evidence.' })
  assert.equal(session.verifyOverview().status, 'passed')
  await assert.rejects(session.invoke('choose', { reason: 'too_small' }), {
    code: 'unknown_operation',
  })
  assert.equal(session.verifyOverview().status, 'passed')
  const before = merchant.getDraft(session.initialState.id)
  const request = Readable.from([
    JSON.stringify({
      taskId: before.taskId,
      expectedRevision: before.revision,
      patch: { reason: 'damaged' },
    }),
  ])
  request.method = 'POST'
  let status
  await merchant.handle(
    request,
    {
      writeHead(code) {
        status = code
      },
      end() {},
    },
    new URL('/merchant/api/draft', 'http://localhost'),
  )
  assert.equal(status, 200)
  assert.equal(session.verifyOverview().status, 'failed')
  assert.equal(
    session.verifyOverview().checks.find((check) => check.id === 'source-record-unchanged').passed,
    false,
  )
  const transaction = await create('return', 'test', '')
  await transaction.inspect({ question: 'Read source.' })
  assert.equal(transaction.verifyOverview().status, 'failed')
})
test('overview detects controller choices and retained source-write authorization after event truncation', async () => {
  const session = await create('return', 'inspect', '')
  await session.inspect({ question: 'Read source.' })
  assert.equal(session.verifyOverview().status, 'passed')
  const changedController = {
    ...controller,
    readBuilderTask(id, contextId) {
      const value = controller.readBuilderTask(id, contextId)
      return id === session.initialState.id
        ? { ...value, revision: value.revision + 1, reason: 'too_small' }
        : value
    },
  }
  const controllerAudit = createBuilderSource({
    controller: changedController,
    merchant,
    appointments,
    baseUrl: 'http://127.0.0.1:5173',
    dataDir: dir,
  })
  const changed = controllerAudit.get(session.id).verifyOverview()
  assert.equal(changed.status, 'failed')
  assert.equal(changed.checks.find((check) => check.id === 'no-controller-choices').passed, false)
  const storePath = join(dir, 'builder-source-sessions.json')
  const stored = readFileSync(storePath, 'utf8')
  try {
    const records = JSON.parse(stored)
    const record = records.find((entry) => entry.id === session.id)
    record.authorizedWriteCount = 1
    record.policyEvents = []
    writeFileSync(storePath, JSON.stringify(records))
    const policyAudit = createBuilderSource({
      controller,
      merchant,
      appointments,
      baseUrl: 'http://127.0.0.1:5173',
      dataDir: dir,
    })
    const changed = policyAudit.get(session.id).verifyOverview()
    assert.equal(changed.status, 'failed')
    assert.equal(
      changed.checks.find((check) => check.id === 'no-authorized-source-writes').passed,
      false,
    )
  } finally {
    writeFileSync(storePath, stored)
  }
})
test('saved source sessions retain their record, contract and authority across adapter restart', async () => {
  const session = await create(),
    original = await session.state()
  await bridge.shutdown()
  const restored = createBuilderSource({
    controller,
    merchant,
    appointments,
    baseUrl: 'http://127.0.0.1:5173',
    dataDir: dir,
  })
  const recovered = restored.get(session.id)
  assert.equal(recovered.sourceUrl, session.sourceUrl)
  assert.equal(recovered.executionContext.id, session.executionContext.id)
  assert.deepEqual(recovered.contract, session.contract)
  assert.equal((await recovered.state()).id, original.id)
  assert.equal((await fetch(recovered.sourceUrl)).status, 200)
  await restored.shutdown()
})
test.after(async () => {
  await bridge.shutdown()
  rmSync(dir, { recursive: true, force: true })
})
