import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DRAWING_REVIEW_SCHEMA,
  buildDrawingMemory,
  buildDrawingIntelligencePlan,
  buildGeometryIntent,
  reviewRenderedDrawing
} from '../modules/drawing-intelligence/runtime.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..', 'projects', 'ai-council');
const readJson = async (name) => JSON.parse(await fs.readFile(path.join(projectRoot, name), 'utf8'));

const input = await readJson('drawing-intelligence-authority-v1.json');
const memoryInput = await readJson('drawing-intelligence-memory-v1.json');

test('Drawing Intelligence separates semantic reasoning from vector execution', () => {
  const memory = buildDrawingMemory(memoryInput);
  assert.equal(memory.pass, true);
  const plan = buildDrawingIntelligencePlan(input, { memory });
  assert.equal(plan.pass, true);
  assert.equal(plan.reviewReady, true);
  assert.equal(plan.status, 'ready-for-render-proof');
  assert.equal(plan.executionAuthority, 'vector-geometry');
  assert.equal(plan.recommendedCandidate, null);
  assert.equal(plan.humanApproved, false);
});

test('Authority benchmark rejects learned divider/security metaphors before vector polishing', () => {
  const memory = buildDrawingMemory(memoryInput);
  const plan = buildDrawingIntelligencePlan(input, { memory });
  const divider = plan.candidates.find((candidate) => candidate.id === 'crossing-divider');
  const locked = plan.candidates.find((candidate) => candidate.id === 'locked-threshold');
  const asymmetric = plan.candidates.find((candidate) => candidate.id === 'asymmetric-threshold');

  assert.equal(divider.recommendationEligibility, false);
  assert.equal(locked.recommendationEligibility, false);
  assert.ok(divider.collisions.some((collision) => collision.source === 'drawing-memory'));
  assert.ok(locked.collisions.some((collision) => collision.source === 'drawing-memory'));
  assert.equal(asymmetric.recommendationEligibility, true);
  assert.equal(asymmetric.status, 'eligible-for-render-proof');
});

test('size-specific geometry intent retains only the semantic devices the target size can carry', () => {
  const memory = buildDrawingMemory(memoryInput);
  const plan = buildDrawingIntelligencePlan(input, { memory });
  const micro = buildGeometryIntent(plan, 'asymmetric-threshold', { size: 14 });
  const small = buildGeometryIntent(plan, 'asymmetric-threshold', { size: 16 });
  const master = buildGeometryIntent(plan, 'asymmetric-threshold', { size: 24 });

  assert.equal(micro.retainedSemanticDevices.length, 1);
  assert.equal(small.retainedSemanticDevices.length, 2);
  assert.equal(master.retainedSemanticDevices.length, 3);
  assert.equal(micro.rawSvgAllowed, false);
  assert.equal(micro.rawPathDataAllowed, false);
  assert.equal(micro.executionAuthority, 'vector-geometry');
});

test('Drawing Intelligence blocks raw SVG/path construction inside the reasoning plan', () => {
  const memory = buildDrawingMemory(memoryInput);
  const malformed = structuredClone(input);
  malformed.candidates[2].primitivePlan.svg = '<svg><path d="M4 4L20 20"/></svg>';
  const plan = buildDrawingIntelligencePlan(malformed, { memory });
  const candidate = plan.candidates.find((item) => item.id === 'asymmetric-threshold');
  assert.equal(candidate.recommendationEligibility, false);
  assert.ok(candidate.findings.some((item) => item.code === 'drawing-candidate-raw-vector-data-forbidden'));
});

test('project drawing memory catches rejected Git topology for later concepts', () => {
  const memory = buildDrawingMemory(memoryInput);
  const councilInput = structuredClone(input);
  councilInput.id = 'council-memory-regression';
  councilInput.conceptId = 'council';
  councilInput.semanticIntent.meaning = 'Multiple independent perspectives contributing to a Council judgment.';
  councilInput.candidates = [
    {
      id: 'git-like',
      metaphor: 'Three branches merge into a judgment.',
      metaphorCues: ['branch', 'merge'],
      geometryCues: ['bifurcation'],
      primitivePlan: { semanticDevices: ['plurality'], primitives: [{ id: 'plurality', kind: 'relation', role: 'perspectives' }] }
    },
    {
      id: 'discrete-field',
      metaphor: 'Independent marks remain discrete beside a synthesis state.',
      metaphorCues: ['discrete-perspectives', 'synthesis-state'],
      geometryCues: ['separate-marks'],
      primitivePlan: { semanticDevices: ['plurality'], primitives: [{ id: 'plurality', kind: 'marks', role: 'perspectives' }] }
    }
  ];
  const plan = buildDrawingIntelligencePlan(councilInput, { memory });
  assert.equal(plan.candidates[0].recommendationEligibility, false);
  assert.equal(plan.candidates[1].recommendationEligibility, true);
});

test('rendered Drawing Intelligence review cannot self-approve or create final vector authority', () => {
  const memory = buildDrawingMemory(memoryInput);
  const plan = buildDrawingIntelligencePlan(input, { memory });
  const candidateReviews = plan.candidates.map((candidate) => ({
    candidateId: candidate.id,
    labelBlindResemblance: 'Observed resemblance recorded for independent review.',
    textPairFit: 'Reviewed beside interface text.',
    uiContextFit: 'Reviewed in actual product context.',
    squintFamilyFit: 'Reviewed against sibling visual mass.',
    sizeChecks: plan.targetSizes.map((size) => ({ size, legible: true }))
  }));

  const review = reviewRenderedDrawing(plan, {
    schema: DRAWING_REVIEW_SCHEMA,
    planFingerprint: plan.planFingerprint,
    candidateReviews,
    humanApproved: false,
    finalVectorApproved: false
  });
  assert.equal(review.pass, true);
  assert.equal(review.reviewReady, true);
  assert.equal(review.recommendedCandidate, null);
  assert.equal(review.humanApproved, false);
  assert.equal(review.finalVectorApproved, false);

  const overclaim = reviewRenderedDrawing(plan, {
    schema: DRAWING_REVIEW_SCHEMA,
    planFingerprint: plan.planFingerprint,
    candidateReviews,
    humanApproved: true
  });
  assert.equal(overclaim.pass, false);
  assert.ok(overclaim.findings.some((item) => item.code === 'drawing-review-authority-overclaimed'));
});
