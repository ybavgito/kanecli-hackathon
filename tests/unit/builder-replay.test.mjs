import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { verificationWorkspace } from '../../server/builder/kane.mjs'
import { previewHandler } from '../../server/builder/preview.mjs'

test('replay workspace reuses a designed journey only for byte-identical requirements', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rk-replay-'))
  try {
    const first = await verificationWorkspace(root, 'Refund original payment: $75')
    assert.equal(first.testFile, null)
    await mkdir(join(first.directory, '.testmuai/tests'), { recursive: true })
    await writeFile(join(first.directory, '.testmuai/tests/fixture_test.md'), 'unit fixture')
    await writeFile(
      join(first.directory, 'designed-test.json'),
      JSON.stringify({ key: first.key, testFile: 'fixture_test.md' }),
    )
    const same = await verificationWorkspace(root, 'Refund original payment: $75')
    assert.equal(same.directory, first.directory)
    assert.equal(same.testFile, 'fixture_test.md')
    const changed = await verificationWorkspace(root, 'Refund original payment: $80')
    assert.notEqual(changed.directory, first.directory)
    assert.equal(changed.testFile, null)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('stable verification URL serves only the current sandbox candidate and rejects use sessions', async () => {
  const build = {
    id: 'abc123',
    verificationKey: 'private-test-key',
    verificationSessionId: 'test-session',
    candidates: [{ revision: 2, hash: 'hash' }],
  }
  const session = { id: 'test-session', buildId: build.id, revision: 2, mode: 'test' }
  const handler = previewHandler({
    builds: new Map([[build.id, build]]),
    sessions: new Map([[session.id, session]]),
    sessionTask: async () => ({ status: 'not_started', kind: 'return' }),
  })
  async function request(key) {
    let status, content
    await handler(
      {},
      {
        writeHead(s) {
          status = s
        },
        end(c) {
          content = c
        },
      },
      new URL('http://localhost/builder-preview/abc123/verify?key=' + key),
    )
    return { status, content }
  }
  assert.equal((await request('wrong')).status, 403)
  const passed = await request('private-test-key')
  assert.equal(passed.status, 200)
  assert.ok(passed.content.includes('/builder-artifact/abc123/2'))
  session.mode = 'use'
  assert.equal((await request('private-test-key')).status, 403)
})
