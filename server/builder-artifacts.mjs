import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { mkdir, writeFile, realpath, lstat, open } from 'node:fs/promises'
import { constants } from 'node:fs'
import { dirname, join, resolve, relative, isAbsolute, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { parseAst } from 'rolldown/parseAst'
import { BUILDER_LIMITS, BuilderError, validateGeneratedArtifact } from './builder-generator.mjs'

const PROJECT_ROOT = fileURLToPath(new URL('../', import.meta.url))
const ID = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/
const MAX_HTML_BYTES = 2_000_000
const MAX_MANIFEST_BYTES = 200_000
const digest = value => createHash('sha256').update(value).digest('hex')
const scriptJson = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
const inside = (child, parent) => { const path = relative(parent, child); return !path.startsWith(`..${sep}`) && path !== '..' && !isAbsolute(path) }

function validateRenderCapabilities(source) {
  const ast = parseAst(source, { lang: 'jsx' }, 'App.jsx')
  const components = new Set()
  const nativeTags = new Set('div span section main aside header footer nav article h1 h2 h3 h4 h5 h6 p strong em b i small label input select option optgroup button fieldset legend textarea ul ol li dl dt dd table thead tbody tfoot tr th td caption progress meter details summary output hr br code pre svg path circle rect line polyline polygon g title desc hgroup abbr time sub sup address blockquote figure figcaption'.split(' '))
  const unsafeAccess = new Set(['createElement', 'cloneElement', 'createElementNS', 'getRootNode', 'view', 'ownerDocument', 'defaultView', 'contentWindow', 'contentDocument', 'getSelection', 'getElementsByTagName', 'getElementById', 'querySelector', 'querySelectorAll', 'attachShadow', 'insertAdjacentElement', 'insertAdjacentHTML', 'setHTMLUnsafe', 'navigation'])
  function walk(node, inspect) {
    if (!node || typeof node !== 'object') return
    inspect(node)
    for (const item of Object.values(node)) {
      if (Array.isArray(item)) item.forEach(child => walk(child, inspect))
      else if (item && typeof item === 'object') walk(item, inspect)
    }
  }
  walk(ast, node => {
    if (node.type === 'FunctionDeclaration' && node.id) components.add(node.id.name)
    if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && ['ArrowFunctionExpression', 'FunctionExpression'].includes(node.init?.type)) components.add(node.id.name)
  })
  const reject = () => { throw new BuilderError('invalid_artifact', 'Use explicit JSX attributes, native controls and locally declared function components; generated code cannot create dynamic HTML or access DOM roots.') }
  walk(ast, node => {
    if (node.type === 'JSXSpreadAttribute') reject()
    if (node.type === 'Identifier' && ['createElement', 'cloneElement', 'createElementNS', 'RTCPeerConnection', 'webkitRTCPeerConnection'].includes(node.name)) reject()
    if (node.type === 'MemberExpression' && unsafeAccess.has(node.property?.name || node.property?.value)) reject()
    if (node.type === 'Property' && unsafeAccess.has(node.key?.name || node.key?.value)) reject()
    if (node.type === 'JSXOpeningElement') {
      const name = node.name
      if (name.type === 'JSXIdentifier') {
        if (!nativeTags.has(name.name) && !components.has(name.name)) reject()
      } else if (!(name.type === 'JSXMemberExpression' && name.object?.name === 'React' && name.property?.name === 'Fragment')) reject()
    }
  })
}

