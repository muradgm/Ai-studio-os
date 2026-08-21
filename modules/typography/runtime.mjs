import { scoreFontForRole, scorePairing, supportsLanguages } from './scoring.mjs';
import { buildBusinessTypographyStrategy } from './strategy.mjs';
import { enrichFontCatalog } from './font-intelligence.mjs';
import { rankTypographySystems, buildTypographyAlternatives } from './system-intelligence.mjs';
import { buildTypographyApplication } from './application-intelligence.mjs';
import { buildTypographyProductionConfig } from './export.mjs';

function clamp(value, min=0, max=100) { return Math.max(min, Math.min(max, value)); }
function positiveLimit(value, fallback, max=100) {
  return Number.isInteger(value) && value > 0 ? Math.min(value, max) : fallback;
}

function roleWeights(font, role) {
  const weights = new Set();
  for (const variant of font.variants ?? []) {
    if (variant === 'regular') weights.add(400);
    else if (/^\d+$/.test(String(variant))) weights.add(Number(variant));
  }
  const sorted = [...weights].sort((a,b)=>a-b);
  if (role === 'display') return sorted.filter((weight)=>[400,500,600,700].includes(weight)).slice(0,3).length ? sorted.filter((weight)=>[400,500,600,700].includes(weight)).slice(0,3) : [sorted[0] ?? 400];
  if (role === 'utility') return sorted.filter((weight)=>[400,500,600].includes(weight)).slice(0,3).length ? sorted.filter((weight)=>[400,500,600].includes(weight)).slice(0,3) : [sorted[0] ?? 400];
  const preferred = sorted.filter((weight)=>[400,500,600,700].includes(weight));
  return preferred.length ? preferred : [sorted[0] ?? 400];
}

function fallbackFor(font) {
  if (font.category === 'serif') return 'serif';
  if (font.category === 'monospace') return 'monospace';
  return 'sans-serif';
}

function rankRole(catalog, role, context, limit) {
  const avoided = new Set((context.avoidFamilies ?? []).map((family)=>String(family).toLowerCase()));
  return catalog
    .filter((font)=>font?.family && !avoided.has(font.family.toLowerCase()))
    .filter((font)=>supportsLanguages(font, context.requirements?.languages ?? []))
    .map((font)=>({ font, scores:scoreFontForRole(font, { ...context, role }) }))
    .sort((a,b)=>b.scores.total-a.scores.total || a.font.family.localeCompare(b.font.family))
    .slice(0, limit);
}

function selection(font, role) {
  return {
    role, family:font.family, category:font.category, weights:roleWeights(font, role),
    variable:(font.axes ?? []).length > 0, axes:font.axes ?? [], subsets:font.subsets ?? [],
    source:font.provider ?? 'unknown', fallback:fallbackFor(font),
    intelligence:font.intelligence ?? null
  };
}

function resolveUtilityCandidate({ utility, displayCandidate, bodyCandidate, pairingStrategy, context }) {
  if (pairingStrategy === 'single-family') {
    const family = bodyCandidate.font.family;
    return utility.find((candidate)=>candidate.font.family === family)
      ?? {
        font: bodyCandidate.font,
        scores: scoreFontForRole(bodyCandidate.font, { ...context, role:'utility' })
      };
  }
  return utility.find((candidate)=>candidate.font.family !== displayCandidate.font.family && candidate.font.family !== bodyCandidate.font.family)
    ?? utility[0]
    ?? null;
}

