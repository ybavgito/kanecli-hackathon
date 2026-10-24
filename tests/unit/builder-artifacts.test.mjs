import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, rm, symlink, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash, webcrypto } from 'node:crypto'
import { runInNewContext } from 'node:vm'
import { buildGeneratedArtifact, readGeneratedAsset, readGeneratedSource, artifactSecurityHeaders } from '../../server/builder-artifacts.mjs'

const dataDir = await mkdtemp(join(tmpdir(), 'raising-kane-artifacts-'))
test.after(() => rm(dataDir, { recursive: true, force: true }))
const artifact = () => ({
  title: 'An observed review', summary: 'Review the terms before proceeding.',
  appSource: `import React,{useState} from 'react';
export default function App({bridge,initialState}){
 const [status,setStatus]=useState('Ready');
 return <section><h1>Review your choice</h1><p>{initialState.method}</p><button type="button" onClick={async()=>{try{const result=await bridge.invoke('review',{});setStatus(result.status)}catch(error){setStatus(error.message)}}}>Check current terms</button><p role="status">{status}</p></section>
}`,
  css: 'section{padding:1rem;max-width:40rem}button{min-height:44px}',
  actions: [{ id: 'review', label: 'Check current terms', evidenceIds: ['screen-1'] }],
  evidenceIds: ['screen-1'], decisions: ['Use a direct review step based on observed terms.'], unknowns: ['Saved outcome'],
})
const build = (overrides = {}) => buildGeneratedArtifact({ artifact: artifact(), contract: { goal: 'Review terms', required: ['identity', 'fee'] }, allowedActions: [{ id: 'review' }], initialState: { method: 'Observed method' }, dataDir, ...overrides })

