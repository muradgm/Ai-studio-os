import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CREATIVE_MOTION_DOGFOOD_CONDITIONS,
  CREATIVE_MOTION_DOGFOOD_DIMENSIONS,
  buildCreativeMotionCapabilityDogfood,
  buildCreativeMotionBlindReviewPacket,
  buildCreativeMotionUnblindingMap
} from '../modules/creative-motion-capability-dogfood/runtime.mjs';
import { reviewCreativeMotionDogfoodResultsFresh } from '../modules/creative-motion-capability-dogfood/review.mjs';

function dogfoodBrief() {
  return {
    projectId: 'benchmark-011-after-matter',
    title: 'After Matter — 100 Objects That Learned to Age',
    challenge: 'Make material time perceptible without sacrificing reading, wayfinding, tickets or accessibility.',
    audience: 'Design-literate museum visitors and culturally curious general visitors.',
    projectTruths: [
      'Wear and repair are evidence, not defects.',
      'Editorial reading and practical ticketing must coexist.',
      'Mobile is a primary planning surface.',
      'Reduced motion must preserve meaning.'
    ],
    contradictions: [
      'Archival authority versus tactile sensuality.',
      'Slow reading versus memorable temporal revelation.'
    ],
    nonNegotiables: [
      'Motion must derive from accumulated time or material memory.',
      'Long-form reading requires deliberate stillness.',
      'Navigation and ticketing stay usable.',
      'Mobile is authored, not scaled.',
      'Reduced motion preserves semantic sequence.'
    ],
    antiPatterns: [
      'Uniform fade-and-rise sections.',
      'Decorative particles or glowing AI gradients.',
      'Continuous camera drift for premium aesthetics.',
      'Scroll-jacking.'
    ],
    canonicalCreativeWorldRef: 'artifact://benchmark-011/canonical-world-v1',
    canonicalCreativeWorldFingerprint: 'a'.repeat(64),
    targetExperience: 'Quietly radical, materially intelligent and memorable because temporal behavior makes accumulated use perceptible.'
  };
}

function sharedBudget() {
  return {
    maxGenerationAttempts: 3,
    tokenBudget: 24000,
    wallClockSeconds: 900,
    modelPolicyId: 'dogfood-best-available-v1',
    temperaturePolicyId: 'dogfood-balanced-divergence-v1'
  };
}

function buildValidExperiment(overrides = {}) {
  const brief = dogfoodBrief();
  const probe = buildCreativeMotionCapabilityDogfood({
    experimentId: 'dogfood-011-v1',
    projectId: brief.projectId,
    brief,
    trials: [],
    blindSeed: 'private-seed-011'
  });
  const trials = CREATIVE_MOTION_DOGFOOD_CONDITIONS.flatMap((condition) => [1, 2, 3].map((replicate) => ({
    trialId: `trial-${condition.id.toLowerCase()}-${replicate}`,
    conditionId: condition.id,
    replicate,
    projectId: brief.projectId,
    briefFingerprint: probe.briefFingerprint,
    generationBudget: sharedBudget(),
    evidenceBundleRef: `artifact://dogfood-011/evidence/${condition.id.toLowerCase()}-${replicate}`,
    hypothesisCount: 3,
    temporalStudyCount: 15,
    realBrowserEvidence: true,
    mobileEvidence: true,
    reducedMotionEvidence: true,
    runtimeTraceRef: `artifact://dogfood-011/runtime/${condition.id.toLowerCase()}-${replicate}`,
    sourceSnapshotFingerprint: `${condition.id.toLowerCase()}${replicate}`.padEnd(64, '0').slice(0, 64)
  })));

  return buildCreativeMotionCapabilityDogfood({
    experimentId: 'dogfood-011-v1',
    projectId: brief.projectId,
    brief,
    trials,
    blindSeed: 'private-seed-011',
    ...overrides
  });
}

