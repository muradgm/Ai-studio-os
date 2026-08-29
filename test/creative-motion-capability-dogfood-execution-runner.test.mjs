import test from 'node:test';
import assert from 'node:assert/strict';

import { fingerprintCreativeValue } from '../modules/creative-intelligence-foundation/fingerprint.mjs';
import { buildCreativeMotionDogfoodExecutionPlan, executeCreativeMotionDogfoodPlan, reviewCreativeMotionDogfoodExecutionPlan } from '../modules/creative-motion-capability-dogfood/execution-runner.mjs';
import { buildGeminiMotionDogfoodBudget } from '../modules/creative-motion-capability-dogfood/gemini-runner.mjs';

const model = 'gemini-3.5-flash-lite';
const identity = {
  schema: 'ai-studio-os/gemini-model-identity@1', requestedModel: model, providerModelName: `models/${model}`, providerBaseModelId: model, providerVersion: '3.5', supportedGenerationMethods: ['generateContent'], inputTokenLimit: 1_000_000, outputTokenLimit: 8_000, providerMetadataFingerprint: 'm'.repeat(64), capturedAt: '2026-08-29T18:30:00.000Z'
};

function truthFor(conditionId) {
  if (conditionId === 'A') return { motionV1CreativeGeneration: true, aiStudioKnowledgeUsed: false, aiStudioTransferUsed: false, aiStudioSynthesisUsed: false, aiStudioMotionV2Used: false, directModelCreativeGeneration: false };
  if (conditionId === 'B' || conditionId === 'C') return { motionV1CreativeGeneration: false, aiStudioKnowledgeUsed: true, aiStudioTransferUsed: false, aiStudioSynthesisUsed: false, aiStudioMotionV2Used: true, directModelCreativeGeneration: false };
  if (conditionId === 'D') return { motionV1CreativeGeneration: false, aiStudioKnowledgeUsed: true, aiStudioTransferUsed: true, aiStudioSynthesisUsed: true, aiStudioMotionV2Used: true, directModelCreativeGeneration: false };
  return { motionV1CreativeGeneration: false, aiStudioKnowledgeUsed: false, aiStudioTransferUsed: false, aiStudioSynthesisUsed: false, aiStudioMotionV2Used: false, directModelCreativeGeneration: true };
}

function materials() {
  return ['A', 'B', 'C', 'D', 'E'].map((conditionId) => ({
    conditionId,
    generationInstruction: `Generate three ${conditionId} motion hypotheses as structured JSON.`,
    sourceSnapshotFingerprint: conditionId.toLowerCase().repeat(64),
    authorityEvidenceRef: `artifact://dogfood/authority/${conditionId.toLowerCase()}`,
    architectureDeclaration: { schema: 'ai-studio-os/dogfood-condition-declaration@1', truth: truthFor(conditionId) }
  }));
}

function plan(overrides = {}) {
  return buildCreativeMotionDogfoodExecutionPlan({
    experimentId: 'benchmark-011-after-matter-v1', projectId: 'benchmark-011-after-matter', briefFingerprint: 'b'.repeat(64), runRef: 'artifacts/dogfood/after-matter/run-001', modelIdentity: identity, conditionMaterials: materials(), budget: buildGeminiMotionDogfoodBudget(model), ...overrides
  });
}

test('execution plan binds all fifteen trials to one enrolled provider identity and fixed controls without gaining authority', () => {
  const result = plan();
  assert.equal(result.pass, true);
  assert.equal(result.status, 'ready-for-pre-proof-execution');
  assert.equal(result.trials.length, 15);
  assert.equal(new Set(result.trials.map((item) => item.runtimeTraceRef)).size, 15);
  assert.ok(result.trials.every((item) => item.generationBudget.modelPolicyId === `gemini/${model}@dogfood-v1`));
  assert.equal(result.truth.reviewReady, false);
  assert.equal(result.truth.capabilityEvidenceReady, false);
  assert.equal(result.truth.productionApproved, false);
});

