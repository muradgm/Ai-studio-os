import { fingerprintCreativeValue } from '../creative-intelligence-foundation/fingerprint.mjs';

export const CREATIVE_MOTION_DOGFOOD_CONDITIONS = Object.freeze([
  Object.freeze({ id: 'A', profile: 'motion-v1-baseline', motionV2: false, knowledgeProfile: 'none', synthesis: false, directModelControl: false }),
  Object.freeze({ id: 'B', profile: 'motion-v2-core-knowledge', motionV2: true, knowledgeProfile: 'qualified-core', synthesis: false, directModelControl: false }),
  Object.freeze({ id: 'C', profile: 'motion-v2-full-knowledge', motionV2: true, knowledgeProfile: 'full-qualified-motion-corpus', synthesis: false, directModelControl: false }),
  Object.freeze({ id: 'D', profile: 'motion-v2-full-knowledge-plus-synthesis', motionV2: true, knowledgeProfile: 'full-qualified-motion-corpus', synthesis: true, directModelControl: false }),
  Object.freeze({ id: 'E', profile: 'direct-model-control', motionV2: false, knowledgeProfile: 'none', synthesis: false, directModelControl: true })
]);

export const CREATIVE_MOTION_DOGFOOD_DIMENSIONS = Object.freeze([
  'concept-fidelity',
  'originality',
  'conceptual-divergence',
  'temporal-hierarchy',
  'rhythm',
  'motion-necessity',
  'stillness',
  'physical-character',
  'choreography',
  'typography-motion',
  'spatial-continuity',
  'interaction-quality',
  'mobile-reinterpretation',
  'reduced-motion-equivalence',
  'genericity-resistance',
  'restraint-taste',
  'production-plausibility'
]);

export const CREATIVE_MOTION_DOGFOOD_RATINGS = Object.freeze(['weak', 'mixed', 'strong', 'exceptional']);

const RATING_VALUE = Object.freeze({ weak: 1, mixed: 2, strong: 3, exceptional: 4 });
const CONDITION_IDS = new Set(CREATIVE_MOTION_DOGFOOD_CONDITIONS.map((item) => item.id));
const CONDITION_PROFILES = new Map(CREATIVE_MOTION_DOGFOOD_CONDITIONS.map((item) => [item.id, item]));
const DIMENSION_IDS = new Set(CREATIVE_MOTION_DOGFOOD_DIMENSIONS);
const RATING_IDS = new Set(CREATIVE_MOTION_DOGFOOD_RATINGS);
const DECISIONS = new Set(['productize-next', 'targeted-capability-pass', 'architecture-leverage-not-proven', 'inconclusive']);

function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function list(value) { return [...new Set((Array.isArray(value) ? value : []).map(text).filter(Boolean))]; }
function finiteInteger(value) { return Number.isInteger(value) && value >= 0 ? value : null; }
function finding(severity, code, message, evidence = {}) { return { severity, code, message, evidence }; }
function compareText(left, right) { const a = text(left); const b = text(right); return a === b ? 0 : a < b ? -1 : 1; }
function sameValue(left, right) { return fingerprintCreativeValue(left) === fingerprintCreativeValue(right); }

function normalizeBudget(value = {}) {
  return {
    maxGenerationAttempts: finiteInteger(value?.maxGenerationAttempts),
    tokenBudget: finiteInteger(value?.tokenBudget),
    wallClockSeconds: finiteInteger(value?.wallClockSeconds),
    modelPolicyId: text(value?.modelPolicyId),
    temperaturePolicyId: text(value?.temperaturePolicyId)
  };
}

function normalizeBrief(value = {}) {
  return {
    projectId: text(value?.projectId),
    title: text(value?.title),
    challenge: text(value?.challenge),
    audience: text(value?.audience),
    projectTruths: list(value?.projectTruths),
    contradictions: list(value?.contradictions),
    nonNegotiables: list(value?.nonNegotiables),
    antiPatterns: list(value?.antiPatterns),
    canonicalCreativeWorldRef: text(value?.canonicalCreativeWorldRef),
    canonicalCreativeWorldFingerprint: text(value?.canonicalCreativeWorldFingerprint),
    targetExperience: text(value?.targetExperience)
  };
}

