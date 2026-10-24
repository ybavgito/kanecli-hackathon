import { mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { randomUUID } from 'node:crypto'
import { proposalDigest } from './merchant-contract.mjs'

const file = resolve(process.env.RAISING_KANE_DATA_DIR || 'data', 'appointments.json')
const valid = (value) => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value)
const original = {
  startsAt: '2026-10-30T14:00:00-07:00',
  technician: 'Maya Chen',
  service: 'Washer repair',
  address: '42 Linden Street, San Francisco',
  timezone: 'America/Los_Angeles',
  version: 1,
}
const slots = [
  {
    id: 'sat-0900',
    label: 'Saturday, October 31 · 9:00 AM',
    startsAt: '2026-10-31T09:00:00-07:00',
    technician: 'Luis Rivera',
    feeCents: 0,
    available: true,
  },
  {
    id: 'sat-1000',
    label: 'Saturday, October 31 · 10:00 AM',
    startsAt: '2026-10-31T10:00:00-07:00',
    technician: 'Maya Chen',
    feeCents: 2500,
    available: true,
  },
  {
    id: 'sat-1100',
    label: 'Saturday, October 31 · 11:00 AM',
    startsAt: '2026-10-31T11:00:00-07:00',
    technician: 'Maya Chen',
    feeCents: 0,
    available: true,
  },
]
function load() {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch (e) {
    if (e.code !== 'ENOENT') throw e
    return { tasks: {}, grants: {}, operations: {}, next: 1001 }
  }
}
function save(store) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file + '.tmp', JSON.stringify(store, null, 2), { mode: 0o600 })
  renameSync(file + '.tmp', file)
}
function ensure(store, id) {
  if (!valid(id)) throw new Error('Invalid task identity')
  if (!store.tasks[id]) {
    store.tasks[id] = {
      taskId: id,
      revision: 1,
      bookingId: 'BOOK-2048',
      accountId: 'SERVICE-ACCOUNT-1',
      originalBooking: { ...original },
      currentBooking: { ...original },
      slots: structuredClone(slots),
      slotId: null,
    }
    save(store)
  }
  return store.tasks[id]
}
function publicDraft(draft) {
  const slot = draft.slots.find((item) => item.id === draft.slotId)
  const value = {
    ...draft,
    kind: 'appointment',
    startsAt: slot?.startsAt ?? null,
    technician: slot?.technician ?? null,
    feeCents: slot?.feeCents ?? null,
    currency: 'USD',
    timezone: original.timezone,
    service: original.service,
    address: original.address,
    bookingVersion: draft.currentBooking.version,
    nextStep: 'Be home for your confirmed service window.',
  }
  return { ...value, proposalDigest: proposalDigest(value) }
}
const escape = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch],
  )
const field = (key, value) =>
  `<div class="row"><dt>${escape(key)}</dt><dd>${escape(value)}</dd></div>`
