const COST_ORDER = Object.freeze({ free: 0, low: 1, medium: 2, high: 3 });
const DEFAULT_OPERATIONS = Object.freeze(['reason', 'critique', 'generate-structured', 'tool-plan']);

function clean(value) {
  return String(value ?? '').trim();
}

function normalizeCapabilities(values = []) {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function finding(severity, code, message, details = {}) {
  return { severity, code, message, ...details };
}

function supportsAll(provider, required = []) {
  const capabilities = new Set(provider.capabilities ?? []);
  return required.every((capability) => capabilities.has(capability));
}

function supportsOperation(provider, operation) {
  return new Set(provider.operations ?? []).has(operation);
}

function validateProvider(provider = {}) {
  const findings = [];
  if (!clean(provider.id)) findings.push(finding('blocker', 'model-provider-id-missing', 'Model provider id is required.'));
  if (!clean(provider.provider)) findings.push(finding('blocker', 'model-provider-label-missing', 'Model provider label is required.'));
  if (typeof provider.execute !== 'function') findings.push(finding('blocker', 'model-provider-execute-missing', 'Model provider execute() is required.'));
  if (!Array.isArray(provider.operations) || provider.operations.length === 0) findings.push(finding('blocker', 'model-provider-operations-missing', 'Model provider must declare at least one operation.'));
  if (!Array.isArray(provider.capabilities)) findings.push(finding('blocker', 'model-provider-capabilities-invalid', 'Model provider capabilities must be an array.'));
  if (provider.costTier && !(provider.costTier in COST_ORDER)) findings.push(finding('blocker', 'model-provider-cost-tier-invalid', 'Unknown model provider cost tier.', { costTier: provider.costTier }));
  return findings;
}

export function createModelProvider({
  id,
  provider,
  operations = DEFAULT_OPERATIONS,
  capabilities = [],
  models = [],
  defaultModel = null,
  available = true,
  costTier = 'medium',
  priority = 0,
  execute,
  metadata = {}
} = {}) {
  const normalized = {
    id: clean(id),
    provider: clean(provider),
    operations: normalizeCapabilities(operations),
    capabilities: normalizeCapabilities(capabilities),
    models: normalizeCapabilities(models),
    defaultModel: clean(defaultModel) || null,
    available: available !== false,
    costTier,
    priority: Number(priority ?? 0),
    execute,
    metadata: { ...metadata }
  };
  const findings = validateProvider(normalized);
  if (findings.length) {
    const error = new Error('model-provider-invalid');
    error.findings = findings;
    throw error;
  }
  return Object.freeze(normalized);
}

export function createModelRegistry(providers = []) {
  const map = new Map();
  for (const provider of providers) {
    const findings = validateProvider(provider);
    if (findings.length) {
      const error = new Error('model-provider-invalid');
      error.findings = findings;
      throw error;
    }
    if (map.has(provider.id)) throw new Error(`model-provider-duplicate:${provider.id}`);
    map.set(provider.id, provider);
  }
  return Object.freeze({
    providerAgnostic: true,
    list() { return [...map.values()]; },
    get(id) { return map.get(id) ?? null; },
    has(id) { return map.has(id); }
  });
}

function normalizeTask(task = {}) {
  return {
    id: clean(task.id),
    operation: clean(task.operation),
    requiredCapabilities: normalizeCapabilities(task.requiredCapabilities ?? []),
    budgetTier: task.budgetTier ?? 'high',
    preferredModel: clean(task.preferredModel) || null,
    input: task.input ?? null,
    metadata: { ...(task.metadata ?? {}) }
  };
}

export function routeModelTask({ task, registry, providers } = {}) {
  const normalizedTask = normalizeTask(task);
  const availableProviders = registry?.list?.() ?? providers ?? [];
  const findings = [];

  if (!normalizedTask.id) findings.push(finding('blocker', 'model-task-id-missing', 'Model task id is required.'));
  if (!normalizedTask.operation) findings.push(finding('blocker', 'model-task-operation-missing', 'Model task operation is required.'));
  if (!(normalizedTask.budgetTier in COST_ORDER)) findings.push(finding('blocker', 'model-task-budget-tier-invalid', 'Unknown model task budget tier.', { budgetTier: normalizedTask.budgetTier }));
  if (findings.length) return { stage: 'model-gateway', providerAgnostic: true, task: normalizedTask, assignment: null, trace: [], findings, pass: false };

  const budget = COST_ORDER[normalizedTask.budgetTier];
  const trace = availableProviders.map((provider) => {
    const reasons = [];
    if (provider.available === false) reasons.push('unavailable');
    if (!supportsOperation(provider, normalizedTask.operation)) reasons.push('operation-mismatch');
    if (!supportsAll(provider, normalizedTask.requiredCapabilities)) reasons.push('capability-mismatch');
    if ((COST_ORDER[provider.costTier ?? 'medium'] ?? COST_ORDER.medium) > budget) reasons.push('over-budget');
    if (normalizedTask.preferredModel && provider.models?.length && !provider.models.includes(normalizedTask.preferredModel)) reasons.push('preferred-model-unavailable');
    return {
      providerId: provider.id,
      provider: provider.provider,
      eligible: reasons.length === 0,
      reasons,
      priority: Number(provider.priority ?? 0),
      costTier: provider.costTier ?? 'medium'
    };
  });

  const eligibleIds = new Set(trace.filter((item) => item.eligible).map((item) => item.providerId));
  const selected = availableProviders
    .filter((provider) => eligibleIds.has(provider.id))
    .sort((a, b) => (Number(b.priority ?? 0) - Number(a.priority ?? 0)) || ((COST_ORDER[a.costTier ?? 'medium'] ?? COST_ORDER.medium) - (COST_ORDER[b.costTier ?? 'medium'] ?? COST_ORDER.medium)) || a.id.localeCompare(b.id))[0] ?? null;

  if (!selected) {
    findings.push(finding('blocker', 'model-provider-unavailable', 'No registered model provider satisfies the task operation, capability, availability, and budget constraints.'));
    return { stage: 'model-gateway', providerAgnostic: true, task: normalizedTask, assignment: null, trace, findings, pass: false };
  }

  return {
    stage: 'model-gateway',
    providerAgnostic: true,
    task: normalizedTask,
    assignment: {
      providerId: selected.id,
      provider: selected.provider,
      model: normalizedTask.preferredModel ?? selected.defaultModel ?? null,
      operation: normalizedTask.operation,
      requiredCapabilities: [...normalizedTask.requiredCapabilities],
      reason: 'Selected by capability, availability, budget, and explicit priority—not vendor identity.'
    },
    trace,
    findings,
    pass: true
  };
}

function normalizeProviderResult(result = {}, routed, task) {
  const providerFindings = Array.isArray(result.findings) ? result.findings.map((item) => ({ ...item })) : [];
  const blocked = providerFindings.some((item) => item.severity === 'blocker');
  return {
    schema: 'ai-studio-os/model-result@1',
    stage: 'model-execution',
    taskId: task.id,
    operation: task.operation,
    provider: routed.assignment.provider,
    providerId: routed.assignment.providerId,
    model: result.model ?? routed.assignment.model ?? null,
    output: result.output ?? null,
    usage: result.usage ?? null,
    cost: result.cost ?? null,
    provenance: {
      ...(result.provenance ?? {}),
      provider: routed.assignment.provider,
      providerId: routed.assignment.providerId,
      model: result.model ?? routed.assignment.model ?? null
    },
    findings: providerFindings,
    pass: !blocked,
    authority: {
      candidateOnly: true,
      humanApproved: false,
      productionReady: false,
      releaseReady: false
    },
    metadata: { ...(result.metadata ?? {}) }
  };
}

export async function executeModelTask({ task, registry, providers, context = {} } = {}) {
  const routed = routeModelTask({ task, registry, providers });
  if (!routed.pass) return { ...routed, execution: null };

  const provider = registry?.get?.(routed.assignment.providerId) ?? (providers ?? []).find((item) => item.id === routed.assignment.providerId) ?? null;
  if (!provider) {
    return {
      ...routed,
      pass: false,
      findings: [...routed.findings, finding('blocker', 'model-provider-registration-drift', 'Routed model provider is no longer registered.')],
      execution: null
    };
  }

  try {
    const result = await provider.execute({ ...routed.task, model: routed.assignment.model }, context);
    const execution = normalizeProviderResult(result, routed, routed.task);
    return {
      ...routed,
      findings: [...routed.findings, ...execution.findings],
      pass: routed.pass && execution.pass,
      execution
    };
  } catch (error) {
    const details = { providerId: provider.id, error: clean(error?.message) || 'unknown-provider-error' };
    return {
      ...routed,
      pass: false,
      findings: [...routed.findings, finding('blocker', 'model-provider-execution-failed', 'Model provider execution failed.', details)],
      execution: null
    };
  }
}
