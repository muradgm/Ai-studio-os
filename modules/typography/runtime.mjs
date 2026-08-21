import { scoreFontForRole, scorePairing, supportsLanguages, resolveLanguageRequirements } from './scoring.mjs';
import { buildBusinessTypographyStrategy } from './strategy.mjs';
import { buildTypographyIntent } from './typography-intent.mjs';
import { enrichFontCatalog } from './font-intelligence.mjs';
import { rankTypographySystems, buildTypographyAlternatives } from './system-intelligence.mjs';
import { buildTypographyApplication } from './application-intelligence.mjs';
import { buildTypographyProductionConfig } from './export.mjs';
import { resolveTypographyArtDirection } from './art-direction-review.mjs';

function clamp(value, min=0, max=100) { return Math.max(min, Math.min(max, value)); }
function positiveLimit(value, fallback, max=100) { return Number.isInteger(value) && value > 0 ? Math.min(value, max) : fallback; }
function roleWeights(font, role) {
  const weights = new Set();
  for (const variant of font.variants ?? []) { if (variant === 'regular') weights.add(400); else if (/^\d+$/.test(String(variant))) weights.add(Number(variant)); }
  const sorted = [...weights].sort((a,b)=>a-b);
  if (role === 'display') { const p=sorted.filter((w)=>[400,500,600,700].includes(w)).slice(0,3); return p.length?p:[sorted[0]??400]; }
  if (role === 'utility') { const p=sorted.filter((w)=>[400,500,600].includes(w)).slice(0,3); return p.length?p:[sorted[0]??400]; }
  const preferred=sorted.filter((w)=>[400,500,600,700].includes(w)); return preferred.length?preferred:[sorted[0]??400];
}
function fallbackFor(font) { if (font.category==='serif') return 'serif'; if (font.category==='monospace') return 'monospace'; return 'sans-serif'; }
function rankRole(catalog, role, context, limit) {
  const avoided=new Set((context.avoidFamilies??[]).map((f)=>String(f).toLowerCase()));
  const avoidCategories=new Set((context.strategy?.intent?.avoidCategories??[]).map((v)=>String(v).toLowerCase()));
  return catalog.filter((f)=>f?.family&&!avoided.has(f.family.toLowerCase()))
    .filter((f)=>!avoidCategories.has(String(f.category??'').toLowerCase()))
    .filter((f)=>supportsLanguages(f,context.requirements?.languages??[]))
    .map((font)=>({font,scores:scoreFontForRole(font,{...context,role})}))
    .sort((a,b)=>b.scores.total-a.scores.total||a.font.family.localeCompare(b.font.family)).slice(0,limit);
}
function selection(font, role) { return { role,family:font.family,category:font.category,weights:roleWeights(font,role),variable:(font.axes??[]).length>0,axes:font.axes??[],subsets:font.subsets??[],source:font.provider??'unknown',fallback:fallbackFor(font),intelligence:font.intelligence??null }; }
function wantsDistinctUtility(intent={}, pairing={}) {
  return pairing.utilityStrategy === 'distinct'
    || Boolean(intent.roleDirectives?.utility)
    || Boolean(intent.preferredCategories?.utility?.length)
    || Boolean(intent.descriptorTargets?.utility && Object.keys(intent.descriptorTargets.utility).length);
}
function resolveUtilityCandidate({ utility, bodyCandidate, pairingStrategy, context, distinctUtility }) {
  if (pairingStrategy === 'single-family' || !distinctUtility) {
    return utility.find((c)=>c.font.family===bodyCandidate.font.family) ?? { font:bodyCandidate.font, scores:scoreFontForRole(bodyCandidate.font,{...context,role:'utility'}) };
  }
  return utility.find((c)=>c.font.family!==bodyCandidate.font.family) ?? utility[0] ?? null;
}

