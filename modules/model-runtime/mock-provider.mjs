import { createModelProvider } from './runtime.mjs';

export function createMockModelProvider({
  id = 'mock-model',
  provider = 'local-mock',
  priority = 100,
  costTier = 'free',
  capabilities = ['reasoning', 'structured-output', 'critique', 'tool-planning'],
  operations = ['reason', 'critique', 'generate-structured', 'tool-plan'],
  responseFactory
} = {}) {
  return createModelProvider({
    id,
    provider,
    priority,
    costTier,
    available: true,
    capabilities,
    operations,
    models: ['deterministic-mock-v1'],
    defaultModel: 'deterministic-mock-v1',
    metadata: { live: false, deterministic: true, developmentOnly: true },
    async execute(task, context = {}) {
      const output = typeof responseFactory === 'function'
        ? await responseFactory(task, context)
        : {
            kind: 'mock-model-output',
            taskId: task.id,
            operation: task.operation,
            input: task.input ?? null
          };
      return {
        model: 'deterministic-mock-v1',
        output,
        usage: { measured: false, inputTokens: null, outputTokens: null },
        cost: { measured: false, amount: null, currency: null },
        provenance: { liveProviderCall: false, deterministic: true, developmentOnly: true },
        metadata: { testOrDevelopmentExecution: true }
      };
    }
  });
}
