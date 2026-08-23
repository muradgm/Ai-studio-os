import crypto from 'node:crypto';
import { sameProductUXArchitectureReference } from '../product-ux-architecture/reference.mjs';
import { sameCanonicalInterfaceFixtureReference } from './fixture.mjs';

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanList(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean))];
}

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function fingerprint(value) {
  return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex').slice(0, 24);
}

export function buildHybridConstitution(input = {}, { architectureRef = null, fixtureRef = null } = {}) {
  const constitution = structuredClone(input ?? {});
  const findings = [];
  if (constitution.schema !== 'ai-studio-os/hybrid-interface-constitution@1') findings.push(finding('blocker', 'hybrid-constitution-schema-invalid', 'Hybrid Constitution must use ai-studio-os/hybrid-interface-constitution@1.'));
  if (!clean(constitution.projectId) || !clean(constitution.candidateId) || !clean(constitution.label)) findings.push(finding('blocker', 'hybrid-constitution-identity-invalid', 'Hybrid Constitution requires projectId, candidateId, and label.'));
  if (constitution.baseline?.worldId !== 'decision-spine' || Number(constitution.baseline?.weightedScore) !== 8.98) findings.push(finding('blocker', 'hybrid-constitution-baseline-invalid', 'Hybrid V1 must benchmark directly against Decision Spine at the accepted 8.98 baseline.'));

  const screenIds = cleanList((constitution.screenHierarchy ?? []).map((item) => item?.screenId));
  if (!fixtureRef?.reviewReady || JSON.stringify(screenIds) !== JSON.stringify(fixtureRef?.screenIds ?? [])) findings.push(finding('blocker', 'hybrid-constitution-screen-drift', 'Hybrid screen hierarchy must exactly match the frozen canonical fixture.', { screenIds, expected: fixtureRef?.screenIds ?? [] }));
  if (!architectureRef?.reviewReady || fixtureRef?.architectureFingerprint !== architectureRef?.fingerprint) findings.push(finding('blocker', 'hybrid-constitution-architecture-drift', 'Hybrid Constitution must bind to the current frozen Product UX Architecture.'));

  for (const source of ['decisionSpine', 'counterpoint', 'threshold']) {
    if (!(constitution.sourceResponsibilities?.[source]?.owns?.length > 0) || !clean(constitution.sourceResponsibilities?.[source]?.rule)) findings.push(finding('major', 'hybrid-constitution-source-role-thin', 'Each source world requires explicit non-overlapping responsibilities and a rule.', { source }));
  }
  if ((constitution.proofQuestions ?? []).length !== 8) findings.push(finding('major', 'hybrid-constitution-proof-questions-invalid', 'Hybrid benchmark requires exactly eight proof questions.'));
  if ((constitution.hardFailConditions ?? []).length < 8) findings.push(finding('major', 'hybrid-constitution-hard-fails-thin', 'Hybrid benchmark requires the complete hard-fail review set.'));
  if (constitution.truth?.humanWorldSelectionConfirmed !== false || constitution.truth?.humanVisualApproval !== false || constitution.truth?.finalVisualSystemApproved !== false) findings.push(finding('blocker', 'hybrid-constitution-truth-boundary-invalid', 'Hybrid Constitution cannot pre-authorize human selection or final visual approval.'));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const reviewReady = blockers.length === 0 && majors.length === 0;
  const refSource = {
    schema: constitution.schema,
    projectId: constitution.projectId,
    candidateId: constitution.candidateId,
    baseline: constitution.baseline,
    sourceResponsibilities: constitution.sourceResponsibilities,
    screenHierarchy: constitution.screenHierarchy,
    proofQuestions: constitution.proofQuestions,
    hardFailConditions: constitution.hardFailConditions,
    comparison: constitution.comparison,
    architectureFingerprint: architectureRef?.fingerprint ?? null,
    fixtureFingerprint: fixtureRef?.fingerprint ?? null
  };

  return {
    ...constitution,
    status: reviewReady ? 'ready-for-head-to-head-proof' : blockers.length ? 'blocked' : 'provisional',
    pass: blockers.length === 0,
    reviewReady,
    architectureRef: structuredClone(architectureRef),
    fixtureRef: structuredClone(fixtureRef),
    constitutionFingerprint: fingerprint(refSource),
    findings
  };
}

