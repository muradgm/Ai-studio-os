import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildProvenMotionDirection,
  reviewMotionCritique
} from '../modules/motion-creative-intelligence/critic.mjs';
import { buildMotionCritiqueFixture } from '../fixtures/motion-critic-authority-fixture.mjs';

function selectionEvidence(fixture, hypothesisId) {
  return fixture.brief.hypotheses.find((item) => item.id === hypothesisId)?.requiredSelectionEvidenceRefs ?? [];
}

test('human override remains allowed for a blocker-free nonrecommended Motion hypothesis', () => {
  const fixture = buildMotionCritiqueFixture({ recommendedHypothesisId: 'editorial' });
  const candidate = buildProvenMotionDirection({
    exploration: fixture.exploration,
    critique: fixture.critique,
    hypothesisId: 'continuity',
    humanConfirmed: true,
    rationale: 'Human review chooses a blocker-free alternative after inspecting the required temporal evidence.',
    reviewedEvidenceRefs: selectionEvidence(fixture, 'continuity')
  });

  assert.equal(candidate?.hypothesisId, 'continuity');
  assert.equal(candidate?.critic.recommendationFollowed, false);
  assert.equal(candidate?.truth.selectedHypothesisCriticBlockersCleared, true);
});

test('human override cannot select a hypothesis with an unresolved Critic blocker', () => {
  const fixture = buildMotionCritiqueFixture({ recommendedHypothesisId: 'editorial' });
  const critique = structuredClone(fixture.critique);
  const continuity = critique.hypothesisReviews.find((item) => item.hypothesisId === 'continuity');
  continuity.dimensions.accessibility.judgment = 'blocker';
  continuity.dimensions.accessibility.rationale = 'Rendered reduced-motion evidence fails semantic equivalence and is a selection blocker.';

  const critiqueReview = reviewMotionCritique(critique);
  assert.equal(critiqueReview.reviewReady, true, 'a blocker-rated losing alternative should not invalidate a clean Critic recommendation');

  const candidate = buildProvenMotionDirection({
    exploration: fixture.exploration,
    critique,
    hypothesisId: 'continuity',
    humanConfirmed: true,
    rationale: 'Attempted human override of a blocker-rated alternative.',
    reviewedEvidenceRefs: selectionEvidence(fixture, 'continuity')
  });

  assert.equal(candidate, null);
});
