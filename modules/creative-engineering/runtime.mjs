import { DEFAULT_DELIVERY_BUDGETS, DEFAULT_VIEWPORTS, createWebStackManifest } from './web-stack.mjs';

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

function mergeBudgets(budgets = {}) {
  return {
    webVitals: { ...DEFAULT_DELIVERY_BUDGETS.webVitals, ...(budgets.webVitals ?? {}) },
    runtime: { ...DEFAULT_DELIVERY_BUDGETS.runtime, ...(budgets.runtime ?? {}) },
    bundle: { ...DEFAULT_DELIVERY_BUDGETS.bundle, ...(budgets.bundle ?? {}) },
    accessibility: { ...DEFAULT_DELIVERY_BUDGETS.accessibility, ...(budgets.accessibility ?? {}) },
    responsive: { ...DEFAULT_DELIVERY_BUDGETS.responsive, ...(budgets.responsive ?? {}) }
  };
}

export function createCreativeEngineeringPlan(input = {}) {
  const mode = input.mode ?? 'production';
  const needs = [...new Set(input.needs ?? [])];
  const viewports = input.viewports?.length ? input.viewports : DEFAULT_VIEWPORTS;
  const findings = [];

  if (!input.projectId) findings.push(finding('blocker', 'project-id-missing', 'Creative engineering requires a stable project id.'));
  if (!input.entryUrl && !input.entryPath) findings.push(finding('blocker', 'entry-target-missing', 'A browser entry URL or build entry path is required.'));
  if (needs.includes('3d') && !input.assetPlan) findings.push(finding('major', '3d-asset-plan-missing', '3D work needs an explicit source/model/optimization plan.'));
  if (needs.includes('motion') && !input.reducedMotionPlan) findings.push(finding('major', 'reduced-motion-plan-missing', 'Motion work needs an authored reduced-motion equivalent.'));

  return {
    stage: 'creative-engineering-plan',
    projectId: input.projectId ?? null,
    mode,
    needs,
    stack: createWebStackManifest({ needs, allowWebGPU: input.allowWebGPU !== false }),
    viewports,
    budgets: mergeBudgets(input.budgets),
    assetPlan: input.assetPlan ?? null,
    reducedMotionPlan: input.reducedMotionPlan ?? null,
    findings,
    pass: !findings.some((item) => item.severity === 'blocker')
  };
}