function completeReviewer(packet, overrides = {}) {
  const candidateReviews = packet.candidates.map((candidate, candidateIndex) => ({
    blindId: candidate.blindId,
    dimensions: CREATIVE_MOTION_DOGFOOD_DIMENSIONS.map((dimensionId, dimensionIndex) => ({
      dimensionId,
      rating: ((candidateIndex + dimensionIndex) % 4 === 0) ? 'exceptional' : 'strong',
      rationale: `${dimensionId} is judged from the rendered temporal evidence for ${candidate.blindId}.`
    }))
  }));
  return {
    reviewerId: 'human-reviewer-01',
    reviewerType: 'human',
    independent: true,
    blinded: true,
    candidateReviews,
    topChoiceBlindId: packet.candidates[0].blindId,
    topChoiceRationale: 'The strongest overall qualitative balance in the blinded evidence.',
    ...overrides
  };
}

test('review-ready dogfood binds five conditions, three replicates and equal budgets', () => {
  const experiment = buildValidExperiment();
  assert.equal(experiment.pass, true);
  assert.equal(experiment.reviewReady, true);
  assert.equal(experiment.status, 'ready-for-blind-review');
  assert.equal(experiment.trials.length, 15);
  assert.equal(experiment.truth.structuralPassIsNotCreativeQuality, true);
  assert.equal(experiment.truth.noAutomaticWinner, true);
  assert.equal(experiment.truth.noProductionAuthority, true);
});

test('budget drift blocks the ablation instead of being averaged away', () => {
  const valid = buildValidExperiment();
  const trials = valid.trials.map((trial) => ({ ...trial, generationBudget: { ...trial.generationBudget } }));
  trials.at(-1).generationBudget.tokenBudget += 1;
  const experiment = buildCreativeMotionCapabilityDogfood({
    experimentId: valid.experimentId,
    projectId: valid.projectId,
    brief: valid.brief,
    trials,
    blindSeed: 'private-seed-011'
  });
  assert.equal(experiment.reviewReady, false);
  assert.ok(experiment.findings.some((item) => item.code === 'dogfood-budget-drift'));
});

test('condition definitions cannot be relabelled after evidence exists', () => {
  const valid = buildValidExperiment();
  const conditions = valid.conditions.map((item) => ({ ...item }));
  conditions[1].profile = 'motion-v2-secretly-expanded';
  const experiment = buildCreativeMotionCapabilityDogfood({
    experimentId: valid.experimentId,
    projectId: valid.projectId,
    brief: valid.brief,
    conditions,
    trials: valid.trials,
    blindSeed: 'private-seed-011'
  });
  assert.equal(experiment.reviewReady, false);
  assert.ok(experiment.findings.some((item) => item.code === 'dogfood-condition-profile-drift'));
});

test('public blind packet contains no condition, trial or runtime identity', () => {
  const experiment = buildValidExperiment();
  const packet = buildCreativeMotionBlindReviewPacket(experiment, { blindSeed: 'private-seed-011' });
  const serialized = JSON.stringify(packet);
  assert.equal(packet.reviewReady, true);
  assert.equal(packet.candidates.length, 15);
  assert.equal(serialized.includes('conditionId'), false);
  assert.equal(serialized.includes('trialId'), false);
  assert.equal(serialized.includes('runtimeTraceRef'), false);
  assert.equal(serialized.includes('motion-v1-baseline'), false);
  assert.equal(serialized.includes('direct-model-control'), false);
  assert.equal(serialized.includes('evidenceBundleRef'), false);
});

test('private unblinding map is separate and resolves all blind candidates', () => {
  const experiment = buildValidExperiment();
  const packet = buildCreativeMotionBlindReviewPacket(experiment, { blindSeed: 'private-seed-011' });
  const map = buildCreativeMotionUnblindingMap(experiment, { blindSeed: 'private-seed-011' });
  assert.equal(map.reviewReady, true);
  assert.equal(map.mapping.length, 15);
  assert.deepEqual(new Set(map.mapping.map((item) => item.blindId)), new Set(packet.candidates.map((item) => item.blindId)));
  assert.deepEqual(new Set(map.mapping.map((item) => item.conditionId)), new Set(['A', 'B', 'C', 'D', 'E']));
});

