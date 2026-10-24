import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { buildExploreArgs, createKaneExplore, readExploreMap } from './kane-explore.mjs'

const temporary = t => { const root = mkdtempSync(path.join(os.tmpdir(), 'raising-kane-explore-')); t.after(() => rmSync(root, { recursive: true, force: true })); return root }
const screen = (id, url, name = id) => ({ id, origin: 'observed', url, name, heading: name, affordances: [{ name: 'Buy', role: 'button', scope: 'policy_blocked' }] })
const waitFor = async predicate => {
  const end = Date.now() + 10000
  while (Date.now() < end) { const value = predicate(); if (value) return value; await new Promise(resolve => setTimeout(resolve, 20)) }
  throw new Error('Explore fixture did not reach the expected state.')
}

test('launch is always bounded, read-only, isolated, and without credential or session arguments', () => {
  const args = buildExploreArgs({ projectId: 'project-one', url: 'https://books.toscrape.com/', maxLeases: 4 })
  assert.equal(args[args.indexOf('--policy') + 1], 'read_only')
  assert.equal(args[args.indexOf('--max-parallel') + 1], '1')
  assert.ok(args.includes('--local-orchestration'))
  assert.ok(args.includes('--no-context'))
  assert.ok(args.includes('--depth-caps'))
  assert.ok(!args.some(value => ['--deps', '--variables', '--variables-file', '--cdp', '--profile', '--allow-post'].includes(value)))
  assert.throws(() => buildExploreArgs({ projectId: 'project-one', url: 'https://example.com/', goal: '{{secret}}' }), /placeholders/)
  assert.throws(() => buildExploreArgs({ projectId: 'project-one', url: 'https://person:secret@example.com/' }), /credentials/)
  assert.throws(() => buildExploreArgs({ projectId: 'project-one', url: 'https://example.com/?token=secret' }), /tokens/)
  assert.throws(() => buildExploreArgs({ projectId: 'project-one', url: 'https://example.com/', maxLeases: 0 }), /1–8/)
})

test('map only promotes committed concrete same-origin screens; patterns and blocked controls are never actions', t => {
  const root = temporary(t)
  writeFileSync(path.join(root, 'starting-projection.json'), '{}')
  const ledger = [
    { op: 'delta', seq: 1, delta: { run_id: 'run-one', junctions: [screen('home', 'https://example.com/', 'Home'),
      screen('read', 'https://example.com/article', 'Article'), screen('pattern', 'https://example.com/{slug}', 'Pattern'),
      screen('external', 'https://external.test/article', 'External'), screen('delete', 'https://example.com/delete/item', 'Delete item')],
      flows: [{ id: 'flow', entry: 'home', exit: 'read', name: 'Read article', status: 'verified' }] } },
    { op: 'committed', seq: 1 },
    { op: 'delta', seq: 2, delta: { run_id: 'run-one', junctions: [screen('uncommitted', 'https://example.com/unsafe')] } },
    { op: 'delta', seq: 3, delta: { run_id: 'another-run', junctions: [screen('wrong-run', 'https://example.com/wrong')] } },
    { op: 'committed', seq: 3 },
  ]
  writeFileSync(path.join(root, 'pending-deltas.ndjson'), ledger.map(value => JSON.stringify(value)).join('\n') + '\n{"torn":')
  const map = readExploreMap({ runDir: root, runId: 'run-one', url: 'https://example.com/', evidenceId: 'evidence-one' })
  assert.deepEqual(map.actions.map(action => action.href), ['https://example.com/article'])
  assert.equal(map.actions[0].availability, 'discovered')
  assert.equal(map.flows[0].knowledge, 'navigation_observed')
  assert.equal(map.committedDeltaCount, 1)
  assert.equal(map.screens[0].controls[0].status, 'policy_blocked')
  assert.ok(!JSON.stringify(map).includes('href_pattern'))
  assert.ok(!map.screens.some(item => ['uncommitted', 'wrong-run', 'external', 'pattern'].includes(item.id)))
})

