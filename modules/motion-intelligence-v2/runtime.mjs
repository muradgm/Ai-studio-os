import { fingerprintCreativeValue } from '../creative-intelligence-foundation/fingerprint.mjs';
import { reviewCreativeKnowledgeRetrievalProvenance } from '../creative-knowledge-graph/provenance.mjs';
import { reviewCreativeSynthesisCandidateSet } from '../creative-synthesis-intelligence/candidate.mjs';
import { buildMotionCreativeExploration } from '../motion-creative-intelligence/runtime.mjs';
import { reviewMotionCreativeWorldAuthority } from '../motion-creative-intelligence/world-authority.mjs';

function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function list(value) { return [...new Set((Array.isArray(value) ? value : []).map(text).filter(Boolean))]; }
function sortedList(value) { return list(value).sort(compareText); }
function compareText(left, right) { const a = text(left); const b = text(right); return a === b ? 0 : a < b ? -1 : 1; }
function sameValue(left, right) { return fingerprintCreativeValue(left) === fingerprintCreativeValue(right); }
function finding(severity, code, message, evidence = {}) { return { severity, code, message, evidence }; }
function unknownKeys(object, allowed) {
  if (!object || typeof object !== 'object' || Array.isArray(object)) return [];
  const set = new Set(allowed);
  return Object.keys(object).filter((key) => !set.has(key)).sort(compareText);
}

const TEMPORAL_STRATEGIES = new Set([
  'continuity',
  'punctuation',
  'material-response',
  'progressive-reveal',
  'counterpoint',
  'stillness-dominant',
  'narrative-sequence'
]);
const COMPLEXITY_CLASSES = new Set(['low', 'medium', 'high']);
const TECHNOLOGY_TERMS = /\b(three\.?js|webgl|webgpu|gsap|scrolltrigger|rive|blender|houdini|lottie|waapi|web animations api|shader implementation|physics engine)\b/i;

const BRIEF_KEYS = Object.freeze([
  'schema', 'stage', 'projectId', 'creativeWorldId', 'projectTruths', 'constraints',
  'knowledgeBinding', 'knowledgeEvidence', 'synthesisBinding', 'synthesisCandidates',
  'snapshotFingerprint', 'truth', 'findings', 'pass', 'reviewReady', 'status'
]);
const AUTHORITY_INPUT_KEYS = Object.freeze(['canonicalCreativeAuthority', 'knowledge', 'synthesis']);
const KNOWLEDGE_INPUT_KEYS = Object.freeze(['retrieval', 'graph', 'foundation']);
const SYNTHESIS_INPUT_KEYS = Object.freeze(['candidateArtifact', 'synthesis', 'brief', 'sources']);
const KNOWLEDGE_BINDING_KEYS = Object.freeze([
  'schema', 'projectId', 'asOf', 'retrievalSnapshotFingerprint', 'provenanceReceiptFingerprint',
  'knowledgeIds', 'knowledgeCount'
]);
const SYNTHESIS_BINDING_KEYS = Object.freeze([
  'schema', 'projectId', 'candidateSetSnapshotFingerprint', 'candidateIds', 'candidateCount'
]);
const PROJECT_TRUTH_KEYS = Object.freeze(['id', 'statement']);
const KNOWLEDGE_PROJECTION_KEYS = Object.freeze([
  'knowledgeId', 'kind', 'domain', 'title', 'definition', 'causalRationale', 'perceptualEffects',
  'worksWhen', 'failsWhen', 'creativeVariables', 'crossDomainApplications', 'failureModes',
  'counterexamples', 'diagnostics', 'confidence', 'transferability', 'transferablePrinciples',
  'adaptationRules', 'copyRisks'
]);
const SYNTHESIS_PROJECTION_KEYS = Object.freeze([
  'id', 'strategy', 'governingIdea', 'productiveTension', 'combinationMechanism',
  'experientialConsequences', 'antiGenericClaims', 'failureModes', 'uncertainty', 'falsifier', 'critique'
]);

const SET_KEYS = Object.freeze([
  'schema', 'stage', 'brief', 'hypotheses', 'snapshotFingerprint', 'truth',
  'findings', 'pass', 'reviewReady', 'status'
]);
const HYPOTHESIS_KEYS = Object.freeze([
  'id', 'title', 'temporalStrategy', 'projectTruthRefs', 'creativeWorldRefs',
  'knowledgeRefs', 'knowledgeContributions', 'synthesisCandidateRefs', 'synthesisContributions',
  'semanticIntent', 'signatureBehavior', 'motionNecessity', 'attentionSequence',
  'temporalComposition', 'motionHierarchy', 'physicalCharacter', 'choreography',
  'cinematicLanguage', 'mediaMotion', 'responsivePlan', 'reducedMotionEquivalent',
  'accessibilityConstraints', 'performanceReasoning', 'antiPatterns', 'failureModes',
  'uncertainty', 'falsifier', 'critique'
]);
const CONTRIBUTION_KEYS = Object.freeze(['sourceId', 'contribution']);
const MOTION_NECESSITY_KEYS = Object.freeze(['moves', 'rationale', 'earnedBy', 'stillnessCases', 'stillnessRationale']);
const ATTENTION_BEAT_KEYS = Object.freeze(['id', 'focus', 'reason', 'next']);
const TEMPORAL_COMPOSITION_KEYS = Object.freeze(['rhythm', 'pacing', 'anticipation', 'holds', 'overlap', 'stillness', 'easingLanguage', 'energyCurve']);
const PHYSICAL_CHARACTER_KEYS = Object.freeze(['mass', 'inertia', 'friction', 'elasticity', 'damping', 'rationale']);
const CHOREOGRAPHY_KEYS = Object.freeze(['spatial', 'interaction', 'scroll', 'depthModel']);
const CINEMATIC_KEYS = Object.freeze(['camera', 'framing', 'reveal', 'continuity', 'editing']);
const MEDIA_MOTION_KEYS = Object.freeze(['typography', 'image', 'material', 'procedural']);
const RESPONSIVE_KEYS = Object.freeze(['desktop', 'mobile', 'touch']);
const PERFORMANCE_KEYS = Object.freeze(['complexityClass', 'costDrivers', 'justification', 'fallback']);

const HANDOFF_KEYS = Object.freeze([
  'schema', 'stage', 'reasoningSetSnapshotFingerprint', 'exploration', 'snapshotFingerprint',
  'truth', 'findings', 'pass', 'reviewReady', 'status'
]);

const BRIEF_REVIEW_INPUTS = new WeakMap();

function normalizeAuthorityInputs(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    canonicalCreativeAuthority: source.canonicalCreativeAuthority ?? null,
    knowledge: source.knowledge ?? null,
    synthesis: source.synthesis ?? null
  };
}

function rememberBriefReviewInputs(brief, authorityInputs) {
  if (brief && typeof brief === 'object') BRIEF_REVIEW_INPUTS.set(brief, normalizeAuthorityInputs(authorityInputs));
  return brief;
}

function reviewInputsForBrief(brief, suppliedAuthorityInputs = null) {
  if (suppliedAuthorityInputs && typeof suppliedAuthorityInputs === 'object') return normalizeAuthorityInputs(suppliedAuthorityInputs);
  return BRIEF_REVIEW_INPUTS.get(brief) ?? {};
}

function normalizeProjectTruth(value = {}) {
  return { id: text(value?.id), statement: text(value?.statement) };
}

function normalizeKnowledgeProjection(item = {}) {
  const entry = item?.entry && typeof item.entry === 'object' ? item.entry : item;
  const transfer = entry?.transfer && typeof entry.transfer === 'object' ? entry.transfer : entry;
  return {
    knowledgeId: text(item?.knowledgeId ?? entry?.id),
    kind: text(entry?.kind),
    domain: text(entry?.domain),
    title: text(entry?.title),
    definition: text(entry?.definition),
    causalRationale: text(entry?.causalRationale),
    perceptualEffects: list(entry?.perceptualEffects),
    worksWhen: list(entry?.worksWhen),
    failsWhen: list(entry?.failsWhen),
    creativeVariables: list(entry?.creativeVariables),
    crossDomainApplications: list(entry?.crossDomainApplications),
    failureModes: list(entry?.failureModes),
    counterexamples: list(entry?.counterexamples),
    diagnostics: list(entry?.diagnostics),
    confidence: typeof entry?.confidence === 'number' ? entry.confidence : null,
    transferability: text(entry?.transferability),
    transferablePrinciples: list(transfer?.transferablePrinciples),
    adaptationRules: list(transfer?.adaptationRules),
    copyRisks: list(transfer?.copyRisks)
  };
}