test('fresh qualitative review exposes per-dimension diagnostics without an overall score or automatic winner', () => {
  const experiment = buildValidExperiment();
  const packet = buildCreativeMotionBlindReviewPacket(experiment, { blindSeed: 'private-seed-011' });
  const results = reviewCreativeMotionDogfoodResultsFresh(experiment, packet, {
    blindSeed: 'private-seed-011',
    reviewers: [completeReviewer(packet)]
  });
  assert.equal(results.pass, true);
  assert.equal(results.reviewReady, true);
  assert.equal(results.status, 'ready-for-human-interpretation');
  assert.equal(results.conditionSummaries.length, 5);
  assert.equal(results.comparisons.length, 4);
  assert.equal(Object.hasOwn(results, 'overallScore'), false);
  assert.equal(Object.hasOwn(results, 'winner'), false);
  assert.equal(results.truth.noOverallCreativeScore, true);
  assert.equal(results.truth.comparisonDeltasAreNotWinnerSelection, true);
  assert.equal(results.truth.freshExperimentRecomputationRequired, true);
  assert.equal(results.truth.callerSuppliedConditionMappingTrusted, false);
  assert.equal(results.truth.creativeDirectionSelected, false);
  assert.equal(results.truth.productionApproved, false);
});

test('review must remain blinded and independent', () => {
  const experiment = buildValidExperiment();
  const packet = buildCreativeMotionBlindReviewPacket(experiment, { blindSeed: 'private-seed-011' });
  const reviewer = completeReviewer(packet, { blinded: false });
  const results = reviewCreativeMotionDogfoodResultsFresh(experiment, packet, {
    blindSeed: 'private-seed-011',
    reviewers: [reviewer]
  });
  assert.equal(results.pass, false);
  assert.ok(results.findings.some((item) => item.code === 'dogfood-review-not-blind-independent'));
});

test('dogfood roadmap decision cannot manufacture creative or production authority', () => {
  const experiment = buildValidExperiment();
  const packet = buildCreativeMotionBlindReviewPacket(experiment, { blindSeed: 'private-seed-011' });
  const results = reviewCreativeMotionDogfoodResultsFresh(experiment, packet, {
    blindSeed: 'private-seed-011',
    reviewers: [completeReviewer(packet)],
    humanDecision: {
      outcome: 'productize-next',
      rationale: 'The architecture shows useful qualitative leverage.',
      evidenceRef: 'review://dogfood-011/human-decision',
      productionApproved: true
    }
  });
  assert.equal(results.pass, false);
  assert.ok(results.findings.some((item) => item.code === 'dogfood-human-decision-authority-fabricated'));
});

test('fresh result interpretation rejects a packet rebuilt or changed outside the bound experiment', () => {
  const experiment = buildValidExperiment();
  const packet = buildCreativeMotionBlindReviewPacket(experiment, { blindSeed: 'private-seed-011' });
  const tampered = structuredClone(packet);
  tampered.candidates[0].hypothesisCount = 99;
  const results = reviewCreativeMotionDogfoodResultsFresh(experiment, tampered, {
    blindSeed: 'private-seed-011',
    reviewers: [completeReviewer(packet)]
  });
  assert.equal(results.pass, false);
  assert.ok(results.findings.some((item) => item.code === 'dogfood-fresh-review-packet-drift'));
});

test('fresh result interpretation fails closed when the blind seed is wrong', () => {
  const experiment = buildValidExperiment();
  const packet = buildCreativeMotionBlindReviewPacket(experiment, { blindSeed: 'private-seed-011' });
  const results = reviewCreativeMotionDogfoodResultsFresh(experiment, packet, {
    blindSeed: 'wrong-seed',
    reviewers: [completeReviewer(packet)]
  });
  assert.equal(results.pass, false);
  assert.equal(results.status, 'blocked');
  assert.ok(results.findings.some((item) => item.code === 'dogfood-fresh-review-source-invalid'));
});
