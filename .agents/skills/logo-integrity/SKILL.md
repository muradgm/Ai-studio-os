---
name: logo-integrity
description: Lock canonical logo geometry, actual SVG colors, layer structure, intended overlaps, and rendered appearance so exports cannot drift from the approved mark.
---

# logo-integrity

## Procedure
1. Treat the approved mark specification plus canonical SVG hash as the source of truth. Never let a changed export silently redefine the baseline.
2. Inspect the actual SVG bytes with hardened XML parsing. Record SHA-256, parsed shape IDs, geometry fingerprints, layer membership/order, masks/clips, colors, and external/unsafe content findings.
3. Ignore helper geometry inside `<defs>` as logo shapes, but fingerprint defs so mask/clip changes are still detected.
4. Lock stable shape IDs, geometry/path data, transforms, rendered bounding boxes, and shape-to-layer assignments.
5. Lock palette tokens and reject unapproved colors, embedded rasters, scripts/foreignObject, DTD/entities, CSS imports, or external resource references.
6. Declare layer IDs/order, roles, opacity, masks/clips, and intentional overlap relationships in the mark specification.
7. Measure overlap from isolated raster masks and compare intersection ratios within the declared tolerance.
8. Rasterize canonical and candidate SVGs at 16, 32, 64, and 128 px and compare actual pixel output before approval.
9. Fail closed when the artifact adapter or any parser/rendering dependency is unavailable.
10. Update the canonical specification/hash only through an explicit approved design revision.

## Artifact adapter
The production adapter is `modules/logo-integrity/artifact-adapter.mjs`, backed by `scripts/logo_integrity_inspect.py` (Python 3 + defusedxml + CairoSVG + Pillow). The deterministic metadata-only validator remains for fixture/backward compatibility, but production approval should use `evidenceMode: artifact-derived`.
