import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCanonicalCreativeProductionHandoff,
  validateCanonicalCreativeProductionHandoff
} from '../modules/canonical-creative-pipeline/runtime.mjs';
import {
  authoredCandidateFromDeliberation,
  buildCreativeThesisDeliberation
} from '../modules/creative-thesis/intelligence.mjs';
import { buildCreativeThesis } from '../modules/creative-thesis/runtime.mjs';
import { buildCreativeThesisHumanDecision } from '../modules/creative-thesis/authority.mjs';
import { buildCreativeWorldExploration, selectCreativeWorld } from '../modules/creative-world/runtime.mjs';
import { buildStyleFrameProof, buildVisualProofEvidence } from '../modules/style-frame/runtime.mjs';

function buildDeliberation() {
  return buildCreativeThesisDeliberation({
    projectId: 'project-1',
    businessTruths: ['Product truth organizes the experience', 'Service behavior is project-specific'],
    opportunityGaps: ['Turn product truth into the experience structure'],
    contradictions: ['clarity × character', 'utility × ceremony'],
    hypotheses: [
      {
        id: 'truth-architecture',
        statement: 'Make the product truth the organizing experience idea.',
        tension: 'clarity × character',
        truthRefs: ['Product truth organizes the experience'],
        opportunityRefs: ['Turn product truth into the experience structure'],
        crossDomainConnections: ['product truth × editorial architecture'],
        experientialConsequences: ['Hierarchy and sequence follow product truth.'],
        commercialConsequences: ['Conversion evidence stays central to the experience.'],
        antiGenericClaims: ['Reject generic premium styling.'],
        critique: ['Must remain specific enough that competitors cannot reuse it unchanged.']
      },
      {
        id: 'service-ritual',
        statement: 'Make service thresholds the rhythm of the experience.',
        tension: 'utility × ceremony',
        truthRefs: ['Service behavior is project-specific'],
        opportunityRefs: ['Turn product truth into the experience structure'],
        crossDomainConnections: ['service × choreography'],
        experientialConsequences: ['Interaction follows meaningful service thresholds.'],
        commercialConsequences: ['Task completion remains part of the concept.'],
        antiGenericClaims: ['Reject decorative storytelling detached from use.'],
        critique: ['Could over-theatricalize ordinary actions.']
      },
      {
        id: 'evidence-rhythm',
        statement: 'Let evidence accumulate through controlled editorial pacing.',
        tension: 'proof × anticipation',
        truthRefs: ['Product truth organizes the experience'],
        opportunityRefs: ['Turn product truth into the experience structure'],
        crossDomainConnections: ['evidence × editorial sequencing'],
        experientialConsequences: ['Proof arrives in deliberate stages.'],
        commercialConsequences: ['Claims remain supported by visible evidence.'],
        antiGenericClaims: ['Reject empty atmospheric sections.'],
        critique: ['Could become overly editorial without enough interaction.']
      }
    ],
    selection: {
      hypothesisId: 'truth-architecture',
      rationale: 'It most directly converts the project-specific product truth into a durable experience structure.',
      competitorTransferJudgment: 'A competitor with different product truth cannot reuse it unchanged without losing meaning.',
      strategicRelevanceJudgment: 'It keeps differentiation tied to actual product evidence.',
      experientialPotentialJudgment: 'It can govern hierarchy, composition, motion, interaction, image sequencing and responsive behavior.'
    }
  });
}

