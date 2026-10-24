import { createHash } from 'node:crypto'

// Shared, deterministic business terms. Versions are bound separately by grants.
export function canonicalProposal(draft) {
  if (!draft) return null
  if (draft.kind === 'appointment')
    return {
      kind: 'appointment',
      accountId: draft.accountId,
      bookingId: draft.bookingId,
      slotId: draft.slotId,
      startsAt: draft.startsAt,
      timezone: draft.timezone,
      technician: draft.technician,
      service: draft.service,
      address: draft.address,
      feeCents: draft.feeCents,
      currency: draft.currency,
    }
  return {
    kind: 'return',
    accountId: draft.accountId,
    orderId: draft.orderId,
    selectedLines: (draft.selectedLines || draft.lines || [])
      .filter((line) => draft.selectedLineIds.includes(line.id))
      .map((line) => ({ id: line.id, quantity: line.quantity }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    reason: draft.reason,
    method: draft.method,
    refundDestination: draft.refundDestination,
    currency: draft.currency,
    subtotalCents: draft.subtotalCents,
    deductionCents: draft.deductionCents,
    expectedRefundCents: draft.expectedRefundCents,
    nextStep: draft.nextStep,
  }
}
export const proposalDigest = (draft) =>
  createHash('sha256')
    .update(JSON.stringify(canonicalProposal(draft)))
    .digest('hex')
