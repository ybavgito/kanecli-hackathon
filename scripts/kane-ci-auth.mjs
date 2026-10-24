import { spawnSync } from 'node:child_process'
import { requireSharedProject, writeReport } from './lib/kane-tools.mjs'

const username = process.env.KANE_USERNAME
const accessKey = process.env.KANE_ACCESS_KEY
if (!username || !accessKey) {
  console.error('Kane verification pending: KANE_USERNAME and KANE_ACCESS_KEY repository secrets are not configured. No browser test passed or ran.')
  writeReport('kane-ci', { status: 'pending', reason: 'Kane credentials are unavailable.' })
  process.exitCode = 2
} else {
  try {
    const project = requireSharedProject()
    const result = spawnSync('kane-cli', ['login', '--username', username, '--access-key', accessKey, '--project-id', project.id, ...(process.env.KANE_FOLDER_ID ? ['--folder-id', process.env.KANE_FOLDER_ID] : [])], {
      env: { ...process.env, KANE_CLI_USER_AGENT: 'codex' }, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8',
    })
    // Do not print login stdout/stderr: authentication diagnostics may contain credential details.
    if (result.status !== 0) throw new Error('Kane CI sign-in failed. Check the repository secrets and shared-project access.')
    console.log('Kane CI authentication completed; no browser verification has run yet.')
    writeReport('kane-ci', { status: 'authenticated', project })
  } catch (error) {
    console.error(error.message)
    writeReport('kane-ci', { status: 'unavailable', reason: error.message })
    process.exitCode = 2
  }
}