function entrySource({ channel, actions, initialState }) {
  return `import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.jsx';
const channel=${scriptJson(channel)};
const allowed=new Set(${scriptJson(actions.map(action => action.id))});
const pending=new Map();
const instance=Array.from(crypto.getRandomValues(new Uint32Array(4)),value=>value.toString(16).padStart(8,'0')).join('');
let sequence=0;
function freeze(value){if(value&&typeof value==='object'){Object.freeze(value);Object.values(value).forEach(freeze)}return value}
const initialState=freeze(${scriptJson(initialState)});
const bridge=Object.freeze({invoke(actionId,payload={}){
  if(!allowed.has(actionId))return Promise.reject(new Error('This action is not available in this interface.'));
  if(pending.size>=4)return Promise.reject(new Error('Please wait for the current source check.'));
  let serialized;try{serialized=JSON.stringify(payload)}catch{return Promise.reject(new Error('Action data must be JSON.'))}
  if(!serialized||serialized.length>32000)return Promise.reject(new Error('Action data exceeds its size limit.'));
  const requestId=channel+':'+instance+':'+(++sequence);
  return new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>{pending.delete(requestId);reject(new Error('The source result is unknown. Check its status before retrying.'))},180000);
    pending.set(requestId,{resolve,reject,timeout});
    parent.postMessage({type:'raising-kane:action',channel,requestId,actionId,payload:JSON.parse(serialized)},'*');
  });
}});
addEventListener('message',event=>{
  const data=event.data;
  if(event.source!==parent||!data||data.type!=='raising-kane:result'||data.channel!==channel||typeof data.requestId!=='string')return;
  const request=pending.get(data.requestId);if(!request)return;
  pending.delete(data.requestId);clearTimeout(request.timeout);
  if(data.ok===true)request.resolve(data.result);
  else request.reject(new Error(typeof data.error==='string'?data.error.slice(0,800):'The source action was blocked.'));
});
class Boundary extends React.Component{
  constructor(props){super(props);this.state={failed:false}}
  static getDerivedStateFromError(){return {failed:true}}
  componentDidCatch(){parent.postMessage({type:'raising-kane:runtime-error',channel,message:'The generated interface could not render.'},'*')}
  render(){return this.state.failed?React.createElement('p',{role:'alert'},'This interface could not load. Return to Raising Kane to rebuild it.'):this.props.children}
}
createRoot(document.getElementById('root')).render(React.createElement(Boundary,null,React.createElement(App,{bridge,initialState})));
parent.postMessage({type:'raising-kane:ready',channel},'*');
`
}

