import fs from 'node:fs';

import { buildInspirationPacket } from '../../../modules/inspiration/runtime.mjs';
import { buildCreativeThesis } from '../../../modules/creative-thesis/runtime.mjs';
import { buildCreativeWorldExploration, selectCreativeWorld } from '../../../modules/creative-world/runtime.mjs';
import { buildTypographySystem } from '../../../modules/typography/runtime.mjs';

const benchmark = JSON.parse(fs.readFileSync(new URL('../../../benchmarks/001-du-bonheur/input.json', import.meta.url)));
const experienceLock = JSON.parse(fs.readFileSync(new URL('./EXPERIENCE_THESIS_LOCK.json', import.meta.url)));
const artDirections = JSON.parse(fs.readFileSync(new URL('../counter-ritual-v2/art-directions.json', import.meta.url)));
const typographyIntent = JSON.parse(fs.readFileSync(new URL('./the-conversation-typography-intent.json', import.meta.url)));
const candidateCatalog = JSON.parse(fs.readFileSync(new URL('./typography-candidate-catalog.json', import.meta.url)));
const artDirectionSpec = JSON.parse(fs.readFileSync(new URL('./conversation-art-direction-spec.json', import.meta.url)));

const BASE_AVOID_FAMILIES = ['Poppins', 'Montserrat', 'Roboto', 'Open Sans'];
const TARGET_VISUAL_SYSTEMS = 5;

function canonicalCounterRitualSelection() {
  const inspiration = buildInspirationPacket(benchmark.inspiration);
  const creativeThesis = buildCreativeThesis({
    projectId: benchmark.id,
    intent: benchmark.intent,
    businessTruths: benchmark.businessTruths,
    inspiration,
    traits: benchmark.creativeTraits,
    antiPrinciples: benchmark.antiPrinciples,
    audience: benchmark.audience,
    commercialObjective: benchmark.commercialObjective,
    authoredCandidate: benchmark.creativeThesisCandidate
  });
  const exploration = buildCreativeWorldExploration({
    creativeThesis,
    authoredWorlds: benchmark.creativeWorldCandidates
  });
  const selected = selectCreativeWorld(exploration, {
    worldId: experienceLock.worldId,
    humanConfirmed: experienceLock.truth.humanExperienceThesisSelectionConfirmed === true,
    rationale: experienceLock.selectionRationale
  });
  return { creativeThesis, exploration, selected, selectedWorld:selected.selectedWorld };
}

function findLeadDirection() {
  return artDirections.directions.find((direction) => direction.id === artDirectionSpec.leadHypothesis) ?? null;
}

function summarizeSystem(system, index) {
  return {
    rank: index + 1,
    systemId: system.systemId,
    display: system.display?.font?.family ?? null,
    body: system.body?.font?.family ?? null,
    utility: system.utility?.font?.family ?? null,
    systemScore: system.systemCritique?.score ?? null,
    pairingScore: system.pairing?.score ?? null,
    pairingEvidenceLevel: system.pairing?.evidenceLevel ?? null,
    findings: system.systemCritique?.findings ?? []
  };
}

function buildTypographyRun(canonical, extraAvoidFamilies = []) {
  return buildTypographySystem({
    catalog: candidateCatalog.fonts,
    fontEvidence: [],
    business: {
      type: 'French patisserie',
      industry: 'hospitality food retail',
      model: 'local-retail',
      positioning: 'premium but accessible',
      audience: 'Berlin visitors and local customers choosing pastry, a visit, or a practical next action'
    },
    brand: {
      traits: ['human', 'precise', 'warm', 'contemporary', 'service-led', 'Berlin-aware']
    },
    requirements: {
      languages: ['de', 'fr', 'en'],
      interfaceDense: false
    },
    creativeThesis: canonical.creativeThesis,
    creativeWorld: canonical.selectedWorld,
    typographyIntent,
    pairing: {
      strategy: 'restrained-system',
      minScore: 70,
      minSystemScore: 66
    },
    application: {
      requireArtDirectionReview: true,
      viewport: { min:390, max:1440 }
    },
    marketCommonFamilies: ['Inter', 'Poppins', 'Montserrat', 'Roboto', 'Open Sans'],
    marketCommonPairs: [],
    avoidFamilies: [...new Set([...BASE_AVOID_FAMILIES, ...extraAvoidFamilies])],
    candidateLimit: 12,
    systemLimit: 5
  });
}

function isPendingHumanTypographyReview(run) {
  return run?.pass === false
    && run?.findings?.some((item) => item.code === 'typography-art-direction-review-required');
}

function buildDiverseVisualShortlist(canonical) {
  const systems = [];
  const runs = [];
  const usedDisplayFamilies = [];

  for (let attempt = 0; attempt < TARGET_VISUAL_SYSTEMS; attempt += 1) {
    const run = buildTypographyRun(canonical, usedDisplayFamilies);
    runs.push(run);
    if (!isPendingHumanTypographyReview(run)) break;

    const candidates = run.artDirection?.systems ?? run.systems ?? [];
    const candidate = candidates.find((system) => {
      const family = system.display?.font?.family;
      return family && !usedDisplayFamilies.includes(family);
    });
    if (!candidate) break;

    systems.push(candidate);
    usedDisplayFamilies.push(candidate.display.font.family);
  }

  return { systems, runs, usedDisplayFamilies };
}

