import { spawnSync } from 'node:child_process'

const targetUrl = process.env.KANE_URL ?? 'http://127.0.0.1:5173'
const objective = process.env.KANE_OBJECTIVE
  ?? 'Open the KaneCLI Hackathon app and verify that the heading "KaneCLI Hackathon" and the three-step readiness checklist are visible.'

const preflight = spawnSync(process.execPath, ['scripts/kane-preflight.mjs'], { stdio: 'inherit' })
if (preflight.status !== 0) process.exit(preflight.status ?? 1)

const result = spawnSync(
  'kane-cli',
  ['run', objective, '--url', targetUrl, '--agent', '--final-validation', 'on'],
  { stdio: 'inherit' },
)

process.exit(result.status ?? 1)
