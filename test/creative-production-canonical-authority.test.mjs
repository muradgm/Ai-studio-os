import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { runCreativeProductionRuntime } from '../lib/creative-production-runtime.mjs';
import {
  authoredCandidateFromDeliberation,
  buildCreativeThesisDeliberation
} from '../modules/creative-thesis/intelligence.mjs';
import { buildCreativeThesis } from '../modules/creative-thesis/runtime.mjs';
import { buildCreativeThesisHumanDecision } from '../modules/creative-thesis/authority.mjs';
import { buildCreativeWorldExploration, selectCreativeWorld } from '../modules/creative-world/runtime.mjs';
import { buildCreativeWorldHumanDecision } from '../modules/creative-world/authority.mjs';
import { buildStyleFrameProof, buildVisualProofEvidence } from '../modules/style-frame/runtime.mjs';

const baseInput = JSON.parse(fs.readFileSync(new URL('../benchmarks/005-du-bonheur-creative-production/input.json', import.meta.url)));

function buildDeliberation() {
  return buildCreativeThesisDeliberation({
    projectId: baseInput.id,
    businessTruths: ['French pastry craft', 'Physical counter service ritual', 'Contemporary Berlin context'],
    opportunityGaps: ['Make the service ritual distinctive without nostalgic French luxury codes'],
    contradictions: ['service efficiency × ceremony', 'sensory abundance × restraint', 'French craft × contemporary Berlin'],
    hypotheses: [
      {
        id: 'counter-ritual-thesis',
        statement: 'Service ritual becomes the organizing experience, not decorative patisserie nostalgia.',
        tension: 'service efficiency × ceremony',
        truthRefs: ['Physical counter service ritual'],
        opportunityRefs: ['Make the service ritual distinctive without nostalgic French luxury codes'],
        crossDomainConnections: ['service × choreography'],
        experientialConsequences: ['Navigation and reveal sequences follow service thresholds.'],
        commercialConsequences: ['Ordering clarity remains part of the experience architecture.'],
        antiGenericClaims: ['Reject nostalgic Parisian luxury staging.'],
        critique: ['Strong project specificity; risk of over-theatricalizing utility.']
      },
      {
        id: 'material-craft',
        statement: 'Make pastry material transformation the evidence of craft.',
        tension: 'precision × impermanence',
        truthRefs: ['French pastry craft'],
        opportunityRefs: ['Make the service ritual distinctive without nostalgic French luxury codes'],
        crossDomainConnections: ['patisserie × material architecture'],
        experientialConsequences: ['Product detail and layer transitions become structural evidence.'],
        commercialConsequences: ['Product quality carries premium perception.'],
        antiGenericClaims: ['Reject generic lifestyle cafe imagery.'],
        critique: ['Strong image potential but weaker service differentiation.']
      },
      {
        id: 'controlled-indulgence',
        statement: 'Use restraint to intensify moments of sensory indulgence.',
        tension: 'sensory abundance × Berlin restraint',
        truthRefs: ['Contemporary Berlin context'],
        opportunityRefs: ['Make the service ritual distinctive without nostalgic French luxury codes'],
        crossDomainConnections: ['editorial restraint × sensory contrast'],
        experientialConsequences: ['Pacing and negative space amplify product reveals.'],
        commercialConsequences: ['Premium character comes from product focus rather than decorative luxury.'],
        antiGenericClaims: ['Reject gold-and-serif luxury shorthand.'],
        critique: ['Could transfer to competitors unless anchored to service truth.']
      }
    ],
    selection: {
      hypothesisId: 'counter-ritual-thesis',
      rationale: 'It converts the most project-specific operational truth into a complete experience structure.',
      competitorTransferJudgment: 'A competitor without the same counter ritual could not reuse it unchanged without losing meaning.',
      strategicRelevanceJudgment: 'It differentiates through a real service behavior while preserving ordering utility.',
      experientialPotentialJudgment: 'It can govern composition, navigation, typography pacing, motion, interaction and responsive sequencing.'
    }
  });
}

