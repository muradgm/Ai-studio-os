import { fingerprintCreativeValue } from '../creative-intelligence-foundation/fingerprint.mjs';
import { reviewMotionCreativeWorldAuthority } from '../motion-creative-intelligence/world-authority.mjs';
import * as core from './runtime-core.mjs';

const BRIEF_INPUTS = new WeakMap();
const BINDING_KEYS = new Set(['schema', 'projectId', 'creativeWorldId', 'selectedWorldFingerprint']);

function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function sameValue(left, right) { return fingerprintCreativeValue(left) === fingerprintCreativeValue(right); }
function finding(severity, code, message, evidence = {}) { return { severity, code, message, evidence }; }
function unknownKeys(value, allowed = BINDING_KEYS) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.keys(value).filter((key) => !allowed.has(key)).sort();
}

function normalizeInputs(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    canonicalCreativeAuthority: source.canonicalCreativeAuthority ?? null,
    knowledge: source.knowledge ?? null,
    synthesis: source.synthesis ?? null
  };
}

function rememberInputs(brief, inputs) {
  if (brief && typeof brief === 'object') BRIEF_INPUTS.set(brief, normalizeInputs(inputs));
}

function inputsFor(brief, supplied = null) {
  if (supplied && typeof supplied === 'object') return normalizeInputs(supplied);
  return BRIEF_INPUTS.get(brief) ?? {};
}

function selectedWorld(inputs = {}) {
  const canonical = inputs?.canonicalCreativeAuthority ?? {};
  return canonical.selectedCreativeWorld ?? canonical.creativeWorldExploration?.selectedWorld ?? null;
}

function worldBinding(projectId, inputs = {}) {
  const worldReview = reviewMotionCreativeWorldAuthority({
    projectId,
    canonicalCreativeAuthority: inputs?.canonicalCreativeAuthority
  });
  const world = selectedWorld(inputs);
  const valid = worldReview.reviewReady === true
    && world
    && text(world.id) === text(worldReview?.authority?.creativeWorldId);
  return {
    schema: 'ai-studio-os/motion-intelligence-creative-world-binding@1',
    projectId: valid ? text(worldReview?.authority?.projectId) : text(projectId),
    creativeWorldId: valid ? text(worldReview?.authority?.creativeWorldId) : text(world?.id),
    selectedWorldFingerprint: valid ? fingerprintCreativeValue(world) : ''
  };
}

function briefBoundaryFingerprint(brief = {}) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/motion-intelligence-brief-boundary@1',
    coreSnapshotFingerprint: text(brief?.coreSnapshotFingerprint),
    creativeWorldBinding: brief?.creativeWorldBinding ?? null
  });
}

function setBoundaryFingerprint(reasoningSet = {}) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/motion-intelligence-reasoning-boundary@1',
    coreSnapshotFingerprint: text(reasoningSet?.coreSnapshotFingerprint),
    briefSnapshotFingerprint: text(reasoningSet?.brief?.snapshotFingerprint)
  });
}

function handoffBoundaryFingerprint(handoff = {}) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/motion-intelligence-handoff-boundary@1',
    coreSnapshotFingerprint: text(handoff?.coreSnapshotFingerprint),
    reasoningSetSnapshotFingerprint: text(handoff?.reasoningSetSnapshotFingerprint),
    exploration: handoff?.exploration ?? null,
    truth: handoff?.truth ?? null
  });
}

function toCoreBrief(brief = {}) {
  const {
    creativeWorldBinding: _binding,
    coreSnapshotFingerprint,
    snapshotFingerprint: _outerSnapshot,
    findings: _findings,
    pass: _pass,
    reviewReady: _reviewReady,
    status: _status,
    ...rest
  } = brief && typeof brief === 'object' ? brief : {};
  return { ...rest, snapshotFingerprint: text(coreSnapshotFingerprint) };
}

