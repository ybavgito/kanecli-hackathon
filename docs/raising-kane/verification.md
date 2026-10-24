# Raising Kane verification

## October 24, 2026: initial shared checkpoint

- `npm run build`: passed.
- `npm run verify:kane` with recorded name `raising-kane-smoke`: passed.
- Scope: product branding, the request textbox and the explicit fictional merchant
  and simulated order disclosure. The check did not start a return task.
- Kane duration: 52.7 seconds; five completed browser steps; 14.99 credits.
- Saved journey: `.testmuai/tests/raising-kane-smoke_test.md`.
- [Kane run in Test Manager](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5QVMV2RDQVTG3AY1BN5SE5A/dashboard/share/US_0V4U8KY97VOPRHS54Y1LFO7UOW0UX10S8BS80DNAFCC8OH7C4LLSTRGQKPAZDOYD?type=summary&agentView=true&fqdn=summary-page).

The complete return flow, source-owned approval grants, uncertain-submission
recovery and final confirmation verification remain unverified at this checkpoint.
Native assurance coverage was not measured by this smoke check.

## Runtime return checks

These were real Kane jobs dispatched by the product controller through its HTTP
API. This is not yet a full test of every frontend interaction or completed
submission. All records are synthetic.

| Phase | Kane result | Duration | Observed scope |
| --- | --- | --- | --- |
| [discover](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5QW0B18KX6EJD7QGAFWVPP3/dashboard/share/US_VJES3140Z4I2X39VZ6GC79LYJC5VEQ2CCBHW1NEPL075QJ9RK90HR451WP9VSSCT?type=summary&agentView=true&fqdn=summary-page) | passed | 45s | Read order ORD-1042 and both items. |
| [prepare](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5QW2KY9R09Z1QCXE896MG28/dashboard/share/US_ZQOTGSEZY4VJMMZ7KPJ24W623BUZSSLEK5FITXNFJK2UQSAZJZRKRR7ANT7Z4382?type=summary&agentView=true&fqdn=summary-page) | passed | 106s | Prepared shoes only, kept jacket, original payment, $80. |
| [change-method](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5QWA3JZW5G7235B9DP6GQYB/dashboard/share/US_BIXBWNTQH0JCM15FXABXESKZ1Q0THDYI07TX7SM4O0XBQMZW1N836OE4FVT1FKWS?type=summary&agentView=true&fqdn=summary-page) | failed | 42s | Restart test exposed browser process loss; source unchanged. |
| [change-method](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5QWFSV5G8Q2Z9MYSMJP5NBR/dashboard/share/US_JNXR9J2PVNL76GJNG3M85LFNM380Q82A8C1HNHUYOT6GM65I6JQCKWHOT8M26ORA?type=summary&agentView=true&fqdn=summary-page) | failed | 48s | An ambiguous pre-edit assertion failed; source unchanged. |
| [change-method](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5QWN4HJ1RRN85XRF5C12JG1/dashboard/share/US_RYFIC6AVIB88GGL9NADAYUC1OUFH76AFTBYLBU8LWYJF353PK0HQ6ZO4D8HP3HX1?type=summary&agentView=true&fqdn=summary-page) | passed | 64s | Reconnected after server restart; selected QR, source reset to store credit and $75. |
| [validate-review](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5QWT5P03WEWRD75FZ93CD72/dashboard/share/US_0TYNCNGXBPKMGU8M0BHEOEUSO6X4FQP8Y4R8509FDQR8P3G3I96D9CC3TAXWCCR4?type=summary&agentView=true&fqdn=summary-page) | failed | 84s | Expected failure: store credit conflicts with original-payment intent. |
| [correct](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5QWZDTPWVS71A7V6PEV80ZR/dashboard/share/US_Y6M5LWZZHZ1SRBQ5BUYRONIJTNPGS0RQ9AO7KS8VYYTAXFBTKHH79NCVNEIN6ITK?type=summary&agentView=true&fqdn=summary-page) | passed | 60s | Changed source refund destination back to original payment. |
| [validate-review](https://test-manager.lambdatest.com/projects/01M5QFXVQKQ0KCCE24PC0BJXYP/test-cases/01M5QX183K2AN6MNSZRMW47BYX/dashboard/share/US_BKKG2NSVVFVDXBNN4L9HEO1X3A3FOULLUDIYY0MCV7D13CIYRBID3DVVQUOIL2BH?type=summary&agentView=true&fqdn=summary-page) | passed | 85s | Same review validator passed: source revision 6, shoes only, jacket kept, QR, original payment, $5 deduction, $75 expected refund. |

The conflicting draft could not be approved: the product API returned HTTP 409,
while the source contained zero submitted returns. After correction, the same
review validator passed and every stored constraint matched source revision 6.
No return has been submitted by this task.

Source writes were real browser actions. Controller comparisons use the merchant
module’s read-only draft view, which exposes the same state as
`GET /merchant/api/state`. The source grant, operation lookup, persistent
confirmation and synthetic QR remain the teammate’s integration work. Product
submission is disabled until the required source APIs exist.
