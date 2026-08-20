# Brand Kit Production Contract

A Brand Kit is a versioned delivery system built from one approved Brand DNA contract. It is not a moodboard, a folder of unrelated assets, or a promise that missing assets will be generated later.

## Required invariants

- Every required artifact references the same `brandDnaVersion`.
- Only actually produced artifact references may enter the manifest.
- Required artifacts must be approved or frozen before release.
- Logo masters require logo-review and Logo Integrity evidence.
- Personalized icon systems require Icon DNA, calibration masters, SVG masters, and independent vector-geometry review.
- Typography records family, role, source/license information, and usage rules; font binaries are not redistributed unless rights explicitly permit it.
- Trademark/legal state is reported as evidence or unresolved risk. The runtime never invents clearance.
- Maker approval cannot substitute for independent kit review.

## Artifact Graph projection

Brand Kit production is projected into the universal `ai-studio-os/artifact@1` / `ai-studio-os/artifact-graph@1` model.

The projection must preserve these rules:

- Brand DNA is a first-class structured graph node and is never represented by a fabricated file.
- Every identity artifact depends on the exact Brand DNA version it inherits.
- Guidelines depend on the identity artifacts they document, so changes invalidate the compiled guidance.
- Representative applications depend on Brand DNA and the identity artifacts they apply; identity changes require application review unless a stronger stale dependency applies.
- The Brand Kit manifest depends on Brand DNA, all kit artifacts, and representative applications.
- A ready in-memory manifest may have approved review/release state without pretending a ZIP/PDF package already exists. Package files enter the graph only after packaging actually produces them.
- Brand DNA version drift or other blocking Brand Kit review findings must fail the projected graph closed.

The Artifact Graph is additive to the existing Brand Kit manifest during migration. The manifest remains the delivery/review contract; the graph becomes the cross-runtime dependency and invalidation contract.

## Default required kit

1. strategy
2. creative-direction
3. logo
4. color
5. typography
6. icon-system
7. guidelines

At least two approved representative applications are required by default so the identity is tested outside a presentation board.
