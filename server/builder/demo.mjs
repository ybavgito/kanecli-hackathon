import { readFile, readdir, mkdir, cp } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { hash } from './model.mjs'
const evidenceRoot = fileURLToPath(
  new URL('../../docs/raising-kane/evidence/builder/', import.meta.url),
)
const labels = ['store-overview', 'store-focused', 'northstar', 'linden']
export async function recordedDemoCatalog() {
  const demos = []
  for (const label of labels)
    try {
      const b = JSON.parse(await readFile(join(evidenceRoot, label, 'build.json'), 'utf8'))
      const c = b.candidates.find((c) => c.revision === b.promotedRevision)
      if (
        b.status !== 'ready' ||
        c?.verification?.status !== 'passed' ||
        !c.verification.sourceMatch
      )
        continue
      const html = await readFile(
        join(evidenceRoot, label, 'revision-' + c.revision, 'preview.html'),
        'utf8',
      )
      if (hash(html) !== c.hash || hash(b.contract) !== b.contractHash) continue
      demos.push({
        id: label,
        title:
          label === 'store-overview'
            ? 'Store overview'
            : label === 'store-focused'
              ? 'Focused store return'
              : b.kind === 'return'
                ? 'Verified return interface'
                : 'Verified appointment interface',
        recordedAt: c.verification.at,
      })
    } catch {}
  return demos
}
export async function importRecordedDemo(label, { root, ownerId, baseUrl, sourceUrls }) {
  if (!(await recordedDemoCatalog()).some((d) => d.id === label))
    throw Error('This recorded demo is unavailable or its artifact digest does not match.')
  const source = join(evidenceRoot, label),
    recorded = JSON.parse(await readFile(join(source, 'build.json'), 'utf8'))
  const id = randomUUID(),
    directory = join(root, id)
  await mkdir(directory, { recursive: true })
  const b = {
    ...recorded,
    id,
    ownerId,
    sourceTaskId: randomUUID(),
    importedDemo: label,
    recordedBuildId: recorded.id,
    recordedAt: recorded.updatedAt,
    importedAt: new Date().toISOString(),
    url:
      sourceUrls[recorded.kind] +
      (label.startsWith('store-')
        ? '/store'
        : recorded.kind === 'return'
          ? '/merchant'
          : '/appointments'),
    error: null,
    evidence: [],
  }
  for (const c of b.candidates) {
    const from = join(source, 'revision-' + c.revision),
      to = join(directory, 'candidates', String(c.revision))
    await mkdir(join(to, 'verification', '.testmuai/tests'), { recursive: true })
    for (const name of await readdir(from).catch(() => [])) {
      if (['preview.html', 'artifact.json'].includes(name))
        await cp(join(from, name), join(to, name))
      else if (name.endsWith('_test.md'))
        await cp(join(from, name), join(to, 'verification', '.testmuai/tests', name))
      else if (
        ['requirements.md', 'coverage.json', 'verification-events.json'].includes(name) ||
        /^step-\d+\.jpg$/.test(name)
      )
        await cp(join(from, name), join(to, 'verification', name))
    }
    c.previewUrl = baseUrl + '/builder-preview/' + id + '/' + c.revision
    try {
      if (hash(await readFile(join(to, 'preview.html'), 'utf8')) !== c.hash) throw Error('digest')
    } catch {
      delete c.hash
      delete c.previewUrl
    }
    if (c.revision === b.promotedRevision && !c.hash)
      throw Error('Recorded promoted artifact failed its integrity check.')
  }
  const names = await readdir(source)
  for (const screen of b.sourceMap.screens) {
    const name = names.find((n) => n.startsWith('explore-' + screen.id + '.'))
    let imagePath = null,
      imageUrl = null
    if (name) {
      imagePath = join(directory, 'source-map', name)
      await mkdir(dirname(imagePath), { recursive: true })
      await cp(join(source, name), imagePath)
      imageUrl = '/api/builder/' + id + '/image/source-map/' + name
    }
    b.evidence.push({
      id: screen.id,
      branch: 'explore',
      facts: screen,
      shots: [],
      at: b.sourceMap.capturedAt,
      imagePath,
      imageUrl,
    })
  }
  for (const observation of b.observations || []) {
    const name = names.find((n) => n.startsWith(observation.branch + '-' + observation.id + '.'))
    let imagePath = null,
      imageUrl = null
    if (name) {
      imagePath = join(directory, 'observations', name)
      await mkdir(dirname(imagePath), { recursive: true })
      await cp(join(source, name), imagePath)
      imageUrl = '/api/builder/' + id + '/image/observations/' + name
    }
    b.evidence.push({ ...observation, status: 'recorded', imagePath, imageUrl })
  }
  b.evidence.push({
    id: 'user-contract',
    branch: 'contract',
    facts: b.contract,
    shots: [],
    at: b.createdAt,
  })
  return b
}
