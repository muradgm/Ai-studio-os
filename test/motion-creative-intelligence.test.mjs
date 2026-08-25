import test from 'node:test';
import assert from 'node:assert/strict';

import { buildMotionCreativeExploration, selectedMotionDirection } from '../modules/motion-creative-intelligence/runtime.mjs';
import {
  buildCanonicalMotionAuthorityFixture,
  buildMotionExplorationFixture,
  buildMotionHypotheses
} from '../fixtures/motion-creative-authority-fixture.mjs';

const preference = {
  hypothesisId: 'editorial',
  humanConfirmed: true,
  rationale: 'Editorial Rhythm preserves the selected world’s restraint while giving hierarchy a memorable temporal structure.'
};

test('motion creative exploration requires the full canonical creative handoff while a pre-proof preference remains provisional', () => {
  const { exploration } = buildMotionExplorationFixture({ selection: preference });

  assert.equal(exploration.worldAuthority.pass, true);
  assert.equal(exploration.reviewReady, true);
  assert.equal(exploration.truth.fullCanonicalCreativeHandoffRecomputed, true);
  assert.equal(exploration.worldAuthority.truth.canonicalCreativeProductionHandoffReused, true);
  assert.equal(exploration.worldAuthority.truth.exactRenderedVisualProofRequired, true);

  const candidate = selectedMotionDirection(exploration);
  assert.equal(candidate.schema, 'ai-studio-os/motion-direction-candidate@1');
  assert.equal(candidate.hypothesisId, 'editorial');
  assert.equal(candidate.creativeWorldAuthority.creativeWorldId, 'consequential-continuity');
  assert.equal(candidate.truth.renderedMotionProofStillRequired, true);
  assert.equal(candidate.truth.motionCriticStillRequired, true);
  assert.equal(candidate.truth.technicalPlanningAuthorized, false);
  assert.equal(candidate.truth.productionApproved, false);
  assert.equal(candidate.truth.spatialTechnologySelected, false);
});

test('technical motion cannot substitute for creative motion language even with valid upstream authority', () => {
  const canonical = buildCanonicalMotionAuthorityFixture();
  const output = buildMotionCreativeExploration({
    projectId: canonical.projectId,
    canonicalCreativeAuthority: canonical,
    hypotheses: [{ id: 'tech', interpretation: 'Use GSAP and WebGL.', technicalOptions: ['GSAP', 'Three.js'] }],
    selection: { hypothesisId: 'tech', humanConfirmed: true, rationale: 'Technical choice.' }
  });

  assert.equal(output.worldAuthority.pass, true);
  assert.equal(output.reviewReady, false);
  assert.ok(output.findings.some((item) => item.code === 'motion-language-motionThesis-missing'));
  assert.equal(selectedMotionDirection(output), null);
});

test('forged selected/reviewReady flags cannot replace the canonical creative handoff', () => {
  const canonical = buildCanonicalMotionAuthorityFixture();
  const fakeWorld = {
    ...canonical.selectedCreativeWorld,
    reviewReady: true,
    selected: true,
    truth: {
      ...(canonical.selectedCreativeWorld.truth ?? {}),
      humanCreativeSelectionConfirmed: true,
      visualWorldProofReviewed: true
    }
  };

  const output = buildMotionCreativeExploration({
    projectId: canonical.projectId,
    creativeWorld: fakeWorld,
    creativeWorldExploration: {
      selectedWorld: fakeWorld,
      truth: { humanWorldSelectionConfirmed: true }
    },
    hypotheses: buildMotionHypotheses(fakeWorld.id),
    selection: preference
  });

  assert.equal(output.pass, false);
  assert.equal(output.worldAuthority.pass, false);
  assert.ok(output.findings.some((item) => item.code === 'motion-creative-world-not-authoritative'));
  assert.ok(output.worldAuthority.findings.some((item) => item.code === 'motion-canonical-creative-authority-invalid'));
});

test('selected Creative World drift from the canonical exploration is rejected at the Motion boundary', () => {
  const canonical = buildCanonicalMotionAuthorityFixture();
  const outsider = {
    ...canonical.selectedCreativeWorld,
    id: 'outsider',
    selected: true,
    truth: {
      ...(canonical.selectedCreativeWorld.truth ?? {}),
      humanCreativeSelectionConfirmed: true,
      visualWorldProofReviewed: true
    }
  };
  const drifted = { ...canonical, selectedCreativeWorld: outsider };

  const output = buildMotionCreativeExploration({
    projectId: canonical.projectId,
    canonicalCreativeAuthority: drifted,
    hypotheses: buildMotionHypotheses(outsider.id),
    selection: preference
  });

  assert.equal(output.worldAuthority.pass, false);
  assert.ok(output.worldAuthority.findings.some((item) => item.code === 'motion-canonical-creative-authority-invalid'));
  assert.ok(output.worldAuthority.canonicalHandoff.findings.some((item) =>
    ['canonical-world-not-authoritative', 'canonical-world-exploration-invalid', 'canonical-world-selection-provenance-invalid'].includes(item.code)
  ));
});

test('removing exact rendered visual proof blocks Motion before hypothesis quality can authorize it', () => {
  const canonical = buildCanonicalMotionAuthorityFixture();
  const withoutVisualProof = { ...canonical, visualProofEvidence: null };
  const output = buildMotionCreativeExploration({
    projectId: canonical.projectId,
    canonicalCreativeAuthority: withoutVisualProof,
    hypotheses: buildMotionHypotheses(canonical.selectedCreativeWorld.id)
  });

  assert.equal(output.worldAuthority.pass, false);
  assert.ok(output.worldAuthority.canonicalHandoff.findings.some((item) => item.code === 'canonical-rendered-visual-proof-invalid'));
});
