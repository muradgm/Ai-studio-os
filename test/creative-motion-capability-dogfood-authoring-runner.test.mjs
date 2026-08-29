import test from 'node:test';
import assert from 'node:assert/strict';
import { fingerprintCreativeValue } from '../modules/creative-intelligence-foundation/fingerprint.mjs';
import { buildCreativeMotionDogfoodAuthoringPlan, buildCreativeMotionDogfoodAuthoringTask, executeCreativeMotionDogfoodAuthoringPlan } from '../modules/creative-motion-capability-dogfood/authoring-runner.mjs';
import { buildCreativeMotionDogfoodExecutionSchedule } from '../modules/creative-motion-capability-dogfood/execution-runner.mjs';
import { buildGeminiMotionDogfoodBudget } from '../modules/creative-motion-capability-dogfood/gemini-runner.mjs';
import { buildCanonicalMotionAuthorityFixture } from '../fixtures/motion-creative-authority-fixture.mjs';

const canonical = buildCanonicalMotionAuthorityFixture('benchmark-011-authoring');
const projectId = canonical.projectId;
const frozenBrief = { projectId, title: 'After Matter', targetExperience: 'Material time remains readable.' };
const briefFingerprint = fingerprintCreativeValue(frozenBrief);
const model = 'gemini-3.5-flash-lite';
const modelIdentity = { schema: 'ai-studio-os/gemini-model-identity@1', requestedModel: model, providerModelName: 'models/' + model, providerBaseModelId: '', providerVersion: '3.5-flash-lite-07-2026', supportedGenerationMethods: ['generateContent'], inputTokenLimit: 1_048_576, outputTokenLimit: 65_536, providerMetadataFingerprint: 'm'.repeat(64), capturedAt: '2026-08-29T18:30:00.000Z' };

function contexts(overrides = {}) {
  return ['A', 'B', 'C', 'D', 'E'].map((conditionId) => ({
    conditionId,
    context: overrides[conditionId] ?? (conditionId === 'A'
      ? { v1AuthoringContract: { schema: 'ai-studio-os/motion-v1-dogfood-isolation@1', isolationAttestedBy: 'operator-01', isolationEvidenceRef: 'artifact://isolation/a', truth: { motionV1CreativeGeneration: true, aiStudioKnowledgeUsed: false, aiStudioTransferUsed: false, aiStudioSynthesisUsed: false, aiStudioMotionV2Used: false } } }
      : conditionId === 'E'
        ? { directControlRequest: { schema: 'ai-studio-os/direct-model-motion-control-request@1', projectId, briefFingerprint, isolationAttestedBy: 'operator-01', isolationEvidenceRef: 'artifact://isolation/e', truth: { directModelCreativeGeneration: true, aiStudioKnowledgeUsed: false, aiStudioTransferUsed: false, aiStudioSynthesisUsed: false, aiStudioMotionV2Used: false } } }
        : {})
  }));
}
function plan(overrides = {}) { return buildCreativeMotionDogfoodAuthoringPlan({ experimentId: 'benchmark-011-authoring-v1', projectId, frozenBrief, selectedCreativeWorld: canonical.selectedCreativeWorld, canonicalCreativeAuthority: canonical, modelIdentity, conditionContexts: contexts(), budget: buildGeminiMotionDogfoodBudget(model), scheduleSeed: 'benchmark-011-schedule-v1', ...overrides }); }

test('A/B/C/D authoring tasks contain pre-authoring context rather than completed Motion artifacts', () => {
  const task = JSON.parse(buildCreativeMotionDogfoodAuthoringTask({ trial: { trialId: 'trial-a-1', conditionId: 'A' }, frozenBrief, selectedCreativeWorld: canonical.selectedCreativeWorld, context: contexts().find((item) => item.conditionId === 'A').context }));
  assert.deepEqual(task.frozenBrief, frozenBrief);
  assert.deepEqual(task.selectedCreativeWorld, canonical.selectedCreativeWorld);
  for (const key of ['exploration', 'reasoningSet', 'handoff', 'hypotheses']) assert.equal(Object.hasOwn(task, key), false);
});

test('the frozen seeded schedule remains the source of planned provider call order and controls', () => {
  const result = plan();
  assert.deepEqual(result.schedule, buildCreativeMotionDogfoodExecutionSchedule('benchmark-011-schedule-v1'));
  assert.equal(new Set(result.schedule.map((item) => item.conditionId)).size, 5);
  assert.equal(result.generationBudget.maxGenerationAttempts, 1);
  assert.equal(result.generationBudget.tokenBudget, buildGeminiMotionDogfoodBudget(model).tokenBudget);
});

test('invalid B/C/D static knowledge contexts make zero provider calls', async () => {
  const result = plan();
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((item) => item.code === 'dogfood-authoring-v2-context-invalid'));
  let calls = 0;
  const run = await executeCreativeMotionDogfoodAuthoringPlan(result, { runner: { inspectModelIdentity: async () => ({ ...modelIdentity, status: 'enrolled' }), runPrototype: async () => { calls += 1; return {}; } } });
  assert.equal(run.invalidReason, 'preflight-invalid');
  assert.equal(calls, 0);
  assert.equal(run.truth.partialRunsNonResumable, true);
  assert.equal(run.truth.creativeDirectionApproved, false);
  assert.equal(run.truth.productionApproved, false);
});

test('a completed exploration embedded in A context is rejected before any generation', () => {
  const a = contexts().find((item) => item.conditionId === 'A').context;
  const result = plan({ conditionContexts: contexts({ A: { ...a, exploration: { schema: 'forged' } } }) });
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((item) => item.code === 'dogfood-authoring-context-completed-artifact-forbidden'));
});
