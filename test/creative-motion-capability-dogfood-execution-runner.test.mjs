import test from 'node:test';
import assert from 'node:assert/strict';

import { fingerprintCreativeValue } from '../modules/creative-intelligence-foundation/fingerprint.mjs';
import { buildCreativeMotionDogfoodGenerationSource } from '../modules/creative-motion-capability-dogfood/execution.mjs';
import { buildCreativeMotionDogfoodExecutionPlan, executeCreativeMotionDogfoodPlan, reviewCreativeMotionDogfoodExecutionPlan, sameCreativeMotionDogfoodProviderIdentity } from '../modules/creative-motion-capability-dogfood/execution-runner.mjs';
import { buildGeminiMotionDogfoodBudget } from '../modules/creative-motion-capability-dogfood/gemini-runner.mjs';

const projectId = 'benchmark-011-after-matter';
const brief = { projectId, title: 'After Matter', targetExperience: 'Material time remains readable.' };
const briefFingerprint = fingerprintCreativeValue(brief);
const model = 'gemini-3.5-flash-lite';
const identity = {
  schema: 'ai-studio-os/gemini-model-identity@1', requestedModel: model, providerModelName: `models/${model}`, providerBaseModelId: '', providerVersion: '3.5-flash-lite-07-2026', supportedGenerationMethods: ['generateContent'], inputTokenLimit: 1_048_576, outputTokenLimit: 65_536, providerMetadataFingerprint: 'm'.repeat(64), capturedAt: '2026-08-29T18:30:00.000Z'
};

function directControlRequest(overrides = {}) {
  return {
    schema: 'ai-studio-os/direct-model-motion-control-request@1', projectId, briefFingerprint, isolationAttestedBy: 'operator-01', isolationEvidenceRef: 'artifact://dogfood/e/isolation',
    truth: { directModelCreativeGeneration: true, aiStudioKnowledgeUsed: false, aiStudioTransferUsed: false, aiStudioSynthesisUsed: false, aiStudioMotionV2Used: false },
    ...overrides
  };
}

function sources(overrides = {}) {
  return ['A', 'B', 'C', 'D', 'E'].map((conditionId) => ({ conditionId, source: overrides[conditionId] ?? (conditionId === 'E' ? { directControlRequest: directControlRequest() } : {}) }));
}

function plan(overrides = {}) {
  return buildCreativeMotionDogfoodExecutionPlan({
    experimentId: 'benchmark-011-after-matter-v1', projectId, frozenBrief: brief, runRef: 'artifacts/dogfood/after-matter/run-001', modelIdentity: identity, conditionSources: sources(), budget: buildGeminiMotionDogfoodBudget(model), scheduleSeed: 'benchmark-011-schedule-v1', ...overrides
  });
}

test('Condition E instruction is derived from the exact attested direct-control source, not caller prompt text or source fingerprints', () => {
  const source = { directControlRequest: directControlRequest(), generationInstruction: 'substituted prompt', sourceSnapshotFingerprint: 'f'.repeat(64), authorityEvidenceRef: 'artifact://forged' };
  const result = buildCreativeMotionDogfoodGenerationSource({ trial: { conditionId: 'E', projectId, briefFingerprint }, brief, source });
  assert.equal(result.reviewReady, true);
  assert.equal(result.sourceSnapshotFingerprint, fingerprintCreativeValue(directControlRequest()));
  assert.equal(result.generationInstruction.includes('substituted prompt'), false);
  assert.equal(result.generationInstruction.includes('artifact://forged'), false);
  assert.equal(result.generationInstructionFingerprint, fingerprintCreativeValue(result.generationInstruction));
  assert.equal(result.truth.capabilityEvidenceReady, false);
});

