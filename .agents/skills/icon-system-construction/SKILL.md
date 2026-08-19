---
name: icon-system-construction
description: Build a coherent icon family from one explicit geometric grammar, preserving semantic clarity, optical weight, corner/curve language, layers, and multi-size behavior.
category: task
version: 1.0
---

# icon-system-construction

## Purpose
Construct a consistent set of icons from an approved **Icon DNA** rather than drawing each icon independently and trying to harmonize them afterward.

## When to use
- Product/navigation icon families.
- Brand icon sets, wayfinding sets, feature icons, diagram symbols, or compact UI pictograms.
- When several icons need the same visual language across dozens or hundreds of concepts.
- When an existing set has inconsistent weight, padding, corners, density, or curve behavior.

## Inputs required
- Approved icon-family purpose and semantic inventory.
- Art direction and brand constraints.
- Vector geometry contract: canvas/viewBox, safe area, grid, stroke/fill model, optical center, target sizes.
- Family DNA: angle families, radius/corner families, terminal style, curve vocabulary, negative-space minimums, layer grammar, accent rules.
- Accessibility and context constraints: filled/outline mode, active states, labels/tooltips, target platform.

## Operating principles
- Define the family before drawing the family.
- Consistency means shared construction logic, not identical silhouettes.
- Semantic recognition has priority over clever geometry.
- Reuse a limited primitive vocabulary: line families, arcs/curves, corner types, terminals, and intersection logic.
- Maintain comparable optical weight even when icons have different topology.
- Occupancy and padding should be consistent but not mechanically identical; optically narrow/tall symbols may require compensation.
- Keep a declared minimum gap/clearance. If a detail collapses at small size, simplify it intentionally.
- Layered icons use stable layer IDs and logical z/paint order. Do not flatten construction prematurely.
- Decorative accent shapes are allowed only when the family DNA explicitly permits them.
- Do not trace or reproduce another icon library's exact geometry.

## Workflow
1. Inventory icon meanings and group them by semantic difficulty: primitive, compound, directional, status/event, abstract.
2. Write/confirm the Icon DNA before drawing production icons.
3. Build 5–8 **calibration icons** that stress different problems: circle/curve, diagonal, corner, overlap, dense compound form, directional arrow, small negative space.
4. Review the calibration set and freeze the family grammar only after the extremes work.
5. For each icon, write a short semantic decomposition before geometry.
6. Construct with stable primitives, exact coordinates, declared layer order, and the smallest useful path-node count.
7. Apply optical correction for center, weight, gap, and silhouette balance.
8. Render at every target size; simplify or create optical variants when needed.
9. Compare set-level metrics: occupancy, padding, stroke/weight, radius/angle usage, node count, density, minimum gaps, optical center drift.
10. Flag outliers for correction instead of averaging the entire set toward the outlier.
11. Export canonical SVGs and a family manifest.
12. Hand the set to independent vector review and SVG integrity.

## Deliverables
- Icon inventory and semantic grouping.
- Icon DNA / family grammar.
- Calibration set and decisions learned from it.
- Per-icon geometry specs and SVG candidates.
- Family manifest with target sizes, layer rules, and naming.
- Set-level consistency report and outliers.
- Small-size variants/simplification notes where required.

## Review criteria
- Do icons look related before color/branding is applied?
- Can a new icon be added without inventing a new visual rule?
- Are stroke/weight, padding, corners, terminals, angles, and curves coherent across the set?
- Are difficult icons still recognizable at the smallest declared size?
- Are set-level outliers explainable by semantics rather than construction drift?
- Are layer/overlap relationships preserved for editable and motion-ready use?

## Failure modes
- Drawing all icons independently and normalizing only at export.
- Using one literal padding value when optical compensation is needed.
- Adding new corner/curve/terminal styles whenever a symbol is difficult.
- Excessive detail that disappears below 24px.
- Making every icon equally complex instead of equally coherent.
- Forcing a semantic concept into an elegant but unreadable abstraction.
- Flattening multi-layer icons before review.

## Handoffs
- `art-direction` owns the visual character of the family.
- `vector-geometry-engineer` owns exact construction and difficult geometry.
- `vector-geometry-review` independently audits icon and set consistency.
- `product-designer` validates UI semantics/context when the set is product-facing.
- `icon-system-recipe` coordinates the full production sequence.