function normalizeTrial(value = {}) {
  return {
    trialId: text(value?.trialId),
    conditionId: text(value?.conditionId).toUpperCase(),
    replicate: finiteInteger(value?.replicate),
    projectId: text(value?.projectId),
    briefFingerprint: text(value?.briefFingerprint),
    generationBudget: normalizeBudget(value?.generationBudget),
    evidenceBundleRef: text(value?.evidenceBundleRef),
    hypothesisCount: finiteInteger(value?.hypothesisCount),
    temporalStudyCount: finiteInteger(value?.temporalStudyCount),
    realBrowserEvidence: value?.realBrowserEvidence === true,
    mobileEvidence: value?.mobileEvidence === true,
    reducedMotionEvidence: value?.reducedMotionEvidence === true,
    runtimeTraceRef: text(value?.runtimeTraceRef),
    sourceSnapshotFingerprint: text(value?.sourceSnapshotFingerprint)
  };
}

function conditionShape(value = {}) {
  return {
    id: text(value?.id).toUpperCase(),
    profile: text(value?.profile),
    motionV2: value?.motionV2 === true,
    knowledgeProfile: text(value?.knowledgeProfile),
    synthesis: value?.synthesis === true,
    directModelControl: value?.directModelControl === true
  };
}

function canonicalConditionSet() {
  return CREATIVE_MOTION_DOGFOOD_CONDITIONS.map((item) => ({ ...item }));
}

function budgetFingerprint(budget) {
  return fingerprintCreativeValue(normalizeBudget(budget));
}

function canonicalExperimentTruth() {
  return {
    experimentOnly: true,
    structuralPassIsNotCreativeQuality: true,
    ratingsAreDiagnosticNotAuthority: true,
    noAutomaticWinner: true,
    noCreativeDirectionSelected: true,
    noHumanApprovalFabricated: true,
    noProductionAuthority: true
  };
}

function experimentSnapshotCore(value = {}) {
  return {
    schema: 'ai-studio-os/creative-motion-capability-dogfood@1',
    experimentId: text(value?.experimentId),
    projectId: text(value?.projectId),
    brief: normalizeBrief(value?.brief),
    briefFingerprint: text(value?.briefFingerprint),
    blindSeedFingerprint: text(value?.blindSeedFingerprint),
    conditions: (Array.isArray(value?.conditions) ? value.conditions : []).map(conditionShape),
    trials: (Array.isArray(value?.trials) ? value.trials : []).map(normalizeTrial),
    truth: canonicalExperimentTruth()
  };
}

function experimentSnapshotFingerprint(value = {}) {
  return fingerprintCreativeValue(experimentSnapshotCore(value));
}

function validateBrief(brief, projectId, findings) {
  if (!brief.projectId || brief.projectId !== projectId) findings.push(finding('blocker', 'dogfood-brief-project-invalid', 'Dogfood brief must bind the same explicit project identity as the experiment.'));
  for (const key of ['title', 'challenge', 'audience', 'canonicalCreativeWorldRef', 'canonicalCreativeWorldFingerprint', 'targetExperience']) {
    if (!brief[key]) findings.push(finding('blocker', 'dogfood-brief-field-missing', `Dogfood brief requires '${key}'.`, { key }));
  }
  if (brief.projectTruths.length < 3) findings.push(finding('major', 'dogfood-project-truth-thin', 'Dogfood brief should contain at least three concrete project truths.'));
  if (brief.contradictions.length < 2) findings.push(finding('major', 'dogfood-contradictions-thin', 'Dogfood brief should contain at least two productive contradictions.'));
  if (brief.nonNegotiables.length < 4) findings.push(finding('major', 'dogfood-nonnegotiables-thin', 'Dogfood brief should contain at least four non-negotiables.'));
  if (brief.antiPatterns.length < 3) findings.push(finding('major', 'dogfood-antipatterns-thin', 'Dogfood brief should explicitly reject at least three generic motion/design patterns.'));
}

function validateConditions(conditions, findings) {
  if (conditions.length !== CREATIVE_MOTION_DOGFOOD_CONDITIONS.length) {
    findings.push(finding('blocker', 'dogfood-condition-count-invalid', 'Dogfood V1 requires the canonical A/B/C/D/E condition set.', { count: conditions.length }));
    return;
  }
  const ids = conditions.map((item) => item.id);
  if (new Set(ids).size !== ids.length || ids.some((id) => !CONDITION_IDS.has(id))) findings.push(finding('blocker', 'dogfood-condition-id-invalid', 'Dogfood condition IDs must be exactly A, B, C, D and E.', { ids }));
  for (const condition of conditions) {
    const expected = CONDITION_PROFILES.get(condition.id);
    if (!expected || !sameValue(condition, expected)) findings.push(finding('blocker', 'dogfood-condition-profile-drift', 'Dogfood condition definitions are locked so the ablation cannot be relabelled after results are known.', { conditionId: condition.id || null }));
  }
}

