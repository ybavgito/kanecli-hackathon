# URL-first stage 1 Kane assurance design

Generated October 24, 2026 with Kane CLI 0.10.0-rc.3 from
`.testmuai/requirements/url-first-stage1.md`. The folder is linked to the
existing Test Manager project **KaneAI Generated**
(`01M5QFXVQKQ0KCCE24PC0BJXYP`). There is no local `.context/` store.

## Saved sessions and coverage

- Requirement extraction: `ext-20261024T215358-9bcc23` (four proposed use cases).
- URL discovery design: `design-20261024T215640-b1e439` (eight scenarios/tests).
- Human takeover design: `design-20261024T215910-2c0e2d` (one scenario/test).
- Disconnect design: `design-20261024T220136-b7b632` (one scenario/test).
- Action-option design: `design-20261024T220324-9f41cf` (one scenario/test).
- Human-only handoff clarification: `reconcile-20261024T221122-fc124f`.
- Supersession of the credential-taking test: `design-20261024T221436-58be29`.
- Independent handoff/resume checks: `reconcile-20261024T221605-997a62`.

Every session was saved. Test Manager has 12 current cases; each save reported
no refused test files and no waiting cases. Four use cases have 38 acceptance
criteria. One generated test has passed in a real browser, giving **1 proven
criterion, about 2% shared coverage**. The design emitted open-question records,
including unspecified inspection bounds and action count; the linked-project
CLI does not expose their full descriptions through `cover gaps` or
`context explain`.

## Generated tests

All files below are assurance-generated; none was hand-authored:

- `.testmuai/tests/reject-embedded-credential-url_test.md`
- `.testmuai/tests/inspect-actual-unfamiliar-site-without-changing-it_test.md`
- `.testmuai/tests/reject-unsupported-url-scheme_test.md`
- `.testmuai/tests/show-honest-status-for-blocked-page_test.md`
- `.testmuai/tests/inspect-order-before-site-wide-browsing_test.md`
- `.testmuai/tests/accept-https-without-task-description_test.md`
- `.testmuai/tests/accept-http-without-task-description_test.md`
- `.testmuai/tests/accept-optional-task-description_test.md`
- `.testmuai/tests/stop-kane-at-browser-takeover-before-website-sign-in_test.md`
- `.testmuai/tests/inspect-independently-prepared-resumed-browser-connection_test.md`
- `.testmuai/tests/disconnect-an-active-website-connection-and-remove-its_test.md`
- `.testmuai/tests/inspect-unrelated-actions-without-carrying-over-another-site_test.md`

The generated variable names are `start_url`, `unfamiliar_site_url`,
`blocked_site_url`, `order_url`, `https_site_url`, `http_site_url`,
`first_site_action`, `first_site_only_option`, `second_unrelated_site_url`,
`second_site_action`, `website_url`, and `prepared_connection_label`.
Only `start_url` was filled with the local app address. Before running a selected test,
provide only its real site values in `.testmuai/variables/assurance.json`;
avoid invented placeholder values.

## Review before execution

The first generated sign-in test incorrectly asked Kane to type credentials.
Assurance superseded it with two independently runnable checks: one ends at
Take over before sign-in, and the other starts from an honestly labeled
prepared connection after a person signed in directly and continued. The old
test and its intermediate replacements were moved intact to
`docs/raising-kane/superseded-tests/`, outside the auto-discovered suite.
The replacement chain is `t-9` → `t-14` → `t-15`/`t-16`; `t-12` and `t-13`
were also superseded. No active generated test asks for credentials. The
disconnect
test expects a browser-visible proof that the profile directory was deleted,
which a web-only browser check may not be able to establish. Pair it with a
local controller/profile inspection rather than claiming that Kane alone proved
deletion.

The unsupported-scheme check passed in a separate headless Chrome profile.
Its finalized, validated pack is
`.testmuai/evidence/113b385a-8433-4728-bdef-a2fb9e0a40ba.evidence`.
The screenshot showed the rejected `ftp://example.invalid` and the app's
“Use an HTTP or HTTPS website URL” message. The next relevant browser check
is `accept-https-without-task-description_test.md` with a real public HTTPS
site; it has not been run. The other generated tests are coverage candidates,
not passing behavior claims.

An explicit replay of that saved file also passed (1/1) in headless Chrome.
The finalized, validated replay pack is
`.testmuai/evidence/fecb84bb-ebf6-43b6-86cf-56b4eeab7374.evidence`.
This was **not** a clean or fast replay: the recorded final assertion first
failed after its visual check misread the rejected URL as accepted. Kane's
default adaptive healing then reran the second test step and verified the
visible “Use an HTTP or HTTPS website URL” error. The evidence marks the
test flaky and healed, with a 44-second member and 62.456-second suite.
It records 16.12 Kane credits for the healed step. Project coverage remained
1 of 38 criteria proven (1.8797%). This run supports the URL validation
behavior, but a stable replay regression still needs proof.