export function buildTypographySystem({
  catalog=[],fontEvidence=[],business={},brand={},requirements={},pairing={},application={},creativeThesis=null,creativeWorld=null,typographyIntent=null,typographyArtDirection=null,
  marketCommonFamilies=[],marketCommonPairs=[],avoidFamilies=[],candidateLimit=8,systemLimit=3
}={}) {
  if (!Array.isArray(catalog)) throw new TypeError('typography catalog must be an array');
  if (!Array.isArray(fontEvidence)) throw new TypeError('font evidence must be an array');
  if (!Array.isArray(marketCommonFamilies)) throw new TypeError('marketCommonFamilies must be an array');
  if (!Array.isArray(marketCommonPairs)) throw new TypeError('marketCommonPairs must be an array');
  if (!Array.isArray(avoidFamilies)) throw new TypeError('avoidFamilies must be an array');
  const candidateCount=positiveLimit(candidateLimit,8,50), systemCount=positiveLimit(systemLimit,3,20);
  const pairingStrategy=pairing.strategy??'contrast-with-coherence';
  const minPairingScore=clamp(Number.isFinite(pairing.minScore)?pairing.minScore:65), minSystemScore=clamp(Number.isFinite(pairing.minSystemScore)?pairing.minSystemScore:68);
  const intent=buildTypographyIntent({creativeThesis,creativeWorld,explicit:typographyIntent});
  const strategy=buildBusinessTypographyStrategy({business,brand,requirements,typographyIntent:intent});
  const languageResolution=resolveLanguageRequirements(requirements.languages??[]);
  if (!intent.pass) return {stage:'typography',pass:false,strategy,intent,findings:intent.findings,candidates:{},systems:[],alternatives:[],artDirection:null,selection:null,application:null,production:null};
  if (languageResolution.some((i)=>!i.resolved)) return {stage:'typography',pass:false,strategy,intent,findings:[{severity:'blocker',code:'typography-language-requirement-unresolved',languages:languageResolution.filter((i)=>!i.resolved)}],candidates:{},systems:[],alternatives:[],artDirection:null,selection:null,application:null,production:null};
  if (!catalog.length) return {stage:'typography',pass:false,strategy,intent,findings:[{severity:'blocker',code:'typography-catalog-empty'}],candidates:{},systems:[],alternatives:[],artDirection:null,selection:null,application:null,production:null};

  const workingCatalog=fontEvidence.length?enrichFontCatalog(catalog,fontEvidence):catalog;
  const context={business,brand,requirements,marketCommonFamilies,avoidFamilies,strategy};
  const display=rankRole(workingCatalog,'display',context,candidateCount), body=rankRole(workingCatalog,'body',context,candidateCount);
  const distinctUtility=wantsDistinctUtility(intent,pairing);
  const utility=rankRole(workingCatalog,'utility',context,Math.min(candidateCount,5));
  const systems=[];
  for (const displayCandidate of display) for (const bodyCandidate of body) {
    if (displayCandidate.font.family===bodyCandidate.font.family&&pairingStrategy!=='single-family') continue;
    const pair=scorePairing(displayCandidate.font,bodyCandidate.font,{strategy:pairingStrategy,requirements});
    if (pair.score<minPairingScore) continue;
    const utilityCandidate=resolveUtilityCandidate({utility,bodyCandidate,pairingStrategy,context,distinctUtility});
    const overall=Math.round(displayCandidate.scores.total*.26+bodyCandidate.scores.total*.34+pair.score*.30+(utilityCandidate?.scores.total??75)*.10);
    systems.push({overall,display:displayCandidate,body:bodyCandidate,utility:utilityCandidate,pairing:pair});
  }
  const ranked=rankTypographySystems(systems,{strategy,marketCommonPairs,pairingStrategy});
  const acceptable=ranked.filter((e)=>e.critique.score>=minSystemScore&&e.critique.pass);
  const topReviewed=ranked.slice(0,systemCount).map((e)=>({...e.system,systemCritique:e.critique}));
  const alternatives=buildTypographyAlternatives(ranked,{limit:systemCount});
  if (!ranked.length) return {stage:'typography',pass:false,strategy,intent,findings:[{severity:'blocker',code:'typography-no-valid-pairing',minPairingScore}],candidates:{display,body,utility},systems:[],alternatives:[],artDirection:null,selection:null,application:null,production:null};
  if (!acceptable.length) return {stage:'typography',pass:false,strategy,intent,findings:[{severity:'blocker',code:'typography-no-acceptable-system',minSystemScore,bestScore:ranked[0].critique.score,bestFindings:ranked[0].critique.findings}],candidates:{display,body,utility},systems:topReviewed,alternatives,artDirection:null,selection:null,application:null,production:null};

  const reviewSystems=acceptable.slice(0,Math.max(systemCount,5)).map((e)=>({...e.system,systemCritique:e.critique}));
  const artDirection=resolveTypographyArtDirection({systems:reviewSystems,intent,review:typographyArtDirection,required:application.requireArtDirectionReview===true});
  if (!artDirection.pass) return {stage:'typography',pass:false,strategy,intent,findings:artDirection.findings,candidates:{display,body,utility},systems:reviewSystems,alternatives:buildTypographyAlternatives(acceptable,{limit:systemCount}),artDirection,selection:null,application:null,production:null};

  const winner=artDirection.selected;
  const resolved={display:selection(winner.display.font,'display'),body:selection(winner.body.font,'body'),utility:winner.utility?selection(winner.utility.font,'utility'):null};
  const applicationPlan=buildTypographyApplication({selection:resolved,strategy,requirements,viewport:application.viewport??{},intent});
  if (!applicationPlan.pass) return {stage:'typography',pass:false,strategy,intent,findings:[{severity:'blocker',code:'typography-application-not-ready',details:applicationPlan.findings}],candidates:{display,body,utility},systems:reviewSystems,alternatives:buildTypographyAlternatives(acceptable,{limit:systemCount}),artDirection,selection:resolved,application:applicationPlan,production:null};
  const selectedCritique=winner.systemCritique??acceptable.find((e)=>e.system.display.font.family===winner.display.font.family&&e.system.body.font.family===winner.body.font.family)?.critique??acceptable[0].critique;
  const output={stage:'typography',pass:true,findings:[],strategy,intent,intelligence:{evidenceFamilies:fontEvidence.length,winnerEvidenceLevel:winner.pairing.evidenceLevel,winnerStructuralConfidence:winner.pairing.structural?.confidence??0},context:{business,brand,requirements,creativeThesisRef:creativeThesis?.projectId??null,creativeWorldRef:creativeWorld?.id??creativeWorld?.worldId??null,pairing:{...pairing,strategy:pairingStrategy,minScore:minPairingScore,minSystemScore},limits:{candidateLimit:candidateCount,systemLimit:systemCount},marketCommonPairs,application,utilityMode:distinctUtility?'distinct':'reuse-body'},candidates:{display,body,utility},systems:reviewSystems.slice(0,systemCount),alternatives:buildTypographyAlternatives(acceptable,{limit:systemCount}),rejectedAlternatives:alternatives.filter((i)=>i.findings.length>0),systemCritique:selectedCritique,artDirection,selection:resolved,application:applicationPlan};
  output.production=buildTypographyProductionConfig(output); return output;
}

