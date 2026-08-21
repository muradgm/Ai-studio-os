function clamp(value, min=0, max=100) { return Math.max(min, Math.min(max, value)); }
function round(value, digits=2) { const p = 10 ** digits; return Math.round(value * p) / p; }

function resolvePressure(strategy, key, fallback=50) {
  const value = Number(strategy?.pressures?.[key]);
  return Number.isFinite(value) ? value : fallback;
}

function resolveScaleRatio({ strategy={}, requirements={} }={}) {
  let ratio = 1.2;
  const expression = resolvePressure(strategy, 'expression');
  const density = resolvePressure(strategy, 'readingDensity');
  const accessibility = resolvePressure(strategy, 'accessibility');
  if (expression >= 75) ratio += 0.06;
  if (density >= 75) ratio -= 0.04;
  if (accessibility >= 75) ratio -= 0.02;
  if (requirements.interfaceDense === true) ratio -= 0.03;
  return clamp(round(ratio, 3), 1.12, 1.32);
}

function buildScale(base, ratio, steps) {
  const output = {};
  for (const [token, exponent] of Object.entries(steps)) output[token] = round(base * (ratio ** exponent), 2);
  return output;
}

function resolveBodyBase({ requirements={}, strategy={} }={}) {
  let base = 16;
  if (requirements.longForm === true) base += 1;
  if (resolvePressure(strategy, 'accessibility') >= 80) base += 1;
  if (requirements.interfaceDense === true) base -= 1;
  return clamp(base, 15, 19);
}

function resolveMeasure({ requirements={}, strategy={} }={}) {
  if (requirements.interfaceDense === true) return { min:42, ideal:54, max:62, unit:'ch' };
  if (requirements.longForm === true || resolvePressure(strategy,'readingDensity') >= 75) return { min:55, ideal:66, max:72, unit:'ch' };
  return { min:48, ideal:60, max:68, unit:'ch' };
}

function axisRange(selection, tag) {
  const axis = (selection?.axes ?? []).find((item)=>item?.tag === tag);
  if (!axis) return null;
  const start = Number(axis.start), end = Number(axis.end);
  return Number.isFinite(start) && Number.isFinite(end) ? { start, end } : null;
}

function clampAxis(value, range) {
  if (!range || !Number.isFinite(value)) return null;
  return round(Math.max(range.start, Math.min(range.end, value)), 2);
}

function variableSettings(selection, role, sizePx, strategy={}) {
  if (!selection?.variable) return {};
  const settings = {};
  const opsz = axisRange(selection, 'opsz');
  const wght = axisRange(selection, 'wght');
  const wdth = axisRange(selection, 'wdth');
  if (opsz) settings.opsz = clampAxis(sizePx, opsz);
  if (wght) {
    const preferred = role === 'display' ? 600 : role === 'utility' ? 500 : 400;
    settings.wght = clampAxis(preferred, wght);
  }
  if (wdth && role === 'display' && resolvePressure(strategy,'expression') >= 75) {
    settings.wdth = clampAxis(wdth.end - (wdth.end - wdth.start) * 0.2, wdth);
  }
  return settings;
}

function textStyle({ family, size, weight, lineHeight, tracking, measure=null, axes={} }) {
  return { family, sizePx:round(size), weight, lineHeight:round(lineHeight,3), trackingEm:round(tracking,4), ...(measure ? { measure } : {}), ...(Object.keys(axes).length ? { axes } : {}) };
}

