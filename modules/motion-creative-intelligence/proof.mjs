import { reviewMotionCreativeExploration } from './runtime.mjs';

function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function list(value) { return [...new Set((Array.isArray(value) ? value : []).map(text).filter(Boolean))]; }
function finding(severity, code, message, evidence = {}) { return { severity, code, message, evidence }; }

const DEFAULT_MOMENTS = [
  { id: 'entry', label: 'Entry / first contact', purpose: 'Prove opening rhythm, attention hierarchy and stillness before the first earned movement.', viewport: 'desktop', input: 'passive' },
  { id: 'primary-reveal', label: 'Primary reveal', purpose: 'Prove the signature motion behavior at a meaningful hierarchy change.', viewport: 'desktop', input: 'passive' },
  { id: 'interaction-response', label: 'Interaction response', purpose: 'Prove response character, latency, weight and recovery under direct input.', viewport: 'desktop', input: 'pointer' },
  { id: 'mobile-recomposition', label: 'Mobile recomposition', purpose: 'Prove motion is reinterpreted rather than mechanically scaled down.', viewport: 'mobile', input: 'touch' },
  { id: 'reduced-motion', label: 'Reduced-motion interpretation', purpose: 'Prove sequencing and hierarchy survive without unnecessary simulated travel or deformation.', viewport: 'mobile', input: 'reduced-motion' }
];

function normalizeMoment(moment = {}, index = 0) {
  return {
    id: text(moment.id) || `moment-${index + 1}`,
    label: text(moment.label),
    purpose: text(moment.purpose),
    viewport: text(moment.viewport),
    input: text(moment.input),
    durationTargetMs: Number.isFinite(moment.durationTargetMs) && moment.durationTargetMs > 0 ? moment.durationTargetMs : null
  };
}

