import crypto from 'node:crypto';

export const ICON_FINALIST_SCHEMA = 'ai-studio-os/icon-finalist-semantic-refinement@1';
export const ICON_FINALIST_PROOF_SCHEMA = 'ai-studio-os/icon-finalist-semantic-refinement-proof@1';
export const ICON_FINALIST_WORLDS = ['provenance-glyph', 'editorial-sign'];
export const ICON_FINALIST_RETIRED_WORLDS = ['quiver-construct'];
export const ICON_FINALIST_MUST_REVISIT = ['council', 'decision', 'evidence', 'provenance', 'authority'];
export const ICON_FINALIST_REFINE = ['supersede'];
export const ICON_FINALIST_TUNING = ['verification'];
export const ICON_FINALIST_PRESERVE = ['memory', 'projects'];
export const ICON_FINALIST_FREEZE = ['search', 'back', 'attach', 'send', 'edit'];
export const ICON_FINALIST_SIZES = [14, 16, 24];

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}
function sameSet(a = [], b = []) {
  return Array.isArray(a) && a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');
}
function sameArray(a = [], b = []) {
  return JSON.stringify(a) === JSON.stringify(b);
}
function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}
function hash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 24);
}

export function buildIconFinalistSemanticRefinementPlan(input = {}, { craftReview = null } = {}) {
  const plan = structuredClone(input ?? {});
  const findings = [];

  if (plan.schema !== ICON_FINALIST_SCHEMA) findings.push(finding('blocker', 'icon-finalist-schema-invalid', `Finalist semantic refinement must use ${ICON_FINALIST_SCHEMA}.`));
  if (!clean(plan.projectId) || !clean(plan.id)) findings.push(finding('blocker', 'icon-finalist-identity-invalid', 'Finalist semantic refinement requires projectId and id.'));
  if (craftReview?.truth?.iconCraftCalibrationComplete !== true
    || craftReview?.truth?.engineeringSelectionEvidenceReady !== true
    || craftReview?.truth?.finalistSemanticRefinementRecommended !== true
    || craftReview?.truth?.humanSelectionRecommendedNow !== false
    || craftReview?.truth?.iconWorldHumanSelected !== false) {
    findings.push(finding('blocker', 'icon-finalist-craft-review-invalid', 'Finalist refinement requires the completed craft review, engineering-ready evidence, and an explicit hold on world selection.'));
  }

  if (!sameSet(plan.activeWorlds, ICON_FINALIST_WORLDS)) findings.push(finding('blocker', 'icon-finalist-active-worlds-invalid', 'Only Provenance Glyph and Editorial Sign may remain active finalists.', { activeWorlds: plan.activeWorlds }));
  if (!sameSet(plan.retiredFromActiveRefinement, ICON_FINALIST_RETIRED_WORLDS)) findings.push(finding('blocker', 'icon-finalist-retirement-invalid', 'Quiver Construct must remain retired from active refinement unless explicitly reopened.'));
  if (!sameArray(plan.mustRevisit, ICON_FINALIST_MUST_REVISIT)) findings.push(finding('blocker', 'icon-finalist-must-revisit-drift', 'Must-revisit concepts must remain Council, Decision, Evidence, Provenance and Authority.'));
  if (!sameArray(plan.refine, ICON_FINALIST_REFINE) || !sameArray(plan.tuningControl, ICON_FINALIST_TUNING)) findings.push(finding('blocker', 'icon-finalist-refinement-scope-drift', 'Only Supersede may be refined and Verification may be used as the tuning control.'));
  if (!sameArray(plan.preserve, ICON_FINALIST_PRESERVE)) findings.push(finding('blocker', 'icon-finalist-preserve-drift', 'Memory and Projects must remain preserve/tune-only concepts.'));
  if (!sameArray(plan.freeze, ICON_FINALIST_FREEZE)) findings.push(finding('blocker', 'icon-finalist-freeze-drift', 'Search, Back, Attach, Send and Edit must remain frozen.'));
  if (!sameArray(plan.hypothesisSizes, ICON_FINALIST_SIZES)) findings.push(finding('blocker', 'icon-finalist-size-drift', 'Finalist hypotheses must be proved at 14, 16 and 24px.'));
  if (plan.hypothesisCount?.mustRevisit !== 3 || plan.hypothesisCount?.refine !== 2 || plan.hypothesisCount?.tuningControl !== 1) findings.push(finding('blocker', 'icon-finalist-hypothesis-count-invalid', 'Must-revisit concepts require 3 hypotheses, Supersede 2, and Verification 1 tuning control.'));

  if (plan.textPairingProof?.fontFamily !== 'Inter' || !Array.isArray(plan.textPairingProof?.rows) || plan.textPairingProof.rows.length < 5) {
    findings.push(finding('blocker', 'icon-finalist-text-proof-invalid', 'Finalist proof must pair glyphs with the real Inter interface typography roles.'));
  }
  if (plan.mobileTargetProof?.glyphSizePx !== 16 || !sameArray(plan.mobileTargetProof?.targetSizesPx, [44, 48])) {
    findings.push(finding('blocker', 'icon-finalist-mobile-target-invalid', 'Mobile proof must keep a 16px glyph inside 44px and 48px interaction targets.'));
  }
  if (plan.reviewPolicy?.externalCollisionCheckIsHumanEvidence !== true
    || plan.reviewPolicy?.externalCollisionCheckMayAutoReject !== false
    || plan.reviewPolicy?.automaticWorldWinnerAllowed !== false
    || plan.reviewPolicy?.humanWorldSelectionRequiredDownstream !== true) {
    findings.push(finding('blocker', 'icon-finalist-authority-policy-invalid', 'External collision evidence may inform human review but cannot auto-reject or select a world.'));
  }
  if (plan.selectedWorld !== null) findings.push(finding('blocker', 'icon-finalist-selection-present', 'Finalist refinement cannot select an Icon World.'));

  for (const key of ['newWorlds', 'hybridization', 'newSemanticConcepts', 'productionFamilyExpansion', 'appIconWork', 'darkIconVariants', 'iconAnimation', 'automaticWorldWinner', 'reopenFrozenControls']) {
    if (plan.forbidden?.[key] !== true) findings.push(finding('blocker', 'icon-finalist-scope-widened', `Finalist refinement must forbid ${key}.`, { key }));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const reviewReady = blockers.length === 0 && majors.length === 0;
  const refinementFingerprint = hash({
    activeWorlds: plan.activeWorlds,
    mustRevisit: plan.mustRevisit,
    refine: plan.refine,
    tuningControl: plan.tuningControl,
    preserve: plan.preserve,
    freeze: plan.freeze,
    hypothesisSizes: plan.hypothesisSizes,
    semanticRules: plan.semanticRules,
    externalCollisionByConcept: plan.externalCollisionByConcept,
    textPairingProof: plan.textPairingProof,
    mobileTargetProof: plan.mobileTargetProof,
    actualUiContexts: plan.actualUiContexts,
    reviewPolicy: plan.reviewPolicy,
    forbidden: plan.forbidden
  });

  return {
    ...plan,
    refinementFingerprint,
    status: reviewReady ? 'ready-for-finalist-browser-proof' : blockers.length ? 'blocked' : 'provisional',
    pass: blockers.length === 0,
    reviewReady,
    findings,
    selectedWorld: null,
    truth: {
      ...(plan.truth ?? {}),
      engineeringSelectionEvidenceReady: true,
      finalistSemanticRefinementComplete: false,
      externalMetaphorCollisionReviewComplete: false,
      textPairOpticalProofComplete: false,
      mobileInteractionTargetProofComplete: false,
      humanSelectionRecommendedNow: false,
      iconWorldHumanSelected: false,
      iconSystemHumanApproved: false,
      productionIconMastersComplete: false,
      appIconSystemAuthored: false,
      finalVisualSystemApproved: false
    }
  };
}

export function buildIconFinalistSemanticEvidence({
  plan = null,
  hypothesisEvidence = [],
  collisionEvidence = [],
  textPairEvidence = [],
  uiContextEvidence = [],
  mobileTargetEvidence = [],
  finalistWorldEvidence = [],
  contextFixtureCandidates = [],
  candidateRecommendations = []
} = {}) {
  const findings = [];
  if (plan?.reviewReady !== true) findings.push(finding('blocker', 'icon-finalist-plan-not-ready', 'Finalist proof requires a review-ready refinement plan.'));

  const expectedHypothesesPerWorld = (ICON_FINALIST_MUST_REVISIT.length * 3) + (ICON_FINALIST_REFINE.length * 2) + ICON_FINALIST_TUNING.length;
  const expectedHypotheses = ICON_FINALIST_WORLDS.length * expectedHypothesesPerWorld;
  if ((hypothesisEvidence ?? []).length !== expectedHypotheses) {
    findings.push(finding('blocker', 'icon-finalist-hypothesis-proof-incomplete', 'Every finalist world must prove all required metaphor hypotheses.', { expected: expectedHypotheses, received: hypothesisEvidence?.length ?? 0 }));
  }
  if ((collisionEvidence ?? []).length !== ICON_FINALIST_WORLDS.length) findings.push(finding('blocker', 'icon-finalist-collision-proof-incomplete', 'Each finalist world requires an external-metaphor collision review board.'));
  if ((textPairEvidence ?? []).length !== ICON_FINALIST_WORLDS.length) findings.push(finding('blocker', 'icon-finalist-text-pair-proof-incomplete', 'Each finalist world requires real Inter text-pair optical proof.'));
  if ((uiContextEvidence ?? []).length !== ICON_FINALIST_WORLDS.length) findings.push(finding('blocker', 'icon-finalist-ui-context-proof-incomplete', 'Each finalist world requires actual AI Council interface-context proof.'));
  if ((mobileTargetEvidence ?? []).length !== ICON_FINALIST_WORLDS.length) findings.push(finding('blocker', 'icon-finalist-mobile-target-proof-incomplete', 'Each finalist world requires a 16px glyph inside 44/48px interaction targets.'));
  if ((finalistWorldEvidence ?? []).length !== ICON_FINALIST_WORLDS.length) findings.push(finding('blocker', 'icon-finalist-world-overview-incomplete', 'Each finalist world requires a final candidate overview.'));
  if ((contextFixtureCandidates ?? []).length !== ICON_FINALIST_WORLDS.length) findings.push(finding('blocker', 'icon-finalist-context-fixture-candidates-incomplete', 'Each world needs a clearly non-authoritative context fixture candidate set for integration proof.'));

  for (const candidateSet of contextFixtureCandidates ?? []) {
    if (candidateSet.recommendationAuthority || candidateSet.humanSelected === true || candidateSet.worldSelection === true) {
      findings.push(finding('blocker', 'icon-finalist-context-fixture-authority-overclaimed', 'Context fixture candidates exist only to render typography/UI integration and may not claim recommendation or selection authority.', { worldId: candidateSet.worldId }));
    }
  }

  for (const recommendation of candidateRecommendations ?? []) {
    if (recommendation.worldSelection !== false || recommendation.recommendationAuthority !== 'independent-design-review' || recommendation.humanSelected === true || recommendation.automaticWinner === true) {
      findings.push(finding('blocker', 'icon-finalist-candidate-recommendation-authority-invalid', 'Post-proof candidate recommendations must remain in-world independent design review and may not select the Icon World.', { worldId: recommendation.worldId }));
    }
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const reviewReady = blockers.length === 0 && majors.length === 0;

  return {
    schema: ICON_FINALIST_PROOF_SCHEMA,
    projectId: plan?.projectId ?? null,
    refinementFingerprint: plan?.refinementFingerprint ?? null,
    status: reviewReady ? 'ready-for-independent-finalist-review' : blockers.length ? 'blocked' : 'provisional',
    pass: blockers.length === 0,
    reviewReady,
    hypothesisEvidence,
    collisionEvidence,
    textPairEvidence,
    uiContextEvidence,
    mobileTargetEvidence,
    finalistWorldEvidence,
    contextFixtureCandidates,
    candidateRecommendations,
    findings,
    selectedWorld: null,
    truth: {
      engineeringSelectionEvidenceReady: true,
      finalistSemanticRefinementComplete: reviewReady,
      externalMetaphorCollisionReviewComplete: reviewReady,
      textPairOpticalProofComplete: reviewReady,
      mobileInteractionTargetProofComplete: reviewReady,
      independentFinalistDesignReviewComplete: candidateRecommendations.length > 0,
      humanSelectionRecommendedNow: false,
      iconWorldHumanSelected: false,
      iconSystemHumanApproved: false,
      productionIconMastersComplete: false,
      appIconSystemAuthored: false,
      finalVisualSystemApproved: false
    }
  };
}
