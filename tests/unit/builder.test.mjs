import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  sourceKind,
  buildContract,
  validateBridgeAction,
} from '../../server/builder/controller.mjs'
import { validateArtifact, compileArtifact, hash } from '../../server/builder/model.mjs'
import { extractedState, kaneEnvironment } from '../../server/kane-worker.mjs'
import { previewHandler } from '../../server/builder/preview.mjs'
const sources = { return: 'http://127.0.0.1:5174', appointment: 'http://127.0.0.1:5175' }
const artifact = {
  componentCode:
    'export default function TaskInterface({task}) { return <button disabled={!!task?.progress}>Validate</button> }',
  css: 'button { color: green; }',
  decisions: [
    { component: 'Validate', change: 'Expose current validation', evidenceIds: ['source-1'] },
  ],
}
test('URL-only remains an overview; an optional goal changes focus without weakening requirements', () => {
  const broad = buildContract('return', ''),
    focused = buildContract('return', 'Make printer-free return easier')
  assert.equal(broad.mode, 'overview')
  assert.equal(broad.goal, null)
  assert.equal(focused.mode, 'focused')
  assert.deepEqual(broad.requirements, focused.requirements)
})
test('execution scope accepts only exact configured synthetic source entrypoints', () => {
  assert.equal(sourceKind(sources.return + '/merchant', sources), 'return')
  for (const url of [
    'https://example.com',
    'http://127.0.0.1:5174/appointments',
    sources.return + '/merchant?taskId=other',
    'http://user:password@127.0.0.1:5174/merchant',
    sources.return + '/merchant#test',
    sources.return + '.evil.com',
  ])
    assert.throws(() => sourceKind(url, sources))
})
test('generated code cannot directly fetch, navigate, inject HTML or import dependencies', () => {
  validateArtifact(artifact)
  validateArtifact({
    ...artifact,
    componentCode:
      'export default function TaskInterface(){return <p>A printed label would require a printer. Check the return window.</p>}',
  })
  for (const code of [
    "fetch('/api/tasks')",
    'window.location = "https://example.com"',
    'eval("1")',
    'new Function("return 1")',
    'document.cookie',
    'import x from "other"',
    '<iframe />',
    '<div dangerouslySetInnerHTML={{__html:"x"}} />',
  ])
    assert.throws(() =>
      validateArtifact({ ...artifact, componentCode: artifact.componentCode + '\n' + code }),
    )
  assert.throws(() =>
    validateArtifact({ ...artifact, css: 'body {background:url(https://example.com)}' }),
  )
})
test('Kane subprocesses do not inherit the builder API credential', () => {
  const old = process.env.OPENAI_API_KEY
  process.env.OPENAI_API_KEY = 'test-private-value'
  assert.equal(kaneEnvironment().OPENAI_API_KEY, undefined)
  if (old === undefined) delete process.env.OPENAI_API_KEY
  else process.env.OPENAI_API_KEY = old
})
test('named nonsecret extraction overrides renamed summary without importing unrelated memory', () => {
  const result = extractedState({
    final_state: { refund: 'wrong' },
    context: {
      variables: {
        refund: { type: 'memory', secret: false, value: '75' },
        source_terms: { type: 'memory', secret: false, value: 'Observed terms' },
        password: { type: 'memory', secret: false, value: 'secret' },
        account_id: { type: 'memory', secret: true, value: 'hidden' },
      },
    },
  })
  assert.equal(result.refund, '75')
  assert.equal(result.source_terms, 'Observed terms')
  assert.equal(result.password, undefined)
  assert.equal(result.account_id, undefined)
})
test('React artifact compiles without executing candidate code and binds hash to bytes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'rk-builder-test-'))
  const oldEnvironment = process.env.NODE_ENV
  process.env.NODE_ENV = 'development' // Vite middleware sets this in the running app.
  try {
    const compiled = await compileArtifact(artifact, dir),
      html = await readFile(join(dir, 'preview.html'), 'utf8')
    assert.equal(hash(html), compiled.hash)
    assert.ok(html.includes('rk-ready'))
    assert.ok(html.includes('Validate'))
    assert.ok(!html.includes('process.env.NODE_ENV'))
    assert.ok(compiled.bytes > 0)
  } finally {
    if (oldEnvironment === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = oldEnvironment
    await rm(dir, { recursive: true, force: true })
  }
})

test('generated choices cannot weaken the frozen user contract or choose a source identity', () => {
  assert.deepEqual(validateBridgeAction('return', 'choice', { method: 'qr_dropoff' }), {
    method: 'qr_dropoff',
  })
  for (const payload of [
    { refundDestination: 'store_credit' },
    { taskId: 'another' },
    { noPrinter: false },
    { reason: 'too_small', approval: true },
  ])
    assert.throws(() => validateBridgeAction('return', 'choice', payload))
  assert.throws(() => validateBridgeAction('appointment', 'choice', { maxFeeCents: 2500 }))
  assert.throws(() => validateBridgeAction('return', 'check', { repair: 'true' }))
})

test('artifact serving rejects bytes changed after the recorded compilation', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rk-artifact-integrity-'))
  try {
    const id = 'abc123',
      html = '<!doctype html><title>Original</title>'
    const dir = join(root, id, 'candidates', '1')
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'preview.html'), html)
    const handler = previewHandler({
      root,
      builds: new Map([
        [
          id,
          {
            id,
            candidates: [{ revision: 1, hash: hash(html) }],
          },
        ],
      ]),
    })
    const request = async () => {
      let status, content
      await handler(
        {},
        {
          writeHead(code) {
            status = code
          },
          end(body) {
            content = body
          },
        },
        new URL('http://localhost/builder-artifact/' + id + '/1'),
      )
      return { status, content }
    }
    assert.deepEqual(await request(), { status: 200, content: html })
    await writeFile(join(dir, 'preview.html'), html + '<p>Changed</p>')
    const denied = await request()
    assert.equal(denied.status, 409)
    assert.ok(!denied.content.includes('<p>Changed</p>'))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