function normalizeSynthesisProjection(value = {}) {
  return {
    id: text(value?.id),
    strategy: text(value?.strategy),
    governingIdea: text(value?.governingIdea),
    productiveTension: text(value?.productiveTension),
    combinationMechanism: text(value?.combinationMechanism),
    experientialConsequences: list(value?.experientialConsequences),
    antiGenericClaims: list(value?.antiGenericClaims),
    failureModes: list(value?.failureModes),
    uncertainty: text(value?.uncertainty),
    falsifier: text(value?.falsifier),
    critique: list(value?.critique)
  };
}

function canonicalBriefTruth() {
  return {
    deepMotionReasoningEvidenceOnly: true,
    knowledgeIsMotionAuthority: false,
    synthesisIsMotionAuthority: false,
    retrievalRankIsMotionAuthority: false,
    motionV1AuthoritySkeletonPreserved: true,
    renderedTemporalProofStillRequired: true,
    motionCriticStillRequired: true,
    humanMotionSelectionStillRequired: true,
    structuralCoverageIsNotCreativeQuality: true,
    technologyIsNotMotionConcept: true,
    fullProvenanceSourcesExcludedFromArtifact: true,
    creativeDirectionSelected: false,
    productionApproved: false
  };
}

function canonicalSetTruth() {
  return {
    motionHypothesesAreCandidatesOnly: true,
    noWinnerOrRecommendationProduced: true,
    noScoresProduced: true,
    structuralDivergenceOnly: true,
    semanticMotionQualityVerified: false,
    v1ExplorationCompatibilityRequired: true,
    renderedTemporalProofStillRequired: true,
    motionCriticStillRequired: true,
    humanMotionSelectionStillRequired: true,
    creativeDirectionSelected: false,
    productionApproved: false
  };
}

function canonicalHandoffTruth() {
  return {
    motionV2IsAdvisoryReasoning: true,
    existingMotionV1ExplorationReused: true,
    existingMotionV1ProofRequired: true,
    existingMotionCriticRequired: true,
    humanMotionSelectionRequired: true,
    motionDirectionCreated: false,
    technicalPlanningAuthorized: false,
    productionApproved: false
  };
}

function normalizeContribution(value = {}) {
  return { sourceId: text(value?.sourceId), contribution: text(value?.contribution) };
}

function normalizeMotionNecessity(value = {}) {
  return {
    moves: value?.moves === true,
    rationale: text(value?.rationale),
    earnedBy: list(value?.earnedBy),
    stillnessCases: list(value?.stillnessCases),
    stillnessRationale: text(value?.stillnessRationale)
  };
}

function normalizeAttentionBeat(value = {}) {
  return { id: text(value?.id), focus: text(value?.focus), reason: text(value?.reason), next: text(value?.next) || null };
}

function normalizeTemporalComposition(value = {}) {
  return {
    rhythm: text(value?.rhythm),
    pacing: text(value?.pacing),
    anticipation: text(value?.anticipation),
    holds: text(value?.holds),
    overlap: text(value?.overlap),
    stillness: text(value?.stillness),
    easingLanguage: text(value?.easingLanguage),
    energyCurve: text(value?.energyCurve)
  };
}

function normalizePhysicalCharacter(value = {}) {
  return {
    mass: text(value?.mass),
    inertia: text(value?.inertia),
    friction: text(value?.friction),
    elasticity: text(value?.elasticity),
    damping: text(value?.damping),
    rationale: text(value?.rationale)
  };
}

function normalizeChoreography(value = {}) {
  return {
    spatial: text(value?.spatial),
    interaction: text(value?.interaction),
    scroll: text(value?.scroll),
    depthModel: text(value?.depthModel)
  };
}

function normalizeCinematicLanguage(value = {}) {
  return {
    camera: text(value?.camera),
    framing: text(value?.framing),
    reveal: text(value?.reveal),
    continuity: text(value?.continuity),
    editing: text(value?.editing)
  };
}

function normalizeMediaMotion(value = {}) {
  return {
    typography: text(value?.typography),
    image: text(value?.image),
    material: text(value?.material),
    procedural: text(value?.procedural)
  };
}

function normalizeResponsivePlan(value = {}) {
  return { desktop: text(value?.desktop), mobile: text(value?.mobile), touch: text(value?.touch) };
}

function normalizePerformanceReasoning(value = {}) {
  return {
    complexityClass: text(value?.complexityClass).toLowerCase(),
    costDrivers: list(value?.costDrivers),
    justification: text(value?.justification),
    fallback: text(value?.fallback)
  };
}

function normalizeHypothesis(value = {}) {
  return {
    id: text(value?.id),
    title: text(value?.title),
    temporalStrategy: text(value?.temporalStrategy),
    projectTruthRefs: sortedList(value?.projectTruthRefs),
    creativeWorldRefs: sortedList(value?.creativeWorldRefs),
    knowledgeRefs: sortedList(value?.knowledgeRefs),
    knowledgeContributions: (Array.isArray(value?.knowledgeContributions) ? value.knowledgeContributions : [])
      .map(normalizeContribution).sort((a, b) => compareText(a.sourceId, b.sourceId)),
    synthesisCandidateRefs: sortedList(value?.synthesisCandidateRefs),
    synthesisContributions: (Array.isArray(value?.synthesisContributions) ? value.synthesisContributions : [])
      .map(normalizeContribution).sort((a, b) => compareText(a.sourceId, b.sourceId)),
    semanticIntent: text(value?.semanticIntent),
    signatureBehavior: text(value?.signatureBehavior),
    motionNecessity: normalizeMotionNecessity(value?.motionNecessity),
    attentionSequence: (Array.isArray(value?.attentionSequence) ? value.attentionSequence : []).map(normalizeAttentionBeat),
    temporalComposition: normalizeTemporalComposition(value?.temporalComposition),
    motionHierarchy: text(value?.motionHierarchy),
    physicalCharacter: normalizePhysicalCharacter(value?.physicalCharacter),
    choreography: normalizeChoreography(value?.choreography),
    cinematicLanguage: normalizeCinematicLanguage(value?.cinematicLanguage),
    mediaMotion: normalizeMediaMotion(value?.mediaMotion),
    responsivePlan: normalizeResponsivePlan(value?.responsivePlan),
    reducedMotionEquivalent: text(value?.reducedMotionEquivalent),
    accessibilityConstraints: list(value?.accessibilityConstraints),
    performanceReasoning: normalizePerformanceReasoning(value?.performanceReasoning),
    antiPatterns: list(value?.antiPatterns),
    failureModes: list(value?.failureModes),
    uncertainty: text(value?.uncertainty),
    falsifier: text(value?.falsifier),
    critique: list(value?.critique)
  };
}

function knowledgeInputs(value = {}) {
  return value && typeof value === 'object' ? value : {};
}

function synthesisInputs(value = null) {
  return value && typeof value === 'object' ? value : null;
}

function canonicalAuthorityProjectId(authorityInputs = {}) {
  const canonical = authorityInputs?.canonicalCreativeAuthority ?? {};
  return text(canonical?.projectId ?? canonical?.creativeThesis?.projectId ?? canonical?.creativeWorldExploration?.projectId);
}

function rebuildWorldReview(projectId, authorityInputs = {}) {
  return reviewMotionCreativeWorldAuthority({
    projectId,
    canonicalCreativeAuthority: authorityInputs?.canonicalCreativeAuthority
  });
}

function rebuildKnowledgeProvenance(authorityInputs = {}) {
  const input = knowledgeInputs(authorityInputs?.knowledge);
  return reviewCreativeKnowledgeRetrievalProvenance({
    retrieval: input.retrieval,
    graph: input.graph,
    foundation: input.foundation
  });
}

