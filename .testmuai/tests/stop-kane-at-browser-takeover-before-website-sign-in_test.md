---
assurance:
  id: t-15
  base: sha256:9fcb48d210e3f25b6821d8c94dcf732c3260ba952751fca90b096b82276aaf7c
---
# Stop Kane at browser takeover before website sign-in

> From an ordinary Raising Kane website connection, verify Take over stops automation at the handoff before website sign-in; the Kane job does not wait for or perform the person's website sign-in.

## Step 1 @verifies ac-16

At {{start_url}}, establish a Raising Kane connection to {{website_url}} and open its dedicated visible Chrome profile, then assert the website connection is in a dedicated visible Chrome profile.

## Step 2 @verifies ac-21, ac-35, ac-36, ac-37, ac-38, ac-18

On that Raising Kane website connection, select Take over while Kane is working on the connected website; end this Kane check at the handoff, before any website sign-in, then assert automation has stopped, Kane has entered no website credentials, has not inspected the page or account before Continue with Kane, and has not waited for the person's sign-in.