export function buildTypographySystem({
  catalog=[], fontEvidence=[], business={}, brand={}, requirements={}, pairing={}, application={},
  marketCommonFamilies=[], marketCommonPairs=[], avoidFamilies=[], candidateLimit=8, systemLimit=3
}={}) {
  if (!Array.isArray(catalog)) throw new TypeError('typography catalog must be an array');
  if (!Array.isArray(fontEvidence)) throw new TypeError('font evidence must be an array');
  if (!Array.isArray(marketCommonFamilies)) throw new TypeError('marketCommonFamilies must be an array');
  if (!Array.isArray(marketCommonPairs)) throw new TypeError('marketCommonPairs must be an array');
  if (!Array.isArray(avoidFamilies)) throw new TypeError('avoidFamilies must be an array');

  const candidateCount = positiveLimit(candidateLimit, 8, 50);
  const systemCount = positiveLimit(systemLimit, 3, 20);
  const pairingStrategy = pairing.strategy ?? 'contrast-with-coherence';
  const minPairingScore = clamp(Number.isFinite(pairing.minScore) ? pairing.minScore : 65);
  const minSystemScore = clamp(Number.isFinite(pairing.minSystemScore) ? pairing.minSystemScore : 68);
  const strategy = buildBusinessTypographyStrategy({ business, brand, requirements });

  if (!catalog.length) {
    return { stage:'typography', pass:false, strategy, findings:[{severity:'blocker',code:'typography-catalog-empty'}], candidates:{}, systems:[], alternatives:[], selection:null, application:null, production:null };
  }

  const workingCatalog = fontEvidence.length ? enrichFontCatalog(catalog, fontEvidence) : catalog;
  const context = { business, brand, requirements, marketCommonFamilies, avoidFamilies, strategy };
  const display = rankRole(workingCatalog, 'display', context, candidateCount);
  const body = rankRole(workingCatalog, 'body', context, candidateCount);
  const utilityPool = pairingStrategy === 'single-family'
    ? workingCatalog
    : workingCatalog.filter((font)=>font.category === 'monospace');
  const utility = rankRole(utilityPool.length ? utilityPool : workingCatalog, 'utility', context, Math.min(candidateCount,5));

  const systems = [];
  for (const displayCandidate of display) {
    for (const bodyCandidate of body) {
      if (displayCandidate.font.family === bodyCandidate.font.family && pairingStrategy !== 'single-family') continue;
      const pair = scorePairing(displayCandidate.font, bodyCandidate.font, { strategy:pairingStrategy, requirements });
      if (pair.score < minPairingScore) continue;
      const utilityCandidate = resolveUtilityCandidate({ utility, displayCandidate, bodyCandidate, pairingStrategy, context });
      const overall = Math.round(displayCandidate.scores.total*0.26 + bodyCandidate.scores.total*0.34 + pair.score*0.30 + (utilityCandidate?.scores.total ?? 75)*0.10);
      systems.push({ overall, display:displayCandidate, body:bodyCandidate, utility:utilityCandidate, pairing:pair });
    }
  }

  const ranked = rankTypographySystems(systems, { strategy, marketCommonPairs, pairingStrategy });
  const acceptable = ranked.filter((entry)=>entry.critique.score >= minSystemScore && entry.critique.pass);
  const topReviewed = ranked.slice(0, systemCount).map((entry)=>({ ...entry.system, systemCritique:entry.critique }));
  const alternatives = buildTypographyAlternatives(ranked, { limit:systemCount });

  if (!ranked.length) {
    return { stage:'typography', pass:false, strategy, findings:[{severity:'blocker',code:'typography-no-valid-pairing',minPairingScore}], candidates:{display,body,utility}, systems:[], alternatives:[], selection:null, application:null, production:null };
  }
  if (!acceptable.length) {
    return {
      stage:'typography', pass:false, strategy,
      findings:[{severity:'blocker',code:'typography-no-acceptable-system',minSystemScore,bestScore:ranked[0].critique.score,bestFindings:ranked[0].critique.findings}],
      candidates:{display,body,utility}, systems:topReviewed, alternatives, selection:null, application:null, production:null
    };
  }

  const winnerEntry = acceptable[0];
  const winner = winnerEntry.system;
  const topSystems = acceptable.slice(0, systemCount).map((entry)=>({ ...entry.system, systemCritique:entry.critique }));
  const acceptedAlternatives = buildTypographyAlternatives(acceptable, { limit:systemCount });
  const resolved = {
    display:selection(winner.display.font,'display'),
    body:selection(winner.body.font,'body'),
    utility:winner.utility ? selection(winner.utility.font,'utility') : null
  };
  const applicationPlan = buildTypographyApplication({ selection:resolved, strategy, requirements, viewport:application.viewport ?? {} });
  if (!applicationPlan.pass) {
    return {
      stage:'typography', pass:false, strategy,
      findings:[{severity:'blocker',code:'typography-application-not-ready',details:applicationPlan.findings}],
      candidates:{display,body,utility}, systems:topSystems, alternatives:acceptedAlternatives,
      selection:resolved, application:applicationPlan, production:null
    };
  }

  const output = {
    stage:'typography', pass:true, findings:[], strategy,
    intelligence:{ evidenceFamilies:fontEvidence.length, winnerEvidenceLevel:winner.pairing.evidenceLevel, winnerStructuralConfidence:winner.pairing.structural?.confidence ?? 0 },
    context:{
      business, brand, requirements,
      pairing:{...pairing,strategy:pairingStrategy,minScore:minPairingScore,minSystemScore},
      limits:{candidateLimit:candidateCount,systemLimit:systemCount},
      marketCommonPairs,
      application
    },
    candidates:{display,body,utility}, systems:topSystems, alternatives:acceptedAlternatives,
    rejectedAlternatives: alternatives.filter((item)=>item.findings.length > 0),
    systemCritique:winnerEntry.critique,
    selection:resolved,
    application:applicationPlan
  };
  output.production = buildTypographyProductionConfig(output);
  return output;
}

