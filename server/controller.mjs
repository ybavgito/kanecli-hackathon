import { createHash, randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { interpretRequest } from './intent.mjs'
import { runKane, getKaneAvailability, getTaskBrowserState, shutdownTaskBrowser } from './kane-worker.mjs'

const tasksFile = new URL('../data/tasks.json', import.meta.url)
const tasksTemp = new URL('../data/tasks.json.tmp', import.meta.url)
const reasons = { too_small: 'Size or fit issue', changed_mind: 'Changed my mind', damaged: 'Arrived damaged' }
const active = new Set()

function proposal(draft) {
  if (!draft) return null
  return {
    accountId: draft.accountId, orderId: draft.orderId,
    revision: draft.revision,
    selectedLines: (draft.selectedLines || draft.lines || []).filter(line => draft.selectedLineIds.includes(line.id))
      .map(line => ({ id: line.id, quantity: line.quantity })).sort((a, b) => a.id.localeCompare(b.id)),
    reason: draft.reason, method: draft.method, refundDestination: draft.refundDestination,
    currency: draft.currency, subtotalCents: draft.subtotalCents,
    deductionCents: draft.deductionCents, expectedRefundCents: draft.expectedRefundCents,
    nextStep: draft.nextStep,
  }
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const evidenceRef = result => result.sessionId || result.evidencePath || result.testUrl || null
const money = cents => `$${(cents / 100).toFixed(2)}`
const destinationLabel = value => value === 'store_credit' ? 'Store credit' : 'Original payment method'
const methodLabel = value => value === 'qr_dropoff' ? 'Printer-free QR drop-off' : 'Print a shipping label'
const expectedMethod = task => task.intent.noPrinter ? 'qr_dropoff' : 'print_label'
const normalizedText = value => String(value ?? '').trim().toLowerCase().replace(/[_\s-]+/g, ' ')
const observedDestination = value => ({ 'original payment': 'original_payment', 'original payment method': 'original_payment', 'store credit': 'store_credit' })[normalizedText(value)] || null
const observedMethod = value => ({ 'qr dropoff': 'qr_dropoff', 'qr drop off': 'qr_dropoff', 'printer free qr drop off': 'qr_dropoff', 'print label': 'print_label', 'print a shipping label': 'print_label' })[normalizedText(value)] || null
const observedMoney = value => {
  const text = String(value ?? '').replace(/USD|\$|,/g, '').replace(/\s/g, '').replace('−', '-')
  return /^-?\d+(?:\.\d{1,2})?$/.test(text) ? Math.round(Number(text) * 100) : null
}
const observedLines = value => {
  let lines = value
  if (typeof lines === 'string') {
    try { lines = JSON.parse(lines) } catch { lines = lines.split(',').map(id => id.trim()) }
  }
  return Array.isArray(lines) ? [...lines].sort() : []
}
const extractRevision = value => {
  if (typeof value === 'number') return value
  const match = String(value ?? '').match(/^(?:draft\s+revision\s*)?(\d+)$/i)
  return match ? Number(match[1]) : null
}

export function createController({ merchant, baseUrl }) {
  const tasks = new Map()
  try {
    for (const task of JSON.parse(readFileSync(tasksFile, 'utf8'))) tasks.set(task.id, task)
  } catch (error) { if (error.code !== 'ENOENT') throw error }

  function save() {
    mkdirSync(new URL('../data/', import.meta.url), { recursive: true })
    writeFileSync(tasksTemp, JSON.stringify([...tasks.values()], null, 2), { mode: 0o600 })
    renameSync(tasksTemp, tasksFile)
  }

  function event(task, text, kind = 'info') {
    task.events.push({ at: new Date().toISOString(), text, kind })
    task.updatedAt = new Date().toISOString()
    save()
  }

  function refresh(task) {
    const draft = merchant.getDraft(task.id)
    task.merchant = draft
    task.observedAt = new Date().toISOString()
    const selected = draft.selectedLineIds
    const row = (label, matches, detail) => ({ label, status: matches ? 'match' : 'conflict', detail })
    task.checks = [
      row('The right order', draft.orderId === 'ORD-1042' && draft.accountId === 'DEMO-ACCOUNT-1', `Source order ${draft.orderId}.`),
      row('Return one pair of red shoes', selected.length === 1 && selected[0] === 'SHOE-RED-8', 'Only the red shoes, size 8, should be selected.'),
      row('Keep the jacket', !selected.includes('JACKET-BLACK-M'), selected.includes('JACKET-BLACK-M') ? 'The merchant has selected the jacket for return.' : 'The jacket is excluded.'),
      row('Use your chosen reason', Boolean(task.reason) && draft.reason === task.reason, reasons[draft.reason] || 'A reason is still needed.'),
      row(`Refund to ${destinationLabel(task.intent.refundDestination).toLowerCase()}`, draft.refundDestination === task.intent.refundDestination,
        `The merchant has ${destinationLabel(draft.refundDestination).toLowerCase()} selected.`),
      row(task.intent.noPrinter ? 'No printer needed' : 'Use a shipping label', draft.method === expectedMethod(task), methodLabel(draft.method)),
    ]
    save()
    return draft
  }

  function record(task, phase, result, startedRevision) {
    const entry = {
      phase, status: result.status, summary: result.summary,
      path: result.evidencePath || undefined, runId: result.runId || undefined,
      sessionId: result.sessionId || undefined, url: result.testUrl || undefined,
      finalState: result.finalState || {}, durationMs: result.durationMs,
      creditsConsumed: result.creditsConsumed,
      browserId: result.browserId, browserReused: result.browserReused, browserReconnected: result.browserReconnected,
      taskRevision: startedRevision, at: new Date().toISOString(),
    }
    task.evidence.push(entry)
    if (result.browserId) task.browser = { id: result.browserId, reused: result.browserReused, observedAt: entry.at }
    save()
    return entry
  }

  function sourceUrl(task, approved = false) {
    const url = new URL('/merchant', baseUrl)
    url.searchParams.set('taskId', task.id)
    if (approved && task.approval) {
      url.searchParams.set('operationId', task.approval.operationId)
      url.searchParams.set('attemptId', task.approval.operationId)
      url.searchParams.set('proposalDigest', task.approval.proposalDigest)
    }
    return url.href
  }

  async function browser(task, phase, objective, url = sourceUrl(task)) {
    const browserState = await getTaskBrowserState(task.id)
    if (browserState.status === 'lost') {
      const previous = task.merchant
      const source = refresh(task)
      if (source.orderId !== 'ORD-1042' || source.accountId !== 'DEMO-ACCOUNT-1'
        || (previous && source.revision < previous.revision)) {
        throw new Error('The saved source draft could not be reconciled after the browser was lost.')
      }
      if (task.submissionStarted) {
        const operation = readOperation(task)
        if (!['absent', 'committed'].includes(operation.status)) throw new Error('Submission is still unresolved. Browser recovery cannot retry it yet.')
      }
      await shutdownTaskBrowser(task.id)
      task.browserRecovery = { at: new Date().toISOString(), sourceRevision: source.revision }
      event(task, 'The source draft was checked after the browser stopped. Resuming in a new task browser.', 'warning')
    }
    task.progress = { phase, text: phase.replaceAll('-', ' '), startedAt: new Date().toISOString() }
    const revision = task.revision
    save()
    const result = await runKane({ taskId: task.id, phase, url, objective: `Go to ${url}. ${objective}`,
      onEvent(update) {
        if (update.type === 'step' && update.status === 'done') {
          task.progress.lastStep = update.remark
          save()
        }
      },
    })
    record(task, phase, result, revision)
    if (task.revision !== revision) throw new Error('An old browser result was retained as history. Check the current task again.')
    refresh(task)
    return result
  }

  function ensurePass(result) {
    if (result.status !== 'passed') throw new Error(result.summary || 'Kane did not verify this step.')
  }

  function dispatch(task, label, job) {
    if (active.has(task.id)) throw new Error('Kane is still working on this task.')
    active.add(task.id)
    task.status = label === 'submit' ? 'submitting' : 'working'
    task.error = null
    event(task, `Kane is ${label}.`, 'progress')
    void (async () => {
      try { await job() }
      catch (error) {
        task.error = error.message
        task.status = error.code === 'SOURCE_MISMATCH' ? 'needs_attention' : task.sourceReturn ? 'submitted_unverified' : task.submissionStarted ? 'reconciling' : 'needs_attention'
        event(task, error.message, 'error')
      } finally {
        task.progress = null
        active.delete(task.id)
        save()
      }
    })()
  }

  function validationObjective(task) {
    return `Do not change or submit the form. Assert the order number displayed below Start a return is "ORD-1042". `
      + `Verify only Red running shoes, Size 8, quantity 1 is selected and Black jacket is not selected. `
      + `Verify Reason for return is "${reasons[task.reason]}". `
      + `Verify Return method is "${methodLabel(expectedMethod(task))}". `
      + `Verify Refund destination is "${destinationLabel(task.intent.refundDestination)}". `
      + `Verify the deduction is ${task.intent.noPrinter ? '$5.00' : '$0.00'} and the expected refund is ${task.intent.noPrinter ? '$75.00' : '$80.00'}. `
      + `Store the order ID as "order_id". Store just the numeric draft revision shown on the page as "draft_revision". `
      + `Store the selected refund destination as "refund_destination".`
  }

  function acceptValidation(task, result) {
    const draft = refresh(task)
    const extracted = result.finalState || {}
    const observedRevision = extractRevision(extracted.draft_revision)
    const orderMatches = String(extracted.order_id || '').trim() === draft.orderId
    const destinationMatches = observedDestination(extracted.refund_destination) === task.intent.refundDestination
      && observedDestination(extracted.refund_destination) === draft.refundDestination
    const checksMatch = task.checks.every(check => check.status === 'match')
    if (result.status === 'passed' && checksMatch && orderMatches && destinationMatches
      && observedRevision === draft.revision && evidenceRef(result)) {
      task.validation = { taskRevision: task.revision, sourceRevision: draft.revision,
        proposal: proposal(draft), reference: evidenceRef(result), at: new Date().toISOString() }
      const approvalStillMatches = task.approval?.taskRevision === task.revision && same(task.approval.proposal, proposal(draft))
      if (!approvalStillMatches) clearApproval(task)
      task.status = approvalStillMatches ? 'approved' : 'ready'
      task.error = null
      event(task, 'Kane verified the current merchant draft against your choices.', 'success')
      return true
    }
    task.validation = null
    clearApproval(task)
    task.status = checksMatch ? 'needs_attention' : 'conflict'
    task.error = checksMatch
      ? 'The choices match, but Kane has not returned complete evidence for this draft revision.'
      : 'The merchant draft conflicts with your choices. Nothing has been submitted.'
    event(task, task.error, 'warning')
    return false
  }

  async function validate(task) {
    const result = await browser(task, 'validate-review', validationObjective(task))
    acceptValidation(task, result)
    return result
  }

  async function prepare(task) {
    const objective = `Assert the order number displayed below Start a return is "ORD-1042" and the page lists red shoes and a jacket. `
      + `Select only Red running shoes, Size 8. Choose Reason for return "${reasons[task.reason]}". `
      + `Choose Return method "${methodLabel(expectedMethod(task))}", then choose Refund destination "${destinationLabel(task.intent.refundDestination)}". `
      + `Each change saves automatically; wait for the draft-saved message. Do not submit. `
      + validationObjective(task)
    const result = await browser(task, 'prepare', objective)
    acceptValidation(task, result)
  }

  async function repair(task) {
    const result = await browser(task, 'correct',
      `Assert the order number displayed below Start a return is "ORD-1042". Set Refund destination to "${destinationLabel(task.intent.refundDestination)}". `
      + 'Wait for the draft-saved message. Keep all other choices unchanged. Do not submit.')
    ensurePass(result)
    event(task, 'Kane changed the conflicting refund choice. Running the same review check again.', 'info')
    await validate(task)
  }

  function readOperation(task) {
    const id = task.operationId || task.approval?.operationId || task.approval?.attemptId
    if (!id) return { status: 'absent' }
    if (merchant.getOperation) return merchant.getOperation(id)
    const found = merchant.getReturnByAttempt(id)
    return found ? { status: 'committed', operationId: id, requestId: found.requestId, return: found } : { status: 'absent' }
  }

  function reconcile(task) {
    const operation = readOperation(task)
    task.operationObservation = { ...operation, observedAt: new Date().toISOString() }
    if (operation.status === 'committed') {
      const found = operation.return
      if (!task.approval || !same(proposal(found), task.approval.proposal)) {
        task.status = 'needs_attention'
        task.error = 'A source return exists with different or incomplete terms. It needs review.'
        save()
        const error = new Error(task.error)
        error.code = 'SOURCE_MISMATCH'
        throw error
      }
      task.sourceReturn = found
      task.status = 'submitted_unverified'
      event(task, `The source saved ${found.requestId}. Kane will verify its confirmation.`, 'info')
      return true
    }
    task.status = 'reconciling'
    task.error = operation.status === 'absent'
      ? 'No committed source result is visible yet. A retry must keep the same operation ID.'
      : 'The source has not resolved this submission yet.'
    save()
    return false
  }

  async function verifyConfirmation(task) {
    if (!task.sourceReturn && !reconcile(task)) return
    const record = task.sourceReturn
    const url = new URL(`/merchant/returns/${encodeURIComponent(record.requestId)}`, baseUrl).href
    const result = await browser(task, 'verify-confirmation',
      `Verify this is return request ${record.requestId} for order ORD-1042. `
      + `Verify it returns only Red running shoes, size 8, quantity 1, and the jacket was kept. `
      + `Verify the return method is "${methodLabel(record.method)}", refund destination is "${destinationLabel(record.refundDestination)}", `
      + `currency is USD, deduction is ${money(record.deductionCents)}, and expected refund is ${money(record.expectedRefundCents)}. `
      + `Verify the status says return requested and refund pending. Verify the next-step instructions are present${record.method === 'qr_dropoff' ? ' and a clearly labeled synthetic QR artifact can be opened' : ''}. `
      + 'Store the return request ID as "return_request_id", order ID as "order_id", returned line IDs as "returned_line_ids", returned quantity as "returned_quantity", '
      + 'return method as "return_method", refund destination as "refund_destination", currency as "currency", displayed deduction amount in dollars as "deduction", '
      + 'displayed expected refund in dollars as "expected_refund", and exact next-step instructions as "next_step". Store whether the jacket was kept as "jacket_kept". Do not submit another request.', url)
    ensurePass(result)
    const idMatches = String(result.finalState?.return_request_id || '').trim() === record.requestId
    const orderMatches = String(result.finalState?.order_id || '').trim() === 'ORD-1042'
    const latest = readOperation(task)
    const observed = result.finalState || {}
    const expectedLines = [...record.selectedLineIds].sort()
    const termsMatch = same(observedLines(observed.returned_line_ids), expectedLines)
      && Number(observed.returned_quantity) === 1
      && observedMethod(observed.return_method) === record.method
      && observedDestination(observed.refund_destination) === record.refundDestination
      && String(observed.currency).trim().toUpperCase() === record.currency
      && Math.abs(observedMoney(observed.deduction) ?? NaN) === record.deductionCents
      && observedMoney(observed.expected_refund) === record.expectedRefundCents
      && normalizedText(observed.next_step) === normalizedText(record.nextStep)
      && ['true', 'yes'].includes(normalizedText(observed.jacket_kept))
    const jacket = task.merchant.lines.find(line => line.id === 'JACKET-BLACK-M')
    const jacketUnchanged = task.baseline?.jacket && same(jacket, task.baseline.jacket)
    if (!idMatches || !orderMatches || !evidenceRef(result)
      || !termsMatch || !jacketUnchanged || latest.status !== 'committed' || !same(proposal(latest.return), task.approval.proposal)) {
      throw new Error('The return was submitted, but the final confirmation evidence is incomplete or changed.')
    }
    task.receipt = { ...latest.return, sourceUrl: url, verifiedAt: new Date().toISOString(), evidenceReference: evidenceRef(result) }
    task.status = 'complete'
    task.error = null
    event(task, `Kane verified ${record.requestId} in the source. Return requested; refund pending.`, 'success')
  }

  function clearApproval(task) {
    if (task.approval?.operationId && merchant.revokeGrant) merchant.revokeGrant(task.approval.operationId)
    task.approval = null
    task.operationId = null
  }

  function invalidate(task) {
    clearApproval(task)
    task.validation = null
    task.revision++
  }

  function verifyLegacyApproval({ taskId, draft, attemptId }) {
    const task = tasks.get(taskId)
    return Boolean(task?.approval?.validated && task.approval.operationId === attemptId
      && task.approval.taskRevision === task.revision
      && same(task.approval.proposal, proposal(draft)))
  }

  for (const task of tasks.values()) {
    if (['working', 'submitting', 'reconciling'].includes(task.status)) {
      task.progress = null
      if (task.submissionStarted || task.operationId) {
        try { reconcile(task) } catch (error) { task.status = error.code === 'SOURCE_MISMATCH' ? 'needs_attention' : 'reconciling'; task.error = error.code === 'SOURCE_MISMATCH' ? error.message : 'The source is unavailable. Submission has not been retried.' }
      } else { task.status = 'needs_attention'; task.error = 'The worker restarted. Check the task to resume from its saved source draft.' }
    }
  }

  async function handle(req, res, url) {
    const send = (code, body) => {
      res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
      res.end(JSON.stringify(body))
    }
    const json = async () => {
      let text = ''
      for await (const chunk of req) {
        text += chunk
        if (text.length > 32_000) throw new Error('Request is too large.')
      }
      return text ? JSON.parse(text) : {}
    }
    if (url.pathname === '/api/status' && req.method === 'GET') {
      return send(200, { product: 'Raising Kane', kane: getKaneAvailability(), openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
        sourceSubmissionReady: typeof merchant.registerGrant === 'function' && typeof merchant.getOperation === 'function' })
    }
    if (url.pathname === '/api/tasks' && req.method === 'POST') {
      if (active.size) return send(409, { error: 'This demo runs one browser task at a time. Let the current task finish its step.' })
      const { request } = await json()
      if (typeof request !== 'string' || !request.trim()) return send(400, { error: 'Describe what you want to return.' })
      const interpreted = await interpretRequest(request)
      if (interpreted.unsupported || interpreted.ambiguous || !interpreted.item || !interpreted.refundDestination) {
        return send(400, { error: interpreted.issues.join(' ') || 'Clarify the item and refund destination.' })
      }
      const task = {
        id: randomUUID(), status: 'created', request: request.trim().slice(0, 1000), revision: 1,
        intent: { item: 'Red shoes, size 8', exclude: 'Jacket', refundDestination: interpreted.refundDestination, noPrinter: interpreted.noPrinter },
        interpretation: { source: interpreted.source, fallbackReason: interpreted.fallbackReason },
        reason: null, merchant: null, checks: [], events: [], evidence: [], approval: null,
        validation: null, receipt: null, sourceReturn: null, operationId: null, submissionStarted: false, error: null,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }
      tasks.set(task.id, task)
      event(task, 'Your request is saved. Kane will inspect the source order.')
      dispatch(task, 'reading the merchant order', async () => {
        const result = await browser(task, 'discover',
          'Verify order ORD-1042 shows Red running shoes size 8 and Black jacket. Store the order ID as "order_id". Do not change or submit the order.')
        ensurePass(result)
        if (String(result.finalState?.order_id || '').trim() !== 'ORD-1042') throw new Error('Kane did not extract the expected order ID.')
        task.baseline = { orderId: task.merchant.orderId, accountId: task.merchant.accountId,
          jacket: structuredClone(task.merchant.lines.find(line => line.id === 'JACKET-BLACK-M')) }
        task.status = 'needs_reason'
        event(task, 'Kane found the order. Choose your return reason.', 'success')
      })
      return send(201, { task })
    }
    const match = url.pathname.match(/^\/api\/tasks\/([^/]+)(?:\/(choice|check|approve|submit))?$/)
    if (!match) return send(404, { error: 'Not found.' })
    const task = tasks.get(match[1])
    if (!task) return send(404, { error: 'Task not found.' })
    if (!match[2] && req.method === 'GET') return send(200, { task })
    if (req.method !== 'POST') return send(405, { error: 'Method not allowed.' })
    if (active.has(task.id)) return send(409, { error: 'Kane is still working on this step.' })

    if (match[2] === 'choice') {
      if (task.submissionStarted || task.sourceReturn) return send(409, { error: 'The submission outcome must be resolved before changing this task.' })
      const choice = await json()
      if (choice.reason) {
        if (!reasons[choice.reason]) return send(400, { error: 'Choose one of the merchant reasons.' })
        invalidate(task)
        task.reason = choice.reason
        dispatch(task, 'preparing your return', () => prepare(task))
      } else if (choice.noPrinter || ['qr', 'qr_dropoff'].includes(choice.method)) {
        if (!task.reason) return send(409, { error: 'Choose a return reason first.' })
        invalidate(task)
        task.intent.noPrinter = true
        dispatch(task, 'changing the return method', async () => {
          const result = await browser(task, 'change-method',
            'Assert the order number displayed below Start a return is "ORD-1042". Choose Printer-free QR drop-off under Return method. Wait for the draft-saved message. Store the order ID as "order_id". Do not change the refund destination and do not submit.')
          ensurePass(result)
          event(task, 'The method changed. Kane is checking whether your other choices survived.', 'info')
          await validate(task)
        })
      } else return send(400, { error: 'Choose a reason or request printer-free drop-off.' })
      return send(202, { task })
    }

    if (match[2] === 'check') {
      const options = await json()
      if (task.submissionStarted || task.sourceReturn) {
        dispatch(task, 'checking the submitted return', async () => {
          if (reconcile(task)) await verifyConfirmation(task)
          else if (task.operationObservation?.status === 'absent' && task.approval
            && same(proposal(refresh(task)), task.approval.proposal)) {
            task.status = 'approved'
            task.retryReady = true
            task.error = 'No committed result is visible. A retry will use the same approved operation to prevent a duplicate.'
          }
        })
      } else if (!task.reason) {
        dispatch(task, 'reading the merchant order', async () => {
          const result = await browser(task, 'discover', 'Verify order ORD-1042 contains red shoes and a jacket. Store the order ID as "order_id". Do not edit or submit.')
          ensurePass(result)
          if (String(result.finalState?.order_id || '').trim() !== 'ORD-1042') throw new Error('Kane did not extract the expected order ID.')
          task.baseline ??= { orderId: task.merchant.orderId, accountId: task.merchant.accountId,
            jacket: structuredClone(task.merchant.lines.find(line => line.id === 'JACKET-BLACK-M')) }
          task.status = 'needs_reason'
        })
      } else {
        refresh(task)
        dispatch(task, 'checking your choices', async () => {
          if (options.repair === true) {
            if (task.merchant.reason !== task.reason || task.merchant.method !== expectedMethod(task)
              || !same(task.merchant.selectedLineIds, ['SHOE-RED-8'])) await prepare(task)
            else await repair(task)
          } else await validate(task)
        })
      }
      return send(202, { task })
    }

    if (match[2] === 'approve') {
      const draft = refresh(task)
      if (task.status !== 'ready' || !task.validation
        || task.validation.taskRevision !== task.revision
        || !same(task.validation.proposal, proposal(draft))
        || task.checks.some(check => check.status !== 'match')) {
        clearApproval(task)
        task.validation = null
        task.status = task.checks.some(check => check.status === 'conflict') ? 'conflict' : 'needs_attention'
        task.error = 'The source draft needs another Kane check before approval.'
        save()
        return send(409, { error: 'Kane must verify this exact current draft before approval.' })
      }
      if (typeof merchant.registerGrant !== 'function' || typeof merchant.getOperation !== 'function') {
        return send(503, { error: 'This demo supports preview and verification. Merchant submission is not available yet.' })
      }
      const operationId = randomUUID()
      const digest = draft.proposalDigest || createHash('sha256').update(JSON.stringify(proposal(draft))).digest('hex')
      const approval = { taskRevision: task.revision, proposal: proposal(draft), proposalDigest: digest,
        operationId, attemptId: operationId, validationRunId: task.validation.reference, validated: true, at: new Date().toISOString() }
      {
        const grant = merchant.registerGrant({ taskId: task.id, operationId,
          intentRevision: task.revision, proposalDigest: digest, draftVersion: draft.revision, validationRunId: task.validation.reference })
        if (!grant || grant.status !== 'active' || !grant.grantId || grant.operationId !== operationId
          || grant.proposalDigest !== digest || grant.draftVersion !== draft.revision) {
          throw new Error('The merchant did not confirm a matching approval grant.')
        }
        approval.sourceGrant = grant
      }
      task.approval = approval
      task.operationId = operationId
      task.status = 'approved'
      event(task, 'You approved the exact merchant draft that Kane verified.', 'success')
      return send(200, { task })
    }

    if (match[2] === 'submit') {
      const draft = refresh(task)
      if (!task.approval || !['approved', 'reconciling'].includes(task.status)
        || task.approval.taskRevision !== task.revision || !same(task.approval.proposal, proposal(draft))) {
        if (!task.submissionStarted) clearApproval(task)
        task.validation = null
        task.status = 'needs_attention'
        task.error = 'The source draft changed or lacks current approval. Check it again before submitting.'
        save()
        return send(409, { error: 'Review and approve the current verified draft before submission.' })
      }
      task.submissionStarted = true
      save()
      dispatch(task, 'submit', async () => {
        const existing = readOperation(task)
        if (existing.status === 'committed') {
          reconcile(task)
          return verifyConfirmation(task)
        }
        if (existing.status !== 'absent') {
          task.status = 'reconciling'
          task.error = 'The source is still resolving this operation. No new submission was sent.'
          return
        }
        task.status = 'submitting'
        task.error = null
        task.retryReady = false
        const result = await browser(task, 'submit',
          'Assert the order number displayed below Start a return is "ORD-1042". Click Submit return request once. Verify the source displays the return request confirmation. '
          + 'Store the return request ID as "return_request_id". Capture the response body for the matching POST /merchant/api/submit as "submission_response". Do not start another return.', sourceUrl(task, true))
        if (result.finalState?.submission_response) task.submissionResponse = result.finalState.submission_response
        if (reconcile(task)) await verifyConfirmation(task)
        else if (result.status !== 'passed') task.error = result.summary || 'Submission is unresolved. Check the source before retrying.'
      })
      return send(202, { task })
    }
    return send(404, { error: 'Not found.' })
  }

  return { handle, verifyLegacyApproval }
}
