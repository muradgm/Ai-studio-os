---
name: vector-geometry-review
description: Independently audit vector construction for coordinate precision, curve/corner quality, optical balance, layer/overlap correctness, small-size behavior, and family consistency.
category: review
version: 1.0
---

# vector-geometry-review

## Purpose
Judge whether a vector asset or icon family is geometrically clean, optically balanced, reproducible, and robust across declared sizes and export contexts.

## When to use
- Before approving canonical logo/icon SVGs.
- Before freezing an icon family.
- After difficult corner, curve, overlap, mask, or layer work.
- When AI-generated SVG looks plausible but may contain construction noise.
- After systematic set expansion to detect drift/outliers.

## Inputs required
- Approved visual/semantic intent.
- Canonical geometry spec or icon-family DNA.
- SVG/vector candidate plus shape/layer manifest.
- Target size matrix and render outputs.
- Declared optical corrections, overlap rules, masks/clips, and motion anchors where relevant.

## Operating principles
- Review the **construction**, not only the rendered impression.
- A visually acceptable 128px render does not excuse broken geometry at 16–24px.
- Separate geometric defects, optical defects, semantic defects, and taste.
- Path-node count is a diagnostic, not a contest; complexity must be justified by shape behavior.
- Check mathematical center and optical center independently.
- Curves should have intentional tangent/curvature behavior. Near-tangent kinks and tiny inflections are defects.
- Logical z-order must match actual SVG paint order/group/mask/clip behavior.
- Review multi-size variants as designed variants, not automatically as drift.
- Use `BLOCKER / MAJOR / MINOR / TASTE`; do not rewrite the maker's design during review.

## Workflow
1. Verify frame/viewBox, safe area, target sizes, and naming against the spec.
2. Inspect every stable shape ID and layer assignment.
3. Check bounding box, occupancy, clearances, optical center, symmetry/asymmetry, and alignment.
4. Inspect anchors/control handles for unnecessary nodes, bumps, flat spots, accidental inflections, and join discontinuities.
5. Check corner/terminal family consistency and extreme-shape behavior.
6. Verify masks, clips, knockouts, overlaps, and layer/paint order.
7. Render at all declared target sizes and inspect edge sharpness, gap survival, detail collapse, and visual weight.
8. For icon sets, compare family metrics and identify outliers in occupancy, density, padding, radii, angles, curve language, and node count.
9. Check that optical corrections are documented and improve the actual render rather than compensating randomly.
10. Return APPROVE / REVISE / REJECT with severity-ranked findings and a preserve list.

## Deliverables
- Geometry audit summary.
- Coordinate/frame/viewBox findings.
- Curve continuity and path-node findings.
- Corner/terminal consistency findings.
- Optical-center/weight/clearance findings.
- Layer/overlap/mask/clip findings.
- Multi-size render findings.
- Set-level outlier report when applicable.
- `BLOCKER / MAJOR / MINOR / TASTE` issue list.
- APPROVE / REVISE / REJECT decision.

## Review criteria
- Geometry is deterministic and auditable.
- No unexplained coordinate, transform, color, layer, or overlap drift exists.
- Curves and corners remain clean at target sizes.
- Minimum gaps and negative spaces survive the smallest target.
- Optical balance is intentional and documented.
- Set members share one grammar without becoming mechanically identical.
- SVG export preserves the intended layer structure and can pass existing integrity locks.

## Failure modes
- Reviewing only a large PNG preview.
- Calling a measurable defect “taste” because the concept is attractive.
- Rejecting legitimate optical correction because coordinates are no longer perfectly symmetrical.
- Treating every path with many nodes as automatically wrong.
- Ignoring SVG paint order because the layer panel looks correct in one editor.
- Approving a set without comparing icons side by side and at small size.

## Handoffs
- `vector-geometry-engineer` fixes geometric/optical construction defects.
- `icon-system-construction` fixes family-level consistency drift.
- `logo-designer` or `art-direction` resolves upstream conceptual/style disagreements.
- Existing Logo Integrity performs artifact-level Shape/SVG/Layer/Overlap/Render locking after this review passes.
