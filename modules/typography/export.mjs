function normalWeights(selection) {
  const values = selection.weights ?? [];
  const clean = [...new Set(values.map(Number).filter((value) => Number.isInteger(value) && value >= 100 && value <= 900))].sort((a, b) => a - b);
  return clean.length ? clean : [400];
}

function cssFamilyQuery(selection) {
  const family = encodeURIComponent(selection.family).replace(/%20/g, '+');
  const weights = normalWeights(selection);
  return `family=${family}:wght@${weights.join(';')}`;
}

export function buildGoogleFontsCss2Url(selections = []) {
  const googleSelections = selections.filter((selection) => selection?.source === 'google-fonts' && selection.family);
  if (!googleSelections.length) return null;
  const params = googleSelections.map(cssFamilyQuery).join('&');
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

export function buildTypographyTokens(system) {
  const roles = system?.selection ?? {};
  const tokens = {};
  for (const [role, selection] of Object.entries(roles)) {
    if (!selection?.family) continue;
    tokens[`font-family-${role}`] = `'${selection.family}', ${selection.fallback ?? (role === 'display' ? 'serif' : 'sans-serif')}`;
    if (selection.weights?.length) tokens[`font-weight-${role}`] = selection.weights.join(' ');
  }
  return tokens;
}

export function buildTypographyProductionConfig(system) {
  const selections = Object.values(system?.selection ?? {}).filter(Boolean);
  return {
    css2Url: buildGoogleFontsCss2Url(selections),
    cssVariables: Object.fromEntries(Object.entries(buildTypographyTokens(system)).map(([key, value]) => [`--${key}`, value])),
    families: selections.map(({ role, family, weights, source }) => ({ role, family, weights, source }))
  };
}
