---
assurance:
  id: t-9
  base: sha256:4e03b937a96965a476c96caadaeadbdafebd0eef191edce00e17c02ccfa7c33c
---
# Take over website sign-in and resume Kane safely

> In the dedicated visible Chrome connection, the person takes over while Kane stops, signs in directly on the website, receives the external page/evidence-processing explanation before authenticated resume, and continues in that same browser with page and account rechecked.

## Step 1 @verifies ac-16, ac-17, ac-18, ac-19, ac-20

At {{start_url}}, establish a Raising Kane website connection for {{https_site_url}} and open its dedicated visible Chrome browser, then assert that the browser profile is dedicated and visible and that Open website, Take over, Continue with Kane, and Disconnect are available.

## Step 2 @verifies ac-15, ac-21, ac-22

In the connected website's visible Chrome browser, take over from Kane and sign in directly on {{https_site_url}} as the person using {{site_signin_user}} and {{site_signin_password}}, handling any website authentication challenge there; then assert Kane automation does not continue during takeover, sign-in occurred on the website, and Raising Kane did not collect the website credentials.

## Step 3 @verifies ac-26, ac-27

From the Raising Kane connection after the person's website sign-in, request authenticated continuation with Kane, then assert the explanation of external page processing and external evidence processing occurs before authenticated resume.

## Step 4 @verifies ac-23, ac-24, ac-25

After the processing explanation, continue with Kane from the connected website and inspect the resumed connection, then assert it reconnects to the same browser used for takeover and performs a fresh page recheck and a fresh account recheck.
