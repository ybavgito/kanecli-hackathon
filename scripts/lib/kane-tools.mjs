import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve, relative } from 'node:path'

export const projectRoot = resolve(import.meta.dirname, '../..')
export const reportDirectory = resolve(projectRoot, 'data/verification')

export function requireSharedProject(root = projectRoot) {
  if (existsSync(resolve(root, '.context'))) throw new Error('This workflow requires only the shared project. A local .context store is present; resolve the conflicting stores first.')
  const link = JSON.parse(readFileSync(resolve(root, '.testmuai/assurance.json'), 'utf8'))
  if (!link.projectId) throw new Error('The folder has no shared Test Manager project ID.')
  return { id: link.projectId, name: link.projectName }
}

export function parseEvents(output) {
  return output.split(/\r?\n/).filter(Boolean).flatMap(line => {
    try { return [JSON.parse(line)] } catch { return [] }
  })
}

export function runKane(args, { stream = true, cwd = projectRoot } = {}) {
  return new Promise(resolveResult => {
    // stdin is /dev/null, including when the parent is a terminal: testrun stays in agent mode.
    const child = spawn('kane-cli', args, { cwd, env: { ...process.env, KANE_CLI_USER_AGENT: 'codex' }, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = '', stderr = ''
    child.stdout.on('data', chunk => { stdout += chunk; if (stream) process.stdout.write(chunk) })
    child.stderr.on('data', chunk => { stderr += chunk; if (stream) process.stderr.write(chunk) })
    child.on('error', error => resolveResult({ code: 2, events: [], error: error.code === 'ENOENT' ? 'Kane CLI is not installed.' : error.message, stdout, stderr }))
    child.on('close', code => resolveResult({ code: code ?? 1, events: parseEvents(stdout), stdout, stderr }))
  })
}

export async function requireKane() {
  const version = await runKane(['--version'], { stream: false })
  if (version.code) throw new Error(version.error ?? 'Cannot read the installed Kane CLI version.')
  const value = version.stdout.trim()
  if (!/^0\.(?:1[0-9]|[2-9][0-9])\./.test(value) && !/^[1-9]\d*\./.test(value)) throw new Error(`Kane ${value} is too old for shared-project workflows; install @testmuai/kane-cli@rc.`)
  console.error(`Kane ${value}; commands checked against 0.10.0-rc.3.`)
  const auth = await runKane(['whoami'], { stream: false })
  if (auth.code) throw new Error('Kane sign-in could not be verified. Run kane-cli login --oauth; CI needs KANE_USERNAME and KANE_ACCESS_KEY secrets.')
  return value
}

export function writeReport(name, report) {
  mkdirSync(reportDirectory, { recursive: true })
  const path = resolve(reportDirectory, `${name}.json`)
  writeFileSync(path, `${JSON.stringify({ recordedAt: new Date().toISOString(), ...report }, null, 2)}\n`, { mode: 0o600 })
  console.error(`Report: ${relative(projectRoot, path)}`)
  return path
}

export function coverageSummary(result) {
  const coverage = result.events.findLast(event => event.type === 'coverage')
  const done = result.events.findLast(event => event.type === 'done')
  if (result.code || !coverage || done?.status !== 'complete' || done.exit_code !== 0) return { status: 'unavailable', exitCode: result.code || 1 }
  return {
    status: 'measured', exitCode: 0, source: coverage.source, scope: coverage.scope,
    percent: coverage.pct, criteria: coverage.criteria, usecases: coverage.usecases,
    perUseCase: coverage.perUc, perCriterion: coverage.perAc, flags: coverage.flags,
    note: 'This is counted project coverage, not a claim that every implemented feature passed. New evidence can take up to five minutes to count.',
  }
}

export async function reportCoverage() {
  const project = requireSharedProject()
  const result = await runKane(['cover', '--mode', 'agent'])
  const summary = coverageSummary(result)
  writeReport('kane-coverage', { project, ...summary })
  if (summary.status === 'measured') console.error(`Shared coverage: ${summary.criteria.proven}/${summary.criteria.total} criteria proven; ${Number(summary.percent).toFixed(2)}% risk-weighted coverage.`)
  else console.error('Coverage is unavailable; no passing result was inferred.')
  return summary
}

export function requirementHashes(root = projectRoot) {
  const dir = resolve(root, '.testmuai/requirements')
  return readdirSync(dir).filter(name => name.endsWith('.md')).sort().map(name => ({
    file: `.testmuai/requirements/${name}`, sha256: createHash('sha256').update(readFileSync(resolve(dir, name))).digest('hex'),
  }))
}

export function checkPlan(result, expectedCount) {
  const plan = result.events.findLast(event => event.type === 'testrun_plan')
  const unresolved = plan?.members?.flatMap(member => member.unresolved ?? []) ?? []
  const variableWarning = result.events.some(event => event.type === 'warning' && event.code === 'unresolved_variables')
  if (result.code || !plan?.valid || plan.members?.length !== expectedCount || unresolved.length || variableWarning) {
    throw new Error('Kane plan was refused, incomplete, or has unresolved variables. No tests were launched. Inspect the plan above and fill only the required real values in .testmuai/variables/assurance.json.')
  }
  return plan
}

export function suiteOutcome(result, remote, expectedCount) {
  const done = result.events.findLast(event => event.type === 'testrun_done')
  const cloud = result.events.findLast(event => event.type === 'remote_done')
  const summary = result.events.findLast(event => event.type === 'testrun_summary')
  const members = result.events.filter(event => ['testrun_member_end', 'testrun_authored_member_end'].includes(event.type))
  const totals = summary?.totals
  const allMembersPassed = totals?.tests > 0 && totals.passed === totals.tests && !totals.failed && !totals.broken && !totals.skipped && (!expectedCount || totals.tests === expectedCount) && members.every(member => member.status === 'passed')
  const passed = result.code === 0 && done?.overall_status === 'passed' && allMembersPassed && (!remote || (cloud?.status === 'passed' && cloud.exit === 0))
  return {
    status: passed ? 'passed' : done?.overall_status === 'failed' ? 'failed' : 'incomplete',
    exitCode: passed ? 0 : result.code || 1, executionId: done?.execution_id,
    totals: summary?.totals, durationSeconds: summary?.duration_s, coverage: done?.coverage,
    remote: cloud ? { status: cloud.status, exit: cloud.exit, jobId: cloud.job_id, sessionsPath: cloud.sessions_path } : undefined,
    failures: members.filter(member => member.status !== 'passed').map(member => ({ file: relative(projectRoot, resolve(projectRoot, member.path)), status: member.status, failure: member.failure, logPath: member.log_path })),
  }
}

export function validateUrl(value, { remote = false, httpsOnly = remote } = {}) {
  let url
  try { url = new URL(value) } catch { throw new Error('KANE_URL/start_url must be an absolute HTTP or HTTPS URL.') }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Suite targets must use HTTP(S) without embedded credentials.')
  if (remote) {
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '')
    const privateHost = !host.includes('.') || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.test') || host.endsWith('.invalid') || host.includes(':') || /^(?:0|10|127|169\.254|192\.168)\./.test(host) || /^172\.(?:1[6-9]|2\d|3[01])\./.test(host) || /^100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(host)
    if ((httpsOnly && url.protocol !== 'https:') || privateHost) throw new Error('Cloud suites require a deployed public HTTPS app target and public HTTP(S) source URLs; localhost/private URLs cannot be reached by the grid.')
  }
  return url
}
