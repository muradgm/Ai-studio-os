function cloneObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? structuredClone(value) : {};
}

function compactRoles(selection = {}) {
  const roles = {};
  for (const role of ['display', 'body', 'utility']) {
    const item = selection?.[role];
    if (!item?.family) continue;
    roles[role] = {
      family: item.family,
      fallback: item.fallback ?? (role === 'display' ? 'serif' : role === 'utility' ? 'monospace' : 'sans-serif'),
      weights: Array.isArray(item.weights) ? [...item.weights] : [],
      variable: item.variable === true,
      axes: Array.isArray(item.axes) ? structuredClone(item.axes) : [],
      source: item.source ?? null
    };
  }
  return roles;
}

function normalizeCssVariables(production = {}) {
  const input = production.cssVariables && typeof production.cssVariables === 'object'
    ? production.cssVariables
    : {};
  const entries = Object.entries(input)
    .filter(([key, value]) => String(key).startsWith('--') && value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b));
  return Object.fromEntries(entries);
}

function roleUsage(application = {}) {
  const styles = application.styles ?? {};
  return {
    display: {
      targets: ['h1', 'h2', 'hero-display', 'editorial-display'],
      styleRefs: ['h1', 'h2'].filter((key) => styles[key])
    },
    body: {
      targets: ['body', 'paragraph', 'lead', 'form-copy'],
      styleRefs: ['body', 'lead'].filter((key) => styles[key])
    },
    utility: {
      targets: ['nav', 'button', 'label', 'metadata', 'code-like-utility'],
      styleRefs: ['nav', 'button', 'metadata'].filter((key) => styles[key])
    }
  };
}

export function buildTypographyConsumptionContract(typography = null) {
  if (!typography || typography.pass !== true || !typography.selection || !typography.production) return null;
  const roles = compactRoles(typography.selection);
  const cssVariables = normalizeCssVariables(typography.production);
  const application = cloneObject(typography.application);
  const findings = [];

  if (!roles.display) findings.push({ severity:'major', code:'typography-consumption-display-role-missing' });
  if (!roles.body) findings.push({ severity:'blocker', code:'typography-consumption-body-role-missing' });
  if (!Object.keys(cssVariables).length) findings.push({ severity:'major', code:'typography-consumption-css-variables-missing' });
  if (!application.styles?.body || !application.styles?.h1) findings.push({ severity:'major', code:'typography-consumption-application-styles-incomplete' });

  return {
    schema: 'ai-studio-os/typography-consumption@1',
    providerAgnostic: true,
    status: findings.some((item) => item.severity === 'blocker') ? 'blocked' : findings.length ? 'review' : 'ready',
    roles,
    usage: roleUsage(application),
    application,
    production: {
      css2Url: typography.production.css2Url ?? null,
      cssVariables,
      families: structuredClone(typography.production.families ?? [])
    },
    integration: {
      cssVariableSourceOfTruth: true,
      recomputeTypographyInConsumer: false,
      allowConsumerOverrides: ['container-context', 'locale-specific-line-breaks', 'explicit-accessibility-adjustment'],
      forbiddenOverrides: ['silent-family-substitution', 'unreviewed-type-scale-replacement', 'dropping-required-script-coverage']
    },
    provenance: {
      systemScore: typography.systemCritique?.score ?? null,
      pairingScore: typography.systems?.[0]?.pairing?.score ?? null,
      evidenceLevel: typography.intelligence?.winnerEvidenceLevel ?? null
    },
    findings,
    pass: !findings.some((item) => item.severity === 'blocker')
  };
}

export function consumeTypographyContract(contract = null, { surface = 'generic' } = {}) {
  if (!contract) return { enabled:false, surface, pass:true, findings:[], cssVariables:{}, roles:{} };
  const findings = [];
  if (contract.schema !== 'ai-studio-os/typography-consumption@1') findings.push({ severity:'blocker', code:'typography-contract-schema-unsupported' });
  if (contract.pass !== true) findings.push({ severity:'blocker', code:'typography-contract-not-ready' });
  if (!contract.roles?.body?.family) findings.push({ severity:'blocker', code:'typography-contract-body-role-missing' });
  if (!contract.production?.cssVariables || !Object.keys(contract.production.cssVariables).length) findings.push({ severity:'major', code:'typography-contract-token-set-missing' });
  return {
    enabled:true,
    surface,
    schema:contract.schema,
    roles:structuredClone(contract.roles ?? {}),
    usage:structuredClone(contract.usage ?? {}),
    application:structuredClone(contract.application ?? {}),
    css2Url:contract.production?.css2Url ?? null,
    cssVariables:structuredClone(contract.production?.cssVariables ?? {}),
    integration:structuredClone(contract.integration ?? {}),
    findings,
    pass:!findings.some((item)=>item.severity === 'blocker')
  };
}
