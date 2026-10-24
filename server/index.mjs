import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createServer as createViteServer } from 'vite'
import { createMerchant } from './merchant.mjs'
import { runKane, getKaneAvailability } from './kane-worker.mjs'
import { interpretRequest } from './intent.mjs'

try { process.loadEnvFile() } catch (error) {
  if (error.code !== 'ENOENT') throw error
}

const port = Number(process.env.PORT || 5173)
const baseUrl = `http://127.0.0.1:${port}`
const tasksFile = new URL('../data/tasks.json', import.meta.url)
const tasks = new Map()
try {
  for (const task of JSON.parse(readFileSync(tasksFile, 'utf8'))) tasks.set(task.id, task)
} catch { /* A fresh demo has no saved tasks. */ }

function saveTasks() {
  mkdirSync(new URL('../data/', import.meta.url), { recursive: true })
  writeFileSync(tasksFile, JSON.stringify([...tasks.values()], null, 2))
}

function event(task, text, kind = 'info') {
  task.events.push({ at: new Date().toISOString(), text, kind })
  task.updatedAt = new Date().toISOString()
  saveTasks()
}

function proposal(draft) {
  if (!draft) return null
  return {
    revision: draft.revision,
    selectedLineIds: draft.selectedLineIds,
    reason: draft.reason,
    method: draft.method,
    refundDestination: draft.refundDestination,
    currency: draft.currency,
    subtotalCents: draft.subtotalCents,
    deductionCents: draft.deductionCents,
    expectedRefundCents: draft.expectedRefundCents,
  }
}

const merchant = createMerchant({
  verifyApproval({ taskId, draft, attemptId }) {
    const task = tasks.get(taskId)
    return Boolean(task?.approval && task.approval.attemptId === attemptId
      && task.approval.taskRevision === task.revision
      && JSON.stringify(task.approval.proposal) === JSON.stringify(proposal(draft)))
  },
})

function refresh(task) {
  task.merchant = merchant.getDraft(task.id)
  const d = task.merchant
  if (!d) { task.checks = []; return }
  const selected = d.selectedLineIds || []
  task.checks = [
    { label: 'Return the red shoes', status: selected.includes('SHOE-RED-8') ? 'match' : 'conflict', detail: selected.includes('SHOE-RED-8') ? 'One pair of red shoes is selected.' : 'The shoes are not selected.' },
    { label: 'Keep the jacket', status: selected.includes('JACKET-BLACK-M') ? 'conflict' : 'match', detail: selected.includes('JACKET-BLACK-M') ? 'The jacket is selected for return.' : 'The jacket stays in the order.' },
    { label: 'Use the chosen reason', status: task.reason && d.reason === task.reason ? 'match' : 'conflict', detail: d.reason === task.reason && task.reason ? 'The merchant has your selected reason.' : 'The merchant reason needs to be set.' },
    { label: task.intent.refundDestination === 'original_payment' ? 'Refund to original payment' : 'Refund to store credit', status: d.refundDestination === task.intent.refundDestination ? 'match' : 'conflict', detail: d.refundDestination === task.intent.refundDestination ? 'The merchant refund choice matches your request.' : `The merchant currently selected ${d.refundDestination === 'store_credit' ? 'store credit' : 'original payment'}.` },
    { label: 'No printer needed', status: !task.intent.noPrinter || d.method === 'qr_dropoff' ? 'match' : 'conflict', detail: task.intent.noPrinter ? (d.method === 'qr_dropoff' ? 'QR drop-off is selected.' : 'The current method needs a printer.') : 'Not requested.' },
  ]
  saveTasks()
}

function publicTask(task) {
  return structuredClone(task)
}

function send(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(body))
}

async function readJson(req) {
  let body = ''
  for await (const chunk of req) {
    body += chunk
    if (body.length > 32_000) throw new Error('Request is too large.')
  }
  return body ? JSON.parse(body) : {}
}

function merchantUrl(task, attemptId) {
  const url = new URL('/merchant', baseUrl)
  url.searchParams.set('taskId', task.id)
  if (attemptId) url.searchParams.set('attemptId', attemptId)
  return url.href
}

function recordKane(task, phase, result) {
  task.evidence.push({
    phase,
    status: result.status,
    summary: result.summary || '',
    path: result.evidencePath || undefined,
    runId: result.runId || undefined,
    url: result.testUrl || undefined,
    finalState: result.finalState || {},
    at: new Date().toISOString(),
  })
  saveTasks()
}

