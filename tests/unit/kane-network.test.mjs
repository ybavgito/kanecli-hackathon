import assert from 'node:assert/strict'
import test from 'node:test'
import { networkObservation } from '../../server/kane-network.mjs'

const sourceUrl = 'https://source.example.com/books/first'
const terms = [{ label: 'Title', value: 'First book' }, { label: 'Price', value: '£12.50' }]
const expected = { sourceUrl, terms }
const matchedRows = 'fact-1 | match | Title is First book\nfact-2 | match | Price is £12.50'
const conflictRows = 'fact-1 | match | Title is First book\nfact-2 | conflict | Current price is £15.00'

// These are synthetic worker results. No runner, browser, network or evidence file is opened.
function result(finalState = {}, worker = {}) {
  return {
    status: 'passed', evidencePackPath: '/synthetic/sealed-evidence', steps: [],
    conditionResults: [{ result: true }],
    finalState: {
      network_source_url: sourceUrl, network_status: '200', network_kind: 'http',
      network_checks_text: matchedRows, network_result_matches: 'true', ...finalState,
    },
    ...worker,
  }
}

test('a completed evidenced HTTP comparison corroborates every saved fact', () => {
  const observed = networkObservation(result(), expected)
  assert.equal(observed.status, 'matched')
  assert.equal(observed.kind, 'http')
  assert.equal(observed.url, sourceUrl)
  assert.equal(observed.statusCode, 200)
  assert.deepEqual(observed.checks.map(check => [check.label, check.status]), [['Title', 'match'], ['Price', 'match']])
  assert.match(observed.summary, /HTTP response corroborated all 2 saved facts/)
  assert.ok(Number.isFinite(Date.parse(observed.checkedAt)))
})

test('an observed API response may have a different path on the same origin', () => {
  const apiUrl = 'https://source.example.com/api/books/first'
  const observed = networkObservation(result({ network_kind: 'api', network_source_url: apiUrl }), expected)
  assert.equal(observed.status, 'matched')
  assert.equal(observed.url, apiUrl)
  assert.match(observed.summary, /API response/)
})

test('exact unique source labels are accepted when Kane omits the native fact IDs', () => {
  const observed = networkObservation(result({ network_checks_text: ' title | match | First book\nPRICE | match | £12.50' }), expected)
  assert.equal(observed.status, 'matched')
  assert.equal(networkObservation(result({ network_checks_text: 'Book title | match | First book\nPrice | match | £12.50' }), expected).status, 'unavailable')
})

test('duplicate rows and simultaneous ID and label rows are ambiguous', () => {
  for (const duplicate of ['fact-1 | match | First book', 'Title | match | First book']) {
    const observed = networkObservation(result({ network_checks_text: `${matchedRows}\n${duplicate}` }), expected)
    assert.equal(observed.status, 'unavailable')
    assert.equal(observed.checks[0].status, 'unknown')
  }
  const duplicateLabel = 'Title | match | First book\ntitle | match | First book\nPrice | match | £12.50'
  assert.equal(networkObservation(result({ network_checks_text: duplicateLabel }), expected).status, 'unavailable')
})

test('repeated source labels require distinct native fact IDs', () => {
  const repeated = { sourceUrl, terms: [{ label: 'Price', value: '£12.50' }, { label: 'price', value: '£15.00' }] }
  const labels = result({ network_checks_text: 'Price | match | £12.50' })
  assert.equal(networkObservation(labels, repeated).status, 'unavailable')
  const ids = result({ network_checks_text: 'fact-1 | match | £12.50\nfact-2 | match | £15.00' })
  assert.equal(networkObservation(ids, repeated).status, 'matched')
})

test('failed steps and false or missing individual verdicts cannot be hidden by a passed summary', () => {
  for (const worker of [
    { steps: [{ status: 'done' }, { status: 'failed' }] },
    { conditionResults: [true, false] },
    { conditionResults: [{ result: true }, { result: false }] },
    { conditionResults: [{ result: true }, { result: null }] },
  ]) assert.equal(networkObservation(result({}, worker), expected).status, 'unavailable')
  assert.equal(networkObservation(result({}, { conditionResults: [true, true] }), expected).status, 'matched')
})

test('aborted or broken runs neither corroborate nor invalidate a saved browser receipt', () => {
  for (const status of ['timeout', 'error', 'cancelled', 'unavailable']) {
    assert.equal(networkObservation(result({}, { status }), expected).status, 'unavailable')
    const mismatch = result({ network_checks_text: conflictRows, network_result_matches: false }, { status })
    assert.equal(networkObservation(mismatch, expected).status, 'unavailable')
  }
})

test('an evidenced mismatch can be reported when the final assertion fails as expected', () => {
  for (const status of ['failed', 'passed']) {
    const observed = networkObservation(result({ network_checks_text: conflictRows, network_result_matches: false }, { status }), expected)
    assert.equal(observed.status, 'conflict')
    assert.equal(observed.checks[1].detail, 'Current price is £15.00')
    assert.match(observed.summary, /Refresh the information/)
  }
})

test('a conflict needs response evidence and a consistent false flag', () => {
  const incomplete = result({ network_checks_text: 'fact-1 | match | First book\nfact-2 | conflict |', network_result_matches: false }, { status: 'failed' })
  assert.equal(networkObservation(incomplete, expected).status, 'unavailable')
  for (const flag of [undefined, 'unknown', true]) {
    assert.equal(networkObservation(result({ network_checks_text: conflictRows, network_result_matches: flag }), expected).status, 'unavailable')
  }
})

test('a share URL is not a substitute for sealed evidence for matches or conflicts', () => {
  const noEvidence = { evidencePackPath: null, evidencePath: null, testUrl: 'https://evidence.example.com/run' }
  assert.equal(networkObservation(result({}, noEvidence), expected).status, 'unavailable')
  assert.equal(networkObservation(result({ network_checks_text: conflictRows, network_result_matches: false }, noEvidence), expected).status, 'unavailable')
  assert.equal(networkObservation(result({}, { evidencePackPath: null, evidencePath: '/synthetic/legacy-sealed-pack' }), expected).status, 'matched')
})

test('cross-origin responses and a different HTTP page cannot corroborate the saved source', () => {
  for (const kind of ['http', 'api']) {
    const observed = networkObservation(result({ network_kind: kind, network_source_url: 'https://other.example.com/books/first' }), expected)
    assert.equal(observed.status, 'unavailable')
    assert.equal(observed.url, null)
  }
  for (const url of ['https://source.example.com/books/other', `${sourceUrl}?edition=other`]) {
    assert.equal(networkObservation(result({ network_source_url: url }), expected).status, 'unavailable')
  }
})

test('incomplete responses, missing facts and empty evidence snippets remain unavailable', () => {
  for (const field of ['network_source_url', 'network_status', 'network_kind', 'network_checks_text', 'network_result_matches']) {
    assert.equal(networkObservation(result({ [field]: undefined }), expected).status, 'unavailable', field)
  }
  for (const status of ['404', '500', 'not-a-status', '200.5']) {
    assert.equal(networkObservation(result({ network_status: status }), expected).status, 'unavailable')
  }
  for (const rows of ['fact-1 | match | First book', 'fact-1 | match |\nfact-2 | match | £12.50', 'fact-1 | match | First book\nfact-2 | unknown | Price absent']) {
    assert.equal(networkObservation(result({ network_checks_text: rows }), expected).status, 'unavailable')
  }
  assert.equal(networkObservation({ status: 'passed' }, expected).status, 'unavailable')
  assert.equal(networkObservation(result(), { sourceUrl, terms: [] }).status, 'unavailable')
})
