import { createKaneExplore } from '../server/kane-explore.mjs'
import { fileURLToPath } from 'node:url'

const url = process.argv[2]
if (!url || !['books.toscrape.com', 'en.wikipedia.org'].includes(new URL(url).hostname)) {
  throw new Error('Pass a public Books to Scrape or English Wikipedia URL for this bounded live validation.')
}
const manager = createKaneExplore({
  projectId: process.env.KANE_EXPLORE_PROJECT_ID,
  storeDir: process.env.KANE_EXPLORE_STORE_DIR || fileURLToPath(new URL('../data/kane-explore-validation/', import.meta.url)),
})
process.once('SIGINT', async () => { await manager.shutdown(); process.exit(130) })
const initial = manager.start({ connectionId: 'explore-live-validation', url,
  goal: 'Discover useful public information pages and their read-only navigation.', maxLeases: 4, timeoutMs: 240000 })
console.log(JSON.stringify({ id: initial.id, status: initial.status }))
let last = ''
while (true) {
  const job = manager.get(initial.id)
  const summary = { id: job.id, status: job.status, projectId: job.projectId, explorationId: job.explorationId, runId: job.runId,
    screens: job.screens.length, flows: job.flows.length, actions: job.actions.map(action => ({ title: action.title, href: action.href })),
    committedDeltaCount: job.committedDeltaCount, leases: job.leases, credits: job.credits, error: job.error }
  const output = JSON.stringify(summary)
  if (output !== last) { console.log(output); last = output }
  if (['completed', 'budget', 'stopped', 'timed_out', 'error'].includes(job.status)) {
    await manager.shutdown()
    if (!['completed', 'budget'].includes(job.status) || !job.runId || !job.committedDeltaCount || job.screens.length < 2 || job.actions.length < 1) process.exitCode = 1
    break
  }
  await new Promise(resolve => setTimeout(resolve, 1000))
}
