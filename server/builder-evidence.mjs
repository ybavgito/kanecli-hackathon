import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const execute = promisify(execFile)
const extract = `import sys,json,zipfile,re,base64
with zipfile.ZipFile(sys.argv[1]) as z:
 names=[n for n in z.namelist() if 'screenshot' in n.lower() and n.lower().endswith(('.png','.jpg','.jpeg'))]
 names.sort(key=lambda s:[int(v) if v.isdigit() else v for v in re.split(r'(\\d+)',s)])
 if not names: raise RuntimeError('The Kane evidence pack has no screenshot')
 info=z.getinfo(names[-1])
 if info.file_size > 3500000: raise RuntimeError('Screenshot exceeds the 3.5 MB vision input limit')
 print(json.dumps({'member':info.filename,'data':base64.b64encode(z.read(info)).decode(),'mime':'image/png' if info.filename.lower().endswith('.png') else 'image/jpeg'}))`

/** Only called with a worker-owned sealed pack, never a client-supplied path. */
export async function captureBuilderScreenshot({ evidence, directory }) {
  const pack = evidence?.evidencePackPath || evidence?.evidencePath || evidence?.path
  if (evidence?.status !== 'passed') throw new Error('A completed Kane source inspection is required before a screenshot can be used.')
  if (!pack || !path.isAbsolute(pack) || !pack.endsWith('.evidence')) {
    throw new Error('A real sealed Kane evidence pack is required for the builder screenshot.')
  }
  const env = { ...process.env }
  delete env.OPENAI_API_KEY
  const { stdout } = await execute('python3', ['-c', extract, pack], {
    env, timeout: 15000, maxBuffer: 12 * 1024 * 1024,
  })
  const image = JSON.parse(stdout)
  const bytes = Buffer.from(image.data, 'base64')
  const digest = createHash('sha256').update(bytes).digest('hex')
  const id = `screenshot-${digest.slice(0, 20)}`
  const filename = `${id}.${image.mime === 'image/png' ? 'png' : 'jpg'}`
  await mkdir(directory, { recursive: true, mode: 0o700 })
  await writeFile(path.join(directory, filename), bytes, { mode: 0o600 })
  return {
    id, filename, digest, mime: image.mime, dataUrl: `data:${image.mime};base64,${image.data}`,
    description: evidence.summary || 'Actual final screenshot from this Kane source run.',
    provenance: { pack, member: image.member, runId: evidence.runId, sessionId: evidence.sessionId,
      phase: evidence.phase, status: evidence.status, testUrl: evidence.testUrl || evidence.url },
  }
}

export function publicBuilderEvidence(evidence) {
  if (!evidence) return null
  const { pack, ...provenance } = evidence.provenance || {}
  return { id: evidence.id, kind: 'kane-screenshot', title: 'What Kane saw',
    summary: evidence.description, digest: evidence.digest, filename: evidence.filename,
    status: provenance.status, url: provenance.testUrl, provenance }
}
