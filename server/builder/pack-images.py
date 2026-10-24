"""Read matching step/image pairs without extracting archive paths."""
import json,sys,zipfile,pathlib
pack,out=sys.argv[1:];out=pathlib.Path(out);rows=[]
with zipfile.ZipFile(pack) as z:
 for name in z.namelist():
  if not name.endswith('/step.json'):continue
  try:
   step=json.loads(z.read(name));image=name.rsplit('/',1)[0]+'/screenshot.jpg'
   if image not in z.namelist():continue
   rows.append((int(step.get('ordinal',0)),step,image))
  except (ValueError,KeyError):continue
 result=[]
 for index,(_,step,image) in enumerate(sorted(rows,key=lambda v:v[0])[-6:]):
  data=z.read(image)
  if len(data)>8000000:continue
  filename=f'step-{index}.jpg';(out/filename).write_bytes(data)
  result.append({'image':filename,'stepId':step.get('id'),'ordinal':step.get('ordinal'),'kind':step.get('kind'),'status':step.get('status'),'summary':step.get('summary'),'url':step.get('url')})
 print(json.dumps(result))