function shell(title, body, script = '') {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} | Linden Home</title><style>body{font:16px/1.6 system-ui;background:#f5f3ef;color:#2f342b;margin:0}header{padding:22px 7%;border-bottom:1px solid #d9d7cf;background:white}header strong{font-size:24px}main{max-width:900px;margin:36px auto;padding:0 24px 60px}h1{font-size:36px;letter-spacing:-1px;line-height:1.15}h2{font-size:20px}.panel{padding:24px;background:white;border:1px solid #dddcd2;border-radius:8px;margin:20px 0}.row{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:10px 0;border-bottom:1px solid #e6e4dc}dd{margin:0;font-weight:600}.slot{display:block;padding:18px;margin:12px 0;background:#f7f7f1;border:1px solid #d9ddcb;border-radius:6px}.slot input{margin-right:12px}button{font:inherit;padding:12px 20px;border:0;border-radius:5px;background:#455b37;color:white;cursor:pointer}button:disabled{opacity:.5}#message{min-height:26px;color:#8b411d}small{color:#606654}a{color:#455b37}.meta{font:13px monospace}select{font:inherit;padding:10px}summary{cursor:pointer}@media(max-width:600px){.row{grid-template-columns:1fr}main{padding:0 16px}}</style><header><strong>Linden Home</strong> &nbsp; Service portal · simulated booking</header><main>${body}</main>${script ? `<script>${script}</script>` : ''}</html>`
}
function page() {
  return shell(
    'Change your appointment',
    `<p>My home / Service visits / Change appointment</p><h1>A better time for your repair.</h1><p>Your existing appointment stays booked until you confirm a replacement.</p><section class="panel"><h2>Your current booking</h2><dl id="current"></dl></section><section class="panel"><h2>Saturday availability</h2><p>Choose a time. Review technician and additional fee before confirming.</p><div id="slots"></div></section><section class="panel"><h2>Review this change</h2><p class="meta" id="revision"></p><dl id="review"></dl><p id="message" role="status"></p><button id="submit">Confirm appointment change</button></section><details id="desk" class="panel"><summary>Sandbox desk controls</summary><p>Change real fixture availability to rehearse a slot being taken. This is not a production booking system.</p><button id="availability">Toggle 11 AM availability</button></details>`,
    `
 const params=new URLSearchParams(location.search),taskId=params.get('taskId')||'demo',readOnly=params.get('view')==='readonly';let draft;
 const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const row=(k,v)=>'<div class="row"><dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd></div>';
 async function api(path,body){const r=await fetch(path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});const d=await r.json();if(!r.ok)throw Error(d.error);return d}
 function render(d){draft=d;const b=d.currentBooking;$('current').innerHTML=row('Booking ID',d.bookingId)+row('Current start',b.startsAt)+row('Technician',b.technician)+row('Service',b.service)+row('Address',b.address);$('revision').textContent='Draft revision '+d.revision;
 $('slots').innerHTML=d.slots.map(s=>'<label class="slot"><input type="radio" name="slot" value="'+esc(s.id)+'" '+(d.slotId===s.id?'checked':'')+' '+(!s.available||readOnly?'disabled':'')+'>'+esc(s.label)+'<br><small>'+esc(s.technician)+' · Additional fee $'+(s.feeCents/100).toFixed(2)+' · '+(s.available?'Available':'Unavailable')+'</small></label>').join('');
 $('review').innerHTML=row('Selected slot ID',d.slotId||'None')+row('Start time',d.startsAt||'Not selected')+row('Technician',d.technician||'Not selected')+row('Additional fee',d.feeCents==null?'Not selected':(d.feeCents/100).toFixed(2))+row('Currency','USD')+row('Timezone',d.timezone)+row('Service',d.service)+row('Address',d.address);
 document.querySelectorAll('input[name=slot]').forEach(el=>el.onchange=async()=>{try{const r=await api('/appointments/api/draft',{taskId,slotId:el.value,expectedRevision:draft.revision});render(r.draft);$('message').textContent='Draft saved. Your original appointment is still booked.'}catch(e){$('message').textContent=e.message}});$('submit').disabled=readOnly||!d.slotId;$('submit').hidden=readOnly;$('desk').hidden=readOnly;}
 $('submit').onclick=async()=>{if(readOnly)return;const operationId=params.get('operationId'),proposalDigest=params.get('proposalDigest');if(!operationId){$('message').textContent='Approve this exact change in Raising Kane first.';return}try{$('submit').disabled=true;const r=await api('/appointments/api/submit',{taskId,operationId,proposalDigest});location.href='/appointments/confirmations/'+r.return.requestId}catch(e){$('message').textContent=e.message;$('submit').disabled=false}};
 $('availability').onclick=async()=>{try{const s=draft.slots.find(s=>s.id==='sat-1100');const r=await api('/appointments/api/availability',{taskId,slotId:s.id,available:!s.available,expectedRevision:draft.revision});render(r.draft)}catch(e){$('message').textContent=e.message}};
 api('/appointments/api/state?taskId='+encodeURIComponent(taskId)).then(r=>render(r.draft)).catch(e=>$('message').textContent=e.message);
 `,
  )
}
function confirmation(record) {
  return shell(
    'Appointment changed',
    `<p>Source confirmation · simulated booking</p><h1>Your appointment has moved.</h1><p>Exactly one active booking remains. The previous time was replaced.</p><section class="panel"><dl>${field('Change request ID', record.requestId)}${field('Booking ID', record.bookingId)}${field('Slot ID', record.slotId)}${field('Start time', record.startsAt)}${field('Previous start', record.oldStartsAt)}${field('Technician', record.technician)}${field('Service', record.service)}${field('Address', record.address)}${field('Timezone', record.timezone)}${field('Additional fee', (record.feeCents / 100).toFixed(2))}${field('Currency', record.currency)}${field('Active bookings', 1)}${field('Status', 'appointment_changed')}${field('Next step', record.nextStep)}</dl></section>`,
  )
}

