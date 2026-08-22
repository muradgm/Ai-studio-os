# Logo Integrity Contract

Production logo approval requires artifact-derived evidence from the actual candidate SVG, not caller-authored claims.

Required production evidence:
- approved canonical SVG SHA-256 stored in the mark specification
- actual candidate file SHA-256
- parsed viewBox and shape-ID set
- path/shape geometry fingerprints and browser-rendered per-shape bounding boxes
- layer order/membership, masks and clips
- palette/color inspection
- declared overlap relationships measured from isolated shape masks rendered in Chromium
- browser render comparison at 16, 32, 64 and 128 px
- no embedded raster logo artwork, scripts, foreignObject, or external resource references

The production inspector uses the repository's Playwright/Chromium runtime so local Windows, macOS and Linux validation does not require a separate Python/Cairo rendering stack.

Any failed Shape, SVG, Layer, Overlap, or Render lock blocks approval.