export function buildTypographyApplication({ selection, strategy={}, requirements={}, viewport={} }={}) {
  if (!selection?.display || !selection?.body) {
    return { stage:'typography-application', pass:false, findings:[{severity:'blocker',code:'typography-application-selection-missing'}] };
  }
  const ratio = resolveScaleRatio({ strategy, requirements });
  const base = resolveBodyBase({ requirements, strategy });
  const mobileBase = clamp(base - (requirements.interfaceDense ? 0 : 1), 15, 18);
  const desktopScale = buildScale(base, ratio, { xs:-1, sm:0, md:1, lg:2, xl:3, '2xl':4, '3xl':5, '4xl':6 });
  const mobileRatio = clamp(ratio - 0.04, 1.1, 1.26);
  const mobileScale = buildScale(mobileBase, mobileRatio, { xs:-1, sm:0, md:1, lg:2, xl:3, '2xl':4, '3xl':5, '4xl':6 });
  const measure = resolveMeasure({ requirements, strategy });
  const dense = requirements.interfaceDense === true;
  const longForm = requirements.longForm === true;

  const bodyFamily = selection.body.family;
  const displayFamily = selection.display.family;
  const utilityFamily = selection.utility?.family ?? bodyFamily;
  const bodyWeight = selection.body.weights?.includes(400) ? 400 : selection.body.weights?.[0] ?? 400;
  const displayWeight = selection.display.weights?.find((w)=>w >= 500) ?? selection.display.weights?.[0] ?? 600;
  const utilityWeight = selection.utility?.weights?.includes(500) ? 500 : selection.utility?.weights?.[0] ?? 500;

  const styles = {
    body: textStyle({ family:bodyFamily, size:desktopScale.sm, weight:bodyWeight, lineHeight:longForm ? 1.65 : 1.55, tracking:0, measure, axes:variableSettings(selection.body,'body',desktopScale.sm,strategy) }),
    bodySmall: textStyle({ family:bodyFamily, size:desktopScale.xs, weight:bodyWeight, lineHeight:1.5, tracking:0.002, axes:variableSettings(selection.body,'body',desktopScale.xs,strategy) }),
    lead: textStyle({ family:bodyFamily, size:desktopScale.md, weight:bodyWeight, lineHeight:1.5, tracking:-0.005, measure:{...measure, ideal:Math.max(measure.min, measure.ideal-4)}, axes:variableSettings(selection.body,'body',desktopScale.md,strategy) }),
    h1: textStyle({ family:displayFamily, size:desktopScale['4xl'], weight:displayWeight, lineHeight:dense ? 1.02 : 0.98, tracking:-0.025, axes:variableSettings(selection.display,'display',desktopScale['4xl'],strategy) }),
    h2: textStyle({ family:displayFamily, size:desktopScale['3xl'], weight:displayWeight, lineHeight:1.04, tracking:-0.02, axes:variableSettings(selection.display,'display',desktopScale['3xl'],strategy) }),
    h3: textStyle({ family:displayFamily, size:desktopScale['2xl'], weight:displayWeight, lineHeight:1.1, tracking:-0.015, axes:variableSettings(selection.display,'display',desktopScale['2xl'],strategy) }),
    nav: textStyle({ family:utilityFamily, size:Math.max(13, desktopScale.xs), weight:utilityWeight, lineHeight:1.2, tracking:0.01, axes:variableSettings(selection.utility ?? selection.body,'utility',desktopScale.xs,strategy) }),
    button: textStyle({ family:utilityFamily, size:Math.max(14, desktopScale.xs), weight:Math.max(500, utilityWeight), lineHeight:1.15, tracking:0.005, axes:variableSettings(selection.utility ?? selection.body,'utility',desktopScale.xs,strategy) }),
    meta: textStyle({ family:utilityFamily, size:Math.max(12, desktopScale.xs-1), weight:utilityWeight, lineHeight:1.3, tracking:0.02, axes:variableSettings(selection.utility ?? selection.body,'utility',desktopScale.xs-1,strategy) })
  };

  const mobileStyles = {
    body:{...styles.body,sizePx:mobileScale.sm,lineHeight:longForm ? 1.62 : 1.5,axes:variableSettings(selection.body,'body',mobileScale.sm,strategy)},
    h1:{...styles.h1,sizePx:mobileScale['4xl'],lineHeight:1,trackingEm:-0.02,axes:variableSettings(selection.display,'display',mobileScale['4xl'],strategy)},
    h2:{...styles.h2,sizePx:mobileScale['3xl'],lineHeight:1.05,trackingEm:-0.015,axes:variableSettings(selection.display,'display',mobileScale['3xl'],strategy)},
    h3:{...styles.h3,sizePx:mobileScale['2xl'],lineHeight:1.1,trackingEm:-0.01,axes:variableSettings(selection.display,'display',mobileScale['2xl'],strategy)},
    nav:{...styles.nav,sizePx:Math.max(13,mobileScale.xs)},
    button:{...styles.button,sizePx:Math.max(14,mobileScale.xs)}
  };

  const findings = [];
  if (styles.h1.sizePx / styles.body.sizePx < 2) findings.push({severity:'major',code:'typography-application-hierarchy-too-flat'});
  if (measure.ideal > 75) findings.push({severity:'major',code:'typography-application-measure-too-wide'});
  if (styles.body.sizePx < 15) findings.push({severity:'major',code:'typography-application-body-too-small'});

  return {
    stage:'typography-application',
    pass:findings.every((f)=>f.severity !== 'blocker' && f.severity !== 'major'),
    findings,
    ratio,
    mobileRatio,
    basePx:base,
    mobileBasePx:mobileBase,
    measure,
    breakpoints:{ mobileMax:viewport.mobileMax ?? 767, desktopMin:viewport.desktopMin ?? 1024 },
    scale:{ desktop:desktopScale, mobile:mobileScale },
    styles,
    mobileStyles,
    principles:[
      'preserve role hierarchy across breakpoints rather than preserving absolute sizes',
      'keep body measure within readable line length',
      'use variable axes only when the selected family exposes them',
      'avoid decorative tracking in sustained body text'
    ]
  };
}
