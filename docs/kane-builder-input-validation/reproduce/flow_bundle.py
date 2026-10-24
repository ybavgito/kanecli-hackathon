import os
from pathlib import Path
# Reuse the exact common model/prompt/schema; do not rerun the first three conditions.
exec(compile((Path(__file__).parent/'compare.py').read_text().split('results=[]')[0], 'compare-definitions', 'exec'))
content=[{'type':'input_text','text':'Observed initial source HTML:\n'+(ROOT/'source.html').read_text()}]
for label,description in [('initial','Initial source before method selection'),('tool-label','Source after selecting Printed label'),('tool-qr','Source after selecting QR drop-off')]:
 r=json.load(open(ROOT/(label+'-result.json')))
 content.extend([{'type':'input_text','text':'Kane screenshot evidence '+label+': '+description+'. Read observed facts from the image; no extracted review values are attached.'},img(r['screenshot'])])
t=time.time();r=request('responses',{'model':MODEL,'instructions':PROMPT,'input':[{'role':'user','content':content}],'store':False,'reasoning':{'effort':'medium'},'max_output_tokens':6000,'text':{'format':{'type':'json_schema','name':'builder_artifact','strict':True,'schema':SCHEMA}}})
texts=[c.get('text','') for o in r.get('output',[]) if o.get('type')=='message' for c in o.get('content',[]) if c.get('type')=='output_text'];final=json.loads(''.join(texts))
(ROOT/'generated/flow-bundle.html').write_text(final['ui_html']);(ROOT/'flow-bundle-artifact.json').write_text(json.dumps(final,indent=2))
result={'arm':'flow-bundle','model':MODEL,'wall_seconds':round(time.time()-t,2),'calls':[{'model':r.get('model'),'usage':r.get('usage'),'seconds':round(time.time()-t,2),'status':r.get('status')}],'tools':[],'facts':final['facts'],'unknowns':final['unknowns'],'ui_decisions':final['ui_decisions'],'source_references':final['source_references']}
rows=json.load(open(ROOT/'comparison.json'));rows.append(result);(ROOT/'comparison.json').write_text(json.dumps(rows,indent=2));print(json.dumps({'arm':result['arm'],'facts':result['facts'],'seconds':result['wall_seconds']}),flush=True)