function authoredWorlds() {
  return [
    {
      id: 'world-a',
      label: 'Editorial Service Ritual',
      worldIdea: 'A precise editorial service ritual.',
      interpretationOfThesis: 'Product truth becomes a sequence of deliberate editorial moments.',
      signatureBehavior: 'Content resolves through a measured threshold rhythm.',
      worldClass: 'editorial-service-ritual',
      narrativeModel: 'progressive-reveal',
      compositionModel: 'asymmetric-editorial-grid',
      typographyIntent: { statement: 'Editorial authority with highly functional reading behavior.' },
      imageLanguage: 'close material studies with disciplined negative space',
      materialLanguage: 'paper, glass and restrained metallic detail',
      motionLanguage: 'measured threshold transitions with controlled persistence',
      interactionModel: 'direct manipulation with quiet contextual feedback',
      responsiveStrategy: 'recompose hierarchy rather than merely stack desktop sections',
      categoryTransferTest: {
        whyProjectSpecific: 'The world is organized around this project’s product-truth and service evidence rather than category styling.',
        transferRisk: 'Without those truths it collapses into generic editorial premium behavior.'
      },
      antiPatterns: ['generic luxury serif staging', 'card-grid SaaS composition']
    },
    {
      id: 'world-b',
      label: 'Evidence Workshop',
      worldIdea: 'A working evidence surface where proof accumulates through use.',
      interpretationOfThesis: 'Product truth is exposed as observable evidence rather than a polished claim.',
      signatureBehavior: 'Evidence layers lock into place as users inspect and compare.',
      worldClass: 'evidence-workshop',
      narrativeModel: 'forensic-assembly',
      compositionModel: 'modular-workbench-field',
      typographyIntent: { statement: 'Utility-first grotesk rhythm with dense evidence annotations.' },
      imageLanguage: 'annotated process fragments and documentary evidence crops',
      materialLanguage: 'measurement tape, labels, raw substrate and translucent overlays',
      motionLanguage: 'snapping assembly, measured reveals and evidence locking',
      interactionModel: 'inspect, compare and pin evidence into working states',
      responsiveStrategy: 'convert the workbench into a prioritized evidence stack on narrow screens',
      categoryTransferTest: {
        whyProjectSpecific: 'Its structure depends on this project’s evidence and comparison behaviors.',
        transferRisk: 'Without project evidence it becomes an empty dashboard aesthetic.'
      },
      antiPatterns: ['ambient storytelling without proof', 'decorative dashboard chrome']
    },
    {
      id: 'world-c',
      label: 'Service Choreography',
      worldIdea: 'A spatial choreography organized around meaningful service transitions.',
      interpretationOfThesis: 'Service behavior becomes the temporal structure through which product truth is understood.',
      signatureBehavior: 'The interface crosses deliberate service thresholds that change spatial state.',
      worldClass: 'service-choreography',
      narrativeModel: 'threshold-sequence',
      compositionModel: 'spatial-stage-zones',
      typographyIntent: { statement: 'Humanist functional type with strong temporal hierarchy.' },
      imageLanguage: 'wide contextual scenes punctuated by precise action details',
      materialLanguage: 'soft light, physical thresholds, tactile surfaces and depth',
      motionLanguage: 'continuous spatial handoffs with restrained acceleration',
      interactionModel: 'progress through threshold actions that reveal the next service state',
      responsiveStrategy: 'translate spatial thresholds into sequential state changes on mobile',
      categoryTransferTest: {
        whyProjectSpecific: 'The choreography maps to this project’s actual service sequence and decision points.',
        transferRisk: 'Without those service transitions it becomes generic cinematic scrolling.'
      },
      antiPatterns: ['scroll spectacle without service meaning', 'one-size-fits-all section stacking']
    }
  ];
}

function proofMoments() {
  return [
    { id: 'opening', label: 'Opening', viewport: 'desktop', width: 1440, height: 900, purpose: 'Prove first-contact hierarchy.', productState: 'first contact' },
    { id: 'core', label: 'Core', viewport: 'desktop', width: 1440, height: 900, purpose: 'Prove primary behavior.', productState: 'primary interaction' },
    { id: 'decision', label: 'Decision', viewport: 'desktop', width: 1440, height: 900, purpose: 'Prove decision clarity.', productState: 'decision boundary' },
    { id: 'mobile', label: 'Mobile', viewport: 'mobile', width: 390, height: 844, purpose: 'Prove mobile reinterpretation.', productState: 'mobile primary interaction' }
  ];
}

function fixture() {
  const deliberation = buildDeliberation();
  const authored = authoredCandidateFromDeliberation(deliberation);
  const builtThesis = buildCreativeThesis({
    projectId: 'project-1',
    intent: 'Build a distinctive experience around product truth and service behavior.',
    businessTruths: deliberation.sourceTruths,
    inspiration: { opportunityGaps: deliberation.sourceOpportunities },
    antiPrinciples: ['generic premium styling', 'decorative storytelling detached from use'],
    audience: 'Customers evaluating and choosing the product',
    commercialObjective: 'Increase understanding and conversion confidence',
    authoredCandidate: authored
  });
  const thesis = { ...builtThesis, id: 'thesis-1' };
  const humanDecision = buildCreativeThesisHumanDecision({ deliberation, thesis, decision: 'approve-recommendation', sourceCandidateId: deliberation.selection.hypothesisId, rationale: 'The human approves the reviewed Thesis recommendation.', humanConfirmed: true, decidedAt: '2026-08-31T10:55:36.158Z', evidenceRef: 'fixture://creative-thesis-decision' });

  const preSelectionExploration = buildCreativeWorldExploration({
    creativeThesis: thesis,
    authoredWorlds: authoredWorlds()
  });
  assert.equal(preSelectionExploration.reviewReady, true);

  const styleFrameProof = buildStyleFrameProof({ exploration: preSelectionExploration, moments: proofMoments() });
  assert.equal(styleFrameProof.reviewReady, true);
  const renderedFrames = styleFrameProof.frames.map((frame) => ({
    frameId: frame.id,
    worldId: frame.worldId,
    imageRef: `image:${frame.id}`,
    sourceRef: `source:${frame.id}`
  }));
  const visualProofEvidence = buildVisualProofEvidence({
    plan: styleFrameProof,
    renderedFrames,
    comparisonRefs: ['comparison:all-worlds']
  });
  assert.equal(visualProofEvidence.reviewReady, true);

  const selectedEvidenceRefs = visualProofEvidence.worlds.find((item) => item.worldId === 'world-a').evidenceRefs;
  const exploration = selectCreativeWorld(preSelectionExploration, {
    worldId: 'world-a',
    humanConfirmed: true,
    visualReviewConfirmed: true,
    visualEvidenceRefs: selectedEvidenceRefs,
    rationale: 'World A best preserves product truth while producing a distinct service rhythm.'
  });
  const world = exploration.selectedWorld;
  assert.ok(world);

  const direction = {
    provisional: false,
    directionStatement: 'World A direction',
    thesisContext: { statement: thesis.statement },
    worldContext: { id: 'world-a' },
    findings: []
  };
  return { deliberation, thesis, humanDecision, world, exploration, styleFrameProof, visualProofEvidence, direction };
}

