// Read-only enrichment of the CLI viewer's authenticated Exploration API proxy.
// Summary rows omit affordances, flow plans and finding occurrence details.
export async function readMapDetails(base, collections, request = fetch) {
  const result = { screens: {}, flows: {}, findings: {}, reads: [] }
  for (const [collection, output, field, limit] of [
    ['junctions', 'screens', 'junction', 8],
    ['flows', 'flows', 'flow', 8],
    ['findings', 'findings', 'finding', 8],
  ]) {
    for (const row of collections[collection].slice(0, limit)) {
      try {
        const r = await request(
          base + '/api/view/' + collection + '/' + encodeURIComponent(row.id),
          {
            signal: AbortSignal.timeout(15000),
          },
        )
        if (!r.ok) {
          result.reads.push({ collection, id: row.id, status: 'unavailable', httpStatus: r.status })
          continue
        }
        const data = await r.json()
        if (data[field]?.id !== row.id) throw Error('Mismatched evidence identity')
        result[output][row.id] =
          output === 'flows'
            ? { ...data.flow, currentObservation: data.current ?? null }
            : data[field]
        result.reads.push({ collection, id: row.id, status: 'read' })
      } catch {
        result.reads.push({ collection, id: row.id, status: 'unavailable' })
      }
    }
  }
  return result
}

// Optional server-to-server read. Never expose the Basic credential or signed
// evidence URLs to generated code. CLI-only auth remains supported without it.
export async function readExplorationWriteup(explorationId, runId, request = fetch) {
  const { LT_USERNAME, LT_ACCESS_KEY } = process.env
  if (!LT_USERNAME || !LT_ACCESS_KEY) return { status: 'not_configured' }
  const url = new URL(
    'https://kaneai-api.lambdatest.com/v16-controller/v1/exploration/' +
      encodeURIComponent(explorationId) +
      '/skill',
  )
  url.searchParams.set('as_of_run', runId)
  try {
    const r = await request(url, {
      headers: {
        Authorization: 'Basic ' + Buffer.from(LT_USERNAME + ':' + LT_ACCESS_KEY).toString('base64'),
      },
      signal: AbortSignal.timeout(15000),
      redirect: 'error',
    })
    if (!r.ok) return { status: r.status === 404 ? 'not_yet' : 'unavailable', httpStatus: r.status }
    const data = await r.json()
    if (typeof data.markdown !== 'string' || data.markdown.length > 16384 || !data.run_id)
      return { status: 'unavailable' }
    return { status: 'read', runId: data.run_id, name: data.name, markdown: data.markdown }
  } catch {
    return { status: 'unavailable' }
  }
}
