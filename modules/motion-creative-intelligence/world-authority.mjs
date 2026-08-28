import { buildCanonicalCreativeProductionHandoff } from '../canonical-creative-pipeline/runtime.mjs';

function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function list(value) { return [...new Set((Array.isArray(value) ? value : []).map(text).filter(Boolean))]; }
function finding(severity, code, message, evidence = {}) { return { severity, code, message, evidence }; }

export function reviewMotionCreativeWorldAuthority({ projectId, canonicalCreativeAuthority } = {}) {
  const findings = [];
  const canonical = canonicalCreativeAuthority && typeof canonicalCreativeAuthority === 'object'
    ? canonicalCreativeAuthority
    : {};
  const requestedProjectId = text(projectId || canonical.projectId);
  const handoff = buildCanonicalCreativeProductionHandoff({
    ...canonical,
    projectId: requestedProjectId || canonical.projectId,
    requireTypography: false
  });

  if (handoff.pass !== true) {
    findings.push(finding(
      'blocker',
      'motion-canonical-creative-authority-invalid',
      'Motion requires the same canonical creative authority that production trusts: approved Thesis provenance, reviewed Creative World exploration, exact rendered visual proof, human world selection and a non-provisional Creative Direction.',
      { canonicalFindingCodes: (handoff.findings ?? []).map((item) => item.code) }
    ));
  }

  const selectedWorld = canonical.selectedCreativeWorld ?? canonical.creativeWorldExploration?.selectedWorld ?? null;
  const thesis = canonical.creativeThesis ?? null;
  const evidenceRefs = list(canonical.creativeWorldExploration?.selection?.visualEvidenceRefs);

  if (!requestedProjectId || requestedProjectId !== text(handoff.authority?.projectId)) {
    findings.push(finding('blocker', 'motion-world-request-project-drift', 'Motion project identity must match recomputed canonical creative authority.', {
      requestedProjectId: requestedProjectId || null,
      canonicalProjectId: handoff.authority?.projectId ?? null
    }));
  }
  if (!selectedWorld?.id || selectedWorld.id !== handoff.authority?.selectedWorldId) {
    findings.push(finding('blocker', 'motion-world-authority-drift', 'Motion selected Creative World must be the exact world authorized by the canonical creative handoff.', {
      selectedWorldId: selectedWorld?.id ?? null,
      canonicalSelectedWorldId: handoff.authority?.selectedWorldId ?? null
    }));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  return {
    schema: 'ai-studio-os/motion-creative-world-authority-review@2',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0,
    status: blockers.length ? 'blocked' : 'authoritative',
    findings,
    canonicalHandoff: handoff,
    authority: blockers.length ? null : {
      projectId: requestedProjectId,
      creativeWorldId: selectedWorld.id,
      creativeThesisProjectId: thesis?.projectId ?? null,
      visualEvidenceRefs: evidenceRefs,
      canonicalCreativeAuthority: handoff.authority
    },
    truth: {
      canonicalCreativeProductionHandoffReused: true,
      creativeThesisAuthorityRequired: true,
      explorationRecomputedAtMotionBoundary: true,
      exactRenderedVisualProofRequired: true,
      humanWorldSelectionRequired: true,
      canonicalCreativeDirectionRequired: true,
      shallowSelectionFlagsAccepted: false,
      parallelWeakerWorldAuthorityAccepted: false
    }
  };
}
