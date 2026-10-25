# Verify one generated synthetic task interface

One user story: complete this exact supported synthetic journey through the generated interface at http://127.0.0.1:5260. This is a sandbox-only test session, so the browser verifier acts as the sandbox user, including approval through the trusted host panel. Generated code itself cannot approve. No production accounts or actions are involved.

## Required journey and observable outcomes
Inspect the immediate recorded-demo entry. On the homepage verify the website URL and optional task inputs exist. In Demo now click Verified return interface. Verify the build page clearly says Recorded generated build and explains that verification was captured previously, with an unchanged artifact. Verify source evidence and candidate results are inspectable. Click Use my interface, switch to the opened preview tab if necessary, and verify the generated return interface renders with Start this task available. Do not start the task, change source choices, approve, or submit anything. This is a UI and artifact-loading check only.

Stay within this one journey. Wait for source browser jobs to finish; they can take two minutes. Only use visible browser controls, not API calls, scripts or direct source edits. Keep all expectations above unchanged. Browser reload must preserve the same receipt.
