import { createHash, randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { Readable } from 'node:stream'
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { canonicalProposal } from './merchant-contract.mjs'

export const BUILDER_SOURCE_ENVIRONMENT = 'raising-kane-local-sandbox-v1'
const POLICY_VERSION = 'builder-source-v1'
const DEFAULT_REQUEST = 'Return the red shoes, keep the jacket, refund my original payment method.'
const clone = (value) => structuredClone(value)
const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const failure = (code, message, statusCode = 403) =>
  Object.assign(Error(message), { code, statusCode })
const freeze = (value) => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}
const object = (value) => Boolean(value && typeof value === 'object' && !Array.isArray(value))
const publicOperation = (value) => {
  if (!value) return value
  const copy = clone(value)
  delete copy.operationId
  delete copy.attemptId
  return copy
}

/** Authored by the trusted integration, never by the generated application. */
export function builderAcceptanceContract(kind, intent) {
  const common = [
    {
      id: 'synthetic-only',
      text: 'Every action and receipt identifies the isolated synthetic source; no production transaction is tested.',
    },
    {
      id: 'fresh-review',
      text: 'Kane reads and compares every current source term. Incomplete evidence and stale revisions block approval.',
    },
    {
      id: 'trusted-approval',
      text: 'The parent application obtains a separate explicit approval of the exact current proposal. Generated code cannot issue approval.',
    },
    {
      id: 'saved-result',
      text: 'Kane observes the saved confirmation and the independent source record agrees. Reload does not repeat the commit.',
    },
    {
      id: 'accessible-journey',
      text: 'The generated interface has readable labels, keyboard-operable choices and visible progress, conflicts and errors.',
    },
  ]
  const specific =
    kind === 'appointment'
      ? [
          {
            id: 'same-booking',
            text: 'Move BOOK-2048; preserve Washer repair, 42 Linden Street, San Francisco, and America/Los_Angeles.',
          },
          {
            id: 'matching-slot',
            text: 'Choose an available Saturday October 31 morning slot, keep Maya Chen, and add no fee.',
          },
          {
            id: 'one-booking',
            text: 'The old booking is replaced and exactly one active booking remains.',
          },
        ]
      : [
          {
            id: 'correct-items',
            text: 'Return exactly one SHOE-RED-8 from ORD-1042 / DEMO-ACCOUNT-1 and keep JACKET-BLACK-M unchanged.',
          },
          {
            id: 'refund-destination',
            text: `Preserve refund destination ${intent.refundDestination}, including after the source resets it on a method change.`,
          },
          {
            id: 'method-terms',
            text: `Offer only source-supported methods; ${intent.noPrinter ? 'the requested printer-free journey requires QR drop-off with a $5 deduction and $75 expected refund' : 'a printed label has $0 deduction and $80 refund; QR drop-off has a $5 deduction and $75 refund'}. Show USD, a selected source-supported reason and exact next-step instructions.`,
          },
          {
            id: 'truthful-receipt',
            text: 'Receipt says return requested / refund pending and provides a synthetic QR artifact when QR was selected.',
          },
        ]
  return freeze({
    schemaVersion: 1,
    product: 'Raising Kane',
    kind,
    sourceEnvironmentId: BUILDER_SOURCE_ENVIRONMENT,
    synthetic: true,
    constraints:
      kind === 'appointment'
        ? {
            bookingId: 'BOOK-2048',
            accountId: 'SERVICE-ACCOUNT-1',
            date: '2026-10-31',
            beforeHour: 12,
            technician: 'Maya Chen',
            maxFeeCents: 0,
            service: 'Washer repair',
            address: '42 Linden Street, San Francisco',
            timezone: 'America/Los_Angeles',
          }
        : {
            orderId: 'ORD-1042',
            accountId: 'DEMO-ACCOUNT-1',
            selectedLineIds: ['SHOE-RED-8'],
            quantity: 1,
            keepLineIds: ['JACKET-BLACK-M'],
            refundDestination: intent.refundDestination,
            noPrinterRequired: Boolean(intent.noPrinter),
            currency: 'USD',
            subtotalCents: 8000,
          },
    acceptanceCriteria: [...specific, ...common],
    outcome: kind === 'appointment' ? 'appointment_changed' : 'return_requested_refund_pending',
  })
}