function rebuildSynthesisReview(authorityInputs = {}) {
  const input = synthesisInputs(authorityInputs?.synthesis);
  if (!input) return null;
  return reviewCreativeSynthesisCandidateSet(input.candidateArtifact ?? {}, {
    synthesis: input.synthesis,
    brief: input.brief,
    sources: input.sources
  });
}

function rawVerifiedKnowledgeEvidence(authorityInputs = {}, provenance = rebuildKnowledgeProvenance(authorityInputs)) {
  if (!provenance.reviewReady) return [];
  const retrieval = authorityInputs?.knowledge?.retrieval ?? {};
  return (Array.isArray(retrieval?.results) ? retrieval.results : []).map(normalizeKnowledgeProjection);
}

function expectedKnowledgeEvidence(authorityInputs = {}, provenance = rebuildKnowledgeProvenance(authorityInputs)) {
  const evidence = rawVerifiedKnowledgeEvidence(authorityInputs, provenance);
  if (!provenance.reviewReady) return [];
  const sourceProjectId = text(authorityInputs?.knowledge?.retrieval?.query?.projectId);
  const expectedProjectId = canonicalAuthorityProjectId(authorityInputs);
  if (!expectedProjectId || sourceProjectId !== expectedProjectId) return [];
  if (evidence.some((item) => item.domain !== 'motion')) return [];
  return evidence;
}

function synthesisProjectId(authorityInputs = {}) {
  return text(authorityInputs?.synthesis?.brief?.projectId ?? authorityInputs?.synthesis?.synthesis?.projectId);
}

function rawVerifiedSynthesisCandidates(authorityInputs = {}, review = rebuildSynthesisReview(authorityInputs)) {
  if (!review?.reviewReady) return [];
  const artifact = authorityInputs?.synthesis?.candidateArtifact ?? {};
  return (Array.isArray(artifact?.candidates) ? artifact.candidates : []).map(normalizeSynthesisProjection);
}

function expectedSynthesisCandidates(authorityInputs = {}, review = rebuildSynthesisReview(authorityInputs)) {
  const candidates = rawVerifiedSynthesisCandidates(authorityInputs, review);
  if (!review?.reviewReady) return [];
  const expectedProjectId = canonicalAuthorityProjectId(authorityInputs);
  if (!expectedProjectId || synthesisProjectId(authorityInputs) !== expectedProjectId) return [];
  return candidates;
}

function knowledgeBinding(authorityInputs, provenance, evidence) {
  const retrieval = authorityInputs?.knowledge?.retrieval ?? {};
  const sourceProjectId = text(retrieval?.query?.projectId);
  const expectedProjectId = canonicalAuthorityProjectId(authorityInputs);
  const sourceEligible = provenance?.reviewReady === true && expectedProjectId && sourceProjectId === expectedProjectId
    && evidence.length > 0;
  return {
    schema: 'ai-studio-os/motion-intelligence-knowledge-binding@1',
    projectId: sourceEligible ? sourceProjectId : expectedProjectId,
    asOf: text(retrieval?.query?.asOf),
    retrievalSnapshotFingerprint: text(retrieval?.snapshotFingerprint),
    provenanceReceiptFingerprint: fingerprintCreativeValue(provenance?.sourceReceipt ?? {}),
    knowledgeIds: evidence.map((item) => item.knowledgeId),
    knowledgeCount: evidence.length
  };
}

function synthesisBinding(authorityInputs, review, candidates) {
  if (!authorityInputs?.synthesis) return null;
  const expectedProjectId = canonicalAuthorityProjectId(authorityInputs);
  const sourceProjectId = synthesisProjectId(authorityInputs);
  const sourceEligible = review?.reviewReady === true && expectedProjectId && sourceProjectId === expectedProjectId
    && candidates.length > 0;
  return {
    schema: 'ai-studio-os/motion-intelligence-synthesis-binding@1',
    projectId: sourceEligible ? sourceProjectId : expectedProjectId,
    candidateSetSnapshotFingerprint: text(authorityInputs?.synthesis?.candidateArtifact?.snapshotFingerprint),
    candidateIds: candidates.map((item) => item.id),
    candidateCount: candidates.length
  };
}

function briefFingerprint(value = {}) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/motion-intelligence-brief@2',
    projectId: text(value?.projectId),
    creativeWorldId: text(value?.creativeWorldId),
    projectTruths: (Array.isArray(value?.projectTruths) ? value.projectTruths : []).map(normalizeProjectTruth),
    constraints: list(value?.constraints),
    knowledgeBinding: value?.knowledgeBinding ?? null,
    knowledgeEvidence: (Array.isArray(value?.knowledgeEvidence) ? value.knowledgeEvidence : []).map(normalizeKnowledgeProjection),
    synthesisBinding: value?.synthesisBinding ?? null,
    synthesisCandidates: (Array.isArray(value?.synthesisCandidates) ? value.synthesisCandidates : []).map(normalizeSynthesisProjection),
    truth: canonicalBriefTruth()
  });
}

function canonicalBriefCore({ projectId, canonicalCreativeAuthority, knowledge, synthesis = null, projectTruths = [], constraints = [] } = {}) {
  const authorityInputs = normalizeAuthorityInputs({ canonicalCreativeAuthority, knowledge, synthesis });
  const worldReview = rebuildWorldReview(projectId, authorityInputs);
  const knowledgeProvenance = rebuildKnowledgeProvenance(authorityInputs);
  const synthesisReview = rebuildSynthesisReview(authorityInputs);
  const knowledgeEvidence = expectedKnowledgeEvidence(authorityInputs, knowledgeProvenance);
  const synthesisCandidates = expectedSynthesisCandidates(authorityInputs, synthesisReview);
  const brief = {
    schema: 'ai-studio-os/motion-intelligence-brief@2',
    stage: 'motion-intelligence-v2-brief',
    projectId: text(projectId),
    creativeWorldId: text(worldReview?.authority?.creativeWorldId),
    projectTruths: (Array.isArray(projectTruths) ? projectTruths : []).map(normalizeProjectTruth),
    constraints: list(constraints),
    knowledgeBinding: knowledgeBinding(authorityInputs, knowledgeProvenance, knowledgeEvidence),
    knowledgeEvidence,
    synthesisBinding: synthesisBinding(authorityInputs, synthesisReview, synthesisCandidates),
    synthesisCandidates,
    truth: canonicalBriefTruth()
  };
  brief.snapshotFingerprint = briefFingerprint(brief);
  return { brief, authorityInputs, worldReview, knowledgeProvenance, synthesisReview };
}

