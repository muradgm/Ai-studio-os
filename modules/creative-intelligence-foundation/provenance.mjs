import { fingerprintCreativeValue } from './fingerprint.mjs';
import {
  buildCreativeIntelligenceContext,
  buildCreativeReasoningFrame,
  reviewCreativeIntelligenceContext,
  reviewCreativeIntelligenceFoundation,
  reviewCreativeReasoningFrame
} from './runtime.mjs';

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

function sameValue(left, right) {
  return fingerprintCreativeValue(left) === fingerprintCreativeValue(right);
}

export function reviewCreativeIntelligenceContextProvenance({ context, foundation } = {}) {
  const findings = [];
  const contextReview = reviewCreativeIntelligenceContext(context ?? {});
  const foundationReview = reviewCreativeIntelligenceFoundation(foundation ?? {});

  if (!contextReview.reviewReady) {
    findings.push(finding(
      'blocker',
      'creative-intelligence-provenance-context-not-ready',
      'Independent provenance verification requires a structurally review-ready isolated Creative Intelligence context.',
      { findingCodes: contextReview.findings.map((item) => item.code) }
    ));
  }

  if (!foundationReview.reviewReady) {
    findings.push(finding(
      'blocker',
      'creative-intelligence-provenance-foundation-not-ready',
      'Independent provenance verification requires the source Creative Intelligence Foundation to pass a fresh review.',
      { findingCodes: foundationReview.findings.map((item) => item.code) }
    ));
  }

  const binding = context?.foundationBinding ?? {};
  if (text(binding.foundationSnapshotFingerprint) !== text(foundationReview.computedFingerprint)) {
    findings.push(finding(
      'blocker',
      'creative-intelligence-provenance-foundation-fingerprint-mismatch',
      'The isolated context must bind the exact source Foundation supplied at the verification boundary.',
      {
        contextFoundationFingerprint: binding.foundationSnapshotFingerprint ?? null,
        sourceFoundationFingerprint: foundationReview.computedFingerprint ?? null
      }
    ));
  }

  if (text(binding.knowledgeLibraryFingerprint) !== text(foundationReview.libraryReview?.computedFingerprint)) {
    findings.push(finding(
      'blocker',
      'creative-intelligence-provenance-library-fingerprint-mismatch',
      'The isolated context must bind the exact knowledge-library snapshot of the supplied source Foundation.',
      {
        contextLibraryFingerprint: binding.knowledgeLibraryFingerprint ?? null,
        sourceLibraryFingerprint: foundationReview.libraryReview?.computedFingerprint ?? null
      }
    ));
  }

  if (!sameValue(binding.constitution ?? {}, foundation?.constitution ?? {})) {
    findings.push(finding(
      'blocker',
      'creative-intelligence-provenance-constitution-mismatch',
      'The context Foundation binding must carry the exact constitution of the independently re-reviewed source Foundation.'
    ));
  }

  const sourceEntries = foundationReview.libraryReview?.entries ?? [];
  const sourceById = new Map(sourceEntries.map((entry) => [entry.id, entry]));
  const selectedEvidence = contextReview.normalized?.selectedEvidence ?? [];

  for (const selected of selectedEvidence) {
    const source = sourceById.get(selected.id);
    if (!source) {
      findings.push(finding(
        'blocker',
        'creative-intelligence-provenance-selected-evidence-not-in-foundation',
        'Every selected evidence contract must exist in the independently supplied Foundation snapshot.',
        { knowledgeId: selected.id }
      ));
      continue;
    }
    if (!sameValue(selected, source)) {
      findings.push(finding(
        'blocker',
        'creative-intelligence-provenance-selected-evidence-drift',
        'Selected project evidence must exactly match the corresponding knowledge contract in the supplied Foundation snapshot.',
        { knowledgeId: selected.id }
      ));
    }
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  return {
    schema: 'ai-studio-os/creative-intelligence-context-provenance-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0,
    status: blockers.length ? 'blocked' : 'verified-advisory-context-provenance',
    findings,
    contextReview,
    foundationReview,
    truth: {
      hashIsSignature: false,
      sourceFoundationSuppliedSeparately: true,
      sourceFoundationFreshlyReviewed: foundationReview.reviewReady === true,
      selectedEvidenceMembershipRecomputed: true,
      selectedEvidenceContentRecomputed: true,
      provenanceVerificationGrantsCreativeAuthority: false,
      humanApprovalGranted: false,
      productionApproved: false
    }
  };
}

export function buildCreativeIntelligenceContextWithProvenance(input = {}) {
  const context = buildCreativeIntelligenceContext(input);
  const provenanceReview = reviewCreativeIntelligenceContextProvenance({
    context,
    foundation: input.foundation
  });
  return {
    ...context,
    provenanceReview,
    provenanceReady: provenanceReview.reviewReady,
    truth: {
      ...(context.truth ?? {}),
      independentFoundationProvenanceRequired: true,
      independentFoundationProvenanceSatisfied: provenanceReview.reviewReady,
      productionApproved: false
    }
  };
}

export function reviewCreativeReasoningFrameProvenance({ frame, foundation } = {}) {
  const findings = [];
  const frameReview = reviewCreativeReasoningFrame(frame ?? {});
  const contextProvenanceReview = reviewCreativeIntelligenceContextProvenance({
    context: frame?.context,
    foundation
  });

  if (!frameReview.reviewReady) {
    findings.push(finding(
      'blocker',
      'creative-reasoning-provenance-frame-not-ready',
      'Verified advisory reasoning requires a structurally review-ready reasoning frame.',
      { findingCodes: frameReview.findings.map((item) => item.code) }
    ));
  }

  if (!contextProvenanceReview.reviewReady) {
    findings.push(finding(
      'blocker',
      'creative-reasoning-provenance-context-not-verified',
      'Reasoning cannot claim verified Foundation provenance unless its isolated context is independently rebound to the supplied source Foundation.',
      { findingCodes: contextProvenanceReview.findings.map((item) => item.code) }
    ));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  return {
    schema: 'ai-studio-os/creative-reasoning-frame-provenance-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0,
    status: blockers.length ? 'blocked' : 'verified-advisory-reasoning-provenance',
    findings,
    frameReview,
    contextProvenanceReview,
    truth: {
      reasoningRemainsAdvisory: true,
      sourceFoundationRecomputedAtVerificationBoundary: true,
      hashIsSignature: false,
      provenanceVerificationGrantsCreativeAuthority: false,
      humanApprovalGranted: false,
      productionApproved: false
    }
  };
}

export function buildCreativeReasoningFrameWithProvenance({ context, foundation, moves = [] } = {}) {
  const frame = buildCreativeReasoningFrame({ context, moves });
  const provenanceReview = reviewCreativeReasoningFrameProvenance({ frame, foundation });
  return {
    ...frame,
    provenanceReview,
    provenanceReady: provenanceReview.reviewReady,
    truth: {
      ...(frame.truth ?? {}),
      independentFoundationProvenanceRequired: true,
      independentFoundationProvenanceSatisfied: provenanceReview.reviewReady,
      productionApproved: false
    }
  };
}
