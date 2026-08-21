function clamp(value, min=0, max=100) { return Math.max(min, Math.min(max, value)); }
function round(value, digits=2) { const p = 10 ** digits; return Math.round(value * p) / p; }

function resolvePressure(strategy, key, fallback=50) {
  const value = Number(strategy?.pressures?.[key]);
  return Number.isFinite(value) ? value : fallback;
}

function descriptor(selection, key) {
  const value = Number(selection?.intelligence?.descriptors?.[key]);
  return Number.isFinite(value) ? value : null;
}

function resolveScaleRatio({ strategy={}, requirements={}, display={} }={}) {
  let ratio = 1.2;
  const expression = resolvePressure(strategy, 'expression');
  const density = resolvePressure(strategy, 'readingDensity');
  const accessibility = resolvePressure(strategy, 'accessibility');
  if (expression >= 75) ratio += 0.06;
  if (density >= 75) ratio -= 0.04;
  if (accessibility >= 75) ratio -= 0.02;
  if (requirements.interfaceDense === true) ratio -= 0.03;
  const capHeight = descriptor(display, 'capHeight');
  if (capHeight !== null && capHeight < 65) ratio += 0.015;
  if (capHeight !== null && capHeight > 76) ratio -= 0.01;
  return clamp(round(ratio, 3), 1.12, 1.32);
}

function buildScale(base, ratio, steps) {
  const output = {};
  for (const [token, exponent] of Object.entries(steps)) output[token] = round(base * (ratio ** exponent), 2);
  return output;
}

function resolveBodyBase({ requirements={}, strategy={}, body={} }={}) {
  let base = 16;
  if (requirements.longForm === true) base += 1;
  if (resolvePressure(strategy, 'accessibility') >= 80) base += 1;
  if (requirements.interfaceDense === true) base -= 1;
  const xHeight = descriptor(body, 'xHeight');
  if (xHeight !== null && xHeight < 50) base += 1;
  else if (xHeight !== null && xHeight >= 70 && requirements.interfaceDense === true) base -= 0.5;
  return clamp(base, 15, 19);
}

function resolveMeasure({ requirements={}, strategy={}, body={} }={}) {
  let measure;
  if (requirements.interfaceDense === true) measure = { min:42, ideal:54, max:62, unit:'ch' };
  else if (requirements.longForm === true || resolvePressure(strategy,'readingDensity') >= 75) measure = { min:55, ideal:66, max:72, unit:'ch' };
  else measure = { min:48, ideal:60, max:68, unit:'ch' };

  const width = descriptor(body, 'width');
  if (width !== null && width >= 62) {
    measure = { ...measure, min:Math.max(38, measure.min-4), ideal:measure.ideal-5, max:measure.max-5 };
  } else if (width !== null && width <= 45) {
    measure = { ...measure, ideal:Math.min(70, measure.ideal+4), max:Math.min(76, measure.max+4) };
  }
  return measure;
}

function resolveBodyLineHeight(body, { longForm=false, mobile=false }={}) {
  const ascender = descriptor(body, 'ascender');
  const descender = descriptor(body, 'descender');
  const lineGap = descriptor(body, 'lineGap');
  if ([ascender, descender].every(Number.isFinite)) {
    const verticalBox = (ascender + descender + (Number.isFinite(lineGap) ? lineGap : 0)) / 100;
    const breathing = longForm ? 0.52 : mobile ? 0.47 : 0.45;
    return clamp(round(verticalBox + breathing, 3), longForm ? 1.52 : 1.42, 1.76);
  }
  return longForm ? (mobile ? 1.62 : 1.65) : (mobile ? 1.5 : 1.55);
}

function resolveBodyTracking(body) {
  const width = descriptor(body, 'width');
  if (width !== null && width <= 45) return 0.004;
  if (width !== null && width >= 64) return -0.002;
  return 0;
}

