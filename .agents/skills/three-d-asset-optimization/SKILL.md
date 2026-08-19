---
name: three-d-asset-optimization
category: task
description: Produces web-ready 3D derivatives from approved source assets using reproducible geometry, texture, material, LOD, and export decisions.
---
# 3D Asset Optimization

## Purpose
Reduce realtime asset cost while protecting the silhouette, materials, and detail that the approved camera actually reveals.

## When to use
Use before shipping GLB/GLTF, scanned assets, generated meshes, or DCC scenes into a browser runtime.

## Inputs required
Source asset, provenance/rights, camera distances, target devices, renderer constraints, geometry/texture budgets, animation requirements, and acceptable visual-loss threshold.

## Operating principles
- Optimize against camera evidence, not arbitrary “low poly” targets.
- Preserve source; produce derivatives.
- Remove invisible cost before visible detail.
- Prefer texture/material consolidation where it reduces draw calls without destroying intent.
- Compression and LOD choices must be reversible and documented.

## Workflow
1. Record source metrics and provenance.
2. Normalize scene scale/transforms/naming.
3. Identify silhouette-critical geometry and texture detail.
4. Reduce hidden/duplicate geometry and material complexity.
5. Build LODs and compressed texture variants as justified.
6. Export deterministic runtime derivatives.
7. Compare visual result against source at target camera distances.
8. Record before/after metrics and hand off.

## Deliverables
Optimized derivatives, source/runtime metric comparison, export settings, LOD rules, texture strategy, and visual-loss notes.

## Review criteria
Runtime cost improves materially, visible loss stays within the approved tolerance, scale/pivots/material assignments remain correct, and provenance/source integrity is preserved.

## Failure modes
Blind decimation, texture downsizing without camera tests, broken UVs/normals, too many materials, destructive source edits, missing LOD transition logic, and compression choices unsupported by the target runtime.

## Handoffs
3D Technical Artist owns the task. Realtime WebGL Engineer sets runtime budgets. WebGL Review and Performance Budget Review verify the delivered derivatives.
