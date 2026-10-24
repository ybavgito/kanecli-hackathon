import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { requireSharedProject, requireKane, runKane, reportCoverage, requirementHashes, writeReport } from './lib/kane-tools.mjs'

const usage = `Raising Kane requirements maintenance (shared project)
  npm run kane:maintain                     Read sources, use cases, sessions and coverage; changes nothing in the project.
  npm run kane:reconcile -- --from FILE --source-id ID
                                           Explicitly record a changed requirement source and propose updates; never auto-save.
  npm run kane:evolve -- uc-1 [--because REASON] [--answer evolve:uc-1=1]
                                           Ask Kane to redesign a use case; preserve its review/pause boundary.
Review returned questions and next commands. Exit 3 means paused for a decision.
Reconcile is NOT a read-only dry run. Shared projects do not support --plan, --apply or cover gaps.`

async function main() {
  const [action = 'status', ...args] = process.argv.slice(2)
  if (action === '--help' || args.includes('--help')) { console.log(usage); return }
  if (!['status', 'reconcile', 'evolve'].includes(action)) throw new Error(usage)
  if (args.some(arg => ['--plan', '--apply', '--force', '--mode', '--from-stale'].includes(arg))) throw new Error('Unsupported automatic/batch maintenance option. Use a specific source or use case and retain Kane review decisions.')
  if (action === 'status' && args.length) throw new Error(usage)
  if (action === 'reconcile') {
    if (args.length !== 4 || args[0] !== '--from' || args[2] !== '--source-id' || !existsSync(resolve(args[1])) || !/^[\w.-]+$/.test(args[3])) throw new Error(usage)
  }
  if (action === 'evolve') {
    if (!/^uc-[\w-]+$/.test(args[0] ?? '')) throw new Error(usage)
    for (let index = 1; index < args.length; index += 2) {
      if (!['--because', '--answer'].includes(args[index]) || !args[index + 1]) throw new Error(usage)
      if (args[index] === '--answer' && !new RegExp(`^evolve:${args[0]}=(1|2|proceed|decline)$`).test(args[index + 1])) throw new Error('The answer must address only the selected use case.')
    }
  }
  const project = requireSharedProject()
  const version = await requireKane()
  if (action === 'status') {
    const reads = []
    for (const type of ['source', 'usecase']) reads.push({ type, result: await runKane(['context', 'list', '--type', type, '--mode', 'agent']) })
    const sessions = await runKane(['context', 'sessions', '--mode', 'agent'])
    const coverage = await reportCoverage()
    const failed = reads.some(read => read.result.code !== 0) || sessions.code !== 0 || coverage.exitCode !== 0
    writeReport('kane-maintenance', { status: failed ? 'unavailable' : 'read', action, project, cliVersion: version,
      requirements: requirementHashes(), sources: reads[0].result.events, usecases: reads[1].result.events,
      sessions: sessions.events, coverage, note: 'Source hashes describe local documents only; no source change was reconciled or approved.' })
    process.exitCode = failed ? 1 : 0
    return
  }
  console.error(`${action === 'reconcile' ? 'Recording the changed requirement source and proposing updates' : 'Requesting a use-case redesign'}. Sessions are not saved automatically; review Kane’s returned questions and commands.`)
  const result = await runKane(['maintain', action, ...args, '--mode', 'agent'])
  const session = result.events.findLast(event => event.type === 'session_complete' || event.type === 'session_paused')
  const done = result.events.findLast(event => event.type === 'done')
  const status = result.code === 3 ? 'paused' : result.code ? 'refused' : session ? 'review_pending' : done ? 'complete' : 'incomplete'
  writeReport('kane-maintenance', { status, action, project, cliVersion: version, exitCode: result.code, sessionId: session?.sid, next: done?.next ?? session?.next })
  console.error(`Maintenance status: ${status}. No generated files were edited by this wrapper.`)
  process.exitCode = result.code || (status === 'incomplete' ? 1 : 0)
}

main().catch(error => { console.error(error.message); writeReport('kane-maintenance', { status: 'unavailable', reason: error.message }); process.exitCode = 2 })
