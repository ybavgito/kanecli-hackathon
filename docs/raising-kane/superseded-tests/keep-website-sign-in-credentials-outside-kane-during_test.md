---
assurance:
  id: t-12
  base: sha256:6da6e324fffbe4ede51d2fe893414cdbb40f301db7d0382f8684f4107944cddc
---
# Keep website sign-in credentials outside Kane during takeover

> With a website connection in takeover, Kane neither asks for nor enters or receives the person's website credentials; any website authentication challenge remains for the person in the visible website browser.

## Step 1

At {{start_url}}, create or open a Raising Kane website connection for {{website_url}} in its dedicated visible Chrome browser.

## Step 2

On the Raising Kane browser connection, select Take over and hand control of the visible website browser to the person without entering any website credentials for them.

## Step 3 @verifies ac-15, ac-35

During the person's direct website sign-in in the visible browser, observe Raising Kane's own inputs and browser network requests to Raising Kane rather than the website's authentication requests; then assert Kane entered no website credentials and Raising Kane received no website credentials.