const active = new Set()
function work(task, phase, objective, onPass, attemptId) {
  if (active.has(task.id)) return false
  active.add(task.id)
  task.status = phase === 'submit' ? 'submitting' : 'working'
  task.error = null
  event(task, `Kane is ${phase === 'discover' ? 'reading the merchant order' : phase === 'submit' ? 'submitting the approved return' : 'checking the merchant form'}.`, 'progress')
  const startedRevision = task.revision
  const url = merchantUrl(task, attemptId)
  void (async () => {
    try {
      const result = await runKane({ phase, objective: `Go to ${url}. ${objective}`, url })
      recordKane(task, phase, result)
      if (task.revision !== startedRevision) {
        event(task, 'An older browser result finished after the task changed. It was kept as history only.', 'warning')
        return
      }
      refresh(task)
      if (result.status !== 'passed') {
        task.status = phase === 'submit' ? 'reconciling' : 'needs_attention'
        task.error = result.summary || 'Kane could not verify this step.'
        if (phase === 'submit') reconcile(task, attemptId)
        event(task, task.error, 'error')
        return
      }
      await onPass(task, result)
      saveTasks()
    } catch (error) {
      task.status = phase === 'submit' ? 'reconciling' : 'needs_attention'
      task.error = error.message
      if (phase === 'submit') reconcile(task, attemptId)
      event(task, `Browser check stopped: ${error.message}`, 'error')
    } finally {
      active.delete(task.id)
    }
  })()
  return true
}

function reconcile(task, attemptId) {
  const found = merchant.getReturnByAttempt(attemptId)
  if (!found) return
  const expected = task.approval?.proposal
  const actual = proposal(found)
  if (!expected || JSON.stringify(actual) !== JSON.stringify(expected)) {
    task.status = 'needs_attention'
    task.error = 'A return exists, but its terms need review.'
    return
  }
  task.sourceReturn = found
  task.status = 'submitted_unverified'
  task.error = 'The merchant saved the return. A fresh Kane confirmation check is still required.'
  event(task, `Merchant record ${found.id || found.returnId} exists. Final browser verification is pending.`, 'warning')
}

function startDiscovery(task) {
  return work(task, 'discover',
    'Verify order ORD-1042 shows red shoes size 8 and a jacket. Store the order ID as "order_id". Do not change or submit the order.',
    async (current) => {
      current.status = 'needs_reason'
      event(current, 'Kane found the order. Choose the return reason to prepare the draft.', 'success')
    })
}

function startPreparation(task) {
  const reason = task.reason || 'too_small'
  return work(task, 'prepare',
    `Select only the red shoes size 8 for return. Choose return reason "${reason}". Choose the print label return method and original payment refund destination. Save the draft. Verify the saved draft selects only the shoes and original payment. Do not submit the return.`,
    async (current) => {
      if (current.checks.some(c => c.status === 'conflict')) {
        current.status = 'conflict'
        event(current, 'The merchant draft differs from your request. Review the conflict.', 'warning')
      } else {
        current.status = 'ready'
        event(current, 'Kane prepared the draft and checked your choices.', 'success')
      }
    })
}

function startNoPrinter(task) {
  return work(task, 'change-method',
    'On the current draft, choose the QR drop-off method that does not need a printer. Save the draft. Verify QR drop-off is selected, and store the currently selected refund destination as "refund_destination". Do not correct the refund destination or submit yet.',
    async (current) => {
      current.status = current.checks.some(c => c.status === 'conflict') ? 'conflict' : 'ready'
      event(current, current.status === 'conflict'
        ? 'Changing the method changed the merchant refund choice. Your original-payment request is still preserved.'
        : 'Kane checked the printer-free method.', current.status === 'conflict' ? 'warning' : 'success')
    })
}

function startCorrection(task) {
  return work(task, 'correct',
    'The merchant currently selected store credit, but the user asked for original payment. Select original payment on the saved draft, save it, and verify the red shoes only, QR drop-off, original payment, and the displayed deduction. Do not submit.',
    async (current) => {
      current.status = current.checks.some(c => c.status === 'conflict') ? 'conflict' : 'ready'
      event(current, current.status === 'ready'
        ? 'Kane corrected the refund destination and verified the source draft again.'
        : 'The source draft still conflicts with your request.', current.status === 'ready' ? 'success' : 'warning')
    })
}