function toCoreSet(reasoningSet = {}) {
  const {
    coreSnapshotFingerprint,
    snapshotFingerprint: _outerSnapshot,
    findings: _findings,
    pass: _pass,
    reviewReady: _reviewReady,
    status: _status,
    ...rest
  } = reasoningSet && typeof reasoningSet === 'object' ? reasoningSet : {};
  return {
    ...rest,
    brief: toCoreBrief(reasoningSet?.brief ?? {}),
    snapshotFingerprint: text(coreSnapshotFingerprint)
  };
}

function toCoreHandoff(handoff = {}, coreReasoningSet = {}) {
  const {
    coreSnapshotFingerprint,
    snapshotFingerprint: _outerSnapshot,
    findings: _findings,
    pass: _pass,
    reviewReady: _reviewReady,
    status: _status,
    ...rest
  } = handoff && typeof handoff === 'object' ? handoff : {};
  return {
    ...rest,
    reasoningSetSnapshotFingerprint: text(coreReasoningSet?.snapshotFingerprint),
    snapshotFingerprint: text(coreSnapshotFingerprint)
  };
}

function finalizeReview(baseReview, extraFindings, artifact, readyStatus) {
  const findings = [...(baseReview?.findings ?? []), ...extraFindings];
  const blockersBeforeClaims = findings.filter((item) => item.severity === 'blocker');
  const majorsBeforeClaims = findings.filter((item) => item.severity === 'major');
  const expectedPass = blockersBeforeClaims.length === 0;
  const expectedReady = blockersBeforeClaims.length === 0 && majorsBeforeClaims.length === 0;
  const expectedStatus = blockersBeforeClaims.length ? 'blocked' : majorsBeforeClaims.length ? 'provisional' : readyStatus;

  if (Object.hasOwn(artifact, 'pass') && artifact.pass !== expectedPass) {
    findings.push(finding('blocker', 'motion-v2-boundary-pass-claim-drift', 'Cached Motion V2 boundary pass state must match fresh review.'));
  }
  if (Object.hasOwn(artifact, 'reviewReady') && artifact.reviewReady !== expectedReady) {
    findings.push(finding('blocker', 'motion-v2-boundary-ready-claim-drift', 'Cached Motion V2 boundary reviewReady state must match fresh review.'));
  }
  if (Object.hasOwn(artifact, 'status') && artifact.status !== expectedStatus) {
    findings.push(finding('blocker', 'motion-v2-boundary-status-claim-drift', 'Cached Motion V2 boundary status must match fresh review.', { expected: expectedStatus, actual: artifact.status }));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return {
    findings,
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : readyStatus
  };
}

export function reviewMotionIntelligenceV2Brief(brief = {}, suppliedAuthorityInputs = null) {
  const inputs = inputsFor(brief, suppliedAuthorityInputs);
  const coreBrief = toCoreBrief(brief);
  const baseReview = core.reviewMotionIntelligenceV2Brief(coreBrief, inputs);
  const extra = [];
  const expectedBinding = worldBinding(brief?.projectId, inputs);
  const bindingUnknown = unknownKeys(brief?.creativeWorldBinding);

  if (bindingUnknown.length || !sameValue(brief?.creativeWorldBinding ?? null, expectedBinding)) {
    extra.push(finding('blocker', 'motion-v2-world-content-binding-drift', 'Motion V2 Brief must bind the exact selected Creative World content, not only its stable world ID.', { unknownKeys: bindingUnknown }));
  }
  if (text(brief?.creativeWorldId) !== text(expectedBinding.creativeWorldId)) {
    extra.push(finding('blocker', 'motion-v2-world-id-binding-drift', 'Motion V2 Brief world ID must match the independently re-reviewed selected Creative World.'));
  }
  if (!text(brief?.coreSnapshotFingerprint) || text(brief?.coreSnapshotFingerprint) !== text(coreBrief?.snapshotFingerprint)) {
    extra.push(finding('blocker', 'motion-v2-core-brief-binding-invalid', 'Motion V2 boundary must retain the exact underlying core Brief snapshot.'));
  }
  if (text(brief?.snapshotFingerprint) !== briefBoundaryFingerprint(brief)) {
    extra.push(finding('blocker', 'motion-v2-brief-boundary-fingerprint-mismatch', 'Motion V2 public Brief fingerprint must bind both the exact core Brief and exact selected Creative World content binding.'));
  }

  const final = finalizeReview(baseReview, extra, brief, 'ready-for-deep-motion-reasoning');
  return { ...baseReview, ...final };
}

export function buildMotionIntelligenceV2Brief(input = {}) {
  const inputs = normalizeInputs({
    canonicalCreativeAuthority: input?.canonicalCreativeAuthority,
    knowledge: input?.knowledge,
    synthesis: input?.synthesis
  });
  const coreBrief = core.buildMotionIntelligenceV2Brief(input);
  const artifact = {
    ...coreBrief,
    creativeWorldBinding: worldBinding(coreBrief.projectId, inputs),
    coreSnapshotFingerprint: coreBrief.snapshotFingerprint
  };
  artifact.snapshotFingerprint = briefBoundaryFingerprint(artifact);
  rememberInputs(artifact, inputs);
  const review = reviewMotionIntelligenceV2Brief(artifact, inputs);
  artifact.findings = review.findings;
  artifact.pass = review.pass;
  artifact.reviewReady = review.reviewReady;
  artifact.status = review.status;
  return artifact;
}

export function reviewMotionIntelligenceV2Set(reasoningSet = {}, suppliedAuthorityInputs = null) {
  const inputs = inputsFor(reasoningSet?.brief, suppliedAuthorityInputs);
  const coreSet = toCoreSet(reasoningSet);
  const baseReview = core.reviewMotionIntelligenceV2Set(coreSet, inputs);
  const briefReview = reviewMotionIntelligenceV2Brief(reasoningSet?.brief ?? {}, inputs);
  const extra = [];

  if (!briefReview.reviewReady) {
    extra.push(finding('blocker', 'motion-v2-set-brief-binding-invalid', 'Motion V2 reasoning cannot remain review-ready when the bound Creative World content no longer matches the current canonical authority.', { findingCodes: briefReview.findings.map((item) => item.code) }));
  }
  if (!text(reasoningSet?.coreSnapshotFingerprint) || text(reasoningSet?.coreSnapshotFingerprint) !== text(coreSet?.snapshotFingerprint)) {
    extra.push(finding('blocker', 'motion-v2-core-set-binding-invalid', 'Motion V2 boundary must retain the exact underlying core reasoning-set snapshot.'));
  }
  if (text(reasoningSet?.snapshotFingerprint) !== setBoundaryFingerprint(reasoningSet)) {
    extra.push(finding('blocker', 'motion-v2-set-boundary-fingerprint-mismatch', 'Motion V2 public reasoning-set fingerprint must bind the exact core reasoning set and bound Brief snapshot.'));
  }

  const final = finalizeReview(baseReview, extra, reasoningSet, 'ready-for-motion-v1-temporal-proof');
  return { ...baseReview, ...final, briefReview };
}

export function buildMotionIntelligenceV2Set({ brief, hypotheses = [] } = {}, suppliedAuthorityInputs = null) {
  const inputs = inputsFor(brief, suppliedAuthorityInputs);
  const coreSet = core.buildMotionIntelligenceV2Set({ brief: toCoreBrief(brief ?? {}), hypotheses }, inputs);
  const artifact = {
    ...coreSet,
    brief: brief ?? null,
    coreSnapshotFingerprint: coreSet.snapshotFingerprint
  };
  artifact.snapshotFingerprint = setBoundaryFingerprint(artifact);
  const review = reviewMotionIntelligenceV2Set(artifact, inputs);
  artifact.findings = review.findings;
  artifact.pass = review.pass;
  artifact.reviewReady = review.reviewReady;
  artifact.status = review.status;
  return artifact;
}

export function buildMotionIntelligenceV2ExplorationHandoff({ reasoningSet, authorityInputs: suppliedAuthorityInputs = null } = {}) {
  const inputs = inputsFor(reasoningSet?.brief, suppliedAuthorityInputs);
  const setReview = reviewMotionIntelligenceV2Set(reasoningSet ?? {}, inputs);
  const coreReasoningSet = toCoreSet(reasoningSet ?? {});
  const coreHandoff = core.buildMotionIntelligenceV2ExplorationHandoff({ reasoningSet: coreReasoningSet, authorityInputs: inputs });
  const extra = [];

  if (!setReview.reviewReady) {
    extra.push(finding('blocker', 'motion-v2-handoff-source-invalid', 'Supplied Motion V2 reasoning cannot produce a handoff because its exact Creative World/content boundary no longer revalidates.', { findingCodes: setReview.findings.map((item) => item.code) }));
  }

  const artifact = {
    ...coreHandoff,
    reasoningSetSnapshotFingerprint: text(reasoningSet?.snapshotFingerprint),
    exploration: extra.length ? null : coreHandoff.exploration,
    coreSnapshotFingerprint: coreHandoff.snapshotFingerprint
  };
  artifact.snapshotFingerprint = handoffBoundaryFingerprint(artifact);
  const blockers = [...(coreHandoff.findings ?? []), ...extra].filter((item) => item.severity === 'blocker');
  artifact.findings = [...(coreHandoff.findings ?? []), ...extra];
  artifact.pass = blockers.length === 0;
  artifact.reviewReady = blockers.length === 0;
  artifact.status = blockers.length ? 'blocked' : 'ready-for-existing-motion-v1-temporal-proof';
  return artifact;
}

export function reviewMotionIntelligenceV2ExplorationHandoff(handoff = {}, { reasoningSet, authorityInputs: suppliedAuthorityInputs = null } = {}) {
  const inputs = inputsFor(reasoningSet?.brief, suppliedAuthorityInputs);
  const setReview = reviewMotionIntelligenceV2Set(reasoningSet ?? {}, inputs);
  const coreReasoningSet = toCoreSet(reasoningSet ?? {});
  const coreHandoff = toCoreHandoff(handoff, coreReasoningSet);
  const baseReview = core.reviewMotionIntelligenceV2ExplorationHandoff(coreHandoff, {
    reasoningSet: coreReasoningSet,
    authorityInputs: inputs
  });
  const extra = [];

  if (!setReview.reviewReady) {
    extra.push(finding('blocker', 'motion-v2-handoff-source-invalid', 'Supplied Motion V2 reasoning cannot independently reproduce a valid handoff because its exact Creative World/content boundary no longer revalidates.', { findingCodes: setReview.findings.map((item) => item.code) }));
  }
  if (text(handoff?.reasoningSetSnapshotFingerprint) !== text(reasoningSet?.snapshotFingerprint)) {
    extra.push(finding('blocker', 'motion-v2-handoff-boundary-reasoning-drift', 'Motion V2 public handoff must bind the exact public reasoning-set snapshot.'));
  }
  if (text(handoff?.snapshotFingerprint) !== handoffBoundaryFingerprint(handoff)) {
    extra.push(finding('blocker', 'motion-v2-handoff-boundary-fingerprint-mismatch', 'Motion V2 public handoff fingerprint must bind exact reasoning identity, V1 exploration payload and truth state.'));
  }

  const final = finalizeReview(baseReview, extra, handoff, 'ready-for-existing-motion-v1-temporal-proof');
  return { ...baseReview, ...final };
}

export const TEMPORAL_STRATEGIES = core.TEMPORAL_STRATEGIES;
