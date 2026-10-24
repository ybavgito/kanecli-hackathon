import test from 'node:test'
import assert from 'node:assert/strict'
import { readMapDetails, readExplorationWriteup } from '../../server/builder/exploration-api.mjs'

test('API enrichment binds detailed records to requested identities and preserves unknowns', async () => {
  const result = await readMapDetails(
    'http://127.0.0.1:9999',
    {
      junctions: [{ id: 'screen-1' }, { id: 'screen-2' }],
      flows: [{ id: 'flow-1' }],
      findings: [{ id: 'finding-1' }],
    },
    async (url) => {
      if (url.endsWith('screen-1'))
        return Response.json({
          junction: { id: 'screen-1', affordances: [{ name: 'Submit', scope: 'policy_blocked' }] },
        })
      if (url.endsWith('screen-2')) return Response.json({ junction: { id: 'wrong-screen' } })
      if (url.endsWith('flow-1'))
        return Response.json({ flow: { id: 'flow-1', plan: ['Choose method'] }, current: null })
      return new Response('', { status: 503 })
    },
  )
  assert.equal(result.screens['screen-1'].affordances[0].scope, 'policy_blocked')
  assert.equal(result.screens['screen-2'], undefined)
  assert.equal(result.flows['flow-1'].currentObservation, null)
  assert.equal(result.findings['finding-1'], undefined)
  assert.equal(result.reads.filter((r) => r.status === 'unavailable').length, 2)
})

test('optional exploration context is read server-side without following auth redirects', async () => {
  const oldUser = process.env.LT_USERNAME,
    oldKey = process.env.LT_ACCESS_KEY
  try {
    delete process.env.LT_USERNAME
    delete process.env.LT_ACCESS_KEY
    assert.equal(
      (
        await readExplorationWriteup('exploration', 'run', () => {
          throw Error('must not fetch')
        })
      ).status,
      'not_configured',
    )
    process.env.LT_USERNAME = 'test-user'
    process.env.LT_ACCESS_KEY = 'test-only-value'
    const result = await readExplorationWriteup('exploration', 'run', async (url, options) => {
      assert.equal(url.hostname, 'kaneai-api.lambdatest.com')
      assert.equal(url.searchParams.get('as_of_run'), 'run')
      assert.equal(options.redirect, 'error')
      assert.ok(options.headers.Authorization.startsWith('Basic '))
      return Response.json({ run_id: 'run', name: 'skill.md', markdown: '# Observed website' })
    })
    assert.deepEqual(result, {
      status: 'read',
      runId: 'run',
      name: 'skill.md',
      markdown: '# Observed website',
    })
    assert.ok(!JSON.stringify(result).includes('test-only-value'))
  } finally {
    if (oldUser === undefined) delete process.env.LT_USERNAME
    else process.env.LT_USERNAME = oldUser
    if (oldKey === undefined) delete process.env.LT_ACCESS_KEY
    else process.env.LT_ACCESS_KEY = oldKey
  }
})