function validateTrials(trials, experiment, findings) {
  if (trials.length !== 15) findings.push(finding('blocker', 'dogfood-trial-count-invalid', 'Dogfood V1 requires exactly three trials for each of five conditions.', { count: trials.length }));

  const trialIds = trials.map((trial) => trial.trialId);
  if (trialIds.some((id) => !id) || new Set(trialIds).size !== trialIds.length) findings.push(finding('blocker', 'dogfood-trial-id-invalid', 'Every dogfood trial requires a unique stable trial ID.'));

  const evidenceRefs = trials.map((trial) => trial.evidenceBundleRef).filter(Boolean);
  if (evidenceRefs.length !== trials.length || new Set(evidenceRefs).size !== evidenceRefs.length) findings.push(finding('blocker', 'dogfood-evidence-bundle-invalid', 'Every trial requires a unique evidence bundle reference.'));

  const runtimeRefs = trials.map((trial) => trial.runtimeTraceRef).filter(Boolean);
  if (runtimeRefs.length !== trials.length || new Set(runtimeRefs).size !== runtimeRefs.length) findings.push(finding('blocker', 'dogfood-runtime-trace-invalid', 'Every trial requires a unique runtime trace reference.'));

  const sourceFingerprints = trials.map((trial) => trial.sourceSnapshotFingerprint).filter(Boolean);
  if (sourceFingerprints.length !== trials.length) findings.push(finding('blocker', 'dogfood-source-snapshot-missing', 'Every trial requires an exact source/reasoning snapshot fingerprint.'));

  const baselineBudgetFingerprint = trials.length ? budgetFingerprint(trials[0].generationBudget) : '';

  for (const conditionId of CONDITION_IDS) {
    const group = trials.filter((trial) => trial.conditionId === conditionId);
    const replicates = group.map((trial) => trial.replicate).sort((a, b) => a - b);
    if (group.length !== 3 || !sameValue(replicates, [1, 2, 3])) findings.push(finding('blocker', 'dogfood-condition-replicates-invalid', 'Every condition requires replicates 1, 2 and 3 exactly once.', { conditionId, replicates }));
  }

  for (const trial of trials) {
    if (!CONDITION_IDS.has(trial.conditionId)) findings.push(finding('blocker', 'dogfood-trial-condition-invalid', 'Trial references an unsupported dogfood condition.', { trialId: trial.trialId, conditionId: trial.conditionId }));
    if (trial.projectId !== experiment.projectId) findings.push(finding('blocker', 'dogfood-trial-project-drift', 'Every dogfood trial must use the exact same project.', { trialId: trial.trialId }));
    if (trial.briefFingerprint !== experiment.briefFingerprint) findings.push(finding('blocker', 'dogfood-trial-brief-drift', 'Every dogfood trial must bind the exact same brief snapshot.', { trialId: trial.trialId }));
    if (budgetFingerprint(trial.generationBudget) !== baselineBudgetFingerprint) findings.push(finding('blocker', 'dogfood-budget-drift', 'Ablation conditions must use the same declared generation/time/token/model policy budget.', { trialId: trial.trialId }));
    if (trial.generationBudget.maxGenerationAttempts === null || trial.generationBudget.tokenBudget === null || trial.generationBudget.wallClockSeconds === null || !trial.generationBudget.modelPolicyId || !trial.generationBudget.temperaturePolicyId) findings.push(finding('blocker', 'dogfood-budget-incomplete', 'Each trial requires explicit generation, token, time, model and temperature policy budgets.', { trialId: trial.trialId }));
    if (trial.hypothesisCount === null || trial.hypothesisCount < 3) findings.push(finding('blocker', 'dogfood-hypothesis-count-thin', 'Each trial must expose at least three serious motion hypotheses.', { trialId: trial.trialId, count: trial.hypothesisCount }));
    if (trial.temporalStudyCount === null || trial.temporalStudyCount < 15) findings.push(finding('blocker', 'dogfood-temporal-proof-thin', 'Each trial must expose the full temporal comparison surface, including mobile and reduced motion.', { trialId: trial.trialId, count: trial.temporalStudyCount }));
    if (!trial.realBrowserEvidence || !trial.mobileEvidence || !trial.reducedMotionEvidence) findings.push(finding('blocker', 'dogfood-rendered-evidence-incomplete', 'Each trial requires real browser, mobile and reduced-motion evidence.', { trialId: trial.trialId }));
    if (!trial.sourceSnapshotFingerprint) findings.push(finding('blocker', 'dogfood-source-snapshot-missing', 'Each trial must bind the exact source/reasoning snapshot that produced its evidence.', { trialId: trial.trialId }));
  }
}

