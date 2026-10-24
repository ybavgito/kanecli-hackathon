import { spawnSync } from 'node:child_process'

const targetUrl = process.env.KANE_URL ?? 'http://127.0.0.1:5173'
const objective =
  process.env.KANE_OBJECTIVE ??
  'Open Raising Kane. Verify the Raising Kane branding, Return an item at Northstar Outfitters, and Move a service visit at Linden Home are visible. Verify both sites are described as sandbox or synthetic tasks. Click Return an item and verify Start my return appears. Do not start a task.'

const preflight = spawnSync(process.execPath, ['scripts/kane-preflight.mjs'], { stdio: 'inherit' })
if (preflight.status !== 0) process.exit(preflight.status ?? 1)

const result = spawnSync(
  'kane-cli',
  [
    'run',
    objective,
    '--url',
    targetUrl,
    '--agent',
    '--final-validation',
    'on',
    '--assertion-failure-mode',
    'stop',
    ...(process.env.KANE_RUN_NAME ? ['--name', process.env.KANE_RUN_NAME] : []),
  ],
  { stdio: 'inherit', env: { ...process.env, KANE_CLI_USER_AGENT: 'codex' } },
)

process.exit(result.status ?? 1)
