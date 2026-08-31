import { fingerprintCreativeValue } from '../creative-intelligence-foundation/fingerprint.mjs';

const MODES = new Set(['select-world', 'reconfirm-world']);
const clean = (value) => typeof value === 'string' ? value.trim() : '';
const list = (value) => [...new Set((Array.isArray(value) ? value : []).map(clean).filter(Boolean))];
const finding = (severity, code, message) => ({ severity, code, message });
const core = (value = {}) => ({ schema: clean(value.schema), projectId: clean(value.projectId), decision: clean(value.decision), sourceExplorationFingerprint: clean(value.sourceExplorationFingerprint), selectedWorldId: clean(value.selectedWorldId), selectedWorldFingerprint: clean(value.selectedWorldFingerprint), visualProofEvidenceFingerprint: clean(value.visualProofEvidenceFingerprint), reviewedWorldEvidenceRefs: list(value.reviewedWorldEvidenceRefs), reviewedComparisonRefs: list(value.reviewedComparisonRefs), rationale: clean(value.rationale), humanConfirmed: value.humanConfirmed === true, decidedAt: clean(value.decidedAt), evidenceRef: clean(value.evidenceRef), ranking: Array.isArray(value.ranking) ? structuredClone(value.ranking) : [] });

export function buildCreativeWorldHumanDecision({ exploration, visualProofEvidence, decision = 'select-world', selectedWorldId, reviewedWorldEvidenceRefs = [], reviewedComparisonRefs = [], rationale = '', humanConfirmed = false, decidedAt = '', evidenceRef = '', ranking = [] } = {}) {
  const world = (exploration?.worlds ?? []).find((item) => item.id === selectedWorldId);
  const record = { schema: 'ai-studio-os/creative-world-human-decision@1', projectId: clean(exploration?.creativeThesis?.projectId ?? exploration?.projectId), decision: clean(decision), sourceExplorationFingerprint: fingerprintCreativeValue(exploration ?? {}), selectedWorldId: clean(selectedWorldId), selectedWorldFingerprint: world ? fingerprintCreativeValue(world) : '', visualProofEvidenceFingerprint: fingerprintCreativeValue(visualProofEvidence ?? {}), reviewedWorldEvidenceRefs: list(reviewedWorldEvidenceRefs), reviewedComparisonRefs: list(reviewedComparisonRefs), rationale: clean(rationale), humanConfirmed: humanConfirmed === true, decidedAt: clean(decidedAt), evidenceRef: clean(evidenceRef), ranking: structuredClone(ranking) };
  return { ...record, decisionFingerprint: fingerprintCreativeValue(record) };
}

export function reviewCreativeWorldHumanDecision({ decision, exploration, visualProofEvidence } = {}) {
  if (!decision || typeof decision !== 'object') return { pass: false, findings: [finding('blocker', 'creative-world-human-decision-missing', 'Creative World authority requires an explicit external human decision record.')], decision: null };
  const value = core(decision); const findings = []; const world = (exploration?.worlds ?? []).find((item) => item.id === value.selectedWorldId);
  const evidence = (visualProofEvidence?.worlds ?? []).find((item) => item.worldId === value.selectedWorldId);
  if (value.schema !== 'ai-studio-os/creative-world-human-decision@1' || !MODES.has(value.decision)) findings.push(finding('blocker', 'creative-world-human-decision-schema-invalid', 'Human World decision mode is unsupported.'));
  if (!value.projectId || value.projectId !== clean(exploration?.creativeThesis?.projectId) || value.projectId !== clean(visualProofEvidence?.projectId)) findings.push(finding('blocker', 'creative-world-human-decision-project-drift', 'Human World decision project binding drifted.'));
  if (value.sourceExplorationFingerprint !== fingerprintCreativeValue(exploration ?? {})) findings.push(finding('blocker', 'creative-world-human-decision-exploration-drift', 'Human World decision must bind the exact reviewed exploration.'));
  if (!world || value.selectedWorldFingerprint !== fingerprintCreativeValue(world)) findings.push(finding('blocker', 'creative-world-human-decision-world-drift', 'Human World decision must bind an exact member of the reviewed exploration.'));
  if (value.visualProofEvidenceFingerprint !== fingerprintCreativeValue(visualProofEvidence ?? {})) findings.push(finding('blocker', 'creative-world-human-decision-visual-proof-drift', 'Human World decision must bind the exact rendered visual proof.'));
  if (!evidence || !value.reviewedWorldEvidenceRefs.length || !value.reviewedWorldEvidenceRefs.every((ref) => (evidence.evidenceRefs ?? []).includes(ref))) findings.push(finding('blocker', 'creative-world-human-decision-evidence-invalid', 'Reviewed evidence refs must belong to the selected world.'));
  if (!value.reviewedComparisonRefs.every((ref) => (visualProofEvidence?.comparisonRefs ?? []).includes(ref))) findings.push(finding('blocker', 'creative-world-human-decision-comparison-evidence-invalid', 'Reviewed comparison refs must belong to the visual proof.'));
  if (!value.humanConfirmed || !value.rationale || !value.decidedAt || !value.evidenceRef) findings.push(finding('blocker', 'creative-world-human-decision-confirmation-missing', 'Human World decision requires confirmation, rationale, time and evidence reference.'));
  if (clean(decision.decisionFingerprint) !== fingerprintCreativeValue(value)) findings.push(finding('blocker', 'creative-world-human-decision-fingerprint-drift', 'Human World decision fingerprint drifted.'));
  return { schema: 'ai-studio-os/creative-world-human-decision-review@1', pass: !findings.length, reviewReady: !findings.length, findings, decision: value };
}