export function buildCreativeMotionCapabilityDogfood({ experimentId, projectId, brief, conditions = canonicalConditionSet(), trials = [], blindSeed = '' } = {}) {
  const normalizedBrief = normalizeBrief(brief);
  const experiment = {
    schema: 'ai-studio-os/creative-motion-capability-dogfood@1',
    stage: 'creative-motion-capability-dogfood',
    experimentId: text(experimentId),
    projectId: text(projectId),
    brief: normalizedBrief,
    briefFingerprint: fingerprintCreativeValue(normalizedBrief),
    blindSeedFingerprint: blindSeed ? fingerprintCreativeValue({ blindSeed: text(blindSeed) }) : '',
    conditions: (Array.isArray(conditions) ? conditions : []).map(conditionShape),
    trials: (Array.isArray(trials) ? trials : []).map(normalizeTrial),
    truth: canonicalExperimentTruth()
  };
  experiment.snapshotFingerprint = experimentSnapshotFingerprint(experiment);
  const review = reviewCreativeMotionCapabilityDogfood(experiment, { blindSeed });
  return { ...experiment, findings: review.findings, pass: review.pass, reviewReady: review.reviewReady, status: review.status, truth: { ...experiment.truth, ...review.truth } };
}

export function reviewCreativeMotionCapabilityDogfood(experiment = {}, { blindSeed = '' } = {}) {
  const findings = [];
  const brief = normalizeBrief(experiment?.brief);
  const conditions = (Array.isArray(experiment?.conditions) ? experiment.conditions : []).map(conditionShape);
  const trials = (Array.isArray(experiment?.trials) ? experiment.trials : []).map(normalizeTrial);
  const projectId = text(experiment?.projectId);
  const expectedBriefFingerprint = fingerprintCreativeValue(brief);
  const expectedSeedFingerprint = blindSeed ? fingerprintCreativeValue({ blindSeed: text(blindSeed) }) : '';

  if (experiment?.schema !== 'ai-studio-os/creative-motion-capability-dogfood@1') findings.push(finding('blocker', 'dogfood-schema-invalid', 'Creative/Motion Capability Dogfood requires the canonical V1 schema.'));
  if (experiment?.stage !== 'creative-motion-capability-dogfood') findings.push(finding('blocker', 'dogfood-stage-invalid', 'Dogfood artifact requires the canonical stage.'));
  if (!text(experiment?.experimentId)) findings.push(finding('blocker', 'dogfood-experiment-id-missing', 'Dogfood experiment requires a stable ID.'));
  if (!projectId) findings.push(finding('blocker', 'dogfood-project-id-missing', 'Dogfood experiment requires explicit project identity.'));
  if (text(experiment?.briefFingerprint) !== expectedBriefFingerprint) findings.push(finding('blocker', 'dogfood-brief-fingerprint-drift', 'Dogfood brief fingerprint must bind the exact normalized brief.'));
  if (!text(experiment?.blindSeedFingerprint)) findings.push(finding('blocker', 'dogfood-blind-seed-missing', 'Dogfood requires a blinded review seed fingerprint.'));
  if (blindSeed && text(experiment?.blindSeedFingerprint) !== expectedSeedFingerprint) findings.push(finding('blocker', 'dogfood-blind-seed-drift', 'Supplied blind seed does not match the experiment binding.'));
  if (text(experiment?.snapshotFingerprint) !== experimentSnapshotFingerprint(experiment)) findings.push(finding('blocker', 'dogfood-snapshot-drift', 'Dogfood snapshot fingerprint must bind brief, conditions, trials and truth exactly.'));

  validateBrief(brief, projectId, findings);
  validateConditions(conditions, findings);
  validateTrials(trials, { projectId, briefFingerprint: expectedBriefFingerprint }, findings);

  const truth = experiment?.truth ?? {};
  for (const [key, expected] of Object.entries(canonicalExperimentTruth())) {
    if (truth?.[key] !== expected) findings.push(finding('blocker', 'dogfood-truth-drift', 'Dogfood truth cannot be relaxed or promoted into creative authority.', { key, expected, actual: truth?.[key] }));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return {
    schema: 'ai-studio-os/creative-motion-capability-dogfood-review@1',
    findings,
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-for-blind-review',
    truth: {
      structuralPassIsNotCreativeQuality: true,
      realDogfoodEvidenceRequired: true,
      blindHumanInterpretationStillRequired: true,
      noAutomaticWinner: true,
      noCreativeDirectionSelected: true,
      noProductionAuthority: true
    }
  };
}

function blindEntries(experiment, blindSeed) {
  return experiment.trials.map(normalizeTrial).map((trial) => {
    const blindId = `candidate-${fingerprintCreativeValue({ experimentId: text(experiment?.experimentId), trialId: trial.trialId, seed: text(blindSeed) }).slice(0, 10)}`;
    const orderKey = fingerprintCreativeValue({ experimentId: text(experiment?.experimentId), trialId: trial.trialId, blindSeed: text(blindSeed), purpose: 'review-order' });
    return { trial, blindId, orderKey };
  }).sort((left, right) => compareText(left.orderKey, right.orderKey));
}

function blindPacketFingerprint(value = {}) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-motion-blind-review-packet@1',
    experimentId: text(value?.experimentId),
    projectId: text(value?.projectId),
    briefFingerprint: text(value?.briefFingerprint),
    dimensions: list(value?.dimensions),
    ratingScale: list(value?.ratingScale),
    candidates: Array.isArray(value?.candidates) ? value.candidates : []
  });
}