export function validateTypographyBenchmark(output,expected={}) {
  const failures=[];
  if(expected.pass!==undefined&&output.pass!==expected.pass)failures.push(`expected pass=${expected.pass}, got ${output.pass}`);
  if(expected.displayFamily&&output.selection?.display?.family!==expected.displayFamily)failures.push(`expected display ${expected.displayFamily}, got ${output.selection?.display?.family??'none'}`);
  if(expected.bodyFamily&&output.selection?.body?.family!==expected.bodyFamily)failures.push(`expected body ${expected.bodyFamily}, got ${output.selection?.body?.family??'none'}`);
  if(expected.utilityFamily&&output.selection?.utility?.family!==expected.utilityFamily)failures.push(`expected utility ${expected.utilityFamily}, got ${output.selection?.utility?.family??'none'}`);
  if(expected.minPairingScore!==undefined&&(output.systems?.[0]?.pairing?.score??0)<expected.minPairingScore)failures.push(`pairing score below ${expected.minPairingScore}`);
  if(expected.minSystemScore!==undefined&&(output.systemCritique?.score??0)<expected.minSystemScore)failures.push(`system score below ${expected.minSystemScore}`);
  if(expected.minBodySize!==undefined&&(output.application?.styles?.body?.sizePx??0)<expected.minBodySize)failures.push(`body size below ${expected.minBodySize}`);
  if(expected.maxMeasure!==undefined&&(output.application?.measure?.max??Infinity)>expected.maxMeasure)failures.push(`body measure exceeds ${expected.maxMeasure}ch`);
  if(expected.evidenceLevel&&output.systems?.[0]?.pairing?.evidenceLevel!==expected.evidenceLevel)failures.push(`expected evidence level ${expected.evidenceLevel}, got ${output.systems?.[0]?.pairing?.evidenceLevel??'none'}`);
  if(expected.intentAuthority&&output.intent?.authority!==expected.intentAuthority)failures.push(`expected intent authority ${expected.intentAuthority}, got ${output.intent?.authority??'none'}`);
  for(const family of expected.excludedFamilies??[]){const selected=[output.selection?.display?.family,output.selection?.body?.family,output.selection?.utility?.family].filter(Boolean);if(selected.includes(family))failures.push(`excluded family selected: ${family}`);}
  for(const pressure of expected.minPressures??[]){if((output.strategy?.pressures?.[pressure.key]??0)<pressure.value)failures.push(`${pressure.key} pressure below ${pressure.value}`);}
  return {pass:failures.length===0,failures};
}
