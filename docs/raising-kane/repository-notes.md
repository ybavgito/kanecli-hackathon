# Raising Kane: review packet integration

Imported October 24, 2026 from the supplied
[raising-kane-review-packet.zip](../raising-kane-review-packet.zip).
All 14 packet Markdown files and the ZIP are preserved byte-for-byte. This file
is a repository integration note, not part of the supplied packet.

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
