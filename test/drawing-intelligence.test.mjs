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

function semanticPlan(deviceId = 'primary') {
  return {
    semanticDevices: [{ id: deviceId, label: deviceId, priority: 1 }],
    primitives: [{ id: `${deviceId}-mark`, kind: 'semantic-mark', role: deviceId, semanticDeviceId: deviceId }],
    relationships: []
  };
}

function conceptCandidate(id, metaphor, cues) {
  return {
    id,
    metaphor,
    metaphorCues: cues,
    geometryCues: cues,
    primitivePlan: semanticPlan(id)
  };
}

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

test('Authority master is state-neutral while remaining consequential', () => {
  const memory = buildDrawingMemory(memoryInput);
  const plan = buildDrawingIntelligencePlan(input, { memory });
  assert.equal(plan.pass, true);
  assert.match(plan.semanticIntent.meaning, /boundary between advisory judgment and consequential action/i);
  assert.ok(plan.semanticIntent.mustNotEncode.includes('authorized'));
  assert.ok(plan.semanticIntent.mustNotEncode.includes('approval-required'));

  const stateful = structuredClone(input);
  stateful.semanticIntent.mustCommunicate.push('authorized state is active');
  const invalid = buildDrawingIntelligencePlan(stateful, { memory });
  assert.equal(invalid.pass, false);
  assert.ok(invalid.findings.some((item) => item.code === 'drawing-semantic-state-neutrality-violated'));
});

test('Authority benchmark rejects learned divider/security metaphors before vector polishing', () => {
  const memory = buildDrawingMemory(memoryInput);
  const plan = buildDrawingIntelligencePlan(input, { memory });
  const divider = plan.candidates.find((candidate) => candidate.id === 'crossing-divider');
  const security = plan.candidates.find((candidate) => candidate.id === 'security-threshold');
  const asymmetric = plan.candidates.find((candidate) => candidate.id === 'asymmetric-domain-boundary');

  assert.equal(divider.recommendationEligibility, false);
  assert.equal(security.recommendationEligibility, false);
  assert.ok(divider.collisions.some((collision) => collision.source === 'drawing-memory'));
  assert.ok(security.collisions.some((collision) => collision.source === 'drawing-memory'));
  assert.equal(asymmetric.recommendationEligibility, true);
  assert.equal(asymmetric.status, 'eligible-for-render-proof');
});

test('size budget physically filters semantic devices, primitives and relationships before Vector Geometry', () => {
  const memory = buildDrawingMemory(memoryInput);
  const plan = buildDrawingIntelligencePlan(input, { memory });
  const micro = buildGeometryIntent(plan, 'asymmetric-domain-boundary', { size: 14 });
  const small = buildGeometryIntent(plan, 'asymmetric-domain-boundary', { size: 16 });
  const master = buildGeometryIntent(plan, 'asymmetric-domain-boundary', { size: 24 });

  assert.deepEqual(micro.retainedSemanticDevices.map((item) => item.id), ['boundary']);
  assert.deepEqual(micro.primitivePlan.primitives.map((item) => item.id), ['threshold']);
  assert.deepEqual(micro.primitivePlan.relationships, []);

  assert.deepEqual(small.retainedSemanticDevices.map((item) => item.id), ['boundary', 'domain-contrast']);
  assert.deepEqual(new Set(small.primitivePlan.primitives.map((item) => item.id)), new Set(['threshold', 'advisory-domain', 'consequence-domain']));
  assert.equal(small.primitivePlan.relationships.length, 2);
  assert.ok(!small.primitivePlan.primitives.some((item) => item.id === 'consequence-weight'));

  assert.equal(master.retainedSemanticDevices.length, 3);
  assert.equal(master.primitivePlan.primitives.length, 4);
  assert.equal(master.primitivePlan.relationships.length, 3);
  assert.equal(micro.rawSvgAllowed, false);
  assert.equal(micro.rawPathDataAllowed, false);
  assert.equal(micro.executionAuthority, 'vector-geometry');
});

test('semantic-plan allowlist blocks exact geometry even when it is not SVG', () => {
  const memory = buildDrawingMemory(memoryInput);
  const malformed = structuredClone(input);
  malformed.candidates[2].primitivePlan.primitives[0].points = [[4, 4], [12, 8]];
  const plan = buildDrawingIntelligencePlan(malformed, { memory });
  const candidate = plan.candidates.find((item) => item.id === 'asymmetric-domain-boundary');
  assert.equal(candidate.recommendationEligibility, false);
  assert.ok(candidate.findings.some((item) => item.code === 'drawing-candidate-exact-geometry-forbidden'));
});