function fixture(t, { hang = false, stopDelayMs = 0, ignoreSignals = false, serviceNeverStops = false } = {}) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'raising-kane-explore-')), evidenceRoot = path.join(root, 'evidence'), storeDir = path.join(root, 'store')
  const executable = path.join(root, 'kane-fixture.mjs')
  writeFileSync(executable, `#!/usr/bin/env node
import fs from 'node:fs'; import path from 'node:path';
const root=${JSON.stringify(root)}, evidenceRoot=${JSON.stringify(evidenceRoot)}, args=process.argv.slice(2);
const out=v=>process.stdout.write(JSON.stringify(v)+'\\n');
const value=flag=>args[args.indexOf(flag)+1];
fs.appendFileSync(path.join(root,'commands.ndjson'),JSON.stringify(args)+'\\n');
if(args[0]==='--version'){console.log('0.10.0-rc.3');process.exit(0)}
if(args[0]==='projects'&&args[1]==='list'){out({_meta:'page',has_more:false});process.exit(0)}
if(args[0]==='projects'&&args[1]==='create'){out({id:'project-created',name:args[2]});process.exit(0)}
if(args[1]==='list'){out({type:'explore_list',explorations:fs.existsSync(path.join(root,'service-restore'))?[{exploration_id:'exploration-one',current_session:{run_id:'run-restored'}}]:[],next_cursor:null});process.exit(0)}
if(args[1]==='sessions'){
const counterFile=path.join(root,'session-checks');const checks=Number(fs.existsSync(counterFile)?fs.readFileSync(counterFile,'utf8'):0)+1;fs.writeFileSync(counterFile,String(checks));
const stopped=fs.existsSync(path.join(root,'stop-requested'))&&checks>=3&&!${serviceNeverStops};
out({type:'explore_session',session:{run_id:'run-restored',state:stopped?'stopped':'running',remark:stopped?{code:'user_stop'}:null}});process.exit(0)
}
if(args[1]==='stop'){fs.writeFileSync(path.join(root,'stop-requested'),'yes');out({type:'explore_stop',stopping:true,state:'running'});process.exit(0)}
if(args[1]==='run'){
fs.writeFileSync(path.join(root,'runner.pid'),String(process.pid));
const url=value('--url'), runId='run-'+Date.now(), explorationId='exploration-one';
const dir=path.join(evidenceRoot,explorationId,'runs',runId);fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'starting-projection.json'),'{}');
const delta={op:'delta',seq:1,delta:{run_id:runId,junctions:[{id:'home',origin:'observed',url,name:'Home'},
{id:'article',origin:'observed',url:new URL('/article',url).href,name:'Article'}]}};
fs.writeFileSync(path.join(dir,'pending-deltas.ndjson'),JSON.stringify(delta)+'\\n'+JSON.stringify({op:'committed',seq:1})+'\\n');
out({type:'stream_start',cli_version:'0.10.0-rc.3'});
out({type:'explore_run_started',exploration_id:explorationId,run_id:runId,run_dir:dir});
out({type:'delta_committed',seq:1});out({type:'lease_end'});
const end=code=>{out({type:'explore_end',credits:{total:2.25}});out({type:'done',exit_code:code==='budget'?0:3,remark:{code,message:code}});setTimeout(()=>process.exit(0),${stopDelayMs})};
process.on('SIGINT',()=>{if(!${ignoreSignals})end('user_stop')});
${ignoreSignals ? "process.on('SIGTERM',()=>{});" : ''}
${hang ? "setInterval(()=>{},1000);" : "setTimeout(()=>end('budget'),30);"}
} else process.exit(2);
`, { mode: 0o700 })
  const manager = createKaneExplore({ cliPath: executable, evidenceRoot, storeDir,
    stopGraceMs: ignoreSignals ? 100 : 1000, stopKillGraceMs: 100, stopConfirmMs: 1000 })
  t.after(async () => { await manager.shutdown(); rmSync(root, { recursive: true, force: true }) })
  return { root, manager, executable, evidenceRoot, storeDir }
}

test('job lifecycle allocates once per origin, preserves evidence, survives reload, and changes no global configuration', async t => {
  const { manager, root, executable, evidenceRoot, storeDir } = fixture(t)
  const first = manager.start({ connectionId: 'connection-one', url: 'https://example.com/' })
  assert.equal(first.status, 'starting')
  assert.throws(() => manager.start({ connectionId: 'connection-two', url: 'https://other.test/' }), /already active/)
  const completed = await waitFor(() => { const job = manager.get(first.id); return job.status === 'budget' && job.endedAt && job.actions.length && job })
  await manager.shutdown()
  assert.equal(completed.credits, 2.25)
  assert.equal(completed.evidence.status, 'map_observed')
  assert.equal(completed.projectName, 'Raising Kane Explore example.com')
  assert.equal(completed.actions[0].href, 'https://example.com/article')
  assert.ok(!('_runDir' in completed))
  const second = manager.start({ connectionId: 'connection-two', url: 'https://example.com/another' })
  await waitFor(() => manager.get(second.id).status === 'budget')
  await manager.shutdown()
  assert.equal(manager.get(second.id).entryUrl, 'https://example.com/')
  const commands = readFileSync(path.join(root, 'commands.ndjson'), 'utf8').trim().split('\n').map(JSON.parse)
  assert.equal(commands.filter(args => args[0] === 'projects' && args[1] === 'create').length, 1)
  assert.ok(!commands.some(args => args[0] === 'config' || args[0] === 'context'))
  const restored = createKaneExplore({ cliPath: executable, evidenceRoot, storeDir })
  assert.equal(restored.get(first.id).actions[0].href, completed.actions[0].href)
})

