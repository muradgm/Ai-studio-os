function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

function hasBlocker(findings = []) {
  return findings.some((item) => item?.severity === 'blocker');
}

function selectedWorldIsAuthoritative(world = {}) {
  return world.schema === 'ai-studio-os/creative-world@1'
    && world.reviewReady === true
    && world.selected === true
    && world.truth?.humanCreativeSelectionConfirmed === true
    && world.truth?.visualWorldProofReviewed === true;
}

function typographyIsAuthoritative(typography = {}) {
  if (!typography || typeof typography !== 'object') return false;
  const review = typography.artDirectionReview ?? typography.review ?? {};
  const approved = review.approved === true
    || review.humanApproved === true
    || typography.truth?.humanTypographyApproval === true;
  return typography.pass === true && approved;
}

/**
 * Build the canonical authority packet that is allowed to cross from creative
 * exploration/review into production planning.
 *
 * This module deliberately does not generate, rank, select, or mutate creative
 * work. It only verifies that upstream human-governed decisions are coherent
 * before production is allowed to consume them. Creative Production treats a
 * passing packet as the authority boundary; legacy calibration may remain as
 * diagnostic evidence but cannot override the selected world/direction.
 */
export function buildCanonicalCreativeProductionHandoff(input = {}) {
  const findings = [];
  const creative = input.creativeRuntime ?? input.creative ?? {};
  const thesis = input.creativeThesis ?? creative.creativeThesis ?? {};
  const exploration = input.creativeWorldExploration ?? creative.creativeWorldExploration ?? {};
  const world = input.selectedCreativeWorld ?? creative.selectedCreativeWorld ?? exploration.selectedWorld ?? null;
  const styleFrameProof = input.styleFrameProof ?? creative.styleFrameProof ?? {};
  const direction = input.creativeDirection ?? creative.creativeDirection ?? {};
  const typography = input.typography ?? null;

  if (thesis.schema !== 'ai-studio-os/creative-thesis@1' || thesis.reviewReady !== true || thesis.pass !== true) {
    findings.push(finding('blocker', 'canonical-thesis-not-ready', 'Canonical production requires a passing, review-ready Creative Thesis.'));
  }

  if (!selectedWorldIsAuthoritative(world ?? {})) {
    findings.push(finding('blocker', 'canonical-world-not-authoritative', 'Canonical production requires an explicitly selected, reviewed Creative World with human selection and visual-proof truth.', {
      worldId: world?.id ?? null
    }));
  }

  const selectedWorldId = world?.id ?? null;
  const proofCoversWorld = styleFrameProof?.reviewReady === true
    && (styleFrameProof?.frames ?? []).some((frame) => frame.worldId === selectedWorldId);
  if (!proofCoversWorld) {
    findings.push(finding('blocker', 'canonical-style-frame-proof-missing', 'Selected Creative World must be covered by review-ready rendered style-frame proof before production handoff.', {
      worldId: selectedWorldId
    }));
  }

  const directionBoundToWorld = direction?.worldContext?.id === selectedWorldId
    || direction?.world?.id === selectedWorldId
    || direction?.selectedWorldId === selectedWorldId;
  const directionBoundToThesis = direction?.thesisContext?.statement === thesis?.statement
    || direction?.thesisContext?.statement === thesis?.governingIdea?.statement;
  if (!direction || direction.provisional === true || !directionBoundToWorld || !directionBoundToThesis) {
    findings.push(finding('blocker', 'canonical-direction-authority-drift', 'Creative Direction must be non-provisional and bound to both the reviewed thesis and selected world.', {
      worldId: selectedWorldId,
      directionBoundToWorld,
      directionBoundToThesis
    }));
  }

  if (input.requireTypography === true && !typographyIsAuthoritative(typography)) {
    findings.push(finding('blocker', 'canonical-typography-not-approved', 'Production handoff requires a passing human-approved typography system when typography authority is required.'));
  }

  for (const upstream of [creative.findings, exploration.findings, styleFrameProof.findings, direction.findings]) {
    if (hasBlocker(upstream)) {
      findings.push(finding('blocker', 'canonical-upstream-blocker-present', 'Production handoff cannot cross an unresolved upstream blocker.'));
      break;
    }
  }

  const pass = !hasBlocker(findings);
  return {
    schema: 'ai-studio-os/canonical-creative-production-handoff@1',
    pass,
    status: pass ? 'ready-for-production-planning' : 'blocked',
    authority: {
      projectId: input.projectId ?? creative.id ?? null,
      creativeThesisId: thesis.id ?? thesis.projectId ?? null,
      selectedWorldId,
      creativeDirectionStatement: direction?.directionStatement ?? null,
      typographySystemId: typography?.systemId ?? typography?.id ?? null
    },
    truth: {
      creativeSelectionHumanGoverned: selectedWorldIsAuthoritative(world ?? {}),
      styleFrameProofReviewed: proofCoversWorld && world?.truth?.visualWorldProofReviewed === true,
      typographyHumanApproved: typography ? typographyIsAuthoritative(typography) : null,
      productionApprovalFabricated: false
    },
    findings
  };
}

export function validateCanonicalCreativeProductionHandoff(output = {}, expected = {}) {
  const failures = [];
  if (typeof expected.pass === 'boolean' && output.pass !== expected.pass) failures.push(`pass expected ${expected.pass} got ${output.pass}`);
  if (expected.status && output.status !== expected.status) failures.push(`status expected ${expected.status} got ${output.status}`);
  if (expected.selectedWorldId && output.authority?.selectedWorldId !== expected.selectedWorldId) failures.push(`selected world expected ${expected.selectedWorldId} got ${output.authority?.selectedWorldId}`);
  for (const code of expected.requiredFindingCodes ?? []) {
    if (!output.findings?.some((item) => item.code === code)) failures.push(`missing finding ${code}`);
  }
  for (const code of expected.forbiddenFindingCodes ?? []) {
    if (output.findings?.some((item) => item.code === code)) failures.push(`forbidden finding ${code}`);
  }
  if (expected.requireNoFabricatedProductionApproval && output.truth?.productionApprovalFabricated !== false) failures.push('production approval truth must remain false');
  return { pass: failures.length === 0, failures };
}