export function reviewMotionIntelligenceV2Brief(brief = {}, suppliedAuthorityInputs = null) {
  const findings = [];
  const projectTruths = (Array.isArray(brief?.projectTruths) ? brief.projectTruths : []).map(normalizeProjectTruth);
  const constraints = list(brief?.constraints);
  const authorityInputs = reviewInputsForBrief(brief, suppliedAuthorityInputs);
  const worldReview = rebuildWorldReview(brief?.projectId, authorityInputs);
  const knowledgeProvenance = rebuildKnowledgeProvenance(authorityInputs);
  const synthesisReview = rebuildSynthesisReview(authorityInputs);
  const rawVerifiedKnowledge = rawVerifiedKnowledgeEvidence(authorityInputs, knowledgeProvenance);
  const expectedKnowledge = expectedKnowledgeEvidence(authorityInputs, knowledgeProvenance);
  const expectedSynthesis = expectedSynthesisCandidates(authorityInputs, synthesisReview);
  const expectedKnowledgeBinding = knowledgeBinding(authorityInputs, knowledgeProvenance, expectedKnowledge);
  const expectedSynthesisBinding = synthesisBinding(authorityInputs, synthesisReview, expectedSynthesis);

  if (brief?.schema !== 'ai-studio-os/motion-intelligence-brief@2') findings.push(finding('blocker', 'motion-v2-brief-schema-invalid', 'Motion Intelligence V2 Brief requires motion-intelligence-brief@2.'));
  if (brief?.stage !== 'motion-intelligence-v2-brief') findings.push(finding('blocker', 'motion-v2-brief-stage-invalid', 'Motion Intelligence V2 Brief requires the canonical V2 brief stage.'));
  const topUnknown = unknownKeys(brief, BRIEF_KEYS);
  if (topUnknown.length) findings.push(finding('blocker', 'motion-v2-brief-shape-invalid', 'Motion V2 Brief may contain only canonical fields and derived review state.', { unknownKeys: topUnknown }));
  const authorityUnknown = unknownKeys(authorityInputs, AUTHORITY_INPUT_KEYS);
  if (authorityUnknown.length) findings.push(finding('blocker', 'motion-v2-authority-input-shape-invalid', 'Motion V2 review inputs may contain only canonical Creative World, knowledge and optional Synthesis evidence.', { unknownKeys: authorityUnknown }));
  const knowledgeUnknown = unknownKeys(authorityInputs?.knowledge, KNOWLEDGE_INPUT_KEYS);
  if (knowledgeUnknown.length) findings.push(finding('blocker', 'motion-v2-knowledge-input-shape-invalid', 'Motion V2 knowledge review input may contain only retrieval, graph and Foundation.', { unknownKeys: knowledgeUnknown }));
  if (authorityInputs?.synthesis) {
    const synthesisUnknown = unknownKeys(authorityInputs.synthesis, SYNTHESIS_INPUT_KEYS);
    if (synthesisUnknown.length) findings.push(finding('blocker', 'motion-v2-synthesis-input-shape-invalid', 'Motion V2 Synthesis review input may contain only candidate artifact and its full provenance inputs.', { unknownKeys: synthesisUnknown }));
  }

  if (!text(brief?.projectId)) findings.push(finding('blocker', 'motion-v2-project-missing', 'Motion V2 requires explicit project identity.'));
  if (!worldReview.reviewReady) findings.push(finding('blocker', 'motion-v2-world-authority-invalid', 'Motion V2 requires the existing canonical Creative World authority to pass fresh recomputation.', { findingCodes: worldReview.findings.map((item) => item.code) }));
  if (worldReview.reviewReady && text(brief?.creativeWorldId) !== text(worldReview?.authority?.creativeWorldId)) findings.push(finding('blocker', 'motion-v2-world-binding-drift', 'Motion V2 Brief must bind the exact authoritative Creative World.', { expected: worldReview?.authority?.creativeWorldId ?? null, actual: brief?.creativeWorldId ?? null }));

  if (!knowledgeProvenance.reviewReady) findings.push(finding('blocker', 'motion-v2-knowledge-provenance-invalid', 'Motion V2 requires independently rebuilt Creative Knowledge retrieval provenance before exposing knowledge to motion reasoning.', { findingCodes: knowledgeProvenance.findings.map((item) => item.code) }));
  if (knowledgeProvenance.reviewReady && text(authorityInputs?.knowledge?.retrieval?.query?.projectId) !== text(brief?.projectId)) findings.push(finding('blocker', 'motion-v2-knowledge-project-drift', 'Motion V2 knowledge retrieval must be scoped to the same project as the Motion Brief.'));
  if (rawVerifiedKnowledge.some((item) => item.domain !== 'motion')) findings.push(finding('blocker', 'motion-v2-non-motion-knowledge-injected', 'Motion V2 primary knowledge evidence must be explicitly scoped to the motion domain.', { count: rawVerifiedKnowledge.filter((item) => item.domain !== 'motion').length }));
  if (expectedKnowledge.length < 8) findings.push(finding('major', 'motion-v2-knowledge-coverage-thin', 'Deep Motion reasoning should begin from a sufficiently broad qualified motion evidence set; V2 requires at least eight independently verified motion principles for a review-ready brief.', { count: expectedKnowledge.length }));

  const knowledgeBindingUnknown = unknownKeys(brief?.knowledgeBinding, KNOWLEDGE_BINDING_KEYS);
  if (knowledgeBindingUnknown.length || !sameValue(brief?.knowledgeBinding ?? {}, expectedKnowledgeBinding)) findings.push(finding('blocker', 'motion-v2-knowledge-binding-drift', 'Motion V2 knowledge binding must exactly match independently recomputed retrieval provenance and visible knowledge evidence.', { unknownKeys: knowledgeBindingUnknown }));
  const rawKnowledge = Array.isArray(brief?.knowledgeEvidence) ? brief.knowledgeEvidence : [];
  rawKnowledge.forEach((item, index) => {
    const unknown = unknownKeys(item, KNOWLEDGE_PROJECTION_KEYS);
    if (unknown.length || !sameValue(item, normalizeKnowledgeProjection(item))) findings.push(finding('blocker', 'motion-v2-knowledge-projection-drift', 'Motion V2 may expose only the canonical project-safe knowledge projection.', { index, unknownKeys: unknown }));
  });
  if (!sameValue(rawKnowledge, expectedKnowledge)) findings.push(finding('blocker', expectedKnowledge.length ? 'motion-v2-knowledge-evidence-drift' : 'motion-v2-blocked-knowledge-leak', expectedKnowledge.length ? 'Motion V2 visible knowledge must equal the independently verified retrieval projection.' : 'Failed or ineligible knowledge sources must expose no project reasoning evidence.'));

  if (authorityInputs?.synthesis) {
    if (!synthesisReview?.reviewReady) findings.push(finding('blocker', 'motion-v2-synthesis-provenance-invalid', 'When Synthesis evidence is supplied, Motion V2 must independently reverify the complete Synthesis Candidate egress chain.', { findingCodes: synthesisReview?.findings?.map((item) => item.code) ?? [] }));
    const sourceSynthesisProjectId = synthesisProjectId(authorityInputs);
    if (synthesisReview?.reviewReady && sourceSynthesisProjectId !== text(brief?.projectId)) findings.push(finding('blocker', 'motion-v2-synthesis-project-drift', 'Supplied Synthesis evidence must belong to the same project as Motion V2.'));
  }
  const synthesisBindingUnknown = brief?.synthesisBinding === null ? [] : unknownKeys(brief?.synthesisBinding, SYNTHESIS_BINDING_KEYS);
  if (synthesisBindingUnknown.length || !sameValue(brief?.synthesisBinding ?? null, expectedSynthesisBinding)) findings.push(finding('blocker', 'motion-v2-synthesis-binding-drift', 'Motion V2 Synthesis binding must exactly match independently reverified Synthesis candidate egress.', { unknownKeys: synthesisBindingUnknown }));
  const rawSynthesis = Array.isArray(brief?.synthesisCandidates) ? brief.synthesisCandidates : [];
  rawSynthesis.forEach((item, index) => {
    const unknown = unknownKeys(item, SYNTHESIS_PROJECTION_KEYS);
    if (unknown.length || !sameValue(item, normalizeSynthesisProjection(item))) findings.push(finding('blocker', 'motion-v2-synthesis-projection-drift', 'Motion V2 may expose only the canonical safe Synthesis candidate projection.', { index, unknownKeys: unknown }));
  });
  if (!sameValue(rawSynthesis, expectedSynthesis)) findings.push(finding('blocker', expectedSynthesis.length ? 'motion-v2-synthesis-evidence-drift' : 'motion-v2-blocked-synthesis-leak', expectedSynthesis.length ? 'Motion V2 visible Synthesis candidates must equal the independently reverified candidate egress.' : 'Failed or cross-project Synthesis evidence must expose no Synthesis candidate content.'));

  const rawTruths = Array.isArray(brief?.projectTruths) ? brief.projectTruths : [];
  rawTruths.forEach((item, index) => {
    const unknown = unknownKeys(item, PROJECT_TRUTH_KEYS);
    if (unknown.length || !sameValue(item, projectTruths[index])) findings.push(finding('blocker', 'motion-v2-project-truth-contract-drift', 'Motion V2 project truths must use exact id/statement contracts.', { index, unknownKeys: unknown }));
  });
  const truthIds = projectTruths.map((item) => item.id);
  if (projectTruths.length < 2) findings.push(finding('major', 'motion-v2-project-truth-grounding-thin', 'Motion V2 should reason from at least two explicit project truths so motion is not grounded only in generic motion knowledge.', { count: projectTruths.length }));
  if (truthIds.some((id) => !id) || new Set(truthIds).size !== truthIds.length || projectTruths.some((item) => !item.statement)) findings.push(finding('blocker', 'motion-v2-project-truth-invalid', 'Motion V2 project truths require unique IDs and non-empty statements.'));
  if (!sameValue(brief?.constraints ?? [], constraints)) findings.push(finding('blocker', 'motion-v2-constraints-contract-drift', 'Motion V2 constraints must equal the canonical normalized list.'));

  if (text(brief?.snapshotFingerprint) !== briefFingerprint(brief)) findings.push(finding('blocker', 'motion-v2-brief-fingerprint-mismatch', 'Motion V2 Brief fingerprint must bind exact project/world, knowledge, optional Synthesis evidence and truth state.'));
  if (!sameValue(brief?.truth ?? {}, canonicalBriefTruth())) findings.push(finding('blocker', 'motion-v2-brief-truth-drift', 'Motion V2 Brief truth boundary is fixed and cannot create creative or production authority.'));

  const coreBlockers = findings.filter((item) => item.severity === 'blocker');
  const coreMajors = findings.filter((item) => item.severity === 'major');
  const expectedPass = coreBlockers.length === 0;
  const expectedReady = coreBlockers.length === 0 && coreMajors.length === 0;
  const expectedStatus = coreBlockers.length ? 'blocked' : coreMajors.length ? 'provisional' : 'ready-for-deep-motion-reasoning';
  if (Object.hasOwn(brief, 'pass') && brief.pass !== expectedPass) findings.push(finding('blocker', 'motion-v2-brief-pass-claim-drift', 'Cached Motion V2 Brief pass state must match fresh review.'));
  if (Object.hasOwn(brief, 'reviewReady') && brief.reviewReady !== expectedReady) findings.push(finding('blocker', 'motion-v2-brief-ready-claim-drift', 'Cached Motion V2 Brief reviewReady state must match fresh review.'));
  if (Object.hasOwn(brief, 'status') && brief.status !== expectedStatus) findings.push(finding('blocker', 'motion-v2-brief-status-claim-drift', 'Cached Motion V2 Brief status must match fresh review.', { expected: expectedStatus, actual: brief.status }));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return {
    schema: 'ai-studio-os/motion-intelligence-brief-review@2',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-for-deep-motion-reasoning',
    findings,
    worldReview,
    knowledgeProvenance,
    synthesisReview,
    truth: canonicalBriefTruth()
  };
}

