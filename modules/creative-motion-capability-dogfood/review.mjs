import { fingerprintCreativeValue } from '../creative-intelligence-foundation/fingerprint.mjs';
import {
  buildCreativeMotionBlindReviewPacket,
  buildCreativeMotionUnblindingMap,
  reviewCreativeMotionDogfoodResults
} from './runtime.mjs';
import { reviewCreativeMotionDogfoodExecutionReceipt } from './execution.mjs';

function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function finding(severity, code, message, evidence = {}) { return { severity, code, message, evidence }; }
function sameValue(left, right) { return fingerprintCreativeValue(left) === fingerprintCreativeValue(right); }

function blockedResult(experiment, code, message, evidence = {}) {
  return {
    schema: 'ai-studio-os/creative-motion-dogfood-results@1',
    experimentId: text(experiment?.experimentId),
    conditionSummaries: [],
    comparisons: [],
    humanDecision: null,
    findings: [finding('blocker', code, message, evidence)],
    pass: false,
    reviewReady: false,
    status: 'blocked',
    truth: {
      freshExperimentRecomputationRequired: true,
      callerSuppliedConditionMappingTrusted: false,
      verifiedExecutionRequiredForCapabilityDecision: true,
      noOverallCreativeScore: true,
      noAutomaticWinner: true,
      creativeDirectionSelected: false,
      productionApproved: false
    }
  };
}

export function reviewCreativeMotionDogfoodProtocolResultsFresh(experiment = {}, packet = {}, { blindSeed = '', reviewers = [], humanDecision = null } = {}) {
  const findings = [];
  const expectedPacket = buildCreativeMotionBlindReviewPacket(experiment, { blindSeed });
  const expectedMap = buildCreativeMotionUnblindingMap(experiment, { blindSeed });

  if (!expectedPacket.reviewReady || !expectedMap.reviewReady) {
    return blockedResult(experiment, 'dogfood-fresh-review-source-invalid', 'Fresh protocol interpretation requires a review-ready experiment, blind packet and private mapping source.', {
      packetFindingCodes: expectedPacket.findings?.map((item) => item.code) ?? [],
      mapFindingCodes: expectedMap.findings?.map((item) => item.code) ?? []
    });
  }

  if (packet?.schema !== expectedPacket.schema || text(packet?.experimentId) !== text(expectedPacket.experimentId) || text(packet?.snapshotFingerprint) !== text(expectedPacket.snapshotFingerprint) || !sameValue(packet?.candidates ?? [], expectedPacket.candidates) || !sameValue(packet?.dimensions ?? [], expectedPacket.dimensions) || !sameValue(packet?.ratingScale ?? [], expectedPacket.ratingScale) || !sameValue(packet?.brief ?? {}, expectedPacket.brief)) {
    findings.push(finding('blocker', 'dogfood-fresh-review-packet-drift', 'Submitted blind-review packet must exactly match a fresh packet rebuilt from the bound experiment and blind seed.'));
  }

  const result = reviewCreativeMotionDogfoodResults(expectedPacket, {
    unblindingMap: expectedMap,
    reviewers,
    humanDecision
  });

  const protocolTruth = {
    ...result.truth,
    freshExperimentRecomputationRequired: true,
    callerSuppliedConditionMappingTrusted: false,
    protocolIntegrityOnly: true,
    verifiedExecutionRequiredForCapabilityDecision: true
  };

  if (!findings.length) return { ...result, truth: protocolTruth };

  return {
    ...result,
    findings: [...findings, ...(result.findings ?? [])],
    pass: false,
    reviewReady: false,
    status: 'blocked',
    truth: protocolTruth
  };
}

export function reviewCreativeMotionDogfoodResultsFresh(experiment = {}, packet = {}, {
  blindSeed = '',
  reviewers = [],
  humanDecision = null,
  executionReceipt = null,
  trialSources = {}
} = {}) {
  if (!executionReceipt || typeof executionReceipt !== 'object') {
    return blockedResult(experiment, 'dogfood-execution-receipt-missing', 'Capability interpretation requires a freshly verifiable condition-execution receipt; protocol correctness alone is insufficient.');
  }

  const executionReview = reviewCreativeMotionDogfoodExecutionReceipt(executionReceipt, experiment, { trialSources });
  if (!executionReview.reviewReady) {
    return blockedResult(experiment, 'dogfood-execution-receipt-invalid', 'Capability interpretation requires all A/B/C/D/E execution sources to pass fresh condition-specific review.', {
      findingCodes: executionReview.findings.map((item) => item.code)
    });
  }

  const result = reviewCreativeMotionDogfoodProtocolResultsFresh(experiment, packet, {
    blindSeed,
    reviewers,
    humanDecision
  });

  if (!result.reviewReady) return result;

  return {
    ...result,
    status: humanDecision ? 'human-interpreted-capability-evidence' : 'ready-for-human-capability-interpretation',
    truth: {
      ...result.truth,
      protocolIntegrityOnly: false,
      executionReceiptFreshlyVerified: true,
      verifiedExecutionRequiredForCapabilityDecision: true,
      directModelControlIsolationCryptographicallyProven: false,
      directModelControlIsolationUsesOperatorAttestation: true,
      creativeDirectionSelected: false,
      productionApproved: false
    }
  };
}
