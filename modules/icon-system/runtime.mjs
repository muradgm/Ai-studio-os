import crypto from 'node:crypto';
import { validateVectorSpec } from '../../lib/vector-geometry.mjs';

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}
function cleanList(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean))];
}
function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}
function hash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 24);
}

export const REQUIRED_ICON_WORLDS = ['quiver-construct', 'editorial-sign', 'provenance-glyph'];
export const REQUIRED_CALIBRATION_ICONS = [
  'council',
  'decision',
  'evidence',
  'provenance',
  'memory',
  'supersede',
  'authority',
  'verification',
  'projects',
  'search'
];
export const REQUIRED_SIZE_MATRIX = [12, 14, 16, 18, 20, 24, 32];
export const REQUIRED_CONFUSING_PAIRS = [
  ['evidence', 'verification'],
  ['decision', 'approve'],
  ['history', 'provenance'],
  ['memory', 'activity'],
  ['authority', 'blocked'],
  ['supersede', 'retry'],
  ['council', 'decision'],
  ['verification', 'approve'],
  ['authority', 'action'],
  ['projects', 'memory']
];
export const REQUIRED_LABEL_BLIND_PAIRS = [
  ['council', 'decision'],
  ['evidence', 'verification'],
  ['authority', 'action'],
  ['supersede', 'retry'],
  ['provenance', 'history'],
  ['projects', 'memory']
];
export const DISPLAY_PRIORITIES = ['essential', 'conditional', 'optional'];
export const REQUIRED_HARDENING_EVIDENCE = ['dense-system', 'mobile-composer', 'label-blind-recognition'];

function inventoryFingerprint(inventory) {
  return hash({
    schema: inventory.schema,
    projectId: inventory.projectId,
    selectedWorldRef: inventory.selectedWorldRef,
    visualSystemApprovalRef: inventory.visualSystemApprovalRef,
    iconClasses: inventory.iconClasses,
    icons: inventory.icons,
    calibrationSet: inventory.calibrationSet,
    semanticColorPolicy: inventory.semanticColorPolicy,
    motionReadiness: inventory.motionReadiness,
    displayPolicy: inventory.displayPolicy,
    truth: inventory.truth
  });
}

export function shouldDisplayIcon(icon = {}, opportunity = {}) {
  const priority = icon?.displayPriority;
  const iconOnlyControl = opportunity?.iconOnlyControl === true;
  const semanticSafety = opportunity?.semanticSafety === true;
  const addsInformation = opportunity?.addsInformation === true;
  const repetitive = opportunity?.repetitive === true;

  if (iconOnlyControl || semanticSafety) return true;
  if (priority === 'essential') return true;
  if (priority === 'conditional') return addsInformation;
  if (priority === 'optional') return !repetitive && addsInformation;
  return false;
}

export function auditIconDisplayPolicy({ inventory = null, opportunities = [] } = {}) {
  const findings = [];
  const byId = new Map((inventory?.icons ?? []).map((icon) => [icon.id, icon]));
  const decisions = [];
  for (const opportunity of Array.isArray(opportunities) ? opportunities : []) {
    const icon = byId.get(opportunity?.iconId);
    if (!icon) {
      findings.push(finding('blocker', 'icon-display-policy-icon-unknown', 'Display opportunity references an unknown icon.', { opportunity }));
      continue;
    }
    const expected = shouldDisplayIcon(icon, opportunity);
    const actual = opportunity?.rendered === true;
    decisions.push({ id: opportunity.id ?? null, iconId: icon.id, priority: icon.displayPriority, expected, actual });
    if (expected !== actual) {
      findings.push(finding('blocker', 'icon-display-policy-violation', 'Rendered icon presence violates declared displayPriority/suppression rules.', {
        opportunity,
        expected,
        priority: icon.displayPriority
      }));
    }
  }
  return { pass: findings.length === 0, findings, decisions };
}

