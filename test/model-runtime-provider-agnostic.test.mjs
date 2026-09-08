import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createModelProvider,
  createModelRegistry,
  routeModelTask,
  executeModelTask,
  createMockModelProvider
} from '../modules/model-runtime/index.mjs';

function provider(overrides = {}) {
  return createModelProvider({
    id: overrides.id ?? 'provider-a',
    provider: overrides.provider ?? 'vendor-a',
    operations: overrides.operations ?? ['reason'],
    capabilities: overrides.capabilities ?? ['reasoning'],
    models: overrides.models ?? ['model-a'],
    defaultModel: overrides.defaultModel ?? 'model-a',
    available: overrides.available ?? true,
    costTier: overrides.costTier ?? 'medium',
    priority: overrides.priority ?? 0,
    execute: overrides.execute ?? (async () => ({ output: { ok: true } }))
  });
}

test('routes by capability, availability, budget and priority rather than vendor identity', () => {
  const registry = createModelRegistry([
    provider({ id: 'cheap', provider: 'vendor-z', costTier: 'low', priority: 5 }),
    provider({ id: 'preferred-by-priority', provider: 'vendor-a', costTier: 'low', priority: 10 }),
    provider({ id: 'expensive', provider: 'vendor-b', costTier: 'high', priority: 100 })
  ]);
  const routed = routeModelTask({
    registry,
    task: { id: 't1', operation: 'reason', requiredCapabilities: ['reasoning'], budgetTier: 'low' }
  });
  assert.equal(routed.pass, true);
  assert.equal(routed.assignment.providerId, 'preferred-by-priority');
  assert.equal(routed.trace.find((item) => item.providerId === 'expensive').reasons.includes('over-budget'), true);
});

test('fails closed when no eligible provider is available', () => {
  const registry = createModelRegistry([
    provider({ id: 'offline', available: false }),
    provider({ id: 'wrong-op', operations: ['critique'] })
  ]);
  const routed = routeModelTask({ registry, task: { id: 't2', operation: 'reason', requiredCapabilities: ['reasoning'] } });
  assert.equal(routed.pass, false);
  assert.equal(routed.assignment, null);
  assert.equal(routed.findings.some((item) => item.code === 'model-provider-unavailable'), true);
});

test('preferred model is a task constraint and does not silently substitute an incompatible provider', () => {
  const registry = createModelRegistry([
    provider({ id: 'a', models: ['alpha'], defaultModel: 'alpha' }),
    provider({ id: 'b', models: ['beta'], defaultModel: 'beta' })
  ]);
  const routed = routeModelTask({ registry, task: { id: 't3', operation: 'reason', requiredCapabilities: ['reasoning'], preferredModel: 'beta' } });
  assert.equal(routed.pass, true);
  assert.equal(routed.assignment.providerId, 'b');
  assert.equal(routed.assignment.model, 'beta');
});

test('unknown preferred model fails closed when no provider explicitly declares it', () => {
  const registry = createModelRegistry([
    provider({ id: 'declared', models: ['alpha'] }),
    provider({ id: 'undeclared', models: [] })
  ]);
  const routed = routeModelTask({ registry, task: { id: 't3b', operation: 'reason', requiredCapabilities: ['reasoning'], preferredModel: 'gamma' } });
  assert.equal(routed.pass, false);
  assert.equal(routed.trace.every((item) => item.reasons.includes('preferred-model-unavailable')), true);
});

test('mock provider executes without network credentials and returns non-authoritative output', async () => {
  const registry = createModelRegistry([createMockModelProvider()]);
  const result = await executeModelTask({
    registry,
    task: { id: 't4', operation: 'generate-structured', requiredCapabilities: ['structured-output'], budgetTier: 'free', input: { brief: 'test' } }
  });
  assert.equal(result.pass, true);
  assert.equal(result.execution.provenance.liveProviderCall, false);
  assert.deepEqual(result.execution.output.input, { brief: 'test' });
  assert.equal(result.execution.authority.candidateOnly, true);
  assert.equal(result.execution.authority.humanApproved, false);
  assert.equal(result.execution.authority.productionReady, false);
});

test('provider self-asserted approval cannot cross the model runtime authority boundary', async () => {
  const registry = createModelRegistry([
    provider({
      execute: async () => ({
        output: { proposal: 'candidate' },
        authority: { humanApproved: true, productionReady: true },
        metadata: { humanApproved: true }
      })
    })
  ]);
  const result = await executeModelTask({ registry, task: { id: 't5', operation: 'reason', requiredCapabilities: ['reasoning'] } });
  assert.equal(result.pass, true);
  assert.equal(result.execution.authority.humanApproved, false);
  assert.equal(result.execution.authority.productionReady, false);
  assert.equal('humanApproved' in result.execution.metadata, false);
});

test('provider exceptions become blocker findings rather than escaping the runtime', async () => {
  const registry = createModelRegistry([
    provider({ id: 'broken', execute: async () => { throw new Error('network down'); } })
  ]);
  const result = await executeModelTask({ registry, task: { id: 't6', operation: 'reason', requiredCapabilities: ['reasoning'] } });
  assert.equal(result.pass, false);
  assert.equal(result.execution, null);
  assert.equal(result.findings.some((item) => item.code === 'model-provider-execution-failed'), true);
});

test('duplicate provider ids are rejected', () => {
  assert.throws(() => createModelRegistry([provider({ id: 'same' }), provider({ id: 'same', provider: 'vendor-b' })]), /model-provider-duplicate/);
});

test('inherited object keys cannot bypass provider or task budget validation', () => {
  for (const costTier of ['constructor', 'toString', '__proto__', '', false, 0]) {
    assert.throws(() => createModelRegistry([{ ...provider(), costTier }]), /model-provider-invalid/);
    assert.throws(() => createModelProvider({ ...provider(), costTier }), /model-provider-invalid/);
    const routed = routeModelTask({
      registry: createModelRegistry([provider()]),
      task: { id: 'invalid-budget', operation: 'reason', budgetTier: costTier }
    });
    assert.equal(routed.pass, false);
    assert.equal(routed.assignment, null);
    assert.ok(routed.findings.some((item) => item.code === 'model-task-budget-tier-invalid'));
  }
});
