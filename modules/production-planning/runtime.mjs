// v1.1 Production Planning: explicit mode plus reusable provider-independent recipes.

const MODES = new Set(['prototype', 'production']);

export function buildProductionMode({ mode, truth = 'strict', accessibility = 'required', performance = 'required', rights = 'required' } = {}) {
  const findings = [];
  if (!MODES.has(mode)) findings.push({ severity: 'blocker', code: 'production-mode-invalid', mode });

  if (mode === 'production') {
    if (truth !== 'strict') findings.push({ severity: 'blocker', code: 'production-truth-not-strict' });
    if (accessibility !== 'required') findings.push({ severity: 'blocker', code: 'production-accessibility-not-required' });
    if (performance !== 'required') findings.push({ severity: 'blocker', code: 'production-performance-not-required' });
    if (rights !== 'required') findings.push({ severity: 'blocker', code: 'production-rights-not-required' });
  }

  return {
    stage: 'production-mode',
    mode,
    finalUseAllowed: mode === 'production',
    prototypeLabelRequired: mode === 'prototype',
    truth,
    accessibility,
    performance,
    rights,
    policies: mode === 'prototype'
      ? ['Fast exploration is allowed.', 'Placeholders must be labeled.', 'Prototype output must not be represented as verified production truth.']
      : ['Truth, rights, accessibility, performance, and release evidence are mandatory.'],
    findings,
    pass: !findings.some((finding) => finding.severity === 'blocker')
  };
}

const RECIPES = {
  'editorial-brand-site': {
    stages: ['narrative-structure', 'asset-specs', 'design', 'image', 'motion', 'implementation', 'responsive-qa', 'performance-qa', 'review'],
    gates: ['creative-direction', 'asset-truth', 'reduced-motion', 'responsive', 'performance'],
    signature: 'Editorial composition with image-led hierarchy; motion supports reading and materiality.'
  },
  'scroll-cinematic': {
    stages: ['scroll-narrative', 'storyboard', 'asset-specs', 'continuity', 'tool-gateway', 'motion-implementation', 'reduced-motion', 'performance-qa', 'review'],
    gates: ['storyboard-timing', 'continuity', 'reduced-motion', 'performance'],
    signature: 'Scroll changes attention, information, texture, or spatial relationship; it is not decorative travel.'
  },
  'product-film': {
    stages: ['storyboard', 'continuity', 'asset-specs', 'video', 'voice', 'audio', 'multimodal-review'],
    gates: ['truth', 'rights', 'continuity', 'timing', 'accessibility'],
    signature: 'One authored direction across image, edit, voice, sound, and format adaptations.'
  }
};

export function buildProductionRecipe({ recipeId, modePlan } = {}) {
  const findings = [];
  const recipe = RECIPES[recipeId];
  if (!modePlan?.pass) findings.push({ severity: 'blocker', code: 'production-mode-not-ready' });
  if (!recipe) findings.push({ severity: 'blocker', code: 'production-recipe-unknown', recipeId });

  return {
    stage: 'production-recipe',
    recipeId,
    mode: modePlan?.mode,
    ...(recipe ?? {}),
    providerPolicy: 'Recipes describe production patterns, never vendor requirements.',
    findings,
    pass: !findings.some((finding) => finding.severity === 'blocker')
  };
}

export { RECIPES };
