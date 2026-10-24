# Raising Kane review packet

When websites raise hell, raise Kane.

For the new URL-to-generated-interface direction, start with the [Explore-driven builder plan](explore-driven-builder-plan.md). It is a proposed successor architecture, with explicit Explore, agent/tool, visible-journey, rebuild and accessibility contracts, plus [enforced testing modes](explore-driven-builder-plan.md#prevent-real-changes-during-discovery-and-testing) that separate sandbox mutation tests from live read checks. Fresh [capability experiments](../kane-builder-validation/report.md) establish selected Explore behaviors, not the completed builder. The existing project brief and implementation guide describe the earlier two-sandbox build.

The three direct research attachments are:
- clearpath-kane-feature-audit.md
- clearpath-sol-review.md
- clearpath-product-and-demo.md

Their filenames preserve the former ClearPath working title. Linked background Markdown notes are also included so local research references remain usable. Those older notes are historical research, not current implementation commitments. The Explore-driven builder plan governs the new requested scope; the older brief records the prebuilt implementation direction.

The original imported ZIP is a historical snapshot. The repository now adds a
[workflow/demo decision memo](workflow-and-demo-design.md), the maintained
[field guide](../../kane-field-guide.md), and an extensive
[rc.3 validation report](../kane-validation/report.md) with selected red/green
evidence. These feature experiments do not prove the proposed full application.

The [current review bundle](../raising-kane-current-review.zip) includes the new
documents and explicitly metadata-redacted evidence copies. The original packet
ZIP is retained separately.

The [UX research](ux-research-and-demo-direction.md) refines what to ask and show
at each checkpoint. Its [interactive storyboard](demo-storyboard.html) is a design
artifact with illustrative states and separately labeled prior fixture evidence;
it is not the product implementation or a new live Kane run.

## PoC implementation review

The [latest research-to-implementation review](poc-review-and-build-priorities.md)
inspects the separate PoC branch at `0ad30e5`, records strengths, verifies concrete
gaps and prioritizes the completed transaction over additional feature breadth.
[Fresh audit observations](../kane-validation/poc-review-checks.json) are separate
from previous synthetic experiments and the PoC author's historical run reports.
The PoC is now merged into `main`; the audit remains pinned to its original commit.
See the [implemented product and demo](implementation-and-demo.md) and
[current verification results](verification.md) before using old gap statements as current status.
