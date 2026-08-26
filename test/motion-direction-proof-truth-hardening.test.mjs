import test from 'node:test';
import assert from 'node:assert/strict';

import { buildAuthoritativeMotionDirection } from '../modules/motion-creative-intelligence/direction-authority.mjs';
import { buildMotionCritiqueFixture } from '../fixtures/motion-critic-authority-fixture.mjs';

test('caller-mutated proof truth cannot turn fixture evidence into technical authority', () => {
  const fixture = buildMotionCritiqueFixture();
  const spoofedCritique = structuredClone(fixture.critique);
  const proofEvidence = spoofedCritique.brief.authorityInputs.proofEvidence;

  proofEvidence.truth = {
    ...(proofEvidence.truth ?? {}),
    exactBrowserTemporalEvidence: true,
    artifactDigestsRecomputed: true,
    testFixtureEvidenceOnly: false
  };

  const hypothesis = spoofedCritique.brief.hypotheses.find((item) => item.id === 'editorial');
  const direction = buildAuthoritativeMotionDirection({
    exploration: spoofedCritique.brief.authorityInputs.exploration,
    critique: spoofedCritique,
    hypothesisId: 'editorial',
    humanConfirmed: true,
    rationale: 'Attempt to spoof final technical authority from fixture truth.',
    reviewedEvidenceRefs: hypothesis.requiredSelectionEvidenceRefs
  });

  assert.equal(direction, null);
});
