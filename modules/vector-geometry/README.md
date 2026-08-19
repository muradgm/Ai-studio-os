# Vector Geometry Subsystem v1

## Purpose

Provide a deterministic construction contract for logos, icons, diagrams, and other SVG/vector assets that need more precision than image-generation output can guarantee.

The subsystem adds four specialist skills:

- **Role:** `vector-geometry-engineer`
- **Task:** `icon-system-construction`
- **Review:** `vector-geometry-review`
- **Recipe:** `icon-system-recipe`

and an executable math/validation layer in `lib/vector-geometry.mjs`.

## Source-of-truth rule

`APPROVED VISUAL INTENT → GEOMETRY SPEC → NORMALIZED SVG → VECTOR REVIEW → ARTIFACT INTEGRITY`

SVG path data alone is not sufficient as a source of truth. A canonical vector asset should record the construction decisions needed to regenerate and audit it.

## Coordinate contract

A vector geometry spec should define:

```json
{
  "canvas": {
    "width": 24,
    "height": 24,
    "viewBox": [0, 0, 24, 24]
  },
  "safeArea": {"x": 2, "y": 2, "width": 20, "height": 20},
  "grid": {"unit": 1, "subdivision": 0.5},
  "opticalCenter": {"x": 12, "y": 12},
  "stroke": {"width": 1.5, "cap": "square", "join": "miter"},
  "targetSizes": [16, 20, 24, 32, 64],
  "layers": [
    {"id": "base", "z": 0},
    {"id": "structure", "z": 10},
    {"id": "event", "z": 20}
  ]
}
```

### X / Y / Z

- `x` and `y` are vector drawing coordinates.
- `z` is a **logical layer/paint-order value** for SVG construction.
- SVG does not become real 3D because a z value exists. Real 3D coordinates must be projected by the 3D/motion system into 2D geometry before SVG output.
- The SVG generator emits groups/shapes in deterministic paint order derived from logical z, then masks/clips/overlap rules refine compositing.

## Curve mathematics

The runtime exposes:

- cubic Bézier point evaluation;
- first derivative / tangent;
- second derivative;
- curvature;
- join classification for `C0`, `C1`, and `C2` continuity.

Use these to catch tiny bumps, almost-tangent joins, flat spots, accidental inflections, and curve discontinuities that may be invisible in a large preview but obvious at icon size.

## Corner language

Every family should declare the corner types it permits. Examples:

- sharp;
- chamfered;
- circular radius;
- concave;
- continuous/superellipse-like;
- cut;
- tapered terminal;
- compound;
- intentionally asymmetric optical correction.

Do not invent a new corner language for every difficult icon.

## Optical correction

Mathematical equality is not always optical equality. The geometry spec may intentionally offset:

- center;
- padding;
- radius;
- line length;
- diagonal weight;
- terminal position;
- gap width.

Every correction should be documented and verified at target render sizes.

## Multi-size behavior

Do not assume one master scales cleanly to all targets.

At smaller sizes the system may intentionally:

- remove detail;
- widen negative space;
- alter terminal length;
- simplify overlaps;
- move coordinates onto a stronger pixel rhythm;
- substitute a small-size optical variant.

Variants are allowed when they preserve semantic identity and family grammar.

## Icon-family consistency

Before scale production, define **Icon DNA**:

- canvas / viewBox;
- safe area;
- stroke/fill model;
- angle families;
- radius/corner families;
- curve vocabulary;
- terminals;
- negative-space minimums;
- optical-weight rules;
- layer grammar;
- accent rules;
- target-size matrix.

Then build 5–8 calibration icons that stress different geometry problems before producing the full inventory.

## Relationship to Logo Integrity

This subsystem owns **construction quality**. Existing Logo Integrity owns final artifact invariants:

- Shape Lock;
- SVG Lock;
- Layer Lock;
- Overlap Lock;
- Render Lock.

The intended order is:

`VECTOR CONSTRUCTION → VECTOR REVIEW → SVG ARTIFACT INTEGRITY`.

## Physics boundary

Static SVG construction is primarily geometry, not physics. Motion may consume vector metadata such as:

- pivots;
- anchors;
- normals;
- paths;
- layer IDs;
- constraints.

Spring, damping, mass, momentum, collision, and inertia remain motion-system concerns.
