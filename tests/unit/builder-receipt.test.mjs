import test from 'node:test'
import assert from 'node:assert/strict'
import { receiptMarkup } from '../../server/builder/receipt.mjs'
test('trusted receipt puts confirmed terms before technical details and escapes source content', () => {
  const html = receiptMarkup({
    kind: 'appointment',
    receipt: {
      requestId: 'CHG-1001',
      startsAt: '2026-10-31T11:00:00-07:00',
      technician: 'Maya <script>alert(1)</script>',
      feeCents: 0,
      currency: 'USD',
      timezone: 'America/Los_Angeles',
    },
  })
  const visible = html.split('<details>')[0]
  for (const expected of [
    'CHG-1001',
    'October 31, 2026',
    '11:00 AM',
    '$0.00',
    'One active booking remains.',
  ])
    assert.ok(visible.includes(expected))
  assert.ok(!html.includes('<script>'))
})
