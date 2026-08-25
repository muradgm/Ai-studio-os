import { reviewCreativeThesisAuthority } from '../creative-thesis/authority.mjs';

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

function hasBlocker(findings = []) {
  return findings.some((item) => item?.severity === 'blocker');
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

const REQUIRED_WORLD_STRING_FIELDS = [
  'worldIdea',
  'interpretationOfThesis',
  'signatureBehavior',
  'worldClass',
  'narrativeModel',
  'compositionModel',
  'imageLanguage',
  'materialLanguage',
  'motionLanguage',
  'interactionModel',
  'responsiveStrategy'
];

function selectedWorldIsAuthoritative(world = {}) {
  return world.schema === 'ai-studio-os/creative-world@1'
    && world.reviewReady === true
    && world.selected === true
    && world.truth?.humanCreativeSelectionConfirmed === true
    && world.truth?.visualWorldProofReviewed === true;
}

function selectionProvenance(exploration = {}, world = {}, styleFrameProof = {}) {
  const selection = exploration?.selection ?? {};
  const evidenceRefs = Array.isArray(selection.visualEvidenceRefs)
    ? selection.visualEvidenceRefs.filter((value) => clean(value))
    : [];
  const frameIds = new Set((styleFrameProof?.frames ?? []).map((frame) => clean(frame?.id)).filter(Boolean));
  const referencedRenderedEvidence = evidenceRefs.some((ref) => frameIds.has(ref));
  const valid = exploration?.selectedWorld?.id === world?.id
    && exploration?.truth?.humanWorldSelectionConfirmed === true
    && selection.worldId === world?.id
    && selection.humanConfirmed === true
    && selection.visualReviewConfirmed === true
    && evidenceRefs.length > 0
    && referencedRenderedEvidence;
  return { valid, evidenceRefs, referencedRenderedEvidence };
}

function worldProductionCompleteness(world = {}, thesis = {}, projectId = null) {
  const missingFields = REQUIRED_WORLD_STRING_FIELDS.filter((field) => !clean(world?.[field]));
  if (!clean(world?.typographyIntent?.statement)) missingFields.push('typographyIntent.statement');
  if (!Array.isArray(world?.antiPatterns) || world.antiPatterns.filter((value) => clean(value)).length < 2) missingFields.push('antiPatterns>=2');

  const thesisStatement = clean(thesis?.governingIdea?.statement || thesis?.statement);
  const worldThesisStatement = clean(world?.thesisRef?.governingIdea);
  const expectedProjectId = projectId ?? thesis?.projectId ?? null;
  const thesisProjectBindingValid = thesis?.schema === 'ai-studio-os/creative-thesis@1'
    && world?.thesisRef?.schema === thesis?.schema
    && Boolean(expectedProjectId)
    && thesis?.projectId === expectedProjectId
    && world?.thesisRef?.projectId === expectedProjectId
    && Boolean(thesisStatement)
    && worldThesisStatement === thesisStatement;

  const worldFindingsClear = !(world?.findings ?? []).some((item) => item?.severity === 'blocker' || item?.severity === 'major');
  return {
    complete: missingFields.length === 0 && thesisProjectBindingValid && worldFindingsClear,
    missingFields,
    thesisProjectBindingValid,
    worldFindingsClear
  };
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
 * work. It verifies thesis authority, world authority validity, selection
 * provenance, and production-contract completeness before production proceeds.
 */
export function buildCanonicalCreativeProductionHandoff(input = {}) {
  const findings = [];
  const creative = input.creativeRuntime ?? input.creative ?? {};
  const deliberation = input.creativeThesisDeliberation ?? creative.creativeThesisDeliberation ?? {};
  const thesis = input.creativeThesis ?? creative.creativeThesis ?? {};
  const exploration = input.creativeWorldExploration ?? creative.creativeWorldExploration ?? {};
  const world = input.selectedCreativeWorld ?? creative.selectedCreativeWorld ?? exploration.selectedWorld ?? null;
  const styleFrameProof = input.styleFrameProof ?? creative.styleFrameProof ?? {};
  const direction = input.creativeDirection ?? creative.creativeDirection ?? {};
  const typography = input.typography ?? null;
  const projectId = input.projectId ?? creative.id ?? thesis?.projectId ?? null;

  const thesisReady = thesis.schema === 'ai-studio-os/creative-thesis@1'
    && thesis.reviewReady === true
    && thesis.pass === true;
  if (!thesisReady) {
    findings.push(finding('blocker', 'canonical-thesis-not-ready', 'Canonical production requires a passing, review-ready Creative Thesis.'));
  }

  const thesisAuthorityReview = reviewCreativeThesisAuthority({ deliberation, thesis });
  if (thesisAuthorityReview.pass !== true) {
    findings.push(finding('blocker', 'canonical-thesis-authority-invalid', 'Canonical production requires a Creative Thesis whose authority is traceable to reviewed deliberation and explicit human creative approval.', {
      authorityFindingCodes: thesisAuthorityReview.findings.map((item) => item.code)
    }));
  }

  const authorityValid = selectedWorldIsAuthoritative(world ?? {});
  if (!authorityValid) {
    findings.push(finding('blocker', 'canonical-world-not-authoritative', 'Canonical production requires an explicitly selected, reviewed Creative World with human selection and visual-proof truth.', {
      worldId: world?.id ?? null
    }));
  }

  const selectedWorldId = world?.id ?? null;
  const provenance = selectionProvenance(exploration, world ?? {}, styleFrameProof);
  if (!provenance.valid) {
    findings.push(finding('blocker', 'canonical-world-selection-provenance-invalid', 'Selected Creative World authority must be traceable to the current exploration selection record and referenced rendered visual evidence.', {
      worldId: selectedWorldId,
      evidenceRefs: provenance.evidenceRefs,
      referencedRenderedEvidence: provenance.referencedRenderedEvidence
    }));
  }

  const completeness = worldProductionCompleteness(world ?? {}, thesis, projectId);
  if (!completeness.complete) {
    findings.push(finding('blocker', 'canonical-world-production-contract-incomplete', 'Selected Creative World is human-selected but does not contain a complete production-authority contract.', {
      worldId: selectedWorldId,
      missingFields: completeness.missingFields,
      thesisProjectBindingValid: completeness.thesisProjectBindingValid,
      worldFindingsClear: completeness.worldFindingsClear
    }));
  }

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

  for (const upstream of [creative.findings, deliberation.findings, thesisAuthorityReview.findings, exploration.findings, styleFrameProof.findings, direction.findings]) {
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
      projectId,
      creativeThesisId: thesis.id ?? thesis.projectId ?? null,
      creativeThesisAuthority: thesisAuthorityReview.authority,
      selectedWorldId,
      creativeDirectionStatement: direction?.directionStatement ?? null,
      typographySystemId: typography?.systemId ?? typography?.id ?? null
    },
    truth: {
      creativeThesisAuthorityValid: thesisAuthorityReview.pass === true,
      creativeThesisHumanApproved: thesisAuthorityReview.authority?.humanApproved === true,
      creativeSelectionHumanGoverned: authorityValid,
      creativeSelectionProvenanceValid: provenance.valid,
      creativeWorldProductionContractComplete: completeness.complete,
      creativeWorldThesisProjectBindingValid: completeness.thesisProjectBindingValid,
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
  if (expected.requireThesisAuthority && output.truth?.creativeThesisAuthorityValid !== true) failures.push('creative thesis authority is invalid');
  if (expected.requireProductionContractComplete && output.truth?.creativeWorldProductionContractComplete !== true) failures.push('creative world production contract is incomplete');
  if (expected.requireSelectionProvenance && output.truth?.creativeSelectionProvenanceValid !== true) failures.push('creative world selection provenance is invalid');
  if (expected.requireNoFabricatedProductionApproval && output.truth?.productionApprovalFabricated !== false) failures.push('production approval truth must remain false');
  return { pass: failures.length === 0, failures };
}
