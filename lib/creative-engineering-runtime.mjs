import { createCreativeEngineeringPlan, evaluateDeliveryGates } from '../modules/creative-engineering/index.mjs';
import { consumeTypographyContract } from '../modules/design/typography-consumption.mjs';

const PRODUCTION_EVIDENCE = ['webVitals', 'runtime', 'bundle', 'accessibility', 'responsive'];

export function runCreativeEngineeringRuntime(input = {}) {
  const plan = createCreativeEngineeringPlan(input.plan ?? input);
  const typography = consumeTypographyContract(
    input.typographyContract ?? input.design?.typography?.consumption ?? null,
    { surface: input.surface ?? input.kind ?? 'creative-engineering' }
  );
  const requiredEvidence = input.requiredEvidence ?? (plan.mode === 'production' ? PRODUCTION_EVIDENCE : []);
  const gates = evaluateDeliveryGates({
    metrics: input.metrics ?? {},
    budgets: plan.budgets,
    requiredViewports: input.requiredViewports,
    requiredEvidence
  });
  const pass = plan.pass && gates.pass && typography.pass;
  return {
    runtime: 'creative-engineering-v1.3',
    plan,
    typography,
    gates,
    pass,
    productionReady: plan.pass && gates.productionReady && typography.pass
  };
}

export function validateCreativeEngineeringBenchmark(result, expected = {}) {
  const findings = [];
  if (typeof expected.pass === 'boolean' && result.pass !== expected.pass) findings.push(`pass expected ${expected.pass} got ${result.pass}`);
  if (typeof expected.productionReady === 'boolean' && result.productionReady !== expected.productionReady) findings.push(`productionReady expected ${expected.productionReady}`);
  if (expected.rendererPreferred && result.plan.stack.rendererPreference?.preferred !== expected.rendererPreferred) findings.push(`renderer preferred expected ${expected.rendererPreferred}`);
  if (expected.rendererFallback && result.plan.stack.rendererPreference?.fallback !== expected.rendererFallback) findings.push(`renderer fallback expected ${expected.rendererFallback}`);
  if (expected.typographyEnabled !== undefined && result.typography.enabled !== expected.typographyEnabled) findings.push(`typography enabled expected ${expected.typographyEnabled}`);
  if (expected.typographyBodyFamily && result.typography.roles?.body?.family !== expected.typographyBodyFamily) findings.push(`typography body expected ${expected.typographyBodyFamily}`);
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
