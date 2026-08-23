function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanList(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean))];
}

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

function normalizeEvidence(items = []) {
  return (Array.isArray(items) ? items : []).map((item, index) => ({
    id: clean(item?.id) || `evidence-${index + 1}`,
    sourceType: clean(item?.sourceType) || 'unknown',
    sourceRef: clean(item?.sourceRef),
    claim: clean(item?.claim),
    supports: cleanList(item?.supports),
    observedAt: clean(item?.observedAt) || null
  })).filter((item) => item.sourceRef && item.claim);
}

const REQUIRED_SUPPORTS = [
  'definition',
  'problem',
  'users',
  'jobs',
  'workflow',
  'mechanics',
  'differentiation',
  'trust',
  'governance',
  'perception'
];

function supportCoverage(evidence = []) {
  const covered = new Set(evidence.flatMap((item) => item.supports));
  return REQUIRED_SUPPORTS.filter((key) => covered.has(key));
}

function completenessScore(report = {}) {
  const checks = [
    clean(report.productDefinition),
    clean(report.productCategory),
    clean(report.problem),
    report.primaryUsers?.length >= 1,
    report.primaryJobs?.length >= 1,
    report.coreWorkflow?.length >= 3,
    report.coreObjects?.length >= 2,
    clean(report.valueProposition),
    report.differentiators?.length >= 2,
    report.productMechanics?.length >= 3,
    clean(report.trustModel),
    clean(report.governanceModel),
    report.nonNegotiables?.length >= 3,
    clean(report.desiredPerception),
    report.undesiredPerception?.length >= 2,
    report.categoryCliches?.length >= 2,
    report.opportunitiesToBreakConvention?.length >= 1
  ];
  return checks.filter(Boolean).length / checks.length;
}

function calculateConfidence(report = {}) {
  const evidence = report.evidence ?? [];
  const covered = supportCoverage(evidence).length / REQUIRED_SUPPORTS.length;
  const sourceDiversity = Math.min(1, new Set(evidence.map((item) => item.sourceRef)).size / 5);
  const completeness = completenessScore(report);
  return Number((completeness * 0.55 + covered * 0.35 + sourceDiversity * 0.10).toFixed(2));
}

export function reviewProductUnderstanding(report = {}) {
  const findings = [];
  const evidence = Array.isArray(report.evidence) ? report.evidence : [];
  const covered = new Set(supportCoverage(evidence));

  if (!clean(report.projectId)) findings.push(finding('blocker', 'product-understanding-project-missing', 'Product Understanding requires a concrete project id.'));
  if (!clean(report.productDefinition)) findings.push(finding('blocker', 'product-understanding-definition-missing', 'Define what the product actually is before creative work begins.'));
  if (!clean(report.productCategory)) findings.push(finding('major', 'product-understanding-category-missing', 'Product category or competitive frame is missing.'));
  if (!clean(report.problem)) findings.push(finding('blocker', 'product-understanding-problem-missing', 'The user/problem being solved must be explicit.'));
  if (!Array.isArray(report.primaryUsers) || report.primaryUsers.length < 1) findings.push(finding('blocker', 'product-understanding-users-missing', 'At least one primary user group is required.'));
  if (!Array.isArray(report.primaryJobs) || report.primaryJobs.length < 1) findings.push(finding('blocker', 'product-understanding-jobs-missing', 'At least one primary user job is required.'));
  if (!Array.isArray(report.coreWorkflow) || report.coreWorkflow.length < 3) findings.push(finding('blocker', 'product-understanding-workflow-thin', 'Core product behavior needs a meaningful multi-step workflow.'));
  if (!Array.isArray(report.coreObjects) || report.coreObjects.length < 2) findings.push(finding('major', 'product-understanding-objects-thin', 'Core product objects/state are too thin to guide interface or experience design.'));
  if (!clean(report.valueProposition)) findings.push(finding('blocker', 'product-understanding-value-missing', 'A concrete value proposition is required.'));
  if (!Array.isArray(report.differentiators) || report.differentiators.length < 2) findings.push(finding('major', 'product-understanding-differentiation-thin', 'At least two product-specific differentiators are required.'));
  if (!Array.isArray(report.productMechanics) || report.productMechanics.length < 3) findings.push(finding('blocker', 'product-understanding-mechanics-thin', 'Creative work must be grounded in how the product actually behaves.'));
  if (!clean(report.trustModel)) findings.push(finding('major', 'product-understanding-trust-missing', 'Trust boundaries and reliability expectations are missing.'));
  if (!clean(report.governanceModel)) findings.push(finding('major', 'product-understanding-governance-missing', 'Human authority, approvals, or governance behavior must be explicit when relevant.'));
  if (!Array.isArray(report.nonNegotiables) || report.nonNegotiables.length < 3) findings.push(finding('major', 'product-understanding-nonnegotiables-thin', 'The product model needs enough non-negotiables to constrain downstream creativity.'));
  if (!clean(report.desiredPerception)) findings.push(finding('major', 'product-understanding-desired-perception-missing', 'Desired product perception is missing.'));
  if (!Array.isArray(report.undesiredPerception) || report.undesiredPerception.length < 2) findings.push(finding('major', 'product-understanding-undesired-perception-thin', 'Define what the product must not be mistaken for.'));
  if (!Array.isArray(report.categoryCliches) || report.categoryCliches.length < 2) findings.push(finding('major', 'product-understanding-category-cliches-thin', 'Category clichés must be explicit before visual exploration.'));
  if (!Array.isArray(report.opportunitiesToBreakConvention) || report.opportunitiesToBreakConvention.length < 1) findings.push(finding('major', 'product-understanding-opportunity-missing', 'At least one product-grounded opportunity to break category convention is required.'));

  if (evidence.length < 4) findings.push(finding('blocker', 'product-understanding-evidence-thin', 'Product Understanding requires multiple concrete evidence sources.', { count: evidence.length }));
  for (const support of REQUIRED_SUPPORTS) {
    if (!covered.has(support)) findings.push(finding('major', 'product-understanding-evidence-gap', `No evidence is mapped to '${support}'.`, { support }));
  }

  if (report.authorship?.mode !== 'authored-from-evidence') {
    findings.push(finding('major', 'product-understanding-authorship-required', 'A deterministic scaffold or inferred template cannot substitute for evidence-backed product understanding.'));
  }

  const confidence = Number.isFinite(Number(report.confidence)) ? Number(report.confidence) : calculateConfidence(report);
  if (confidence < 0.75) findings.push(finding('major', 'product-understanding-confidence-low', 'Product understanding confidence is too low to authorize Creative Thesis or Creative Worlds.', { confidence, threshold: 0.75 }));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const status = blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-for-creative-thesis';

  return {
    stage: 'product-understanding-review',
    status,
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    confidence,
    evidenceCoverage: {
      required: REQUIRED_SUPPORTS,
      covered: [...covered],
      missing: REQUIRED_SUPPORTS.filter((key) => !covered.has(key))
    },
    findings
  };
}