export function validateTypographyBenchmark(output, expected={}) {
  const failures = [];
  if (expected.pass !== undefined && output.pass !== expected.pass) failures.push(`expected pass=${expected.pass}, got ${output.pass}`);
  if (expected.displayFamily && output.selection?.display?.family !== expected.displayFamily) failures.push(`expected display ${expected.displayFamily}, got ${output.selection?.display?.family ?? 'none'}`);
  if (expected.bodyFamily && output.selection?.body?.family !== expected.bodyFamily) failures.push(`expected body ${expected.bodyFamily}, got ${output.selection?.body?.family ?? 'none'}`);
  if (expected.utilityFamily && output.selection?.utility?.family !== expected.utilityFamily) failures.push(`expected utility ${expected.utilityFamily}, got ${output.selection?.utility?.family ?? 'none'}`);
  if (expected.minPairingScore !== undefined && (output.systems?.[0]?.pairing?.score ?? 0) < expected.minPairingScore) failures.push(`pairing score below ${expected.minPairingScore}`);
  if (expected.minSystemScore !== undefined && (output.systemCritique?.score ?? 0) < expected.minSystemScore) failures.push(`system score below ${expected.minSystemScore}`);
  if (expected.minBodySize !== undefined && (output.application?.styles?.body?.sizePx ?? 0) < expected.minBodySize) failures.push(`body size below ${expected.minBodySize}`);
  if (expected.maxMeasure !== undefined && (output.application?.measure?.max ?? Infinity) > expected.maxMeasure) failures.push(`body measure exceeds ${expected.maxMeasure}ch`);
  if (expected.evidenceLevel && output.systems?.[0]?.pairing?.evidenceLevel !== expected.evidenceLevel) failures.push(`expected evidence level ${expected.evidenceLevel}, got ${output.systems?.[0]?.pairing?.evidenceLevel ?? 'none'}`);
  for (const family of expected.excludedFamilies ?? []) {
    const selected = [output.selection?.display?.family, output.selection?.body?.family, output.selection?.utility?.family].filter(Boolean);
    if (selected.includes(family)) failures.push(`excluded family selected: ${family}`);
  }
  for (const pressure of expected.minPressures ?? []) {
    if ((output.strategy?.pressures?.[pressure.key] ?? 0) < pressure.value) failures.push(`${pressure.key} pressure below ${pressure.value}`);
  }
  return { pass:failures.length===0, failures };
}