function handoffInput(parts) {
  return {
    projectId: 'project-1',
    creativeThesisDeliberation: parts.deliberation,
    creativeThesis: parts.thesis,
    creativeThesisHumanDecision: parts.humanDecision,
    selectedCreativeWorld: parts.world,
    creativeWorldExploration: parts.exploration,
    styleFrameProof: parts.styleFrameProof,
    visualProofEvidence: parts.visualProofEvidence,
    creativeDirection: parts.direction
  };
}

test('canonical handoff passes only valid, traceable, production-complete creative authority', () => {
  const parts = fixture();
  const output = buildCanonicalCreativeProductionHandoff(handoffInput(parts));
  assert.equal(output.pass, true);
  assert.equal(output.status, 'ready-for-production-planning');
  assert.equal(output.authority.selectedWorldId, 'world-a');
  assert.equal(output.truth.creativeThesisAuthorityValid, true);
  assert.equal(output.truth.creativeThesisHumanApproved, true);
  assert.equal(output.truth.creativeWorldExplorationRevalidated, true);
  assert.equal(output.truth.creativeSelectionHumanGoverned, true);
  assert.equal(output.truth.creativeSelectionProvenanceValid, true);
  assert.equal(output.truth.renderedVisualProofEvidenceValid, true);
  assert.equal(output.truth.creativeWorldProductionContractComplete, true);
  assert.equal(output.truth.creativeWorldStructuralReviewRecomputed, true);
  assert.equal(output.truth.creativeWorldStructuralReviewReady, true);
  assert.equal(output.truth.creativeWorldThesisProjectBindingValid, true);
  assert.equal(output.truth.productionApprovalFabricated, false);
});

test('arbitrary review-ready thesis without deliberation authority cannot cross production boundary', () => {
  const parts = fixture();
  parts.deliberation = null;
  const output = buildCanonicalCreativeProductionHandoff(handoffInput(parts));
  assert.equal(output.pass, false);
  assert.equal(output.truth.creativeThesisAuthorityValid, false);
  assert.ok(output.findings.some((item) => item.code === 'canonical-thesis-authority-invalid'));
});

test('thesis without an explicit human decision cannot cross production boundary', () => {
  const parts = fixture();
  parts.humanDecision = null;
  const output = buildCanonicalCreativeProductionHandoff(handoffInput(parts));
  assert.equal(output.pass, false);
  assert.equal(output.truth.creativeThesisHumanApproved, false);
  assert.ok(output.findings.some((item) => item.code === 'canonical-thesis-authority-invalid'));
});

test('fabricated partial exploration cannot authorize a selected world', () => {
  const parts = fixture();
  parts.exploration = {
    selectedWorld: parts.world,
    selection: structuredClone(parts.exploration.selection),
    truth: { humanWorldSelectionConfirmed: true },
    findings: []
  };
  const output = buildCanonicalCreativeProductionHandoff(handoffInput(parts));
  assert.equal(output.pass, false);
  assert.equal(output.truth.creativeWorldExplorationRevalidated, false);
  assert.ok(output.findings.some((item) => item.code === 'canonical-world-exploration-invalid'));
});

test('selected world must remain a member of the re-reviewed exploration candidate set', () => {
  const parts = fixture();
  parts.exploration.worlds = parts.exploration.worlds.filter((item) => item.id !== parts.world.id);
  const output = buildCanonicalCreativeProductionHandoff(handoffInput(parts));
  assert.equal(output.pass, false);
  assert.ok(output.findings.some((item) => item.code === 'canonical-world-exploration-invalid'));
});