function manifest(kind, mode) {
  const emptyInput = { type: 'object', properties: {}, additionalProperties: false }
  const read = [
    {
      id: 'read_state',
      label: 'Read current state',
      description: 'Refresh trusted task state; poll this while a source job is running.',
      kind: 'read',
      inputSchema: emptyInput,
    },
    {
      id: 'check',
      label: 'Check current details',
      description:
        'Run a fresh read-only Kane comparison of the current source proposal or saved confirmation.',
      kind: 'read',
      inputSchema: emptyInput,
    },
  ]
  if (mode === 'inspect') return read
  return [
    ...read,
    {
      id: 'choose',
      label: kind === 'appointment' ? 'Choose a matching time' : 'Save return choices',
      description:
        'Prepare only this disposable synthetic source draft through Kane. Poll read_state until the job settles.',
      kind: 'synthetic-draft',
      inputSchema: {
        type: 'object',
        properties:
          kind === 'appointment'
            ? { slotId: { type: 'string', enum: ['sat-0900', 'sat-1000', 'sat-1100'] } }
            : {
                reason: { type: 'string', enum: ['too_small', 'changed_mind', 'damaged'] },
                noPrinter: { type: 'boolean' },
                refundDestination: { type: 'string', enum: ['original_payment', 'store_credit'] },
              },
        additionalProperties: false,
      },
    },
    {
      id: 'repair',
      label: 'Restore my choices',
      description:
        'Use Kane to restore saved intent on the synthetic draft, then repeat the unchanged source check.',
      kind: 'synthetic-draft',
      inputSchema: emptyInput,
    },
    {
      id: 'request_approval',
      label: 'Review for approval',
      description:
        'Request the trusted parent approval panel. This does not grant approval or submit.',
      kind: 'review',
      inputSchema: emptyInput,
    },
    {
      id: 'submit',
      label: kind === 'appointment' ? 'Confirm approved change' : 'Submit approved return',
      description:
        'Kane commits the exact proposal only after separate trusted parent approval, then verifies the saved synthetic confirmation.',
      kind: 'synthetic-commit',
      inputSchema: emptyInput,
    },
  ]
}

