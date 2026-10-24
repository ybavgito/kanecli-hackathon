import assert from 'node:assert/strict'
import test from 'node:test'
import { extractKaneFinalState } from '../../server/kane-worker.mjs'

const memory = value => ({ type: 'memory', secret: false, value })

test('exact named observations survive renamed summaries and override summary values', () => {
  const terminal = {
    final_state: {
      category: 'Books',
      first_four_books: ['A summarized title'],
      proposal_summary: 'A friendly but incomplete summary',
      legacy_extra: 'Keep existing summary fields',
    },
    context: {
      variables: {
        options_text: memory('Observed title | unknown | unknown | Read details | https://example.com/book'),
        records_text: memory('Observed title | In stock'),
        terms_text: memory('Availability | In stock'),
        access_state: memory('public'),
        proposal_summary: memory('Read the exact observed book details'),
      },
    },
  }
  const original = structuredClone(terminal)

  const result = extractKaneFinalState(terminal)

  assert.equal(result.options_text, terminal.context.variables.options_text.value)
  assert.equal(result.records_text, 'Observed title | In stock')
  assert.equal(result.terms_text, 'Availability | In stock')
  assert.equal(result.access_state, 'public')
  assert.equal(result.proposal_summary, 'Read the exact observed book details')
  assert.equal(result.category, 'Books')
  assert.deepEqual(result.first_four_books, ['A summarized title'])
  assert.equal(result.legacy_extra, 'Keep existing summary fields')
  assert.deepEqual(terminal, original, 'Parsing must not mutate the terminal event')
})

test('memory merge excludes secrets, input variables, and names outside the observation contract', () => {
  const result = extractKaneFinalState({
    final_state: { category: 'Preserved summary' },
    context: {
      variables: {
        result_summary: memory('Allowed observation'),
        account_identity: { type: 'memory', secret: true, value: 'Synthetic secret' },
        account_label: { type: 'variable', secret: false, value: 'Synthetic input' },
        page_title: { type: 'memory', value: 'Missing explicit nonsecret flag' },
        access_state: { type: 'memory', secret: 'false', value: 'Wrong flag type' },
        source_url: { type: 'memory', secret: false },
        options_text: { type: 'memory', secret: false, value: undefined },
        records_text: 'An untyped raw value',
        terms_text: [{ type: 'memory', secret: false, value: 'Wrong entry container' }],
        password: memory('Synthetic credential'),
        otp: memory('Synthetic code'),
        authorization: memory('Synthetic authorization'),
        custom_input: memory('An unapproved name'),
        Options_text: memory('Names must match exactly'),
      },
    },
  })

  assert.deepEqual(result, {
    category: 'Preserved summary',
    result_summary: 'Allowed observation',
  })
})

test('missing or malformed variable containers retain the existing summary', () => {
  for (const context of [undefined, null, {}, { variables: null }, { variables: [] },
    { variables: 'not a mapping' }, { variables: 42 }, { variables: false }]) {
    assert.deepEqual(extractKaneFinalState({ final_state: { legacy: 'kept' }, context }), { legacy: 'kept' })
  }
  assert.deepEqual(extractKaneFinalState(), {})
  assert.deepEqual(extractKaneFinalState(null), {})
  assert.deepEqual(extractKaneFinalState({ final_state: ['not a mapping'] }), {})
  assert.deepEqual(extractKaneFinalState({ context: { variables: { result_summary: null } } }), {})

  const inheritedVariables = Object.create({ result_summary: memory('Inherited data') })
  assert.deepEqual(extractKaneFinalState({ context: { variables: inheritedVariables } }), {})
})

test('allowed observations preserve false, zero, null, and structured values', () => {
  const result = extractKaneFinalState({
    final_state: { result_verified: true, returned_quantity: 1 },
    context: {
      variables: {
        result_verified: memory(false),
        returned_quantity: memory(0),
        result_record_id: memory(null),
        result_fields_json: memory([{ label: 'Availability', value: 'In stock' }]),
        submission_response: memory({ status: 'absent' }),
      },
    },
  })

  assert.deepEqual(result, {
    result_verified: false,
    returned_quantity: 0,
    result_record_id: null,
    result_fields_json: [{ label: 'Availability', value: 'In stock' }],
    submission_response: { status: 'absent' },
  })
})
