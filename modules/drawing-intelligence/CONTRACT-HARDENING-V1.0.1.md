# Drawing Intelligence V1.0.1 — Contract Hardening

This patch hardens four V1 correctness boundaries without expanding Drawing Intelligence capability scope.

## Stable semantic masters are state-neutral

A master concept such as **Authority** represents the durable concept, not a transient product state. `mustNotEncode` may declare state cues that cannot appear in the stable semantic brief or candidate plan. Visual System and Motion System remain responsible for states such as approval-required, authorized, rejected, executing, and verified.

## Drawing Memory is evidence-scoped

Drawing Memory records must target a specific `conceptId`. Project-wide wildcard bans are rejected. Global learned visual vocabulary remains advisory collision evidence; Drawing Memory represents concept-specific failures that were actually rejected in prior review.

## Semantic plans cannot contain exact construction

`primitivePlan` is allowlisted to semantic devices, semantic primitives, and semantic relationships. Exact geometry fields such as coordinates, points, paths, control points, radii, viewBox, stroke width, arcs, and Bézier data are blocked. Exact construction remains owned by Vector Geometry.

## Size budgets are execution constraints

Every primitive declares a `semanticDeviceId`. `buildGeometryIntent()` retains only the semantic devices allowed by the target-size budget, filters primitives to those devices, and removes relationships whose endpoints or semantic device were removed. Vector Geometry never receives discarded semantic machinery.

## Scope boundary

V1.0.1 does not add automated vision, primitive synthesis, family optimization, cross-project learning, autonomous selection, or any Drawing Intelligence V2 capability.