/** One server-owned source session per build/test. No live adapter is registered. */
export function createBuilderSource({
  controller,
  merchant,
  appointments,
  sourceUrls = {},
  baseUrl,
  dataDir = process.env.RAISING_KANE_DATA_DIR || 'data',
  now = () => Date.now(),
  lifetimeMs = 12 * 60 * 60 * 1000,
}) {
  const file = resolve(dataDir, 'builder-source-sessions.json')
  const records = new Map(),
    servers = new Map()
  try {
    for (const record of JSON.parse(readFileSync(file, 'utf8'))) records.set(record.id, record)
  } catch (e) {
    if (e.code !== 'ENOENT') throw e
  }
  const save = () => {
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file + '.tmp', JSON.stringify([...records.values()], null, 2), { mode: 0o600 })
    renameSync(file + '.tmp', file)
  }
  function assertContext(record, operation = 'read_state') {
    const context = record.executionContext
    if (record.closedAt)
      throw failure(
        'revoked_permission',
        'This synthetic source session has ended. Start a new session.',
      )
    if (Date.parse(context.expiresAt) <= now())
      throw failure(
        'expired_permission',
        'This isolated source session expired. Start a new build or verification session.',
      )
    if (
      context.sourceEnvironmentId !== BUILDER_SOURCE_ENVIRONMENT ||
      !['test', 'inspect'].includes(context.mode)
    )
      throw failure(
        'environment_mismatch',
        'Only the reviewed local synthetic source is supported.',
      )
    if (!context.allowedOperationIds.includes(operation))
      throw failure(
        'source_write_not_allowed',
        'This source operation is not allowed in the current mode.',
      )
  }
  function state(record) {
    const task = controller.readBuilderTask(record.taskId, record.executionContext.id)
    const result = {
      ...task,
      synthetic: true,
      mode: record.executionContext.mode,
      sourceEnvironmentId: BUILDER_SOURCE_ENVIRONMENT,
      contractHash: record.executionContext.contractHash,
      terms: canonicalProposal(task.merchant),
    }
    result.approval = publicOperation(result.approval)
    result.sourceReturn = publicOperation(result.sourceReturn)
    result.receipt = publicOperation(result.receipt)
    delete result.operationId
    return result
  }
  function decisions(record, task) {
    return {
      kind: record.kind,
      name: record.kind === 'appointment' ? 'Linden Home' : 'Northstar Outfitters',
      synthetic: true,
      mode: record.executionContext.mode,
      constraints: clone(record.contract.constraints),
      choices:
        record.kind === 'appointment'
          ? { slots: task.candidates, currentBooking: task.merchant.currentBooking }
          : {
              lines: task.merchant.lines,
              reasons: task.merchant.reasons,
              methods: task.merchant.methods,
              destinations: task.merchant.destinations,
            },
      stateShape:
        'The bridge returns the current task object. Read status, progress, error, intent, merchant, checks, terms, validation, approval and receipt. While status is working/submitting, poll read_state. A conflict blocks approval; repair restores saved intent. Receipt is complete only when status is complete.',
      approval:
        'request_approval returns approvalRequest. The trusted parent owns the separate approval button. After approval, read_state exposes status approved; submit may then commit.',
    }
  }
  function logDecision(record, method, pathname, decision, code) {
    record.policyEvents ??= []
    record.policyEvents.push({
      at: new Date(now()).toISOString(),
      policyVersion: POLICY_VERSION,
      mode: record.executionContext.mode,
      sourceEnvironmentId: BUILDER_SOURCE_ENVIRONMENT,
      recordScope: record.taskId,
      synthetic: true,
      method,
      pathname,
      decision,
      code,
    })
    record.policyEvents = record.policyEvents.slice(-200)
    save()
  }
  async function startSource(record, port = record.port || 0) {
    if (servers.has(record.id)) return servers.get(record.id)
    const pending = (async () => {
      const adapter = record.kind === 'appointment' ? appointments : merchant
      const prefix = record.kind === 'appointment' ? '/appointments' : '/merchant'
      const server = createServer(async (req, res) => {
        const url = new URL(req.url, 'http://127.0.0.1')
        const send = (status, body) => {
          res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
          res.end(JSON.stringify(body))
        }
        try {
          assertContext(record)
          const boundary = controller.builderBoundary(record.taskId, record.executionContext.id)
          const entry = url.pathname === prefix,
            sourceState = url.pathname === prefix + '/api/state'
          const confirmationPrefix =
            prefix + (record.kind === 'appointment' ? '/confirmations/' : '/returns/')
          const confirmation =
            boundary.requestId &&
            [
              confirmationPrefix + boundary.requestId,
              confirmationPrefix + boundary.requestId + '/qr',
            ].includes(url.pathname)
          const operation =
            boundary.operationId &&
            url.pathname === prefix + '/api/operations/' + boundary.operationId
          if (req.method === 'GET') {
            if (!entry && !sourceState && !confirmation && !operation)
              throw failure(
                'unknown_operation',
                'This source route is outside the isolated record.',
              )
            if ((entry || sourceState) && url.searchParams.get('taskId') !== record.taskId)
              throw failure(
                'record_scope_mismatch',
                'This source session cannot read another record.',
              )
            const allowedParams = entry
              ? ['taskId', 'view', 'operationId', 'proposalDigest']
              : sourceState
                ? ['taskId']
                : []
            if ([...url.searchParams.keys()].some((key) => !allowedParams.includes(key)))
              throw failure('unknown_operation', 'This source query is not a reviewed read entry.')
            if (
              url.searchParams.has('operationId') &&
              (boundary.phase !== 'submit' ||
                url.searchParams.get('operationId') !== boundary.operationId)
            )
              throw failure(
                'source_write_not_allowed',
                'An active controller submission is required for the approved source entry.',
              )
            logDecision(record, req.method, url.pathname, 'allow', 'scoped_read')
            if (!(await adapter.handle(req, res, url)))
              throw failure('unknown_operation', 'Source route unavailable.', 404)
            return
          }
          if (req.method !== 'POST')
            throw failure('unknown_operation', 'This source method is not supported.')
          let raw = ''
          for await (const chunk of req) {
            raw += chunk
            if (raw.length > 16384)
              throw failure('invalid_input', 'Source input is too large.', 400)
          }
          const input = JSON.parse(raw || '{}')
          if (input.taskId !== record.taskId)
            throw failure(
              'record_scope_mismatch',
              'This source session cannot change another record.',
            )
          if (record.executionContext.mode !== 'test')
            throw failure('source_write_not_allowed', 'Inspect mode cannot change source data.')
          const draftWrite =
            url.pathname === prefix + '/api/draft' &&
            ['prepare', 'change-method', 'correct'].includes(boundary.phase)
          const approvedCommit =
            url.pathname === prefix + '/api/submit' &&
            boundary.phase === 'submit' &&
            input.operationId === boundary.operationId
          if (!draftWrite && !approvedCommit)
            throw failure(
              'source_write_not_allowed',
              'The controller did not authorize this source operation.',
            )
          logDecision(
            record,
            req.method,
            url.pathname,
            'allow',
            draftWrite ? 'synthetic_draft' : 'exact_approved_commit',
          )
          const forwarded = Readable.from([raw])
          forwarded.method = req.method
          forwarded.headers = req.headers
          if (!(await adapter.handle(forwarded, res, url)))
            throw failure('unknown_operation', 'Source route unavailable.', 404)
        } catch (e) {
          logDecision(record, req.method, url.pathname, 'deny', e.code || 'invalid_input')
          if (!res.headersSent)
            send(e.statusCode || 400, {
              error: e.message,
              code: e.code || 'invalid_input',
              synthetic: true,
            })
          else res.end()
        }
      })
      await new Promise((ok, reject) => {
        server.once('error', reject)
        server.listen(port, '127.0.0.1', ok)
      })
      server.unref()
      record.port = server.address().port
      return server
    })()
    servers.set(record.id, pending)
    try {
      return await pending
    } catch (e) {
      servers.delete(record.id)
      throw e
    }
  }
  const session = (record) =>
    Object.freeze({
      id: record.id,
      contract: freeze(clone(record.contract)),
      allowedActions: freeze(manifest(record.kind, record.executionContext.mode)),
      sourceModel: decisions(record, state(record)),
      initialState: state(record),
      sourceUrl: record.sourceUrl,
      executionContext: freeze(clone(record.executionContext)),
      async state() {
        if (!record.closedAt) await startSource(record)
        return state(record)
      },
      async invoke(actionId, payload = {}) {
        if (!manifest(record.kind, record.executionContext.mode).some((a) => a.id === actionId))
          throw failure('unknown_operation', 'Unknown generated-interface action.')
        assertContext(record, actionId)
        if (!object(payload)) throw failure('invalid_input', 'Action input must be an object.', 400)
        const action = manifest(record.kind, record.executionContext.mode).find(
          (a) => a.id === actionId,
        )
        if (Object.keys(payload).some((key) => !Object.hasOwn(action.inputSchema.properties, key)))
          throw failure(
            'invalid_input',
            'This action contains an unrecognized or authority-changing field.',
            400,
          )
        await startSource(record)
        if (actionId === 'read_state') return state(record)
        if (actionId === 'request_approval') {
          const current = state(record)
          if (
            current.status !== 'ready' ||
            !current.validation ||
            current.checks.some((c) => c.status !== 'match')
          )
            throw failure(
              'source_not_verified',
              'Check the exact source proposal before requesting approval.',
              409,
            )
          return {
            ...current,
            approvalRequest: {
              taskRevision: current.revision,
              proposalDigest: current.validation.digest,
              title:
                record.kind === 'appointment'
                  ? 'Approve this synthetic appointment change'
                  : 'Approve this synthetic return',
              summary:
                'Approve only these freshly checked source terms. This is an isolated sandbox action.',
              terms: current.terms,
              checks: current.checks,
            },
          }
        }
        if (actionId === 'choose') {
          const expected = record.contract.constraints
          if (
            record.kind === 'return' &&
            ((payload.refundDestination &&
              payload.refundDestination !== expected.refundDestination) ||
              (expected.noPrinterRequired && payload.noPrinter === false))
          )
            throw failure(
              'contract_mismatch',
              'These choices would change the saved task requirements.',
              409,
            )
        }
        await controller.invokeBuilderTask(
          record.taskId,
          record.executionContext.id,
          actionId === 'choose' ? 'choice' : actionId === 'repair' ? 'check' : actionId,
          actionId === 'repair' ? { repair: true } : payload,
        )
        return state(record)
      },
      async approve({ taskRevision, proposalDigest } = {}) {
        assertContext(record, 'approve')
        await startSource(record)
        await controller.invokeBuilderTask(record.taskId, record.executionContext.id, 'approve', {
          taskRevision,
          proposalDigest,
        })
        return state(record)
      },
      async inspect({ question = '', evidenceIds = [] } = {}) {
        if (typeof question !== 'string' || question.length > 2000 || !Array.isArray(evidenceIds))
          throw failure(
            'invalid_input',
            'Inspection requires a bounded question and evidence references.',
            400,
          )
        assertContext(record, 'check')
        await startSource(record)
        const waitForSource = async () => {
          const deadline = Date.now() + 300000
          while (['working', 'submitting'].includes(state(record).status)) {
            if (Date.now() >= deadline)
              throw failure('source_timeout', 'The source inspection is still running.', 409)
            await new Promise((r) => setTimeout(r, 100))
          }
        }
        await waitForSource()
        const requestedQR = /\b(qr|printer[- ]free|without a printer|no printer)\b/i.test(question)
        const requestedLabel =
          !requestedQR && /\b(print(?:ed)? (?:shipping )?label|print_label)\b/i.test(question)
        const branch =
          record.kind === 'return' &&
          record.executionContext.mode === 'test' &&
          (requestedQR || requestedLabel)
        if (branch) {
          if (requestedLabel && record.contract.constraints.noPrinterRequired)
            throw failure(
              'contract_mismatch',
              'This task requires a printer-free method; inspection cannot weaken that requirement.',
              409,
            )
          let current = state(record)
          if (current.submissionStarted)
            throw failure(
              'source_already_committed',
              'Inspection cannot change a committed synthetic record.',
              409,
            )
          if (!current.reason) {
            await controller.invokeBuilderTask(
              record.taskId,
              record.executionContext.id,
              'choice',
              { reason: 'too_small' },
            )
            await waitForSource()
            current = state(record)
          }
          await controller.invokeBuilderTask(record.taskId, record.executionContext.id, 'choice', {
            noPrinter: requestedQR,
          })
          await waitForSource()
        } else {
          await controller.invokeBuilderTask(record.taskId, record.executionContext.id, 'check', {})
          await waitForSource()
        }
        const current = state(record),
          evidence = controller.builderEvidence(record.taskId, record.executionContext.id).at(-1)
        return {
          question,
          evidenceIds,
          state: current,
          sourceModel: decisions(record, current),
          evidence: evidence
            ? { ...evidence, evidencePackPath: evidence.path, evidencePath: evidence.path }
            : null,
          scope: branch
            ? 'Explicit synthetic method-branch inspection through the existing controller. The original refund requirement is preserved; no approval or commit is issued.'
            : 'Bounded source identity and current terms from the existing controller; the question does not alter worker instructions.',
        }
      },
      getEvidence() {
        return controller
          .builderEvidence(record.taskId, record.executionContext.id)
          .map((e) => ({ ...e, evidencePackPath: e.path, evidencePath: e.path }))
      },
      verifyResult() {
        const current = state(record),
          expected = record.contract.constraints,
          receipt = current.receipt
        const operation = controller.builderResult(record.taskId, record.executionContext.id)
        const checks = [
          {
            id: 'independent-source-record',
            passed:
              operation.status === 'committed' &&
              operation.return?.taskId === record.taskId &&
              operation.return.requestId === receipt?.requestId &&
              hash(canonicalProposal(operation.return)) === hash(canonicalProposal(receipt)),
          },
          {
            id: 'completed',
            passed: current.status === 'complete' && Boolean(receipt?.evidenceReference),
          },
          {
            id: 'isolated-source',
            passed:
              receipt?.synthetic === true &&
              receipt.recordScope === record.taskId &&
              receipt.sourceEnvironmentId === BUILDER_SOURCE_ENVIRONMENT,
          },
          {
            id: 'source-confirmation',
            passed:
              Boolean(current.confirmationFields?.length) &&
              current.confirmationFields.every((f) => f.status === 'match'),
          },
        ]
        if (record.kind === 'appointment')
          checks.push(
            {
              id: 'same-booking',
              passed:
                receipt?.bookingId === expected.bookingId &&
                receipt.accountId === expected.accountId &&
                receipt.service === expected.service &&
                receipt.address === expected.address &&
                receipt.timezone === expected.timezone,
            },
            {
              id: 'matching-slot',
              passed:
                receipt?.startsAt?.startsWith(expected.date) === true &&
                Number(receipt.startsAt.slice(11, 13)) < expected.beforeHour &&
                receipt.technician === expected.technician &&
                receipt.feeCents === 0,
            },
            {
              id: 'one-booking',
              passed:
                Boolean(receipt) &&
                current.merchant.currentBooking.version === current.baseline?.booking.version + 1 &&
                current.merchant.currentBooking.startsAt === receipt.startsAt,
            },
          )
        else
          checks.push(
            {
              id: 'correct-items',
              passed:
                receipt?.orderId === expected.orderId &&
                receipt.accountId === expected.accountId &&
                JSON.stringify(receipt.selectedLineIds) ===
                  JSON.stringify(expected.selectedLineIds) &&
                receipt.lines?.reduce((n, line) => n + line.quantity, 0) === 1,
            },
            {
              id: 'jacket-unchanged',
              passed:
                Boolean(current.baseline?.jacket) &&
                JSON.stringify(current.baseline.jacket) ===
                  JSON.stringify(
                    current.merchant.lines.find((line) => line.id === 'JACKET-BLACK-M'),
                  ) &&
                !receipt?.selectedLineIds?.includes('JACKET-BLACK-M'),
            },
            {
              id: 'refund-destination',
              passed: receipt?.refundDestination === expected.refundDestination,
            },
            {
              id: 'method-terms',
              passed:
                Boolean(receipt) &&
                (!expected.noPrinterRequired || receipt.method === 'qr_dropoff') &&
                ['print_label', 'qr_dropoff'].includes(receipt.method) &&
                receipt.currency === 'USD' &&
                receipt.subtotalCents === 8000 &&
                receipt.deductionCents === (receipt.method === 'qr_dropoff' ? 500 : 0) &&
                receipt.expectedRefundCents === (receipt.method === 'qr_dropoff' ? 7500 : 8000),
            },
            {
              id: 'truthful-receipt',
              passed:
                receipt?.status === 'return_requested_refund_pending' &&
                (receipt.method !== 'qr_dropoff' || Boolean(receipt.qrUrl)),
            },
          )
        return {
          status: checks.every((c) => c.passed) ? 'passed' : 'failed',
          contractHash: record.executionContext.contractHash,
          mode: record.executionContext.mode,
          sourceEnvironmentId: BUILDER_SOURCE_ENVIRONMENT,
          recordScope: record.taskId,
          synthetic: true,
          checks,
          receipt: clone(receipt),
          observedAt: new Date(now()).toISOString(),
        }
      },
      policyEvents() {
        return clone(record.policyEvents || [])
      },
      async close() {
        record.closedAt ??= new Date(now()).toISOString()
        controller.revokeBuilderTask(record.taskId, record.executionContext.id)
        save()
        const pending = servers.get(record.id)
        if (pending) {
          const server = await pending
          await new Promise((ok) => server.close(ok))
          servers.delete(record.id)
        }
      },
    })
  return {
    async create({ buildId, url, goal = '', mode = 'inspect' }) {
      if (!['test', 'inspect'].includes(mode))
        throw failure(
          'environment_mismatch',
          'Live source execution is not available through the builder.',
        )
      if (typeof buildId !== 'string' || !buildId || buildId.length > 200)
        throw failure('invalid_input', 'A server-owned build identity is required.', 400)
      let target
      try {
        target = new URL(url, baseUrl)
      } catch {
        throw failure('unsupported_source', 'Choose a reviewed sandbox source URL.', 400)
      }
      const candidateOrigins = new Set(
        [baseUrl, sourceUrls.return, sourceUrls.appointment]
          .filter(Boolean)
          .map((u) => new URL(u).origin),
      )
      if (
        !candidateOrigins.has(target.origin) ||
        target.username ||
        target.password ||
        target.search ||
        target.hash ||
        !['/merchant', '/appointments', '/appointment'].includes(target.pathname)
      )
        throw failure(
          'unsupported_source',
          'This builder supports only the reviewed Northstar and Linden sandbox entry pages.',
          400,
        )
      const kind = target.pathname === '/merchant' ? 'return' : 'appointment'
      if (typeof goal !== 'string' || goal.length > 2000)
        throw failure('unsupported_goal', 'Use a concise supported task description.', 400)
      const goalText = goal.trim()
      if (
        goalText &&
        /\b(buy|purchase|donate|cancel|exchange|delete|email|cash|pickup)\b/i.test(goalText)
      )
        throw failure(
          'unsupported_goal',
          'This source supports only the described sample return or appointment move.',
          400,
        )
      if (
        kind === 'appointment' &&
        goalText &&
        (!/\b(move|reschedule|change)\b/i.test(goalText) ||
          !/\b(appointment|visit|washer repair)\b/i.test(goalText) ||
          !/\bsaturday\b/i.test(goalText) ||
          !/\bmorning\b/i.test(goalText) ||
          !/\b(maya(?: chen)?|same technician|keep (?:my|the|your) technician)\b/i.test(goalText) ||
          !/\b(no (?:extra )?fee|avoid (?:an? )?(?:extra )?fee|no cost|without (?:an? )?(?:extra )?fee)\b/i.test(
            goalText,
          ) ||
          /\b(sunday|monday|tuesday|wednesday|thursday|friday|afternoon|evening|luis)\b/i.test(
            goalText,
          ))
      )
        throw failure(
          'unsupported_goal',
          'The appointment integration supports moving BOOK-2048 to Saturday October 31 morning, keeping Maya Chen, with no extra fee. Use that task or leave the optional goal blank.',
          400,
        )
      let request = kind === 'return' ? String(goal).trim() || DEFAULT_REQUEST : ''
      if (kind === 'return' && goalText && !/\b(return|send back)\b/i.test(request))
        throw failure(
          'unsupported_goal',
          'Describe a return of the red shoes and the refund destination, or leave the optional goal blank for the sample return.',
          400,
        )
      request = request.replace(/printer[- ]free|QR drop[- ]?off/gi, 'without a printer')
      const record = {
        id: randomUUID(),
        taskId: 'bld_' + randomUUID().replaceAll('-', ''),
        buildId,
        kind,
        policyEvents: [],
      }
      const context = {
        id: randomUUID(),
        mode,
        purpose: 'generated-interface-' + mode,
        sourceEnvironmentId: BUILDER_SOURCE_ENVIRONMENT,
        sourceOrigin: null,
        accountId: kind === 'appointment' ? 'SERVICE-ACCOUNT-1' : 'DEMO-ACCOUNT-1',
        recordScope: record.taskId,
        allowedOperationIds: [
          ...manifest(kind, mode).map((a) => a.id),
          'check',
          ...(mode === 'test' ? ['choice', 'approve'] : []),
        ],
        artifactHash: null,
        contractHash: null,
        fixtureEpoch: randomUUID(),
        expiresAt: new Date(now() + lifetimeMs).toISOString(),
        policyVersion: POLICY_VERSION,
      }
      record.executionContext = context
      await startSource(record)
      record.sourceUrl = `http://127.0.0.1:${record.port}${kind === 'appointment' ? '/appointments' : '/merchant'}?taskId=${record.taskId}`
      context.sourceOrigin = new URL(record.sourceUrl).origin
      try {
        const initial = await controller.createBuilderTask({
          kind,
          request,
          ownerId: 'builder:' + record.id,
          executionContext: context,
          sourceUrl: record.sourceUrl,
        })
        record.contract = builderAcceptanceContract(kind, initial.intent)
        context.contractHash = hash(record.contract)
        controller.bindBuilderContract(record.taskId, context.id, context.contractHash)
        records.set(record.id, record)
        save()
        return session(record)
      } catch (e) {
        const server = await servers.get(record.id)
        server?.close()
        servers.delete(record.id)
        throw e
      }
    },
    get(id) {
      const record = records.get(id)
      if (!record)
        throw failure('missing_context', 'Saved synthetic source session not found.', 404)
      return session(record)
    },
    sources: [
      {
        kind: 'return',
        name: 'Northstar Outfitters',
        url: new URL('/merchant', sourceUrls.return || baseUrl).href,
      },
      {
        kind: 'appointment',
        name: 'Linden Home',
        url: new URL('/appointments', sourceUrls.appointment || baseUrl).href,
      },
    ],
    async shutdown() {
      for (const pending of servers.values()) {
        const server = await pending
        await new Promise((ok) => server.close(ok))
      }
      servers.clear()
    },
  }
}

// Existing fixture demo servers share storage with the isolated sources. Reserve
// their builder namespace so the public demo routes cannot bypass its gateway.
export async function handlePublicSource(req, res, url, adapter) {
  let forwarded = req
  let taskId = url.searchParams.get('taskId')
  if (req.method === 'POST') {
    let raw = ''
    for await (const chunk of req) {
      raw += chunk
      if (raw.length > 16384) throw failure('invalid_input', 'Source input is too large.', 400)
    }
    try {
      taskId = JSON.parse(raw || '{}').taskId
    } catch {
      throw failure('invalid_input', 'Invalid source input.', 400)
    }
    forwarded = Readable.from([raw])
    forwarded.method = req.method
    forwarded.headers = req.headers
  }
  if (typeof taskId === 'string' && taskId.startsWith('bld_')) {
    res.writeHead(403, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
    res.end(
      JSON.stringify({
        error: 'Use the isolated source gateway for this synthetic record.',
        code: 'missing_context',
      }),
    )
    return true
  }
  return adapter.handle(forwarded, res, url)
}
