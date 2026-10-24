import test from 'node:test'
import assert from 'node:assert/strict'
import { sourceOutcomeMatches } from '../../server/builder/outcome.mjs'
const task = {
  id: 'task-1',
  status: 'complete',
  operationId: 'op-1',
  receipt: { requestId: 'receipt-1' },
  approval: { proposalDigest: 'approved-digest' },
}
const operation = {
  status: 'committed',
  operationId: 'op-1',
  proposalDigest: 'approved-digest',
  return: {
    taskId: 'task-1',
    requestId: 'receipt-1',
    method: 'qr_dropoff',
    refundDestination: 'original_payment',
    currency: 'USD',
    deductionCents: 500,
    expectedRefundCents: 7500,
    selectedLineIds: ['SHOE-RED-8'],
    status: 'return_requested_refund_pending',
  },
}
test('a completed operation must match the required journey, not just any successful transaction', () => {
  assert.equal(sourceOutcomeMatches('return', task, operation), true)
  for (const patch of [
    { method: 'print_label', deductionCents: 0, expectedRefundCents: 8000 },
    { refundDestination: 'store_credit' },
    { selectedLineIds: ['SHOE-RED-8', 'JACKET-BLACK-M'] },
    { taskId: 'different-task' },
    { expectedRefundCents: 7501 },
  ])
    assert.equal(
      sourceOutcomeMatches('return', task, {
        ...operation,
        return: { ...operation.return, ...patch },
      }),
      false,
    )
  assert.equal(
    sourceOutcomeMatches('return', task, { ...operation, proposalDigest: 'old-draft' }),
    false,
  )
  assert.equal(sourceOutcomeMatches('return', { ...task, status: 'reconciling' }, operation), false)
})
test('appointment acceptance requires the chosen no-fee time and one active booking', () => {
  const appointment = {
    ...operation,
    return: {
      taskId: 'task-1',
      requestId: 'receipt-1',
      slotId: 'sat-1100',
      startsAt: '2026-10-31T11:00:00-07:00',
      technician: 'Maya Chen',
      feeCents: 0,
      currency: 'USD',
      activeBookings: 1,
    },
  }
  assert.equal(sourceOutcomeMatches('appointment', task, appointment), true)
  for (const patch of [
    { technician: 'Luis Rivera' },
    { feeCents: 2500 },
    { activeBookings: 2 },
    { slotId: 'sat-1000' },
  ])
    assert.equal(
      sourceOutcomeMatches('appointment', task, {
        ...appointment,
        return: { ...appointment.return, ...patch },
      }),
      false,
    )
})
