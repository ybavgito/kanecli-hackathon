import { requireKane, reportCoverage, writeReport } from './lib/kane-tools.mjs'

try {
  await requireKane()
  const result = await reportCoverage()
  process.exitCode = result.exitCode
} catch (error) {
  writeReport('kane-coverage', { status: 'unavailable', reason: error.message })
  console.error(error.message)
  process.exitCode = 2
}
