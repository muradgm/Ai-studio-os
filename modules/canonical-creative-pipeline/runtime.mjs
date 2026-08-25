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

const TECHNOLOGY_TERMS = /\b(three\.?js|webgl|webgpu|gsap|scrolltrigger|rive|blender|houdini|shader|shaders|generative ai|midjourney|comfyui)\b/i;

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

function recomputeWorldStructuralReview(world = {}, thesis = {}) {
  const findings = [];
  if (!clean(world?.id)) findings.push(finding('blocker', 'creative-world-id-missing', 'Creative World requires an id.'));
  if (!clean(world?.worldIdea)) findings.push(finding('blocker', 'creative-world-idea-missing', 'Creative World requires one governing world idea.'));
  if (!clean(world?.interpretationOfThesis)) findings.push(finding('major', 'creative-world-thesis-interpretation-missing', 'Creative World must state how it interprets the reviewed Creative Thesis without changing it.'));
  if (!clean(world?.signatureBehavior)) findings.push(finding('major', 'creative-world-signature-behavior-missing', 'Creative World requires one authored experience behavior.'));
  for (const field of REQUIRED_WORLD_STRING_FIELDS) {
    if (!clean(world?.[field])) findings.push(finding('major', 'creative-world-structural-dimension-missing', `Creative World is missing ${field}.`, { field }));
  }
  if (!clean(world?.typographyIntent?.statement)) findings.push(finding('major', 'creative-world-typography-intent-missing', 'Creative World must define typography intent.'));
  if (!clean(world?.categoryTransferTest?.whyProjectSpecific)) findings.push(finding('major', 'creative-world-project-specificity-missing', 'Creative World must explain why its logic belongs to this project.'));
  if (!Array.isArray(world?.antiPatterns) || world.antiPatterns.filter((value) => clean(value)).length < 2) findings.push(finding('major', 'creative-world-anti-patterns-thin', 'Creative World needs at least two explicit anti-patterns.'));

  const technologyText = [world?.worldIdea, world?.interpretationOfThesis, world?.signatureBehavior, world?.worldClass, world?.narrativeModel, world?.compositionModel].map(clean).join(' ');
  if (TECHNOLOGY_TERMS.test(technologyText)) findings.push(finding('blocker', 'creative-world-technology-became-concept', 'Implementation technology cannot be the Creative World idea or primary differentiator.'));

  const thesisIdea = clean(thesis?.governingIdea?.statement ?? thesis?.statement);
  const worldThesisIdea = clean(world?.thesisRef?.governingIdea);
  if (thesisIdea && worldThesisIdea && thesisIdea !== worldThesisIdea) findings.push(finding('blocker', 'creative-world-thesis-drift', 'Creative World changed the governing Creative Thesis instead of interpreting it.'));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return {
    reviewReady: blockers.length === 0 && majors.length === 0,
    findings
  };
}

function worldProductionCompleteness(world = {}, thesis = {}, projectId = null) {
  const missingFields = REQUIRED_WORLD_STRING_FIELDS.filter((field) => !clean(world?.[field]));
  if (!clean(world?.typographyIntent?.statement)) missingFields.push('typographyIntent.statement');
  if (!clean(world?.categoryTransferTest?.whyProjectSpecific)) missingFields.push('categoryTransferTest.whyProjectSpecific');
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

  const structuralReview = recomputeWorldStructuralReview(world, thesis);
  return {
    complete: missingFields.length === 0 && thesisProjectBindingValid && structuralReview.reviewReady,
    missingFields,
    thesisProjectBindingValid,
    structuralReviewReady: structuralReview.reviewReady,
    structuralFindingCodes: structuralReview.findings.map((item) => item.code)
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

  const thesisAuthorityReview = reviewCreativeThesisAuthority({ deliberation, thesis });
  if (thesisAuthorityReview.pass !== true) {
    findings.push(finding('blocker', 'canonical-thesis-authority-invalid', 'Canonical production requires a Creative Thesis whose authority is traceable to re-reviewed deliberation, re-reviewed thesis structure, and explicit human creative approval.', {
      authorityFindingCodes: thesisAuthorityReview.findings.map((item) => item.code)
    }));
  }

  const authorityValid = selectedWorldIsAuthoritative(world ?? {});
  if (!authorityValid) {
    findings.push(finding('blocker', 'canonical-world-not-authoritative', 'Canonical production requires an explicitly selected, reviewed Creative World with human selection and visual-proof truth.', { worldId: world?.id ?? null }));
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
    findings.push(finding('blocker', 'canonical-world-production-contract-incomplete', 'Selected Creative World is human-selected but does not contain a complete, structurally re-reviewed production-authority contract.', {
      worldId: selectedWorldId,
      missingFields: completeness.missingFields,
      thesisProjectBindingValid: completeness.thesisProjectBindingValid,
      structuralReviewReady: completeness.structuralReviewReady,
      structuralFindingCodes: completeness.structuralFindingCodes
    }));
  }

  const proofCoversWorld = styleFrameProof?.reviewReady === true
    && (styleFrameProof?.frames ?? []).some((frame) => frame.worldId === selectedWorldId);
  if (!proofCoversWorld) {
    findings.push(finding('blocker', 'canonical-style-frame-proof-missing', 'Selected Creative World must be covered by review-ready rendered style-frame proof before production handoff.', { worldId: selectedWorldId }));
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
      creativeWorldStructuralReviewRecomputed: true,
      creativeWorldStructuralReviewReady: completeness.structuralReviewReady,
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
  for (const code of expected.requiredFindingCodes ?? []) if (!output.findings?.some((item) => item.code === code)) failures.push(`missing finding ${code}`);
  for (const code of expected.forbiddenFindingCodes ?? []) if (output.findings?.some((item) => item.code === code)) failures.push(`forbidden finding ${code}`);
  if (expected.requireThesisAuthority && output.truth?.creativeThesisAuthorityValid !== true) failures.push('creative thesis authority is invalid');
  if (expected.requireProductionContractComplete && output.truth?.creativeWorldProductionContractComplete !== true) failures.push('creative world production contract is incomplete');
  if (expected.requireSelectionProvenance && output.truth?.creativeSelectionProvenanceValid !== true) failures.push('creative world selection provenance is invalid');
  if (expected.requireNoFabricatedProductionApproval && output.truth?.productionApprovalFabricated !== false) failures.push('production approval truth must remain false');
  return { pass: failures.length === 0, failures };
}
