---
assurance:
  id: t-16
  base: sha256:bc3983602f0e2844142c344a1a4db56b14a12b5c2a32e64d4510b64cbd55a32a
---
# Inspect independently prepared resumed browser connection

> From an honestly labeled connection prepared by a person who has already signed in and explicitly continued, independently verify the processing explanation precedes resumed inspection and that Kane reconnects to the same browser and rechecks the page and account, without signing in or waiting for a person inside the job.

## Step 1

At {{start_url}}, open the Raising Kane connection labeled {{prepared_connection_label}}, prepared outside this job by the person after direct website sign-in and explicit Continue with Kane; do not repeat or wait for sign-in.

## Step 2 @verifies ac-26

On this prepared website connection, examine the explanation of external page processing before authenticated resume, then assert that explanation preceded the resumed inspection.

## Step 3 @verifies ac-27

On this prepared website connection, examine the explanation of external evidence processing before authenticated resume, then assert that explanation preceded the resumed inspection.

## Step 4 @verifies ac-23, ac-24, ac-25, ac-15, ac-35, ac-38

From the prepared Raising Kane connection, inspect the resumed website using Kane only after the person's already-completed continuation, then assert the same browser connection is used, Kane rechecks the page and account, and neither enters nor collects website credentials or waits for website sign-in.
