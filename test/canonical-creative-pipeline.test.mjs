import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCanonicalCreativeProductionHandoff,
  validateCanonicalCreativeProductionHandoff
} from '../modules/canonical-creative-pipeline/runtime.mjs';

function fixture() {
  const thesis = {
    schema: 'ai-studio-os/creative-thesis@1',
    projectId: 'project-1',
    statement: 'Make the product truth the organizing experience idea.',
    governingIdea: { statement: 'Make the product truth the organizing experience idea.' },
    reviewReady: true,
    pass: true
  };
  const world = {
    schema: 'ai-studio-os/creative-world@1',
    id: 'world-a',
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
    frames: [{ worldId: 'world-a', rendered: true }],
    findings: []
  };
  const direction = {
    provisional: false,
    directionStatement: 'World A direction',
    thesisContext: { statement: thesis.statement },
    worldContext: { id: 'world-a' },
    findings: []
  };
  return { thesis, world, styleFrameProof, direction };
}

test('canonical handoff passes only reviewed human-governed creative authority', () => {
  const { thesis, world, styleFrameProof, direction } = fixture();
  const output = buildCanonicalCreativeProductionHandoff({
    projectId: 'project-1',
    creativeThesis: thesis,
    selectedCreativeWorld: world,
    styleFrameProof,
    creativeDirection: direction
  });
  assert.equal(output.pass, true);
  assert.equal(output.status, 'ready-for-production-planning');
  assert.equal(output.authority.selectedWorldId, 'world-a');
  assert.equal(output.truth.productionApprovalFabricated, false);
});

test('truthful human visual approval does not invalidate otherwise valid style-frame proof', () => {
  const { thesis, world, styleFrameProof, direction } = fixture();
  styleFrameProof.truth.humanVisualApproval = true;
  const output = buildCanonicalCreativeProductionHandoff({
    creativeThesis: thesis,
    selectedCreativeWorld: world,
    styleFrameProof,
    creativeDirection: direction
  });
  assert.equal(output.pass, true);
  assert.equal(output.truth.styleFrameProofReviewed, true);
});

test('world candidate cannot cross the production authority boundary', () => {
  const { thesis, world, styleFrameProof, direction } = fixture();
  world.selected = false;
  world.truth.humanCreativeSelectionConfirmed = false;
  const output = buildCanonicalCreativeProductionHandoff({
    creativeThesis: thesis,
    selectedCreativeWorld: world,
    styleFrameProof,
    creativeDirection: direction
  });
  assert.equal(output.pass, false);
  assert.ok(output.findings.some((item) => item.code === 'canonical-world-not-authoritative'));
});

test('creative direction drift blocks canonical production handoff', () => {
  const { thesis, world, styleFrameProof, direction } = fixture();
  direction.worldContext.id = 'world-b';
  const output = buildCanonicalCreativeProductionHandoff({
    creativeThesis: thesis,
    selectedCreativeWorld: world,
    styleFrameProof,
    creativeDirection: direction
  });
  assert.equal(output.pass, false);
  assert.ok(output.findings.some((item) => item.code === 'canonical-direction-authority-drift'));
});

test('required typography must carry human approval', () => {
  const { thesis, world, styleFrameProof, direction } = fixture();
  const output = buildCanonicalCreativeProductionHandoff({
    creativeThesis: thesis,
    selectedCreativeWorld: world,
    styleFrameProof,
    creativeDirection: direction,
    requireTypography: true,
    typography: { pass: true, artDirectionReview: { approved: false } }
  });
  assert.equal(output.pass, false);
  assert.ok(output.findings.some((item) => item.code === 'canonical-typography-not-approved'));
});

test('validator preserves truth-state expectations', () => {
  const { thesis, world, styleFrameProof, direction } = fixture();
  const output = buildCanonicalCreativeProductionHandoff({
    creativeThesis: thesis,
    selectedCreativeWorld: world,
    styleFrameProof,
    creativeDirection: direction
  });
  const validation = validateCanonicalCreativeProductionHandoff(output, {
    pass: true,
    status: 'ready-for-production-planning',
    selectedWorldId: 'world-a',
    requireNoFabricatedProductionApproval: true,
    forbiddenFindingCodes: ['canonical-direction-authority-drift']
  });
  assert.deepEqual(validation, { pass: true, failures: [] });
});
