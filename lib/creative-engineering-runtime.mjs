import { createCreativeEngineeringPlan, evaluateDeliveryGates } from '../modules/creative-engineering/index.mjs';

const PRODUCTION_EVIDENCE = ['webVitals', 'runtime', 'bundle', 'accessibility', 'responsive'];

export function runCreativeEngineeringRuntime(input = {}) {
  const plan = createCreativeEngineeringPlan(input.plan ?? input);
  const requiredEvidence = input.requiredEvidence ?? (plan.mode === 'production' ? PRODUCTION_EVIDENCE : []);
  const gates = evaluateDeliveryGates({
    metrics: input.metrics ?? {},
    budgets: plan.budgets,
    requiredViewports: input.requiredViewports,
    requiredEvidence
  });
  return {
    runtime: 'creative-engineering-v1.3',
    plan,
    gates,
    pass: plan.pass && gates.pass,
    productionReady: plan.pass && gates.productionReady
  };
}

export function validateCreativeEngineeringBenchmark(result, expected = {}) {
  const findings = [];
  if (typeof expected.pass === 'boolean' && result.pass !== expected.pass) findings.push(`pass expected ${expected.pass} got ${result.pass}`);
  if (typeof expected.productionReady === 'boolean' && result.productionReady !== expected.productionReady) findings.push(`productionReady expected ${expected.productionReady}`);
  if (expected.rendererPreferred && result.plan.stack.rendererPreference?.preferred !== expected.rendererPreferred) findings.push(`renderer preferred expected ${expected.rendererPreferred}`);
  if (expected.rendererFallback && result.plan.stack.rendererPreference?.fallback !== expected.rendererFallback) findings.push(`renderer fallback expected ${expected.rendererFallback}`);
  const packages = result.plan.stack.packages.map((item) => item.package);
  for (const pkg of expected.requiredPackages ?? []) {
    if (!packages.includes(pkg)) findings.push(`missing package ${pkg}`);
  }
  for (const code of expected.requiredPlanFindings ?? []) {
    if (!result.plan.findings.some((item) => item.code === code)) findings.push(`missing plan finding ${code}`);
  }
  for (const code of expected.requiredGateFindings ?? []) {
    if (!result.gates.findings.some((item) => item.code === code)) findings.push(`missing gate finding ${code}`);
  }
  return { pass: findings.length === 0, findings };
}
