import os
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse,parse_qs
import json,time,io
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(os.environ.get('RK_INPUT_EXPERIMENT_DIR','/tmp/raising-kane-builder-inputs'))
HTML='''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Sample Outfitters — Return method</title><style>body{font:20px Arial;color:#182b2b;background:#faf8f2;margin:48px;max-width:1150px}main{display:grid;grid-template-columns:1fr 440px;gap:40px}button{font:inherit;padding:16px;margin:12px 12px 12px 0}#review{border-top:2px solid;padding:20px 0}img{width:440px;height:220px}dt{font-weight:bold}dd{margin:0 0 12px}small{color:#555}</style></head><body><small>SYNTHETIC READ-ONLY RETURN QUOTES</small><h1>Choose how to return your shoes</h1><main><section><p>Order DEMO-2: blue shoes, $80.00 USD.</p><p>Return the blue shoes only. Keep the green jacket.</p><p>Choose a method to load its current review.</p><button onclick="quote('label')">Printed label</button><button onclick="quote('qr')">QR drop-off</button><section id="review" aria-live="polite">No method selected. Refund terms have not been loaded.</section></section><aside><img src="/instructions.png" alt="Drop-off instructions"></aside></main><script>async function quote(method){let r=await fetch('/quote?method='+method);let d=await r.json();document.getElementById('review').innerHTML='<h2>Review: '+d.method+'</h2><dl><dt>Refund destination</dt><dd>'+d.destination+'</dd><dt>Deduction</dt><dd>'+d.deduction+'</dd><dt>Refund amount</dt><dd>'+d.refund+'</dd><dt>Selected item</dt><dd>Blue shoes only</dd><dt>Keep</dt><dd>Green jacket</dd></dl><p>Read-only quote. No return has been submitted.</p>';}</script></body></html>'''
image=Image.new('RGB',(880,440),'#e3ebdf');draw=ImageDraw.Draw(image)
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
draw.text((35,32),'QR DROP-OFF',font=ImageFont.truetype(font,44),fill='#182b2b')
draw.text((35,130),'Bring photo ID',font=ImageFont.truetype(font,44),fill='#182b2b')
draw.text((35,220),'Maximum parcel: 4 kg',font=ImageFont.truetype(font,42),fill='#182b2b')
draw.text((35,330),'These instructions are part of the task.',font=ImageFont.truetype(font,26),fill='#182b2b')
buf=io.BytesIO();image.save(buf,format='PNG');PNG=buf.getvalue()
class Handler(BaseHTTPRequestHandler):
 def log_message(self,*a):pass
 def send(self,body,mime='text/html',status=200):
  if isinstance(body,str):body=body.encode()
  self.send_response(status);self.send_header('Content-Type',mime)
  if self.path.startswith('/generated/'):
   self.send_header('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'; sandbox allow-scripts")
  self.end_headers();self.wfile.write(body)
 def do_GET(self):
  with (ROOT/'source-requests.ndjson').open('a') as f:f.write(json.dumps({'method':'GET','path':self.path,'at':time.time()})+'\n')
  path=urlparse(self.path).path
  if path=='/source':return self.send(HTML)
  if path=='/instructions.png':return self.send(PNG,'image/png')
  if path=='/quote':
   method=parse_qs(urlparse(self.path).query).get('method',[''])[0]
   if method not in ['label','qr']:return self.send('{}','application/json',400)
   d={'method':'QR drop-off' if method=='qr' else 'Printed label','destination':'Store credit' if method=='qr' else 'Original payment','deduction':'$5.00' if method=='qr' else '$0.00','refund':'$75.00 USD' if method=='qr' else '$80.00 USD'}
   return self.send(json.dumps(d),'application/json')
  if path.startswith('/generated/') and path.rsplit('/',1)[-1] in ['html-only.html','screenshot.html','agentic.html','flow-bundle.html']:
   f=ROOT/path.lstrip('/');return self.send(f.read_text() if f.exists() else 'Not generated',status=200 if f.exists() else 404)
  return self.send('Not found',status=404)
 def do_POST(self):return self.send('Mutations unavailable',status=405)
if __name__=='__main__':
 ROOT.mkdir(exist_ok=True);(ROOT/'source.html').write_text(HTML);(ROOT/'instructions.png').write_bytes(PNG)
 server=ThreadingHTTPServer(('127.0.0.1',38491),Handler)
 print('Fixture ready at http://127.0.0.1:38491/source',flush=True)
 server.serve_forever()
