import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { reviewMotionCreativeExploration } from './runtime.mjs';

function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function list(value) { return [...new Set((Array.isArray(value) ? value : []).map(text).filter(Boolean))]; }
function finding(severity, code, message, evidence = {}) { return { severity, code, message, evidence }; }

const SHA256 = /^[a-f0-9]{64}$/i;
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ARTIFACT_ROOT = path.join(REPO_ROOT, 'artifacts');
const TEST_FIXTURE_PROJECT_ID = 'motion-creative-intelligence-proof-fixture';
const WEBM_HEADER = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);
const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const DEFAULT_MOMENTS = [
  { id: 'entry', label: 'Entry / first contact', purpose: 'Prove opening rhythm, attention hierarchy and stillness before the first earned movement.', viewport: 'desktop', input: 'passive' },
  { id: 'primary-reveal', label: 'Primary reveal', purpose: 'Prove the signature motion behavior at a meaningful hierarchy change.', viewport: 'desktop', input: 'passive' },
  { id: 'interaction-response', label: 'Interaction response', purpose: 'Prove response character, latency, weight and recovery under direct input.', viewport: 'desktop', input: 'pointer' },
  { id: 'mobile-recomposition', label: 'Mobile recomposition', purpose: 'Prove motion is reinterpreted rather than mechanically scaled down.', viewport: 'mobile', input: 'touch' },
  { id: 'reduced-motion', label: 'Reduced-motion interpretation', purpose: 'Prove sequencing and hierarchy survive without unnecessary simulated travel or deformation.', viewport: 'mobile', input: 'reduced-motion' }
];

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalValue(value[key])]));
  return value;
}

function sameContract(left, right) {
  return JSON.stringify(canonicalValue(left)) === JSON.stringify(canonicalValue(right));
}

function sameSetById(left = [], right = []) {
  const sort = (items) => [...items].sort((a, b) => text(a?.id).localeCompare(text(b?.id)));
  return sameContract(sort(left), sort(right));
}

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

function proofHypothesesFromExploration(exploration = {}) {
  return (exploration?.hypotheses ?? []).map((hypothesis) => ({
    id: hypothesis.id,
    title: hypothesis.title,
    interpretation: hypothesis.interpretation,
    motionThesis: hypothesis.language?.motionThesis ?? null,
    signatureMotionBehavior: hypothesis.language?.signatureMotionBehavior ?? null,
    temporalRhythm: hypothesis.language?.temporalRhythm ?? null,
    stillnessPolicy: hypothesis.language?.stillnessPolicy ?? null,
    reducedMotionInterpretation: hypothesis.language?.reducedMotionInterpretation ?? null,
    responsiveConsequences: list(hypothesis.responsiveConsequences)
  }));
}

function studyMatrix({ projectId, creativeWorldId, hypotheses = [], moments = [] } = {}) {
  return hypotheses.flatMap((hypothesis) => moments.map((moment) => ({
    id: `${hypothesis.id}--${moment.id}`,
    projectId: projectId ?? null,
    creativeWorldId: creativeWorldId ?? null,
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
      reducedMotionInterpretation: moment.input === 'reduced-motion' ? hypothesis.reducedMotionInterpretation : null,
      responsiveConsequences: moment.viewport === 'mobile' ? hypothesis.responsiveConsequences : []
    }
  })));
}

