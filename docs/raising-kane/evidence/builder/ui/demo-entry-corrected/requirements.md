# Verify one generated synthetic task interface

One user story: perform only the explicitly requested browser journey at http://127.0.0.1:5260. This is a synthetic sandbox. Approve or submit only if the required journey below explicitly instructs those actions, and then only through the trusted host panel. Generated code itself cannot approve. No production accounts or actions are involved.

## Required journey and observable outcomes
On the homepage verify the website URL input and optional task input. In Demo now click Verified return interface. On the resulting build page assert Recorded generated build is visible. Inspect a source evidence image and close it without leaving the build page; assert the source evidence and candidate result are available. Only after those assertions click Use my interface, which navigates in the SAME tab. In the resulting preview assert the generated interface renders and the enabled Start this task button is visible, WITHOUT clicking that button. Stop there. Do not start a task, change choices, restore choices, approve or submit. There is no receipt to inspect in this journey. Do not leave the build page before inspecting its evidence.

Stay within this one journey. Wait for source browser jobs only when the required journey explicitly starts them; they can take two minutes. Only use visible browser controls, not API calls, scripts or direct source edits. Keep all expectations above unchanged. Do not add transaction, receipt or approval steps to a read-only inspection.