function authoredWorlds() {
  return [
    {
      id: 'counter-ritual',
      label: 'Counter Ritual',
      worldIdea: 'Counter service becomes a contemporary editorial ritual.',
      interpretationOfThesis: 'The service sequence carries the brand character without nostalgic patisserie tropes.',
      signatureBehavior: 'The interface advances through measured counter-like thresholds.',
      worldClass: 'counter-ritual',
      narrativeModel: 'service-sequence',
      compositionModel: 'asymmetric-counter-grid',
      typographyIntent: { statement: 'Editorial craft with restrained contemporary utility.' },
      imageLanguage: 'close product and material studies with generous negative space',
      materialLanguage: 'paper, pastry texture, glass and restrained metal',
      motionLanguage: 'measured threshold transitions with object continuity',
      interactionModel: 'direct contextual reveals tied to service actions',
      responsiveStrategy: 'preserve ritual sequence while recomposing hierarchy per viewport',
      categoryTransferTest: {
        whyProjectSpecific: 'The world is structured around Du Bonheur’s physical counter-service ritual and pastry evidence rather than generic hospitality styling.',
        transferRisk: 'Without those service and product truths it becomes a generic editorial café experience.'
      },
      antiPatterns: ['Parisian nostalgia', 'generic luxury card grid']
    },
    {
      id: 'pastry-laboratory',
      label: 'Pastry Laboratory',
      worldIdea: 'Craft is exposed as a precise material experiment.',
      interpretationOfThesis: 'Pastry transformation becomes visible evidence of the governing product truth.',
      signatureBehavior: 'Ingredients and layers resolve into measured material states.',
      worldClass: 'material-laboratory',
      narrativeModel: 'transformation-sequence',
      compositionModel: 'specimen-workbench-grid',
      typographyIntent: { statement: 'Precise contemporary sans with technical annotation behavior.' },
      imageLanguage: 'macro ingredient studies, process cuts and measured product details',
      materialLanguage: 'steel, flour, glass, parchment and translucent measurement layers',
      motionLanguage: 'controlled assembly and transformation with exact state changes',
      interactionModel: 'inspect ingredients, layers and process evidence through direct comparison',
      responsiveStrategy: 'compress the laboratory into a prioritized process sequence on mobile',
      categoryTransferTest: {
        whyProjectSpecific: 'The experience depends on Du Bonheur’s actual pastry materials and craft process.',
        transferRisk: 'Without those process truths it becomes generic food-science styling.'
      },
      antiPatterns: ['fake scientific decoration', 'generic artisan lifestyle photography']
    },
    {
      id: 'daily-ceremony',
      label: 'Daily Ceremony',
      worldIdea: 'The ordinary pastry purchase becomes a restrained daily ceremony.',
      interpretationOfThesis: 'Service behavior organizes a human rhythm around choosing, receiving and enjoying the product.',
      signatureBehavior: 'Quiet pauses and decisive actions alternate through a repeatable ritual.',
      worldClass: 'daily-ceremony',
      narrativeModel: 'ritual-cycle',
      compositionModel: 'spacious-temporal-sequence',
      typographyIntent: { statement: 'Warm humanist hierarchy with editorial pacing and high utility.' },
      imageLanguage: 'human-scale service moments balanced with intimate product details',
      materialLanguage: 'daylight, ceramic, paper, wood and soft tactile surfaces',
      motionLanguage: 'gentle temporal pacing with deliberate pauses and concise transitions',
      interactionModel: 'simple ritual steps with clear action and calm feedback',
      responsiveStrategy: 'preserve the ritual cadence as a linear but deliberately paced mobile sequence',
      categoryTransferTest: {
        whyProjectSpecific: 'The cadence maps to Du Bonheur’s actual ordering and counter-service behavior.',
        transferRisk: 'Without that service reality it becomes generic slow-lifestyle branding.'
      },
      antiPatterns: ['generic cozy café mood', 'decorative slow-motion without service meaning']
    }
  ];
}

function proofMoments() {
  return [
    { id: 'opening', label: 'Opening', viewport: 'desktop', width: 1440, height: 900, purpose: 'Prove first-contact hierarchy.', productState: 'first contact' },
    { id: 'core', label: 'Core', viewport: 'desktop', width: 1440, height: 900, purpose: 'Prove counter-service behavior.', productState: 'choosing pastry' },
    { id: 'decision', label: 'Decision', viewport: 'desktop', width: 1440, height: 900, purpose: 'Prove ordering decision clarity.', productState: 'order decision' },
    { id: 'mobile', label: 'Mobile', viewport: 'mobile', width: 390, height: 844, purpose: 'Prove mobile reinterpretation.', productState: 'mobile ordering' }
  ];
}

