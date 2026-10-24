---
assurance:
  id: t-14
  base: sha256:f266f402f0298273de3683fef1ffa0d9aa44f070a0bb014e4ffa1516f1277e4d
---
# Take over website sign-in and resume Kane safely without credential entry

> The person takes over the dedicated visible browser, signs in directly if the website requires it, receives external page/evidence processing explanation before authenticated resume and explicitly continues; only then a separate Kane check reuses that browser and rechecks the page and account.

## Step 1 @verifies ac-16, ac-17, ac-18, ac-19, ac-20

At {{start_url}}, establish a Raising Kane website connection for {{website_url}} in the dedicated visible Chrome browser, then assert the connection offers Open website, Take over, Continue with Kane and Disconnect in that dedicated visible profile.

## Step 2 @verifies ac-15, ac-21, ac-35, ac-36, ac-37

At the Raising Kane website connection, select Take over and stop Kane browser verification at the handoff; while Continue with Kane has not been selected, observe Raising Kane's own controls and activity without inspecting the person's website authentication, then assert Kane automation and early page or account inspection have stopped and Kane has neither entered nor received website credentials.

## Step 3

Leave control of the connected visible website browser with the person to sign in directly and handle any website authentication challenge; do not enter, request or inspect credentials on the person's behalf.

## Step 4 @verifies ac-26, ac-27

After the person has signed in directly and explicitly requests Continue with Kane on the Raising Kane connection, observe the authenticated-resume gate, then assert the explanation of external page processing and external evidence processing precedes authenticated resume.

## Step 5 @verifies ac-23, ac-24, ac-25

Only after the person's explicit continuation and the processing explanation, perform a separate Kane check of the resumed connection, then assert it is the same browser connection used during takeover and the resumed page and account are rechecked.