test('a style-frame proof plan cannot substitute for rendered proof evidence', () => {
  const parts = fixture();
  parts.visualProofEvidence = parts.styleFrameProof;
  const output = buildCanonicalCreativeProductionHandoff(handoffInput(parts));
  assert.equal(output.pass, false);
  assert.equal(output.truth.renderedVisualProofEvidenceValid, false);
  assert.ok(output.findings.some((item) => item.code === 'canonical-rendered-visual-proof-invalid'));
});

test('selection evidence refs must resolve exactly to rendered evidence for selected world', () => {
  const parts = fixture();
  parts.exploration.selection.visualEvidenceRefs = ['image:another-world-frame'];
  const output = buildCanonicalCreativeProductionHandoff(handoffInput(parts));
  assert.equal(output.pass, false);
  assert.equal(output.truth.renderedVisualProofEvidenceValid, false);
  assert.ok(output.findings.some((item) => item.code === 'canonical-rendered-visual-proof-invalid'));
});

test('world candidate cannot cross the production authority boundary', () => {
  const parts = fixture();
  parts.world.selected = false;
  parts.world.truth.humanCreativeSelectionConfirmed = false;
  const output = buildCanonicalCreativeProductionHandoff(handoffInput(parts));
  assert.equal(output.pass, false);
  assert.ok(output.findings.some((item) => item.code === 'canonical-world-not-authoritative'));
});

test('fabricated world reviewReady cannot bypass recomputed project-specificity review', () => {
  const parts = fixture();
  parts.world.categoryTransferTest = {};
  parts.world.reviewReady = true;
  parts.world.findings = [];
  const output = buildCanonicalCreativeProductionHandoff(handoffInput(parts));
  assert.equal(output.pass, false);
  assert.equal(output.truth.creativeWorldStructuralReviewReady, false);
  assert.ok(output.findings.some((item) => item.code === 'canonical-world-production-contract-incomplete'));
});

test('technology cannot become the selected world concept even with fabricated clean findings', () => {
  const parts = fixture();
  parts.world.worldIdea = 'A WebGL shader experience defines the brand world.';
  parts.world.reviewReady = true;
  parts.world.findings = [];
  const output = buildCanonicalCreativeProductionHandoff(handoffInput(parts));
  assert.equal(output.pass, false);
  assert.equal(output.truth.creativeWorldStructuralReviewReady, false);
  const issue = output.findings.find((item) => item.code === 'canonical-world-production-contract-incomplete');
  assert.ok(issue.evidence.structuralFindingCodes.includes('creative-world-technology-became-concept'));
});

test('human-selected world with incomplete production dimensions is rejected', () => {
  const parts = fixture();
  parts.world.motionLanguage = '';
  const output = buildCanonicalCreativeProductionHandoff(handoffInput(parts));
  assert.equal(output.pass, false);
  assert.equal(output.truth.creativeWorldProductionContractComplete, false);
  const issue = output.findings.find((item) => item.code === 'canonical-world-production-contract-incomplete');
  assert.ok(issue);
  assert.ok(issue.evidence.missingFields.includes('motionLanguage'));
});

test('world thesis/project binding drift blocks production completeness', () => {
  const parts = fixture();
  parts.world.thesisRef.projectId = 'other-project';
  const output = buildCanonicalCreativeProductionHandoff(handoffInput(parts));
  assert.equal(output.pass, false);
  assert.equal(output.truth.creativeWorldThesisProjectBindingValid, false);
  assert.ok(output.findings.some((item) => item.code === 'canonical-world-production-contract-incomplete'));
});

test('creative direction drift blocks canonical production handoff', () => {
  const parts = fixture();
  parts.direction.worldContext.id = 'world-b';
  const output = buildCanonicalCreativeProductionHandoff(handoffInput(parts));
  assert.equal(output.pass, false);
  assert.ok(output.findings.some((item) => item.code === 'canonical-direction-authority-drift'));
});

test('required typography must carry human approval', () => {
  const parts = fixture();
  const output = buildCanonicalCreativeProductionHandoff({
    ...handoffInput(parts),
    requireTypography: true,
    typography: { pass: true, artDirectionReview: { approved: false } }
  });
  assert.equal(output.pass, false);
  assert.ok(output.findings.some((item) => item.code === 'canonical-typography-not-approved'));
});

test('validator preserves authority completeness expectations', () => {
  const parts = fixture();
  const output = buildCanonicalCreativeProductionHandoff(handoffInput(parts));
  const validation = validateCanonicalCreativeProductionHandoff(output, {
    pass: true,
    status: 'ready-for-production-planning',
    selectedWorldId: 'world-a',
    requireThesisAuthority: true,
    requireExplorationRevalidation: true,
    requireRenderedVisualProof: true,
    requireProductionContractComplete: true,
    requireSelectionProvenance: true,
    requireNoFabricatedProductionApproval: true,
    forbiddenFindingCodes: ['canonical-direction-authority-drift']
  });
  assert.deepEqual(validation, { pass: true, failures: [] });
});
