---
assurance:
  id: t-4
  base: sha256:4717655f80d44c706cd5efca5c16b5b157f3add8c03bb5a8b5b554a73d75d533
---
# Inspect recorded build evidence after browser reload

> Revisit a synthetic task with previously recorded build evidence, reload, and inspect the retained stages, screenshots, transitions, decisions, candidate checks and capture-time labels.

## Step 1

At http://127.0.0.1:5220, open the Northstar Outfitters synthetic task's previously saved build workspace containing recorded build stages, source screenshots, observed transitions, interface decisions, and candidate checks.

## Step 2 @verifies ac-35

Reload the saved build workspace and open its source screenshots evidence, then assert recorded source screenshots remain accessible after reload.

## Step 3 @verifies ac-36

In that reloaded workspace, inspect the observed transitions evidence, then assert recorded observed transitions remain accessible after reload.

## Step 4 @verifies ac-37

In that reloaded workspace, inspect the interface decisions evidence, then assert recorded interface decisions remain accessible after reload.

## Step 5 @verifies ac-38

In that reloaded workspace, inspect the candidate checks evidence, then assert recorded candidate checks remain accessible after reload.

## Step 6 @verifies ac-39

In that reloaded workspace, inspect the build stages, then assert user-visible build stages remain accessible after reload.

## Step 7 @verifies ac-40

In the reloaded workspace's recorded evidence, inspect the evidence entries across the available stages, screenshots, transitions, decisions, and candidate checks, then assert each recorded evidence entry has a visible capture-time label.
