import { spawnSync } from 'node:child_process'

const targetUrl = process.env.KANE_URL ?? 'http://127.0.0.1:5173'
const objective = process.env.KANE_OBJECTIVE
  ?? 'Open Raising Kane. Verify the exact tagline When websites raise hell, raise Kane. Verify Website URL is required and What would you like to do is optional. Verify the page discloses TestMu AI processing and offers a labeled merchant sandbox entry. Do not start a connection or enter credentials.'

const preflight = spawnSync(process.execPath, ['scripts/kane-preflight.mjs'], { stdio: 'inherit' })
if (preflight.status !== 0) process.exit(preflight.status ?? 1)

const result = spawnSync(
  'kane-cli',
  ['run', objective, '--url', targetUrl, '--agent', '--final-validation', 'on',
    ...(process.env.KANE_RUN_NAME ? ['--name', process.env.KANE_RUN_NAME] : [])],
  { stdio: 'inherit', env: { ...process.env, KANE_CLI_USER_AGENT: 'codex' } },
)

process.exit(result.status ?? 1)
