# Typography Intelligence

Typography Intelligence resolves business and brand intent into production-ready type systems. Google Fonts is the first catalog provider; the recommendation runtime is provider-agnostic.

## Decision order

1. Business/client context: business type, audience, model, positioning, market context.
2. Brand direction: traits, anti-principles, desired differentiation.
3. Requirements: languages/scripts, roles, production constraints.
4. Typography strategy: trust, expression, reading density, warmth, technicality, formality, accessibility, distinctiveness.
5. Candidate ranking: business fit, production fitness, distinctiveness.
6. Pairing: hierarchy contrast, language compatibility, usable weight ranges, explicit strategy, and evidence-backed structural comparison when available.
7. Production: selected roles, weights, fallbacks, CSS2 URL, and design tokens.

## Rules

- Business/client fit precedes aesthetic preference.
- Do not treat `serif + sans-serif` as sufficient pairing logic. Category contrast is only a preliminary signal.
- Do not invent x-height, stroke modulation, terminal, rhythm, geometry, or historical attributes from Google Fonts metadata.
- Structural descriptors must carry provenance. Evidence without a source is not treated as evidence-backed.
- Pairing reports its evidence level as `catalog-metadata`, `family`, or `evidence-backed-structural`.
- Required language/script coverage is a gate, not a soft preference.
- `avoidFamilies` is a hard exclusion. `marketCommonFamilies` applies a distinctiveness penalty without automatically rejecting a family.
- Google Developer API credentials remain server-side. Generated projects use CSS2/font resources and never receive `GOOGLE_FONTS_API_KEY`.
- A missing catalog blocks a requested typography stage; projects that do not request typography preserve the legacy design path.

## Sync and analyze the Google Fonts catalog

Set `GOOGLE_FONTS_API_KEY` in the environment and run:

```bash
npm run fonts:sync
npm run fonts:analyze
```

The catalog is cached at `.tmp/google-fonts/catalog.json`. Evidence-backed analysis is cached separately at `.tmp/google-fonts/intelligence.json`. Both paths are under `.tmp/` and are ignored by the repository.

The batch analyzer uses bounded concurrency. A font file is downloaded once and the same bytes can feed both OpenType table metrics and glyph-outline analysis.

## Automatic binary metrics

For decompressed SFNT/TrueType/OpenType binaries, the analyzer can measure:

- units per em
- average character width
- x-height and cap height when present in `OS/2`
- weight/width classes
- typographic ascender, descender, and line gap
- horizontal ascender/descender/line gap
- italic angle and underline metrics

Compressed WOFF/WOFF2 files are rejected until decompressed rather than being misparsed.

## Glyph-outline intelligence

For TrueType `glyf`/`loca` outlines, representative glyphs (`H O o n a e s` by default) are resolved through `cmap` and measured directly. The current outline layer records:

- contour count
- point count
- on-curve/off-curve point counts
- off-curve ratio
- glyph bounding-box proportions
- normalized width/height
- aggregate roundness proxy
- aggregate outline-complexity proxy
- aggregate proportion proxy

These are measurement-derived proxies, not stylistic labels. The system does **not** infer `humanist`, `geometric`, terminal style, stroke contrast, aperture, serif style, or rhythm from these proxies alone.

Composite glyphs and unsupported outline formats degrade cleanly and do not block the rest of typography intelligence.

## Optional external font intelligence evidence

Some useful structural attributes still require manual/specimen analysis or a later dedicated classifier. They can be supplied separately:

```js
const fontEvidence = [
  {
    family: 'Newsreader',
    descriptors: {
      strokeContrast: 76,
      geometry: 'humanist',
      rhythm: 'textual',
      terminals: 'calligraphic',
      aperture: 62,
      humanism: 84
    },
    sources: [
      {
        type: 'manual-analysis',
        reference: 'specimen-review:newsreader-v1',
        confidence: 92
      }
    ]
  }
];
```

Numeric descriptors use a normalized 0–100 scale. They are not accepted as evidence-backed unless at least one provenance source is attached. Multiple evidence records for the same family are merged instead of overwriting one another; numeric descriptors are confidence-weighted and provenance is retained.

## Runtime contract

```js
import { buildTypographySystem } from './runtime.mjs';

const typography = buildTypographySystem({
  catalog,
  fontEvidence,
  business: {
    type: 'French patisserie',
    model: 'local-retail',
    positioning: 'accessible-luxury'
  },
  brand: {
    traits: ['warm', 'refined', 'artisanal', 'contemporary']
  },
  requirements: {
    languages: ['de', 'fr', 'en']
  },
  pairing: {
    strategy: 'contrast-with-coherence',
    minScore: 65
  },
  marketCommonFamilies: ['Poppins'],
  avoidFamilies: []
});
```

The creative-production runtime accepts the same object as `input.typography` plus the normalized catalog as `input.fontCatalog`. When typography is not supplied, existing behavior is unchanged.