test('raw SVG remains forbidden by the semantic-plan schema', () => {
  const memory = buildDrawingMemory(memoryInput);
  const malformed = structuredClone(input);
  malformed.candidates[2].primitivePlan.svg = '<svg><path d="M4 4L20 20"/></svg>';
  const plan = buildDrawingIntelligencePlan(malformed, { memory });
  const candidate = plan.candidates.find((item) => item.id === 'asymmetric-domain-boundary');
  assert.equal(candidate.recommendationEligibility, false);
  assert.ok(candidate.findings.some((item) => item.code === 'drawing-candidate-semantic-plan-schema-invalid'));
});

test('Drawing Memory blocks proven Git topology only for Council and Decision', () => {
  const memory = buildDrawingMemory(memoryInput);
  assert.equal(memory.pass, true);

  const councilInput = structuredClone(input);
  councilInput.id = 'council-memory-regression';
  councilInput.conceptId = 'council';
  councilInput.semanticIntent = {
    meaning: 'Multiple independent perspectives contributing to a Council judgment.',
    mustCommunicate: ['plural perspectives contribute to judgment'],
    mustNotMean: ['Git branch or merge operation'],
    mustNotEncode: [],
    contexts: ['Council review']
  };
  councilInput.candidates = [
    conceptCandidate('git-like', 'Three branches merge into a judgment.', ['branch', 'merge']),
    conceptCandidate('discrete-field', 'Independent marks remain discrete beside a synthesis state.', ['discrete-perspectives', 'synthesis-state'])
  ];
  const councilPlan = buildDrawingIntelligencePlan(councilInput, { memory });
  assert.equal(councilPlan.candidates[0].recommendationEligibility, false);
  assert.ok(councilPlan.candidates[0].collisions.some((item) => item.source === 'drawing-memory'));
  assert.equal(councilPlan.candidates[1].recommendationEligibility, true);

  const gitInput = structuredClone(councilInput);
  gitInput.id = 'version-control-lineage-regression';
  gitInput.conceptId = 'version-control-lineage';
  gitInput.semanticIntent = {
    meaning: 'Version-control branch and merge lineage.',
    mustCommunicate: ['branch relationships in version control'],
    mustNotMean: ['Council judgment'],
    mustNotEncode: [],
    contexts: ['repository history']
  };
  const gitPlan = buildDrawingIntelligencePlan(gitInput, { memory });
  const gitCandidate = gitPlan.candidates[0];
  assert.equal(gitCandidate.recommendationEligibility, true, 'learned vocabulary warns but concept-specific memory must not block a genuine Git concept');
  assert.ok(gitCandidate.collisions.some((item) => item.source === 'learned-visual-vocabulary'));
  assert.ok(!gitCandidate.collisions.some((item) => item.source === 'drawing-memory'));
});

test('Drawing Memory rejects project-wide wildcard bans', () => {
  const malformed = structuredClone(memoryInput);
  malformed.records.push({
    id: 'wildcard-ban',
    conceptId: '*',
    status: 'rejected',
    avoidCues: ['branch'],
    reason: 'Over-broad project ban.',
    evidenceRefs: ['regression']
  });
  const memory = buildDrawingMemory(malformed);
  assert.equal(memory.pass, false);
  assert.ok(memory.findings.some((item) => item.code === 'drawing-memory-record-invalid'));
});

test('relationships cannot reference undeclared primitives', () => {
  const memory = buildDrawingMemory(memoryInput);
  const malformed = structuredClone(input);
  malformed.candidates[2].primitivePlan.relationships.push({
    from: 'threshold',
    to: 'missing-primitive',
    type: 'invalid-reference',
    semanticDeviceId: 'boundary'
  });
  const plan = buildDrawingIntelligencePlan(malformed, { memory });
  const candidate = plan.candidates.find((item) => item.id === 'asymmetric-domain-boundary');
  assert.equal(candidate.recommendationEligibility, false);
  assert.ok(candidate.findings.some((item) => item.code === 'drawing-relationship-reference-invalid'));
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
