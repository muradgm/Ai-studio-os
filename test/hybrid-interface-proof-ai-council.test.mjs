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
  const plan = buildHybridProofPlan({ constitution });
  const baselineManifest = baselineProof();
  assert.equal(baselineManifest.reviewReady, true, JSON.stringify(baselineManifest.findings, null, 2));
  const renderedFrames = plan.frames.map((frame) => ({
    frameId: frame.id,
    screenId: frame.screenId,
    imageRef: `artifacts/ai-council/hybrid-v1/frames/${frame.id}.png`,
    sourceRef: `artifacts/ai-council/hybrid-v1/source-html/${frame.id}.html`,
    semanticFingerprint: `semantic-${frame.screenId}`
  }));
  const proof = buildHybridProofEvidence({
    plan,
    baselineManifest,
    renderedFrames,
    comparisonRefs: plan.screenIds.map((screenId) => `artifacts/ai-council/hybrid-v1/comparisons/${screenId}-decision-spine-vs-hybrid.png`),
    overviewRef: 'artifacts/ai-council/hybrid-v1/hybrid-v1-overview.png'
  });
  assert.equal(proof.reviewReady, true, JSON.stringify(proof.findings, null, 2));
  assert.equal(proof.status, 'ready-for-human-head-to-head-review');
  assert.equal(proof.candidateFrames.length, 8);
  assert.equal(proof.comparisonRefs.length, 8);
  assert.equal(proof.truth.humanVisualApproval, false);
});

test('Hybrid review hard-fails on semantic leakage even with a higher score', () => {
  const proof = buildHybridProofEvidence({
    plan: buildHybridProofPlan({ constitution }),
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
  const review = evaluateHybridReview({
    constitution,
    proof,
    hardFailResults: { 'threshold-leak': true },
    scores: { clarity: 9.3, reading: 9.2, provenance: 9.1, authority: 9.4, durability: 9.1, memory: 9.2, mobile: 9.0, distinctiveness: 9.2 }
  });
  assert.equal(review.pass, false);
  assert.equal(review.status, 'reject-or-revise');
  assert.ok(review.findings.some((item) => item.code === 'hybrid-review-hard-fail-triggered'));
});

test('Hybrid review cannot win unless it actually beats the 8.98 Decision Spine baseline', () => {
  const proof = buildHybridProofEvidence({
    plan: buildHybridProofPlan({ constitution }),
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
  const losing = evaluateHybridReview({ constitution, proof, hardFailResults: {}, scores: { a: 8.9, b: 8.9, c: 8.9, d: 8.9 } });
  assert.equal(losing.pass, false);
  assert.ok(losing.findings.some((item) => item.code === 'hybrid-review-did-not-beat-baseline'));

  const winning = evaluateHybridReview({ constitution, proof, hardFailResults: {}, scores: { a: 9.2, b: 9.1, c: 9.0, d: 9.2 } });
  assert.equal(winning.pass, true, JSON.stringify(winning.findings, null, 2));
  assert.equal(winning.status, 'candidate-outperformed-baseline-awaiting-human-selection');
  assert.equal(winning.truth.humanWorldSelectionConfirmed, false);
  assert.equal(winning.truth.humanVisualApproval, false);
});
