# Raising Kane

**When websites raise hell, raise Kane**

## Current direction — October 24, 2026

The user pastes a website URL. A description of what they want is optional.
Raising Kane inspects the current page, discovers useful actions, presents plain
choices and their observed consequences, performs a selected supported task, and
verifies the result. The core experience is discovering and comparing actual
options before committing.

This explicit user direction supersedes the fixed merchant/appointment adapter
scope. The previous brief is preserved as `pre-url-first-project-brief.md`.
The merchant remains a labeled controlled regression example; the human teammate
continues owning its source files and transaction contract.

## Entry and progressive discovery

The URL is the only required input. Accept unfamiliar HTTP/HTTPS URLs. Never
replace them silently with the sandbox. Reject non-web schemes and credential
URLs. Show honest inaccessible, blocked and unsupported states.

Use bounded inspection of the current page; show up to four evidenced actions
without crawling the whole site. Selecting an action supplies intent. Preserve
page context, such as the specific order or repository. Follow at most two
relevant read-only links when inspecting a selected action and discover more as
the person explores. No universal support claim follows from discovering a link.

## Generic task and reusable interface

Connections hold the website, observed account, actions, records and evidence.
Workflows hold the selected action, goal, constraints, answers, observed options,
proposal, approval, execution state and verified receipt. Content comes from
Kane observations, rendered through reusable cards, choices, forms, comparisons,
review panels and receipts. There is no per-site workflow implementation in the
generic engine. The existing return controller is isolated as a regression demo.

Keep these states distinct: option discovered, terms observed, draft checked,
action submitted, result verified, and result unknown. A read-only result says
no records were changed. Unknown price, identity, requirement or next step stays
unknown instead of becoming zero, free, or confirmed.

## Human sign-in and session continuity

Use one dedicated visible Chrome profile per website connection. It does not use
the person's ordinary browser cookies. Serialize jobs. On sign-in, SSO, OTP,
passkey, CAPTCHA or a blocked page, stop automation and offer human takeover.
The person signs in on the original website. Continue with Kane reconnects to the
same profile and rechecks the page/account before proceeding. An account change
invalidates existing approvals and tasks. Disconnect cancels jobs and deletes
the connection's profile. Browser control endpoints never reach frontend state.

Passwords and OTPs must never be requested by Raising Kane, placed in objectives,
or copied into task history/application logs. Audit the installed CLI's screenshot,
evidence and upload behavior before using personal accounts. Local Chrome does
not imply local-only processing. Explain external processing before authenticated
resume and keep automation fully paused during credential entry.

## Options, approval and execution

For each observed option show price/fee/deduction, requirements, what changes,
and what happens next. Search/filter controls may retrieve information. Draft
exploration is allowed only when the source explicitly supports reversibility;
browser Back is never assumed to undo a transaction.

Retain user constraints across changing source defaults. Surface conflicts and
recheck corrections. Material changes invalidate approval. A consequential action
requires approval of a checked proposal and a fresh term check before execution.
Execute at most once, then independently inspect the resulting source record.
Missing confirmation or timeout becomes result unknown and uses read-only
reconciliation. Never blindly repeat a submission. Ordinary sites do not supply
the sandbox's atomic approval/idempotency APIs; unsupported final boundaries use
human takeover, followed by inspection of the actual result.

## Kane roles and scope

- Runtime action mode for bounded inspection and explicit blocked/auth handling.
- Persistent CDP sessions for continuity, pause/resume and human control.
- Structured extraction, DOM/visual/URL assertions and suitable network checks.
- Controller-owned questions; non-interactive runs do not ask the user themselves.
- Individual analyzer verdicts interpreted separately from process exit codes.
- Sealed evidence linked to observations and result verification.
- Assurance-generated development tests, saved sessions and measured coverage in
  the existing shared Test Manager project.
- Investigate replay/healing for proven repeatable flows. Healing must preserve
  the original requirements. Explore designs tests; execute them separately.
- Use cloud, parallel, mobile and export only for a concrete requirement.

## Delivery and verification

Current delivery order: connect Kane's discoveries to usable cards; complete a
read-only task from a card; independently verify and save its useful information
so it survives reload; repeat on a second unrelated website with the same code.
Read-only information does not need transaction approval. Questions, comparisons,
approval and consequential execution remain separate later work. Browser takeover
and resume use direct human login on an authorized test website.

The implementation contract is `url-first-contract.md`; build ownership is in
`two-person-build.md`. `.testmuai/context.md` and `verification.md` distinguish
implemented behavior from actual Kane results. Historical merchant evidence does
not verify this new generic engine. Run the build after meaningful changes,
generate tests through assurance, inspect real Kane evidence and fix failures.