export function buildCreativeMotionBlindReviewPacket(experiment = {}, { blindSeed = '' } = {}) {
  const review = reviewCreativeMotionCapabilityDogfood(experiment, { blindSeed });
  if (!review.reviewReady) {
    return {
      schema: 'ai-studio-os/creative-motion-blind-review-packet@1',
      experimentId: text(experiment?.experimentId),
      candidates: null,
      findings: [finding('blocker', 'dogfood-not-ready-for-blinding', 'Experiment must be review-ready before a blind packet can be created.', { findingCodes: review.findings.map((item) => item.code) })],
      pass: false,
      reviewReady: false,
      status: 'blocked',
      truth: { reviewerPacketContainsConditionIdentity: false, ratingsAreDiagnosticNotAuthority: true, noAutomaticWinner: true, noCreativeDirectionSelected: true, noProductionAuthority: true }
    };
  }

  const candidates = blindEntries(experiment, blindSeed).map(({ trial, blindId }) => ({
    blindId,
    evidenceAlias: `dogfood://${text(experiment.experimentId)}/blind/${blindId}`
  }));

  const packet = {
    schema: 'ai-studio-os/creative-motion-blind-review-packet@1',
    experimentId: text(experiment.experimentId),
    projectId: text(experiment.projectId),
    brief: normalizeBrief(experiment.brief),
    briefFingerprint: text(experiment.briefFingerprint),
    dimensions: [...CREATIVE_MOTION_DOGFOOD_DIMENSIONS],
    ratingScale: [...CREATIVE_MOTION_DOGFOOD_RATINGS],
    candidates,
    truth: {
      reviewerPacketContainsConditionIdentity: false,
      blindReviewProtocolEnforced: true,
      reviewerConditionIdentityHidden: true,
      unblindingMappingSeparated: true,
      blindSequenceCryptographicallyProven: false,
      ratingsAreDiagnosticNotAuthority: true,
      noAutomaticWinner: true,
      noCreativeDirectionSelected: true,
      noProductionAuthority: true
    }
  };
  packet.snapshotFingerprint = blindPacketFingerprint(packet);
  return { ...packet, findings: [], pass: true, reviewReady: true, status: 'ready-for-blind-review' };
}

function unblindingMapFingerprint(value = {}) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-motion-unblinding-map@1',
    experimentId: text(value?.experimentId),
    mapping: Array.isArray(value?.mapping) ? value.mapping : []
  });
}

