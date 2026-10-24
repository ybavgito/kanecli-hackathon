# Raising Kane URL-first stage 1 requirements

The product name is Raising Kane. The tagline is When websites raise hell, raise Kane.
The user pastes a website URL. Describing a task is optional.
The URL is the only required input. HTTP and HTTPS URLs are accepted; other schemes
and URLs containing credentials are rejected. Unfamiliar sites are never replaced
with the merchant sandbox.

Without a description, perform bounded read-only browser inspection and present
a small set of actions discovered from that page, with observed source evidence.
An order URL stays focused on that order. Do not crawl the whole site first.
An inaccessible or blocked page receives an honest status, with no invented actions.
Discovered actions are not labeled as verified completed workflows.

Selecting a discovered action supplies the intent and inspects its actual options.
The same generic engine must work on unrelated websites without per-site workflow code.

Use a dedicated visible Chrome profile. Open website, Take over, Continue with
Kane and Disconnect are available. Taking over stops automation. The person signs
in directly, handling SSO, OTP, passkeys or CAPTCHA themselves. Continue reconnects
to the same browser and rechecks the page and account. Do not collect credentials
in Raising Kane. Explain external page/evidence processing before authenticated
resume. Disconnect cancels jobs and deletes that connection's browser profile.

For browser verification of takeover, Kane must stop at the handoff and must
not enter or receive website usernames, passwords, one-time codes, or other
credentials. The person signs in directly in the visible website browser.
Only after that person explicitly continues may a separate Kane check inspect
the resumed page and account in the same browser connection. A test must not
simulate the person's sign-in by asking Kane to type credentials.

Assurance should use two independently runnable browser checks for this handoff.
The first ends when automation stops at Take over, before website sign-in. The
second starts from an honestly labeled prepared connection where the person
has already signed in and explicitly selected Continue with Kane; it checks
the same browser connection, page and account after the processing explanation.
No Kane test waits for or performs the person's website sign-in inside a job.