export function evaluateDeliveryGates({ metrics = {}, budgets = {}, requiredViewports } = {}) {
  const resolved = mergeBudgets(budgets);
  const findings = [];
  const vitals = metrics.webVitals ?? {};
  const runtime = metrics.runtime ?? {};
  const bundle = metrics.bundle ?? {};
  const accessibility = metrics.accessibility ?? {};
  const responsive = metrics.responsive ?? {};

  if (Number.isFinite(vitals.lcpMs) && vitals.lcpMs > resolved.webVitals.lcpMs) {
    findings.push(finding('blocker', 'lcp-budget-failed', `LCP ${vitals.lcpMs}ms exceeds ${resolved.webVitals.lcpMs}ms.`, { actual: vitals.lcpMs, budget: resolved.webVitals.lcpMs }));
  }
  if (Number.isFinite(vitals.inpMs) && vitals.inpMs > resolved.webVitals.inpMs) {
    findings.push(finding('blocker', 'inp-budget-failed', `INP ${vitals.inpMs}ms exceeds ${resolved.webVitals.inpMs}ms.`, { actual: vitals.inpMs, budget: resolved.webVitals.inpMs }));
  }
  if (Number.isFinite(vitals.cls) && vitals.cls > resolved.webVitals.cls) {
    findings.push(finding('blocker', 'cls-budget-failed', `CLS ${vitals.cls} exceeds ${resolved.webVitals.cls}.`, { actual: vitals.cls, budget: resolved.webVitals.cls }));
  }
  if (Number.isFinite(runtime.fps) && runtime.fps < resolved.runtime.minFps) {
    findings.push(finding('major', 'fps-budget-failed', `Runtime FPS ${runtime.fps} is below ${resolved.runtime.minFps}.`, { actual: runtime.fps, budget: resolved.runtime.minFps }));
  }
  if (Number.isFinite(runtime.maxFrameMs) && runtime.maxFrameMs > resolved.runtime.maxFrameMs) {
    findings.push(finding('major', 'frame-time-budget-failed', `Frame time ${runtime.maxFrameMs}ms exceeds ${resolved.runtime.maxFrameMs}ms.`, { actual: runtime.maxFrameMs, budget: resolved.runtime.maxFrameMs }));
  }
  if (Number.isFinite(runtime.longTasks) && runtime.longTasks > resolved.runtime.maxLongTasks) {
    findings.push(finding('major', 'long-task-budget-failed', `Long tasks ${runtime.longTasks} exceed ${resolved.runtime.maxLongTasks}.`, { actual: runtime.longTasks, budget: resolved.runtime.maxLongTasks }));
  }
  if (Number.isFinite(bundle.initialJsKb) && bundle.initialJsKb > resolved.bundle.initialJsKb) {
    findings.push(finding('major', 'initial-js-budget-failed', `Initial JS ${bundle.initialJsKb}KB exceeds ${resolved.bundle.initialJsKb}KB.`, { actual: bundle.initialJsKb, budget: resolved.bundle.initialJsKb }));
  }
  if (Number.isFinite(bundle.initialCssKb) && bundle.initialCssKb > resolved.bundle.initialCssKb) {
    findings.push(finding('minor', 'initial-css-budget-failed', `Initial CSS ${bundle.initialCssKb}KB exceeds ${resolved.bundle.initialCssKb}KB.`, { actual: bundle.initialCssKb, budget: resolved.bundle.initialCssKb }));
  }
  if ((accessibility.blockers ?? 0) > resolved.accessibility.blockers) {
    findings.push(finding('blocker', 'accessibility-blockers', 'Accessibility blockers remain.', { actual: accessibility.blockers ?? 0, budget: resolved.accessibility.blockers }));
  }
  if ((accessibility.majors ?? 0) > resolved.accessibility.majors) {
    findings.push(finding('major', 'accessibility-majors', 'Major accessibility findings remain.', { actual: accessibility.majors ?? 0, budget: resolved.accessibility.majors }));
  }

  const required = requiredViewports ?? resolved.responsive.requiredViewports;
  const passedViewports = new Set(Object.entries(responsive).filter(([, value]) => value?.pass === true).map(([id]) => id));
  for (const viewport of required) {
    if (!passedViewports.has(viewport)) findings.push(finding('blocker', 'responsive-viewport-failed', `Required viewport '${viewport}' has not passed.`, { viewport }));
  }

  const blocker = findings.some((item) => item.severity === 'blocker');
  const major = findings.some((item) => item.severity === 'major');
  return {
    stage: 'creative-engineering-delivery-gates',
    budgets: resolved,
    findings,
    pass: !blocker,
    productionReady: !blocker && !major
  };
}

export function createPatchQueue(findings = [], { iteration = 0, maxIterations = 8 } = {}) {
  if (iteration >= maxIterations) {
    return { status: 'blocked', reason: 'patch-iteration-limit', iteration, maxIterations, patches: [] };
  }
  const priority = { blocker: 0, major: 1, minor: 2, taste: 3 };
  const patches = [...findings]
    .filter((item) => item?.code)
    .sort((a, b) => (priority[a.severity] ?? 9) - (priority[b.severity] ?? 9))
    .map((item, index) => ({
      id: `patch-${iteration + 1}-${String(index + 1).padStart(2, '0')}`,
      sourceFinding: item.code,
      severity: item.severity ?? 'minor',
      instruction: item.message ?? item.code,
      verify: `Re-run the gate that emitted ${item.code}.`
    }));
  return { status: patches.length ? 'ready' : 'clean', iteration: iteration + 1, maxIterations, patches };
}
