// Save a finished builder run as a recorded demo that "Demo now" can open.
// Usage: node scripts/record-demo.mjs <data-dir> <build-id> <label> [out-dir]
// The build must be ready, with a passing, source-matched verification on its promoted revision.
import { readFile, readdir, mkdir, cp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hash } from '../server/builder/model.mjs'

const [dataDir, buildId, label, outArg] = process.argv.slice(2)
const labels = ['store-overview', 'store-focused', 'northstar', 'linden']
if (!dataDir || !buildId || !labels.includes(label)) {
  console.error('Usage: node scripts/record-demo.mjs <data-dir> <build-id> <' + labels.join('|') + '> [out-dir]')
  process.exit(2)
}
const outRoot =
  outArg || fileURLToPath(new URL('../docs/raising-kane/evidence/builder/', import.meta.url))
const store = JSON.parse(await readFile(join(dataDir, 'builder', 'builds.json'), 'utf8'))
const b = store.builds.find((x) => x.id === buildId || x.id.startsWith(buildId))
if (!b) throw Error('Build not found: ' + buildId)
const promoted = b.candidates.find((c) => c.revision === b.promotedRevision)
if (
  b.status !== 'ready' ||
  promoted?.verification?.status !== 'passed' ||
  !promoted.verification.sourceMatch
)
  throw Error('Build is not ready with a passing source-matched verification; refusing to record it.')

const src = join(dataDir, 'builder', b.id)
const out = join(outRoot, label)
await rm(out, { recursive: true, force: true })
await mkdir(out, { recursive: true })

for (const c of b.candidates) {
  const from = join(src, 'candidates', String(c.revision))
  const to = join(out, 'revision-' + c.revision)
  await mkdir(to, { recursive: true })
  for (const name of ['preview.html', 'artifact.json'])
    await cp(join(from, name), join(to, name)).catch(() => {})
  const ver = join(from, 'verification')
  for (const name of await readdir(ver).catch(() => []))
    if (['requirements.md', 'coverage.json', 'verification-events.json'].includes(name) || /^step-\d+\.jpg$/.test(name))
      await cp(join(ver, name), join(to, name))
  for (const name of await readdir(join(ver, '.testmuai', 'tests')).catch(() => []))
    if (name.endsWith('_test.md')) await cp(join(ver, '.testmuai', 'tests', name), join(to, name))
}
// Evidence images are flattened to the names the demo importer looks up:
// explore-<screen id>.<ext> for source screens, <branch>-<id>.<ext> for observations.
const observations = []
for (const e of b.evidence || []) {
  if (!e.imagePath) continue
  const ext = e.imagePath.slice(e.imagePath.lastIndexOf('.'))
  if (e.branch === 'explore') await cp(e.imagePath, join(out, 'explore-' + e.id + ext))
  else if (['primary', 'alternative', 'overview'].includes(e.branch)) {
    await cp(e.imagePath, join(out, e.branch + '-' + e.id + ext))
    const { imagePath, imageUrl, ...rest } = e
    observations.push(rest)
  }
}

const record = { ...b }
for (const key of ['ownerId', 'sourceTaskId', 'importedDemo', 'recordedBuildId', 'recordedAt', 'importedAt', 'url', 'evidence', 'verificationKey', 'verificationSessionId'])
  delete record[key]
if (!record.observations && observations.length) record.observations = observations
record.candidates = b.candidates.map(({ previewUrl, ...c }) => c)
await writeFile(join(out, 'build.json'), JSON.stringify(record, null, 2) + '\n')

const html = await readFile(join(out, 'revision-' + promoted.revision, 'preview.html'), 'utf8')
if (hash(html) !== promoted.hash) throw Error('Promoted preview does not match its recorded hash.')
if (hash(record.contract) !== record.contractHash) throw Error('Contract does not match its recorded hash.')
console.log('Recorded', label, 'from build', b.id, '→', out)
