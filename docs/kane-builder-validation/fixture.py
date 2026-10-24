import json, os, subprocess, time, threading, signal
from pathlib import Path
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse,parse_qs
ROOT=Path('.')
requests=[]
class Handler(BaseHTTPRequestHandler):
 def log_message(self,*args): pass
 def do_GET(self):
  requests.append({'path':self.path,'at':time.time()})
  q=parse_qs(urlparse(self.path).query)
  if self.path.startswith('/review'):
   qr=q.get('method')==['qr']; destination='Store credit' if qr else 'Original payment'; fee=5 if qr else 0
   body=f'<h1>Return review</h1><dl><dt>Item</dt><dd>Blue shoes only</dd><dt>Keep</dt><dd>Green jacket</dd><dt>Method</dt><dd>{"QR drop-off" if qr else "Printed label"}</dd><dt>Refund destination</dt><dd>{destination}</dd><dt>Deduction</dt><dd>${fee}.00</dd><dt>Refund</dt><dd>${80-fee}.00 USD</dd></dl><p>This is a read-only quote, not a saved return.</p><a href="/return">Change method</a>'
  elif self.path.startswith('/return'):
   body='<h1>Return blue shoes</h1><p>Order DEMO-1. Shoes cost $80.00. Keep the green jacket.</p><p>Choose a method to see its review and refund destination.</p><a href="/review?method=label">Printed label</a><br><a href="/review?method=qr">QR drop-off (no printer)</a><p>Optional order note:</p><input id="order-note"><p style="color:#ddd;background:white">Terms apply to each return method.</p>'
  else:
   body='<h1>Sample Outfitters</h1><p>Synthetic capability fixture. No real accounts or transactions.</p><a href="/return">Return blue shoes</a><img src="/pixel.svg"><p>Order DEMO-1 contains blue shoes and a green jacket.</p>'
  if self.path=='/pixel.svg': content=b'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24" fill="blue"/></svg>'; mime='image/svg+xml'
  else: content=('<!doctype html><html><head><meta charset="utf-8"><title>Sample Outfitters return</title></head><body style="font:20px Arial;padding:32px;max-width:800px">'+body+'</body></html>').encode();mime='text/html'
  self.send_response(200);self.send_header('Content-Type',mime);self.end_headers();self.wfile.write(content)

if __name__ == '__main__':
 import argparse
 parser=argparse.ArgumentParser(description='Synthetic read-only Explore capability fixture')
 parser.add_argument('--port',type=int,default=38383)
 args=parser.parse_args()
 server=ThreadingHTTPServer(('127.0.0.1',args.port),Handler)
 print(f'http://127.0.0.1:{server.server_port}/',flush=True)
 try: server.serve_forever()
 except KeyboardInterrupt: pass
 finally: server.server_close()