export function buildProductUnderstanding(input = {}) {
  const report = {
    schema: 'ai-studio-os/product-understanding@1',
    stage: 'product-understanding',
    projectId: clean(input.projectId ?? input.id),
    sourceProject: clean(input.sourceProject) || null,
    sourceRevision: clean(input.sourceRevision) || null,
    productDefinition: clean(input.productDefinition),
    productCategory: clean(input.productCategory),
    productStage: clean(input.productStage) || null,
    problem: clean(input.problem),
    primaryUsers: cleanList(input.primaryUsers),
    secondaryUsers: cleanList(input.secondaryUsers),
    primaryJobs: cleanList(input.primaryJobs),
    secondaryJobs: cleanList(input.secondaryJobs),
    coreWorkflow: cleanList(input.coreWorkflow),
    coreObjects: cleanList(input.coreObjects),
    primaryActions: cleanList(input.primaryActions),
    importantStates: cleanList(input.importantStates),
    valueProposition: clean(input.valueProposition),
    differentiators: cleanList(input.differentiators),
    alternatives: cleanList(input.alternatives),
    productMechanics: cleanList(input.productMechanics),
    intelligenceModel: clean(input.intelligenceModel) || null,
    trustModel: clean(input.trustModel),
    riskModel: clean(input.riskModel) || null,
    governanceModel: clean(input.governanceModel),
    desiredPerception: clean(input.desiredPerception),
    undesiredPerception: cleanList(input.undesiredPerception),
    nonNegotiables: cleanList(input.nonNegotiables),
    constraints: cleanList(input.constraints),
    categoryConventions: cleanList(input.categoryConventions),
    categoryCliches: cleanList(input.categoryCliches),
    opportunitiesToBreakConvention: cleanList(input.opportunitiesToBreakConvention),
    unknowns: cleanList(input.unknowns),
    assumptions: cleanList(input.assumptions),
    evidence: normalizeEvidence(input.evidence),
    authorship: {
      mode: clean(input.authorship?.mode) || 'deterministic-normalization',
      agent: clean(input.authorship?.agent) || null,
      reviewedByHuman: input.authorship?.reviewedByHuman === true
    },
    truth: {
      humanProductApproval: input.truth?.humanProductApproval === true,
      creativeWorkAuthorized: false,
      evidenceBacked: true
    }
  };

  report.confidence = calculateConfidence(report);
  const review = reviewProductUnderstanding(report);
  return {
    ...report,
    confidence: review.confidence,
    status: review.status,
    pass: review.pass,
    reviewReady: review.reviewReady,
    findings: review.findings,
    evidenceCoverage: review.evidenceCoverage,
    truth: {
      ...report.truth,
      creativeWorkAuthorized: review.reviewReady
    },
    review
  };
}

export const PRODUCT_UNDERSTANDING_REQUIRED_SUPPORTS = REQUIRED_SUPPORTS;
