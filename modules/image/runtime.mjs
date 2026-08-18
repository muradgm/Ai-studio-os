const RETOUCH_NEEDS = new Set(['exposure', 'white-balance', 'grade', 'crop', 'cleanup', 'sharpen', 'noise']);
const GENERATIVE_EDIT_NEEDS = new Set(['extend', 'remove-distraction', 'background-treatment', 'recompose']);

export function routeImageAsset(asset) {
  const needs = new Set(asset.needs ?? []);

  if (!asset.real) {
    if (asset.representsRealProduct) {
      return { action: 'capture-required', reason: 'A real product needs truthful final imagery.' };
    }
    return { action: 'generate-supporting', reason: 'Supporting/non-literal imagery may be generated under art direction.' };
  }

  if (asset.usable === false) {
    const truthSensitive = asset.truthSensitive ?? true;
    if (asset.representsRealProduct || truthSensitive) {
      return { action: 'capture-required', reason: 'Existing real asset is unusable and the final representation must remain truthful.' };
    }
    return { action: 'generate-supporting', reason: 'The unusable real asset is not truth-sensitive; supporting imagery may be regenerated.' };
  }

  if ([...needs].some((need) => GENERATIVE_EDIT_NEEDS.has(need))) {
    return { action: 'generative-edit', reason: 'The real asset is retained while composition/environment is adjusted.' };
  }

  if ([...needs].some((need) => RETOUCH_NEEDS.has(need))) {
    return { action: 'retouch', reason: 'The real asset is sufficient after controlled photographic correction.' };
  }

  return { action: 'use', reason: 'The real asset already fits the intended truthful use.' };
}

export function buildImagePlan(assets = []) {
  return {
    stage: 'image',
    priority: ['use', 'retouch', 'generative-edit', 'generate-supporting', 'capture-required'],
    assets: assets.map((asset) => ({ ...asset, ...routeImageAsset(asset) })),
    guardrails: [
      'Do not materially change a real product and present the result as documentary truth.',
      'Match crop, grade, lighting logic, and texture across approved assets.',
      'Use generated imagery as support unless the concept explicitly permits synthetic product representation.'
    ]
  };
}
