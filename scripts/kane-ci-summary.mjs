import { appendFileSync, existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { reportDirectory } from './lib/kane-tools.mjs'

const read = name => {
  const path = resolve(reportDirectory, `${name}.json`)
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null
}
const suite = read('kane-suite'), coverage = read('kane-coverage'), auth = read('kane-ci')
const text = [
  '### Raising Kane verification', '',
  `Kane browser suite: **${suite?.status ?? 'pending / not run'}**.`,
  suite?.totals ? `${suite.totals.passed}/${suite.totals.tests} tests passed.` : 'No test pass count is available.',
  coverage?.status === 'measured' ? `Shared project coverage: **${coverage.criteria.proven}/${coverage.criteria.total} criteria proven** (${Number(coverage.percent).toFixed(2)}% risk-weighted).` : 'Shared coverage: unavailable or not checked.',
  suite?.status === 'planned' ? 'This was a dry run. It did not execute browser tests or earn coverage.' : '',
  !suite && auth?.status !== 'authenticated' ? 'Kane authentication is unavailable; configure the repository secrets to enable browser verification.' : '',
  'Build/unit results and browser evidence are separate checks. Missing credentials or a plan are never a browser pass.', '',
].filter(Boolean).join('\n')
console.log(text)
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`)
