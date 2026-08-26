import test from 'node:test';
import assert from 'node:assert/strict';

import { reviewMotionCritique } from '../modules/motion-creative-intelligence/critic.mjs';
import { buildMotionCritiqueFixture } from '../fixtures/motion-critic-authority-fixture.mjs';

test('timeline-like source filenames cannot satisfy performance evidence', () => {
  const fixture = buildMotionCritiqueFixture();
  const corrupted = structuredClone(fixture.critique);
  const proofEvidence = corrupted.brief.authorityInputs.proofEvidence;
  const targetStudy = proofEvidence.renderedStudies.find((study) => study.hypothesisId === 'continuity');
  assert.ok(targetStudy);

  targetStudy.sourceRef = 'fixture://motion/continuity/timeline-source.html';
  const targetReview = corrupted.hypothesisReviews.find((review) => review.hypothesisId === 'continuity');
  assert.ok(targetReview);
  targetReview.dimensions.performance.evidenceRefs = [targetStudy.sourceRef];

  const result = reviewMotionCritique(corrupted);
  assert.equal(result.reviewReady, false);
  assert.ok(result.findings.some((item) => item.code === 'motion-critic-performance-timeline-missing'));

  const authoritative = result.authoritativeBrief.hypotheses.find((item) => item.id === 'continuity');
  assert.ok(authoritative.timelineRefs.includes(targetStudy.timelineRef));
  assert.equal(authoritative.timelineRefs.includes(targetStudy.sourceRef), false);
});
