---
assurance:
  id: t-1
  base: sha256:ee90137a02795dd17d644ee1d143012a455df8450932365144c3b3d4e523a4d9
---
# Inspect the read-only overview without starting a source transaction

> Review observed source screens and distinct browsable versus unknown or unvisited paths; check absence of transaction claims and return, approval, or submission controls; observe but do not activate the trusted host's Build a focused interface offer.

## Step 1 @verifies ac-6, ac-7

At http://127.0.0.1:5280/builder-preview/a292d00c-7281-4b24-bf7f-141123d3a3fa/verify?key=1a7f9bc0-df0d-4199-a73c-c74a798bfe21, wait for any source browser jobs to finish (they may take two minutes), then inspect the generated read-only website overview against any visible source observations, then assert source screens identified as actually observed and distinct browsable paths are shown.

## Step 2 @verifies ac-8, ac-3

In the generated read-only overview at the same verification URL, inspect the path descriptions and transaction-status wording, then assert unknown or unvisited paths are identified as such rather than passed off as observed paths and no completed transaction is claimed.

## Step 3 @verifies ac-1, ac-2, ac-4, ac-5

On that read-only overview, inspect the available return and transaction actions without initiating a source task, then assert no approval control, submission control, Return reason control, or return-method selection control is offered.

## Step 4 @verifies ac-9

In the trusted host panel alongside the read-only overview, inspect the available next step without activating it, then assert Build a focused interface is explicitly offered as the next step.
