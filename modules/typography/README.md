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

## Sync the Google Fonts catalog

Set `GOOGLE_FONTS_API_KEY` in the environment and run:

```bash
npm run fonts:sync
```

The catalog is cached at `.tmp/google-fonts/catalog.json` (already ignored by the repository).

## Optional font intelligence evidence

Google Fonts metadata does not provide enough information to justify claims about x-height, stroke contrast, rhythm, terminals, or geometry. Those can be supplied separately:

```js
const fontEvidence = [
  {
    family: 'Newsreader',
    descriptors: {
      xHeight: 58,
      width: 54,
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

Numeric descriptors use a normalized 0–100 scale. They are not accepted as evidence-backed unless at least one provenance source is attached.

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