function digest(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function startsWithBytes(buffer, header) {
  return Buffer.isBuffer(buffer) && buffer.length >= header.length && buffer.subarray(0, header.length).equals(header);
}

function fixtureRef(ref) {
  return text(ref).startsWith('fixture://');
}

function resolveArtifactRef(ref) {
  const value = text(ref).replaceAll('\\', '/');
  if (!value || value.includes('://') || value.startsWith('/') || value.split('/').includes('..')) return null;
  const absolute = path.resolve(REPO_ROOT, value);
  const withinArtifacts = absolute === ARTIFACT_ROOT || absolute.startsWith(`${ARTIFACT_ROOT}${path.sep}`);
  return withinArtifacts ? absolute : null;
}

function readArtifact(ref, encoding = null) {
  const absolute = resolveArtifactRef(ref);
  if (!absolute) return { ok: false, reason: 'invalid-ref', absolute: null, value: null };
  try {
    const value = fs.readFileSync(absolute, encoding ?? undefined);
    return { ok: true, reason: null, absolute, value };
  } catch (error) {
    return { ok: false, reason: error?.code ?? 'read-failed', absolute, value: null };
  }
}

function verifyRenderedArtifacts({ evidence, planned, rendered }) {
  const findings = [];
  const refs = [rendered.videoRef, rendered.captureRef, rendered.sourceRef, rendered.timelineRef];
  const allFixtureRefs = refs.every(fixtureRef);
  const anyFixtureRefs = refs.some(fixtureRef);

  if (anyFixtureRefs) {
    if (!allFixtureRefs || evidence.projectId !== TEST_FIXTURE_PROJECT_ID) {
      findings.push(finding('blocker', 'motion-proof-fixture-evidence-invalid', 'Synthetic fixture references are permitted only for the isolated Motion proof test fixture and may not be mixed with production artifact references.', { studyId: planned.id }));
      return { findings, fixtureOnly: true };
    }
    return { findings, fixtureOnly: true };
  }

  const source = readArtifact(rendered.sourceRef, 'utf8');
  const timeline = readArtifact(rendered.timelineRef, 'utf8');
  const video = readArtifact(rendered.videoRef);
  const capture = readArtifact(rendered.captureRef);

  for (const [kind, artifact] of Object.entries({ source, timeline, video, capture })) {
    if (!artifact.ok) findings.push(finding('blocker', 'motion-proof-artifact-unreadable', `Rendered Motion proof ${kind} artifact must exist beneath the repository artifact root and be independently readable.`, { studyId: planned.id, kind, ref: rendered[`${kind === 'source' ? 'source' : kind === 'timeline' ? 'timeline' : kind === 'video' ? 'video' : 'capture'}Ref`], reason: artifact.reason }));
  }
  if (findings.length) return { findings, fixtureOnly: false };

  const expectedStudyLiteral = `const study=${JSON.stringify(planned)};`;
  if (!source.value.includes(expectedStudyLiteral)) findings.push(finding('blocker', 'motion-proof-source-study-mismatch', 'Exact emitted browser source must embed the same planned study contract that is being reviewed.', { studyId: planned.id, sourceRef: rendered.sourceRef }));

  const calculated = {
    sourceSha256: digest(source.value),
    timelineSha256: digest(timeline.value),
    videoSha256: digest(video.value),
    captureSha256: digest(capture.value)
  };
  for (const key of Object.keys(calculated)) {
    if (!SHA256.test(rendered[key]) || rendered[key] !== calculated[key]) findings.push(finding('blocker', 'motion-proof-artifact-digest-mismatch', 'Rendered Motion proof digests must be recomputed from the exact referenced artifact bytes.', { studyId: planned.id, digest: key, claimed: rendered[key] || null, calculated: calculated[key] }));
  }

  if (!startsWithBytes(video.value, WEBM_HEADER) || video.value.length <= WEBM_HEADER.length) findings.push(finding('blocker', 'motion-proof-video-invalid', 'Temporal Motion proof requires a non-empty WebM artifact; a screenshot cannot substitute for temporal evidence.', { studyId: planned.id, videoRef: rendered.videoRef }));
  if (!startsWithBytes(capture.value, PNG_HEADER) || capture.value.length <= PNG_HEADER.length) findings.push(finding('blocker', 'motion-proof-capture-invalid', 'Motion proof end-frame evidence must be a non-empty PNG artifact.', { studyId: planned.id, captureRef: rendered.captureRef }));

  let parsedTimeline = null;
  try {
    parsedTimeline = JSON.parse(timeline.value);
  } catch {
    findings.push(finding('blocker', 'motion-proof-timeline-invalid-json', 'Browser timeline evidence must be valid JSON.', { studyId: planned.id, timelineRef: rendered.timelineRef }));
  }
  if (parsedTimeline) {
    if (parsedTimeline.schema !== 'ai-studio-os/motion-proof-browser-timeline@1' || parsedTimeline.studyId !== planned.id || parsedTimeline.input !== planned.input) {
      findings.push(finding('blocker', 'motion-proof-timeline-identity-mismatch', 'Browser timeline identity and input must match the exact planned study.', { studyId: planned.id, timelineStudyId: parsedTimeline.studyId ?? null, timelineInput: parsedTimeline.input ?? null }));
    }
    if (!sameContract(parsedTimeline.appliedCreativeIntent ?? null, planned.creativeIntent)) findings.push(finding('blocker', 'motion-proof-timeline-creative-intent-mismatch', 'Browser timeline must record the exact hypothesis-specific creative intent applied by the renderer.', { studyId: planned.id }));
    if (!(parsedTimeline.durationMs > 0) || !(parsedTimeline.animationFrameCount > 1) || Math.abs(Math.round(parsedTimeline.durationMs) - rendered.durationMs) > 1 || parsedTimeline.animationFrameCount !== rendered.frameCount) {
      findings.push(finding('blocker', 'motion-proof-timeline-metrics-mismatch', 'Claimed duration and frame count must match independently parsed browser timeline evidence.', { studyId: planned.id, claimedDurationMs: rendered.durationMs, timelineDurationMs: parsedTimeline.durationMs ?? null, claimedFrameCount: rendered.frameCount, timelineFrameCount: parsedTimeline.animationFrameCount ?? null }));
    }
  }

  return { findings, fixtureOnly: false };
}

export function reviewMotionProofPlan(plan = {}) {
  const findings = [];
  if (plan.schema !== 'ai-studio-os/motion-proof-plan@1') findings.push(finding('blocker', 'motion-proof-plan-schema-invalid', 'Motion proof requires motion-proof-plan@1.'));
  if (!text(plan.projectId) || !text(plan.creativeWorldId)) findings.push(finding('blocker', 'motion-proof-plan-binding-missing', 'Motion proof plan must bind project and Creative World identity.'));

  const authoritativeExploration = plan?.authorityInputs?.exploration ?? null;
  const explorationReview = reviewMotionCreativeExploration(authoritativeExploration ?? {});
  if (!explorationReview.reviewReady) findings.push(finding('blocker', 'motion-proof-exploration-not-ready', 'Only a Motion exploration whose canonical authority recomputes successfully may enter rendered proof.', { findingCodes: explorationReview.findings.map((item) => item.code) }));
  if (authoritativeExploration && (plan.projectId !== authoritativeExploration.projectId || plan.creativeWorldId !== authoritativeExploration.creativeWorldId)) {
    findings.push(finding('blocker', 'motion-proof-exploration-binding-drift', 'Motion proof project or Creative World drifted from the authoritative Motion exploration.'));
  }

  const hypotheses = Array.isArray(plan.hypotheses) ? plan.hypotheses : [];
  const expectedHypotheses = proofHypothesesFromExploration(authoritativeExploration ?? {});
  if (!sameSetById(hypotheses, expectedHypotheses)) findings.push(finding('blocker', 'motion-proof-hypothesis-contract-drift', 'Motion proof hypotheses must be the exact proof-facing contracts derived from the authoritative Motion exploration.'));
  if (plan.explorationRef?.schema !== authoritativeExploration?.schema || !sameContract([...(plan.explorationRef?.hypothesisIds ?? [])].sort(), expectedHypotheses.map((item) => item.id).sort())) {
    findings.push(finding('blocker', 'motion-proof-exploration-ref-drift', 'Motion proof exploration reference drifted from the recomputed authority.'));
  }

  const moments = Array.isArray(plan.moments) ? plan.moments.map(normalizeMoment) : [];
  const studies = Array.isArray(plan.studies) ? plan.studies : [];
  if (hypotheses.length < 3) findings.push(finding('major', 'motion-proof-divergence-coverage-thin', 'Rendered proof should compare at least three serious motion hypotheses.', { count: hypotheses.length }));
  if (moments.length < 3) findings.push(finding('major', 'motion-proof-moment-coverage-thin', 'Motion proof needs multiple temporal moments, not one hero animation.', { count: moments.length }));
  if (moments.some((moment) => !moment.id || !moment.label || !moment.purpose || !moment.viewport || !moment.input)) findings.push(finding('major', 'motion-proof-moment-contract-incomplete', 'Every Motion proof moment needs identity, purpose, viewport and input context.'));
  if (!moments.some((moment) => moment.viewport === 'mobile')) findings.push(finding('major', 'motion-proof-mobile-missing', 'Motion proof must include mobile behavior.'));
  if (!moments.some((moment) => moment.input === 'reduced-motion')) findings.push(finding('major', 'motion-proof-reduced-motion-missing', 'Motion proof must include a reduced-motion interpretation.'));

  const expectedStudies = studyMatrix({ projectId: plan.projectId, creativeWorldId: plan.creativeWorldId, hypotheses: expectedHypotheses, moments });
  if (!sameSetById(studies, expectedStudies)) findings.push(finding('blocker', 'motion-proof-study-contract-drift', 'Motion proof study matrix must exactly preserve hypothesis intent, moment context and project/world binding from the authoritative exploration.', { expected: expectedStudies.length, actual: studies.length }));
  if (new Set(studies.map((study) => study.id)).size !== studies.length) findings.push(finding('blocker', 'motion-proof-study-id-duplicate', 'Motion proof study IDs must be unique.'));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return {
    schema: 'ai-studio-os/motion-proof-plan-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-for-browser-render',
    findings,
    authoritativeExplorationReview: explorationReview,
    truth: {
      proofPlanIsNotRenderedEvidence: true,
      proofDoesNotSelectWinner: true,
      explorationAuthorityRecomputed: true,
      cachedExplorationReviewTrusted: false,
      exactHypothesisContractRequired: true,
      responsiveConsequencesBoundIntoMobileStudies: true
    }
  };
}

export function buildMotionProofPlan({ exploration, moments = DEFAULT_MOMENTS } = {}) {
  const explorationReview = reviewMotionCreativeExploration(exploration ?? {});
  const normalizedMoments = (Array.isArray(moments) ? moments : DEFAULT_MOMENTS).map(normalizeMoment);
  const hypotheses = proofHypothesesFromExploration(exploration ?? {});
  const studies = studyMatrix({ projectId: exploration?.projectId, creativeWorldId: exploration?.creativeWorldId, hypotheses, moments: normalizedMoments });
  const plan = {
    schema: 'ai-studio-os/motion-proof-plan@1',
    stage: 'motion-proof-plan',
    projectId: exploration?.projectId ?? null,
    creativeWorldId: exploration?.creativeWorldId ?? null,
    authorityInputs: { exploration: exploration ?? null },
    explorationRef: { schema: exploration?.schema ?? null, hypothesisIds: hypotheses.map((item) => item.id) },
    explorationReview,
    hypotheses,
    moments: normalizedMoments,
    studies,
    truth: {
      temporalStudiesRequired: true,
      proofPlanIsNotRenderedEvidence: true,
      explorationAuthorityMustRecompute: true,
      responsiveConsequencesBoundIntoMobileStudies: true,
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
    sourceSha256: text(study.sourceSha256).toLowerCase(),
    timelineSha256: text(study.timelineSha256).toLowerCase(),
    videoSha256: text(study.videoSha256).toLowerCase(),
    captureSha256: text(study.captureSha256).toLowerCase(),
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
  const planReview = reviewMotionProofPlan(evidence.plan ?? {});
  if (!planReview.reviewReady) findings.push(finding('blocker', 'motion-proof-plan-not-ready', 'Rendered evidence must originate from a Motion proof plan whose exploration authority and hypothesis contract still recompute.', { findingCodes: planReview.findings.map((item) => item.code) }));
  if (evidence.projectId !== evidence.plan?.projectId || evidence.creativeWorldId !== evidence.plan?.creativeWorldId) findings.push(finding('blocker', 'motion-proof-evidence-binding-drift', 'Rendered evidence must remain bound to the proof plan project and Creative World.'));

  const expectedStudies = evidence.plan?.studies ?? [];
  const renderedStudies = Array.isArray(evidence.renderedStudies) ? evidence.renderedStudies : [];
  if (new Set(renderedStudies.map((study) => study.studyId)).size !== renderedStudies.length) findings.push(finding('blocker', 'motion-proof-render-id-duplicate', 'Rendered Motion proof study IDs must be unique.'));
  const renderedById = new Map(renderedStudies.map((study) => [study.studyId, study]));
  let fixtureOnly = renderedStudies.length > 0;
  for (const planned of expectedStudies) {
    const rendered = renderedById.get(planned.id);
    if (!rendered) {
      findings.push(finding('blocker', 'motion-proof-render-missing', 'A planned temporal motion study has no rendered evidence.', { studyId: planned.id }));
      continue;
    }
    if (rendered.hypothesisId !== planned.hypothesisId || rendered.momentId !== planned.momentId) findings.push(finding('blocker', 'motion-proof-render-identity-drift', 'Rendered study identity does not match its proof-plan study.', { studyId: planned.id }));
    if (rendered.viewport !== planned.viewport || rendered.input !== planned.input) findings.push(finding('blocker', 'motion-proof-render-context-drift', 'Rendered study viewport/input context does not match the proof plan.', { studyId: planned.id }));
    if (!rendered.videoRef) findings.push(finding('blocker', 'motion-proof-temporal-video-missing', 'Motion proof requires a temporal WebM reference; static capture evidence alone cannot qualify.', { studyId: planned.id }));
    if (!rendered.captureRef) findings.push(finding('blocker', 'motion-proof-end-frame-missing', 'Motion proof requires a PNG end-frame alongside the temporal capture.', { studyId: planned.id }));
    if (!rendered.sourceRef || !rendered.timelineRef) findings.push(finding('blocker', 'motion-proof-source-or-timeline-missing', 'Rendered motion proof requires exact source and timeline/timing provenance.', { studyId: planned.id }));
    if (!SHA256.test(rendered.sourceSha256) || !SHA256.test(rendered.timelineSha256)) findings.push(finding('blocker', 'motion-proof-provenance-digest-missing', 'Rendered motion proof must bind exact source and browser timeline content with SHA-256 digests.', { studyId: planned.id }));
    if (rendered.browserRendered !== true || rendered.exactSourceRendered !== true) findings.push(finding('blocker', 'motion-proof-browser-integrity-unproven', 'Motion proof must state that a browser rendered the exact referenced source.', { studyId: planned.id }));
    if (!(rendered.durationMs > 0) || !(rendered.frameCount > 1)) findings.push(finding('blocker', 'motion-proof-temporal-metrics-invalid', 'Temporal evidence needs positive duration and multiple rendered frames.', { studyId: planned.id, durationMs: rendered.durationMs, frameCount: rendered.frameCount }));

    const artifactReview = verifyRenderedArtifacts({ evidence, planned, rendered });
    fixtureOnly = fixtureOnly && artifactReview.fixtureOnly;
    findings.push(...artifactReview.findings);
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
    planReview,
    truth: {
      exactBrowserTemporalEvidence: blockers.length === 0 && !fixtureOnly,
      referencedArtifactBytesReopened: blockers.length === 0 && !fixtureOnly,
      artifactDigestsRecomputed: blockers.length === 0 && !fixtureOnly,
      temporalVideoRequired: true,
      sourceAndTimelineDigestsRequired: true,
      proofPlanAuthorityRecomputed: true,
      cachedPlanReviewTrusted: false,
      testFixtureEvidenceOnly: blockers.length === 0 && fixtureOnly,
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