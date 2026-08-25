import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCanonicalCreativeProductionHandoff,
  validateCanonicalCreativeProductionHandoff
} from '../modules/canonical-creative-pipeline/runtime.mjs';

function fixture() {
  const thesis = {
    schema: 'ai-studio-os/creative-thesis@1',
    id: 'thesis-1',
    projectId: 'project-1',
    statement: 'Make the product truth the organizing experience idea.',
    governingIdea: { statement: 'Make the product truth the organizing experience idea.' },
    reviewReady: true,
    pass: true
  };
  const world = {
    schema: 'ai-studio-os/creative-world@1',
    id: 'world-a',
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
    antiPatterns: ['generic luxury serif staging', 'card-grid SaaS composition'],
    thesisRef: {
      schema: thesis.schema,
      projectId: thesis.projectId,
      governingIdea: thesis.governingIdea.statement
    },
    findings: [],
    reviewReady: true,
    selected: true,
    truth: {
      humanCreativeSelectionConfirmed: true,
      visualWorldProofReviewed: true
    }
  };
  const styleFrameProof = {
    reviewReady: true,
    truth: { humanVisualApproval: false },
    frames: [{ id: 'frame-world-a', worldId: 'world-a', rendered: true }],
    findings: []
  };
  const exploration = {
    selectedWorld: world,
    selection: {
      worldId: 'world-a',
      humanConfirmed: true,
      visualReviewConfirmed: true,
      visualEvidenceRefs: ['frame-world-a']
    },
    truth: { humanWorldSelectionConfirmed: true },
    findings: []
  };
  const direction = {
    provisional: false,
    directionStatement: 'World A direction',
    thesisContext: { statement: thesis.statement },
    worldContext: { id: 'world-a' },
    findings: []
  };
  return { thesis, world, exploration, styleFrameProof, direction };
}

function handoffInput(parts) {
  return {
    projectId: 'project-1',
    creativeThesis: parts.thesis,
    selectedCreativeWorld: parts.world,
    creativeWorldExploration: parts.exploration,
    styleFrameProof: parts.styleFrameProof,
    creativeDirection: parts.direction
  };
}

test('canonical handoff passes only valid, traceable, production-complete creative authority', () => {
  const parts = fixture();
  const output = buildCanonicalCreativeProductionHandoff(handoffInput(parts));
  assert.equal(output.pass, true);
  assert.equal(output.status, 'ready-for-production-planning');
  assert.equal(output.authority.selectedWorldId, 'world-a');
  assert.equal(output.truth.creativeSelectionHumanGoverned, true);
  assert.equal(output.truth.creativeSelectionProvenanceValid, true);
  assert.equal(output.truth.creativeWorldProductionContractComplete, true);
  assert.equal(output.truth.creativeWorldThesisProjectBindingValid, true);
  assert.equal(output.truth.productionApprovalFabricated, false);
});

test('truthful human visual approval does not invalidate otherwise valid style-frame proof', () => {
  const parts = fixture();
  parts.styleFrameProof.truth.humanVisualApproval = true;
  const output = buildCanonicalCreativeProductionHandoff(handoffInput(parts));
  assert.equal(output.pass, true);
  assert.equal(output.truth.styleFrameProofReviewed, true);
});

test('world candidate cannot cross the production authority boundary', () => {
  const parts = fixture();
  parts.world.selected = false;
  parts.world.truth.humanCreativeSelectionConfirmed = false;
  parts.exploration.selectedWorld = parts.world;
  const output = buildCanonicalCreativeProductionHandoff(handoffInput(parts));
  assert.equal(output.pass, false);
  assert.ok(output.findings.some((item) => item.code === 'canonical-world-not-authoritative'));
});

test('fabricated selected flags without current exploration selection provenance are rejected', () => {
  const parts = fixture();
  parts.exploration.selection = null;
  parts.exploration.truth.humanWorldSelectionConfirmed = false;
  const output = buildCanonicalCreativeProductionHandoff(handoffInput(parts));
  assert.equal(output.pass, false);
  assert.equal(output.truth.creativeSelectionProvenanceValid, false);
  assert.ok(output.findings.some((item) => item.code === 'canonical-world-selection-provenance-invalid'));
});

test('visual selection evidence must reference a rendered frame in the current proof', () => {
  const parts = fixture();
  parts.exploration.selection.visualEvidenceRefs = ['missing-frame'];
  const output = buildCanonicalCreativeProductionHandoff(handoffInput(parts));
  assert.equal(output.pass, false);
  assert.ok(output.findings.some((item) => item.code === 'canonical-world-selection-provenance-invalid'));
});

test('human-selected world with incomplete production dimensions is rejected', () => {
  const parts = fixture();
  parts.world.motionLanguage = '';
  parts.exploration.selectedWorld = parts.world;
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
  parts.exploration.selectedWorld = parts.world;
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
    requireProductionContractComplete: true,
    requireSelectionProvenance: true,
    requireNoFabricatedProductionApproval: true,
    forbiddenFindingCodes: ['canonical-direction-authority-drift']
  });
  assert.deepEqual(validation, { pass: true, failures: [] });
});
