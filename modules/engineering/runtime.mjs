const RISK_WEIGHTS = {
  authRequired: 1,
  authorizationSensitive: 3,
  dataWrites: 2,
  migration: 2,
  externalIO: 1,
  publicApi: 1,
  highImpact: 2,
  handlesMoney: 3,
  handlesPii: 2
};

function uniq(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function deriveRequiredTests(spec = {}) {
  const tests = [];
  if (spec.authRequired || spec.authorizationSensitive) tests.push('unauthenticated-request-denied');
  if (spec.authorizationSensitive) tests.push('authorized-request-succeeds', 'unauthorized-request-denied');
  if (spec.dataWrites) tests.push('write-failure-recovery');
  if (spec.migration) tests.push('migration-forward', 'migration-recovery');
  if (spec.publicApi) tests.push('api-contract-preserved', 'invalid-input-rejected');
  if (spec.externalIO) tests.push('dependency-failure-handled');
  return tests;
}

export function classifyChangeRisk(spec = {}) {
  const factors = [];
  let score = 0;
  for (const [key, weight] of Object.entries(RISK_WEIGHTS)) {
    if (spec[key]) {
      score += weight;
      factors.push(key);
    }
  }
  const level = score >= 6 ? 'high' : score >= 3 ? 'medium' : 'low';
  return { level, score, factors };
}

export function buildImplementationPlan({ intent, spec = {}, architecture = {} }) {
  if (!intent) throw new Error('engineering plan requires intent');
  const risk = classifyChangeRisk(spec);
  const surfaces = uniq(spec.surfaces ?? []);
  const derivedTests = deriveRequiredTests(spec);
  const requiredTests = uniq([...(spec.requiredTests ?? []), ...derivedTests]);
  const invariants = [];
  if (spec.authRequired || spec.authorizationSensitive) invariants.push('Unauthenticated callers cannot perform the operation.');
  if (spec.authorizationSensitive) invariants.push('Authorization is checked server-side at the permission boundary.');
  if (spec.dataWrites) invariants.push('Failed writes cannot leave partial or contradictory state.');
  if (spec.publicApi) invariants.push('Existing API contracts remain backward compatible unless versioned explicitly.');
  if (spec.migration) invariants.push('Migration is reversible or has a tested recovery path.');

  const sequence = [
    'confirm-contracts-and-invariants',
    'implement-smallest-safe-slice',
    'add-or-update-required-tests',
    'run-code-review',
    'run-security-review',
    'run-functional-and-regression-qa',
    'evaluate-release-readiness'
  ];

  return {
    stage: 'engineering',
    intent,
    risk,
    surfaces,
    components: uniq(architecture.components ?? []),
    contracts: uniq(architecture.contracts ?? []),
    invariants,
    derivedTests,
    requiredTests,
    sequence,
    rollbackRequired: risk.level === 'high' || Boolean(spec.migration),
    observabilityRequired: risk.level !== 'low' || Boolean(spec.externalIO),
    spec
  };
}
