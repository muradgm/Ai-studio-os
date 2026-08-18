# AI Studio OS v1.2 — Logo Identity Upgrade

A focused identity-production upgrade. It does not create Epoch 006.

## Adds

- explicit coverage of seven logo types
- evidence-aware logo psychology
- dedicated logo inspiration source registry
- conceptual family exploration before refinement
- vector-master requirement
- canonical mark specification above SVG
- artifact-derived Shape / SVG / Layer / Overlap / Render integrity locks
- explicit multi-layer manifests
- declared overlap relationships and occlusion checks
- responsive logo systems
- reproduction and recognition stress tests
- logo-specific Council and review skills
- preliminary originality/confusion gate

## Seven logo types

1. Wordmark
2. Lettermark / Monogram
3. Pictorial Mark
4. Abstract Mark
5. Mascot
6. Combination Mark
7. Emblem

All seven are assessed for every serious logo project. The runtime may shortlist fewer for exploration, but it cannot silently skip the taxonomy.

## Integrity rule

The approved mark specification and canonical SVG hash are the source of truth. SVG, PNG, motion, favicon, and other outputs cannot silently redefine geometry, color, layer order, masks, or overlap relationships.

Production integrity is derived from the actual SVG artifact: the adapter parses SVG structure, hashes the files, fingerprints shape geometry and defs, inspects layers/colors/masks/clips, measures declared overlaps from isolated shape masks, and raster-compares canonical vs candidate at 16/32/64/128 px.

The metadata-only integrity path remains for deterministic fixtures and compatibility. A real production logo should only be approved when `evidenceMode` is `artifact-derived`.

## Adapter dependencies

```bash
python3 -m pip install -r requirements-logo-integrity.txt
```

The adapter fails closed if Python/CairoSVG/Pillow are unavailable or if the SVG contains unsafe/external resources.

## Corruption pack

The integration regression suite deliberately tests and blocks: translated shapes, Bézier/path drift, color drift, layer swaps, removed masks, overlap drift, extra shapes, viewBox drift, flattened layers, embedded raster artwork, and external resources.
