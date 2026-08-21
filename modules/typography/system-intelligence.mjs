function clamp(value, min=0, max=100) { return Math.max(min, Math.min(max, Math.round(value))); }

const COMMON_PAIR_KEYS = new Set([
  'playfair display|montserrat',
  'playfair display|poppins',
  'dm serif display|montserrat',
  'roboto|roboto mono',
  'poppins|inter',
  'montserrat|open sans',
  'lora|open sans'
]);

function pairKey(a, b) {
  return [String(a ?? '').toLowerCase(), String(b ?? '').toLowerCase()].sort().join('|');
}

function numericDistance(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.abs(a - b);
}

function evaluateRoleSeparation(display, body, pairingStrategy='contrast-with-coherence') {
  let score = 72;
  const reasons = [];
  if (!display || !body) return { score:0, reasons:['display and body roles are both required'] };
  if (display.family === body.family) {
    if (pairingStrategy === 'single-family') {
      score += 12;
      reasons.push('single-family strategy intentionally separates roles through hierarchy rather than family contrast');
    } else {
      score -= 25;
      reasons.push('display and body use the same family without a single-family strategy');
    }
  }
  if (display.category !== body.category) {
    score += 7;
    reasons.push('display/body categories provide role separation');
  }
  const a = display.intelligence?.descriptors ?? {};
  const b = body.intelligence?.descriptors ?? {};
  const distances = [
    numericDistance(a.xHeight, b.xHeight),
    numericDistance(a.width, b.width),
    numericDistance(a.strokeContrast, b.strokeContrast),
    numericDistance(a.roundness, b.roundness)
  ].filter(Number.isFinite);
  if (distances.length >= 2 && display.family !== body.family) {
    const average = distances.reduce((sum, value)=>sum+value,0) / distances.length;
    if (average < 7) { score -= 14; reasons.push('measured structure is too similar for strong hierarchy'); }
    else if (average >= 12 && average <= 42) { score += 10; reasons.push('measured structure creates controlled display/body tension'); }
    else if (average > 60) { score -= 7; reasons.push('display/body structural distance may be excessive'); }
  }
  return { score:clamp(score), reasons };
}

function evaluateUtilityRole(utility, body, strategy={}) {
  if (!utility) return { score:70, reasons:['utility role omitted; acceptable when project does not need a third family'] };
  let score = 72;
  const reasons = [];
  if (utility.family === body?.family) { score += 5; reasons.push('utility reuses body family and limits font sprawl'); }
  else if (utility.category === 'monospace') {
    const technicality = Number(strategy.pressures?.technicality ?? 50);
    score += technicality >= 65 ? 12 : 3;
    reasons.push(technicality >= 65 ? 'monospace utility supports technical product character' : 'monospace adds explicit functional separation');
  }
  return { score:clamp(score), reasons };
}

function evaluateClicheRisk(display, body, { marketCommonPairs=[] }={}) {
  const key = pairKey(display?.family, body?.family);
  const common = new Set([...COMMON_PAIR_KEYS, ...marketCommonPairs.map((pair)=>{
    if (Array.isArray(pair)) return pairKey(pair[0], pair[1]);
    const [a,b] = String(pair).split('|');
    return pairKey(a,b);
  })]);
  if (display?.family && body?.family && display.family === body.family) {
    return { score:82, risk:'low', reasons:['single-family system avoids a common two-family pairing cliché'] };
  }
  if (common.has(key)) return { score:35, risk:'high', reasons:['pair matches an overused/default pairing pattern'] };
  return { score:85, risk:'low', reasons:['pair avoids the default overused-pair list'] };
}

function evaluateBusinessAlignment(system, strategy={}) {
  const pressures = strategy.pressures ?? {};
  const displayFit = system.display?.scores?.business?.score ?? 50;
  const bodyFit = system.body?.scores?.business?.score ?? 50;
  const utilityFit = system.utility?.scores?.business?.score ?? 70;
  let score = displayFit*0.35 + bodyFit*0.45 + utilityFit*0.20;
  const reasons = ['system score incorporates role-specific business fit'];
  if ((pressures.readingDensity ?? 50) >= 70 && (system.body?.scores?.production?.score ?? 0) < 70) {
    score -= 12;
    reasons.push('high reading-density strategy requires stronger body production fitness');
  }
  if ((pressures.distinctiveness ?? 50) >= 70 && (system.display?.scores?.distinctiveness?.score ?? 0) < 60) {
    score -= 10;
    reasons.push('high distinctiveness pressure conflicts with a common display family');
  }
  return { score:clamp(score), reasons };
}

export function critiqueTypographySystem(system, { strategy={}, marketCommonPairs=[], pairingStrategy='contrast-with-coherence' }={}) {
  if (!system?.display?.font || !system?.body?.font) {
    return { pass:false, score:0, findings:[{severity:'blocker',code:'typography-system-incomplete'}] };
  }
  const display = system.display.font;
  const body = system.body.font;
  const utility = system.utility?.font ?? null;
  const roleSeparation = evaluateRoleSeparation(display, body, pairingStrategy);
  const utilityRole = evaluateUtilityRole(utility, body, strategy);
  const cliche = evaluateClicheRisk(display, body, { marketCommonPairs });
  const businessAlignment = evaluateBusinessAlignment(system, strategy);
  const pairingQuality = system.pairing?.score ?? 0;
  const score = clamp(
    roleSeparation.score*0.24 + utilityRole.score*0.10 + cliche.score*0.16 +
    businessAlignment.score*0.25 + pairingQuality*0.25
  );
  const findings = [];
  if (roleSeparation.score < 55) findings.push({severity:'major',code:'typography-role-separation-weak'});
  if (cliche.risk === 'high') findings.push({severity:'major',code:'typography-pair-cliche-risk'});
  if (businessAlignment.score < 60) findings.push({severity:'major',code:'typography-business-fit-weak'});
  if (pairingQuality < 65) findings.push({severity:'major',code:'typography-pairing-quality-low'});
  return {
    pass: findings.every((finding)=>finding.severity !== 'blocker' && finding.severity !== 'major'),
    score,
    dimensions:{ roleSeparation, utilityRole, cliche, businessAlignment, pairingQuality },
    findings
  };
}

export function rankTypographySystems(systems=[], context={}) {
  return systems.map((system)=>({ system, critique:critiqueTypographySystem(system, context) }))
    .sort((a,b)=>b.critique.score-a.critique.score || b.system.overall-a.system.overall);
}

export function buildTypographyAlternatives(ranked=[], { limit=3 }={}) {
  return ranked.slice(0, Math.max(1, limit)).map((entry, index)=>({
    rank:index+1,
    score:entry.critique.score,
    display:entry.system.display.font.family,
    body:entry.system.body.font.family,
    utility:entry.system.utility?.font.family ?? null,
    pairingScore:entry.system.pairing?.score ?? 0,
    clicheRisk:entry.critique.dimensions.cliche.risk,
    findings:entry.critique.findings
  }));
}
