import { fingerprintCreativeValue } from '../creative-intelligence-foundation/fingerprint.mjs';
import {
  buildCreativeMotionBlindReviewPacket,
  buildCreativeMotionUnblindingMap,
  reviewCreativeMotionDogfoodResults
} from './runtime.mjs';

function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function finding(severity, code, message, evidence = {}) { return { severity, code, message, evidence }; }
function sameValue(left, right) { return fingerprintCreativeValue(left) === fingerprintCreativeValue(right); }

export function reviewCreativeMotionDogfoodResultsFresh(experiment = {}, packet = {}, { blindSeed = '', reviewers = [], humanDecision = null } = {}) {
  const findings = [];
  const expectedPacket = buildCreativeMotionBlindReviewPacket(experiment, { blindSeed });
  const expectedMap = buildCreativeMotionUnblindingMap(experiment, { blindSeed });

  if (!expectedPacket.reviewReady || !expectedMap.reviewReady) {
    return {
      schema: 'ai-studio-os/creative-motion-dogfood-results@1',
      experimentId: text(experiment?.experimentId),
      conditionSummaries: [],
      comparisons: [],
      humanDecision: null,
      findings: [finding('blocker', 'dogfood-fresh-review-source-invalid', 'Fresh result interpretation requires a review-ready experiment, blind packet and private mapping source.', {
        packetFindingCodes: expectedPacket.findings?.map((item) => item.code) ?? [],
        mapFindingCodes: expectedMap.findings?.map((item) => item.code) ?? []
      })],
      pass: false,
      reviewReady: false,
      status: 'blocked',
      truth: {
        freshExperimentRecomputationRequired: true,
        callerSuppliedConditionMappingTrusted: false,
        noOverallCreativeScore: true,
        noAutomaticWinner: true,
        creativeDirectionSelected: false,
        productionApproved: false
      }
    };
  }

  if (packet?.schema !== expectedPacket.schema || text(packet?.experimentId) !== text(expectedPacket.experimentId) || text(packet?.snapshotFingerprint) !== text(expectedPacket.snapshotFingerprint) || !sameValue(packet?.candidates ?? [], expectedPacket.candidates) || !sameValue(packet?.dimensions ?? [], expectedPacket.dimensions) || !sameValue(packet?.ratingScale ?? [], expectedPacket.ratingScale) || !sameValue(packet?.brief ?? {}, expectedPacket.brief)) {
    findings.push(finding('blocker', 'dogfood-fresh-review-packet-drift', 'Submitted blind-review packet must exactly match a fresh packet rebuilt from the bound experiment and blind seed.'));
  }

  const result = reviewCreativeMotionDogfoodResults(expectedPacket, {
    unblindingMap: expectedMap,
    reviewers,
    humanDecision
  });

  if (!findings.length) {
    return {
      ...result,
      truth: {
        ...result.truth,
        freshExperimentRecomputationRequired: true,
        callerSuppliedConditionMappingTrusted: false
      }
    };
  }

  return {
    ...result,
    findings: [...findings, ...(result.findings ?? [])],
    pass: false,
    reviewReady: false,
    status: 'blocked',
    truth: {
      ...result.truth,
      freshExperimentRecomputationRequired: true,
      callerSuppliedConditionMappingTrusted: false
    }
  };
}
