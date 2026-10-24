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