export function buildMotionIntelligenceV2Brief(input = {}) {
  const { brief, authorityInputs } = canonicalBriefCore(input);
  rememberBriefReviewInputs(brief, authorityInputs);
  const review = reviewMotionIntelligenceV2Brief(brief, authorityInputs);
  const artifact = {
    ...brief,
    findings: review.findings,
    pass: review.pass,
    reviewReady: review.reviewReady,
    status: review.status
  };
  rememberBriefReviewInputs(artifact, authorityInputs);
  return artifact;
}

function inspectNestedShape(raw, normalized, findingPrefix, findings, hypothesisId) {
  const pairs = [
    ['motionNecessity', MOTION_NECESSITY_KEYS],
    ['temporalComposition', TEMPORAL_COMPOSITION_KEYS],
    ['physicalCharacter', PHYSICAL_CHARACTER_KEYS],
    ['choreography', CHOREOGRAPHY_KEYS],
    ['cinematicLanguage', CINEMATIC_KEYS],
    ['mediaMotion', MEDIA_MOTION_KEYS],
    ['responsivePlan', RESPONSIVE_KEYS],
    ['performanceReasoning', PERFORMANCE_KEYS]
  ];
  for (const [key, allowed] of pairs) {
    const unknown = unknownKeys(raw?.[key], allowed);
    if (unknown.length || !sameValue(raw?.[key] ?? {}, normalized[key])) findings.push(finding('blocker', `${findingPrefix}-${key}-shape-invalid`, `Motion V2 ${key} must use its exact canonical contract.`, { hypothesisId, unknownKeys: unknown }));
  }
  (Array.isArray(raw?.attentionSequence) ? raw.attentionSequence : []).forEach((item, index) => {
    const unknown = unknownKeys(item, ATTENTION_BEAT_KEYS);
    if (unknown.length || !sameValue(item, normalized.attentionSequence[index])) findings.push(finding('blocker', `${findingPrefix}-attention-beat-shape-invalid`, 'Motion V2 attention beats must use id/focus/reason/next only.', { hypothesisId, index, unknownKeys: unknown }));
  });
  for (const key of ['knowledgeContributions', 'synthesisContributions']) {
    (Array.isArray(raw?.[key]) ? raw[key] : []).forEach((item, index) => {
      const unknown = unknownKeys(item, CONTRIBUTION_KEYS);
      if (unknown.length) findings.push(finding('blocker', `${findingPrefix}-${key}-shape-invalid`, 'Motion V2 source contributions may contain only sourceId and contribution.', { hypothesisId, index, unknownKeys: unknown }));
    });
  }
}

function conceptualFingerprint(hypothesis = {}) {
  const h = normalizeHypothesis(hypothesis);
  return fingerprintCreativeValue({
    semanticIntent: h.semanticIntent,
    signatureBehavior: h.signatureBehavior,
    motionNecessity: h.motionNecessity,
    attentionSequence: h.attentionSequence,
    temporalComposition: h.temporalComposition,
    motionHierarchy: h.motionHierarchy,
    physicalCharacter: h.physicalCharacter,
    choreography: h.choreography,
    cinematicLanguage: h.cinematicLanguage,
    mediaMotion: h.mediaMotion,
    responsivePlan: h.responsivePlan,
    reducedMotionEquivalent: h.reducedMotionEquivalent,
    accessibilityConstraints: h.accessibilityConstraints,
    performanceReasoning: h.performanceReasoning,
    antiPatterns: h.antiPatterns,
    failureModes: h.failureModes,
    uncertainty: h.uncertainty,
    falsifier: h.falsifier,
    critique: h.critique
  });
}

function conceptualText(h = {}) {
  return [
    h.semanticIntent, h.signatureBehavior,
    h.motionNecessity?.rationale, ...(h.motionNecessity?.earnedBy ?? []), ...(h.motionNecessity?.stillnessCases ?? []), h.motionNecessity?.stillnessRationale,
    ...(h.attentionSequence ?? []).flatMap((beat) => [beat.focus, beat.reason]),
    ...Object.values(h.temporalComposition ?? {}), h.motionHierarchy,
    ...Object.values(h.physicalCharacter ?? {}), ...Object.values(h.choreography ?? {}),
    ...Object.values(h.cinematicLanguage ?? {}), ...Object.values(h.mediaMotion ?? {}),
    ...Object.values(h.responsivePlan ?? {}), h.reducedMotionEquivalent,
    ...(h.accessibilityConstraints ?? []), ...(h.antiPatterns ?? []), ...(h.failureModes ?? []),
    h.uncertainty, h.falsifier, ...(h.critique ?? [])
  ].map(text).filter(Boolean).join(' ');
}

function contributionSetReview(refs, contributions) {
  const refSet = sortedList(refs);
  const sourceIds = contributions.map((item) => item.sourceId);
  return {
    exact: sameValue(refSet, sortedList(sourceIds)) && new Set(sourceIds).size === sourceIds.length,
    emptyContributionIds: contributions.filter((item) => !item.contribution).map((item) => item.sourceId)
  };
}

function validateAttentionSequence(sequence) {
  const issues = [];
  if (sequence.length < 2) issues.push('at-least-two-beats-required');
  const ids = sequence.map((beat) => beat.id);
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) issues.push('unique-beat-ids-required');
  sequence.forEach((beat, index) => {
    if (!beat.focus || !beat.reason) issues.push(`beat-${index + 1}-focus-reason-required`);
    const expectedNext = index < sequence.length - 1 ? sequence[index + 1].id : null;
    if ((beat.next ?? null) !== expectedNext) issues.push(`beat-${index + 1}-next-drift`);
  });
  return issues;
}

