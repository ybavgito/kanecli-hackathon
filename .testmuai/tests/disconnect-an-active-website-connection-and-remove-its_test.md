---
assurance:
  id: t-10
  base: sha256:225422f0fbc83330818809465e83601d973573697a5ddaf94b7644c4a7a9c120
---
# Disconnect an active website connection and remove its profile

> While a website browser connection has active jobs, disconnect it so its jobs are cancelled and its associated browser profile is deleted.

## Step 1

At {{start_url}}, open Raising Kane and establish a website browser connection for {{https_site_url}} with a running job, using its dedicated visible Chrome profile.

## Step 2 @verifies ac-28

In Raising Kane, use Disconnect on that website browser connection while its job is running, then assert no running job belonging to the disconnected connection remains observable.

## Step 3 @verifies ac-29

Inspect the browser-visible Chrome profiles after disconnecting that connection, then assert the dedicated Chrome profile associated with that disconnected connection no longer exists.
