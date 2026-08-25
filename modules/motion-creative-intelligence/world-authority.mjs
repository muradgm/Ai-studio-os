import { reviewCreativeWorldExploration } from '../creative-world/runtime.mjs';

function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function list(value) { return [...new Set((Array.isArray(value) ? value : []).map(text).filter(Boolean))]; }
function finding(severity, code, message, evidence = {}) { return { severity, code, message, evidence }; }

const REQUIRED_WORLD_FIELDS = [
  'worldIdea', 'interpretationOfThesis', 'signatureBehavior', 'worldClass',
  'narrativeModel', 'compositionModel', 'imageLanguage', 'materialLanguage',
  'motionLanguage', 'interactionModel', 'responsiveStrategy'
];

const TECHNOLOGY_TERMS = /\b(three\.?js|webgl|webgpu|gsap|scrolltrigger|rive|blender|houdini|shader|shaders|generative ai|midjourney|comfyui)\b/i;

function recomputeSelectedWorld(world = {}, thesis = {}) {
  const findings = [];
  if (world?.schema !== 'ai-studio-os/creative-world@1') findings.push(finding('blocker', 'motion-world-schema-invalid', 'Motion authority requires creative-world@1.'));
  for (const field of REQUIRED_WORLD_FIELDS) if (!text(world?.[field])) findings.push(finding('major', 'motion-world-structural-field-missing', `Selected Creative World is missing ${field}.`, { field }));
  if (!text(world?.typographyIntent?.statement)) findings.push(finding('major', 'motion-world-typography-intent-missing', 'Selected Creative World must preserve its typography intent.'));
  if (!text(world?.categoryTransferTest?.whyProjectSpecific)) findings.push(finding('major', 'motion-world-project-specificity-missing', 'Selected Creative World must explain why it belongs to this project.'));
  if (list(world?.antiPatterns).length < 2) findings.push(finding('major', 'motion-world-anti-patterns-thin', 'Selected Creative World must retain at least two anti-patterns.'));

  const conceptText = [world?.worldIdea, world?.interpretationOfThesis, world?.signatureBehavior, world?.worldClass, world?.narrativeModel, world?.compositionModel].map(text).join(' ');
  if (TECHNOLOGY_TERMS.test(conceptText)) findings.push(finding('blocker', 'motion-world-technology-became-concept', 'Motion may use technology later, but cannot inherit a Creative World whose concept is implementation technology.'));

  const thesisIdea = text(thesis?.governingIdea?.statement);
  if (!thesisIdea || text(world?.thesisRef?.governingIdea) !== thesisIdea) findings.push(finding('blocker', 'motion-world-thesis-binding-invalid', 'Selected Creative World must remain bound to the governing Creative Thesis.'));
  if (!text(thesis?.projectId) || text(world?.thesisRef?.projectId) !== text(thesis?.projectId)) findings.push(finding('blocker', 'motion-world-project-binding-invalid', 'Selected Creative World must remain bound to the Creative Thesis project.'));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return { reviewReady: blockers.length === 0 && majors.length === 0, findings };
}

export function reviewMotionCreativeWorldAuthority({ projectId, creativeWorldExploration, creativeWorld } = {}) {
  const findings = [];
  const exploration = creativeWorldExploration ?? {};
  const selectedWorld = creativeWorld ?? exploration?.selectedWorld ?? null;
  const thesis = exploration?.creativeThesis ?? null;

  if (exploration?.schema !== 'ai-studio-os/creative-world-exploration@1') findings.push(finding('blocker', 'motion-world-exploration-schema-invalid', 'Motion exploration requires the canonical Creative World exploration contract.'));
  const explorationReview = reviewCreativeWorldExploration(exploration);
  if (explorationReview.reviewReady !== true) findings.push(finding('blocker', 'motion-world-exploration-not-ready', 'Creative World exploration must remain structurally review-ready when re-reviewed for Motion.', { findingCodes: explorationReview.findings.map((item) => item.code) }));

  const worlds = Array.isArray(exploration?.worlds) ? exploration.worlds : [];
  if (worlds.length < 3 || worlds.length > 5) findings.push(finding('blocker', 'motion-world-divergence-set-invalid', 'Motion authority requires the selected world to come from a 3–5 world exploration set.', { count: worlds.length }));
  if (!selectedWorld?.id || !worlds.some((world) => world.id === selectedWorld.id)) findings.push(finding('blocker', 'motion-world-membership-invalid', 'Selected Creative World must be a candidate in the current exploration.', { worldId: selectedWorld?.id ?? null }));

  const selection = exploration?.selection ?? {};
  const evidenceRefs = list(selection.visualEvidenceRefs);
  const selectionValid = exploration?.selectedWorld?.id === selectedWorld?.id
    && selection.worldId === selectedWorld?.id
    && selection.humanConfirmed === true
    && selection.visualReviewConfirmed === true
    && evidenceRefs.length > 0
    && exploration?.truth?.humanWorldSelectionConfirmed === true
    && selectedWorld?.selected === true
    && selectedWorld?.truth?.humanCreativeSelectionConfirmed === true
    && selectedWorld?.truth?.visualWorldProofReviewed === true;
  if (!selectionValid) findings.push(finding('blocker', 'motion-world-selection-provenance-invalid', 'Motion may interpret only a Creative World with canonical human-selection and visual-review provenance.', { worldId: selectedWorld?.id ?? null, evidenceRefs }));

  const structural = recomputeSelectedWorld(selectedWorld ?? {}, thesis ?? {});
  if (!structural.reviewReady) findings.push(finding('blocker', 'motion-world-structural-review-invalid', 'Selected Creative World failed structural re-review at the Motion authority boundary.', { findingCodes: structural.findings.map((item) => item.code) }));

  const requestedProjectId = text(projectId);
  if (!requestedProjectId || requestedProjectId !== text(thesis?.projectId)) findings.push(finding('blocker', 'motion-world-request-project-drift', 'Motion project identity must match the canonical Creative Thesis project.', { requestedProjectId: requestedProjectId || null, thesisProjectId: thesis?.projectId ?? null }));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  return {
    schema: 'ai-studio-os/motion-creative-world-authority-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0,
    status: blockers.length ? 'blocked' : 'authoritative',
    findings,
    authority: blockers.length ? null : {
      projectId: requestedProjectId,
      creativeWorldId: selectedWorld.id,
      creativeThesisProjectId: thesis.projectId,
      visualEvidenceRefs: evidenceRefs
    },
    truth: {
      explorationRecomputedAtMotionBoundary: true,
      selectedWorldRecomputedAtMotionBoundary: true,
      humanWorldSelectionRequired: true,
      visualWorldReviewRequired: true,
      shallowSelectionFlagsAccepted: false
    }
  };
}
