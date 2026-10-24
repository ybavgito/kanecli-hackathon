export const reasons = {
  too_small: 'Size or fit issue',
  changed_mind: 'Changed my mind',
  damaged: 'Arrived damaged',
}
export const methodLabel = (value) =>
  value === 'qr_dropoff' ? 'Printer-free QR drop-off' : 'Print a shipping label'
export const destinationLabel = (value) =>
  value === 'store_credit' ? 'Store credit' : 'Original payment method'
export const expectedMethod = (task) => (task.intent.noPrinter ? 'qr_dropoff' : 'print_label')
const normalized = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, ' ')
const amount = (value) => {
  const str = String(value ?? '')
    .replace(/USD|\$|,/g, '')
    .replace(/\s/g, '')
    .replace('−', '-')
  return /^-?\d+(?:\.\d{1,2})?$/.test(str) ? Math.round(Number(str) * 100) : null
}
const integer = (value) => (/^\d+$/.test(String(value ?? '').trim()) ? Number(value) : null)
const codes = (value, options) =>
  Object.entries(options).find(([key, label]) =>
    [normalized(key), normalized(label)].includes(normalized(value)),
  )?.[0] ?? null
const lines = (value) => {
  if (Array.isArray(value)) return [...value].sort().join(',')
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return [...parsed].sort().join(',')
  } catch {}
  return String(value ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .sort()
    .join(',')
}
const check = (
  key,
  label,
  expected,
  observed,
  displayExpected = expected,
  displayObserved = observed,
) => ({
  key,
  label,
  expected: displayExpected,
  observed: displayObserved ?? 'Not observed',
  status:
    observed == null
      ? 'unknown'
      : JSON.stringify(expected) === JSON.stringify(observed)
        ? 'match'
        : 'conflict',
  provenance: 'source-adapter',
})
const dollars = (cents) =>
  cents == null
    ? 'Not selected'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
