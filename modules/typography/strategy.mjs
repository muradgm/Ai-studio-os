const SIGNALS = [
  { pattern: /law|legal|finance|bank|wealth|insurance|government|public/i, values: { trust: 22, formality: 24, readingDensity: 14, accessibility: 10 } },
  { pattern: /medical|health|clinic|education|nonprofit/i, values: { trust: 20, accessibility: 22, warmth: 8, readingDensity: 10 } },
  { pattern: /editorial|publishing|news|research|documentation/i, values: { readingDensity: 26, formality: 8, expression: 8 } },
  { pattern: /fashion|luxury|beauty|jewel|gallery|culture|art/i, values: { expression: 24, distinctiveness: 22, formality: 8 } },
  { pattern: /patisserie|bakery|restaurant|hospitality|hotel|cafe|food/i, values: { warmth: 22, expression: 16, distinctiveness: 12 } },
  { pattern: /tech|software|saas|ai|developer|engineering|industrial|automotive|logistics/i, values: { technicality: 22, readingDensity: 12, trust: 8 } },
  { pattern: /streetwear|music|gaming|entertainment|sports|youth/i, values: { expression: 24, distinctiveness: 22, formality: -14 } }
];

const POSITIONING_SIGNALS = [
  { pattern: /premium|luxury|high-end|exclusive/i, values: { distinctiveness: 16, formality: 8, expression: 8 } },
  { pattern: /accessible|friendly|approachable|community/i, values: { warmth: 16, accessibility: 10, formality: -8 } },
  { pattern: /technical|precision|expert|professional/i, values: { technicality: 16, trust: 12 } },
  { pattern: /bold|experimental|disruptive|avant/i, values: { expression: 18, distinctiveness: 18, formality: -8 } }
];

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function add(target, values = {}) {
  for (const [key, value] of Object.entries(values)) target[key] = clamp((target[key] ?? 50) + value);
}

function explicitNumber(value, fallback) {
  return Number.isFinite(value) ? clamp(value) : fallback;
}

function includesAny(values = [], candidates = []) {
  const set = new Set(values.map((value) => String(value).toLowerCase()));
  return candidates.some((candidate) => set.has(candidate));
}

export function buildBusinessTypographyStrategy({ business = {}, brand = {}, requirements = {}, typographyIntent = null } = {}) {
  const strategy = {
    trust: 50,
    expression: 50,
    readingDensity: 50,
    warmth: 50,
    technicality: 50,
    formality: 50,
    accessibility: 50,
    distinctiveness: 50
  };

  const businessText = [business.type, business.industry, business.model, business.audience, business.decisionContext].filter(Boolean).join(' ');
  const positioningText = [business.positioning, business.pricePosition, business.marketPosition].filter(Boolean).join(' ');

  for (const signal of SIGNALS) if (signal.pattern.test(businessText)) add(strategy, signal.values);
  for (const signal of POSITIONING_SIGNALS) if (signal.pattern.test(positioningText)) add(strategy, signal.values);

  const traits = (brand.traits ?? []).map((value) => String(value).toLowerCase());
  if (includesAny(traits, ['warm', 'human', 'friendly', 'artisanal'])) add(strategy, { warmth: 14, expression: 5 });
  if (includesAny(traits, ['refined', 'editorial', 'elegant'])) add(strategy, { formality: 8, distinctiveness: 8 });
  if (includesAny(traits, ['technical', 'precise', 'systematic'])) add(strategy, { technicality: 16, trust: 6 });
  if (includesAny(traits, ['bold', 'expressive', 'playful', 'experimental'])) add(strategy, { expression: 16, distinctiveness: 12, formality: -6 });
  if (includesAny(traits, ['minimal', 'restrained', 'quiet'])) add(strategy, { expression: -12, formality: 5 });

  if (business.model === 'b2b') add(strategy, { trust: 8, readingDensity: 8, formality: 5 });
  if (business.model === 'b2c') add(strategy, { expression: 5, warmth: 5 });
  if (business.model === 'local-retail') add(strategy, { warmth: 8, accessibility: 5 });

  if ((requirements.languages ?? []).length > 1) add(strategy, { accessibility: 8 });
  if (requirements.longForm === true) add(strategy, { readingDensity: 20, accessibility: 10 });
  if (requirements.interfaceDense === true) add(strategy, { readingDensity: 14, technicality: 8 });

  const explicit = business.typographyPressures ?? {};
  for (const key of Object.keys(strategy)) strategy[key] = explicitNumber(explicit[key], strategy[key]);

  // Creative Thesis / selected-world pressure values are explicit authored art-direction inputs.
  // They override category/business heuristics rather than being inferred from prose.
  for (const [key, value] of Object.entries(typographyIntent?.pressureOverrides ?? {})) {
    if (key in strategy && Number.isFinite(value)) strategy[key] = clamp(value);
  }

  const rationale = [];
  if (strategy.trust >= 70) rationale.push('high trust requirement');
  if (strategy.readingDensity >= 70) rationale.push('sustained reading or information density matters');
  if (strategy.expression >= 70) rationale.push('brand expression should be visibly present');
  if (strategy.warmth >= 70) rationale.push('human warmth is commercially relevant');
  if (strategy.technicality >= 70) rationale.push('technical/systemic character is useful');
  if (strategy.formality >= 70) rationale.push('formal tone is strategically important');
  if (strategy.accessibility >= 70) rationale.push('accessibility and clarity are high-priority constraints');
  if (strategy.distinctiveness >= 70) rationale.push('competitive differentiation should influence selection');
  if (typographyIntent?.enabled) rationale.push(`creative authority: ${typographyIntent.authority}`);

  return {
    stage: 'typography-strategy',
    pressures: strategy,
    rationale,
    creativeAuthority: typographyIntent?.enabled === true,
    intent: typographyIntent ?? null,
    source: {
      businessType: business.type ?? null,
      industry: business.industry ?? null,
      model: business.model ?? null,
      positioning: business.positioning ?? null,
      audience: business.audience ?? null,
      brandTraits: brand.traits ?? [],
      languages: requirements.languages ?? [],
      creativeAuthority: typographyIntent?.authority ?? null
    }
  };
}