export function buildCreativeMotionUnblindingMap(experiment = {}, { blindSeed = '' } = {}) {
  const review = reviewCreativeMotionCapabilityDogfood(experiment, { blindSeed });
  if (!review.reviewReady) return { schema: 'ai-studio-os/creative-motion-unblinding-map@1', experimentId: text(experiment?.experimentId), mapping: null, findings: [finding('blocker', 'dogfood-not-ready-for-unblinding-map', 'Experiment must be review-ready before the private map can be created.')], pass: false, reviewReady: false, status: 'blocked' };

  const mapping = blindEntries(experiment, blindSeed).map(({ trial, blindId }) => ({
    blindId,
    trialId: trial.trialId,
    conditionId: trial.conditionId,
    replicate: trial.replicate,
    evidenceBundleRef: trial.evidenceBundleRef,
    runtimeTraceRef: trial.runtimeTraceRef,
    sourceSnapshotFingerprint: trial.sourceSnapshotFingerprint
  }));
  const map = { schema: 'ai-studio-os/creative-motion-unblinding-map@1', experimentId: text(experiment.experimentId), mapping };
  map.snapshotFingerprint = unblindingMapFingerprint(map);
  return { ...map, findings: [], pass: true, reviewReady: true, status: 'private-review-map', truth: { mustNotBeShownBeforeReviewSubmission: true, creativeAuthority: false, productionAuthority: false } };
}

function normalizeDimensionReview(value = {}) {
  return { dimensionId: text(value?.dimensionId), rating: text(value?.rating).toLowerCase(), rationale: text(value?.rationale) };
}

function normalizeCandidateReview(value = {}) {
  return { blindId: text(value?.blindId), dimensions: (Array.isArray(value?.dimensions) ? value.dimensions : []).map(normalizeDimensionReview) };
}

function normalizeReviewer(value = {}) {
  return {
    reviewerId: text(value?.reviewerId),
    reviewerType: text(value?.reviewerType),
    independent: value?.independent === true,
    blinded: value?.blinded === true,
    blindSubmissionPrecedesUnblindingAttested: value?.blindSubmissionPrecedesUnblindingAttested === true,
    candidateReviews: (Array.isArray(value?.candidateReviews) ? value.candidateReviews : []).map(normalizeCandidateReview),
    topChoiceBlindId: text(value?.topChoiceBlindId) || null,
    topChoiceRationale: text(value?.topChoiceRationale)
  };
}

function average(values) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null; }
function rounded(value) { return value === null ? null : Math.round(value * 100) / 100; }

