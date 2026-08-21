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
8. Application: responsive scale, line-height, tracking, measure, UI roles, and variable-axis settings.
9. Consumption: one canonical contract consumed by design, engineering, brand-kit, and other downstream surfaces.

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
- Once typography is approved, downstream consumers use the canonical CSS variables/application contract. They must not silently re-pick families or rebuild the type scale.

## Sync and analyze the Google Fonts catalog

Set `GOOGLE_FONTS_API_KEY` in the environment and run:

```bash
npm run fonts:sync
npm run fonts:analyze
```

The catalog is cached at `.tmp/google-fonts/catalog.json`. Evidence-backed analysis is cached separately at `.tmp/google-fonts/intelligence.json`. Both paths are under `.tmp/` and are ignored by the repository.

The batch analyzer uses bounded concurrency. A font file is downloaded once and the same bytes can feed OpenType table metrics, glyph-outline analysis, and stroke analysis.

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

For TrueType `glyf`/`loca` outlines, representative glyphs (`H O o n a e s` by default) are resolved through `cmap` and measured directly. The outline layer records contour/point structure, off-curve ratio, proportions, and measurement-derived roundness/complexity proxies.

The stroke layer samples actual contours with horizontal and vertical scanlines to estimate stem distributions and numeric stroke contrast. These remain measured proxies rather than stylistic labels.

Composite glyphs and unsupported outline formats degrade cleanly and do not block the rest of typography intelligence.

## Optional external font intelligence evidence

Useful structural attributes that still require manual/specimen analysis or a dedicated classifier can be supplied separately with explicit provenance. Numeric descriptors use a normalized 0–100 scale. Evidence records for the same family are merged rather than overwriting one another; numeric descriptors are confidence-weighted and provenance is retained.

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
    minScore: 65,
    minSystemScore: 68
  },
  marketCommonFamilies: ['Poppins'],
  avoidFamilies: []
});
```

## Downstream consumption

A passing typography system is transformed into `ai-studio-os/typography-consumption@1`. The contract contains approved role/family assignments, application styles, CSS variables, provider loading information, integration rules, and provenance.

Consumers may make explicit container/locale/accessibility adjustments, but they must not silently substitute families, replace the approved scale, or drop required script coverage. Creative engineering and Brand Kit runtimes accept the contract directly, and legacy projects without typography remain valid.
