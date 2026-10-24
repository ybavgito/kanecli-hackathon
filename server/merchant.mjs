import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import QRCode from 'qrcode'
import { proposalDigest } from './merchant-contract.mjs'

const STORE_PATH = resolve(process.env.RAISING_KANE_DATA_DIR || 'data', 'merchant.json')
const SHOE = 'SHOE-RED-8'
const JACKET = 'JACKET-BLACK-M'

const catalog = [
  { id: SHOE, name: 'Red running shoes', variant: 'Size 8', quantity: 1, priceCents: 8000 },
  { id: JACKET, name: 'Black jacket', variant: 'Medium', quantity: 1, priceCents: 12000 },
]
const reasons = [
  { value: 'too_small', label: 'Size or fit issue' },
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'damaged', label: 'Arrived damaged' },
]
const methods = [
  {
    value: 'print_label',
    label: 'Print a shipping label',
    detail: 'Print and attach the label, then drop off the parcel.',
  },
  {
    value: 'qr_dropoff',
    label: 'Printer-free QR drop-off',
    detail: 'Show a QR code at the drop-off counter. A $5 fee applies.',
  },
]
const destinations = [
  { value: 'store_credit', label: 'Store credit' },
  { value: 'original_payment', label: 'Original payment method' },
]

function loadStore() {
  try {
    const store = JSON.parse(readFileSync(STORE_PATH, 'utf8'))
    if (store && typeof store === 'object' && store.tasks && store.returns)
      return { ...store, grants: store.grants || {} }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  return { nextReturnNumber: 1001, tasks: {}, returns: {}, grants: {} }
}

function saveStore(store) {
  mkdirSync(dirname(STORE_PATH), { recursive: true })
  const temp = `${STORE_PATH}.${process.pid}.tmp`
  writeFileSync(temp, `${JSON.stringify(store, null, 2)}\n`, { mode: 0o600 })
  renameSync(temp, STORE_PATH)
}

function validTaskId(taskId) {
  return typeof taskId === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(taskId)
}

function validAttemptId(attemptId) {
  return typeof attemptId === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(attemptId)
}

function newDraft(taskId) {
  return {
    taskId,
    accountId: 'DEMO-ACCOUNT-1',
    orderId: 'ORD-1042',
    revision: 1,
    selectedLineIds: [SHOE, JACKET],
    reason: null,
    method: 'print_label',
    refundDestination: 'store_credit',
  }
}

function publicDraft(draft) {
  const selectedLines = catalog.filter((line) => draft.selectedLineIds.includes(line.id))
  const subtotalCents = selectedLines.reduce(
    (sum, line) => sum + line.priceCents * line.quantity,
    0,
  )
  const deductionCents = draft.method === 'qr_dropoff' && selectedLines.length ? 500 : 0
  return {
    ...draft,
    kind: 'return',
    source: 'Merchant sandbox — simulated order',
    currency: 'USD',
    lines: catalog,
    selectedLines,
    reasons,
    methods,
    destinations,
    subtotalCents,
    deductionCents,
    expectedRefundCents: Math.max(0, subtotalCents - deductionCents),
    nextStep:
      draft.method === 'qr_dropoff'
        ? 'Show the synthetic QR code at a simulated drop-off counter.'
        : 'Print the synthetic label and attach it to the parcel.',
  }
}

function readJson(req, maxBytes = 16_384) {
  return new Promise((resolveBody, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > maxBytes) {
        reject(new Error('Request body is too large'))
        req.destroy()
      }
    })
    req.on('end', () => {
      try {
        resolveBody(JSON.parse(body || '{}'))
      } catch {
        reject(new Error('Invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

function json(res, status, value) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(JSON.stringify(value))
  return true
}

function html(res, value) {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Security-Policy':
      "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'",
  })
  res.end(value)
  return true
}

function bad(res, message, status = 400) {
  return json(res, status, { error: message })
}

function applyPatch(draft, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch))
    throw new Error('Patch must be an object')
  const keys = Object.keys(patch)
  const allowed = ['selectedLineIds', 'reason', 'method', 'refundDestination']
  if (!keys.length || keys.some((key) => !allowed.includes(key)))
    throw new Error('Unsupported draft field')
  const next = { ...draft, selectedLineIds: [...draft.selectedLineIds] }
  if (Object.hasOwn(patch, 'selectedLineIds')) {
    const ids = patch.selectedLineIds
    if (
      !Array.isArray(ids) ||
      ids.length > catalog.length ||
      new Set(ids).size !== ids.length ||
      ids.some((id) => !catalog.some((line) => line.id === id))
    ) {
      throw new Error('Invalid order line selection')
    }
    next.selectedLineIds = ids
  }
  if (Object.hasOwn(patch, 'reason')) {
    if (patch.reason !== null && !reasons.some((reason) => reason.value === patch.reason))
      throw new Error('Invalid return reason')
    next.reason = patch.reason
  }
  if (Object.hasOwn(patch, 'method')) {
    if (!methods.some((method) => method.value === patch.method))
      throw new Error('Invalid return method')
    next.method = patch.method
  }
  if (Object.hasOwn(patch, 'refundDestination')) {
    if (!destinations.some((destination) => destination.value === patch.refundDestination))
      throw new Error('Invalid refund destination')
    next.refundDestination = patch.refundDestination
  }
  // This deliberate source behavior is the core demo conflict. It happens even if
  // the caller included a destination in the same update.
  if (next.method !== draft.method) next.refundDestination = 'store_credit'
  const changed = allowed.some((key) => JSON.stringify(next[key]) !== JSON.stringify(draft[key]))
  if (changed) next.revision = draft.revision + 1
  return next
}

function merchantPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Returns | Merchant sandbox</title>
  <style>
    :root{font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#1c2640;background:#f2f5fa}*{box-sizing:border-box}body{margin:0}button,input,select{font:inherit}button{cursor:pointer}header{background:#12304f;color:white;padding:18px max(5vw,20px);display:flex;justify-content:space-between;align-items:center;gap:20px}header strong{font-size:20px;letter-spacing:.02em}header span{font-size:13px;color:#c6d9ea}main{max-width:1040px;margin:36px auto;padding:0 20px 70px}h1{font-size:36px;margin:0 0 8px}p{line-height:1.5}.note{color:#627187;margin:0 0 26px}.grid{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(270px,.8fr);gap:22px}.card{background:#fff;border:1px solid #dce4ee;border-radius:14px;padding:25px;box-shadow:0 5px 30px #18314f0b}.card+.card{margin-top:20px}.card h2{font-size:19px;margin:0 0 15px}.step{color:#1478a5;text-transform:uppercase;letter-spacing:.13em;font-size:11px;font-weight:800}.item{display:flex;gap:14px;padding:15px 0;border-top:1px solid #ecf0f5}.item:first-of-type{border-top:0}.item input{margin-top:6px;accent-color:#1478a5}.item strong{display:block}.item small{color:#65748c}.price{margin-left:auto;font-weight:700}.field{display:block;margin:17px 0;font-weight:600}.field select{display:block;width:100%;padding:12px;margin-top:7px;border:1px solid #bbc9d8;border-radius:8px;background:white;color:#1c2640}.hint{margin:-6px 0 12px;color:#65748c;font-size:13px}.summary{position:sticky;top:20px}.row{display:flex;justify-content:space-between;gap:16px;margin:12px 0}.row.total{border-top:1px solid #dce4ee;padding-top:14px;font-weight:800;font-size:20px}.pill{display:inline-block;background:#e7f5f7;color:#146f81;border-radius:99px;padding:6px 10px;font-size:12px;font-weight:700}.alert{color:#8d4b0f;background:#fff4e9;padding:12px;border-radius:8px;font-size:13px}.primary{width:100%;border:0;border-radius:9px;background:#157fa8;color:white;padding:13px 16px;font-weight:700;margin-top:14px}.primary:disabled{opacity:.6;cursor:wait}.secondary{border:1px solid #9db2c8;border-radius:9px;background:white;color:#12304f;padding:10px 14px;font-weight:700}.error{color:#a32733;background:#fff1f2;border-radius:8px;padding:12px}.success{color:#196247;background:#eaf8f0;border-radius:8px;padding:12px}#message:empty{display:none}#receipt{display:none}#receipt.show{display:block}footer{color:#79869a;font-size:12px;margin-top:25px}@media(max-width:760px){.grid{grid-template-columns:1fr}.summary{position:static}}
  </style>
</head>
<body>
  <header><strong>Northstar Outfitters</strong><span>Merchant sandbox — simulated order</span></header>
  <main>
    <h1>Start a return</h1>
    <p class="note">Order <strong>ORD-1042</strong> · This is a fictional merchant portal with synthetic data.</p>
    <div class="grid">
      <div>
        <section class="card"><span class="step">Step 1 of 3</span><h2>Choose items to return</h2><div id="items"></div></section>
        <section class="card"><span class="step">Step 2 of 3</span><h2>Tell us how to handle it</h2>
          <label class="field">Reason for return<select id="reason"><option value="">Choose a reason</option></select></label>
          <label class="field">Return method<select id="method"></select></label><p id="method-detail" class="hint"></p>
          <label class="field">Refund destination<select id="destination"></select></label>
          <p class="hint">Changing the return method may change the refund destination. Review it before submitting.</p>
        </section>
      </div>
      <aside>
        <section class="card summary"><span class="step">Step 3 of 3</span><h2>Review your return</h2>
          <span class="pill" id="revision">Draft</span><div id="selected-summary"></div>
          <div class="row"><span>Items</span><strong id="subtotal">$0.00</strong></div>
          <div class="row"><span>Drop-off deduction</span><strong id="deduction">$0.00</strong></div>
          <div class="row total"><span>Expected refund</span><span id="total">$0.00</span></div>
          <p id="next-step" class="alert"></p><p class="hint">Account ID: DEMO-ACCOUNT-1 · Currency: USD</p><p class="hint" id="line-identity"></p><p class="hint" id="quantity"></p><div id="message" role="status" aria-live="polite"></div>
          <button id="submit" class="primary" type="button">Submit return request</button>
        </section>
        <section id="receipt" class="card"><span class="pill">Request created</span><h2>Return requested; refund pending</h2><p id="receipt-content"></p></section>
      </aside>
    </div>
    <footer>Merchant sandbox — simulated order. No real purchase, shipment, QR code, or refund is created.</footer>
  </main>
  <script>
    const params = new URLSearchParams(location.search);
    const taskId = params.get('taskId') || 'demo';
    const attemptId = params.get('operationId') || params.get('attemptId') || '';
    const digest = params.get('proposalDigest') || '';
    const readOnly = params.get('view') === 'readonly';
    let state;
    const $ = id => document.getElementById(id);
    const money = cents => '$' + (cents / 100).toFixed(2);
    const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    const setMessage = (message, kind='error') => { $('message').className = kind; $('message').textContent = message; };
    async function request(path, options) {
      const response = await fetch(path, options);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'The merchant could not process this request.');
      return data;
    }
    function render(draft) {
      state = draft;
      $('revision').textContent = 'Draft revision ' + draft.revision;
      $('items').innerHTML = draft.lines.map(line => '<label class="item"><input type="checkbox" data-line="'+escape(line.id)+'" '+(draft.selectedLineIds.includes(line.id)?'checked':'')+' /><span><strong>'+escape(line.name)+'</strong><small>'+escape(line.variant)+' · Qty '+line.quantity+'</small></span><span class="price">'+money(line.priceCents)+'</span></label>').join('');
      for (const input of document.querySelectorAll('[data-line]')) input.addEventListener('change', () => update({selectedLineIds:[...document.querySelectorAll('[data-line]:checked')].map(el=>el.dataset.line)}));
      $('reason').innerHTML = '<option value="">Choose a reason</option>' + draft.reasons.map(reason=>'<option value="'+escape(reason.value)+'">'+escape(reason.label)+'</option>').join('');
      $('reason').value = draft.reason || '';
      $('method').innerHTML = draft.methods.map(method=>'<option value="'+escape(method.value)+'">'+escape(method.label)+'</option>').join('');
      $('method').value = draft.method;
      $('method-detail').textContent = draft.methods.find(method=>method.value===draft.method)?.detail || '';
      $('destination').innerHTML = draft.destinations.map(destination=>'<option value="'+escape(destination.value)+'">'+escape(destination.label)+'</option>').join('');
      $('destination').value = draft.refundDestination;
      $('selected-summary').textContent = draft.selectedLines.length ? draft.selectedLines.map(line=>line.name+' ('+line.variant+')').join(', ') : 'No items selected';
      $('subtotal').textContent=money(draft.subtotalCents);
      $('deduction').textContent='−'+money(draft.deductionCents);
      $('total').textContent=money(draft.expectedRefundCents);
      $('next-step').textContent=draft.nextStep;
      $('line-identity').textContent='Selected line IDs: '+draft.selectedLineIds.join(', ');
      $('quantity').textContent='Selected quantity: '+draft.selectedLines.reduce((n,l)=>n+l.quantity,0);
      if(readOnly) { document.querySelectorAll('input,select,button').forEach(el=>el.disabled=true); $('submit').hidden=true; }
    }
    async function update(patch) {
      if (readOnly) return;
      $('submit').disabled = true;
      setMessage('Saving your draft…','success');
      try {
        const data = await request('/merchant/api/draft',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({taskId,patch,expectedRevision:state.revision})});
        render(data.draft);
        setMessage('Draft saved. Review all choices before submitting.','success');
      } catch(error) { setMessage(error.message); }
      finally { $('submit').disabled = false; }
    }
    $('reason').addEventListener('change',event=>update({reason:event.target.value || null}));
    $('method').addEventListener('change',event=>update({method:event.target.value}));
    $('destination').addEventListener('change',event=>update({refundDestination:event.target.value}));
    $('submit').addEventListener('click',async()=>{
      if(readOnly) return;
      if (!attemptId) return setMessage('Return to Raising Kane to approve this exact draft first.');
      $('submit').disabled=true;
      setMessage('Submitting the approved return…','success');
      try {
        const data=await request('/merchant/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({taskId,operationId:attemptId,proposalDigest:digest})});
        location.href='/merchant/returns/'+encodeURIComponent(data.return.requestId);
        $('receipt').classList.add('show');
        $('receipt-content').textContent='Request '+data.return.requestId+' for '+data.return.lines.map(line=>line.name).join(', ')+'. Expected refund '+money(data.return.expectedRefundCents)+' to '+(data.return.refundDestination==='original_payment'?'original payment method':'store credit')+'. '+data.return.nextStep;
        setMessage('Return request saved by the merchant.','success');
      } catch(error) { setMessage(error.message); }
      finally { $('submit').disabled=false; }
    });
    request('/merchant/api/state?taskId='+encodeURIComponent(taskId)).then(data=>render(data.draft)).catch(error=>setMessage(error.message));
  </script>
</body>
</html>`
}

export function createMerchant({ verifyApproval = () => false } = {}) {
  if (typeof verifyApproval !== 'function') throw new TypeError('verifyApproval must be a function')

  function ensureDraft(store, taskId) {
    if (!validTaskId(taskId)) throw new Error('Invalid task ID')
    if (!store.tasks[taskId]) {
      store.tasks[taskId] = newDraft(taskId)
      saveStore(store)
    }
    return store.tasks[taskId]
  }

  function getDraft(taskId) {
    const store = loadStore()
    const draft = publicDraft(ensureDraft(store, taskId))
    return { ...draft, proposalDigest: proposalDigest(draft) }
  }

  function getReturnByAttempt(attemptId) {
    if (!validAttemptId(attemptId)) return null
    return loadStore().returns[attemptId] || null
  }

  function listReturns(taskId) {
    if (!validTaskId(taskId)) return []
    return Object.values(loadStore().returns).filter((record) => record.taskId === taskId)
  }

  function resetTask(taskId) {
    if (!validTaskId(taskId)) throw new Error('Invalid task ID')
    const store = loadStore()
    delete store.tasks[taskId]
    for (const [attemptId, record] of Object.entries(store.returns)) {
      if (record.taskId === taskId) delete store.returns[attemptId]
    }
    saveStore(store)
    return getDraft(taskId)
  }

  function registerGrant(input) {
    const store = loadStore()
    const draft = publicDraft(ensureDraft(store, input.taskId))
    if (
      !validAttemptId(input.operationId) ||
      !Number.isInteger(input.intentRevision) ||
      !input.validationRunId ||
      input.draftVersion !== draft.revision ||
      input.proposalDigest !== proposalDigest(draft)
    )
      throw new Error('Approval no longer matches the current draft.')
    if (store.returns[input.operationId] || store.grants[input.operationId])
      throw new Error('Operation already exists.')
    const grant = { ...input, grantId: randomUUID(), status: 'active' }
    store.grants[input.operationId] = grant
    saveStore(store)
    return { ...grant }
  }
  function revokeGrant(id) {
    const store = loadStore()
    if (store.grants[id]?.status === 'active') {
      store.grants[id].status = 'revoked'
      saveStore(store)
    }
  }
  function getOperation(id) {
    const record = getReturnByAttempt(id)
    return record
      ? {
          status: 'committed',
          operationId: id,
          proposalDigest: record.proposalDigest,
          requestId: record.requestId,
          return: record,
        }
      : { status: 'absent' }
  }

  async function handle(req, res, url) {
    const confirmation = url.pathname.match(/^\/merchant\/returns\/([^/]+)(\/qr)?$/)
    if (req.method === 'GET' && confirmation) {
      const record = Object.values(loadStore().returns).find(
        (item) => item.requestId === confirmation[1],
      )
      if (!record) return bad(res, 'Return not found', 404)
      if (confirmation[2]) {
        if (record.method !== 'qr_dropoff') return bad(res, 'This return uses a printed label', 404)
        const svg = await QRCode.toString('DEMO ONLY: ' + record.requestId, {
          type: 'svg',
          width: 220,
          margin: 2,
        })
        return html(res, confirmationPage(record, true, svg))
      }
      return html(res, confirmationPage(record))
    }
    const operation = url.pathname.match(/^\/merchant\/api\/operations\/([^/]+)$/)
    if (req.method === 'GET' && operation) return json(res, 200, getOperation(operation[1]))
    if (req.method === 'GET' && url.pathname === '/merchant') return html(res, merchantPage())
    if (req.method === 'GET' && url.pathname === '/merchant/api/state') {
      const taskId = url.searchParams.get('taskId') || 'demo'
      try {
        return json(res, 200, { draft: getDraft(taskId), returns: listReturns(taskId) })
      } catch (error) {
        return bad(res, error.message)
      }
    }
    if (req.method === 'POST' && url.pathname === '/merchant/api/draft') {
      try {
        const { taskId, patch, expectedRevision } = await readJson(req)
        if (!validTaskId(taskId)) return bad(res, 'Invalid task ID')
        const store = loadStore()
        const draft = ensureDraft(store, taskId)
        if (Object.values(store.returns).some((record) => record.taskId === taskId))
          return bad(res, 'This return has already been submitted', 409)
        if (expectedRevision !== draft.revision)
          return bad(res, 'The draft changed. Reload before editing.', 409)
        const next = applyPatch(draft, patch)
        if (next.revision !== draft.revision)
          for (const grant of Object.values(store.grants)) {
            if (grant.taskId === taskId && grant.status === 'active') grant.status = 'revoked'
          }
        store.tasks[taskId] = next
        saveStore(store)
        return json(res, 200, { draft: publicDraft(next) })
      } catch (error) {
        return bad(res, error.message)
      }
    }
    if (req.method === 'POST' && url.pathname === '/merchant/api/submit') {
      try {
        const input = await readJson(req)
        const { taskId } = input
        const attemptId = input.operationId || input.attemptId
        const digest = input.proposalDigest
        if (!validTaskId(taskId) || !validAttemptId(attemptId))
          return bad(res, 'Invalid submission identity')
        const store = loadStore()
        const existing = store.returns[attemptId]
        if (existing)
          return existing.taskId === taskId && existing.proposalDigest === digest
            ? json(res, 200, { return: existing, idempotentReplay: true })
            : bad(res, 'Operation identity or approved terms do not match', 409)
        if (Object.values(store.returns).some((record) => record.taskId === taskId))
          return bad(res, 'This return has already been submitted', 409)
        const draft = publicDraft(ensureDraft(store, taskId))
        if (!draft.selectedLines.length || !draft.reason)
          return bad(res, 'Select an item and a return reason', 422)
        const grant = store.grants[attemptId]
        if (
          !grant ||
          grant.status !== 'active' ||
          grant.taskId !== taskId ||
          grant.draftVersion !== draft.revision ||
          grant.proposalDigest !== digest ||
          proposalDigest(draft) !== digest
        )
          return bad(res, 'This exact current draft has no active approval.', 409)
        const requestId = `RET-${store.nextReturnNumber++}`
        const record = {
          id: requestId,
          returnId: requestId,
          requestId,
          attemptId,
          operationId: attemptId,
          proposalDigest: digest,
          taskId,
          accountId: draft.accountId,
          orderId: draft.orderId,
          draftRevision: draft.revision,
          revision: draft.revision,
          lineIds: [...draft.selectedLineIds],
          selectedLineIds: [...draft.selectedLineIds],
          lines: draft.selectedLines,
          reason: draft.reason,
          method: draft.method,
          refundDestination: draft.refundDestination,
          currency: draft.currency,
          subtotalCents: draft.subtotalCents,
          deductionCents: draft.deductionCents,
          expectedRefundCents: draft.expectedRefundCents,
          nextStep: draft.nextStep,
          status: 'return_requested_refund_pending',
          createdAt: new Date().toISOString(),
        }
        grant.status = 'consumed'
        store.returns[attemptId] = record
        saveStore(store)
        return json(res, 201, { return: record, idempotentReplay: false })
      } catch (error) {
        return bad(res, error.message)
      }
    }
    return false
  }

  return {
    handle,
    getDraft,
    getReturnByAttempt,
    listReturns,
    resetTask,
    registerGrant,
    revokeGrant,
    getOperation,
  }
}

function confirmationPage(record, qr = false, qrSvg = '') {
  const escape = (value) =>
    String(value ?? '').replace(
      /[&<>"']/g,
      (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch],
    )
  const field = (label, value) =>
    `<div class="field"><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Return ${escape(record.requestId)} | Northstar</title>
  <style>body{font:17px/1.6 system-ui;background:#f2f5fa;color:#18314f;margin:0}header{background:#12304f;color:white;padding:22px 8%}main{max-width:760px;margin:42px auto;background:white;padding:36px;border-radius:14px}h1{line-height:1.15}.field{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #dce4ee;padding:12px 0}dd{margin:0;font-weight:600}.artifact{padding:32px;background:#edf3f7;font:24px monospace}a{color:#096689}@media(max-width:600px){main{margin:16px;padding:20px}.field{grid-template-columns:1fr}}</style>
  <header>Northstar Outfitters · Merchant sandbox</header><main><p>Persistent source confirmation</p><h1>${qr ? 'Synthetic QR drop-off artifact' : 'Return requested; refund pending'}</h1><p>This is a simulated return. No shipment or refund is created.</p>
  ${qr ? `<div class="artifact">${qrSvg}<br>DEMO ONLY · ${escape(record.requestId)}</div><p>This QR encodes a demo reference only. It is not a shipping entitlement.</p><a href="/merchant/returns/${escape(record.requestId)}">Back to confirmation</a>` : ''}
  <dl>${field('Return request ID', record.requestId)}${field('Order ID', record.orderId)}${field('Account ID', record.accountId)}${field('Returned line IDs', record.selectedLineIds.join(', '))}${field('Returned item', 'Red running shoes, Size 8')}${field('Returned quantity', 1)}${field('Jacket kept', 'Yes')}${field('Reason', record.reason)}${field('Subtotal', (record.subtotalCents / 100).toFixed(2))}${field('Return method', record.method)}${field('Refund destination', record.refundDestination)}${field('Currency', record.currency)}${field('Deduction', (record.deductionCents / 100).toFixed(2))}${field('Expected refund', (record.expectedRefundCents / 100).toFixed(2))}${field('Status', 'return_requested_refund_pending')}${field('Next step', record.nextStep)}</dl>
  ${record.method === 'qr_dropoff' && !qr ? `<a href="/merchant/returns/${escape(record.requestId)}/qr">Open synthetic QR artifact</a>` : ''}</main></html>`
}
