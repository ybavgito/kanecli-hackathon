import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, resolve, relative } from 'node:path'
import { tmpdir } from 'node:os'
import { projectRoot, reportDirectory, requireSharedProject, requireKane, runKane, writeReport, checkPlan, suiteOutcome, validateUrl } from './lib/kane-tools.mjs'

const uiTests = ['reject-unsupported-url-scheme', 'reject-embedded-credential-url']
const publicTests = ['accept-http-without-task-description', 'accept-https-without-task-description', 'accept-optional-task-description', 'inspect-actual-unfamiliar-site-without-changing-it', 'show-honest-status-for-blocked-page', 'inspect-order-before-site-wide-browsing', 'inspect-unrelated-actions-without-carrying-over-another-site']
const usage = `Raising Kane generated regression suite
  npm run verify:kane:plan
  npm run verify:kane:suite -- [--suite ui|public|all] [--parallel N] [--dry-run]
  npm run verify:kane:suite -- --recordings-from data/verification/kane-suite-XXXXXX
  npm run verify:kane:suite -- .testmuai/tests/NAME_test.md [more files]
  KANE_URL=https://your-deployment.example npm run verify:kane:cloud -- --dry-run
Environment: KANE_URL overrides only start_url; KANE_PARALLEL defaults to 2.
Every execution first validates the exact selection with Kane --dry-run.
Only generated files directly in .testmuai/tests are selected; ui is the default.
Replay healing is off, preserving the existing regression policy; --adaptive-heal opts in.
Cloud is explicit, requires a public HTTPS KANE_URL and the remote-execution plugin.`