export function buildConversationTypographyExploration() {
  const canonical = canonicalCounterRitualSelection();
  const leadDirection = findLeadDirection();
  const findings = [];

  if (!canonical.selectedWorld) findings.push({ severity:'blocker', code:'conversation-counter-ritual-selection-missing' });
  if (canonical.selectedWorld?.id !== experienceLock.worldId) findings.push({ severity:'blocker', code:'conversation-counter-ritual-selection-drift' });
  if (!leadDirection) findings.push({ severity:'blocker', code:'conversation-lead-art-direction-missing' });
  if (artDirectionSpec.truth?.humanArtDirectionSelectionConfirmed === true) findings.push({ severity:'blocker', code:'conversation-art-direction-selection-fabricated' });

  const diverse = buildDiverseVisualShortlist(canonical);
  const typography = diverse.runs[0] ?? buildTypographyRun(canonical);

  if (!isPendingHumanTypographyReview(typography)) {
    findings.push({
      severity:'blocker',
      code:'conversation-typography-did-not-stop-at-art-direction-gate',
      typographyPass:typography.pass,
      typographyFindings:typography.findings ?? []
    });
  }

  if (typography.intent?.authority !== 'typography-art-direction') {
    findings.push({ severity:'blocker', code:'conversation-typography-authority-wrong', authority:typography.intent?.authority ?? null });
  }
  if (typography.intent?.provenance?.creativeWorldAuthoritative !== true) {
    findings.push({ severity:'blocker', code:'conversation-selected-world-not-typography-authoritative' });
  }
  if (!typography.intent?.provenance?.layers?.includes('selected-creative-world') || !typography.intent?.provenance?.layers?.includes('typography-art-direction')) {
    findings.push({ severity:'blocker', code:'conversation-typography-authority-layers-incomplete', layers:typography.intent?.provenance?.layers ?? [] });
  }

  const systems = diverse.systems;
  if (systems.length < 3) findings.push({ severity:'blocker', code:'conversation-typography-candidate-count-too-low', count:systems.length });
  if (new Set(systems.map((system) => system.display?.font?.family)).size !== systems.length) {
    findings.push({ severity:'blocker', code:'conversation-typography-display-shortlist-not-diverse' });
  }
  for (const run of diverse.runs) {
    if (!isPendingHumanTypographyReview(run)) {
      findings.push({ severity:'blocker', code:'conversation-diversity-run-bypassed-art-direction-gate' });
      break;
    }
  }
  for (const system of systems) {
    if (system.utility?.font?.family !== system.body?.font?.family) {
      findings.push({ severity:'major', code:'conversation-utility-family-sprawl', systemId:system.systemId ?? null });
    }
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  return {
    schema:'ai-studio-os/conversation-typography-exploration@1',
    stage:'counter-ritual-conversation-typography',
    status:blockers.length ? 'blocked' : 'typography-candidates-awaiting-visual-review',
    pass:blockers.length === 0,
    experienceLock:structuredClone(experienceLock),
    creativeThesis:canonical.creativeThesis,
    selectedCreativeWorld:canonical.selectedWorld,
    leadArtDirection:leadDirection,
    artDirectionSpec:structuredClone(artDirectionSpec),
    typographyIntent:typography.intent,
    typographyRuntime:typography,
    typographyRuns:diverse.runs.map((run, index) => ({
      attempt:index + 1,
      excludedDisplayFamilies:diverse.usedDisplayFamilies.slice(0, index),
      status:run.pass ? 'unexpected-canonical-pass' : run.findings?.[0]?.code ?? 'unknown',
      topDisplay:run.artDirection?.systems?.[0]?.display?.font?.family ?? null,
      topBody:run.artDirection?.systems?.[0]?.body?.font?.family ?? null
    })),
    shortlistPolicy:{
      mode:'ranked-quality-plus-display-voice-diversity',
      rationale:'A typography art-direction review needs materially different display voices. Five score-adjacent body pairings under one display family are not meaningful visual exploration.',
      targetCount:TARGET_VISUAL_SYSTEMS,
      automaticWinner:false
    },
    systems,
    systemSummaries:systems.map(summarizeSystem),
    sourceEvidence:{
      typographyInfrastructure:'composed-from-pr-37-head-e70413639f3ef1283949038c03e40dfb1c1b4b28',
      catalogSource:'project-curated-google-fonts-metadata; browser delivery proof required',
      structuralEvidence:'not-claimed-in-ci-fixture',
      liveCatalogCacheUsed:false
    },
    findings,
    truth:{
      counterRitualExperienceThesisSelected:true,
      theConversationLeadHypothesis:true,
      humanArtDirectionSelectionConfirmed:false,
      typographyCandidateGenerationComplete:systems.length >= 3,
      displayVoiceDiversityRequired:true,
      typographyArtDirectionReviewRequired:true,
      typographySystemSelected:false,
      typographyApproved:false,
      canonicalTypographyConsumptionProduced:false,
      productionReady:false
    }
  };
}

export { canonicalCounterRitualSelection };
