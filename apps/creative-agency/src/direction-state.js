function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function createDirectionSelectionState({
  candidates = [],
  selectedId = null,
  catalogVersion = null,
  catalogStatus = 'loading',
  lockedByExecutionId = null
} = {}) {
  const normalized = Array.isArray(candidates) ? candidates : [];
  const selected = normalized.find((candidate) => candidate.id === selectedId) ?? null;
  const immutable = Boolean(lockedByExecutionId);
  const proofReady = selected?.canLock === true;
  const canExecute = Boolean(selected && proofReady && catalogVersion && catalogStatus === 'visual-proof-ready');

  return {
    status: immutable ? 'execution-locked' : selected ? (proofReady ? 'locked' : 'proof-required') : catalogStatus === 'not-generated' ? 'worlds-required' : 'selection-required',
    candidates: normalized,
    catalogVersion: clean(catalogVersion) || null,
    catalogStatus,
    selectedId: selected?.id ?? null,
    selected,
    canExecute,
    immutable,
    lockedByExecutionId: lockedByExecutionId ?? null,
    nextLayer: !selected
      ? 'creative-world-proof'
      : proofReady
        ? 'human-world-selection'
        : 'comparable-style-frame-proof'
  };
}