export function buildIconSemanticInventory(input = {}, { visualSystemApproval = null } = {}) {
  const inventory = structuredClone(input ?? {});
  const findings = [];

  if (inventory.schema !== 'ai-studio-os/icon-semantic-inventory@1') {
    findings.push(finding('blocker', 'icon-inventory-schema-invalid', 'Icon semantic inventory must use ai-studio-os/icon-semantic-inventory@1.'));
  }
  if (!clean(inventory.projectId) || !clean(inventory.id)) {
    findings.push(finding('blocker', 'icon-inventory-identity-invalid', 'Icon semantic inventory requires projectId and id.'));
  }
  if (visualSystemApproval?.truth?.humanVisualApproval !== true
    || visualSystemApproval?.truth?.visualSystemDirectionFrozen !== true) {
    findings.push(finding('blocker', 'icon-inventory-visual-authority-missing', 'Icon exploration requires the human-approved Visual System direction.'));
  }
  if (inventory.visualSystemApprovalRef?.sourceRef !== 'projects/ai-council/visual-system-v1-human-approval.json') {
    findings.push(finding('major', 'icon-inventory-visual-ref-invalid', 'Icon inventory should reference the human Visual System approval artifact.'));
  }

  const icons = Array.isArray(inventory.icons) ? inventory.icons : [];
  const ids = icons.map((icon) => clean(icon?.id)).filter(Boolean);
  if (icons.length < 20 || icons.length > 32) {
    findings.push(finding('major', 'icon-inventory-scope-invalid', 'V1 semantic inventory should contain 20–32 canonical concepts.', { count: icons.length }));
  }
  if (ids.length !== icons.length || ids.length !== new Set(ids).size) {
    findings.push(finding('blocker', 'icon-inventory-id-invalid', 'Every icon concept needs a unique stable id.'));
  }
  for (const icon of icons) {
    if (!['brand-semantic', 'convention-dominant'].includes(icon?.semanticClass)) {
      findings.push(finding('major', 'icon-inventory-semantic-class-invalid', 'Every icon must declare brand-semantic or convention-dominant.', { iconId: icon?.id ?? null }));
    }
    if (!clean(icon?.meaning) || !clean(icon?.recognitionRule)) {
      findings.push(finding('major', 'icon-inventory-semantics-thin', 'Every icon requires meaning and a recognition rule.', { iconId: icon?.id ?? null }));
    }
    if (!Array.isArray(icon?.contexts) || icon.contexts.length === 0) {
      findings.push(finding('major', 'icon-inventory-context-missing', 'Every icon requires at least one real product context.', { iconId: icon?.id ?? null }));
    }
    if (!DISPLAY_PRIORITIES.includes(icon?.displayPriority)) {
      findings.push(finding('major', 'icon-inventory-display-priority-invalid', 'Every icon must declare essential, conditional, or optional displayPriority.', { iconId: icon?.id ?? null }));
    }
    if (!clean(icon?.displayRule)) {
      findings.push(finding('major', 'icon-inventory-display-rule-missing', 'Every icon must declare an enforceable displayRule.', { iconId: icon?.id ?? null }));
    }
  }

  const displayPolicy = inventory.displayPolicy ?? {};
  if (displayPolicy.suppressWhenRedundant !== true || displayPolicy.optionalDefaultsSuppressedInDenseSurfaces !== true) {
    findings.push(finding('blocker', 'icon-inventory-display-policy-invalid', 'Icon inventory must govern absence: redundant icons are suppressed and optional icons default to suppressed in dense/repetitive surfaces.'));
  }

  const calibrationSet = cleanList(inventory.calibrationSet);
  if (JSON.stringify(calibrationSet) !== JSON.stringify(REQUIRED_CALIBRATION_ICONS)) {
    findings.push(finding('blocker', 'icon-inventory-calibration-drift', 'AI Council calibration set must remain the same hard ten concepts across worlds.', {
      expected: REQUIRED_CALIBRATION_ICONS,
      received: calibrationSet
    }));
  }
  for (const id of calibrationSet) {
    if (!ids.includes(id)) findings.push(finding('blocker', 'icon-inventory-calibration-unknown', 'Calibration set references a missing icon.', { iconId: id }));
  }

  const colorPolicy = inventory.semanticColorPolicy ?? {};
  if (colorPolicy.canonicalMastersMonochrome !== true || colorPolicy.geometryEncodesSemanticColor === true) {
    findings.push(finding('blocker', 'icon-inventory-color-boundary-invalid', 'Canonical icon geometry must remain monochrome and semantic color must stay external.'));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const reviewReady = blockers.length === 0 && majors.length === 0;
  return {
    ...inventory,
    inventoryFingerprint: inventoryFingerprint(inventory),
    status: reviewReady ? 'ready-for-icon-world-exploration' : blockers.length ? 'blocked' : 'provisional',
    pass: blockers.length === 0,
    reviewReady,
    findings,
    truth: {
      ...(inventory.truth ?? {}),
      iconSemanticInventoryAuthored: reviewReady,
      iconWorldExplorationComplete: false,
      semanticCollisionReviewComplete: false,
      denseIconProofComplete: false,
      mobileIconProofComplete: false,
      labelBlindRecognitionProofComplete: false,
      independentIconWorldReviewComplete: false,
      iconWorldHumanSelected: false,
      iconSystemHumanApproved: false,
      productionIconMastersComplete: false,
      appIconSystemAuthored: false,
      appIconHumanApproved: false,
      finalVisualSystemApproved: false
    }
  };
}

export function buildIconWorldExploration(input = {}, { inventory = null } = {}) {
  const exploration = structuredClone(input ?? {});
  const findings = [];

  if (exploration.schema !== 'ai-studio-os/icon-world-exploration@1') {
    findings.push(finding('blocker', 'icon-world-schema-invalid', 'Icon World exploration must use ai-studio-os/icon-world-exploration@1.'));
  }
  if (inventory?.reviewReady !== true) {
    findings.push(finding('blocker', 'icon-world-inventory-not-ready', 'Icon World exploration requires a review-ready semantic inventory.'));
  }
  if (exploration.inventoryRef?.sourceRef !== 'projects/ai-council/icon-semantic-inventory-v1.json') {
    findings.push(finding('major', 'icon-world-inventory-ref-invalid', 'Icon World exploration should reference the canonical AI Council icon inventory source.'));
  }
  if (clean(exploration.inventoryRef?.fingerprint) && exploration.inventoryRef.fingerprint !== inventory?.inventoryFingerprint) {
    findings.push(finding('blocker', 'icon-world-inventory-stale', 'Icon World exploration contains a stale semantic inventory fingerprint.'));
  }
  const resolvedInventoryRef = {
    ...(exploration.inventoryRef ?? {}),
    fingerprint: inventory?.inventoryFingerprint ?? null
  };

  const worlds = Array.isArray(exploration.worlds) ? exploration.worlds : [];
  const worldIds = worlds.map((world) => clean(world?.id)).filter(Boolean);
  if (worldIds.length !== REQUIRED_ICON_WORLDS.length || JSON.stringify(worldIds) !== JSON.stringify(REQUIRED_ICON_WORLDS)) {
    findings.push(finding('blocker', 'icon-world-set-invalid', 'Icon World V1 must compare the three controlled worlds in a stable order.', {
      expected: REQUIRED_ICON_WORLDS,
      received: worldIds
    }));
  }

  for (const world of worlds) {
    if (!clean(world?.idea) || !clean(world?.signatureBehavior) || !clean(world?.risk)) {
      findings.push(finding('major', 'icon-world-definition-thin', 'Every Icon World needs idea, signature behavior, and explicit risk.', { worldId: world?.id ?? null }));
    }
    const geometryReview = validateVectorSpec(world?.geometrySpec ?? {});
    if (geometryReview.status !== 'ready') {
      findings.push(finding('blocker', 'icon-world-vector-spec-invalid', 'Icon World geometry hypothesis must pass the existing Vector Geometry contract.', {
        worldId: world?.id ?? null,
        vectorFindings: geometryReview.findings
      }));
    }
    const sizes = world?.geometrySpec?.targetSizes ?? [];
    if (JSON.stringify(sizes) !== JSON.stringify(REQUIRED_SIZE_MATRIX)) {
      findings.push(finding('major', 'icon-world-size-matrix-drift', 'Every world must prove the same 12–32px optical matrix.', { worldId: world?.id ?? null, sizes }));
    }
    if (world?.selected === true || world?.humanSelected === true) {
      findings.push(finding('blocker', 'icon-world-selection-fabricated', 'Exploration cannot select an icon world before human comparison.'));
    }
  }

  if (exploration.quiverLineAuthority !== 'hypothesis-only') {
    findings.push(finding('blocker', 'quiver-line-authority-overclaimed', 'Quiver Line / Quiver Construct must remain a hypothesis until explicit human icon-world selection.'));
  }
  if (exploration.selection !== null || exploration.selectedWorld !== null) {
    findings.push(finding('blocker', 'icon-world-selection-present', 'Icon World exploration must keep selection null until human review.'));
  }

  const proof = exploration.proofRequirements ?? {};
  if (JSON.stringify(proof.calibrationIconIds ?? []) !== JSON.stringify(REQUIRED_CALIBRATION_ICONS)) {
    findings.push(finding('blocker', 'icon-world-proof-calibration-drift', 'All worlds must render the same ten calibration icons.'));
  }
  if (JSON.stringify(proof.sizeMatrix ?? []) !== JSON.stringify(REQUIRED_SIZE_MATRIX)) {
    findings.push(finding('major', 'icon-world-proof-size-matrix-invalid', 'Proof must include the full small-size matrix.'));
  }
  const pairKeys = (proof.confusingPairs ?? []).map((pair) => JSON.stringify(pair));
  for (const pair of REQUIRED_CONFUSING_PAIRS) {
    if (!pairKeys.includes(JSON.stringify(pair))) findings.push(finding('major', 'icon-world-confusing-pair-missing', 'Proof must test required confusing semantic pairs.', { pair }));
  }
  const labelBlindKeys = (proof.labelBlindPairs ?? []).map((pair) => JSON.stringify(pair));
  for (const pair of REQUIRED_LABEL_BLIND_PAIRS) {
    if (!labelBlindKeys.includes(JSON.stringify(pair))) findings.push(finding('major', 'icon-world-label-blind-pair-missing', 'Proof must include required label-blind recognition pairs.', { pair }));
  }
  if (proof.denseSystemProof !== true || proof.mobileComposerProof !== true || proof.labelBlindRecognitionProof !== true) {
    findings.push(finding('major', 'icon-world-hardening-proof-requirements-missing', 'Hardening requires dense-system, focused mobile/composer, and label-blind recognition proof.'));
  }
  if (proof.hybridRecommendationAllowed !== false) {
    findings.push(finding('blocker', 'icon-world-hybrid-review-leak', 'First-pass Icon World review must forbid hybrid recommendation.'));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const reviewReady = blockers.length === 0 && majors.length === 0;
  const explorationFingerprint = hash({
    schema: exploration.schema,
    projectId: exploration.projectId,
    inventoryRef: resolvedInventoryRef,
    worlds: exploration.worlds,
    proofRequirements: exploration.proofRequirements,
    quiverLineAuthority: exploration.quiverLineAuthority
  });

  return {
    ...exploration,
    inventoryRef: resolvedInventoryRef,
    explorationFingerprint,
    status: reviewReady ? 'ready-for-calibration-hardening-browser-proof' : blockers.length ? 'blocked' : 'provisional',
    pass: blockers.length === 0,
    reviewReady,
    findings,
    truth: {
      iconSemanticInventoryAuthored: inventory?.truth?.iconSemanticInventoryAuthored === true,
      iconWorldExplorationComplete: false,
      semanticCollisionReviewComplete: false,
      denseIconProofComplete: false,
      mobileIconProofComplete: false,
      labelBlindRecognitionProofComplete: false,
      independentIconWorldReviewComplete: false,
      iconWorldHumanSelected: false,
      quiverLineSelected: false,
      iconSystemHumanApproved: false,
      productionIconMastersComplete: false,
      appIconSystemAuthored: false,
      appIconHumanApproved: false,
      finalVisualSystemApproved: false
    }
  };
}

export function buildIconCalibrationProofEvidence({
  exploration = null,
  worldEvidence = [],
  semanticComparisons = [],
  interfaceEvidence = [],
  denseEvidence = [],
  mobileEvidence = [],
  labelBlindEvidence = [],
  displayPolicyAudit = null,
  confusingPairsRef = null
} = {}) {
  const findings = [];
  if (exploration?.reviewReady !== true) findings.push(finding('blocker', 'icon-proof-exploration-not-ready', 'Calibration proof requires a review-ready Icon World exploration.'));

  const byWorld = new Map((Array.isArray(worldEvidence) ? worldEvidence : []).map((item) => [item.worldId, item]));
  for (const worldId of REQUIRED_ICON_WORLDS) {
    const evidence = byWorld.get(worldId);
    if (!evidence) {
      findings.push(finding('blocker', 'icon-proof-world-missing', 'Each Icon World requires exact-browser calibration evidence.', { worldId }));
      continue;
    }
    if (evidence.calibrationCoverage !== `${REQUIRED_CALIBRATION_ICONS.length}/${REQUIRED_CALIBRATION_ICONS.length}`
      || evidence.sizeMatrixCoverage !== `${REQUIRED_SIZE_MATRIX.length}/${REQUIRED_SIZE_MATRIX.length}`
      || !clean(evidence.specimenRef)
      || !clean(evidence.interfaceRef)) {
      findings.push(finding('blocker', 'icon-proof-world-incomplete', 'Icon World evidence is incomplete.', { worldId, evidence }));
    }
    if (evidence.svgIntegrityPass !== true || evidence.exactBrowserProof !== true) {
      findings.push(finding('blocker', 'icon-proof-world-render-invalid', 'Each Icon World must pass SVG integrity and exact-browser rendering.', { worldId }));
    }
  }

  if ((semanticComparisons ?? []).length !== REQUIRED_CALIBRATION_ICONS.length) {
    findings.push(finding('major', 'icon-proof-semantic-comparisons-incomplete', 'Proof requires one same-concept comparison board for each calibration glyph.'));
  }
  if ((interfaceEvidence ?? []).length !== REQUIRED_ICON_WORLDS.length) {
    findings.push(finding('major', 'icon-proof-interface-evidence-thin', 'Proof requires normal interface-context evidence for every world.'));
  }
  for (const [kind, evidence] of [
    ['dense-system', denseEvidence],
    ['mobile-composer', mobileEvidence],
    ['label-blind-recognition', labelBlindEvidence]
  ]) {
    if ((evidence ?? []).length !== REQUIRED_ICON_WORLDS.length || evidence.some((item) => !clean(item?.imageRef) || item?.exactBrowserProof !== true)) {
      findings.push(finding('blocker', `icon-proof-${kind}-incomplete`, `Proof requires exact-browser ${kind} evidence for all three worlds.`));
    }
  }
  if (!clean(confusingPairsRef?.imageRef) || confusingPairsRef?.exactBrowserProof !== true) {
    findings.push(finding('blocker', 'icon-proof-confusing-pairs-incomplete', 'Expanded semantic collision board is required.'));
  }
  if (displayPolicyAudit?.pass !== true) {
    findings.push(finding('blocker', 'icon-proof-display-policy-invalid', 'Dense/mobile fixtures must obey declared displayPriority and suppression rules.', { findings: displayPolicyAudit?.findings ?? [] }));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const reviewReady = blockers.length === 0 && majors.length === 0;
  return {
    schema: 'ai-studio-os/icon-world-calibration-proof@1',
    projectId: exploration?.projectId ?? null,
    explorationFingerprint: exploration?.explorationFingerprint ?? null,
    status: reviewReady ? 'ready-for-independent-icon-world-review' : blockers.length ? 'blocked' : 'provisional',
    pass: blockers.length === 0,
    reviewReady,
    worldEvidence,
    semanticComparisons,
    interfaceEvidence,
    denseEvidence,
    mobileEvidence,
    labelBlindEvidence,
    confusingPairsRef,
    displayPolicyAudit,
    findings,
    truth: {
      iconSemanticInventoryAuthored: true,
      iconWorldExplorationComplete: reviewReady,
      semanticCollisionReviewComplete: reviewReady,
      denseIconProofComplete: reviewReady,
      mobileIconProofComplete: reviewReady,
      labelBlindRecognitionProofComplete: reviewReady,
      independentIconWorldReviewComplete: false,
      iconWorldHumanSelected: false,
      quiverLineSelected: false,
      iconSystemHumanApproved: false,
      productionIconMastersComplete: false,
      appIconSystemAuthored: false,
      appIconHumanApproved: false,
      finalVisualSystemApproved: false
    }
  };
}

export function buildIndependentIconWorldReview(input = {}, { proof = null } = {}) {
  const review = structuredClone(input ?? {});
  const findings = [];
  if (review.schema !== 'ai-studio-os/icon-world-independent-review@1') {
    findings.push(finding('blocker', 'icon-independent-review-schema-invalid', 'Independent review must use ai-studio-os/icon-world-independent-review@1.'));
  }
  if (proof?.reviewReady !== true || proof?.status !== 'ready-for-independent-icon-world-review') {
    findings.push(finding('blocker', 'icon-independent-review-proof-not-ready', 'Independent review requires the completed hardening proof.'));
  }
  if (review.proofRef?.explorationFingerprint !== proof?.explorationFingerprint) {
    findings.push(finding('blocker', 'icon-independent-review-proof-stale', 'Independent review must bind to the exact hardening proof fingerprint.'));
  }
  if (review.hybridRecommendationAllowed !== false) {
    findings.push(finding('blocker', 'icon-independent-review-hybrid-forbidden', 'First-pass independent review cannot recommend hybridization.'));
  }
  const assessments = Array.isArray(review.worldAssessments) ? review.worldAssessments : [];
  if (assessments.length !== REQUIRED_ICON_WORLDS.length || JSON.stringify(assessments.map((item) => item.worldId)) !== JSON.stringify(REQUIRED_ICON_WORLDS)) {
    findings.push(finding('major', 'icon-independent-review-worlds-incomplete', 'Independent review must assess all three Icon Worlds in stable order.'));
  }
  for (const assessment of assessments) {
    if (!clean(assessment?.semanticAssessment) || !clean(assessment?.opticalAssessment) || !clean(assessment?.densityAssessment) || !clean(assessment?.mobileAssessment) || !clean(assessment?.verdict)) {
      findings.push(finding('major', 'icon-independent-review-assessment-thin', 'Each world requires semantic, optical, density, mobile, and verdict notes.', { worldId: assessment?.worldId ?? null }));
    }
  }
  if (review.selectedWorld !== null || review.iconWorldHumanSelected === true) {
    findings.push(finding('blocker', 'icon-independent-review-selection-fabricated', 'Independent review may recommend/rank but cannot perform the human Icon World selection event.'));
  }
  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const reviewReady = blockers.length === 0 && majors.length === 0;
  return {
    ...review,
    status: reviewReady ? 'ready-for-human-icon-world-selection' : blockers.length ? 'blocked' : 'provisional',
    pass: blockers.length === 0,
    reviewReady,
    findings,
    truth: {
      ...(proof?.truth ?? {}),
      independentIconWorldReviewComplete: reviewReady,
      iconWorldHumanSelected: false,
      iconSystemHumanApproved: false,
      productionIconMastersComplete: false,
      appIconSystemAuthored: false,
      appIconHumanApproved: false,
      finalVisualSystemApproved: false
    }
  };
}
