import { randomUUID } from 'node:crypto'
import { Readable } from 'node:stream'
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs'
import { resolve, dirname } from 'node:path'
import { interpretRequest } from './intent.mjs'
import {
  runKane,
  getKaneAvailability,
  getTaskBrowserState,
  shutdownTaskBrowser,
} from './kane-worker.mjs'
import { canonicalProposal, proposalDigest } from './merchant-contract.mjs'
import {
  reasons,
  comparisons,
  candidates,
  expectedTerms,
  observedTerms,
  extractObjective,
  validationObjective,
  expectedMethod,
  methodLabel,
  destinationLabel,
} from './workflows.mjs'

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const evidenceRef = (r) => r.sessionId || r.evidencePath || r.testUrl || null
const phases = {
  discover: 'Reading your source record',
  prepare: 'Preparing your choices on the website',
  'change-method': 'Changing the return method',
  'validate-review': 'Checking every detail against your choices',
  correct: 'Restoring your saved choices',
  submit: 'Sending your approved request',
  'verify-confirmation': 'Checking the saved confirmation',
}

export function createController({
  merchant,
  appointments,
  sourceUrls,
  baseUrl,
  worker = runKane,
  browserState = getTaskBrowserState,
}) {
  const file = resolve(process.env.RAISING_KANE_DATA_DIR || 'data', 'tasks.json'),
    tasks = new Map(),
    active = new Set()
  try {
    for (const t of JSON.parse(readFileSync(file, 'utf8'))) {
      t.kind ??= 'return'
      tasks.set(t.id, t)
    }
  } catch (e) {
    if (e.code !== 'ENOENT') throw e
  }
  const source = (t) => (t.kind === 'appointment' ? appointments : merchant)
  const sourceBase = (t) => t.builderSourceUrl || sourceUrls?.[t.kind] || baseUrl
  const builderAuthority = Symbol('builder-controller-authority')
  function assertContext(t, operation) {
    if (!t.executionContext) return
    const c = t.executionContext
    if (t.executionRevokedAt)
      throw Object.assign(Error('This synthetic source session has ended.'), {
        code: 'revoked_permission',
      })
    if (Date.parse(c.expiresAt) <= Date.now())
      throw Object.assign(Error('The synthetic source permission expired.'), {
        code: 'expired_permission',
      })
    if (
      c.sourceEnvironmentId !== 'raising-kane-local-sandbox-v1' ||
      !['test', 'inspect'].includes(c.mode)
    )
      throw Object.assign(
        Error('This builder source only supports isolated local sandbox records.'),
        { code: 'environment_mismatch' },
      )
    if (c.recordScope !== t.id || !c.allowedOperationIds.includes(operation))
      throw Object.assign(Error('This source operation is not allowed in the current context.'), {
        code: 'source_write_not_allowed',
      })
  }
  const sourcePath = (t) => (t.kind === 'appointment' ? '/appointments' : '/merchant')
  function save() {
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file + '.tmp', JSON.stringify([...tasks.values()], null, 2), { mode: 0o600 })
    renameSync(file + '.tmp', file)
  }
  function event(t, text, kind = 'info') {
    t.events.push({
      at: new Date().toISOString(),
      text,
      kind,
      ...(t.executionContext
        ? {
            mode: t.executionContext.mode,
            sourceEnvironmentId: t.executionContext.sourceEnvironmentId,
            recordScope: t.id,
            synthetic: true,
          }
        : {}),
    })
    t.updatedAt = new Date().toISOString()
    save()
  }
  function clearApproval(t) {
    if (t.approval?.operationId) source(t).revokeGrant?.(t.approval.operationId)
    t.approval = null
    t.operationId = null
  }
  function invalidate(t) {
    clearApproval(t)
    t.validation = null
    t.verificationFields = []
    t.revision++
    t.error = null
  }
  function refresh(t) {
    const d = source(t).getDraft(t.id)
    t.merchant = d
    t.observedAt = new Date().toISOString()
    const overview = t.executionContext?.mode === 'inspect'
    t.checks = overview ? [] : comparisons(t, d)
    t.sourceViewUrl =
      sourceBase(t) + sourcePath(t) + '?taskId=' + encodeURIComponent(t.id) + '&view=readonly'
    if (t.kind === 'appointment' && !overview) t.candidates = candidates(t, d)
    if (
      t.validation &&
      !t.submissionStarted &&
      !active.has(t.id) &&
      (t.validation.sourceRevision !== d.revision || t.validation.digest !== proposalDigest(d))
    ) {
      clearApproval(t)
      t.validation = null
      t.status = t.checks.some((c) => c.status === 'conflict') ? 'conflict' : 'needs_attention'
      t.error = 'The source changed since the last browser check. Check the current proposal again.'
    }
    save()
    return d
  }
  function readOperation(t) {
    return t.operationId ? source(t).getOperation(t.operationId) : { status: 'absent' }
  }
  function reconcile(t) {
    const op = readOperation(t)
    t.operationObservation = { status: op.status, observedAt: new Date().toISOString() }
    if (op.status === 'committed') {
      if (
        !t.approval ||
        op.proposalDigest !== t.approval.proposalDigest ||
        !same(canonicalProposal(op.return), t.approval.proposal)
      )
        throw Error(
          'The source operation has different terms. It needs review; no new request was sent.',
        )
      t.sourceReturn = op.return
      t.status = 'submitted_unverified'
      save()
      return true
    }
    t.status = 'reconciling'
    t.error =
      op.status === 'absent'
        ? 'No saved result is visible yet. A retry keeps the same approved operation.'
        : 'The source is still resolving this request.'
    save()
    return false
  }
  function sourceUrl(t, approved = false) {
    const url = new URL(sourcePath(t), sourceBase(t))
    url.searchParams.set('taskId', t.id)
    if (t.executionContext?.mode === 'inspect') url.searchParams.set('view', 'readonly')
    if (approved) {
      url.searchParams.set('operationId', t.approval.operationId)
      url.searchParams.set('proposalDigest', t.approval.proposalDigest)
    }
    return url.href
  }
  async function browser(t, phase, objective, url = sourceUrl(t)) {
    const operation = ['prepare', 'correct', 'change-method'].includes(phase)
      ? 'choice'
      : phase === 'submit'
        ? 'submit'
        : 'check'
    assertContext(t, operation)
    const state = await browserState(t.id)
    if (state.status === 'lost') {
      const d = refresh(t)
      if (t.submissionStarted) reconcile(t)
      await shutdownTaskBrowser(t.id)
      event(t, `Restored the source connection at draft revision ${d.revision}.`, 'warning')
    }
    const revision = t.revision
    t.progress = { phase, text: phases[phase] || phase, startedAt: new Date().toISOString() }
    save()
    t.sourcePhase = phase
    let r
    try {
      r = await worker({
        taskId: t.id,
        phase,
        url,
        objective: `Go to ${url}. Reload the page and wait for the current source record to load. ${objective}`,
        onEvent(e) {
          if (e.type === 'step' && e.status === 'done') {
            t.progress.lastStep = e.remark
            save()
          }
        },
      })
    } finally {
      t.sourcePhase = null
    }
    t.evidence.push({
      phase,
      status: r.status,
      summary: r.summary,
      path: r.evidencePath || undefined,
      url: r.testUrl || undefined,
      sessionId: r.sessionId || undefined,
      runId: r.runId || undefined,
      finalState: r.finalState || {},
      durationMs: r.durationMs,
      creditsConsumed: r.creditsConsumed,
      taskRevision: revision,
      at: new Date().toISOString(),
      ...(t.executionContext
        ? {
            mode: t.executionContext.mode,
            sourceEnvironmentId: t.executionContext.sourceEnvironmentId,
            recordScope: t.id,
            synthetic: true,
          }
        : {}),
    })
    save()
    refresh(t)
    if (t.revision !== revision)
      throw Error('This result belongs to an earlier choice. Check the latest task again.')
    return r
  }
  function ensurePass(r) {
    if (r.status !== 'passed')
      throw Error(r.summary || 'The browser check did not finish. Your choices are saved.')
  }
  function dispatch(t, label, job) {
    if (active.has(t.id)) throw Error('A browser job is already running for this task.')
    if (t.takeover) throw Error('Finish source inspection before resuming the agent.')
    active.add(t.id)
    t.status = label === 'submit' ? 'submitting' : 'working'
    t.error = null
    event(t, phases[label] || label, 'progress')
    void (async () => {
      try {
        await job()
      } catch (e) {
        t.status = t.sourceReturn
          ? 'submitted_unverified'
          : t.submissionStarted
            ? 'reconciling'
            : 'needs_attention'
        t.error = e.message
        event(t, e.message, 'error')
      } finally {
        t.progress = null
        active.delete(t.id)
        save()
      }
    })()
  }
  function fieldChecks(t, r, d, confirmation = false) {
    const actual = observedTerms(t.kind, r.finalState || {}, confirmation),
      expected = expectedTerms(t.kind, d, confirmation)
    return Object.keys(expected).map((key) => ({
      key,
      expected: expected[key],
      observed: actual[key] ?? null,
      status: same(expected[key], actual[key])
        ? 'match'
        : actual[key] == null || actual[key] === ''
          ? 'unknown'
          : 'conflict',
    }))
  }
  function accept(t, r) {
    const d = refresh(t)
    t.verificationFields = fieldChecks(t, r, d)
    const matches = t.checks.every((c) => c.status === 'match'),
      observed = t.verificationFields.every((c) => c.status === 'match')
    if (r.status === 'passed' && matches && observed && evidenceRef(r) && t.baseline) {
      t.validation = {
        taskRevision: t.revision,
        sourceRevision: d.revision,
        digest: proposalDigest(d),
        proposal: canonicalProposal(d),
        reference: evidenceRef(r),
        at: new Date().toISOString(),
      }
      t.status = t.approval?.proposalDigest === t.validation.digest ? 'approved' : 'ready'
      t.error = null
      event(
        t,
        'The current source proposal matches your choices. All required browser observations were compared.',
        'success',
      )
      return true
    }
    t.validation = null
    clearApproval(t)
    t.status = matches ? 'needs_attention' : 'conflict'
    t.error = matches
      ? 'The source choices match, but the browser evidence is incomplete. Check again before approval.'
      : 'The website changed a choice that matters. Submission is blocked.'
    event(t, t.error, 'warning')
    return false
  }
  async function discover(t) {
    const objective =
      t.kind === 'appointment'
        ? 'Do not edit or confirm. Verify booking BOOK-2048 currently has Washer repair at 42 Linden Street, San Francisco with Maya Chen. Store the booking ID as "booking_id" and exact current ISO start time as "current_start".'
        : 'Do not edit or submit. Verify order ORD-1042 shows Red running shoes Size 8 and Black jacket. Store the order ID as "order_id".'
    const r = await browser(t, 'discover', objective)
    ensurePass(r)
    if (t.kind === 'appointment') {
      if (
        r.finalState?.booking_id !== 'BOOK-2048' ||
        r.finalState?.current_start !== t.merchant.currentBooking.startsAt
      )
        throw Error('The browser did not establish the current booking identity and time.')
      t.baseline = { booking: structuredClone(t.merchant.currentBooking) }
    } else {
      if (r.finalState?.order_id !== 'ORD-1042')
        throw Error('The browser did not establish the order identity.')
      t.baseline = {
        jacket: structuredClone(t.merchant.lines.find((l) => l.id === 'JACKET-BLACK-M')),
      }
    }
    const overview = t.executionContext?.mode === 'inspect'
    t.status = overview ? 'observed' : t.kind === 'appointment' ? 'needs_slot' : 'needs_reason'
    event(
      t,
      overview
        ? 'The source record was observed without choosing or changing anything.'
        : t.kind === 'appointment'
          ? 'Your current appointment is confirmed. Choose a replacement time.'
          : 'The order is confirmed. Choose the reason for your return.',
      'success',
    )
  }
  async function prepare(t) {
    if (!t.baseline) await discover(t)
    const instruction =
      t.kind === 'appointment'
        ? `Select the radio option with slot ID ${t.intent.slotId}. Wait for Draft saved. Do not confirm the booking.`
        : `Select only Red running shoes Size 8, unselect Black jacket. Set reason ${reasons[t.reason]}. Set method ${methodLabel(expectedMethod(t))}, wait for the save, then set refund destination ${destinationLabel(t.intent.refundDestination)}. Wait for the save. Do not submit.`
    const r = await browser(
      t,
      'prepare',
      instruction + ' After these edits, ' + validationObjective(t),
    )
    accept(t, r)
  }
  async function validate(t) {
    if (!t.baseline) {
      await discover(t)
      if ((t.kind === 'return' && !t.reason) || (t.kind === 'appointment' && !t.intent.slotId))
        return
    }
    const r = await browser(t, 'validate-review', validationObjective(t))
    accept(t, r)
  }
  async function repair(t) {
    if (!t.baseline) await discover(t)
    if (t.kind === 'appointment') return prepare(t)
    const r = await browser(
      t,
      'correct',
      `Restore only the requested source draft choices: select only red shoes Size 8, keep jacket excluded, reason ${reasons[t.reason]}, method ${methodLabel(expectedMethod(t))}, and then refund destination ${destinationLabel(t.intent.refundDestination)}. Wait for the saves. Do not submit.`,
    )
    ensurePass(r)
    event(t, 'The draft was corrected. Running the same review check again.')
    await validate(t)
  }
  async function verifyConfirmation(t) {
    if (!t.sourceReturn && !reconcile(t)) return
    const record = t.sourceReturn,
      url =
        sourceBase(t) +
        (t.kind === 'appointment' ? '/appointments/confirmations/' : '/merchant/returns/') +
        encodeURIComponent(record.requestId)
    const r = await browser(
      t,
      'verify-confirmation',
      `Do not submit or create another request. Verify this is saved confirmation ${record.requestId}. ` +
        (t.kind === 'appointment'
          ? 'Verify the appointment changed and exactly one active booking remains.'
          : 'Verify return requested and refund pending, and the jacket was kept. ') +
        (t.kind === 'return' && record.method === 'qr_dropoff'
          ? 'Verify the synthetic QR artifact link can be opened, then return to the confirmation. '
          : '') +
        extractObjective(t.kind, true),
      url,
    )
    ensurePass(r)
    t.confirmationFields = fieldChecks(t, r, record, true)
    const latest = readOperation(t),
      d = refresh(t)
    const baselineKept =
      t.kind === 'appointment'
        ? d.currentBooking.startsAt === record.startsAt &&
          d.currentBooking.version === t.baseline.booking.version + 1
        : same(
            t.baseline?.jacket,
            d.lines.find((l) => l.id === 'JACKET-BLACK-M'),
          )
    if (
      !t.confirmationFields.every((c) => c.status === 'match') ||
      !baselineKept ||
      !evidenceRef(r) ||
      latest.status !== 'committed' ||
      latest.proposalDigest !== t.approval.proposalDigest ||
      !same(canonicalProposal(latest.return), t.approval.proposal)
    )
      throw Error(
        'The source saved the request, but confirmation evidence is incomplete. Recheck it without resubmitting.',
      )
    t.receipt = {
      ...latest.return,
      sourceUrl: url,
      verifiedAt: new Date().toISOString(),
      evidenceReference: evidenceRef(r),
      ...(t.executionContext
        ? {
            mode: t.executionContext.mode,
            sourceEnvironmentId: t.executionContext.sourceEnvironmentId,
            recordScope: t.id,
            synthetic: true,
          }
        : {}),
      qrUrl: t.kind === 'return' && record.method === 'qr_dropoff' ? url + '/qr' : null,
    }
    t.status = 'complete'
    t.error = null
    event(
      t,
      t.kind === 'appointment'
        ? 'The changed appointment is verified. Your old time has been replaced.'
        : 'Return requested; refund pending. Kane verified the saved source record.',
      'success',
    )
  }
  for (const t of tasks.values())
    if (t.progress || ['working', 'submitting'].includes(t.status)) {
      t.progress = null
      t.sourcePhase = null
      t.status = t.submissionStarted ? 'reconciling' : 'needs_attention'
      t.error = 'The worker restarted. Your choices are saved. Check the source to resume.'
    }
  let availability = null,
    availabilityAt = 0
  function publicTask(t, clientId) {
    const copy = structuredClone(t)
    copy.busy = active.has(t.id)
    if (copy.busy) copy.status = t.submissionStarted ? 'submitting' : 'working'
    copy.canControl = Boolean(clientId && t.ownerId === clientId)
    delete copy.ownerId
    delete copy.executionContext
    delete copy.builderSourceUrl
    delete copy.sourcePhase
    for (const [index, e] of copy.evidence.entries()) {
      e.packAvailable = Boolean(e.path && existsSync(e.path))
      e.packUrl = e.packAvailable ? `/api/tasks/${t.id}/evidence/${index}` : null
      delete e.path
    }
    return copy
  }
  async function createTask(input, ownerId, executionContext = null, builderSourceUrl = null) {
    const kind = input.kind || 'return'
    let intent, interpretation, request
    if (executionContext?.mode === 'inspect') {
      request =
        'Read the source website without choosing, preparing, approving or submitting a transaction.'
      intent = null
      interpretation = { source: 'read-only-overview' }
    } else if (kind === 'return') {
      request =
        input.request || 'Return the red shoes, keep the jacket, refund my original payment method.'
      const parsed = await interpretRequest(request)
      if (parsed.unsupported || parsed.ambiguous || !parsed.item || !parsed.refundDestination)
        throw Object.assign(
          Error(parsed.issues.join(' ') || 'Choose a supported item and refund destination.'),
          { statusCode: 400 },
        )
      intent = {
        item: 'Red shoes, size 8',
        exclude: 'Jacket',
        refundDestination: parsed.refundDestination,
        noPrinter: parsed.noPrinter,
      }
      interpretation = { source: parsed.source, fallbackReason: parsed.fallbackReason }
    } else {
      request = 'Move my washer repair to Saturday morning. Keep Maya and avoid an extra fee.'
      intent = { keepTechnician: true, maxFeeCents: 0, date: '2026-10-31', slotId: null }
      interpretation = { source: 'supported-task' }
    }
    const t = {
      id: executionContext?.recordScope || randomUUID(),
      ownerId,
      ...(executionContext
        ? { executionContext: structuredClone(executionContext), builderSourceUrl }
        : {}),
      kind,
      status: 'created',
      request,
      revision: 1,
      intent,
      interpretation,
      reason: null,
      baseline: null,
      merchant: null,
      checks: [],
      verificationFields: [],
      events: [],
      evidence: [],
      approval: null,
      validation: null,
      receipt: null,
      sourceReturn: null,
      operationId: null,
      submissionStarted: false,
      error: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    tasks.set(t.id, t)
    event(
      t,
      executionContext?.mode === 'inspect'
        ? 'A read-only source overview is ready to inspect.'
        : 'Your choices are saved. Reading the source record.',
    )
    if (!executionContext) dispatch(t, 'discover', () => discover(t))
    else refresh(t)
    return t
  }
  async function handle(req, res, url) {
    const send = (code, body) => {
      res.writeHead(code, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      })
      res.end(JSON.stringify(body))
    }
    const json = async () => {
      let text = ''
      for await (const chunk of req) {
        text += chunk
        if (text.length > 32000) throw Error('Request too large')
      }
      return text ? JSON.parse(text) : {}
    }
    if (url.pathname === '/api/status' && req.method === 'GET') {
      if (!availability || Date.now() - availabilityAt > 60000) {
        availability = getKaneAvailability()
        availabilityAt = Date.now()
      }
      return send(200, {
        product: 'Raising Kane',
        kane: availability,
        openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
        sourceSubmissionReady: true,
        sites: [
          {
            kind: 'return',
            name: 'Northstar Outfitters',
            task: 'Return an item',
            description: 'Keep the right items. Get the right refund.',
            url: sourceUrls?.return,
          },
          {
            kind: 'appointment',
            name: 'Linden Home',
            task: 'Move a service visit',
            description: 'A new time, with your original choices intact.',
            url: sourceUrls?.appointment,
          },
        ],
      })
    }
    if (url.pathname === '/api/tasks' && req.method === 'GET')
      return send(200, {
        tasks: [...tasks.values()]
          .filter((t) => !t.executionContext && t.ownerId === req.clientId)
          .slice(-12)
          .reverse()
          .map((t) => ({
            id: t.id,
            kind: t.kind,
            status: t.status,
            createdAt: t.createdAt,
            request: t.request,
          })),
      })
    if (url.pathname === '/api/tasks' && req.method === 'POST') {
      const input = await json(),
        kind = input.kind || 'return'
      if (!['return', 'appointment'].includes(kind))
        return send(400, { error: 'Choose a supported website task.' })
      let t
      try {
        t = await createTask(input, req.clientId)
      } catch (e) {
        return send(e.statusCode || 400, { error: e.message })
      }
      return send(201, { task: publicTask(t, req.clientId) })
    }
    const packMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)\/evidence\/(\d+)$/)
    if (packMatch && req.method === 'GET') {
      const task = tasks.get(packMatch[1])
      if (!task || !req.clientId || task.ownerId !== req.clientId)
        return send(403, { error: 'Download evidence from the browser that started this task.' })
      const entry = task.evidence[Number(packMatch[2])]
      if (!entry?.path || !entry.path.endsWith('.evidence') || !existsSync(entry.path))
        return send(404, { error: 'This local evidence pack is unavailable.' })
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${task.id}-${entry.phase}.evidence"`,
        'Cache-Control': 'no-store',
      })
      const stream = createReadStream(entry.path)
      stream.on('error', () => res.destroy())
      stream.pipe(res)
      return
    }
    const match = url.pathname.match(
      /^\/api\/tasks\/([^/]+)(?:\/(choice|check|approve|submit|evidence))?$/,
    )
    if (!match || !tasks.has(match[1])) return send(404, { error: 'Task not found.' })
    const t = tasks.get(match[1])
    if (t.executionContext && req[builderAuthority] !== t.executionContext.id)
      return send(403, {
        error: 'Use the trusted generated-interface source bridge for this synthetic task.',
        code: 'missing_context',
      })
    if (!match[2] && req.method === 'GET') {
      refresh(t)
      return send(200, { task: publicTask(t, req.clientId) })
    }
    if (match[2] === 'evidence' && req.method === 'GET')
      return send(200, {
        taskId: t.id,
        kind: t.kind,
        revision: t.revision,
        validation: t.validation,
        receipt: t.receipt,
        attempts: publicTask(t, req.clientId).evidence,
      })
    if (req.method !== 'POST') return send(405, { error: 'Method not allowed.' })
    if (!req.clientId || t.ownerId !== req.clientId)
      return send(403, {
        error:
          'This task belongs to another browser session. Open it in the browser where you started it.',
      })
    const body = await json()
    try {
      assertContext(t, match[2] === 'check' && body.repair === true ? 'choice' : match[2])
    } catch (e) {
      return send(403, { error: e.message, code: e.code })
    }
    // Check after reading the body: two overlapping requests cannot both pass admission.
    if (active.has(t.id))
      return send(409, {
        error: 'A browser check is running. Your choices are saved; wait for it to finish.',
      })
    if (match[2] === 'choice') {
      if (t.submissionStarted || t.sourceReturn)
        return send(409, { error: 'Resolve the existing submission before changing its terms.' })
      if (t.kind === 'appointment') {
        if (body.maxFeeCents != null && ![0, 2500].includes(body.maxFeeCents))
          return send(400, { error: 'Choose one of the supported fee limits.' })
        if (body.keepTechnician != null && typeof body.keepTechnician !== 'boolean')
          return send(400, { error: 'Choose whether to keep your technician.' })
        const d = refresh(t),
          next = {
            ...t.intent,
            ...(body.maxFeeCents != null ? { maxFeeCents: body.maxFeeCents } : {}),
            ...(body.keepTechnician != null ? { keepTechnician: body.keepTechnician } : {}),
          }
        const options = candidates({ ...t, intent: next }, d)
        if (body.slotId && !options.some((s) => s.id === body.slotId && s.issues.length === 0))
          return send(409, {
            error: 'That time does not meet your current choices or is no longer available.',
          })
        invalidate(t)
        t.intent = { ...next, slotId: body.slotId || null }
        if (body.slotId) {
          dispatch(t, 'prepare', () => prepare(t))
        } else {
          t.status = t.baseline ? 'needs_slot' : 'needs_attention'
          refresh(t)
          event(t, 'Your appointment preferences changed. Choose an available matching time.')
        }
      } else {
        if (body.reason && !reasons[body.reason])
          return send(400, { error: 'Choose a reason offered by the merchant.' })
        if (
          body.refundDestination &&
          !['original_payment', 'store_credit'].includes(body.refundDestination)
        )
          return send(400, { error: 'Choose a supported refund destination.' })
        const hasMethod = Object.hasOwn(body, 'noPrinter') || body.method != null
        if (hasMethod && body.noPrinter != null && typeof body.noPrinter !== 'boolean')
          return send(400, { error: 'Printer preference must be true or false.' })
        if (body.method != null && !['qr', 'qr_dropoff', 'print_label'].includes(body.method))
          return send(400, { error: 'Unknown return method.' })
        if (!body.reason && !body.refundDestination && !hasMethod)
          return send(400, { error: 'Choose a reason, return method or refund destination.' })
        const methodOnly = hasMethod && Boolean(t.reason) && !body.reason && !body.refundDestination
        invalidate(t)
        if (body.reason) t.reason = body.reason
        if (body.refundDestination) t.intent.refundDestination = body.refundDestination
        if (hasMethod) t.intent.noPrinter = body.noPrinter ?? body.method !== 'print_label'
        if (!t.reason) {
          t.status = t.baseline ? 'needs_reason' : 'needs_attention'
          save()
        } else
          dispatch(t, methodOnly ? 'change-method' : 'prepare', async () => {
            if (!t.baseline) await discover(t)
            if (methodOnly) {
              const r = await browser(
                t,
                'change-method',
                `Choose ${methodLabel(expectedMethod(t))} under Return method. Wait for the saved message. Do not change the refund destination. Do not submit.`,
              )
              ensurePass(r)
              await validate(t)
            } else await prepare(t)
          })
      }
      return send(202, { task: publicTask(t, req.clientId) })
    }
    if (match[2] === 'check') {
      dispatch(t, 'validate-review', async () => {
        if (t.executionContext?.mode === 'inspect') {
          await discover(t)
        } else if (t.submissionStarted) {
          if (reconcile(t)) await verifyConfirmation(t)
          else if (
            t.operationObservation.status === 'absent' &&
            t.approval &&
            proposalDigest(refresh(t)) === t.approval.proposalDigest
          ) {
            t.status = 'approved'
            t.retryReady = true
            save()
          }
        } else if (!t.baseline) await discover(t)
        else if (t.kind === 'return' && !t.reason) {
          t.status = 'needs_reason'
          save()
        } else if (t.kind === 'appointment' && !t.intent.slotId) {
          t.status = 'needs_slot'
          save()
        } else if (body.repair === true) await repair(t)
        else await validate(t)
      })
      return send(202, { task: publicTask(t, req.clientId) })
    }
    if (match[2] === 'approve') {
      const d = refresh(t)
      if (
        t.executionContext &&
        (body.taskRevision !== t.revision || body.proposalDigest !== proposalDigest(d))
      )
        return send(409, {
          error: 'The approved terms changed. Review the exact current proposal again.',
          code: 'stale_proposal',
        })
      if (
        t.status !== 'ready' ||
        !t.baseline ||
        !t.validation ||
        t.validation.taskRevision !== t.revision ||
        t.validation.sourceRevision !== d.revision ||
        t.validation.digest !== proposalDigest(d) ||
        !t.checks.every((c) => c.status === 'match')
      )
        return send(409, { error: 'Kane must verify this exact current proposal before approval.' })
      const operationId = randomUUID(),
        digest = proposalDigest(d)
      const grant = source(t).registerGrant({
        taskId: t.id,
        operationId,
        intentRevision: t.revision,
        proposalDigest: digest,
        draftVersion: d.revision,
        validationRunId: t.validation.reference,
        ...(t.executionContext
          ? {
              sourceEnvironmentId: t.executionContext.sourceEnvironmentId,
              mode: t.executionContext.mode,
              expiresAt: t.executionContext.expiresAt,
            }
          : {}),
      })
      if (
        grant.status !== 'active' ||
        grant.operationId !== operationId ||
        grant.proposalDigest !== digest ||
        grant.draftVersion !== d.revision
      )
        throw Error('The source did not confirm the exact approval grant.')
      t.approval = {
        operationId,
        proposalDigest: digest,
        proposal: canonicalProposal(d),
        taskRevision: t.revision,
        sourceRevision: d.revision,
        validationRunId: t.validation.reference,
        at: new Date().toISOString(),
      }
      t.operationId = operationId
      t.status = 'approved'
      event(
        t,
        'You approved this exact proposal. The source grant is bound to these terms.',
        'success',
      )
      return send(200, { task: publicTask(t, req.clientId) })
    }
    if (match[2] === 'submit') {
      const d = refresh(t)
      if (
        !t.approval ||
        !['approved', 'reconciling'].includes(t.status) ||
        t.approval.taskRevision !== t.revision ||
        t.approval.proposalDigest !== proposalDigest(d) ||
        t.approval.sourceRevision !== d.revision
      )
        return send(409, { error: 'Review and approve the current verified proposal first.' })
      t.submissionStarted = true
      save()
      dispatch(t, 'submit', async () => {
        const op = readOperation(t)
        if (op.status === 'committed') {
          reconcile(t)
          return verifyConfirmation(t)
        }
        if (op.status !== 'absent') {
          t.status = 'reconciling'
          save()
          return
        }
        const r = await browser(
          t,
          'submit',
          `Click ${t.kind === 'appointment' ? 'Confirm appointment change' : 'Submit return request'} once. Wait for the saved confirmation. Do not start another request. Store the ${t.kind === 'appointment' ? 'change' : 'return'} request ID as "request_id".`,
          sourceUrl(t, true),
        )
        if (reconcile(t)) await verifyConfirmation(t)
        else if (r.status !== 'passed') {
          t.error = r.summary
          save()
        }
      })
      return send(202, { task: publicTask(t, req.clientId) })
    }
    return send(404, { error: 'Not found.' })
  }
  async function createBuilderTask({ kind, request, ownerId, executionContext, sourceUrl }) {
    if (
      !executionContext ||
      !executionContext.recordScope?.startsWith('bld_') ||
      tasks.has(executionContext.recordScope)
    )
      throw Error('A fresh, server-owned synthetic task context is required.')
    const t = await createTask(
      { kind, request },
      ownerId,
      executionContext,
      new URL(sourceUrl).origin,
    )
    assertContext(t, 'check')
    return publicTask(t, ownerId)
  }
  function builderTask(id, contextId) {
    const t = tasks.get(id)
    if (!t?.executionContext || t.executionContext.id !== contextId)
      throw Object.assign(Error('Synthetic source context not found.'), { code: 'missing_context' })
    return t
  }
  function readBuilderTask(id, contextId) {
    const t = builderTask(id, contextId)
    refresh(t)
    return publicTask(t, t.ownerId)
  }
  async function invokeBuilderTask(id, contextId, operation, payload = {}) {
    const t = builderTask(id, contextId)
    if (!['choice', 'check', 'approve', 'submit'].includes(operation))
      throw Object.assign(Error('Unknown source operation.'), { code: 'unknown_operation' })
    const req = Readable.from([JSON.stringify(payload)])
    req.method = 'POST'
    req.clientId = t.ownerId
    req[builderAuthority] = contextId
    let statusCode, value
    const res = {
      writeHead(code) {
        statusCode = code
      },
      end(body) {
        value = JSON.parse(body)
      },
    }
    await handle(req, res, new URL('/api/tasks/' + id + '/' + operation, baseUrl))
    if (statusCode >= 400)
      throw Object.assign(Error(value.error), {
        code: value.code || 'source_action_rejected',
        statusCode,
      })
    return value.task
  }
  function builderBoundary(id, contextId) {
    const t = builderTask(id, contextId)
    const committed = t.operationId ? source(t).getOperation(t.operationId) : null
    return {
      context: structuredClone(t.executionContext),
      phase: t.sourcePhase || null,
      operationId: t.operationId,
      requestId: committed?.return?.requestId || null,
      busy: active.has(t.id),
    }
  }
  function revokeBuilderTask(id, contextId) {
    const t = builderTask(id, contextId)
    t.executionRevokedAt ??= new Date().toISOString()
    if (!t.sourceReturn && !t.submissionStarted) clearApproval(t)
    save()
  }
  function bindBuilderContract(id, contextId, contractHash) {
    const t = builderTask(id, contextId)
    if (
      !/^[a-f0-9]{64}$/.test(contractHash) ||
      t.executionContext.contractHash ||
      t.evidence.length
    )
      throw Error('The source acceptance contract is already bound or invalid.')
    t.executionContext.contractHash = contractHash
    save()
  }
  function builderResult(id, contextId) {
    return structuredClone(readOperation(builderTask(id, contextId)))
  }
  function builderEvidence(id, contextId) {
    return structuredClone(builderTask(id, contextId).evidence)
  }
  return {
    handle,
    createBuilderTask,
    readBuilderTask,
    invokeBuilderTask,
    builderBoundary,
    builderEvidence,
    bindBuilderContract,
    revokeBuilderTask,
    builderResult,
  }
}
