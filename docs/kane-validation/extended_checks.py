"""Synthetic, bounded Kane rc.3 experiments. No real customer transactions.

Usage: KANE_CLI=/path/to/kane-cli python3 extended_checks.py [runtime|freshness|repair|explore|suite|assurance]
Runs write to /tmp/kane-rc3-extended-<mode>. Uses the active Kane account/credits.
"""
import json, os, signal, socket, subprocess, sys, threading, time, urllib.request, shutil
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

MODE = sys.argv[1] if len(sys.argv) > 1 else 'runtime'
ROOT = Path(os.environ.get('KANE_TEST_ROOT', '/tmp/kane-rc3-extended-' + MODE))
ROOT.mkdir(exist_ok=True)
CLI = os.environ.get('KANE_CLI', 'kane-cli')
PROJECT = os.environ.get('KANE_EXPLORE_PROJECT', '')
CHROME = os.environ.get('KANE_CHROME') or shutil.which('google-chrome') or shutil.which('chromium')
if not CHROME:
    raise RuntimeError('Set KANE_CHROME to a Chrome executable')
if MODE == 'explore' and not PROJECT:
    raise RuntimeError('Set KANE_EXPLORE_PROJECT to a dedicated disposable project ID')
STATE = {'destination': 'Original payment', 'saved': 0, 'commits': 0}
EVENTS, RESULTS, CHROMES = [], [], []

def free_port():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_): pass

    def record(self):
        EVENTS.append({'path': self.path, 'method': self.command,
                       'authenticated': 'fixture_user=alice' in self.headers.get('Cookie', ''),
                       'at': time.time(), 'state': dict(STATE)})
        (ROOT/'server-events.json').write_text(json.dumps(EVENTS, indent=2))

    def send(self, body, content_type='text/html', status=200):
        body = body.encode()
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        self.record()
        if self.path == '/api/save':
            STATE['saved'] += 1
            STATE['destination'] = 'Store credit'
            self.send(json.dumps(STATE), 'application/json')
        elif self.path == '/api/restore':
            STATE['destination'] = 'Original payment'
            self.send(json.dumps(STATE), 'application/json')
        elif self.path == '/api/commit':
            STATE['commits'] += 1
            self.send(json.dumps(STATE), 'application/json')
        else:
            self.send('{}', 'application/json', 404)

    def do_GET(self):
        self.record()
        if self.path == '/seed':
            self.send_response(303)
            self.send_header('Set-Cookie', 'fixture_user=alice; HttpOnly; SameSite=Lax; Path=/')
            self.send_header('Location', '/review')
            self.end_headers()
            return
        if self.path == '/api/state':
            self.send(json.dumps(STATE), 'application/json')
            return
        signed = 'fixture_user=alice' in self.headers.get('Cookie', '')
        if self.path.startswith('/booking'):
            content = '<h1>Repair appointment</h1><p>Booking ID: APPT-1</p><p>Technician: Maya</p><p>Start time: 11:00</p><p>Additional fee: $0</p><p>Only one active booking</p>'
        elif self.path.startswith('/receipt'):
            content = '<h1>Return receipt</h1><p>Order ID: ORDER-1</p><p>Refund: $75.00 USD</p><p>Status: refund pending</p>'
        else:
            content = f'''<h1>Return review</h1><p>{'Signed in as alice' if signed else 'Not signed in'}</p>
            <p>Order ID: ORDER-1</p><p>Refund destination: {STATE['destination']}</p>
            <p>Refund amount: $75.00 USD</p><p>Saved changes: {STATE['saved']}</p>
            <button onclick="location.reload()">Refresh review</button>
            <button onclick="fetch('/api/save',{{method:'POST'}}).then(()=>location.reload())">Save Store credit</button>
            <button onclick="fetch('/api/restore',{{method:'POST'}}).then(()=>location.reload())">Restore Original payment</button>
            <button onclick="fetch('/api/commit',{{method:'POST'}}).then(()=>location.href='/receipt')">Submit return</button>'''
        self.send(f'''<!doctype html><html lang="en"><meta charset="utf-8"><title>Raising Kane synthetic lab</title>
        <body style="font:22px Arial;padding:32px"><nav><a href="/review">Return review</a> |
        <a href="/booking">Repair appointment</a> | <a href="/receipt">Return receipt</a></nav>
        {content}<footer><p>Synthetic test environment. No real purchases or appointments.</p></footer></body></html>''')

