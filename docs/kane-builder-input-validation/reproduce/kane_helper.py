import os,subprocess,json,time,zipfile,re
from pathlib import Path
ROOT=Path(os.environ.get('RK_INPUT_EXPERIMENT_DIR','/tmp/raising-kane-builder-inputs'))
CLI=os.environ.get('KANE_CLI','kane-cli')
def run(label,objective,url,max_steps=14):
 start=time.time(); args=[CLI,'run',objective,'--url',url,'--headless','--agent','--assertion-failure-mode','stop','--max-steps',str(max_steps),'--timeout','150']
 (ROOT/(label+'-objective.txt')).write_text(objective)
 with (ROOT/(label+'.ndjson')).open('w') as out,(ROOT/(label+'.stderr')).open('w') as err:
  p=subprocess.run(args,stdout=out,stderr=err,env=dict({k:v for k,v in os.environ.items() if k != 'OPENAI_API_KEY'},KANE_CLI_SYSTEM_NODE='1',KANE_CLI_USER_AGENT='codex'),cwd=ROOT,timeout=230)
 events=[]
 for line in (ROOT/(label+'.ndjson')).read_text().splitlines():
  try:events.append(json.loads(line))
  except:pass
 end=next((e for e in reversed(events) if e.get('type')=='run_end'),{})
 result={k:end.get(k) for k in ['status','summary','final_state','duration','credits_consumed','run_dir','session_dir']}
 result.update(exit_code=p.returncode,wall_seconds=round(time.time()-start,2))
 pack=next((e.get('pack') for e in events if e.get('type')=='coverage' and e.get('pack')),None)
 if not pack and end.get('session_dir'):
  paths=list((Path(end['session_dir'])/'evidence').glob('*.evidence'));pack=str(paths[-1]) if paths else None
 if pack:
  with zipfile.ZipFile(pack) as z:
   shots=[n for n in z.namelist() if n.lower().endswith(('.jpg','.jpeg','.png')) and 'screenshot' in n.lower()]
   if shots:
    shots.sort(key=lambda s:[int(x) if x.isdigit() else x for x in re.split(r'(\d+)',s)])
    target=ROOT/(label+'-last'+Path(shots[-1]).suffix);target.write_bytes(z.read(shots[-1]));result['screenshot']=str(target)
    result['screenshot_member']=shots[-1]
 result['steps']=[{k:e.get(k) for k in ['step','status','remark','ts']} for e in events if 'step' in e and 'remark' in e]
 (ROOT/(label+'-result.json')).write_text(json.dumps(result,indent=2))
 return result
if __name__=='__main__':
 r=run('initial','Open the supplied source URL. Verify the heading Choose how to return your shoes is visible and that both return method buttons and the Drop-off instructions image have loaded. Do not click either method. Stop on the initial page.', 'http://127.0.0.1:38491/source',6)
 print(json.dumps({k:r[k] for k in ['status','wall_seconds','screenshot'] if k in r}),flush=True)
