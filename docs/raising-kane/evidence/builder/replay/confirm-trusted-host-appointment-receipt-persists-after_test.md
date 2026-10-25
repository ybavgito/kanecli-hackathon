---
assurance:
  id: t-1
  base: sha256:247ba8b2d77b89b3c94fae1a13f79ac5e6a67f4c39a913da4376bda56f76b07c
---
# Confirm trusted-host appointment receipt persists after reload

> Read the completed synthetic trusted-host receipt, reload, and confirm the same status, request, customer, date, Pacific time, zero fee, and remaining booking without starting or submitting a task.

## Step 1 @verifies ac-1, ac-2, ac-3, ac-4, ac-5, ac-6, ac-7

Open http://127.0.0.1:5260/builder-preview/c4af2431-30ac-45a5-a5f2-d9c5c706d9a3/verify?key=ce67207f-a88f-4ffc-a235-a387770d84d2 in the browser and inspect the already-completed appointment-change receipt on the trusted host, allowing the preview to finish loading; then assert the trusted host displays “Appointment change confirmed,” request CHG-1001, Maya Chen, an appointment on October 31 2026 at 11:00 Pacific, a $0.00 fee, and “One active booking remains.”

## Step 2 @verifies ac-1, ac-2, ac-3, ac-4, ac-5, ac-6, ac-7

Reload the browser page for the same trusted-host appointment-change receipt without starting a task, changing choices, approving, or submitting anything; then assert the trusted host still displays “Appointment change confirmed,” request CHG-1001, Maya Chen, the appointment on October 31 2026 at 11:00 Pacific, a $0.00 fee, and “One active booking remains.”
