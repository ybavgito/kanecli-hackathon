# Raising Kane — current journey and acceptance

Raising Kane — **When websites raise hell, raise Kane**. The [Explore-driven builder plan](../docs/raising-kane/explore-driven-builder-plan.md) is the current architecture. The [builder status](../docs/raising-kane/runtime-builder-status.md) distinguishes implemented code from observed passes.

## Generated interface journey

1. Enter a supported Northstar or Linden sandbox URL and an optional task. A blank task creates a read-only generated overview, with no transaction or receipt; the person can then choose a supported task for a separate focused build. The builder must reject unsupported sources or conflicting goals before claiming a supported transaction.
2. Kane Explore records a bounded, read-only map of the isolated synthetic source. The map is partial and does not itself establish task completion. Failed or empty maps block the build.
3. Kane inspects the chosen source task and supplies actual observations and a screenshot from a completed evidence pack. The model may request at most two further bounded inspections. It cannot grant approval or change the independent contract.
4. The model emits task-specific React, CSS and an action manifest. The app validates the manifest and builds an immutable sandboxed artifact. Generated code has no direct browser or network authority; permitted source actions pass through a trusted broker.
5. Kane tests the pinned artifact through its generated controls against the independent contract and a fresh synthetic source record. Overview promotion requires a passing read-only Kane check and an unchanged source record. For a focused task, bounded Kane browser runs separately verify the matching draft, exact parent approval and single submission, and the later visible saved receipt. Promotion requires all browser evidence and the independent matching source receipt; a submit click or source-only success is insufficient. A real interface failure can trigger at most two code repairs, with the same contract; interruptions and blocked source actions do not count as successful repairs.
6. A ready artifact can be used on its own synthetic record. The user sees actual discovered screens, screenshots, generated source, revision reports and verified outcome. Reload preserves the build and task state. Unsupported or unknown outcomes are explicit.

## Source-specific outcomes

- Northstar: return exactly one red shoe from ORD-1042, keep the jacket, preserve the requested refund destination after the source resets it, disclose label/QR method terms and deductions, approve the fresh proposal, submit at most once and verify the persistent synthetic return receipt and pending refund.
- Linden: move BOOK-2048 to an available Saturday October 31 morning slot, retain Maya Chen, service and address, add no fee, approve fresh terms and verify exactly one active appointment and the saved confirmation.

## Boundaries and preserved paths

The new builder supports these two reviewed synthetic source adapters. It does not claim arbitrary website transaction support. Public read-only URL discovery continues through the separate discovery view. The older fixed sandbox demos remain available. Kane browser and HTTP evidence for Books to Scrape and Wikipedia prove that earlier read-only path, not generated interface promotion. Authentication is handled in the original website's dedicated browser; never collect credentials or one-time codes in Raising Kane or source control. The product discloses TestMu AI and model processing of page content and screenshots.

New browser test cases must be generated through Kane assurance from these requirements. `npm run verify:kane` checks visible behavior after each meaningful change; `npm test` and `npm run build` check local code. Do not treat an implementation or a passing process exit as proof of the whole user journey.