export function candidates(task, draft) {
  return draft.slots.map((slot) => ({
    ...slot,
    issues: [
      !slot.available && 'No longer available',
      task.intent.keepTechnician &&
        slot.technician !== draft.originalBooking.technician &&
        'Changes your technician',
      slot.feeCents > task.intent.maxFeeCents && `Adds ${dollars(slot.feeCents)}`,
      !slot.startsAt.startsWith(task.intent.date) && 'Different date',
      Number(slot.startsAt.slice(11, 13)) >= 12 && 'Outside your morning window',
    ].filter(Boolean),
  }))
}
export function comparisons(task, d) {
  if (task.kind === 'appointment')
    return [
      check('booking', 'Same booking', 'BOOK-2048', d.bookingId),
      check('slot', 'Selected time', task.intent.slotId, d.slotId),
      check(
        'availability',
        'Slot available',
        true,
        d.slots.find((s) => s.id === d.slotId)?.available,
      ),
      check(
        'date',
        'Saturday morning',
        true,
        Boolean(d.startsAt?.startsWith(task.intent.date)) && Number(d.startsAt?.slice(11, 13)) < 12,
        `${task.intent.date}, before noon`,
        d.startsAt || 'Not selected',
      ),
      check(
        'technician',
        'Technician',
        true,
        !task.intent.keepTechnician || d.technician === d.originalBooking.technician,
        task.intent.keepTechnician ? d.originalBooking.technician : 'Any technician',
        d.technician,
      ),
      check(
        'fee',
        'Additional fee',
        true,
        d.feeCents != null && d.feeCents <= task.intent.maxFeeCents,
        `At most ${dollars(task.intent.maxFeeCents)}`,
        dollars(d.feeCents),
      ),
      check('service', 'Same service', d.originalBooking.service, d.service),
      check('address', 'Same address', d.originalBooking.address, d.address),
      check('timezone', 'Timezone', 'America/Los_Angeles', d.timezone),
      check('currency', 'Currency', 'USD', d.currency),
    ]
  const expectedFee = task.intent.noPrinter ? 500 : 0
  return [
    check('order', 'Order', 'ORD-1042', d.orderId),
    check('account', 'Account', 'DEMO-ACCOUNT-1', d.accountId),
    check(
      'items',
      'Return only the shoes',
      'SHOE-RED-8',
      [...d.selectedLineIds].sort().join(','),
      'Red shoes · size 8',
      d.selectedLines.map((l) => l.name).join(', ') || 'No item',
    ),
    check(
      'quantity',
      'Quantity',
      1,
      d.selectedLines.reduce((n, l) => n + l.quantity, 0),
    ),
    check(
      'jacket',
      'Keep the jacket',
      false,
      d.selectedLineIds.includes('JACKET-BLACK-M'),
      'Kept',
      d.selectedLineIds.includes('JACKET-BLACK-M') ? 'Selected for return' : 'Kept',
    ),
    check(
      'reason',
      'Return reason',
      task.reason,
      d.reason,
      reasons[task.reason] || 'Choose a reason',
      reasons[d.reason] || 'Not selected',
    ),
    check(
      'destination',
      'Refund destination',
      task.intent.refundDestination,
      d.refundDestination,
      destinationLabel(task.intent.refundDestination),
      destinationLabel(d.refundDestination),
    ),
    check(
      'method',
      'Return method',
      expectedMethod(task),
      d.method,
      methodLabel(expectedMethod(task)),
      methodLabel(d.method),
    ),
    check('currency', 'Currency', 'USD', d.currency),
    check('subtotal', 'Item value', 8000, d.subtotalCents, dollars(8000), dollars(d.subtotalCents)),
    check(
      'deduction',
      'Deduction',
      expectedFee,
      d.deductionCents,
      dollars(expectedFee),
      dollars(d.deductionCents),
    ),
    check(
      'refund',
      'Expected refund',
      8000 - expectedFee,
      d.expectedRefundCents,
      dollars(8000 - expectedFee),
      dollars(d.expectedRefundCents),
    ),
  ]
}
export function observedTerms(kind, values, confirmation = false) {
  if (kind === 'appointment')
    return {
      booking_id: String(values.booking_id ?? '').trim(),
      slot_id: String(values.slot_id ?? '').trim(),
      starts_at: String(values.starts_at ?? '').trim(),
      technician: String(values.technician ?? '').trim(),
      service: String(values.service ?? '').trim(),
      address: String(values.address ?? '').trim(),
      timezone: String(values.timezone ?? '').trim(),
      fee: amount(values.fee),
      currency: String(values.currency ?? '').trim(),
      ...(confirmation
        ? {
            request_id: String(values.request_id ?? '').trim(),
            active_bookings: integer(values.active_bookings),
          }
        : { draft_revision: integer(values.draft_revision) }),
    }
  return {
    account_id: String(values.account_id ?? '').trim(),
    order_id: String(values.order_id ?? '').trim(),
    line_ids: lines(values.line_ids),
    quantity: integer(values.quantity),
    reason: codes(values.reason, reasons),
    method: codes(values.method, {
      qr_dropoff: methodLabel('qr_dropoff'),
      print_label: methodLabel('print_label'),
    }),
    destination: codes(values.destination, {
      store_credit: destinationLabel('store_credit'),
      original_payment: destinationLabel('original_payment'),
    }),
    currency: String(values.currency ?? '').trim(),
    subtotal: amount(values.subtotal),
    deduction: Math.abs(amount(values.deduction) ?? NaN),
    refund: amount(values.refund),
    next_step: String(values.next_step ?? '').trim(),
    ...(confirmation
      ? {
          request_id: String(values.request_id ?? '').trim(),
          jacket_kept: ['yes', 'true'].includes(normalized(values.jacket_kept)),
        }
      : { draft_revision: integer(values.draft_revision) }),
  }
}
export function expectedTerms(kind, d, confirmation = false) {
  if (kind === 'appointment')
    return {
      booking_id: d.bookingId,
      slot_id: d.slotId,
      starts_at: d.startsAt,
      technician: d.technician,
      service: d.service,
      address: d.address,
      timezone: d.timezone,
      fee: d.feeCents,
      currency: d.currency,
      ...(confirmation
        ? { request_id: d.requestId, active_bookings: 1 }
        : { draft_revision: d.revision }),
    }
  return {
    account_id: d.accountId,
    order_id: d.orderId,
    line_ids: [...d.selectedLineIds].sort().join(','),
    quantity:
      d.selectedLines?.reduce((n, l) => n + l.quantity, 0) ??
      d.lines.reduce((n, l) => n + l.quantity, 0),
    reason: d.reason,
    method: d.method,
    destination: d.refundDestination,
    currency: d.currency,
    subtotal: d.subtotalCents,
    deduction: d.deductionCents,
    refund: d.expectedRefundCents,
    next_step: d.nextStep,
    ...(confirmation
      ? { request_id: d.requestId, jacket_kept: true }
      : { draft_revision: d.revision }),
  }
}
export function extractObjective(kind, confirmation = false) {
  if (kind === 'appointment')
    return (
      'Store the booking ID as "booking_id", selected slot ID as "slot_id", exact ISO start time including offset as "starts_at", technician full name as "technician", service as "service", address as "address", timezone identifier as "timezone", additional fee in dollars as "fee", currency code as "currency". ' +
      (confirmation
        ? 'Store the change request ID as "request_id" and active bookings count as "active_bookings".'
        : 'Store only the numeric draft revision as "draft_revision".')
    )
  return (
    'Store account ID as "account_id", order ID as "order_id", selected/returned line IDs as "line_ids", selected/returned quantity as "quantity", reason for return as "reason", selected return method as "method", selected refund destination as "destination", currency code as "currency", item subtotal in dollars as "subtotal", deduction in dollars as "deduction", expected refund in dollars as "refund", and exact next-step instructions verbatim as "next_step". ' +
    (confirmation
      ? 'Store the return request ID as "request_id" and whether the jacket was kept as "jacket_kept".'
      : 'Store only the numeric draft revision as "draft_revision".')
  )
}
export function validationObjective(task) {
  if (task.kind === 'appointment')
    return (
      `Do not edit or submit. Verify booking BOOK-2048 has selected slot ${task.intent.slotId}. Verify the source selection still meets these requirements: Saturday ${task.intent.date} before noon, ${task.intent.keepTechnician ? 'technician Maya Chen' : 'any technician'}, additional fee at most ${dollars(task.intent.maxFeeCents)}, Washer repair at 42 Linden Street, San Francisco, timezone America/Los_Angeles. Verify the selected slot is available. ` +
      extractObjective(task.kind)
    )
  return (
    `Do not edit or submit. Verify order ORD-1042, account DEMO-ACCOUNT-1, only Red running shoes size 8 quantity 1 selected, and jacket excluded. Verify reason ${reasons[task.reason]}, method ${methodLabel(expectedMethod(task))}, destination ${destinationLabel(task.intent.refundDestination)}, USD subtotal $80.00, deduction ${task.intent.noPrinter ? '$5.00' : '$0.00'}, expected refund ${task.intent.noPrinter ? '$75.00' : '$80.00'}. ` +
    extractObjective(task.kind)
  )
}