/** The HTTP header is required; frame-ancestors and sandbox do not work in a meta CSP. */
export function artifactSecurityHeaders(scriptHash) {
  if (typeof scriptHash !== 'string' || !/^[A-Za-z0-9+/]{43}=$/.test(scriptHash)) throw new BuilderError('invalid_artifact', 'Invalid artifact script hash.')
  return {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': `default-src 'none'; script-src 'sha256-${scriptHash}'; style-src 'unsafe-inline'; img-src 'none'; font-src 'none'; connect-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'; sandbox allow-scripts`,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'no-store',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  }
}

/** Compile only fixed files, without running generated code, config, plugins or commands. */
export async function buildGeneratedArtifact({ artifact, contract, allowedActions = [], initialState = {}, buildId = randomUUID(), revision = 1, dataDir = process.env.RAISING_KANE_DATA_DIR || join(PROJECT_ROOT, 'data') }) {
  const candidate = validateGeneratedArtifact(artifact, { allowedActions })
  validateRenderCapabilities(candidate.appSource)
  if (!ID.test(buildId) || !Number.isSafeInteger(revision) || revision < 1 || revision > 1000) throw new BuilderError('invalid_artifact_path', 'Invalid build ID or revision.')
  const stateJson = JSON.stringify(initialState)
  if (!stateJson || Buffer.byteLength(stateJson) > 100_000) throw new BuilderError('invalid_artifact', 'Initial interface state exceeds its limit.')
  const contractJson = JSON.stringify(contract)
  if (!contractJson || Buffer.byteLength(contractJson) > 32_000) throw new BuilderError('invalid_artifact', 'A bounded independent task contract is required.')
  const baseDir = resolve(dataDir, 'generated')
  await mkdir(baseDir, { recursive: true, mode: 0o700 })
  const baseReal = await realpath(baseDir)
  const buildDir = join(baseReal, buildId)
  await mkdir(buildDir, { recursive: true, mode: 0o700 })
  if (!inside(await realpath(buildDir), baseReal) || (await lstat(buildDir)).isSymbolicLink()) throw new BuilderError('invalid_artifact_path', 'Build directory must be isolated.')
  const rootDir = join(buildDir, String(revision))
  // An existing revision is immutable, including a failed build's files.
  try { await mkdir(rootDir, { mode: 0o700 }) } catch (error) { if (error.code === 'EEXIST') throw new BuilderError('revision_exists', 'This artifact revision already exists. Use a new revision.'); throw error }
  const distDir = join(rootDir, 'dist')
  const sourceDir = join(rootDir, 'source')
  await mkdir(sourceDir, { mode: 0o700 })
  const bridgeChannel = randomBytes(24).toString('hex')
  const appPath = join(sourceDir, 'App.jsx')
  const entryPath = join(sourceDir, 'main.jsx')
  await writeFile(appPath, candidate.appSource, { flag: 'wx', mode: 0o600 })
  await writeFile(join(sourceDir, 'styles.css'), candidate.css, { flag: 'wx', mode: 0o600 })
  await writeFile(entryPath, entrySource({ channel: bridgeChannel, actions: candidate.actions, initialState: JSON.parse(stateJson) }), { flag: 'wx', mode: 0o600 })
  // Neither fixture source, task contract nor evaluator is in the generated workspace.
  const dependencyRoots = ['react', 'react-dom', 'scheduler'].map(name => dirname(fileURLToPath(import.meta.resolve(`${name}/package.json`))))
  const reactPath = fileURLToPath(import.meta.resolve('react'))
  const jsxRuntimePath = fileURLToPath(import.meta.resolve('react/jsx-runtime'))
  const reactClientPath = fileURLToPath(import.meta.resolve('react-dom/client'))
  const isolationPlugin = {
    name: 'raising-kane-isolated-artifact', enforce: 'pre',
    resolveId(source, importer) {
      if (importer?.split('?')[0] === appPath && source !== 'react' && !source.startsWith('react/')) throw new Error('Generated modules can import only React.')
      if (source === 'react') return reactPath
      if (source === 'react/jsx-runtime') return jsxRuntimePath
      if (source === 'react-dom/client') return reactClientPath
      return null
    },
    load(id) {
      const file = id.split('?')[0]
      if (isAbsolute(file) && file !== entryPath && file !== appPath && !dependencyRoots.some(root => inside(file, root))) throw new Error('Build attempted to read outside approved generated files and React runtime.')
      return null
    },
  }
  let result
  try {
    result = await build({
      root: sourceDir, base: './', configFile: false, envFile: false, envDir: sourceDir, publicDir: false, logLevel: 'silent',
      plugins: [isolationPlugin], define: { 'process.env.NODE_ENV': '"production"' },
      build: { write: false, emptyOutDir: false, outDir: distDir, sourcemap: false, minify: true, target: 'es2022', modulePreload: false,
        lib: { entry: entryPath, name: 'RaisingKaneGenerated', formats: ['iife'], fileName: () => 'interface.js' },
      },
    })
  } catch (error) {
    const detail = String(error.message || '').replace(/Bearer\s+\S+|\b(?:sk-|khk_)[\w-]{12,}/gi, '[redacted]').replaceAll(PROJECT_ROOT, '[workspace]/').slice(0, 1800)
    await writeFile(join(rootDir, 'build-error.json'), JSON.stringify({ code: 'artifact_compile_failed', detail }, null, 2), { flag: 'wx', mode: 0o600 })
    throw new BuilderError('artifact_compile_failed', `The generated interface did not compile: ${detail}`, { rootDir, revision })
  }
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(item => item.output || [])
  const chunks = outputs.filter(item => item.type === 'chunk')
  if (chunks.length !== 1 || outputs.some(item => item.type !== 'chunk') || chunks[0].imports.length || chunks[0].dynamicImports.length) throw new BuilderError('artifact_compile_failed', 'Generated interface must compile to one self-contained script.')
  // Escaping script end tags prevents a model-authored string from escaping the element.
  const script = chunks[0].code.replace(/<\/script/gi, '<\\/script')
  const scriptHash = createHash('sha256').update(script).digest('base64')
  const headers = artifactSecurityHeaders(scriptHash)
  const metaPolicy = headers['Content-Security-Policy'].split('; ').filter(item => !item.startsWith('frame-ancestors') && !item.startsWith('sandbox')).join('; ')
  const html = `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${escapeHtml(metaPolicy)}"><title>${escapeHtml(candidate.title)} · Raising Kane</title><style>html{color-scheme:light}body{margin:0;font-family:system-ui,sans-serif}*{box-sizing:border-box}:focus-visible{outline:3px solid #17684c;outline-offset:3px}${candidate.css}</style></head><body><div id="root"></div><script>${script}</script></body></html>`
  if (Buffer.byteLength(html) > MAX_HTML_BYTES) throw new BuilderError('artifact_compile_failed', 'The bundled interface exceeds its size limit.')
  const artifactDigest = digest(html)
  const manifest = {
    id: buildId, revision, title: candidate.title, summary: candidate.summary, digest: artifactDigest,
    contractDigest: digest(contractJson), sourceDigest: digest(candidate.appSource + '\n' + candidate.css),
    bridgeChannel, scriptHash, actions: candidate.actions, evidenceIds: candidate.evidenceIds, decisions: candidate.decisions,
    unknowns: candidate.unknowns, createdAt: new Date().toISOString(), status: 'unverified', files: ['index.html'],
  }
  await mkdir(distDir, { mode: 0o700 })
  await writeFile(join(distDir, 'index.html'), html, { flag: 'wx', mode: 0o600 })
  await writeFile(join(rootDir, 'manifest.json'), JSON.stringify(manifest, null, 2), { flag: 'wx', mode: 0o600 })
  return { id: buildId, revision, rootDir, distDir, entryPath: join(distDir, 'index.html'), digest: artifactDigest, manifest, bridgeChannel, headers }
}

/** Serve only the compiled public entry, never source, metadata, credentials or paths. */
export async function readGeneratedAsset({ rootDir, assetPath = 'index.html' }) {
  if (typeof rootDir !== 'string' || !isAbsolute(rootDir) || typeof assetPath !== 'string' || assetPath !== 'index.html') throw new BuilderError('artifact_not_found', 'Generated asset was not found.')
  const root = await artifactRoot(rootDir)
  const manifest = await artifactManifest(root)
  const body = await boundedArtifactFile(root, ['dist', 'index.html'], MAX_HTML_BYTES)
  if (digest(body) !== manifest.digest) throw new BuilderError('artifact_integrity_failed', 'The saved generated artifact failed its integrity check.')
  return { body, headers: artifactSecurityHeaders(manifest.scriptHash), contentType: 'text/html; charset=utf-8' }
}

async function artifactRoot(rootDir) {
  try {
    const stat = await lstat(rootDir)
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('Invalid root')
    return await realpath(rootDir)
  } catch { throw new BuilderError('artifact_not_found', 'Generated artifact was not found.') }
}

// File names come only from callers in this module. Check sizes before allocating,
// and refuse symlinks again at open rather than relying solely on an earlier lstat.
async function boundedArtifactFile(root, segments, maxBytes) {
  let handle
  try {
    let folder = root
    for (const segment of segments.slice(0, -1)) {
      folder = join(folder, segment)
      const stat = await lstat(folder)
      if (stat.isSymbolicLink() || !stat.isDirectory() || !inside(await realpath(folder), root)) throw new Error('Invalid folder')
    }
    const path = join(folder, segments.at(-1))
    handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW)
    const stat = await handle.stat()
    if (!stat.isFile() || stat.size > maxBytes || !inside(await realpath(path), root)) throw new Error('Invalid file')
    const buffer = await handle.readFile()
    if (buffer.length > maxBytes) throw new Error('File exceeds limit')
    return buffer
  } catch { throw new BuilderError('artifact_not_found', 'Generated artifact was not found or exceeds its size limit.') }
  finally { await handle?.close() }
}