async function handleApi(req, res, url) {
  if (url.pathname === '/api/status' && req.method === 'GET') {
    return send(res, 200, { product: 'Raising Kane', kane: getKaneAvailability() })
  }
  if (url.pathname === '/api/tasks' && req.method === 'POST') {
    const { request } = await readJson(req)
    if (typeof request !== 'string' || !request.trim()) return send(res, 400, { error: 'Describe what you want to return.' })
    const interpreted = await interpretRequest(request)
    if (interpreted.unsupported || interpreted.ambiguous || !interpreted.item || !interpreted.refundDestination) {
      return send(res, 400, { error: interpreted.issues.join(' ') || 'This demo supports returning the red shoes while keeping the jacket.' })
    }
    const task = {
      id: randomUUID(), status: 'created', request: request.trim(), revision: 1,
      intent: { item: 'Red shoes, size 8', exclude: 'Jacket', refundDestination: interpreted.refundDestination, noPrinter: interpreted.noPrinter },
      interpretation: { source: interpreted.source, fallbackReason: interpreted.fallbackReason },
      reason: null, merchant: null, checks: [], events: [], evidence: [], approval: null, receipt: null, error: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    tasks.set(task.id, task)
    event(task, 'Task created. Your return choices are saved.', 'info')
    startDiscovery(task)
    return send(res, 201, { task: publicTask(task) })
  }
  const match = url.pathname.match(/^\/api\/tasks\/([^/]+)(?:\/(choice|check|approve|submit))?$/)
  if (!match) return send(res, 404, { error: 'Not found.' })
  const task = tasks.get(match[1])
  if (!task) return send(res, 404, { error: 'Task not found.' })
  if (!match[2] && req.method === 'GET') return send(res, 200, { task: publicTask(task) })
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed.' })
  if (active.has(task.id)) return send(res, 409, { error: 'Kane is still working on this task.' })
  if (match[2] === 'choice') {
    const choice = await readJson(req)
    if (choice.reason) {
      if (!['too_small', 'changed_mind', 'damaged'].includes(choice.reason)) return send(res, 400, { error: 'Unsupported return reason.' })
      task.reason = choice.reason
      task.revision++
      task.approval = null
      event(task, 'Return reason selected. Earlier approval, if any, is cleared.', 'info')
      startPreparation(task)
    } else if (choice.noPrinter || choice.method === 'qr' || choice.method === 'qr_dropoff') {
      if (!task.reason) return send(res, 409, { error: 'Choose a return reason first.' })
      task.intent.noPrinter = true
      task.revision++
      task.approval = null
      event(task, 'No printer requirement added. Other choices remain saved.', 'info')
      startNoPrinter(task)
    } else return send(res, 400, { error: 'Choose a reason or request a printer-free return.' })
    return send(res, 202, { task: publicTask(task) })
  }
  if (match[2] === 'check') {
    if (task.status === 'needs_attention' && !task.reason) startDiscovery(task)
    else if (task.status === 'conflict') startCorrection(task)
    else if (task.reason) startPreparation(task)
    else return send(res, 409, { error: 'Choose a return reason first.' })
    return send(res, 202, { task: publicTask(task) })
  }
  if (match[2] === 'approve') {
    refresh(task)
    if (task.status !== 'ready' || task.checks.some(c => c.status !== 'match')) {
      return send(res, 409, { error: 'The current merchant draft must match your choices before approval.' })
    }
    task.approval = { taskRevision: task.revision, proposal: proposal(task.merchant), attemptId: randomUUID(), at: new Date().toISOString() }
    task.status = 'approved'
    event(task, 'You approved this exact merchant draft.', 'success')
    return send(res, 200, { task: publicTask(task) })
  }
  if (match[2] === 'submit') {
    refresh(task)
    if (task.status !== 'approved' || !task.approval || task.approval.taskRevision !== task.revision
      || JSON.stringify(task.approval.proposal) !== JSON.stringify(proposal(task.merchant))) {
      task.approval = null
      task.status = 'ready'
      saveTasks()
      return send(res, 409, { error: 'The merchant draft changed. Review and approve it again.' })
    }
    const attemptId = task.approval.attemptId
    work(task, 'submit',
      'On the merchant review page, submit the approved return request once. Verify that a confirmation with a return request ID appears. Store the return request ID as "return_request_id".',
      async (current) => {
        reconcile(current, attemptId)
        if (!current.sourceReturn) {
          current.status = 'reconciling'
          current.error = 'Kane reported a result, but the source return record was not confirmed.'
          event(current, current.error, 'warning')
        }
      }, attemptId)
    return send(res, 202, { task: publicTask(task) })
  }
  return send(res, 404, { error: 'Not found.' })
}

const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' })
const server = createServer(async (req, res) => {
  const url = new URL(req.url, baseUrl)
  try {
    if (url.pathname.startsWith('/merchant')) return await merchant.handle(req, res, url)
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url)
    return vite.middlewares(req, res)
  } catch (error) {
    if (!res.headersSent) send(res, 500, { error: error.message || 'Unexpected error.' })
    else res.end()
  }
})
server.listen(port, '127.0.0.1', () => console.log(`Raising Kane at ${baseUrl}`))
