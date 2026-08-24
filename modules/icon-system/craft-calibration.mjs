import crypto from 'node:crypto';

export const ICON_CRAFT_SCHEMA = 'ai-studio-os/icon-world-craft-calibration@1';
export const ICON_CRAFT_PROOF_SCHEMA = 'ai-studio-os/icon-world-craft-calibration-proof@1';
export const ICON_CRAFT_WORLDS = ['quiver-construct', 'editorial-sign', 'provenance-glyph'];
export const ICON_CRAFT_SIZES = [14, 16, 18, 24];
export const ICON_CRAFT_IDS = ['council', 'decision', 'evidence', 'provenance', 'memory', 'supersede', 'authority', 'verification', 'projects', 'search'];
export const ICON_CRAFT_CONTROLS = ['search', 'back', 'attach', 'send', 'edit'];

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}
function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}
function hash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 24);
}
function same(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function buildIconCraftCalibrationPlan(input = {}, { exploration = null, independentReview = null } = {}) {
  const plan = structuredClone(input ?? {});
  const findings = [];

  if (plan.schema !== ICON_CRAFT_SCHEMA) {
    findings.push(finding('blocker', 'icon-craft-schema-invalid', `Icon craft calibration must use ${ICON_CRAFT_SCHEMA}.`));
  }
  if (!clean(plan.projectId) || !clean(plan.id)) {
    findings.push(finding('blocker', 'icon-craft-identity-invalid', 'Icon craft calibration requires projectId and id.'));
  }
  if (exploration?.reviewReady !== true || exploration?.selection !== null || exploration?.selectedWorld !== null) {
    findings.push(finding('blocker', 'icon-craft-exploration-authority-invalid', 'Craft calibration requires the validated three-world exploration and must begin before any human world selection.'));
  }
  if (independentReview?.truth?.independentIconWorldReviewComplete !== true
    || independentReview?.truth?.iconWorldHumanSelected !== false
    || independentReview?.hybridRecommendationAllowed !== false) {
    findings.push(finding('blocker', 'icon-craft-independent-review-invalid', 'Craft calibration requires the completed hardening review with no human selection and no hybrid recommendation authority.'));
  }
  if (plan.baseline?.preserveBaselineGlyphs !== true) {
    findings.push(finding('blocker', 'icon-craft-baseline-mutable', 'Current hardened calibration glyphs must remain preserved as before-state evidence.'));
  }
  if (!same(plan.opticalVariants?.sizes, ICON_CRAFT_SIZES) || plan.opticalVariants?.masterSize !== 24) {
    findings.push(finding('blocker', 'icon-craft-optical-size-drift', 'Craft calibration must compare intentional 14/16/18 optical variants against a 24px master.'));
  }
  if (!same(plan.beforeAfterProof?.iconIds, ICON_CRAFT_IDS) || !same(plan.beforeAfterProof?.sizes, ICON_CRAFT_SIZES)) {
    findings.push(finding('blocker', 'icon-craft-before-after-drift', 'Before/after proof must cover the same ten calibration concepts at 14/16/18/24.'));
  }
  if (!same(plan.conventionalControlFirewall?.controls, ICON_CRAFT_CONTROLS)
    || plan.conventionalControlFirewall?.forbidSignatureNodesOnControls !== true) {
    findings.push(finding('blocker', 'icon-craft-control-firewall-invalid', 'Conventional-control firewall must cover Search, Back, Attach, Send and Edit and forbid signature node decoration.'));
  }
  if (plan.conventionalControlFirewall?.closeNotAddedBecauseNotInInventory !== true) {
    findings.push(finding('major', 'icon-craft-close-scope-ambiguous', 'Close must remain out of this no-new-concepts slice because it is not in the current semantic inventory.'));
  }

  const budget = plan.registrationNodeBudget ?? {};
  if (budget.worldId !== 'provenance-glyph' || !same(budget.limits, { '24': 3, '18': 2, '16': 1, '14': 1 })) {
    findings.push(finding('blocker', 'icon-craft-registration-budget-invalid', 'Provenance Glyph registration-node budget must be explicit and size-dependent.'));
  }

  const forbidden = plan.forbidden ?? {};
  for (const key of ['newWorlds', 'hybridization', 'newSemanticConcepts', 'productionFamilyExpansion', 'appIconWork', 'darkIconVariants', 'iconAnimation', 'automaticWinner']) {
    if (forbidden[key] !== true) findings.push(finding('blocker', 'icon-craft-scope-widened', `Craft calibration must forbid ${key}.`, { key }));
  }
  if (plan.selection !== null || plan.selectedWorld !== null) {
    findings.push(finding('blocker', 'icon-craft-selection-present', 'Craft calibration cannot select an Icon World.'));
  }

  const targetWorldIds = Object.keys(plan.targetedCorrections ?? {}).sort();
  const expectedWorldIds = [...ICON_CRAFT_WORLDS].sort();
  if (!same(targetWorldIds, expectedWorldIds)) {
    findings.push(finding('blocker', 'icon-craft-world-set-drift', 'Craft calibration must refine the same three Icon Worlds without adding or removing a world.', {
      targetWorldIds,
      expectedWorldIds
    }));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const reviewReady = blockers.length === 0 && majors.length === 0;
  const craftFingerprint = hash({
    schema: plan.schema,
    projectId: plan.projectId,
    baseline: plan.baseline,
    opticalVariants: plan.opticalVariants,
    registrationNodeBudget: plan.registrationNodeBudget,
    conventionalControlFirewall: plan.conventionalControlFirewall,
    opticalWeight: plan.opticalWeight,
    targetedCorrections: plan.targetedCorrections,
    beforeAfterProof: plan.beforeAfterProof,
    similarityWarnings: plan.similarityWarnings,
    forbidden: plan.forbidden
  });

  return {
    ...plan,
    craftFingerprint,
    status: reviewReady ? 'ready-for-craft-browser-proof' : blockers.length ? 'blocked' : 'provisional',
    pass: blockers.length === 0,
    reviewReady,
    findings,
    truth: {
      ...(plan.truth ?? {}),
      iconCraftCalibrationComplete: false,
      opticalVariantsReviewed: false,
      conventionalControlPurityReviewed: false,
      registrationBudgetValidated: false,
      opticalWeightNormalized: false,
      iconWorldHumanSelected: false,
      iconSystemHumanApproved: false,
      productionIconMastersComplete: false,
      appIconSystemAuthored: false,
      appIconHumanApproved: false,
      finalVisualSystemApproved: false
    }
  };
}

export function auditRegistrationBudget(samples = [], limits = { '24': 3, '18': 2, '16': 1, '14': 1 }) {
  const violations = [];
  for (const sample of samples) {
    if (sample.worldId !== 'provenance-glyph') continue;
    const limit = Number(limits[String(sample.size)]);
    if (!Number.isFinite(limit)) continue;
    if (!Number.isInteger(sample.registrationNodeCount) || sample.registrationNodeCount > limit) {
      violations.push({
        worldId: sample.worldId,
        iconId: sample.iconId,
        size: sample.size,
        registrationNodeCount: sample.registrationNodeCount,
        limit
      });
    }
  }
  return { pass: violations.length === 0, violations };
}

export function auditConventionalControlPurity(samples = []) {
  const violations = samples.filter((sample) => ICON_CRAFT_CONTROLS.includes(sample.iconId)
    && (sample.signatureNodeCount ?? 0) > 0);
  return { pass: violations.length === 0, violations };
}

export function auditOpticalWeight(measurements = [], { maxBoundsOccupancySpread = 0.42, maxInkCoverageCoefficientOfVariation = 0.58 } = {}) {
  const byWorldSize = new Map();
  for (const measurement of measurements) {
    const key = `${measurement.worldId}:${measurement.size}`;
    if (!byWorldSize.has(key)) byWorldSize.set(key, []);
    byWorldSize.get(key).push(measurement);
  }

  const groups = [];
  const violations = [];
  for (const [key, group] of byWorldSize.entries()) {
    const boundsValues = group.map((item) => Number(item.boundsOccupancy)).filter(Number.isFinite);
    const inkValues = group.map((item) => Number(item.inkCoverage)).filter(Number.isFinite);
    if (boundsValues.length === 0 || inkValues.length === 0) {
      violations.push({ key, code: 'measurement-missing' });
      continue;
    }
    const boundsSpread = Math.max(...boundsValues) - Math.min(...boundsValues);
    const mean = inkValues.reduce((sum, value) => sum + value, 0) / inkValues.length;
    const variance = inkValues.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / inkValues.length;
    const coefficientOfVariation = mean === 0 ? Infinity : Math.sqrt(variance) / mean;
    const record = { key, boundsSpread, inkCoverageCoefficientOfVariation: coefficientOfVariation };
    groups.push(record);
    if (boundsSpread > maxBoundsOccupancySpread || coefficientOfVariation > maxInkCoverageCoefficientOfVariation) {
      violations.push(record);
    }
  }
  return { pass: violations.length === 0, groups, violations };
}

export function buildIconCraftCalibrationEvidence({
  plan = null,
  worldEvidence = [],
  beforeAfterEvidence = [],
  controlEvidence = [],
  opticalVariantEvidence = [],
  registrationBudgetAudit = null,
  conventionalControlAudit = null,
  opticalWeightAudit = null,
  similarityWarnings = []
} = {}) {
  const findings = [];
  if (plan?.reviewReady !== true) findings.push(finding('blocker', 'icon-craft-plan-not-ready', 'Craft proof requires a review-ready craft plan.'));

  const byWorld = new Map((worldEvidence ?? []).map((item) => [item.worldId, item]));
  for (const worldId of ICON_CRAFT_WORLDS) {
    const evidence = byWorld.get(worldId);
    if (!evidence || evidence.exactBrowserProof !== true || !clean(evidence.overviewRef)) {
      findings.push(finding('blocker', 'icon-craft-world-evidence-missing', 'Each Icon World requires exact-browser craft overview evidence.', { worldId }));
    }
  }

  const expectedBeforeAfter = ICON_CRAFT_WORLDS.length * ICON_CRAFT_IDS.length;
  if ((beforeAfterEvidence ?? []).length !== expectedBeforeAfter) {
    findings.push(finding('blocker', 'icon-craft-before-after-incomplete', 'Craft proof requires one current-versus-corrected board for every calibration concept in every world.', {
      expected: expectedBeforeAfter,
      received: (beforeAfterEvidence ?? []).length
    }));
  }

  if ((controlEvidence ?? []).length !== ICON_CRAFT_WORLDS.length) {
    findings.push(finding('blocker', 'icon-craft-control-proof-incomplete', 'Craft proof requires a conventional-control firewall board for every world.'));
  }
  if ((opticalVariantEvidence ?? []).length !== ICON_CRAFT_WORLDS.length * ICON_CRAFT_IDS.length * ICON_CRAFT_SIZES.length) {
    findings.push(finding('blocker', 'icon-craft-optical-variants-incomplete', 'Craft proof requires explicit optical variant evidence for all ten concepts across all three worlds at 14/16/18/24.'));
  }
  if (registrationBudgetAudit?.pass !== true) findings.push(finding('blocker', 'icon-craft-registration-budget-failed', 'Provenance Glyph exceeds the allowed registration-node budget.', { audit: registrationBudgetAudit }));
  if (conventionalControlAudit?.pass !== true) findings.push(finding('blocker', 'icon-craft-control-purity-failed', 'Convention-dominant controls contain forbidden signature-node embellishment.', { audit: conventionalControlAudit }));
  if (opticalWeightAudit?.pass !== true) findings.push(finding('blocker', 'icon-craft-optical-weight-failed', 'Craft-corrected glyphs have not reached the declared optical occupancy/weight normalization tolerance.', { audit: opticalWeightAudit }));

  const expectedWarnings = (plan?.similarityWarnings?.pairs?.length ?? 0) * (plan?.similarityWarnings?.sizes?.length ?? 0) * ICON_CRAFT_WORLDS.length;
  if ((similarityWarnings ?? []).length !== expectedWarnings) {
    findings.push(finding('major', 'icon-craft-similarity-coverage-incomplete', 'Raster similarity warning evidence is incomplete.', {
      expected: expectedWarnings,
      received: (similarityWarnings ?? []).length
    }));
  }
  if ((similarityWarnings ?? []).some((item) => Object.hasOwn(item, 'semanticPass') || Object.hasOwn(item, 'selectionScore'))) {
    findings.push(finding('blocker', 'icon-craft-similarity-authority-overclaimed', 'Similarity telemetry may warn for human inspection but may not produce semantic pass/fail or selection scores.'));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const reviewReady = blockers.length === 0 && majors.length === 0;
  return {
    schema: ICON_CRAFT_PROOF_SCHEMA,
    projectId: plan?.projectId ?? null,
    craftFingerprint: plan?.craftFingerprint ?? null,
    status: reviewReady ? 'ready-for-human-icon-world-selection' : blockers.length ? 'blocked' : 'provisional',
    pass: blockers.length === 0,
    reviewReady,
    worldEvidence,
    beforeAfterEvidence,
    controlEvidence,
    opticalVariantEvidence,
    registrationBudgetAudit,
    conventionalControlAudit,
    opticalWeightAudit,
    similarityWarnings,
    findings,
    selection: null,
    selectedWorld: null,
    truth: {
      iconCraftCalibrationComplete: reviewReady,
      opticalVariantsReviewed: reviewReady,
      conventionalControlPurityReviewed: reviewReady,
      registrationBudgetValidated: reviewReady,
      opticalWeightNormalized: reviewReady,
      iconWorldHumanSelected: false,
      iconSystemHumanApproved: false,
      productionIconMastersComplete: false,
      appIconSystemAuthored: false,
      appIconHumanApproved: false,
      finalVisualSystemApproved: false
    }
  };
}
