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

function hasEvidence(metrics, key) {
  const value = metrics[key];
  return Object.prototype.hasOwnProperty.call(metrics, key)
    && value
    && typeof value === 'object'
    && value.measured !== false;
}

function totalBlockingTime(runtime = {}) {
  if (Number.isFinite(runtime.totalBlockingTimeMs)) return Math.max(0, runtime.totalBlockingTimeMs);
  if (!Number.isFinite(runtime.longTasks) || !Number.isFinite(runtime.longTaskMs)) return null;
  return Math.max(0, runtime.longTaskMs - (runtime.longTasks * 50));
}

export function evaluateDeliveryGates({ metrics = {}, budgets = {}, requiredViewports, requiredEvidence = [] } = {}) {
  const resolved = mergeBudgets(budgets);
  const findings = [];
  const vitals = metrics.webVitals ?? {};
  const runtime = metrics.runtime ?? {};
  const bundle = metrics.bundle ?? {};
  const accessibility = metrics.accessibility ?? {};
  const responsive = metrics.responsive ?? {};
  const reducedMotion = metrics.reducedMotion ?? {};
  const visualRegression = metrics.visualRegression ?? {};

  for (const key of [...new Set(requiredEvidence)]) {
    if (!hasEvidence(metrics, key)) {
      findings.push(finding('blocker', `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}-evidence-missing`, `${key} evidence has not been measured.`, { evidence: 'unmeasured' }));
    }
  }

  if (Number.isFinite(vitals.lcpMs) && vitals.lcpMs > resolved.webVitals.lcpMs) {
    findings.push(finding('blocker', 'lcp-budget-failed', `LCP ${vitals.lcpMs}ms exceeds ${resolved.webVitals.lcpMs}ms.`, { actual: vitals.lcpMs, budget: resolved.webVitals.lcpMs }));
  }
  if (Number.isFinite(vitals.inpMs) && vitals.inpMs > resolved.webVitals.inpMs) {
    findings.push(finding('blocker', 'inp-budget-failed', `INP lab proxy ${vitals.inpMs}ms exceeds ${resolved.webVitals.inpMs}ms.`, { actual: vitals.inpMs, budget: resolved.webVitals.inpMs, method: vitals.method?.inp }));
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
    findings.push(finding('major', 'long-task-budget-failed', `Long-task count ${runtime.longTasks} exceeds ${resolved.runtime.maxLongTasks}.`, { actual: runtime.longTasks, budget: resolved.runtime.maxLongTasks }));
  }
  const tbtMs = totalBlockingTime(runtime);
  if (Number.isFinite(tbtMs) && tbtMs > resolved.runtime.maxTbtMs) {
    findings.push(finding('major', 'tbt-budget-failed', `Total Blocking Time ${Math.round(tbtMs * 10) / 10}ms exceeds ${resolved.runtime.maxTbtMs}ms.`, {
      actual: Math.round(tbtMs * 10) / 10,
      budget: resolved.runtime.maxTbtMs,
      longTasks: runtime.longTasks ?? null,
      longTaskMs: runtime.longTaskMs ?? null
    }));
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
  if (hasEvidence(metrics, 'reducedMotion') && reducedMotion.pass === false) {
    findings.push(finding('blocker', 'reduced-motion-gate-failed', `Reduced-motion mode still contains ${reducedMotion.continuousAnimations ?? 'unknown'} continuous animation(s).`, {
      continuousAnimations: reducedMotion.continuousAnimations ?? null
    }));
  }
  if (hasEvidence(metrics, 'visualRegression') && visualRegression.status === 'compared' && visualRegression.pass === false) {
    findings.push(finding('major', 'visual-regression-gate-failed', `Visual regression ${visualRegression.maxChangedRatio ?? 'unknown'} exceeds approved-baseline threshold ${visualRegression.threshold ?? 'unknown'}.`, {
      maxChangedRatio: visualRegression.maxChangedRatio,
      threshold: visualRegression.threshold
    }));
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
    requiredEvidence: [...new Set(requiredEvidence)],
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