def chrome(url):
    port = free_port()
    log = (ROOT/f'chrome-{port}.log').open('w')
    p = subprocess.Popen([CHROME, '--headless=new', '--no-sandbox',
         f'--remote-debugging-port={port}', f'--user-data-dir={ROOT / ("chrome-"+str(port))}',
         '--no-first-run', '--no-default-browser-check', url], stdout=log, stderr=log, start_new_session=True)
    CHROMES.append((p, log))
    cdp = f'http://127.0.0.1:{port}'
    for _ in range(50):
        try:
            urllib.request.urlopen(cdp+'/json/version', timeout=1).read()
            return cdp
        except Exception: time.sleep(.2)
    raise RuntimeError('Owned Chrome did not start')

def call(label, args, deadline=180):
    begin = time.monotonic()
    with (ROOT/(label+'.ndjson')).open('w') as out, (ROOT/(label+'.stderr')).open('w') as err:
        p = subprocess.Popen([CLI]+args, cwd=ROOT, env=dict(os.environ, KANE_CLI_SYSTEM_NODE='1', KANE_CLI_USER_AGENT='codex'),
            stdin=subprocess.DEVNULL, stdout=out, stderr=err, start_new_session=True)
        try: code = p.wait(timeout=deadline)
        except subprocess.TimeoutExpired:
            os.killpg(p.pid, signal.SIGTERM)
            try: p.wait(timeout=8)
            except subprocess.TimeoutExpired: os.killpg(p.pid, signal.SIGKILL); p.wait()
            code = 'outer_deadline'
    rows=[]
    for line in (ROOT/(label+'.ndjson')).read_text().splitlines():
        try: rows.append(json.loads(line))
        except ValueError: pass
    terminal=[r for r in rows if r.get('type') in ('run_end','test_md_done','testrun_done','done')]
    result={'label':label,'exit':code,'wall_seconds':round(time.monotonic()-begin,2),'terminal':terminal,'source_state':dict(STATE)}
    RESULTS.append(result)
    (ROOT/'results.json').write_text(json.dumps(RESULTS,indent=2))
    print(json.dumps({k:v for k,v in result.items() if k!='terminal'}),flush=True)
    return result, rows

