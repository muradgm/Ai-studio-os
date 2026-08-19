export function createRealtimeSceneSpec(input = {}) {
  const findings = [];
  const requires3D = input.requires3D !== false;
  const motionPurpose = input.motionPurpose ?? null;
  const reducedMotion = input.reducedMotion ?? null;
  const performanceFallback = input.performanceFallback ?? null;

  if (requires3D && !input.camera) findings.push({ severity: 'blocker', code: 'camera-spec-missing' });
  if (requires3D && !input.sceneGraph) findings.push({ severity: 'blocker', code: 'scene-graph-missing' });
  if (!motionPurpose) findings.push({ severity: 'major', code: 'motion-purpose-missing' });
  if (!reducedMotion) findings.push({ severity: 'major', code: 'reduced-motion-state-missing' });
  if (!performanceFallback) findings.push({ severity: 'major', code: 'performance-fallback-missing' });

  return {
    id: input.id ?? null,
    renderer: {
      preferred: input.preferredRenderer ?? 'webgpu',
      fallback: input.fallbackRenderer ?? 'webgl2',
      allow2DFallback: input.allow2DFallback !== false
    },
    camera: input.camera ?? null,
    sceneGraph: input.sceneGraph ?? null,
    lighting: input.lighting ?? null,
    interaction: input.interaction ?? [],
    timeline: input.timeline ?? [],
    motionPurpose,
    reducedMotion,
    performanceFallback,
    budgets: input.budgets ?? {},
    findings,
    pass: !findings.some((item) => item.severity === 'blocker')
  };
}

export function createRiveRuntimeSpec(input = {}) {
  const findings = [];
  if (!input.assetId) findings.push({ severity: 'blocker', code: 'rive-asset-id-missing' });
  if (!input.canvasId) findings.push({ severity: 'blocker', code: 'rive-canvas-id-missing' });
  if (!input.stateMachine && !input.animation) findings.push({ severity: 'major', code: 'rive-state-or-animation-missing' });
  return {
    assetId: input.assetId ?? null,
    canvasId: input.canvasId ?? null,
    stateMachine: input.stateMachine ?? null,
    animation: input.animation ?? null,
    autoplay: input.autoplay ?? false,
    artboard: input.artboard ?? null,
    reducedMotion: input.reducedMotion ?? 'static-first-frame',
    findings,
    pass: !findings.some((item) => item.severity === 'blocker')
  };
}

export function createMotionEngineeringSpec(input = {}) {
  const states = input.states ?? [];
  const findings = [];
  if (states.length < 2) findings.push({ severity: 'major', code: 'motion-state-sequence-too-short' });
  if (!input.trigger) findings.push({ severity: 'major', code: 'motion-trigger-missing' });
  if (!input.settleState) findings.push({ severity: 'major', code: 'motion-settle-state-missing' });
  return {
    id: input.id ?? null,
    trigger: input.trigger ?? null,
    states,
    settleState: input.settleState ?? null,
    interruptionPolicy: input.interruptionPolicy ?? 'complete-to-nearest-stable-state',
    reducedMotion: input.reducedMotion ?? null,
    findings,
    pass: !findings.some((item) => item.severity === 'blocker')
  };
}
