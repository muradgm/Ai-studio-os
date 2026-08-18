const COST_ORDER = { low: 1, medium: 2, high: 3 };

function supportsAll(adapter, required = []) {
  const capabilities = new Set(adapter.capabilities ?? []);
  return required.every((capability) => capabilities.has(capability));
}

function supportsOperation(adapter, operation) {
  const operations = new Set(adapter.operations ?? []);
  return operations.has(operation);
}

function chooseAdapter(adapters, spec) {
  const budget = COST_ORDER[spec.budgetTier ?? 'high'] ?? 3;
  const trace = adapters.map((adapter) => {
    const reasons = [];
    if (adapter.available === false) reasons.push('unavailable');
    if (!supportsOperation(adapter, spec.operation)) reasons.push('operation-mismatch');
    if (!supportsAll(adapter, spec.requiredCapabilities ?? [])) reasons.push('capability-mismatch');
    if ((COST_ORDER[adapter.costTier ?? 'medium'] ?? 2) > budget) reasons.push('over-budget');
    return {
      adapterId: adapter.id,
      provider: adapter.provider ?? adapter.id,
      eligible: reasons.length === 0,
      reasons,
      priority: Number(adapter.priority ?? 0),
      costTier: adapter.costTier ?? 'medium'
    };
  });
  const eligibleIds = new Set(trace.filter((item) => item.eligible).map((item) => item.adapterId));
  const adapter = adapters
    .filter((item) => eligibleIds.has(item.id))
    .sort((a, b) => (Number(b.priority ?? 0) - Number(a.priority ?? 0)) || ((COST_ORDER[a.costTier ?? 'medium'] ?? 2) - (COST_ORDER[b.costTier ?? 'medium'] ?? 2)))[0] ?? null;
  return { adapter, trace };
}

export function routeCreativeTools({ assetSpecs = [], adapters = [], modePlan } = {}) {
  const findings = [];
  const assignments = [];

  for (const spec of assetSpecs) {
    const id = String(spec.id ?? '').trim();
    if (!id) {
      findings.push({ severity: 'blocker', code: 'asset-spec-id-missing' });
      continue;
    }

    if (spec.truthSensitive && spec.operation === 'generate') {
      assignments.push({ assetId: id, action: 'capture-required', adapterId: null, reason: 'Truth-sensitive final representation cannot be fabricated from scratch.' });
      findings.push({ severity: modePlan?.mode === 'production' ? 'blocker' : 'major', code: 'truth-sensitive-generation-blocked', assetId: id });
      continue;
    }

    if (spec.operation === 'edit' && !spec.hasRealSource) {
      assignments.push({ assetId: id, action: 'source-required', adapterId: null, reason: 'Editing requires an actual source asset.' });
      findings.push({ severity: 'blocker', code: 'edit-source-missing', assetId: id });
      continue;
    }

    const { adapter, trace } = chooseAdapter(adapters, spec);
    if (!adapter) {
      assignments.push({ assetId: id, action: 'unassigned', adapterId: null, selectionTrace: trace, reason: 'No available adapter satisfies capability, operation, and budget constraints.' });
      findings.push({ severity: modePlan?.mode === 'production' ? 'blocker' : 'major', code: 'tool-adapter-unavailable', assetId: id });
      continue;
    }

    assignments.push({
      assetId: id,
      action: 'route',
      adapterId: adapter.id,
      provider: adapter.provider ?? adapter.id,
      model: spec.preferredModel ?? adapter.defaultModel ?? null,
      operation: spec.operation,
      capabilityMatch: [...(spec.requiredCapabilities ?? [])],
      selectionTrace: trace,
      reason: 'Selected by capability, availability, budget, and explicit priority—not vendor identity.'
    });
  }

  const hasBlocker = findings.some((finding) => finding.severity === 'blocker');
  const hasMajor = findings.some((finding) => finding.severity === 'major');
  return {
    stage: 'tool-gateway',
    providerAgnostic: true,
    assignments,
    findings,
    pass: !hasBlocker,
    productionReady: modePlan?.mode === 'production' && !hasBlocker && !hasMajor && assignments.every((assignment) => assignment.action === 'route')
  };
}