function v1HypothesisFromV2(hypothesis) {
  const h = normalizeHypothesis(hypothesis);
  return {
    id: h.id,
    title: h.title,
    interpretation: h.semanticIntent,
    creativeWorldRefs: h.creativeWorldRefs,
    language: {
      motionThesis: h.semanticIntent,
      signatureMotionBehavior: h.signatureBehavior,
      temporalRhythm: `${h.temporalComposition.rhythm} ${h.temporalComposition.pacing}`.trim(),
      spatialBehavior: h.choreography.spatial,
      transitionGrammar: `${h.cinematicLanguage.editing} ${h.cinematicLanguage.continuity}`.trim(),
      interactionCharacter: h.choreography.interaction,
      easingLanguage: h.temporalComposition.easingLanguage,
      energyCurve: h.temporalComposition.energyCurve,
      depthModel: h.choreography.depthModel,
      stillnessPolicy: `${h.motionNecessity.stillnessRationale} ${h.temporalComposition.stillness}`.trim(),
      reducedMotionInterpretation: h.reducedMotionEquivalent
    },
    motionMoments: h.motionNecessity.earnedBy,
    stillMoments: h.motionNecessity.stillnessCases,
    hierarchyConsequences: [h.motionHierarchy],
    responsiveConsequences: [h.responsivePlan.desktop, h.responsivePlan.mobile, h.responsivePlan.touch].filter(Boolean),
    antiPatterns: h.antiPatterns,
    critique: h.critique,
    technicalOptions: [],
    specialistIntent: {}
  };
}

function buildDerivedV1Exploration(brief, hypotheses, authorityInputs = reviewInputsForBrief(brief)) {
  return buildMotionCreativeExploration({
    projectId: brief?.projectId,
    canonicalCreativeAuthority: authorityInputs?.canonicalCreativeAuthority,
    hypotheses: hypotheses.map(v1HypothesisFromV2)
  });
}

function setFingerprint(value = {}) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/motion-intelligence-reasoning-set@2',
    briefSnapshotFingerprint: text(value?.brief?.snapshotFingerprint),
    hypotheses: (Array.isArray(value?.hypotheses) ? value.hypotheses : []).map(normalizeHypothesis),
    truth: canonicalSetTruth()
  });
}