export function reviewCreativeMotionDogfoodResults(packet = {}, { unblindingMap = {}, reviewers = [], humanDecision = null } = {}) {
  const findings = [];
  const candidates = Array.isArray(packet?.candidates) ? packet.candidates : [];
  const mapping = Array.isArray(unblindingMap?.mapping) ? unblindingMap.mapping : [];
  const blindIds = new Set(candidates.map((item) => text(item.blindId)));
  const mappingByBlindId = new Map(mapping.map((item) => [text(item.blindId), item]));
  const normalizedReviewers = (Array.isArray(reviewers) ? reviewers : []).map(normalizeReviewer);

  if (packet?.schema !== 'ai-studio-os/creative-motion-blind-review-packet@1' || packet?.reviewReady !== true || text(packet?.snapshotFingerprint) !== blindPacketFingerprint(packet)) findings.push(finding('blocker', 'dogfood-review-packet-invalid', 'Dogfood results require an intact review-ready blind packet.'));
  if (unblindingMap?.schema !== 'ai-studio-os/creative-motion-unblinding-map@1' || unblindingMap?.reviewReady !== true || text(unblindingMap?.snapshotFingerprint) !== unblindingMapFingerprint(unblindingMap)) findings.push(finding('blocker', 'dogfood-unblinding-map-invalid', 'Dogfood results require the separate intact private unblinding map.'));
  if (text(packet?.experimentId) !== text(unblindingMap?.experimentId)) findings.push(finding('blocker', 'dogfood-unblinding-experiment-drift', 'Blind packet and unblinding map must belong to the same experiment.'));
  if (candidates.length !== 15 || mapping.length !== 15) findings.push(finding('blocker', 'dogfood-review-packet-cardinality-invalid', 'Blind packet and unblinding map must each contain all 15 trials.'));
  if (mapping.some((item) => !blindIds.has(text(item.blindId))) || new Set(mapping.map((item) => text(item.blindId))).size !== blindIds.size) findings.push(finding('blocker', 'dogfood-unblinding-map-coverage-invalid', 'Private map must resolve every blind candidate exactly once.'));
  if (!normalizedReviewers.length) findings.push(finding('major', 'dogfood-reviewer-missing', 'At least one blinded reviewer is required before capability evidence can be interpreted.'));
  if (!normalizedReviewers.some((reviewer) => reviewer.reviewerType === 'human')) findings.push(finding('major', 'dogfood-human-reviewer-missing', 'At least one human reviewer is required for the V1 capability decision.'));

  const reviewerIds = normalizedReviewers.map((item) => item.reviewerId);
  if (reviewerIds.some((id) => !id) || new Set(reviewerIds).size !== reviewerIds.length) findings.push(finding('blocker', 'dogfood-reviewer-id-invalid', 'Every reviewer requires a unique stable ID.'));

  for (const reviewer of normalizedReviewers) {
    if (reviewer.independent !== true || reviewer.blinded !== true) findings.push(finding('blocker', 'dogfood-review-not-blind-independent', 'Reviewer evidence must explicitly state independent blinded review.', { reviewerId: reviewer.reviewerId }));
    if (reviewer.blindSubmissionPrecedesUnblindingAttested !== true) findings.push(finding('blocker', 'dogfood-review-submission-sequence-unattested', 'Reviewer evidence must explicitly attest that blind review submission preceded access to the unblinding map; this is process evidence, not cryptographic proof.', { reviewerId: reviewer.reviewerId }));
    if (reviewer.candidateReviews.length !== candidates.length) findings.push(finding('blocker', 'dogfood-review-coverage-incomplete', 'Each reviewer must review every blinded trial.', { reviewerId: reviewer.reviewerId, count: reviewer.candidateReviews.length }));
    const reviewedBlindIds = reviewer.candidateReviews.map((item) => item.blindId);
    if (new Set(reviewedBlindIds).size !== reviewedBlindIds.length || reviewedBlindIds.some((id) => !blindIds.has(id))) findings.push(finding('blocker', 'dogfood-review-candidate-invalid', 'Reviewer candidate IDs must match the blind packet exactly.', { reviewerId: reviewer.reviewerId }));
    for (const candidateReview of reviewer.candidateReviews) {
      const dimensions = candidateReview.dimensions;
      const dimensionIds = dimensions.map((item) => item.dimensionId);
      if (dimensions.length !== CREATIVE_MOTION_DOGFOOD_DIMENSIONS.length || new Set(dimensionIds).size !== dimensionIds.length || dimensionIds.some((id) => !DIMENSION_IDS.has(id))) findings.push(finding('blocker', 'dogfood-review-dimensions-invalid', 'Every candidate review must cover every canonical quality dimension exactly once.', { reviewerId: reviewer.reviewerId, blindId: candidateReview.blindId }));
      for (const dimension of dimensions) {
        if (!RATING_IDS.has(dimension.rating) || !dimension.rationale) findings.push(finding('major', 'dogfood-review-rating-weak-evidence', 'Every dimension requires an ordinal rating and written rationale.', { reviewerId: reviewer.reviewerId, blindId: candidateReview.blindId, dimensionId: dimension.dimensionId }));
      }
    }
    if (reviewer.topChoiceBlindId && !blindIds.has(reviewer.topChoiceBlindId)) findings.push(finding('blocker', 'dogfood-review-top-choice-invalid', 'Reviewer top choice must reference a blind candidate.', { reviewerId: reviewer.reviewerId }));
    if (reviewer.topChoiceBlindId && !reviewer.topChoiceRationale) findings.push(finding('major', 'dogfood-review-top-choice-rationale-missing', 'A top choice requires qualitative rationale.', { reviewerId: reviewer.reviewerId }));
  }

  const conditionDimensions = new Map();
  const topChoiceCounts = new Map(CREATIVE_MOTION_DOGFOOD_CONDITIONS.map((item) => [item.id, 0]));

  for (const reviewer of normalizedReviewers) {
    for (const candidateReview of reviewer.candidateReviews) {
      const item = mappingByBlindId.get(candidateReview.blindId);
      if (!item) continue;
      for (const dimension of candidateReview.dimensions) {
        if (!RATING_IDS.has(dimension.rating)) continue;
        const key = `${item.conditionId}:${dimension.dimensionId}`;
        const values = conditionDimensions.get(key) ?? [];
        values.push(RATING_VALUE[dimension.rating]);
        conditionDimensions.set(key, values);
      }
    }
    if (reviewer.topChoiceBlindId) {
      const item = mappingByBlindId.get(reviewer.topChoiceBlindId);
      if (item) topChoiceCounts.set(item.conditionId, (topChoiceCounts.get(item.conditionId) ?? 0) + 1);
    }
  }

  const conditionSummaries = CREATIVE_MOTION_DOGFOOD_CONDITIONS.map((condition) => ({
    conditionId: condition.id,
    profile: condition.profile,
    dimensionDiagnostics: CREATIVE_MOTION_DOGFOOD_DIMENSIONS.map((dimensionId) => ({ dimensionId, diagnosticMean: rounded(average(conditionDimensions.get(`${condition.id}:${dimensionId}`) ?? [])) })),
    reviewerTopChoiceCount: topChoiceCounts.get(condition.id) ?? 0
  }));

  const summaryByCondition = new Map(conditionSummaries.map((item) => [item.conditionId, item]));
  const comparisons = [
    ['A', 'B', 'motion-v2-core-value'],
    ['B', 'C', 'knowledge-breadth-value'],
    ['C', 'D', 'transfer-synthesis-egress-value'],
    ['E', 'D', 'architecture-vs-direct-model']
  ].map(([fromId, toId, id]) => {
    const from = summaryByCondition.get(fromId);
    const to = summaryByCondition.get(toId);
    const deltas = CREATIVE_MOTION_DOGFOOD_DIMENSIONS.map((dimensionId) => {
      const left = from?.dimensionDiagnostics.find((item) => item.dimensionId === dimensionId)?.diagnosticMean ?? null;
      const right = to?.dimensionDiagnostics.find((item) => item.dimensionId === dimensionId)?.diagnosticMean ?? null;
      return { dimensionId, delta: left === null || right === null ? null : rounded(right - left) };
    });
    return { id, fromConditionId: fromId, toConditionId: toId, deltas };
  });

  let normalizedDecision = null;
  if (humanDecision !== null && typeof humanDecision === 'object') {
    normalizedDecision = { outcome: text(humanDecision?.outcome), rationale: text(humanDecision?.rationale), evidenceRef: text(humanDecision?.evidenceRef) };
    if (!DECISIONS.has(normalizedDecision.outcome) || !normalizedDecision.rationale || !normalizedDecision.evidenceRef) findings.push(finding('blocker', 'dogfood-human-decision-invalid', 'Human capability decision requires a supported outcome, rationale and evidence reference.'));
    for (const key of ['approved', 'selected', 'creativeDirectionSelected', 'productionApproved', 'technicalPlanningAuthorized']) {
      if (humanDecision?.[key] === true) findings.push(finding('blocker', 'dogfood-human-decision-authority-fabricated', 'Dogfood capability decision cannot manufacture creative or production authority.', { key }));
    }
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const reviewComplete = blockers.length === 0 && majors.length === 0;
  return {
    schema: 'ai-studio-os/creative-motion-dogfood-results@1',
    experimentId: text(packet?.experimentId),
    reviewerCount: normalizedReviewers.length,
    humanReviewerCount: normalizedReviewers.filter((item) => item.reviewerType === 'human').length,
    conditionSummaries,
    comparisons,
    humanDecision: normalizedDecision,
    findings,
    pass: blockers.length === 0,
    reviewReady: reviewComplete,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : normalizedDecision ? 'human-interpreted' : 'ready-for-human-interpretation',
    truth: {
      noOverallCreativeScore: true,
      diagnosticMeansAreNotAuthority: true,
      comparisonDeltasAreNotWinnerSelection: true,
      humanInterpretationRequiredForRoadmapDecision: true,
      blindReviewProtocolEnforced: true,
      reviewerConditionIdentityHidden: true,
      unblindingMappingSeparated: true,
      blindSubmissionPrecedesUnblindingAttested: normalizedReviewers.length > 0 && normalizedReviewers.every((item) => item.blindSubmissionPrecedesUnblindingAttested === true),
      blindSequenceCryptographicallyProven: false,
      creativeDirectionSelected: false,
      productionApproved: false
    }
  };
}
