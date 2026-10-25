// Shared by the trusted host and tests; all source strings are escaped before HTML output.
export function receiptMarkup(task) {
  const r = task.receipt
  if (!r) return ''
  const escape = (value) =>
    String(value ?? 'Unknown').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    )
  const money = (value) =>
    typeof value === 'number'
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: r.currency || 'USD' }).format(
          value / 100,
        )
      : 'Unknown'
  let time = r.startsAt || 'Unknown'
  if (r.startsAt)
    try {
      time =
        new Intl.DateTimeFormat('en-US', {
          dateStyle: 'full',
          timeStyle: 'short',
          timeZone: r.timezone || 'America/Los_Angeles',
        }).format(new Date(r.startsAt)) +
        ' · ' +
        (r.timezone || 'America/Los_Angeles')
    } catch {}
  const rows =
    task.kind === 'return'
      ? [
          ['Request', r.requestId],
          ['Expected refund', money(r.expectedRefundCents)],
          [
            'Refund destination',
            r.refundDestination === 'original_payment'
              ? 'Original payment method'
              : r.refundDestination === 'store_credit'
                ? 'Store credit'
                : 'Unknown',
          ],
          ['Items', 'Red shoes selected for return · Jacket kept'],
        ]
      : [
          ['Request', r.requestId],
          ['Appointment', time],
          ['Technician', r.technician],
          ['Added fee', money(r.feeCents)],
        ]
  return (
    '<h1>' +
    (task.kind === 'return' ? 'Return requested; refund pending' : 'Appointment change confirmed') +
    '</h1><p>Verified against the saved source record.</p><dl>' +
    rows
      .map(([key, value]) => '<dt>' + escape(key) + '</dt><dd>' + escape(value) + '</dd>')
      .join('') +
    '</dl><p>' +
    (task.kind === 'return'
      ? 'Jacket kept. Your refund is pending; this receipt confirms the return request.'
      : 'One active booking remains.') +
    '</p><details><summary>Source record details</summary><dl>' +
    Object.entries(r)
      .filter(
        ([key, value]) =>
          !['sourceUrl', 'qrUrl', 'labelUrl'].includes(key) &&
          ['string', 'number'].includes(typeof value),
      )
      .map(([key, value]) => '<dt>' + escape(key) + '</dt><dd>' + escape(value) + '</dd>')
      .join('') +
    '</dl></details>'
  )
}