export function reviewMotionIntelligenceV2Set(reasoningSet = {}, suppliedAuthorityInputs = null) {
  const findings = [];
  const brief = reasoningSet?.brief ?? {};
  const authorityInputs = reviewInputsForBrief(brief, suppliedAuthorityInputs);
  const briefReview = reviewMotionIntelligenceV2Brief(brief, authorityInputs);
  const rawHypotheses = Array.isArray(reasoningSet?.hypotheses) ? reasoningSet.hypotheses : [];
  const hypotheses = rawHypotheses.map(normalizeHypothesis);

  if (reasoningSet?.schema !== 'ai-studio-os/motion-intelligence-reasoning-set@2') findings.push(finding('blocker', 'motion-v2-set-schema-invalid', 'Motion Intelligence V2 reasoning requires motion-intelligence-reasoning-set@2.'));
  if (reasoningSet?.stage !== 'motion-intelligence-v2-reasoning') findings.push(finding('blocker', 'motion-v2-set-stage-invalid', 'Motion Intelligence V2 reasoning requires the canonical reasoning stage.'));
  const topUnknown = unknownKeys(reasoningSet, SET_KEYS);
  if (topUnknown.length) findings.push(finding('blocker', 'motion-v2-set-shape-invalid', 'Motion V2 reasoning set may contain only canonical fields and derived review state.', { unknownKeys: topUnknown }));
  if (!briefReview.reviewReady) findings.push(finding('blocker', 'motion-v2-set-brief-not-ready', 'Motion V2 reasoning requires a freshly review-ready provenance-bound Motion V2 Brief.', { findingCodes: briefReview.findings.map((item) => item.code) }));

  if (hypotheses.length < 3) findings.push(finding('major', 'motion-v2-divergence-thin', 'Motion V2 should explore at least three materially different deep-motion hypotheses before V1 proof.', { count: hypotheses.length }));
  const ids = hypotheses.map((item) => item.id);
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) findings.push(finding('blocker', 'motion-v2-hypothesis-id-invalid', 'Motion V2 hypotheses require unique non-empty IDs.', { ids }));
  const strategies = hypotheses.map((item) => item.temporalStrategy);
  const distinctStrategies = new Set(strategies.filter((item) => TEMPORAL_STRATEGIES.has(item)));
  if (strategies.some((item) => !TEMPORAL_STRATEGIES.has(item))) findings.push(finding('blocker', 'motion-v2-temporal-strategy-invalid', 'Motion V2 hypotheses require a supported structural temporal strategy.', { strategies }));
  if (distinctStrategies.size < 3) findings.push(finding('major', 'motion-v2-strategy-divergence-thin', 'Review-ready Motion V2 exploration requires at least three distinct structural temporal strategies.', { strategies: [...distinctStrategies] }));

  const knowledgeIds = new Set((brief?.knowledgeEvidence ?? []).map((item) => item.knowledgeId));
  const synthesisIds = new Set((brief?.synthesisCandidates ?? []).map((item) => item.id));
  const projectTruthIds = new Set((brief?.projectTruths ?? []).map((item) => item.id));
  const conceptFingerprints = new Map();

  hypotheses.forEach((hypothesis, index) => {
    const raw = rawHypotheses[index] ?? {};
    const unknown = unknownKeys(raw, HYPOTHESIS_KEYS);
    if (unknown.length || !sameValue(raw, hypothesis)) findings.push(finding('blocker', 'motion-v2-hypothesis-shape-invalid', 'Motion V2 hypotheses must use the exact canonical deep-motion contract.', { hypothesisId: hypothesis.id || null, unknownKeys: unknown }));
    inspectNestedShape(raw, hypothesis, 'motion-v2', findings, hypothesis.id || null);

    if (!hypothesis.title || !hypothesis.semanticIntent || !hypothesis.signatureBehavior) findings.push(finding('major', 'motion-v2-semantic-intent-thin', 'Each Motion V2 hypothesis needs a title, semantic intent and signature behavior.', { hypothesisId: hypothesis.id }));
    if (hypothesis.projectTruthRefs.length < 1 || hypothesis.projectTruthRefs.some((id) => !projectTruthIds.has(id))) findings.push(finding('major', 'motion-v2-project-truth-grounding-invalid', 'Each Motion V2 hypothesis must cite at least one valid project truth from the V2 Brief.', { hypothesisId: hypothesis.id, projectTruthRefs: hypothesis.projectTruthRefs }));
    if (hypothesis.creativeWorldRefs.length < 2) findings.push(finding('major', 'motion-v2-world-grounding-thin', 'Each Motion V2 hypothesis should cite at least two selected Creative World decisions; exact resolution is rechecked through the V1 exploration contract.', { hypothesisId: hypothesis.id }));

    if (hypothesis.knowledgeRefs.length < 3) findings.push(finding('major', 'motion-v2-knowledge-grounding-thin', 'Each deep-motion hypothesis should synthesize at least three qualified motion principles.', { hypothesisId: hypothesis.id, count: hypothesis.knowledgeRefs.length }));
    const invalidKnowledgeRefs = hypothesis.knowledgeRefs.filter((id) => !knowledgeIds.has(id));
    if (invalidKnowledgeRefs.length) findings.push(finding('blocker', 'motion-v2-knowledge-ref-invalid', 'Motion V2 hypothesis knowledge refs must resolve to independently verified Motion V2 Brief evidence.', { hypothesisId: hypothesis.id, invalidKnowledgeRefs }));
    const knowledgeContributionReview = contributionSetReview(hypothesis.knowledgeRefs, hypothesis.knowledgeContributions);
    if (!knowledgeContributionReview.exact) findings.push(finding('blocker', 'motion-v2-knowledge-contribution-set-drift', 'Motion V2 must state exactly one explicit causal/project contribution for every claimed knowledge source.', { hypothesisId: hypothesis.id }));
    if (knowledgeContributionReview.emptyContributionIds.length) findings.push(finding('major', 'motion-v2-knowledge-contribution-empty', 'Motion V2 knowledge contributions must explain what each source changes in the project-specific motion reasoning.', { hypothesisId: hypothesis.id, sourceIds: knowledgeContributionReview.emptyContributionIds }));

    const invalidSynthesisRefs = hypothesis.synthesisCandidateRefs.filter((id) => !synthesisIds.has(id));
    if (invalidSynthesisRefs.length) findings.push(finding('blocker', 'motion-v2-synthesis-ref-invalid', 'Motion V2 Synthesis refs must resolve to independently reverified optional Synthesis candidates.', { hypothesisId: hypothesis.id, invalidSynthesisRefs }));
    const synthesisContributionReview = contributionSetReview(hypothesis.synthesisCandidateRefs, hypothesis.synthesisContributions);
    if (!synthesisContributionReview.exact) findings.push(finding('blocker', 'motion-v2-synthesis-contribution-set-drift', 'If Synthesis candidates are claimed, each must have exactly one explicit contribution and no unbound contributions.', { hypothesisId: hypothesis.id }));
    if (synthesisContributionReview.emptyContributionIds.length) findings.push(finding('major', 'motion-v2-synthesis-contribution-empty', 'Claimed Synthesis contributions cannot be empty.', { hypothesisId: hypothesis.id, sourceIds: synthesisContributionReview.emptyContributionIds }));

    if (!hypothesis.motionNecessity.moves || !hypothesis.motionNecessity.rationale || !hypothesis.motionNecessity.earnedBy.length || !hypothesis.motionNecessity.stillnessCases.length || !hypothesis.motionNecessity.stillnessRationale) findings.push(finding('major', 'motion-v2-motion-necessity-unproven', 'Each V2 hypothesis must prove why some movement is earned and explicitly define what remains still and why.', { hypothesisId: hypothesis.id }));
    const attentionIssues = validateAttentionSequence(hypothesis.attentionSequence);
    if (attentionIssues.length) findings.push(finding('major', 'motion-v2-attention-choreography-invalid', 'Motion V2 requires an explicit sequential attention handoff rather than simultaneous animation noise.', { hypothesisId: hypothesis.id, issues: attentionIssues }));

    if (Object.values(hypothesis.temporalComposition).some((value) => !text(value))) findings.push(finding('major', 'motion-v2-temporal-composition-thin', 'Motion V2 must reason explicitly about rhythm, pacing, anticipation, holds, overlap, stillness, easing character and energy curve.', { hypothesisId: hypothesis.id }));
    if (!hypothesis.motionHierarchy) findings.push(finding('major', 'motion-v2-motion-hierarchy-missing', 'Motion V2 must explain how temporal emphasis maps to information and consequence hierarchy.', { hypothesisId: hypothesis.id }));
    if (Object.values(hypothesis.physicalCharacter).some((value) => !text(value))) findings.push(finding('major', 'motion-v2-physical-character-thin', 'Motion V2 must explicitly reason about mass, inertia, friction, elasticity, damping and their project-specific rationale.', { hypothesisId: hypothesis.id }));
    if (Object.values(hypothesis.choreography).some((value) => !text(value))) findings.push(finding('major', 'motion-v2-choreography-thin', 'Motion V2 must make explicit spatial, interaction, scroll and depth decisions; "none because ..." is valid when motion is intentionally absent.', { hypothesisId: hypothesis.id }));
    if (Object.values(hypothesis.cinematicLanguage).some((value) => !text(value))) findings.push(finding('major', 'motion-v2-cinematic-language-thin', 'Motion V2 must decide camera, framing, reveal, continuity and editing language even when the correct decision is to keep them static.', { hypothesisId: hypothesis.id }));
    if (Object.values(hypothesis.mediaMotion).some((value) => !text(value))) findings.push(finding('major', 'motion-v2-media-motion-thin', 'Motion V2 must explicitly decide typographic, image, material and procedural motion roles.', { hypothesisId: hypothesis.id }));
    if (Object.values(hypothesis.responsivePlan).some((value) => !text(value))) findings.push(finding('major', 'motion-v2-responsive-reinterpretation-thin', 'Motion V2 must separately author desktop, mobile and touch behavior rather than scaling one choreography.', { hypothesisId: hypothesis.id }));
    if (!hypothesis.reducedMotionEquivalent) findings.push(finding('major', 'motion-v2-reduced-motion-equivalent-missing', 'Motion V2 requires a semantic reduced-motion equivalent, not a blanket animation-off instruction.', { hypothesisId: hypothesis.id }));
    if (hypothesis.accessibilityConstraints.length < 2) findings.push(finding('major', 'motion-v2-accessibility-reasoning-thin', 'Motion V2 should name at least two accessibility constraints relevant to temporal or large-field motion.', { hypothesisId: hypothesis.id, count: hypothesis.accessibilityConstraints.length }));
    if (!COMPLEXITY_CLASSES.has(hypothesis.performanceReasoning.complexityClass) || !hypothesis.performanceReasoning.costDrivers.length || !hypothesis.performanceReasoning.justification || !hypothesis.performanceReasoning.fallback) findings.push(finding('major', 'motion-v2-performance-reasoning-thin', 'Motion V2 must state complexity class, cost drivers, why the complexity is worth it and a simpler semantic fallback.', { hypothesisId: hypothesis.id }));
    if (hypothesis.antiPatterns.length < 2 || hypothesis.failureModes.length < 2 || !hypothesis.uncertainty || !hypothesis.falsifier || !hypothesis.critique.length) findings.push(finding('major', 'motion-v2-adversarial-reasoning-thin', 'Each Motion V2 hypothesis needs explicit rejection rules, failure modes, uncertainty, falsifier and critique.', { hypothesisId: hypothesis.id }));

    if (TECHNOLOGY_TERMS.test(conceptualText(hypothesis))) findings.push(finding('blocker', 'motion-v2-technology-became-concept', 'Motion V2 creative reasoning may describe temporal, perceptual, spatial and material behavior, but implementation technology cannot become the creative concept.', { hypothesisId: hypothesis.id }));

    const fp = conceptualFingerprint(hypothesis);
    if (conceptFingerprints.has(fp)) findings.push(finding('blocker', 'motion-v2-conceptual-hypothesis-duplicate', 'Changing hypothesis ID, temporal strategy or evidence labels cannot manufacture conceptual divergence; the underlying deep-motion payload must materially differ.', { firstHypothesisId: conceptFingerprints.get(fp), duplicateHypothesisId: hypothesis.id }));
    else conceptFingerprints.set(fp, hypothesis.id);
  });

  const setKnowledgeCoverage = new Set(hypotheses.flatMap((item) => item.knowledgeRefs));
  if (setKnowledgeCoverage.size < 8) findings.push(finding('major', 'motion-v2-set-knowledge-coverage-thin', 'The full V2 candidate set should exercise at least eight distinct verified motion principles so deep reasoning does not collapse into one narrow knowledge cluster.', { count: setKnowledgeCoverage.size }));

  let derivedExploration = null;
  if (briefReview.reviewReady) {
    derivedExploration = buildDerivedV1Exploration(brief, hypotheses, authorityInputs);
    if (!derivedExploration.reviewReady) {
      const blockers = derivedExploration.findings.filter((item) => item.severity === 'blocker').map((item) => item.code);
      const majors = derivedExploration.findings.filter((item) => item.severity === 'major').map((item) => item.code);
      findings.push(finding(blockers.length ? 'blocker' : 'major', 'motion-v2-v1-exploration-compatibility-failed', 'Deep Motion V2 reasoning must still compile into the existing Motion V1 exploration authority contract before rendered proof.', { blockerCodes: blockers, majorCodes: majors }));
    }
  }

  if (text(reasoningSet?.snapshotFingerprint) !== setFingerprint(reasoningSet)) findings.push(finding('blocker', 'motion-v2-set-fingerprint-mismatch', 'Motion V2 reasoning-set fingerprint must bind the exact provenance-bound brief, hypothesis payloads and fixed truth state.'));
  if (!sameValue(reasoningSet?.truth ?? {}, canonicalSetTruth())) findings.push(finding('blocker', 'motion-v2-set-truth-drift', 'Motion V2 reasoning truth is fixed: candidates only, no winner, no score and existing proof/Critic/human authority remain required.'));

  const coreBlockers = findings.filter((item) => item.severity === 'blocker');
  const coreMajors = findings.filter((item) => item.severity === 'major');
  const expectedPass = coreBlockers.length === 0;
  const expectedReady = coreBlockers.length === 0 && coreMajors.length === 0;
  const expectedStatus = coreBlockers.length ? 'blocked' : coreMajors.length ? 'provisional' : 'ready-for-motion-v1-temporal-proof';
  if (Object.hasOwn(reasoningSet, 'pass') && reasoningSet.pass !== expectedPass) findings.push(finding('blocker', 'motion-v2-set-pass-claim-drift', 'Cached Motion V2 pass state must match fresh review.'));
  if (Object.hasOwn(reasoningSet, 'reviewReady') && reasoningSet.reviewReady !== expectedReady) findings.push(finding('blocker', 'motion-v2-set-ready-claim-drift', 'Cached Motion V2 reviewReady state must match fresh review.'));
  if (Object.hasOwn(reasoningSet, 'status') && reasoningSet.status !== expectedStatus) findings.push(finding('blocker', 'motion-v2-set-status-claim-drift', 'Cached Motion V2 status must match fresh review.', { expected: expectedStatus, actual: reasoningSet.status }));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return {
    schema: 'ai-studio-os/motion-intelligence-reasoning-review@2',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-for-motion-v1-temporal-proof',
    findings,
    briefReview,
    derivedExploration,
    normalizedHypotheses: hypotheses,
    truth: canonicalSetTruth()
  };
}