export function buildHybridProofPlan({ constitution = null } = {}) {
  const findings = [];
  if (constitution?.reviewReady !== true) findings.push(finding('blocker', 'hybrid-proof-constitution-not-ready', 'Head-to-head proof requires a review-ready Hybrid Constitution.'));
  const screenIds = cleanList((constitution?.screenHierarchy ?? []).map((item) => item?.screenId));
  const frames = screenIds.map((screenId) => ({
    id: `${constitution?.candidateId}-${screenId}`,
    candidateId: constitution?.candidateId ?? null,
    screenId,
    baselineWorldId: constitution?.baseline?.worldId ?? null
  }));
  return {
    schema: 'ai-studio-os/hybrid-interface-proof-plan@1',
    projectId: constitution?.projectId ?? null,
    candidateId: constitution?.candidateId ?? null,
    baselineWorldId: constitution?.baseline?.worldId ?? null,
    baselineScore: Number(constitution?.baseline?.weightedScore ?? 0),
    constitutionFingerprint: constitution?.constitutionFingerprint ?? null,
    architectureRef: structuredClone(constitution?.architectureRef ?? null),
    fixtureRef: structuredClone(constitution?.fixtureRef ?? null),
    screenIds,
    frames,
    comparisons: screenIds.map((screenId) => ({ id: `${screenId}-decision-spine-vs-hybrid`, screenId })),
    status: findings.length ? 'blocked' : 'ready-for-browser-proof',
    reviewReady: findings.length === 0,
    findings,
    truth: { humanWorldSelectionConfirmed: false, humanVisualApproval: false, finalVisualSystemApproved: false }
  };
}

export function buildHybridProofEvidence({ plan = null, baselineManifest = null, renderedFrames = [], comparisonRefs = [], overviewRef = null } = {}) {
  const findings = [];
  if (plan?.reviewReady !== true) findings.push(finding('blocker', 'hybrid-proof-plan-not-ready', 'Hybrid proof evidence requires a review-ready plan.'));
  if (!sameProductUXArchitectureReference(baselineManifest?.interfaceArchitectureRef, plan?.architectureRef)) findings.push(finding('blocker', 'hybrid-proof-baseline-architecture-stale', 'Decision Spine baseline proof must match the current Product UX Architecture.'));
  if (!sameCanonicalInterfaceFixtureReference(baselineManifest?.canonicalFixtureRef, plan?.fixtureRef)) findings.push(finding('blocker', 'hybrid-proof-baseline-fixture-stale', 'Decision Spine baseline proof must match the current canonical fixture.'));
  const baseline = baselineManifest?.worlds?.find?.((world) => world.worldId === plan?.baselineWorldId) ?? null;
  if (baseline?.reviewReady !== true || (baseline?.evidenceRefs ?? []).length !== plan?.screenIds?.length) findings.push(finding('blocker', 'hybrid-proof-baseline-incomplete', 'Decision Spine baseline requires complete exact-browser evidence for all canonical screens.'));

  const frames = Array.isArray(renderedFrames) ? renderedFrames : [];
  for (const expected of plan?.frames ?? []) {
    const rendered = frames.find((item) => item.frameId === expected.id);
    if (!rendered?.imageRef || !rendered?.sourceRef || !rendered?.semanticFingerprint) findings.push(finding('major', 'hybrid-proof-frame-missing', 'Every Hybrid V1 screen requires exact browser image, source, and semantic fingerprint.', { frameId: expected.id }));
  }
  const semanticFingerprints = cleanList(frames.map((item) => item.semanticFingerprint));
  if (semanticFingerprints.length !== plan?.screenIds?.length) findings.push(finding('major', 'hybrid-proof-semantic-coverage-invalid', 'Each canonical screen requires one stable semantic fingerprint shared between Decision Spine and Hybrid V1.', { actual: semanticFingerprints.length, expected: plan?.screenIds?.length }));
  if (cleanList(comparisonRefs).length !== plan?.screenIds?.length) findings.push(finding('major', 'hybrid-proof-comparison-coverage-invalid', 'Every canonical screen requires a Decision Spine ↔ Hybrid comparison board.'));
  if (!clean(overviewRef)) findings.push(finding('major', 'hybrid-proof-overview-missing', 'Hybrid V1 requires one complete eight-screen overview board.'));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const reviewReady = blockers.length === 0 && majors.length === 0;
  return {
    schema: 'ai-studio-os/hybrid-interface-proof-evidence@1',
    projectId: plan?.projectId ?? null,
    candidateId: plan?.candidateId ?? null,
    baselineWorldId: plan?.baselineWorldId ?? null,
    baselineScore: plan?.baselineScore ?? null,
    constitutionFingerprint: plan?.constitutionFingerprint ?? null,
    interfaceArchitectureRef: structuredClone(plan?.architectureRef ?? null),
    canonicalFixtureRef: structuredClone(plan?.fixtureRef ?? null),
    screenIds: [...(plan?.screenIds ?? [])],
    candidateFrames: frames,
    comparisonRefs: cleanList(comparisonRefs),
    overviewRef: clean(overviewRef) || null,
    status: reviewReady ? 'ready-for-human-head-to-head-review' : blockers.length ? 'blocked' : 'provisional',
    pass: blockers.length === 0,
    reviewReady,
    findings,
    truth: {
      exactBrowserProof: reviewReady,
      sameCanonicalFixture: true,
      humanWorldSelectionConfirmed: false,
      humanVisualApproval: false,
      finalVisualSystemApproved: false
    }
  };
}

