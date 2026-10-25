import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { hash } from './model.mjs'
const json = (value) => JSON.stringify(value).replaceAll('<', '\\u003c')
export function previewHandler(builder) {
  return async (req, res, url) => {
    const match = url.pathname.match(/^\/builder-(preview|artifact)\/([a-f0-9-]+)\/(\d+)$/)
    if (!match) return false
    const b = builder.builds.get(match[2]),
      c = b?.candidates.find((c) => c.revision === Number(match[3]))
    if (!c?.hash) {
      res.writeHead(404)
      res.end('Candidate not built.')
      return true
    }
    if (match[1] === 'artifact') {
      const html = await readFile(
        join(builder.root, b.id, 'candidates', String(c.revision), 'preview.html'),
        'utf8',
      )
      if (hash(html) !== c.hash) {
        res.writeHead(409, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' })
        res.end('The candidate changed after compilation. Build and verify a new revision.')
        return true
      }
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Security-Policy':
          "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'; sandbox allow-scripts",
      })
      res.end(html)
      return true
    }
    const inspect = url.searchParams.get('inspect') === '1',
      s = builder.sessions.get(url.searchParams.get('session'))
    if (
      !inspect &&
      (!s ||
        s.buildId !== b.id ||
        s.revision !== c.revision ||
        (s.mode === 'use' && s.ownerId !== req.clientId))
    ) {
      res.writeHead(403)
      res.end('Open the interface from its build.')
      return true
    }
    const initial = inspect
      ? {
          kind: b.kind,
          status: 'not_started',
          discovery: {
            screens: b.sourceMap.screens,
            flows: [
              ...b.sourceMap.flows,
              ...b.evidence
                .filter((e) => ['primary', 'alternative'].includes(e.branch))
                .map((e) => ({
                  id: e.id,
                  name:
                    e.branch === 'primary'
                      ? 'Review the original choice'
                      : 'Change a choice and inspect its consequences',
                  status: 'observed',
                  description: e.facts.source_transition,
                })),
            ],
            complete: b.sourceMap.complete,
          },
          intent: {
            refundDestination: 'original_payment',
            noPrinter: false,
            keepTechnician: true,
            maxFeeCents: 0,
          },
          request: b.contract.supportedTask,
          progress: null,
          checks: [],
          merchant: null,
        }
      : await builder.sessionTask(s, b)
    const config = { buildId: b.id, revision: c.revision, sessionId: s?.id, inspect, initial }
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy':
        "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; frame-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'",
    })
    res.end(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${b.kind === 'return' ? 'Your return' : 'Your appointment'} · Raising Kane</title><style>body{margin:0;background:#faf9f5;color:#20352d;font:16px/1.55 system-ui}main{max-width:1000px;margin:auto;padding:20px}header{border-bottom:1px solid #d8ded3;padding:14px 22px;display:flex;justify-content:space-between;gap:20px}small{color:#58675e}iframe{width:100%;height:850px;border:0;display:block}button{font:inherit;background:#294f3d;color:white;border:0;border-radius:8px;padding:13px 20px;cursor:pointer;margin:6px}button:disabled{opacity:.5;cursor:wait}button:focus-visible{outline:3px solid #d79740;outline-offset:3px}#approval,#receipt{border-top:1px solid #cbd4c8;padding:24px 0}#error{color:#8c3323;white-space:pre-wrap}#receipt dl{display:grid;grid-template-columns:1fr 1fr}dt,dd{padding:8px;margin:0;border-bottom:1px solid #e0e4dc}h1{font-size:30px;line-height:1.2}#status{min-height:25px;margin:12px 0}#start{padding:12px 0}@media(max-width:600px){main{padding:12px}iframe{height:1100px}header{font-size:13px}}</style><header><strong>raisingkane.</strong><small>Synthetic website · ${inspect ? 'Inspection only' : s.mode === 'test' ? 'Verification session' : 'Your task'} · Revision ${c.revision}</small></header><main><p id="status" role="status"></p><div id="error" role="alert"></div><section id="start"></section><iframe id="generated" title="Generated simplified task interface" sandbox="allow-scripts" src="/builder-artifact/${b.id}/${c.revision}"></iframe><section id="approval" hidden></section><section id="receipt" hidden></section></main><script>
const config=${json(config)},frame=document.getElementById('generated');let task=config.initial,pending=false;
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>n==null?'Unknown':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n/100);
function paint(){frame.contentWindow.postMessage({type:'rk-state',task},'*');document.getElementById('status').textContent=task.progress?.text||(task.status==='complete'?'Source confirmation verified.':task.status==='not_started'?'Choose a discovered flow. This release can execute the supported task below.':task.status.replaceAll('_',' '));document.getElementById('error').textContent=task.error||'';
const start=document.getElementById('start');start.innerHTML=task.status==='not_started'?'<strong>'+escape(task.request)+'</strong><br><button id="start-task" '+(config.inspect?'disabled':'')+'>Start this task</button>':'';document.getElementById('start-task')?.addEventListener('click',()=>action('start',{}));
const approval=document.getElementById('approval');approval.hidden=!['ready','approved'].includes(task.status);approval.innerHTML='';if(!approval.hidden){const d=task.merchant;approval.innerHTML='<h2>Approve these exact source terms</h2><p>'+escape(task.kind==='return'?'Shoes only · Jacket kept · '+(d.refundDestination==='original_payment'?'Original payment method':'Store credit')+' · '+money(d.expectedRefundCents):d.startsAt+' · '+d.technician+' · '+money(d.feeCents)+' added fee')+'</p><p>Only this trusted panel can approve and submit. All records in this demo are synthetic.</p><button id="commit">'+(task.status==='ready'?'Approve exact terms':'Submit approved request')+'</button>';document.getElementById('commit').disabled=pending;document.getElementById('commit').onclick=()=>action(task.status==='ready'?'approve':'submit',{});}
const receipt=document.getElementById('receipt');receipt.hidden=!task.receipt;if(task.receipt){const r=task.receipt;receipt.innerHTML='<h1>'+escape(task.kind==='return'?'Return requested; refund pending':'Appointment change confirmed')+'</h1><p>Verified against the saved source record.</p><dl>'+Object.entries(r).filter(([k,v])=>!['sourceUrl','qrUrl','labelUrl'].includes(k)&&['string','number'].includes(typeof v)).map(([k,v])=>'<dt>'+escape(k.replace(/([A-Z])/g,' $1'))+'</dt><dd>'+escape(k==='expectedRefundCents'||k==='feeCents'?money(v):v)+'</dd>').join('')+'</dl><p>'+escape(task.kind==='return'?'Jacket kept. Refund destination: '+(r.refundDestination==='original_payment'?'Original payment method':'Store credit'):'One active booking remains.')+'</p>';}}
async function poll(){if(config.inspect)return;try{const r=await fetch('/api/builder/'+config.buildId+'/session/'+config.sessionId);const d=await r.json();if(!r.ok)throw Error(d.error);task=d.task;paint()}catch(e){document.getElementById('error').textContent=e.message}}
async function action(name,payload){if(config.inspect||pending)return;pending=true;try{const r=await fetch('/api/builder/'+config.buildId+'/session/'+config.sessionId,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:name,payload})});const d=await r.json();if(!r.ok)throw Error(d.error);task=d.task;paint()}catch(e){document.getElementById('error').textContent=e.message}finally{pending=false}}
addEventListener('message',e=>{if(e.source!==frame.contentWindow)return;if(e.data?.type==='rk-ready')paint();if(e.data?.type==='rk-height'&&Number.isFinite(e.data.height))frame.style.height=Math.min(12000,Math.max(200,e.data.height+8))+'px';if(e.data?.type==='rk-action'&&['start','choice','check'].includes(e.data.action))action(e.data.action,e.data.payload)});frame.onload=paint;paint();setInterval(poll,1500);
</script></html>`)
    return true
  }
}