server=ThreadingHTTPServer(('127.0.0.1',free_port()),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{server.server_port}'
(ROOT/'fixture.json').write_text(json.dumps({'url':URL,'synthetic':True,'mode':MODE},indent=2))

try:
    if MODE == 'runtime':
        cdp=chrome(URL+'/seed')
        base=['--agent','--mode','action','--cdp-endpoint',cdp,'--max-steps','12','--timeout','120']
        # Same unchanged recorded objective; only input variables and source state vary.
        f=ROOT/'variable_check_test.md'
        f.write_text('---\nurl: "{{review_url}}"\nmode: action\nmax_steps: 10\ntimeout: 120\n---\n# Parameterized review\n\n## Verify exact destination\nAssert that the displayed refund destination is {{expected_destination}}.\n')
        vf=ROOT/'values.json'
        def vars_for(value):
            vf.write_text(json.dumps({'review_url':{'value':URL+'/review'},'expected_destination':{'value':value}}))
        args=['testmd','run',str(f),'--cdp-endpoint',cdp,'--variables-file',str(vf),'--agent','--no-adaptive-heal']
        vars_for('Original payment')
        r,_=call('01-variable-author',args)
        if r['exit']==0:
            STATE['destination']='Store credit'; vars_for('Store credit')
            call('02-variable-replay-changed-input',args)
            vars_for('Original payment')
            call('03-variable-replay-negative',args)
        STATE['destination']='Original payment'
        # Extract explicit reusable values and feed returned context to a separate process.
        r,rows=call('04-extract-booking',['run','Store the displayed booking ID as booking_id. Store the displayed technician name as technician. Store the displayed start time as appointment_time. Assert that the additional fee is $0.','--url',URL+'/booking']+base)
        ends=[x for x in rows if x.get('type')=='run_end']
        context=ends[-1].get('context') if ends else None
        if r['exit']==0 and context:
            (ROOT/'extracted-context.json').write_text(json.dumps(context,indent=2))
            call('05-context-next-job',['run','Assert that the booking ID, technician, and start time on this page exactly match the stored booking_id, technician, and appointment_time values from the prior run.','--session-context',json.dumps(context),'--url',URL+'/booking']+base)
        # A current-page analyzer should report true and false separately.
        call('06-current-page-analyzer',['run','--analyzer-only','--agent','--allow-missing-url','--cdp-endpoint',cdp,'--condition','The technician is Maya','--condition','The technician is Leo'])
        call('07-session-retained',['run','Assert that the page says Signed in as alice.','--url',URL+'/review']+base)
        fresh=chrome(URL+'/review')
        call('08-fresh-browser-no-auth',['run','Assert that the page says Signed in as alice.','--url',URL+'/review','--agent','--mode','action','--cdp-endpoint',fresh,'--max-steps','6','--timeout','90'])
        # An intentional failed run with a confirmed preceding mutation.
        call('09-failure-after-save',['run','Click Save Store credit. Assert that Saved changes is 1. Then assert that the refund destination is Original payment. Do not change the destination again.','--url',URL+'/review','--assertion-failure-mode','stop']+base)
        # Harness reset here; the separate repair mode tests a Kane-driven repair.
        STATE['destination']='Original payment'
        call('10-final-validation',['run','Verify that the return review shows Original payment and a refund amount of $75.00 USD.','--url',URL+'/review','--final-validation','on']+base)
    elif MODE == 'explore':
        r,rows=call('01-explore-readonly',['explore','run','--project',PROJECT,'--url',URL+'/review','--local-orchestration','--headless','--policy','read_only','--deny','Submit return','--max-leases','3','--max-parallel','1','--no-context','--prompt','Map the return review, repair appointment, and receipt screens. Read labels and identify how a shopper can navigate between these screens. Do not submit a return.','--agent'],deadline=480)
        call('02-explore-list',['explore','list','--all','--agent'],deadline=30)
        # Deliberately incompatible URL; expected preflight rejection, no browser visit.
        call('03-explore-other-url',['explore','run','--project',PROJECT,'--url',URL+'/booking','--local-orchestration','--headless','--policy','read_only','--max-leases','1','--agent'],deadline=90)
    elif MODE == 'assurance':
        spec=ROOT/'requirements.md'
        spec.write_text(f'''# Synthetic return review requirements\nEntry URL: {URL}/review\nThe return review displays Order ID ORDER-1 and Refund destination Original payment.\nRequirement R1: A shopper can open Return receipt from navigation and see Refund $75.00 USD and Status refund pending for ORDER-1.\nThis is a local sandbox with no login requirement. Use only this navigation flow; do not click Save Store credit or Submit return.\n''')
        call('01-ingest',['context','ingest',str(spec),'--mode','ci','--local'],deadline=60)
        call('02-extract',['context','extract','--mode','override','--json','--local'],deadline=180)
        call('03-list',['context','list'],deadline=30)
        call('04-fsck',['context','fsck'],deadline=30)
        # This continuation was tested separately against the same live fixture.
        r,_=call('05-design',['design','tests','--use-case','uc-1','--max','1','--mode','override','--json','--allow-unreviewed'],deadline=240)
        call('06-cover-before-execution',['cover','--json'],deadline=30)
        files=[str(p) for p in (ROOT/'.testmuai/tests').glob('*_test.md')]
        if files and r['exit']==0:
            call('07-run-designed-test',['testrun','run']+files+['--headless','--agent','--parallel','1','--no-adaptive-heal','--stream-members'],deadline=240)
            call('08-cover-after-execution',['cover','--json'],deadline=30)
        call('09-fsck-after-design',['context','fsck'],deadline=30)
    elif MODE == 'repair':
        cdp=chrome(URL+'/seed')
        base=['--agent','--mode','action','--cdp-endpoint',cdp,'--max-steps','10','--timeout','120','--url',URL+'/review']
        f=ROOT/'guard_test.md'
        f.write_text(f'---\nurl: {URL}/review\nmode: action\nmax_steps: 8\ntimeout: 120\n---\n# Exact refund guard\n\n## Verify approved destination\nAssert that the refund destination is Original payment. Do not change the draft.\n')
        check=['testmd','run',str(f),'--cdp-endpoint',cdp,'--agent','--no-adaptive-heal']
        baseline,_=call('01-guard-author',check)
        if baseline['exit']==0:
            call('02-change-draft',['run','Click Save Store credit. Assert that the refund destination is Store credit. Do not submit the return.']+base)
            failed,_=call('03-guard-red',check)
            if failed['exit']==1:
                repaired,_=call('04-agent-correction',['run','The prior validator rejected Store credit because the user requires Original payment. Click Restore Original payment. Assert that the refund destination is Original payment. Do not submit the return.']+base)
                if repaired['exit']==0: call('05-guard-green',check)
        # Compare authoring failure controls on a harmless action sequence.
        call('06-continue-after-failed-assertion',['run','Assert that the refund amount is $999.00 USD. Then open Repair appointment. Assert that the technician is Maya.','--assertion-failure-mode','continue']+base)
        call('07-stop-after-failed-assertion',['run','Assert that the refund amount is $999.00 USD. Then open Repair appointment. Assert that the technician is Maya.','--assertion-failure-mode','stop']+base)
    elif MODE == 'freshness':
        cdp=chrome(URL+'/seed')
        f=ROOT/'fresh_variable_test.md'
        f.write_text('---\nurl: "{{review_url}}"\nmode: action\nmax_steps: 10\ntimeout: 120\n---\n# Fresh parameterized review\n\n## Reload and verify\nClick Refresh review. Assert that the displayed refund destination is {{expected_destination}}.\n')
        vf=ROOT/'values.json'
        args=['testmd','run',str(f),'--cdp-endpoint',cdp,'--variables-file',str(vf),'--agent','--no-adaptive-heal']
        for label,actual,expected in [('01-author','Original payment','Original payment'),('02-changed-input','Store credit','Store credit'),('03-mismatch','Store credit','Original payment')]:
            STATE['destination']=actual
            vf.write_text(json.dumps({'review_url':{'value':URL+'/review'},'expected_destination':{'value':expected}}))
            call(label,args)
        vf.write_text(json.dumps({'expected_destination':{'value':'Store credit'}}))
        call('04-fresh-run-variable',['run','Click Refresh review. Assert that the displayed refund destination is {{expected_destination}}.','--variables-file',str(vf),'--url',URL+'/review','--cdp-endpoint',cdp,'--mode','action','--agent','--max-steps','10','--timeout','120'])
    elif MODE == 'suite':
        cdp=chrome(URL+'/review')
        files=[]
        for name,path,objective in [('return','/review','Assert that the refund destination is Original payment.'),('booking','/booking','Assert that the technician is Maya and the additional fee is $0.')]:
            f=ROOT/(name+'_test.md');files.append(str(f))
            f.write_text(f'---\nurl: {URL}{path}\nmode: action\nmax_steps: 8\ntimeout: 90\n---\n# {name}\n\n## Verify {name}\n{objective}\n')
            call('01-author-'+name,['testmd','run',str(f),'--cdp-endpoint',cdp,'--agent','--no-adaptive-heal'])
        call('02-suite-preflight',['testrun','run']+files+['--dry-run','--agent'],deadline=60)
        call('03-suite-two-workers',['testrun','run']+files+['--parallel','2','--headless','--no-adaptive-heal','--agent','--stream-members'],deadline=240)
    else:
        raise ValueError('Unknown mode')
finally:
    (ROOT/'final-state.json').write_text(json.dumps(STATE,indent=2))
    (ROOT/'server-events.json').write_text(json.dumps(EVENTS,indent=2))
    server.shutdown(); server.server_close()
    for p,log in CHROMES:
        if p.poll() is None:
            os.killpg(p.pid,signal.SIGTERM)
            try: p.wait(timeout=5)
            except subprocess.TimeoutExpired: os.killpg(p.pid,signal.SIGKILL); p.wait()
        log.close()
    print('Owned fixture and browsers stopped.',flush=True)
