import test from 'node:test';
import assert from 'node:assert/strict';

import { buildGeminiMotionDogfoodBudget, createGeminiMotionDogfoodRunner } from '../modules/creative-motion-capability-dogfood/gemini-runner.mjs';

const apiKey = 'test-secret-key';
const model = 'gemini-test-model';

function trial(overrides = {}) {
  return {
    trialId: 'preflight-e-1',
    conditionId: 'E',
    projectId: 'benchmark-011-after-matter',
    briefFingerprint: 'b'.repeat(64),
    runtimeTraceRef: 'artifact://dogfood-011/preflight/trace.json',
    generationBudget: buildGeminiMotionDogfoodBudget(model),
    ...overrides
  };
}

function declaration() {
  return {
    operatorAttested: true,
    truth: {
      directModelCreativeGeneration: true,
      aiStudioKnowledgeUsed: false,
      aiStudioTransferUsed: false,
      aiStudioSynthesisUsed: false,
      aiStudioMotionV2Used: false
    }
  };
}

function successfulFetch(responseBody, observe = () => {}) {
  return async (url, options) => {
    observe(url, options);
    return { ok: true, status: 200, json: async () => responseBody };
  };
}

test('Gemini dogfood runner records a bounded prototype without exposing its API key or claiming review authority', async () => {
  let observed;
  const runner = createGeminiMotionDogfoodRunner({
    apiKey,
    model,
    now: () => new Date('2026-08-29T10:00:00.000Z'),
    fetchImpl: successfulFetch({
      candidates: [{ content: { parts: [{ text: JSON.stringify({ hypotheses: [{ id: 'material-memory', premise: 'Wear changes sequence.' }] }) }] } }],
      usageMetadata: { promptTokenCount: 40, candidatesTokenCount: 80, totalTokenCount: 120 }
    }, (url, options) => { observed = { url, options }; })
  });
  const result = await runner.runPrototype({
    trial: trial(),
    generationInstruction: 'Return one direct-model hypothesis as JSON.',
    architectureDeclaration: declaration(),
    runtimeEvidenceRef: 'artifacts/dogfood/preflight.json'
  });

  assert.equal(result.status, 'produced');
  assert.equal(result.truth.prototypeOnly, true);
  assert.equal(result.truth.reviewReady, false);
  assert.equal(result.truth.capabilityEvidenceReady, false);
  assert.equal(result.truth.providerFallbackUsed, false);
  assert.deepEqual(result.generatedDraft, { hypotheses: [{ id: 'material-memory', premise: 'Wear changes sequence.' }] });
  assert.match(observed.url, /models\/gemini-test-model:generateContent$/);
  assert.equal(observed.url.includes(apiKey), false);
  assert.equal(observed.options.headers['x-goog-api-key'], apiKey);
  assert.equal(JSON.parse(observed.options.body).generationConfig.temperature, 0.7);
  assert.equal(JSON.parse(observed.options.body).generationConfig.maxOutputTokens, 1200);
  assert.equal(JSON.stringify(result).includes(apiKey), false);
  assert.equal(result.runtimeControl.tokenBudget, 1200);
});

test('Gemini dogfood runner fails closed on policy drift and never contacts a provider', async () => {
  let contacted = false;
  const runner = createGeminiMotionDogfoodRunner({ apiKey, model, fetchImpl: async () => { contacted = true; throw new Error('should not run'); } });
  const result = await runner.runPrototype({
    trial: trial({ generationBudget: { ...buildGeminiMotionDogfoodBudget(model), modelPolicyId: 'other-provider' } }),
    generationInstruction: 'Return JSON.',
    architectureDeclaration: declaration(),
    runtimeEvidenceRef: 'artifacts/dogfood/preflight.json'
  });
  assert.equal(result.status, 'blocked');
  assert.equal(contacted, false);
  assert.ok(result.findings.some((item) => item.code === 'gemini-dogfood-policy-model-drift'));
});

test('Gemini dogfood runner rejects malformed structured output and retains no production authority', async () => {
  const runner = createGeminiMotionDogfoodRunner({
    apiKey,
    model,
    fetchImpl: successfulFetch({ candidates: [{ content: { parts: [{ text: 'not json' }] } }] })
  });
  const result = await runner.runPrototype({
    trial: trial(),
    generationInstruction: 'Return JSON.',
    architectureDeclaration: declaration(),
    runtimeEvidenceRef: 'artifacts/dogfood/preflight.json'
  });
  assert.equal(result.status, 'blocked');
  assert.equal(result.truth.productionApproved, false);
  assert.ok(result.findings.some((item) => item.code === 'gemini-dogfood-structured-output-invalid'));
});

test('Gemini dogfood runner reports provider rejection without returning secret configuration', async () => {
  const runner = createGeminiMotionDogfoodRunner({
    apiKey,
    model,
    fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({ error: { message: `quota for ${apiKey}` } }) })
  });
  const result = await runner.runPrototype({
    trial: trial(),
    generationInstruction: 'Return JSON.',
    architectureDeclaration: declaration(),
    runtimeEvidenceRef: 'artifacts/dogfood/preflight.json'
  });
  assert.equal(result.status, 'blocked');
  assert.ok(result.findings.some((item) => item.code === 'gemini-dogfood-provider-rejected-request'));
  assert.equal(JSON.stringify(result).includes(apiKey), false);
});

test('formal model enrollment records provider identity and rejects a mutable latest alias before the provider is contacted', async () => {
  let observed;
  const runner = createGeminiMotionDogfoodRunner({
    apiKey,
    model,
    now: () => new Date('2026-08-29T11:00:00.000Z'),
    fetchImpl: successfulFetch({
      name: `models/${model}`,
      baseModelId: model,
      version: 'test-001',
      supportedGenerationMethods: ['generateContent'],
      inputTokenLimit: 100_000,
      outputTokenLimit: 4_000
    }, (url, options) => { observed = { url, options }; })
  });
  const enrolled = await runner.inspectModelIdentity();
  assert.equal(enrolled.status, 'enrolled');
  assert.equal(enrolled.providerVersion, 'test-001');
  assert.match(observed.url, /models\/gemini-test-model$/);
  assert.equal(observed.options.headers['x-goog-api-key'], apiKey);
  assert.equal(JSON.stringify(enrolled).includes(apiKey), false);

  let contacted = false;
  const latestRunner = createGeminiMotionDogfoodRunner({ apiKey, model: 'gemini-flash-latest', fetchImpl: async () => { contacted = true; return {}; } });
  const rejected = await latestRunner.inspectModelIdentity();
  assert.equal(rejected.status, 'blocked');
  assert.equal(contacted, false);
  assert.ok(rejected.findings.some((item) => item.code === 'gemini-dogfood-mutable-model-alias'));
});