export function evaluateHybridReview({ constitution = null, proof = null, hardFailResults = {}, scores = {} } = {}) {
  const findings = [];
  if (proof?.reviewReady !== true) findings.push(finding('blocker', 'hybrid-review-proof-not-ready', 'Hybrid review requires complete exact-browser head-to-head proof.'));

  const hardFails = (constitution?.hardFailConditions ?? []).map((item) => ({
    id: item.id,
    reviewed: typeof hardFailResults?.[item.id] === 'boolean',
    triggered: hardFailResults?.[item.id] === true
  }));
  const unreviewed = hardFails.filter((item) => !item.reviewed);
  if (unreviewed.length) findings.push(finding('major', 'hybrid-review-hard-fails-unreviewed', 'Every hard-fail condition must be explicitly inspected before Hybrid V1 can be compared to the baseline.', { unreviewed: unreviewed.map((item) => item.id) }));
  const triggered = hardFails.filter((item) => item.triggered);
  if (triggered.length) findings.push(finding('blocker', 'hybrid-review-hard-fail-triggered', 'Hybrid V1 is rejected because one or more hard-fail conditions were triggered.', { triggered: triggered.map((item) => item.id) }));

  const entries = Object.entries(scores ?? {}).filter(([, value]) => Number.isFinite(Number(value)));
  const values = entries.map(([, value]) => Number(value));
  const weightedScore = values.length === 8 ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100 : null;
  if (values.length !== 8) findings.push(finding('major', 'hybrid-review-proof-questions-incomplete', 'All eight proof questions must be scored after visual inspection.', { actual: values.length, expected: 8 }));
  else if (weightedScore <= Number(constitution?.baseline?.weightedScore ?? proof?.baselineScore ?? 0)) findings.push(finding('blocker', 'hybrid-review-did-not-beat-baseline', 'Hybrid V1 must outperform Decision Spine, not merely match or contain more ideas.', { weightedScore, baseline: constitution?.baseline?.weightedScore ?? proof?.baselineScore ?? null }));

  const pass = !findings.some((item) => item.severity === 'blocker' || item.severity === 'major');
  return {
    schema: 'ai-studio-os/hybrid-interface-review@1',
    projectId: constitution?.projectId ?? proof?.projectId ?? null,
    candidateId: constitution?.candidateId ?? proof?.candidateId ?? null,
    baselineWorldId: constitution?.baseline?.worldId ?? proof?.baselineWorldId ?? null,
    baselineScore: constitution?.baseline?.weightedScore ?? proof?.baselineScore ?? null,
    weightedScore,
    hardFails,
    scoreCount: values.length,
    status: pass ? 'candidate-outperformed-baseline-awaiting-human-selection' : 'reject-or-revise',
    pass,
    findings,
    truth: {
      assistantReviewOnly: true,
      humanWorldSelectionConfirmed: false,
      humanVisualApproval: false,
      finalVisualSystemApproved: false
    }
  };
}