export function createAppointments() {
  function getDraft(id) {
    const s = load()
    return publicDraft(ensure(s, id))
  }
  function registerGrant(input) {
    const s = load(),
      d = publicDraft(ensure(s, input.taskId))
    if (
      !valid(input.operationId) ||
      !Number.isInteger(input.intentRevision) ||
      !input.validationRunId ||
      input.draftVersion !== d.revision ||
      input.proposalDigest !== d.proposalDigest ||
      !d.slots.find((x) => x.id === d.slotId)?.available
    )
      throw Error('Approval no longer matches an available appointment.')
    if (s.grants[input.operationId] || s.operations[input.operationId])
      throw Error('Operation already exists.')
    const g = {
      ...input,
      bookingVersion: d.bookingVersion,
      status: 'active',
      grantId: randomUUID(),
    }
    s.grants[input.operationId] = g
    save(s)
    return { ...g }
  }
  function revokeGrant(id) {
    const s = load()
    if (s.grants[id]?.status === 'active') {
      s.grants[id].status = 'revoked'
      save(s)
    }
  }
  function getOperation(id) {
    const r = load().operations[id]
    return r
      ? {
          status: 'committed',
          operationId: id,
          proposalDigest: r.proposalDigest,
          requestId: r.requestId,
          return: r,
        }
      : { status: 'absent' }
  }
  async function handle(req, res, url) {
    const send = (status, body, isHtml = false) => {
      res.writeHead(status, {
        'Content-Type': isHtml ? 'text/html; charset=utf-8' : 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      })
      res.end(isHtml ? body : JSON.stringify(body))
      return true
    }
    const body = async () => {
      let text = ''
      for await (const chunk of req) {
        text += chunk
        if (text.length > 16000) throw Error('Request too large')
      }
      return JSON.parse(text || '{}')
    }
    try {
      if (req.method === 'GET' && url.pathname === '/appointments') return send(200, page(), true)
      if (req.method === 'GET' && url.pathname === '/appointments/api/state')
        return send(200, { draft: getDraft(url.searchParams.get('taskId') || 'demo') })
      const op = url.pathname.match(/^\/appointments\/api\/operations\/([^/]+)$/)
      if (req.method === 'GET' && op) return send(200, getOperation(op[1]))
      const cf = url.pathname.match(/^\/appointments\/confirmations\/([^/]+)$/)
      if (req.method === 'GET' && cf) {
        const r = Object.values(load().operations).find((x) => x.requestId === cf[1])
        return r ? send(200, confirmation(r), true) : send(404, { error: 'Confirmation not found' })
      }
      if (
        req.method === 'POST' &&
        ['/appointments/api/draft', '/appointments/api/availability'].includes(url.pathname)
      ) {
        const input = await body(),
          s = load(),
          d = ensure(s, input.taskId)
        if (Object.values(s.operations).some((r) => r.taskId === input.taskId))
          return send(409, { error: 'This change has already been submitted' })
        if (input.expectedRevision !== d.revision)
          return send(409, { error: 'The appointment changed. Reload before editing.' })
        const slot = d.slots.find((x) => x.id === input.slotId)
        if (!slot) return send(400, { error: 'Unknown appointment slot' })
        if (url.pathname.endsWith('/availability')) {
          if (typeof input.available !== 'boolean')
            return send(400, { error: 'Availability must be boolean' })
          slot.available = input.available
        } else {
          if (!slot.available) return send(409, { error: 'That time is no longer available' })
          d.slotId = slot.id
        }
        d.revision++
        for (const g of Object.values(s.grants))
          if (g.taskId === input.taskId && g.status === 'active') g.status = 'revoked'
        save(s)
        return send(200, { draft: publicDraft(d) })
      }
      if (req.method === 'POST' && url.pathname === '/appointments/api/submit') {
        const input = await body(),
          s = load()
        if (!valid(input.taskId) || !valid(input.operationId))
          return send(400, { error: 'Invalid submission identity' })
        const existing = s.operations[input.operationId]
        if (existing)
          return existing.taskId === input.taskId &&
            existing.proposalDigest === input.proposalDigest
            ? send(200, { return: existing, idempotentReplay: true })
            : send(409, { error: 'Operation terms differ' })
        const d = ensure(s, input.taskId),
          view = publicDraft(d),
          g = s.grants[input.operationId]
        if (Object.values(s.operations).some((r) => r.taskId === input.taskId))
          return send(409, { error: 'This booking change has already been submitted' })
        if (
          !g ||
          g.status !== 'active' ||
          g.taskId !== input.taskId ||
          g.proposalDigest !== input.proposalDigest ||
          view.proposalDigest !== input.proposalDigest ||
          g.draftVersion !== d.revision ||
          g.bookingVersion !== d.currentBooking.version ||
          !d.slots.find((x) => x.id === d.slotId)?.available
        )
          return send(409, { error: 'The approved appointment is stale or unavailable' })
        const record = {
          ...view,
          requestId: 'CHG-' + s.next++,
          operationId: input.operationId,
          proposalDigest: view.proposalDigest,
          oldStartsAt: d.currentBooking.startsAt,
          status: 'appointment_changed',
          activeBookings: 1,
          createdAt: new Date().toISOString(),
        }
        d.currentBooking = {
          ...d.currentBooking,
          startsAt: view.startsAt,
          technician: view.technician,
          version: d.currentBooking.version + 1,
        }
        g.status = 'consumed'
        s.operations[input.operationId] = record
        save(s)
        return send(201, { return: record, idempotentReplay: false })
      }
      return false
    } catch (e) {
      return send(400, { error: e.message })
    }
  }
  return { handle, getDraft, registerGrant, revokeGrant, getOperation }
}
