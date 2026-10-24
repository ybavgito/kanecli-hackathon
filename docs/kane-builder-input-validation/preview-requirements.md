# Inspect an offline return comparison generated from Kane evidence

The synthetic evidence preview is at http://127.0.0.1:38491/generated/agentic.html.
It is an offline comparison, not a connected transactional product. It must never offer
submission or claim to have completed a return. This is one use case: compare the two
return methods using the generated interface's method controls.

The user is returning Blue shoes only and keeping Green jacket, and prefers original
payment. Both methods must remain selectable, with the corresponding observed values
shown after selection. For Printed label, the source quote is Original payment, deduction
$0.00, refund $80.00 USD. For QR drop-off, the source quote is Store credit, deduction
$5.00, refund $75.00 USD. The QR view must visibly explain its conflict with the user's
original-payment preference. The QR instructions must state photo ID is required and the
maximum parcel is 4 kg. These expected values are from the controlled source fixture;
they are not copied from the generated candidate or its model response.

Verification should establish that those facts appear under their corresponding method,
not merely somewhere in hidden source markup, and that the user can change the selected
method. Treat the site as read-only evidence; do not attempt external navigation or any
transaction. Keep the designed suite to a single bounded comparison scenario.