export function reviewMotionProofPlan(plan = {}) {
  const findings = [];
  if (plan.schema !== 'ai-studio-os/motion-proof-plan@1') findings.push(finding('blocker', 'motion-proof-plan-schema-invalid', 'Motion proof requires motion-proof-plan@1.'));
  if (!text(plan.projectId) || !text(plan.creativeWorldId)) findings.push(finding('blocker', 'motion-proof-plan-binding-missing', 'Motion proof plan must bind project and Creative World identity.'));
  if (plan.explorationReview?.reviewReady !== true) findings.push(finding('blocker', 'motion-proof-exploration-not-ready', 'Only a creatively review-ready Motion exploration may enter rendered proof.'));

  const hypotheses = Array.isArray(plan.hypotheses) ? plan.hypotheses : [];
  const moments = Array.isArray(plan.moments) ? plan.moments : [];
  const studies = Array.isArray(plan.studies) ? plan.studies : [];
  if (hypotheses.length < 3) findings.push(finding('major', 'motion-proof-divergence-coverage-thin', 'Rendered proof should compare at least three serious motion hypotheses.', { count: hypotheses.length }));
  if (moments.length < 3) findings.push(finding('major', 'motion-proof-moment-coverage-thin', 'Motion proof needs multiple temporal moments, not one hero animation.', { count: moments.length }));
  if (!moments.some((moment) => moment.viewport === 'mobile')) findings.push(finding('major', 'motion-proof-mobile-missing', 'Motion proof must include mobile behavior.'));
  if (!moments.some((moment) => moment.input === 'reduced-motion')) findings.push(finding('major', 'motion-proof-reduced-motion-missing', 'Motion proof must include a reduced-motion interpretation.'));

  const expected = hypotheses.length * moments.length;
  if (studies.length !== expected) findings.push(finding('blocker', 'motion-proof-study-matrix-incomplete', 'Every motion hypothesis must be tested against every configured proof moment.', { expected, actual: studies.length }));
  const keys = new Set(studies.map((study) => `${study.hypothesisId}::${study.momentId}`));
  for (const hypothesis of hypotheses) {
    for (const moment of moments) {
      if (!keys.has(`${hypothesis.id}::${moment.id}`)) findings.push(finding('blocker', 'motion-proof-study-missing', 'Motion proof matrix is missing a hypothesis/moment study.', { hypothesisId: hypothesis.id, momentId: moment.id }));
    }
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return {
    schema: 'ai-studio-os/motion-proof-plan-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-for-browser-render',
    findings,
    truth: { proofPlanIsNotRenderedEvidence: true, proofDoesNotSelectWinner: true }
  };
}

export function buildMotionProofPlan({ exploration, moments = DEFAULT_MOMENTS } = {}) {
  const explorationReview = reviewMotionCreativeExploration(exploration ?? {});
  const normalizedMoments = (Array.isArray(moments) ? moments : DEFAULT_MOMENTS).map(normalizeMoment);
  const hypotheses = (exploration?.hypotheses ?? []).map((hypothesis) => ({
    id: hypothesis.id,
    title: hypothesis.title,
    interpretation: hypothesis.interpretation,
    motionThesis: hypothesis.language?.motionThesis ?? null,
    signatureMotionBehavior: hypothesis.language?.signatureMotionBehavior ?? null,
    temporalRhythm: hypothesis.language?.temporalRhythm ?? null,
    stillnessPolicy: hypothesis.language?.stillnessPolicy ?? null,
    reducedMotionInterpretation: hypothesis.language?.reducedMotionInterpretation ?? null
  }));
  const studies = hypotheses.flatMap((hypothesis) => normalizedMoments.map((moment) => ({
    id: `${hypothesis.id}--${moment.id}`,
    projectId: exploration?.projectId ?? null,
    creativeWorldId: exploration?.creativeWorldId ?? null,
    hypothesisId: hypothesis.id,
    momentId: moment.id,
    viewport: moment.viewport,
    input: moment.input,
    purpose: moment.purpose,
    durationTargetMs: moment.durationTargetMs,
    creativeIntent: {
      motionThesis: hypothesis.motionThesis,
      signatureMotionBehavior: hypothesis.signatureMotionBehavior,
      temporalRhythm: hypothesis.temporalRhythm,
      stillnessPolicy: hypothesis.stillnessPolicy,
      reducedMotionInterpretation: moment.input === 'reduced-motion' ? hypothesis.reducedMotionInterpretation : null
    }
  })));
  const plan = {
    schema: 'ai-studio-os/motion-proof-plan@1',
    stage: 'motion-proof-plan',
    projectId: exploration?.projectId ?? null,
    creativeWorldId: exploration?.creativeWorldId ?? null,
    explorationRef: { schema: exploration?.schema ?? null, hypothesisIds: hypotheses.map((item) => item.id) },
    explorationReview,
    hypotheses,
    moments: normalizedMoments,
    studies,
    truth: {
      temporalStudiesRequired: true,
      proofPlanIsNotRenderedEvidence: true,
      humanMotionSelectionConfirmed: false,
      motionCriticApproval: false,
      productionApproved: false
    }
  };
  const review = reviewMotionProofPlan(plan);
  return { ...plan, review, pass: review.pass, reviewReady: review.reviewReady, status: review.status, findings: review.findings };
}

function normalizeRenderedStudy(study = {}) {
  return {
    studyId: text(study.studyId),
    hypothesisId: text(study.hypothesisId),
    momentId: text(study.momentId),
    videoRef: text(study.videoRef),
    captureRef: text(study.captureRef),
    sourceRef: text(study.sourceRef),
    timelineRef: text(study.timelineRef),
    viewport: text(study.viewport),
    input: text(study.input),
    durationMs: Number.isFinite(study.durationMs) ? study.durationMs : null,
    frameCount: Number.isInteger(study.frameCount) ? study.frameCount : null,
    browserRendered: study.browserRendered === true,
    exactSourceRendered: study.exactSourceRendered === true
  };
}

export function reviewMotionProofEvidence(evidence = {}) {
  const findings = [];
  if (evidence.schema !== 'ai-studio-os/motion-proof-evidence@1') findings.push(finding('blocker', 'motion-proof-evidence-schema-invalid', 'Rendered motion evidence requires motion-proof-evidence@1.'));
  if (evidence.plan?.schema !== 'ai-studio-os/motion-proof-plan@1' || evidence.plan?.reviewReady !== true) findings.push(finding('blocker', 'motion-proof-plan-not-ready', 'Rendered evidence must originate from a review-ready Motion proof plan.'));
  if (evidence.projectId !== evidence.plan?.projectId || evidence.creativeWorldId !== evidence.plan?.creativeWorldId) findings.push(finding('blocker', 'motion-proof-evidence-binding-drift', 'Rendered evidence must remain bound to the proof plan project and Creative World.'));

  const expectedStudies = evidence.plan?.studies ?? [];
  const renderedStudies = Array.isArray(evidence.renderedStudies) ? evidence.renderedStudies : [];
  const renderedById = new Map(renderedStudies.map((study) => [study.studyId, study]));
  for (const planned of expectedStudies) {
    const rendered = renderedById.get(planned.id);
    if (!rendered) {
      findings.push(finding('blocker', 'motion-proof-render-missing', 'A planned temporal motion study has no rendered evidence.', { studyId: planned.id }));
      continue;
    }
    if (rendered.hypothesisId !== planned.hypothesisId || rendered.momentId !== planned.momentId) findings.push(finding('blocker', 'motion-proof-render-identity-drift', 'Rendered study identity does not match its proof-plan study.', { studyId: planned.id }));
    if (rendered.viewport !== planned.viewport || rendered.input !== planned.input) findings.push(finding('blocker', 'motion-proof-render-context-drift', 'Rendered study viewport/input context does not match the proof plan.', { studyId: planned.id }));
    if (!rendered.videoRef && !rendered.captureRef) findings.push(finding('blocker', 'motion-proof-temporal-capture-missing', 'Motion proof needs a temporal capture reference; a static specification is not evidence.', { studyId: planned.id }));
    if (!rendered.sourceRef || !rendered.timelineRef) findings.push(finding('blocker', 'motion-proof-source-or-timeline-missing', 'Rendered motion proof requires exact source and timeline/timing provenance.', { studyId: planned.id }));
    if (rendered.browserRendered !== true || rendered.exactSourceRendered !== true) findings.push(finding('blocker', 'motion-proof-browser-integrity-unproven', 'Motion proof must state that a browser rendered the exact referenced source.', { studyId: planned.id }));
    if (!(rendered.durationMs > 0) || !(rendered.frameCount > 1)) findings.push(finding('blocker', 'motion-proof-temporal-metrics-invalid', 'Temporal evidence needs positive duration and multiple rendered frames.', { studyId: planned.id, durationMs: rendered.durationMs, frameCount: rendered.frameCount }));
  }
  if (renderedStudies.length !== expectedStudies.length) findings.push(finding('blocker', 'motion-proof-render-count-mismatch', 'Rendered motion evidence must exactly cover the planned study matrix.', { expected: expectedStudies.length, actual: renderedStudies.length }));
  if (!list(evidence.comparisonRefs).length) findings.push(finding('major', 'motion-proof-comparison-evidence-missing', 'Competing motion studies need comparison evidence so taste can be judged comparatively.'));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return {
    schema: 'ai-studio-os/motion-proof-evidence-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-for-motion-critic',
    findings,
    truth: {
      exactBrowserTemporalEvidence: blockers.length === 0,
      proofDoesNotSelectWinner: true,
      humanMotionSelectionConfirmed: false,
      motionCriticApproval: false,
      productionApproved: false
    }
  };
}

export function buildMotionProofEvidence({ plan, renderedStudies = [], comparisonRefs = [] } = {}) {
  const evidence = {
    schema: 'ai-studio-os/motion-proof-evidence@1',
    stage: 'motion-proof-evidence',
    projectId: plan?.projectId ?? null,
    creativeWorldId: plan?.creativeWorldId ?? null,
    plan,
    renderedStudies: (Array.isArray(renderedStudies) ? renderedStudies : []).map(normalizeRenderedStudy),
    comparisonRefs: list(comparisonRefs),
    truth: {
      evidenceIsTemporalNotStaticSpec: true,
      proofDoesNotSelectWinner: true,
      humanMotionSelectionConfirmed: false,
      motionCriticApproval: false,
      productionApproved: false
    }
  };
  const review = reviewMotionProofEvidence(evidence);
  return { ...evidence, review, pass: review.pass, reviewReady: review.reviewReady, status: review.status, findings: review.findings, truth: { ...evidence.truth, ...review.truth } };
}