export function buildMotionIntelligenceV2Set({ brief, hypotheses = [] } = {}, suppliedAuthorityInputs = null) {
  const reasoningSet = {
    schema: 'ai-studio-os/motion-intelligence-reasoning-set@2',
    stage: 'motion-intelligence-v2-reasoning',
    brief: brief ?? null,
    hypotheses: (Array.isArray(hypotheses) ? hypotheses : []).map(normalizeHypothesis),
    truth: canonicalSetTruth()
  };
  reasoningSet.snapshotFingerprint = setFingerprint(reasoningSet);
  const review = reviewMotionIntelligenceV2Set(reasoningSet, suppliedAuthorityInputs);
  return {
    ...reasoningSet,
    findings: review.findings,
    pass: review.pass,
    reviewReady: review.reviewReady,
    status: review.status
  };
}

function handoffFingerprint(value = {}) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/motion-intelligence-v2-exploration-handoff@1',
    reasoningSetSnapshotFingerprint: text(value?.reasoningSetSnapshotFingerprint),
    exploration: value?.exploration ?? null,
    truth: canonicalHandoffTruth()
  });
}

export function buildMotionIntelligenceV2ExplorationHandoff({ reasoningSet, authorityInputs: suppliedAuthorityInputs = null } = {}) {
  const authorityInputs = reviewInputsForBrief(reasoningSet?.brief, suppliedAuthorityInputs);
  const review = reviewMotionIntelligenceV2Set(reasoningSet ?? {}, authorityInputs);
  const findings = [];
  let exploration = null;
  if (!review.reviewReady) {
    findings.push(finding('blocker', 'motion-v2-handoff-reasoning-not-ready', 'Motion V2 may hand off to Motion V1 only after fresh deep-reasoning review passes without blocker or major findings.', { findingCodes: review.findings.map((item) => item.code) }));
  } else {
    exploration = buildDerivedV1Exploration(reasoningSet.brief, review.normalizedHypotheses, authorityInputs);
    if (!exploration.reviewReady) findings.push(finding('blocker', 'motion-v2-handoff-v1-exploration-not-ready', 'The derived Motion V1 exploration must remain review-ready; V2 cannot bypass or weaken the existing exploration authority contract.', { findingCodes: exploration.findings.map((item) => item.code) }));
  }
  const blockers = findings.filter((item) => item.severity === 'blocker');
  const artifact = {
    schema: 'ai-studio-os/motion-intelligence-v2-exploration-handoff@1',
    stage: 'motion-intelligence-v2-to-v1-handoff',
    reasoningSetSnapshotFingerprint: text(reasoningSet?.snapshotFingerprint),
    exploration: blockers.length ? null : exploration,
    truth: canonicalHandoffTruth()
  };
  artifact.snapshotFingerprint = handoffFingerprint(artifact);
  return {
    ...artifact,
    findings,
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0,
    status: blockers.length ? 'blocked' : 'ready-for-existing-motion-v1-temporal-proof'
  };
}

export function reviewMotionIntelligenceV2ExplorationHandoff(handoff = {}, { reasoningSet, authorityInputs: suppliedAuthorityInputs = null } = {}) {
  const findings = [];
  const expected = buildMotionIntelligenceV2ExplorationHandoff({ reasoningSet, authorityInputs: suppliedAuthorityInputs });
  if (handoff?.schema !== 'ai-studio-os/motion-intelligence-v2-exploration-handoff@1') findings.push(finding('blocker', 'motion-v2-handoff-schema-invalid', 'Motion V2 handoff requires the canonical exploration-handoff schema.'));
  if (handoff?.stage !== 'motion-intelligence-v2-to-v1-handoff') findings.push(finding('blocker', 'motion-v2-handoff-stage-invalid', 'Motion V2 handoff requires the canonical V2→V1 stage.'));
  const unknown = unknownKeys(handoff, HANDOFF_KEYS);
  if (unknown.length) findings.push(finding('blocker', 'motion-v2-handoff-shape-invalid', 'Motion V2 handoff may contain only canonical payload and derived review state.', { unknownKeys: unknown }));
  if (!expected.reviewReady) findings.push(finding('blocker', 'motion-v2-handoff-source-invalid', 'Supplied Motion V2 reasoning cannot independently produce a valid V1 exploration handoff.', { findingCodes: expected.findings.map((item) => item.code) }));
  if (text(handoff?.reasoningSetSnapshotFingerprint) !== text(reasoningSet?.snapshotFingerprint)) findings.push(finding('blocker', 'motion-v2-handoff-reasoning-binding-drift', 'Motion V2 handoff must bind the exact supplied reasoning-set snapshot.'));
  if (!sameValue(handoff?.exploration ?? null, expected.exploration ?? null)) findings.push(finding('blocker', 'motion-v2-handoff-exploration-drift', 'Motion V2 handoff exploration must equal the V1 exploration independently recompiled from the supplied deep-motion reasoning set.'));
  if (text(handoff?.snapshotFingerprint) !== handoffFingerprint(expected)) findings.push(finding('blocker', 'motion-v2-handoff-fingerprint-mismatch', 'Motion V2 handoff fingerprint must bind exact reasoning-set identity, V1 exploration payload and truth state.'));
  if (!sameValue(handoff?.truth ?? {}, canonicalHandoffTruth())) findings.push(finding('blocker', 'motion-v2-handoff-truth-drift', 'Motion V2 handoff cannot fabricate Motion Direction, technical-planning or production authority.'));

  const coreBlockers = findings.filter((item) => item.severity === 'blocker');
  const expectedReady = coreBlockers.length === 0;
  const expectedStatus = expectedReady ? 'ready-for-existing-motion-v1-temporal-proof' : 'blocked';
  if (Object.hasOwn(handoff, 'pass') && handoff.pass !== expectedReady) findings.push(finding('blocker', 'motion-v2-handoff-pass-claim-drift', 'Cached Motion V2 handoff pass state must match fresh review.'));
  if (Object.hasOwn(handoff, 'reviewReady') && handoff.reviewReady !== expectedReady) findings.push(finding('blocker', 'motion-v2-handoff-ready-claim-drift', 'Cached Motion V2 handoff reviewReady state must match fresh review.'));
  if (Object.hasOwn(handoff, 'status') && handoff.status !== expectedStatus) findings.push(finding('blocker', 'motion-v2-handoff-status-claim-drift', 'Cached Motion V2 handoff status must match fresh review.', { expected: expectedStatus, actual: handoff.status }));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  return {
    schema: 'ai-studio-os/motion-intelligence-v2-exploration-handoff-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0,
    status: blockers.length ? 'blocked' : 'ready-for-existing-motion-v1-temporal-proof',
    findings,
    truth: canonicalHandoffTruth()
  };
}

export { TEMPORAL_STRATEGIES };