test('execution plan rejects a mutable latest model alias before any provider execution', () => {
  const result = plan({ modelIdentity: { ...identity, requestedModel: 'gemini-flash-lite-latest' } });
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((item) => item.code === 'dogfood-executor-provider-model-mutable'));
});

test('execution plan rejects an attempt to turn pre-proof output into review or production authority', () => {
  const result = plan();
  const promoted = { ...result, truth: { ...result.truth, reviewReady: true } };
  const review = reviewCreativeMotionDogfoodExecutionPlan(promoted);
  assert.equal(review.pass, false);
  assert.ok(review.findings.some((item) => item.code === 'dogfood-executor-truth-drift'));
  assert.ok(review.findings.some((item) => item.code === 'dogfood-executor-plan-fingerprint-drift'));
});

test('execution plan rejects architecture declarations that relabel a condition', () => {
  const invalidMaterials = materials();
  invalidMaterials[3].architectureDeclaration.truth.aiStudioSynthesisUsed = false;
  const result = plan({ conditionMaterials: invalidMaterials });
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((item) => item.code === 'dogfood-executor-architecture-declaration-drift'));
});

test('execution plan rejects a recomputed plan whose submitted material no longer matches trial bindings', () => {
  const result = plan();
  const drifted = {
    ...result,
    conditionMaterials: result.conditionMaterials.map((item) => item.conditionId === 'D' ? { ...item, generationInstruction: 'A substituted prompt.' } : item)
  };
  drifted.snapshotFingerprint = fingerprintCreativeValue({
    schema: drifted.schema,
    stage: drifted.stage,
    experimentId: drifted.experimentId,
    projectId: drifted.projectId,
    briefFingerprint: drifted.briefFingerprint,
    modelIdentity: drifted.modelIdentity,
    generationBudget: drifted.generationBudget,
    conditionMaterials: drifted.conditionMaterials,
    trials: drifted.trials,
    truth: drifted.truth
  });
  const review = reviewCreativeMotionDogfoodExecutionPlan(drifted);
  assert.equal(review.pass, false);
  assert.ok(review.findings.some((item) => item.code === 'dogfood-executor-trial-material-binding-drift'));
});

test('executor runs every planned trial once in canonical order and does not promote pre-proof output', async () => {
  const result = plan();
  const observed = [];
  const runner = {
    async runPrototype({ trial, generationInstruction, architectureDeclaration, runtimeEvidenceRef }) {
      observed.push(trial.trialId);
      return {
        status: 'produced', trial, runtimeControl: { runtimeEvidenceRef }, generatedDraft: { hypotheses: [{ id: generationInstruction, declaration: architectureDeclaration }] }, findings: []
      };
    }
  };
  const run = await executeCreativeMotionDogfoodPlan(result, { runner });
  assert.equal(run.status, 'produced');
  assert.deepEqual(observed, result.trials.map((item) => item.trialId));
  assert.equal(run.trialRuns.length, 15);
  assert.equal(run.truth.retryCount, 0);
  assert.equal(run.truth.reviewReady, false);
  assert.equal(run.truth.productionApproved, false);
});

test('executor fails closed without contacting a provider when the plan has drifted', async () => {
  const result = plan();
  const drifted = { ...result, trials: result.trials.map((item, index) => index === 0 ? { ...item, briefFingerprint: 'x'.repeat(64) } : item) };
  let contacted = false;
  const run = await executeCreativeMotionDogfoodPlan(drifted, { runner: { runPrototype: async () => { contacted = true; return {}; } } });
  assert.equal(run.status, 'blocked');
  assert.equal(contacted, false);
  assert.ok(run.findings.some((item) => item.code === 'dogfood-executor-plan-fingerprint-drift'));
  assert.equal(reviewCreativeMotionDogfoodExecutionPlan(drifted).pass, false);
});