test('plan rejects fabricated source fingerprints, refs and declarations because A-D are freshly checked against canonical upstream verifiers', () => {
  const forged = sources({
    A: { sourceSnapshotFingerprint: 'a'.repeat(64), authorityEvidenceRef: 'artifact://forged/a', architectureDeclaration: { truth: { motionV1CreativeGeneration: true } } },
    B: { sourceSnapshotFingerprint: 'b'.repeat(64), authorityEvidenceRef: 'artifact://forged/b', architectureDeclaration: { truth: { aiStudioMotionV2Used: true } } },
    C: { sourceSnapshotFingerprint: 'c'.repeat(64), authorityEvidenceRef: 'artifact://forged/c' },
    D: { sourceSnapshotFingerprint: 'd'.repeat(64), authorityEvidenceRef: 'artifact://forged/d' }
  });
  const result = plan({ conditionSources: forged });
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((item) => item.code === 'dogfood-v1-exploration-invalid'));
  assert.ok(result.findings.some((item) => item.code === 'dogfood-v2-reasoning-set-invalid'));
  assert.ok(result.findings.some((item) => item.code === 'dogfood-v2-knowledge-profile-drift'));
  assert.ok(result.findings.some((item) => item.code === 'dogfood-v2-synthesis-missing'));
  assert.equal(result.conditionBundles.find((item) => item.conditionId === 'A').sourceSnapshotFingerprint, fingerprintCreativeValue({ exploration: null, isolation: { schema: '', explorationFingerprint: '', isolationAttestedBy: '', isolationEvidenceRef: '', truth: { motionV1CreativeGeneration: false, aiStudioKnowledgeUsed: false, aiStudioTransferUsed: false, aiStudioSynthesisUsed: false, aiStudioMotionV2Used: false } } }));
});

test('provider identity comparison rejects a stale resource version or metadata fingerprint while ignoring only capture time', () => {
  assert.equal(sameCreativeMotionDogfoodProviderIdentity(identity, { ...identity, capturedAt: '2026-08-29T19:00:00.000Z' }), true);
  assert.equal(sameCreativeMotionDogfoodProviderIdentity(identity, { ...identity, providerVersion: '3.5-flash-lite-08-2026' }), false);
  assert.equal(sameCreativeMotionDogfoodProviderIdentity(identity, { ...identity, providerMetadataFingerprint: 'n'.repeat(64) }), false);
});

test('plan fingerprints and rejects deterministic schedule reordering', () => {
  const result = plan();
  const reordered = { ...result, schedule: [...result.schedule].reverse() };
  reordered.snapshotFingerprint = fingerprintCreativeValue({ ...reordered, findings: undefined, pass: undefined, status: undefined });
  const review = reviewCreativeMotionDogfoodExecutionPlan(reordered);
  assert.equal(review.pass, false);
  assert.ok(review.findings.some((item) => item.code === 'dogfood-executor-schedule-drift'));
});

test('executor makes zero provider requests when even one source bundle is invalid', async () => {
  const result = plan();
  let inspected = false;
  let generated = false;
  const run = await executeCreativeMotionDogfoodPlan(result, {
    runner: {
      inspectModelIdentity: async () => { inspected = true; return { ...identity, status: 'enrolled' }; },
      runPrototype: async () => { generated = true; return {}; }
    }
  });
  assert.equal(run.status, 'invalid');
  assert.equal(run.invalidReason, 'preflight-invalid');
  assert.equal(inspected, false);
  assert.equal(generated, false);
  assert.equal(run.truth.partialRunsNonResumable, true);
  assert.equal(run.truth.capabilityEvidenceReady, false);
});

test('pre-proof execution cannot be resumed or promoted by caller truth fields', async () => {
  const result = plan();
  const promoted = { ...result, truth: { ...result.truth, reviewReady: true, capabilityEvidenceReady: true, creativeDirectionApproved: true, technicalPlanningApproved: true, productionApproved: true } };
  const run = await executeCreativeMotionDogfoodPlan(promoted, { runner: {}, previousRun: { status: 'invalid', trialRuns: [{ trialId: 'trial-a-1' }] } });
  assert.equal(run.status, 'invalid');
  assert.equal(run.truth.replacementExperimentRequired, true);
  assert.ok(run.findings.some((item) => item.code === 'dogfood-executor-truth-drift'));
});