function options(argv) {
  const result = { suite: 'ui', parallel: process.env.KANE_PARALLEL ?? '2', dryRun: false, remote: false, heal: false, files: [] }
  if (/^\d+$/.test(argv[0] ?? '')) result.parallel = argv.shift() // legacy shell wrapper's worker argument
  while (argv.length) {
    const argument = argv.shift()
    if (argument === '--help') return { help: true }
    if (argument === '--dry-run') result.dryRun = true
    else if (argument === '--remote') result.remote = true
    else if (argument === '--adaptive-heal') result.heal = true
    else if (argument === '--no-adaptive-heal') result.heal = false
    else if (argument === '--headless' || argument === '--agent') continue
    else if (['--suite', '--parallel', '--match', '--recordings-from'].includes(argument)) {
      const value = argv.shift()
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${argument}.`)
      result[argument.slice(2)] = value
    } else if (argument.endsWith('_test.md') && !argument.startsWith('-')) result.files.push(argument)
    else throw new Error(`Unsupported suite option: ${argument}. Use --help for the supported options.`)
  }
  if (!/^[1-9]\d*$/.test(String(result.parallel))) throw new Error('Parallel workers must be a positive integer.')
  if (!['ui', 'public', 'all'].includes(result.suite)) throw new Error('Suite must be ui, public, or all.')
  if (result.remote && result['recordings-from']) throw new Error('Cloud runs author from the generated requirements against the deployment; local recordings cannot be reused there.')
  if (result['recordings-from'] && !existsSync(resolve(projectRoot, result['recordings-from'], '.testmuai/tests'))) throw new Error('The recordings folder must be a previous linked run folder containing .testmuai/tests/.')
  return result
}

function selectTests(config) {
  const directory = resolve(projectRoot, '.testmuai/tests')
  const names = config.files.length ? config.files.map(file => {
    if (resolve(projectRoot, file) !== resolve(directory, basename(file))) throw new Error('Name generated tests directly under .testmuai/tests/.')
    return basename(file)
  }) : config.suite === 'all' ? readdirSync(directory).filter(file => file.endsWith('_test.md') && /^---\r?\nassurance:/m.test(readFileSync(resolve(directory, file), 'utf8'))) : (config.suite === 'ui' ? uiTests : publicTests).map(name => `${name}_test.md`)
  const selected = [...new Set(names)].filter(name => !config.match || new RegExp(config.match).test(`.testmuai/tests/${name}`)).sort()
  if (!selected.length) throw new Error('No generated tests matched; no run was started.')
  return selected.map(name => {
    const source = resolve(directory, name)
    const content = readFileSync(source, 'utf8')
    if (!/^---\r?\nassurance:/m.test(content)) throw new Error(`${name} is not an assurance-generated test.`)
    if (config.remote && ![...uiTests, ...publicTests].includes(name.replace(/_test\.md$/, ''))) throw new Error('Cloud selection is limited to the public/read-only generated tests; prepared human browser connections remain local.')
    return { name, source, content }
  })
}

function selectedVariables(tests, config) {
  const required = [...new Set(tests.flatMap(test => [...test.content.matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g)].map(match => match[1])))].filter(name => !name.startsWith('smart.'))
  const directory = resolve(projectRoot, '.testmuai/variables')
  const pools = existsSync(directory) ? readdirSync(directory).filter(file => file.endsWith('.json')).sort().map(file => JSON.parse(readFileSync(resolve(directory, file), 'utf8'))) : []
  const selected = {}, missing = []
  for (const name of required) {
    const entries = pools.filter(pool => Object.hasOwn(pool, name)).map(pool => pool[name])
    if (name === 'start_url' && process.env.KANE_URL) selected[name] = { value: process.env.KANE_URL, secret: false }
    else if (entries.length > 1 && entries.some(entry => JSON.stringify(entry) !== JSON.stringify(entries[0]))) throw new Error(`Conflicting definitions for ${name} in .testmuai/variables; keep one authoritative value.`)
    else if (entries.length) selected[name] = entries[0]
    const value = selected[name]?.value
    if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) missing.push(name)
    if (config.remote && selected[name] && (selected[name].secret === true || /password|secret|token|key|credential|otp/i.test(name))) throw new Error(`Cloud public regression refuses secret variable ${name}.`)
    if (value && /(?:^|_)url$/.test(name)) validateUrl(value, { remote: config.remote, httpsOnly: config.remote && name === 'start_url' })
  }
  if (missing.length) throw new Error(`Required variables are empty: ${missing.join(', ')}. Fill their real values in .testmuai/variables/assurance.json; values are never printed by this wrapper.`)
  if (config.remote && !process.env.KANE_URL) throw new Error('Set KANE_URL to the deployed public HTTPS app for an explicit cloud target.')
  validateUrl(selected.start_url?.value, { remote: config.remote })
  return selected
}

function stageSuite(tests, variables, config) {
  // A linked scratch folder keeps URL overrides and unrelated variable values out of the source folder.
  // It is also the entire cloud payload, so a cloud run cannot upload the repository's data or .env files.
  mkdirSync(reportDirectory, { recursive: true })
  const workspace = mkdtempSync(resolve(config.remote ? tmpdir() : reportDirectory, 'kane-suite-'))
  const directory = resolve(workspace, '.testmuai/tests')
  mkdirSync(directory, { recursive: true })
  mkdirSync(resolve(workspace, '.testmuai/variables'), { recursive: true })
  cpSync(resolve(projectRoot, '.testmuai/assurance.json'), resolve(workspace, '.testmuai/assurance.json'))
  writeFileSync(resolve(workspace, '.testmuai/variables/assurance.json'), `${JSON.stringify(variables, null, 2)}\n`, { mode: 0o600 })
  for (const test of tests) {
    cpSync(test.source, resolve(directory, test.name))
    const recording = resolve(config['recordings-from'] ? resolve(projectRoot, config['recordings-from']) : projectRoot, '.testmuai/tests', `output-${test.name.replace(/_test\.md$/, '')}`)
    // Metadata alone (as in a clean Git checkout) is not a usable replay recording.
    const hasActions = existsSync(recording) && readdirSync(recording, { recursive: true }).some(file => String(file).endsWith('actions.ndjson'))
    if (!config.remote && hasActions) cpSync(recording, resolve(directory, basename(recording)), { recursive: true })
  }
  return workspace
}

async function main() {
  const config = options(process.argv.slice(2))
  if (config.help) { console.log(usage); return }
  const project = requireSharedProject()
  const tests = selectTests(config)
  const variables = selectedVariables(tests, config)
  const version = await requireKane()
  const workspace = stageSuite(tests, variables, config)
  const args = ['testrun', 'run', ...tests.map(test => `.testmuai/tests/${test.name}`), '--parallel', String(config.parallel), '--name', `Raising Kane ${config.suite} regression`, '--agent', ...(!config.heal ? ['--no-adaptive-heal'] : []), ...(config.remote ? ['--remote'] : ['--headless'])]
  const metadata = { project, cliVersion: version, remote: config.remote, suite: config.files.length ? 'explicit' : config.suite, files: tests.map(test => `.testmuai/tests/${test.name}`), parallel: Number(config.parallel), adaptiveHealing: config.heal, workspace: relative(projectRoot, workspace) }
  console.error(`Validating ${tests.length} generated tests, ${config.parallel} workers, ${config.remote ? 'cloud grid' : 'local headless Chrome'}. No website credentials are requested.`)
  const planResult = await runKane([...args, '--dry-run'], { cwd: workspace })
  checkPlan(planResult, tests.length)
  if (config.dryRun) {
    writeReport('kane-suite', { ...metadata, status: 'planned', note: 'Plan validated; no browser test was executed and no coverage was earned.' })
    return
  }
  const response = await fetch(variables.start_url.value, { redirect: 'follow', signal: AbortSignal.timeout(15000) })
  validateUrl(response.url, { remote: config.remote })
  if (!response.ok) throw new Error(`The app target is not reachable (HTTP ${response.status}); no browser tests were launched.`)
  const firstRuns = tests.filter(test => !existsSync(resolve(workspace, '.testmuai/tests', `output-${test.name.replace(/_test\.md$/, '')}`, 'Result.md'))).length
  console.error(`Starting ${tests.length} tests. ${firstRuns} first runs may write browser steps (roughly 30–85 Kane credits each); replays can cost additional credits. Headless execution may update these tests' shared Test Manager cases.`)
  const result = await runKane(args, { cwd: workspace })
  const outcome = suiteOutcome(result, config.remote, tests.length)
  // Recordings/evidence remain in the linked run folder. Reuse a recording only after inspecting it.
  writeReport('kane-suite', { ...metadata, ...outcome, note: 'Inspect the run folder for member logs and sealed evidence. Source test files and variable values were not modified.' })
  console.error(`Kane suite: ${outcome.status}.`)
  process.exitCode = outcome.exitCode
}

main().catch(error => { console.error(error.message); writeReport('kane-suite', { status: 'not_run_or_incomplete', reason: error.message }); process.exitCode = 2 })
