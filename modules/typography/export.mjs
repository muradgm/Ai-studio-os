function normalWeights(selection) {
  const values = selection.weights ?? [];
  const clean = [...new Set(values.map(Number).filter((value) => Number.isInteger(value) && value >= 100 && value <= 900))].sort((a, b) => a - b);
  return clean.length ? clean : [400];
}

function formatAxisNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Number.isInteger(numeric) ? String(numeric) : String(Math.round(numeric * 1000) / 1000);
}

function compareAxisTags(a, b) {
  const aCustom = /^[A-Z0-9]{4}$/.test(a);
  const bCustom = /^[A-Z0-9]{4}$/.test(b);
  if (aCustom !== bCustom) return aCustom ? 1 : -1;
  return a < b ? -1 : a > b ? 1 : 0;
}

function normalizeVariableAxes(selection, usedTags = null) {
  if (selection?.variable !== true || !Array.isArray(selection.axes)) return [];
  const filter = usedTags instanceof Set ? usedTags : null;
  return selection.axes
    .filter((axis) => axis && typeof axis.tag === 'string' && axis.tag.length === 4)
    .filter((axis) => !filter || filter.has(axis.tag))
    .map((axis) => ({
      tag: axis.tag,
      start: Number(axis.start),
      end: Number(axis.end)
    }))
    .filter((axis) => Number.isFinite(axis.start) && Number.isFinite(axis.end))
    .map((axis) => axis.start <= axis.end ? axis : { ...axis, start: axis.end, end: axis.start })
    .sort((a, b) => compareAxisTags(a.tag, b.tag));
}

function axisRequestValue(axis) {
  const start = formatAxisNumber(axis.start);
  const end = formatAxisNumber(axis.end);
  if (start === null || end === null) return null;
  return start === end ? start : `${start}..${end}`;
}

function usedAxisTagsForFamily(application, family) {
  if (!application || !family) return null;
  const tags = new Set();
  for (const styleSet of [application.styles, application.mobileStyles]) {
    for (const style of Object.values(styleSet ?? {})) {
      if (style?.family !== family) continue;
      for (const [tag, value] of Object.entries(style.axes ?? {})) {
        if (typeof tag === 'string' && tag.length === 4 && Number.isFinite(value)) tags.add(tag);
      }
    }
  }
  return tags;
}

function cssFamilyQuery(selection, { application = null } = {}) {
  const family = encodeURIComponent(selection.family).replace(/%20/g, '+');
  const usedTags = application ? usedAxisTagsForFamily(application, selection.family) : null;
  const axes = normalizeVariableAxes(selection, usedTags);

  if (axes.length) {
    const tags = axes.map((axis) => axis.tag);
    const values = axes.map(axisRequestValue);
    if (values.every(Boolean)) return `family=${family}:${tags.join(',')}@${values.join(',')}`;
  }

  const weights = normalWeights(selection);
  return `family=${family}:wght@${weights.join(';')}`;
}

export function buildGoogleFontsCss2Url(selections = [], { application = null } = {}) {
  const googleSelections = selections.filter((selection) => selection?.source === 'google-fonts' && selection.family);
  if (!googleSelections.length) return null;

  const queries = [...new Set(googleSelections.map((selection)=>cssFamilyQuery(selection, { application })))];
  return `https://fonts.googleapis.com/css2?${queries.join('&')}&display=swap`;
}

export function buildTypographyTokens(system) {
  const roles = system?.selection ?? {};
  const tokens = {};
  for (const [role, selection] of Object.entries(roles)) {
    if (!selection?.family) continue;
    tokens[`font-family-${role}`] = `'${selection.family}', ${selection.fallback ?? (role === 'display' ? 'serif' : role === 'utility' ? 'monospace' : 'sans-serif')}`;
    if (selection.weights?.length) tokens[`font-weight-${role}`] = selection.weights.join(' ');
  }
  return tokens;
}

function axisString(axes = {}) {
  const entries = Object.entries(axes)
    .filter(([tag, value]) => typeof tag === 'string' && tag.length === 4 && Number.isFinite(value))
    .sort(([a], [b]) => compareAxisTags(a, b));
  return entries.length ? entries.map(([tag, value]) => `"${tag}" ${value}`).join(', ') : null;
}

export function buildTypographyApplicationTokens(application) {
  if (!application?.pass) return {};
  const tokens = {
    'type-scale-ratio': application.ratio,
    'type-scale-mobile-ratio': application.mobileRatio,
    'type-body-measure': `${application.measure.ideal}${application.measure.unit}`,
    'type-body-measure-max': `${application.measure.max}${application.measure.unit}`
  };
  for (const [name, style] of Object.entries(application.styles ?? {})) {
    tokens[`type-${name}-size`] = `${style.sizePx}px`;
    tokens[`type-${name}-line-height`] = style.lineHeight;
    tokens[`type-${name}-tracking`] = `${style.trackingEm}em`;
    tokens[`type-${name}-weight`] = style.weight;
    const axes = axisString(style.axes);
    if (axes) tokens[`type-${name}-variation-settings`] = axes;
  }
  for (const [name, style] of Object.entries(application.mobileStyles ?? {})) {
    tokens[`type-mobile-${name}-size`] = `${style.sizePx}px`;
    tokens[`type-mobile-${name}-line-height`] = style.lineHeight;
    tokens[`type-mobile-${name}-tracking`] = `${style.trackingEm}em`;
    if (Number.isFinite(style.weight)) tokens[`type-mobile-${name}-weight`] = style.weight;
    const axes = axisString(style.axes);
    if (axes) tokens[`type-mobile-${name}-variation-settings`] = axes;
  }
  return tokens;
}

export function buildTypographyProductionConfig(system) {
  const selections = Object.values(system?.selection ?? {}).filter(Boolean);
  const tokens = {
    ...buildTypographyTokens(system),
    ...buildTypographyApplicationTokens(system?.application)
  };
  return {
    css2Url: buildGoogleFontsCss2Url(selections, { application:system?.application }),
    cssVariables: Object.fromEntries(Object.entries(tokens).map(([key, value]) => [`--${key}`, value])),
    families: selections.map(({ role, family, weights, source, variable, axes }) => ({
      role,
      family,
      weights,
      source,
      variable: variable === true,
      axes: Array.isArray(axes) ? structuredClone(axes) : []
    })),
    application: system?.application?.pass ? system.application : null
  };
}
