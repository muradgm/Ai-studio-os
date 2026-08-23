import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

import { buildProductUXArchitecture } from '../modules/product-ux-architecture/runtime.mjs';
import { buildProductUXArchitectureReference } from '../modules/product-ux-architecture/reference.mjs';
import { buildCanonicalInterfaceFixture, buildCanonicalInterfaceFixtureReference } from '../modules/interface-world-proof/fixture.mjs';
import { buildInterfaceWorldProofPlan, buildInterfaceWorldProofEvidence } from '../modules/interface-world-proof/runtime.mjs';
import { buildHybridConstitution, buildHybridProofPlan, buildHybridProofEvidence, evaluateHybridReview } from '../modules/interface-world-proof/hybrid.mjs';

const read = async (name) => JSON.parse(await fs.readFile(new URL(`../projects/ai-council/${name}`, import.meta.url), 'utf8'));
const architectureInput = await read('product-ux-architecture.json');
const fixtureInput = await read('canonical-ux-fixture.json');
const exploration = await read('creative-worlds.json');
const constitutionInput = await read('hybrid-constitution-v1.json');
const architecture = buildProductUXArchitecture(architectureInput);
const architectureRef = buildProductUXArchitectureReference(architecture);
const fixture = buildCanonicalInterfaceFixture(fixtureInput, { architectureRef });
const fixtureRef = buildCanonicalInterfaceFixtureReference(fixture, { architectureRef });
const constitution = buildHybridConstitution(constitutionInput, { architectureRef, fixtureRef });
const allHardFailsClear = Object.fromEntries(constitution.hardFailConditions.map((item) => [item.id, false]));
const winningScores = { conversation: 9.2, reading: 9.1, provenance: 9.0, authority: 9.2, durability: 9.1, memory: 9.0, mobile: 9.0, distinctiveness: 9.1 };

function baselineProof() {
  const plan = buildInterfaceWorldProofPlan({ architecture, exploration, fixture });
  const renderedFrames = plan.frames.map((frame) => ({
    frameId: frame.id,
    worldId: frame.worldId,
    screenId: frame.screenId,
    imageRef: `artifacts/ai-council/canonical-interface-world-proof-v1/frames/${frame.id}.png`,
    sourceRef: `artifacts/ai-council/canonical-interface-world-proof-v1/source-html/${frame.id}.html`,
    semanticFingerprint: `semantic-${frame.screenId}`
  }));
  return buildInterfaceWorldProofEvidence({
    plan,
    renderedFrames,
    comparisonRefs: plan.screenIds.map((screenId) => `artifacts/ai-council/canonical-interface-world-proof-v1/comparisons/${screenId}-comparison.png`),
    overviewRefs: plan.explorationRef.worldIds.map((worldId) => `artifacts/ai-council/canonical-interface-world-proof-v1/world-overviews/${worldId}-overview.png`)
  });
}

function hybridProof() {
  const plan = buildHybridProofPlan({ constitution });
  return buildHybridProofEvidence({
    plan,
    baselineManifest: baselineProof(),
    renderedFrames: fixtureRef.screenIds.map((screenId) => ({
      frameId: `${constitution.candidateId}-${screenId}`,
      screenId,
      imageRef: `${screenId}.png`,
      sourceRef: `${screenId}.html`,
      semanticFingerprint: `semantic-${screenId}`
    })),
    comparisonRefs: fixtureRef.screenIds.map((screenId) => `${screenId}-comparison.png`),
    overviewRef: 'hybrid-overview.png'
  });
}

test('Hybrid Constitution V1 binds non-overlapping source roles to the frozen eight-screen fixture', () => {
  assert.equal(constitution.reviewReady, true, JSON.stringify(constitution.findings, null, 2));
  assert.equal(constitution.baseline.worldId, 'decision-spine');
  assert.equal(constitution.baseline.weightedScore, 8.98);
  assert.equal(constitution.screenHierarchy.length, 8);
  assert.deepEqual(constitution.screenHierarchy.map((item) => item.screenId), fixtureRef.screenIds);
  assert.equal(constitution.proofQuestions.length, 8);
  assert.ok(constitution.hardFailConditions.length >= 8);
  assert.equal(constitution.truth.humanWorldSelectionConfirmed, false);
});

test('Hybrid proof plan is a direct Decision Spine versus Hybrid eight-screen benchmark', () => {
  const plan = buildHybridProofPlan({ constitution });
  assert.equal(plan.reviewReady, true, JSON.stringify(plan.findings, null, 2));
  assert.equal(plan.frames.length, 8);
  assert.equal(plan.comparisons.length, 8);
  assert.equal(plan.baselineWorldId, 'decision-spine');
  assert.equal(plan.baselineScore, 8.98);
  assert.deepEqual(plan.screenIds, fixtureRef.screenIds);
});

test('Hybrid proof requires current Decision Spine baseline plus exact eight-screen candidate evidence', () => {
  const proof = hybridProof();
  assert.equal(proof.reviewReady, true, JSON.stringify(proof.findings, null, 2));
  assert.equal(proof.status, 'ready-for-human-head-to-head-review');
  assert.equal(proof.candidateFrames.length, 8);
  assert.equal(proof.comparisonRefs.length, 8);
  assert.equal(proof.truth.humanVisualApproval, false);
});

test('Hybrid review cannot silently treat unreviewed hard-fail conditions as clear', () => {
  const review = evaluateHybridReview({ constitution, proof: hybridProof(), hardFailResults: {}, scores: winningScores });
  assert.equal(review.pass, false);
  assert.ok(review.findings.some((item) => item.code === 'hybrid-review-hard-fails-unreviewed'));
});

test('Hybrid review requires all eight proof questions to be scored', () => {
  const review = evaluateHybridReview({ constitution, proof: hybridProof(), hardFailResults: allHardFailsClear, scores: { a: 9.2, b: 9.1, c: 9.0 } });
  assert.equal(review.pass, false);
  assert.ok(review.findings.some((item) => item.code === 'hybrid-review-proof-questions-incomplete'));
});

test('Hybrid review hard-fails on semantic leakage even with a higher score', () => {
  const hardFails = { ...allHardFailsClear, 'threshold-leak': true };
  const review = evaluateHybridReview({ constitution, proof: hybridProof(), hardFailResults: hardFails, scores: winningScores });
  assert.equal(review.pass, false);
  assert.equal(review.status, 'reject-or-revise');
  assert.ok(review.findings.some((item) => item.code === 'hybrid-review-hard-fail-triggered'));
});

test('Hybrid review cannot win unless it actually beats the 8.98 Decision Spine baseline', () => {
  const losingScores = { conversation: 8.9, reading: 8.9, provenance: 8.9, authority: 8.9, durability: 8.9, memory: 8.9, mobile: 8.9, distinctiveness: 8.9 };
  const losing = evaluateHybridReview({ constitution, proof: hybridProof(), hardFailResults: allHardFailsClear, scores: losingScores });
  assert.equal(losing.pass, false);
  assert.ok(losing.findings.some((item) => item.code === 'hybrid-review-did-not-beat-baseline'));

  const winning = evaluateHybridReview({ constitution, proof: hybridProof(), hardFailResults: allHardFailsClear, scores: winningScores });
  assert.equal(winning.pass, true, JSON.stringify(winning.findings, null, 2));
  assert.equal(winning.scoreCount, 8);
  assert.equal(winning.status, 'candidate-outperformed-baseline-awaiting-human-selection');
  assert.equal(winning.truth.humanWorldSelectionConfirmed, false);
  assert.equal(winning.truth.humanVisualApproval, false);
});
