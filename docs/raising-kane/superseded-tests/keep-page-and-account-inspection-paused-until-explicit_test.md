---
assurance:
  id: t-13
  base: sha256:efd1f3213c324023eca46837fdeb215856d6efc96c6b065a61ad36b4d2a08aeb
---
# Keep page and account inspection paused until explicit continuation

> After the person takes over and before explicitly selecting Continue with Kane, Kane neither automates nor checks the resumed page or account.

## Step 1

At {{start_url}}, create or open a Raising Kane website connection for {{website_url}} in its dedicated visible Chrome browser.

## Step 2 @verifies ac-21

On the Raising Kane browser connection, select Take over without selecting Continue with Kane; while the person controls the visible website browser, assert Kane's browser automation has stopped.

## Step 3 @verifies ac-36, ac-37

Remain in takeover with Continue with Kane unselected while the person uses the visible website browser; observe Kane's browser activity and any page or account inspection shown by Raising Kane, then assert no Kane page or account inspection occurs before the person's explicit continuation.