async function artifactManifest(root) {
  const buffer = await boundedArtifactFile(root, ['manifest.json'], MAX_MANIFEST_BYTES)
  let manifest
  try { manifest = JSON.parse(buffer.toString('utf8')) } catch { throw new BuilderError('artifact_integrity_failed', 'The saved generated artifact manifest is invalid.') }
  if (!manifest || !/^[a-f0-9]{64}$/.test(manifest.digest) || !/^[a-f0-9]{64}$/.test(manifest.sourceDigest) || !Number.isSafeInteger(manifest.revision)) throw new BuilderError('artifact_integrity_failed', 'The saved generated artifact manifest is invalid.')
  return manifest
}

/** Read-only code inspection: callers must authorize the build/revision before using this. */
export async function readGeneratedSource({ rootDir }) {
  if (typeof rootDir !== 'string' || !isAbsolute(rootDir)) throw new BuilderError('artifact_not_found', 'Generated source was not found.')
  const root = await artifactRoot(rootDir)
  const files = []
  for (const [name, limit] of [['App.jsx', BUILDER_LIMITS.source], ['styles.css', BUILDER_LIMITS.css]]) {
    files.push({ name, content: (await boundedArtifactFile(root, ['source', name], limit)).toString('utf8') })
  }
  const manifest = await artifactManifest(root)
  const sourceDigest = digest(files[0].content + '\n' + files[1].content)
  if (sourceDigest !== manifest.sourceDigest) throw new BuilderError('artifact_integrity_failed', 'The saved generated source failed its integrity check.')
  return { revision: manifest.revision, sourceDigest, files }
}
