import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { recordedDemoCatalog, importRecordedDemo } from '../../server/builder/demo.mjs'
import { hash } from '../../server/builder/model.mjs'
test('recorded demo imports exact verified bytes with a new owner and no live task or approval', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rk-demo-'))
  try {
    assert.ok((await recordedDemoCatalog()).some((d) => d.id === 'northstar'))
    const b = await importRecordedDemo('northstar', {
      root,
      ownerId: 'new-owner',
      baseUrl: 'http://localhost:6000',
      sourceUrls: { return: 'http://localhost:6001', appointment: 'http://localhost:6002' },
    })
    assert.equal(b.ownerId, 'new-owner')
    assert.notEqual(b.id, b.recordedBuildId)
    assert.equal(b.importedDemo, 'northstar')
    const c = b.candidates.find((c) => c.revision === b.promotedRevision)
    assert.equal(
      hash(
        await readFile(join(root, b.id, 'candidates', String(c.revision), 'preview.html'), 'utf8'),
      ),
      c.hash,
    )
    assert.equal(b.taskId, undefined)
    assert.equal(b.approval, undefined)
    assert.ok(b.evidence.some((e) => e.imageUrl?.includes(b.id)))
    await assert.rejects(importRecordedDemo('../northstar', { root }), /unavailable/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