function canonicalInput(overrides = {}) {
  const legacy = runCreativeProductionRuntime(baseInput);
  const deliberation = buildDeliberation();
  const authored = authoredCandidateFromDeliberation(deliberation);
  const builtThesis = buildCreativeThesis({
    projectId: baseInput.id,
    intent: 'Create a contemporary Du Bonheur digital experience rooted in real pastry craft and counter service.',
    businessTruths: deliberation.sourceTruths,
    inspiration: { opportunityGaps: deliberation.sourceOpportunities },
    antiPrinciples: ['nostalgic Parisian luxury staging', 'generic premium cafe storytelling'],
    audience: 'Customers choosing and ordering pastries in Berlin',
    commercialObjective: 'Increase product understanding and ordering confidence',
    authoredCandidate: authored
  });
  const thesis = { ...builtThesis, id: 'du-bonheur-thesis' };
  const humanDecision = buildCreativeThesisHumanDecision({ deliberation, thesis, decision: 'approve-recommendation', sourceCandidateId: deliberation.selection.hypothesisId, rationale: 'The human approves the reviewed Thesis recommendation.', humanConfirmed: true, decidedAt: '2026-08-31T10:55:36.158Z', evidenceRef: 'fixture://du-bonheur-thesis-decision' });
  const thesisStatement = thesis.governingIdea.statement;

  const preSelectionExploration = buildCreativeWorldExploration({
    creativeThesis: thesis,
    authoredWorlds: authoredWorlds()
  });
  assert.equal(preSelectionExploration.reviewReady, true);
  const styleFrameProof = buildStyleFrameProof({ exploration: preSelectionExploration, moments: proofMoments() });
  assert.equal(styleFrameProof.reviewReady, true);
  const visualProofEvidence = buildVisualProofEvidence({
    plan: styleFrameProof,
    renderedFrames: styleFrameProof.frames.map((frame) => ({
      frameId: frame.id,
      worldId: frame.worldId,
      imageRef: `image:${frame.id}`,
      sourceRef: `source:${frame.id}`
    })),
    comparisonRefs: ['comparison:du-bonheur-worlds']
  });
  assert.equal(visualProofEvidence.reviewReady, true);
  const selectedEvidenceRefs = visualProofEvidence.worlds.find((item) => item.worldId === 'counter-ritual').evidenceRefs;
  const creativeWorldHumanDecision = buildCreativeWorldHumanDecision({ exploration: preSelectionExploration, visualProofEvidence, selectedWorldId: 'counter-ritual', reviewedWorldEvidenceRefs: selectedEvidenceRefs, reviewedComparisonRefs: visualProofEvidence.comparisonRefs, rationale: 'Counter Ritual turns the strongest project-specific service truth into the clearest durable experience structure.', humanConfirmed: true, decidedAt: '2026-08-31T10:56:00Z', evidenceRef: 'fixture://du-bonheur-world-decision' });
  const exploration = selectCreativeWorld(preSelectionExploration, { humanDecision: creativeWorldHumanDecision, visualProofEvidence });
  const world = exploration.selectedWorld;

  return {
    ...structuredClone(baseInput),
    canonicalCreativeAuthority: true,
    creativeThesisDeliberation: deliberation,
    creativeThesis: thesis,
    creativeThesisHumanDecision: humanDecision,
    creativeWorldHumanDecision,
    selectedCreativeWorld: world,
    creativeWorldExploration: exploration,
    styleFrameProof,
    visualProofEvidence,
    creativeDirection: {
      ...legacy.creativeDirection,
      directionStatement: 'Canonical Counter Ritual direction',
      provisional: false,
      worldContext: { id: world.id },
      thesisContext: { statement: thesisStatement },
      findings: []
    },
    ...overrides
  };
}

