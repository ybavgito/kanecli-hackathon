import os,json,re,urllib.request,urllib.error
from pathlib import Path

def credential():
 key=os.environ.get('OPENAI_API_KEY')
 if not key:raise RuntimeError('Set OPENAI_API_KEY privately in the execution environment')
 return key

def request(path,payload=None):
 data=json.dumps(payload).encode() if payload is not None else None
 req=urllib.request.Request('https://api.openai.com/v1/'+path,data=data,headers={'Authorization':'Bearer '+credential(),'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=180) as response:return json.load(response)
 except urllib.error.HTTPError as e:
  try:body=json.loads(e.read());code=body.get('error',{}).get('code');typ=body.get('error',{}).get('type')
  except:code=typ=None
  raise RuntimeError(f'OpenAI HTTP {e.code}; code={code}; type={typ}') from None

