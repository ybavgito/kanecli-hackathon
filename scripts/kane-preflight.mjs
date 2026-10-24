import { execFileSync } from 'node:child_process'

try {
  const rawConfig = execFileSync(process.env.KANE_CLI || 'kane-cli', ['config', 'show'], {
    encoding: 'utf8',
  })
  const config = JSON.parse(rawConfig)

  if (config.auth === 'not configured') {
    console.error('Kane CLI is installed but not authenticated. Run: kane-cli login --oauth')
    process.exit(1)
  }

  console.log(`Kane ready: profile=${config.profile}, target=${config.target}, mode=${config.mode}`)
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('Kane CLI is not on PATH. Install it or add kane-cli to PATH.')
  } else {
    console.error(`Could not inspect Kane CLI: ${error.message}`)
  }
  process.exit(1)
}
