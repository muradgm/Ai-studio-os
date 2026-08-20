# Typography Intelligence

Typography Intelligence resolves business and brand intent into production-ready type systems. Google Fonts is the first catalog provider; the recommendation runtime is provider-agnostic.

## Decision order

1. Business/client context: business type, audience, model, positioning, market context.
2. Brand direction: traits, anti-principles, desired differentiation.
3. Requirements: languages/scripts, roles, production constraints.
4. Candidate ranking: business fit, production fitness, distinctiveness.
5. Pairing: hierarchy contrast, language compatibility, usable weight ranges, and explicit strategy.
6. Production: selected roles, weights, fallbacks, CSS2 URL, and design tokens.

## Rules

- Business/client fit precedes aesthetic preference.
- Do not treat `serif + sans-serif` as sufficient pairing logic. Category contrast is only one signal; optical/structural evidence can be added as catalog descriptors become available.
- Do not invent x-height, stroke modulation, terminal, rhythm, or historical attributes from Google Fonts metadata. Those require explicit evidence/enrichment.
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

## Runtime contract

```js
import { buildTypographySystem } from './runtime.mjs';

const typography = buildTypographySystem({
  catalog,
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
    strategy: 'contrast-with-coherence'
  },
  marketCommonFamilies: ['Poppins'],
  avoidFamilies: []
});
```

The creative-production runtime accepts the same object as `input.typography` plus the normalized catalog as `input.fontCatalog`. When typography is not supplied, existing behavior is unchanged.
