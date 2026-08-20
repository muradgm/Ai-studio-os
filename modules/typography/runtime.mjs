import { scoreFontForRole, scorePairing, supportsLanguages } from './scoring.mjs';
import { buildTypographyProductionConfig } from './export.mjs';

function roleWeights(font, role) {
  const weights = new Set();
  for (const variant of font.variants ?? []) {
    if (variant === 'regular') weights.add(400);
    else if (/^\d+$/.test(String(variant))) weights.add(Number(variant));
  }
  const sorted = [...weights].sort((a, b) => a - b);
  if (role === 'display') {
    const preferred = sorted.filter((weight) => [400, 500, 600, 700].includes(weight)).slice(0, 3);
    return preferred.length ? preferred : [sorted[0] ?? 400];
  }
  if (role === 'utility') {
    const preferred = sorted.filter((weight) => [400, 500, 600].includes(weight)).slice(0, 3);
    return preferred.length ? preferred : [sorted[0] ?? 400];
  }
  const preferred = sorted.filter((weight) => [400, 500, 600, 700].includes(weight));
  return preferred.length ? preferred : [sorted[0] ?? 400];
}

function fallbackFor(font) {
  if (font.category === 'serif') return 'serif';
  if (font.category === 'monospace') return 'monospace';
  return 'sans-serif';
}

function rankRole(catalog, role, context, limit) {
  return catalog
    .filter((font) => font?.family && supportsLanguages(font, context.requirements?.languages ?? []))
    .map((font) => ({ font, scores: scoreFontForRole(font, { ...context, role }) }))
    .sort((a, b) => b.scores.total - a.scores.total || a.font.family.localeCompare(b.font.family))
    .slice(0, limit);
}

function selection(font, role) {
  return {
    role,
    family: font.family,
    category: font.category,
    weights: roleWeights(font, role),
    variable: (font.axes ?? []).length > 0,
    axes: font.axes ?? [],
    subsets: font.subsets ?? [],
    source: font.provider ?? 'unknown',
    fallback: fallbackFor(font)
  };
}

export function buildTypographySystem({
  catalog = [],
  business = {},
  brand = {},
  requirements = {},
  pairing = {},
  marketCommonFamilies = [],
  avoidFamilies = [],
  candidateLimit = 8,
  systemLimit = 3
} = {}) {
  if (!Array.isArray(catalog)) throw new TypeError('typography catalog must be an array');
  if (!catalog.length) {
    return {
      stage: 'typography',
      pass: false,
      findings: [{ severity: 'blocker', code: 'typography-catalog-empty' }],
      candidates: {}, systems: [], selection: null, production: null
    };
  }

  const context = { business, brand, requirements, marketCommonFamilies, avoidFamilies };
  const display = rankRole(catalog, 'display', context, candidateLimit);
  const body = rankRole(catalog, 'body', context, candidateLimit);
  const utilityPool = catalog.filter((font) => font.category === 'monospace');
  const utility = rankRole(utilityPool.length ? utilityPool : catalog, 'utility', context, Math.min(candidateLimit, 5));

  const systems = [];
  for (const displayCandidate of display) {
    for (const bodyCandidate of body) {
      if (displayCandidate.font.family === bodyCandidate.font.family && pairing.strategy !== 'single-family') continue;
      const pair = scorePairing(displayCandidate.font, bodyCandidate.font, { strategy: pairing.strategy, requirements });
      const utilityCandidate = utility.find((candidate) => candidate.font.family !== displayCandidate.font.family && candidate.font.family !== bodyCandidate.font.family) ?? utility[0] ?? null;
      const overall = Math.round(
        displayCandidate.scores.total * 0.26 +
        bodyCandidate.scores.total * 0.34 +
        pair.score * 0.30 +
        (utilityCandidate?.scores.total ?? 75) * 0.10
      );
      systems.push({
        overall,
        display: displayCandidate,
        body: bodyCandidate,
        utility: utilityCandidate,
        pairing: pair
      });
    }
  }

  systems.sort((a, b) => b.overall - a.overall || a.display.font.family.localeCompare(b.display.font.family));
  const topSystems = systems.slice(0, systemLimit);
  const winner = topSystems[0] ?? null;
  if (!winner) {
    return {
      stage: 'typography', pass: false,
      findings: [{ severity: 'blocker', code: 'typography-no-valid-pairing' }],
      candidates: { display, body, utility }, systems: [], selection: null, production: null
    };
  }

  const resolved = {
    display: selection(winner.display.font, 'display'),
    body: selection(winner.body.font, 'body'),
    utility: winner.utility ? selection(winner.utility.font, 'utility') : null
  };

  const output = {
    stage: 'typography',
    pass: true,
    findings: [],
    context: { business, brand, requirements, pairing },
    candidates: { display, body, utility },
    systems: topSystems,
    selection: resolved
  };
  output.production = buildTypographyProductionConfig(output);
  return output;
}
