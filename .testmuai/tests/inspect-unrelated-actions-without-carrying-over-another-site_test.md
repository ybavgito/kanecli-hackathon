---
assurance:
  id: t-11
  base: sha256:7dc458509cc463c703c0fb6dd6a29dea92d5f303ea6ba8b07e503435a09f2096
---
# Inspect unrelated actions without carrying over another site's option

> After inspecting a discovered action on one website, select a discovered action on an unrelated website with distinguishable real options and prove that only the latter action's actual options are reported as its options.

## Step 1

Open Raising Kane at {{start_url}} and reach its website URL entry point.

## Step 2

In Raising Kane, submit {{unfamiliar_site_url}} and inspect the discovered actions for that actual website.

## Step 3 @verifies ac-30, ac-31

On Raising Kane's discovered-actions view for {{unfamiliar_site_url}}, select {{first_site_action}} and inspect its options against that site's actual action, then assert the inspection uses the selected action's intent and every reported option is an actual option of that action, including {{first_site_only_option}}.

## Step 4

In Raising Kane, submit {{second_unrelated_site_url}} and inspect the discovered actions for that different website.

## Step 5 @verifies ac-30, ac-31, ac-32, ac-34

On Raising Kane's discovered-actions view for {{second_unrelated_site_url}}, select {{second_site_action}} and inspect its options against that website's actual action, then assert the inspection uses the selected action's intent, every reported option belongs to that action, both unrelated websites yielded their own actual action options, and {{first_site_only_option}} is absent from the second action's reported options.