test('stop waits for process exit even after a completion event and preserves its committed partial map', async t => {
  const { manager, root } = fixture(t, { hang: true, stopDelayMs: 200 })
  const started = manager.start({ connectionId: 'connection-one', url: 'https://example.com/' })
  await waitFor(() => manager.get(started.id).status === 'running')
  let resolved = false
  const stopping = manager.stop(started.id).then(result => { resolved = true; return result })
  await waitFor(() => manager.get(started.id).status === 'stopped') // done was emitted; the process still lives.
  assert.equal(resolved, false)
  const pid = Number(readFileSync(path.join(root, 'runner.pid'), 'utf8'))
  process.kill(pid, 0)
  assert.throws(() => manager.start({ connectionId: 'connection-two', url: 'https://example.com/' }), /already active/)
  const stopped = await stopping
  assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' })
  assert.ok(stopped.stopConfirmedAt)
  assert.equal(stopped.actions.length, 1)
  assert.equal(stopped.stopRequestedReason, 'user_stop')
})

test('TERM/KILL escalation is bounded and cannot claim safe handoff without browser cleanup evidence', async t => {
  const { manager, root } = fixture(t, { hang: true, ignoreSignals: true })
  const started = manager.start({ connectionId: 'connection-one', url: 'https://example.com/' })
  await waitFor(() => manager.get(started.id).status === 'running')
  const pid = Number(readFileSync(path.join(root, 'runner.pid'), 'utf8'))
  await assert.rejects(manager.stop(started.id), /forced termination|completion record/)
  assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' })
  assert.equal(manager.get(started.id).status, 'interrupted')
  assert.equal(manager.get(started.id).cleanupUnconfirmed, true)
  assert.equal((await manager.refresh(started.id)).status, 'interrupted')
  assert.throws(() => manager.start({ connectionId: 'connection-two', url: 'https://example.com/' }), /interrupted/)
})

function restoredFixture(t, options = {}) {
  const f = fixture(t, options)
  writeFileSync(path.join(f.root, 'service-restore'), 'yes')
  writeFileSync(path.join(f.storeDir, 'jobs.json'), JSON.stringify({ jobs: [{
    id: 'restored-job', connectionId: 'connection-one', status: 'running', url: 'https://example.com/',
    explorationId: 'exploration-one', runId: 'run-restored', events: [], evidence: { id: 'evidence' },
  }] }))
  const restored = createKaneExplore({ cliPath: f.executable, evidenceRoot: f.evidenceRoot,
    storeDir: f.storeDir, serviceStopTimeoutMs: options.serviceNeverStops ? 1000 : 5000 })
  return { ...f, restored }
}

test('restored interrupted jobs only finish stop after the exact run is confirmed stopped by the service', async t => {
  const { restored, root } = restoredFixture(t)
  assert.equal(restored.get('restored-job').status, 'interrupted')
  assert.throws(() => restored.start({ connectionId: 'connection-two', url: 'https://example.com/' }), /interrupted/)
  const stopped = await restored.stop('restored-job')
  assert.equal(stopped.status, 'stopped')
  assert.ok(stopped.stopConfirmedAt)
  assert.ok(Number(readFileSync(path.join(root, 'session-checks'), 'utf8')) >= 3)
})

test('an unconfirmed restored service stop throws and preserves the start barrier', async t => {
  const { restored } = restoredFixture(t, { serviceNeverStops: true })
  await assert.rejects(restored.stop('restored-job'), /stop was not confirmed/)
  assert.equal(restored.get('restored-job').status, 'interrupted')
  assert.throws(() => restored.start({ connectionId: 'connection-two', url: 'https://example.com/' }), /interrupted/)
})

test('stop before preflight finishes prevents a browser from being launched', async t => {
  const { manager, root } = fixture(t)
  const started = manager.start({ connectionId: 'connection-one', url: 'https://example.com/' })
  await manager.stop(started.id)
  await manager.shutdown()
  assert.equal(manager.get(started.id).status, 'stopped')
  const commands = readFileSync(path.join(root, 'commands.ndjson'), 'utf8').trim().split('\n').map(JSON.parse)
  assert.ok(!commands.some(args => args[0] === 'explore' && args[1] === 'run'))
})
