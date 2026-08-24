---
name: icon-system-recipe
description: Compose art direction, Drawing Intelligence, icon DNA, vector geometry, calibration icons, family construction, independent geometry review, multi-size testing, and SVG integrity into a coherent icon-system workflow.
category: recipe
version: 1.1
---

# icon-system-recipe

## Purpose
Orchestrate a production-grade icon family from strategy/art direction through semantic Drawing Intelligence, deterministic vector construction, and final SVG integrity without collapsing all judgment into one generator pass.

## When to use
- New product/brand icon systems.
- Major icon-set redesigns.
- Wayfinding, navigation, feature, or diagram families requiring many consistent symbols.
- When the deliverable is a reusable icon system rather than one isolated SVG.

## Inputs required
- Product/brand context and usage environments.
- Icon inventory or expected semantic scope.
- Approved creative/art direction.
- Target platforms and size matrix.
- Stroke/fill, color, accessibility, and implementation constraints.
- Existing icons/assets if this is a migration or redesign.
- Drawing memory / known semantic-collision evidence for difficult brand-semantic concepts when available.

## Operating principles
- Freeze **Icon DNA before scale production**.
- Calibrate on difficult examples before producing the full inventory.
- `drawing-intelligence` owns difficult semantic metaphor decisions; `vector-geometry-engineer` owns exact construction.
- Familiar convention-dominant controls do not need artificial Drawing Intelligence novelty when their metaphor is already settled.
- Maker and reviewer stay independent.
- SVG is generated from an explicit geometry contract and is not itself the only source of truth.
- Small-size variants are allowed when they preserve family logic and improve legibility.
- Do not imitate another icon library's exact shapes; extract transferable principles only.
- Do not freeze canonical SVGs until semantic review, vector review, and artifact integrity all pass.

## Workflow
1. `art-direction` — define character, semantic tone, reference TAKE/REJECT/TRANSFORM, and anti-clichés.
2. `product-designer` when relevant — validate icon inventory, semantics, contexts, labels, and state behavior.
3. Classify concepts as convention-dominant versus brand-semantic/ambiguous.
4. `drawing-intelligence` — for brand-semantic/ambiguous concepts, decompose meaning, decide familiarity versus originality, check learned visual vocabulary and drawing memory, author multiple metaphor hypotheses, and produce structured drawing/size-budget handoffs. Do not emit canonical SVG paths here.
5. Independently review the semantic hypotheses in rendered UI context; rejected metaphor cues become evidence-backed Drawing Memory.
6. `vector-geometry-engineer` — consume the approved drawing intent and define frame/viewBox/grid/safe area, optical center, stroke/fill rules, curve/corner grammar, layer z-order, overlap policy, and size matrix.
7. `icon-system-construction` — build 5–8 calibration icons spanning the hardest geometry/semantic cases.
8. `vector-geometry-review` — gate the calibration set. Revise grammar before scaling if needed.
9. Freeze Icon DNA only after semantic and geometry calibration passes.
10. Construct the full icon inventory in batches with stable IDs and per-icon specs.
11. Run set-level consistency analysis: occupancy, padding, visual weight, density, radii, angles, curve vocabulary, minimum gaps, node counts, and optical-center drift.
12. Create intentional small-size variants/simplifications where required, respecting upstream size-specific semantic budgets.
13. `vector-geometry-review` — independent full-set review with APPROVE / REVISE / REJECT.
14. Run existing SVG/Layer/Overlap/Render integrity locks for canonical artifacts.
15. Package SVGs, manifests, family DNA, implementation guidance, accessibility notes, and motion anchors if needed.

## Deliverables
- Icon inventory and semantic map.
- Drawing Intelligence plans / geometry-intent references for difficult semantic glyphs.
- Evidence-backed Drawing Memory updates where applicable.
- Icon DNA/family geometry contract.
- Calibration set and review findings.
- Full vector icon set with stable IDs.
- Multi-size variants and target-size matrix.
- Family consistency report.
- Independent vector review verdict.
- Canonical SVG package plus layer/overlap manifests.
- Usage/implementation notes and motion anchors where relevant.

## Review criteria
- Family grammar is explicit enough to add future icons consistently.
- Difficult semantic glyphs survive learned-metaphor collision review before geometry is frozen.
- Calibration icons prove the grammar works for both simple and extreme shapes.
- Full set remains coherent without sacrificing semantic clarity.
- Small-size behavior is deliberate rather than blind scaling.
- Layer/paint order, masks, clips, overlaps, and transforms remain auditable.
- Final SVGs pass semantic review, geometry review, and existing integrity locks.

## Failure modes
- Producing 100 icons before testing the family on hard cases.
- Polishing an unresolved metaphor because the SVG is technically clean.
- Bypassing Drawing Intelligence for brand-semantic concepts with known collision risk.
- Letting every difficult icon introduce a new visual rule.
- Treating set consistency as equal bounding boxes only.
- Over-optimizing mathematical symmetry at the expense of optical balance.
- Flattening layers before motion/implementation needs are known.
- Approving clean renders while path construction remains noisy or unstable.

## Handoffs
- `drawing-intelligence` hands structured semantic/primitive intent to `vector-geometry-engineer`; it never replaces exact geometry construction.
- Approved icon system becomes shared context for product, web, brand, motion, and implementation work.
- `motion-designer` consumes stable layer IDs, pivots, anchors, and path constraints for animated variants.
- Observation/learning may update family rules or Drawing Memory only from repeated validated production evidence.