test('canonical Creative World is the sole world-level production authority', () => {
  const output = runCreativeProductionRuntime(canonicalInput());
  assert.equal(output.status, 'production-plan-ready');
  assert.equal(output.canonicalHandoff?.pass, true);
  assert.equal(output.canonicalHandoff?.truth.creativeThesisAuthorityValid, true);
  assert.equal(output.canonicalHandoff?.truth.creativeThesisHumanApproved, true);
  assert.equal(output.canonicalHandoff?.truth.creativeWorldExplorationRevalidated, true);
  assert.equal(output.canonicalHandoff?.truth.renderedVisualProofEvidenceValid, true);
  assert.equal(output.canonicalHandoff?.truth.creativeSelectionProvenanceValid, true);
  assert.equal(output.canonicalHandoff?.truth.creativeWorldProductionContractComplete, true);
  assert.equal(output.canonicalHandoff?.truth.creativeWorldStructuralReviewReady, true);
  assert.equal(output.selectionAuthority, 'canonical-creative-world');
  assert.equal(output.exploration, undefined);
  assert.equal(output.selection, undefined);
  assert.equal(output.legacyCalibration, undefined);
  assert.ok(output.stages.includes('canonical-creative-authority'));
  assert.ok(!output.stages.includes('explore'));
  assert.ok(!output.stages.includes('concept-selection'));
  assert.equal(output.creativeDirection.directionStatement, 'Canonical Counter Ritual direction');
  assert.equal(output.creativeDirection.calibration.selectedConceptId, null);
  assert.equal(output.creativeDirection.calibration.legacyConceptSelectionAuthority, 'retired');
  for (const entry of output.registry.entries ?? []) assert.equal(entry.directionRef, 'Canonical Counter Ritual direction');
});

test('a top-level Creative Thesis alone remains legacy context and does not activate canonical mode', () => {
  const canonical = canonicalInput();
  const output = runCreativeProductionRuntime({
    ...structuredClone(baseInput),
    creativeThesis: canonical.creativeThesis
  });
  assert.equal(output.status, 'production-plan-ready');
  assert.equal(output.selectionAuthority, 'legacy-concept-selection');
  assert.equal(output.canonicalHandoff, undefined);
  assert.ok(output.exploration);
  assert.ok(output.selection);
});

test('explicit canonical mode fails closed when thesis deliberation provenance is absent', () => {
  const input = canonicalInput();
  delete input.creativeThesisDeliberation;
  const output = runCreativeProductionRuntime(input);
  assert.equal(output.status, 'blocked');
  assert.equal(output.gateway, undefined);
  assert.ok(output.canonicalHandoff.findings.some((item) => item.code === 'canonical-thesis-authority-invalid'));
});

test('canonical production fails closed when rendered visual proof evidence is absent', () => {
  const input = canonicalInput();
  delete input.visualProofEvidence;
  const output = runCreativeProductionRuntime(input);
  assert.equal(output.status, 'blocked');
  assert.equal(output.gateway, undefined);
  assert.ok(output.canonicalHandoff.findings.some((item) => item.code === 'canonical-rendered-visual-proof-invalid'));
});

test('canonical production fails closed before tool routing when selected world loses human authority', () => {
  const input = canonicalInput();
  input.selectedCreativeWorld.truth.humanCreativeSelectionConfirmed = false;
  const output = runCreativeProductionRuntime(input);
  assert.equal(output.status, 'blocked');
  assert.equal(output.canonicalHandoff?.pass, false);
  assert.equal(output.selectionAuthority, 'canonical-creative-world');
  assert.equal(output.exploration, undefined);
  assert.equal(output.selection, undefined);
  assert.equal(output.gateway, undefined);
  assert.ok(output.canonicalHandoff.findings.some((item) => item.code === 'canonical-world-not-authoritative'));
});

test('canonical production fails closed when selected world is incomplete even if selected by a human', () => {
  const input = canonicalInput();
  input.selectedCreativeWorld.interactionModel = '';
  const output = runCreativeProductionRuntime(input);
  assert.equal(output.status, 'blocked');
  assert.equal(output.exploration, undefined);
  assert.equal(output.selection, undefined);
  assert.equal(output.gateway, undefined);
  assert.ok(output.canonicalHandoff.findings.some((item) => item.code === 'canonical-world-production-contract-incomplete'));
});

test('legacy creative-production path remains authoritative when canonical inputs are absent', () => {
  const output = runCreativeProductionRuntime(baseInput);
  assert.equal(output.status, 'production-plan-ready');
  assert.equal(output.selectionAuthority, 'legacy-concept-selection');
  assert.equal(output.canonicalHandoff, undefined);
  assert.ok(output.exploration);
  assert.ok(output.selection);
  assert.ok(output.stages.includes('concept-selection'));
});
