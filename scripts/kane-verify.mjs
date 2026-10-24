import { spawnSync } from 'node:child_process'

const targetUrl = process.env.KANE_URL ?? 'http://127.0.0.1:5173'
const objective =
  process.env.KANE_OBJECTIVE ??
  'Open Raising Kane. Verify Website URL is labeled and populated with a supported synthetic website, and What would you like to do is marked Optional. Verify Northstar Outfitters and Linden Home source choices, Explore & simplify, and the synthetic-source and processing notice. Leave the optional intent empty. Do not start a paid build. Verify the overview explanation is visible.'

const preflight = spawnSync(process.execPath, ['scripts/kane-preflight.mjs'], { stdio: 'inherit' })
if (preflight.status !== 0) process.exit(preflight.status ?? 1)

const result = spawnSync(
  process.env.KANE_CLI || 'kane-cli',
  [
    'run',
    objective,
    '--url',
    targetUrl,
    '--agent',
    ...(process.env.KANE_HEADLESS === '1' ? ['--headless'] : []),
    ...(process.env.KANE_CHROME_PROFILE
      ? ['--chrome-profile', process.env.KANE_CHROME_PROFILE]
      : []),
    '--final-validation',
    'on',
    '--assertion-failure-mode',
    'stop',
    ...(process.env.KANE_RUN_NAME ? ['--name', process.env.KANE_RUN_NAME] : []),
  ],
  { stdio: 'inherit', env: { ...process.env, KANE_CLI_USER_AGENT: 'codex' } },
)

process.exit(result.status ?? 1)