function resolveDisplayTracking(display, fallback) {
  const contrast = descriptor(display, 'strokeContrast');
  const width = descriptor(display, 'width');
  let tracking = fallback;
  if (contrast !== null && contrast >= 70) tracking += 0.008;
  if (width !== null && width <= 44) tracking += 0.005;
  if (width !== null && width >= 66) tracking -= 0.003;
  return clamp(tracking, -0.04, 0.02);
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

export function buildTypographyApplication({ selection, strategy={}, requirements={}, viewport={}, intent=null }={}) {
  if (!selection?.display || !selection?.body) {
    return { stage:'typography-application', pass:false, findings:[{severity:'blocker',code:'typography-application-selection-missing'}] };
  }
  const ratio = resolveScaleRatio({ strategy, requirements, display:selection.display });
  const base = resolveBodyBase({ requirements, strategy, body:selection.body });
  const mobileBase = clamp(base - (requirements.interfaceDense ? 0 : 1), 15, 18);
  const desktopScale = buildScale(base, ratio, { xs:-1, sm:0, md:1, lg:2, xl:3, '2xl':4, '3xl':5, '4xl':6 });
  const mobileRatio = clamp(ratio - 0.04, 1.1, 1.26);
  const mobileScale = buildScale(mobileBase, mobileRatio, { xs:-1, sm:0, md:1, lg:2, xl:3, '2xl':4, '3xl':5, '4xl':6 });
  const measure = resolveMeasure({ requirements, strategy, body:selection.body });
  const dense = requirements.interfaceDense === true;
  const longForm = requirements.longForm === true;

  const bodyFamily = selection.body.family;
  const displayFamily = selection.display.family;
  const utilityFamily = selection.utility?.family ?? bodyFamily;
  const bodyWeight = selection.body.weights?.includes(400) ? 400 : selection.body.weights?.[0] ?? 400;
  const displayWeight = selection.display.weights?.find((w)=>w >= 500) ?? selection.display.weights?.[0] ?? 600;
  const utilityWeight = selection.utility?.weights?.includes(500) ? 500 : selection.utility?.weights?.[0] ?? 500;
  const bodyLineHeight = resolveBodyLineHeight(selection.body, { longForm });
  const mobileBodyLineHeight = resolveBodyLineHeight(selection.body, { longForm, mobile:true });
  const bodyTracking = resolveBodyTracking(selection.body);

  const styles = {
    body: textStyle({ family:bodyFamily, size:desktopScale.sm, weight:bodyWeight, lineHeight:bodyLineHeight, tracking:bodyTracking, measure, axes:variableSettings(selection.body,'body',desktopScale.sm,strategy) }),
    bodySmall: textStyle({ family:bodyFamily, size:desktopScale.xs, weight:bodyWeight, lineHeight:Math.max(1.45, bodyLineHeight-0.05), tracking:bodyTracking+0.002, axes:variableSettings(selection.body,'body',desktopScale.xs,strategy) }),
    lead: textStyle({ family:bodyFamily, size:desktopScale.md, weight:bodyWeight, lineHeight:Math.max(1.42, bodyLineHeight-0.06), tracking:bodyTracking-0.003, measure:{...measure, ideal:Math.max(measure.min, measure.ideal-4)}, axes:variableSettings(selection.body,'body',desktopScale.md,strategy) }),
    h1: textStyle({ family:displayFamily, size:desktopScale['4xl'], weight:displayWeight, lineHeight:dense ? 1.02 : 0.98, tracking:resolveDisplayTracking(selection.display,-0.025), axes:variableSettings(selection.display,'display',desktopScale['4xl'],strategy) }),
    h2: textStyle({ family:displayFamily, size:desktopScale['3xl'], weight:displayWeight, lineHeight:1.04, tracking:resolveDisplayTracking(selection.display,-0.02), axes:variableSettings(selection.display,'display',desktopScale['3xl'],strategy) }),
    h3: textStyle({ family:displayFamily, size:desktopScale['2xl'], weight:displayWeight, lineHeight:1.1, tracking:resolveDisplayTracking(selection.display,-0.015), axes:variableSettings(selection.display,'display',desktopScale['2xl'],strategy) }),
    nav: textStyle({ family:utilityFamily, size:Math.max(13, desktopScale.xs), weight:utilityWeight, lineHeight:1.2, tracking:0.01, axes:variableSettings(selection.utility ?? selection.body,'utility',desktopScale.xs,strategy) }),
    button: textStyle({ family:utilityFamily, size:Math.max(14, desktopScale.xs), weight:Math.max(500, utilityWeight), lineHeight:1.15, tracking:0.005, axes:variableSettings(selection.utility ?? selection.body,'utility',desktopScale.xs,strategy) }),
    meta: textStyle({ family:utilityFamily, size:Math.max(12, desktopScale.xs-1), weight:utilityWeight, lineHeight:1.3, tracking:0.02, axes:variableSettings(selection.utility ?? selection.body,'utility',desktopScale.xs-1,strategy) })
  };

  const mobileStyles = {
    body:{...styles.body,sizePx:mobileScale.sm,lineHeight:mobileBodyLineHeight,axes:variableSettings(selection.body,'body',mobileScale.sm,strategy)},
    h1:{...styles.h1,sizePx:mobileScale['4xl'],lineHeight:1,trackingEm:resolveDisplayTracking(selection.display,-0.02),axes:variableSettings(selection.display,'display',mobileScale['4xl'],strategy)},
    h2:{...styles.h2,sizePx:mobileScale['3xl'],lineHeight:1.05,trackingEm:resolveDisplayTracking(selection.display,-0.015),axes:variableSettings(selection.display,'display',mobileScale['3xl'],strategy)},
    h3:{...styles.h3,sizePx:mobileScale['2xl'],lineHeight:1.1,trackingEm:resolveDisplayTracking(selection.display,-0.01),axes:variableSettings(selection.display,'display',mobileScale['2xl'],strategy)},
    nav:{...styles.nav,sizePx:Math.max(13,mobileScale.xs)},
    button:{...styles.button,sizePx:Math.max(14,mobileScale.xs)}
  };

  const findings = [];
  if (styles.h1.sizePx / styles.body.sizePx < 2) findings.push({severity:'major',code:'typography-application-hierarchy-too-flat'});
  if (measure.ideal > 75) findings.push({severity:'major',code:'typography-application-measure-too-wide'});
  if (styles.body.sizePx < 15) findings.push({severity:'major',code:'typography-application-body-too-small'});

  const opticalEvidence = {
    body:{
      xHeight:descriptor(selection.body,'xHeight'), width:descriptor(selection.body,'width'),
      ascender:descriptor(selection.body,'ascender'), descender:descriptor(selection.body,'descender'), lineGap:descriptor(selection.body,'lineGap')
    },
    display:{
      capHeight:descriptor(selection.display,'capHeight'), width:descriptor(selection.display,'width'), strokeContrast:descriptor(selection.display,'strokeContrast')
    }
  };

  return {
    stage:'typography-application',
    pass:findings.every((f)=>f.severity !== 'blocker' && f.severity !== 'major'),
    findings,
    ratio,
    mobileRatio,
    basePx:base,
    mobileBasePx:mobileBase,
    measure,
    opticalEvidence,
    intentRef:intent?.authority ?? null,
    breakpoints:{ mobileMax:viewport.mobileMax ?? 767, desktopMin:viewport.desktopMin ?? 1024 },
    scale:{ desktop:desktopScale, mobile:mobileScale },
    styles,
    mobileStyles,
    principles:[
      'preserve role hierarchy across breakpoints rather than preserving absolute sizes',
      'derive body sizing, line-height and measure from measured font metrics when available',
      'use variable axes only when the selected family exposes them',
      'avoid decorative tracking in sustained body text'
    ]
  };
}
