import { spawnSync } from 'node:child_process'

const targetUrl = process.env.KANE_URL ?? 'http://127.0.0.1:5173'
const objective = process.env.KANE_OBJECTIVE
  ?? 'Open Raising Kane, verify the Raising Kane branding and Your request textbox are visible, and verify the page clearly says the merchant and order are simulated. Do not start a task.'

const preflight = spawnSync(process.execPath, ['scripts/kane-preflight.mjs'], { stdio: 'inherit' })
if (preflight.status !== 0) process.exit(preflight.status ?? 1)

const result = spawnSync(
  'kane-cli',
  ['run', objective, '--url', targetUrl, '--agent', '--final-validation', 'on',
    ...(process.env.KANE_RUN_NAME ? ['--name', process.env.KANE_RUN_NAME] : [])],
  { stdio: 'inherit', env: { ...process.env, KANE_CLI_USER_AGENT: 'codex' } },
)

process.exit(result.status ?? 1)