test('React compiles without execution into one self-contained, hashed, unverified artifact', async () => {
  const contract = { goal: 'Review terms', required: ['identity', 'fee'] }
  const built = await build({ buildId: 'bundle', contract })
  const saved = await readGeneratedAsset({ rootDir: built.rootDir })
  const html = saved.body.toString()
  assert.equal(built.manifest.status, 'unverified')
  assert.equal(built.manifest.contractDigest, createHash('sha256').update(JSON.stringify(contract)).digest('hex'))
  assert.equal(built.digest, createHash('sha256').update(saved.body).digest('hex'))
  assert.equal(built.entryPath, join(built.distDir, 'index.html'))
  assert.match(html, /Review your choice/)
  assert.match(html, /raising-kane:action/)
  assert.match(html, /raising-kane:result/)
  assert.match(html, /Observed method/)
  assert.doesNotMatch(html, /<script[^>]+src=/)
  assert.doesNotMatch(html, /import\s+.*from\s+["']/)
  const script = html.match(/<script>([\s\S]*)<\/script>/)[1]
  const hash = createHash('sha256').update(script).digest('base64')
  assert.equal(hash, built.manifest.scriptHash)
  assert.ok(saved.headers['Content-Security-Policy'].includes(`script-src 'sha256-${hash}'`))
  assert.match(saved.headers['Content-Security-Policy'], /connect-src 'none'/)
  assert.match(saved.headers['Content-Security-Policy'], /sandbox allow-scripts/)
  assert.doesNotMatch(saved.headers['Content-Security-Policy'], /allow-same-origin|unsafe-eval/)
  assert.equal(await readFile(join(built.rootDir, 'source', 'App.jsx'), 'utf8'), artifact().appSource)
})

test('revision storage is immutable and channels are generated independently per revision', async () => {
  const first = await build({ buildId: 'versions', revision: 1 })
  await assert.rejects(build({ buildId: 'versions', revision: 1 }), { code: 'revision_exists' })
  const second = await build({ buildId: 'versions', revision: 2 })
  assert.notEqual(first.bridgeChannel, second.bridgeChannel)
  assert.equal(first.manifest.sourceDigest, second.manifest.sourceDigest)
  assert.notEqual(first.digest, second.digest)
})

test('artifact paths cannot escape and the public reader cannot expose generated source or manifest', async () => {
  for (const buildId of ['../escape', '/tmp/escape', 'ok/../../escape', '..', 'bad%2fpath']) await assert.rejects(build({ buildId }), { code: 'invalid_artifact_path' })
  const built = await build({ buildId: 'paths' })
  for (const assetPath of ['../manifest.json', 'manifest.json', '../source/App.jsx', 'source/App.jsx', '/etc/passwd', 'index.html?x=1', '%2e%2e/manifest.json', 'assets/../../manifest.json']) {
    await assert.rejects(readGeneratedAsset({ rootDir: built.rootDir, assetPath }), { code: 'artifact_not_found' })
  }
})

test('symlink build directories and symlink public assets are refused', async () => {
  const outside = join(dataDir, 'outside')
  await mkdir(outside)
  await mkdir(join(dataDir, 'generated'), { recursive: true })
  await symlink(outside, join(dataDir, 'generated', 'redirected'))
  await assert.rejects(build({ buildId: 'redirected' }), { code: 'invalid_artifact_path' })
  const built = await build({ buildId: 'asset-symlink' })
  await writeFile(join(outside, 'index.html'), '<p>not the artifact</p>')
  await rm(built.entryPath)
  await symlink(join(outside, 'index.html'), built.entryPath)
  await assert.rejects(readGeneratedAsset({ rootDir: built.rootDir }), { code: 'artifact_not_found' })
})

test('tampering with a compiled artifact fails its digest check', async () => {
  const built = await build({ buildId: 'tamper' })
  await writeFile(built.entryPath, '<p>replaced</p>')
  await assert.rejects(readGeneratedAsset({ rootDir: built.rootDir }), { code: 'artifact_integrity_failed' })
})

test('source dependencies and imported server files are denied before compilation', async () => {
  for (const source of ["import secrets from '../../.env';export default()=>null", "import data from 'node:fs';export default()=>null", "export default()=>import('../../server/index.mjs')"]) {
    await assert.rejects(build({ artifact: { ...artifact(), appSource: source } }), { code: 'invalid_artifact' })
  }
})

test('render aliases and prop spreads cannot bypass the iframe URL restrictions', async () => {
  for (const source of [
    `import React from 'react'; export default()=>React.createElement('a',{href:'https://example.test'},'Leave')`,
    `import React from 'react';const Link='a';const attrs={href:'https://example.test'};export default()=> <Link {...attrs}>Leave</Link>`,
    `import React from 'react';export default()=> <button onClick={event=>event.view.navigation.navigate('https://example.test')}>Leave</button>`,
  ]) await assert.rejects(build({ artifact: { ...artifact(), appSource: source, actions: [] } }), { code: 'invalid_artifact' })
  const safe = { ...artifact(), appSource: `import React from 'react';function Status({label}){return <p role="status">{label}</p>}export default()=> <React.Fragment><Status label="Observed terms"/></React.Fragment>`, actions: [] }
  assert.equal((await build({ buildId: 'local-components', artifact: safe })).manifest.status, 'unverified')
})

test('embedded state and title cannot escape the trusted script or HTML elements', async () => {
  const text = '</script><script>BAD_STATE_EXECUTION()</script>'
  const built = await build({ buildId: 'escaping', artifact: { ...artifact(), title: '<script>BAD_TITLE()</script>' }, initialState: { method: text } })
  const { body } = await readGeneratedAsset({ rootDir: built.rootDir })
  const html = body.toString()
  assert.equal((html.match(/<\/script>/g) || []).length, 1)
  assert.doesNotMatch(html, /<\/script><script>BAD_STATE_EXECUTION/)
  assert.match(html, /&lt;script&gt;BAD_TITLE\(\)&lt;\/script&gt;/)
})

test('security header function refuses attacker-controlled CSP hash fragments', () => {
  for (const hash of ['', "anything'; connect-src *", 'sha256-aaa']) assert.throws(() => artifactSecurityHeaders(hash))
})

test('code inspection returns only the two generated source files and verifies their digest', async () => {
  const built = await build({ buildId: 'source-inspection' })
  const inspected = await readGeneratedSource({ rootDir: built.rootDir })
  assert.deepEqual(inspected.files.map(file => file.name), ['App.jsx', 'styles.css'])
  assert.equal(inspected.sourceDigest, built.manifest.sourceDigest)
  assert.equal(inspected.files[0].content, artifact().appSource)
  assert.ok(!JSON.stringify(inspected).includes(built.bridgeChannel))
  await writeFile(join(built.rootDir, 'source', 'App.jsx'), 'export default ()=>null')
  await assert.rejects(readGeneratedSource({ rootDir: built.rootDir }), { code: 'artifact_integrity_failed' })
})

test('source inspection rejects symlinks, oversized files and malformed manifests without exposing paths', async () => {
  const built = await build({ buildId: 'source-reader-limits' })
  const sourcePath = join(built.rootDir, 'source', 'App.jsx')
  await rm(sourcePath)
  await symlink(join(built.rootDir, 'manifest.json'), sourcePath)
  await assert.rejects(readGeneratedSource({ rootDir: built.rootDir }), { code: 'artifact_not_found' })
  await rm(sourcePath)
  await writeFile(sourcePath, 'x'.repeat(90_001))
  await assert.rejects(readGeneratedSource({ rootDir: built.rootDir }), { code: 'artifact_not_found' })
  await writeFile(sourcePath, artifact().appSource)
  await writeFile(join(built.rootDir, 'manifest.json'), '{not-json')
  await assert.rejects(readGeneratedSource({ rootDir: built.rootDir }), { code: 'artifact_integrity_failed' })
  await assert.rejects(readGeneratedSource({ rootDir: join(built.rootDir, 'missing') }), error => error.code === 'artifact_not_found' && !error.message.includes(dataDir))
})

test('trusted bridge distinguishes iframe reloads and ignores an old document reply', async () => {
  const built = await build({ buildId: 'bridge-reload' })
  // Exercise only our trusted bridge wrapper. The model-authored App.jsx is never
  // evaluated by Node; its static import is replaced with a non-executing symbol.
  const runtime = (await readFile(join(built.rootDir, 'source', 'main.jsx'), 'utf8')).replace(/^import[^\n]+;\n/gm, '')
  const boot = () => {
    const messages = [], listeners = new Map()
    let tree
    const parent = { postMessage: message => messages.push(message) }
    runInNewContext(runtime, {
      App: Symbol('unexecuted-app'),
      React: { Component: class {}, createElement: (type, props, ...children) => ({ type, props, children }) },
      createRoot: () => ({ render: value => { tree = value } }),
      document: { getElementById: () => ({}) }, crypto: webcrypto, parent,
      addEventListener: (name, listener) => listeners.set(name, listener),
      setTimeout: () => 1, clearTimeout: () => {},
    }, { timeout: 1000 })
    return { bridge: tree.children[0].props.bridge, messages, reply: data => listeners.get('message')({ source: parent, data }) }
  }
  const oldFrame = boot(), newFrame = boot()
  const oldPromise = oldFrame.bridge.invoke('review', {})
  const newPromise = newFrame.bridge.invoke('review', {})
  const oldRequest = oldFrame.messages.find(message => message.type === 'raising-kane:action')
  const newRequest = newFrame.messages.find(message => message.type === 'raising-kane:action')
  assert.notEqual(oldRequest.requestId, newRequest.requestId)
  assert.ok(newRequest.requestId.length <= 180)
  let resolved = false
  newPromise.then(() => { resolved = true })
  newFrame.reply({ type: 'raising-kane:result', channel: built.bridgeChannel, requestId: oldRequest.requestId, ok: true, result: { status: 'stale' } })
  await Promise.resolve()
  assert.equal(resolved, false)
  const reply = request => ({ type: 'raising-kane:result', channel: built.bridgeChannel, requestId: request.requestId, ok: true, result: { status: 'current' } })
  newFrame.reply(reply(newRequest)); oldFrame.reply(reply(oldRequest))
  assert.equal((await newPromise).status, 'current')
  await oldPromise
  await assert.rejects(newFrame.bridge.invoke('unapproved-action', {}), /not available/)
})
