# Raising Kane: review packet integration

Imported October 24, 2026 from the supplied
[raising-kane-review-packet.zip](../raising-kane-review-packet.zip).
The original ZIP is preserved byte-for-byte as a historical snapshot. The working
documents have since been updated; they are no longer all byte-identical to that
snapshot. This file is a repository integration note, not part of the original packet.

## October 24 measured update

The root field guide now incorporates actual rc.3 feature experiments. Its previous
contents, including macOS reproduction notes, are preserved in
`kane-field-guide-repo-historical.md`. The packet's field-guide filename redirects
to the maintained root guide. See `../kane-validation/report.md` for measured
results and `workflow-and-demo-design.md` for the website-first task catalog and
preparation/runtime verification distinction. The product brief incorporates that
entry experience while retaining its atomic transaction contracts.

Selected published evidence packs replace only account username/email metadata;
their provenance and hashes are explicit. No credentials, authenticated browser
profiles or assurance stores are committed. A public red/green example does not
claim that the full Raising Kane source integrations have been implemented.

## Which documents govern now

- [raising-kane-project-brief.md](raising-kane-project-brief.md) is the current
  consolidated product specification. The packet README explicitly gives it
  precedence over earlier research where scope differs.
- The packet's [clearpath-complete-project-brief.md](clearpath-complete-project-brief.md)
  is a short rename/redirect notice. It replaces the old brief's role as the current
  specification, rather than repeating its full content.
- The three direct research attachments (`clearpath-sol-review.md`,
  `clearpath-product-and-demo.md`, `clearpath-kane-feature-audit.md`) are identical
  to the previously committed files. They remain historical supporting research.
- The eight `kane-*.md` files supply background research, including the previously
  missing consumer research and historical CLI field guide. They do not override
  the current brief or the repository's maintained root `kane-field-guide.md`.
- Earlier documents under `docs/clearpath/` remain available for provenance.
  The original full brief is retained there; use the Raising Kane brief for new work.

## Material changes from the original brief

The new brief adopts Raising Kane and its tagline, adds contracts A–E to section 8,
and expands the definition of done. Those contracts specify atomic approval and
commit, operation-key duplicate prevention, worker-owned browser continuity,
mandatory completion evidence and essential reload persistence.

The demo now requires a real failed Kane validation for the seeded wrong-destination
condition, a withheld submission, a separate correction and a passing rerun of the
same check. Section 12 adds an official event-page citation and hashtag. These are
documented requirements and source claims; importing them does not prove the
implementation works or independently revalidate the event rubric.

The prior gap review's first five items are substantially addressed at the contract
level. Detailed schemas, fixture policies, planner actions, acceptance-check
implementation and deployment choices still need implementation-time resolution.
Browser continuity and recovery must still be demonstrated.

## Remaining historical links

The packet's relative Markdown file links resolve within this folder. Its historical
`kane-community-review-technical.md` also cites three absolute paths from another
machine:

- `/home/harish/code/kane-cli-field-guide.md`
- `/home/harish/code/kane-ai-app-research.md`
- `/tmp/kane-research/urltest-1792833849/tests/output-shop/.internal/steps/1-35020f4d/flows/0/actions.ndjson`

The first two have same-named documents in the packet, but the original linked
files were not supplied separately for identity verification. The execution trace
is absent. These references are retained as historical citations, not available
runtime evidence. No evidence pack or application implementation was included.

## PoC implementation review

The [latest research-to-implementation review](poc-review-and-build-priorities.md)
inspects the separate PoC branch at `0ad30e5`, records strengths, verifies concrete
gaps and prioritizes the completed transaction over additional feature breadth.
[Fresh audit observations](../kane-validation/poc-review-checks.json) are separate
from previous synthetic experiments and the PoC author's historical run reports.
This documentation update does not merge the PoC source into `main`.

## Integrated implementation follow-up

`main` now contains the reviewed PoC plus two completed source adapters, revised UX,
contract tests, generated acceptance tests, and real runtime evidence. The current
bundle includes the [implemented scope/demo](implementation-and-demo.md), actual
interface screenshots, and four metadata-redacted runtime packs with provenance.
The prior audit and original ZIP remain historical. The later generic URL-discovery
extension at PoC commit `bc68ffe` remains on its branch; it is not included in these
completed-transaction claims.
