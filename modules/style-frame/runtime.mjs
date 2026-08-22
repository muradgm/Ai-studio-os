function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

export const STYLE_FRAME_TYPES = [
  { id: 'opening', label: 'Opening / Hero', viewport: 'desktop', width: 1440, height: 900 },
  { id: 'sensory', label: 'Product / Sensory', viewport: 'desktop', width: 1440, height: 900 },
  { id: 'utility', label: 'Information / Utility', viewport: 'desktop', width: 1440, height: 900 },
  { id: 'transition', label: 'Narrative Transition', viewport: 'desktop', width: 1440, height: 900 },
  { id: 'mobile', label: 'Mobile Interpretation', viewport: 'mobile', width: 390, height: 844 }
];

function frameSpec(world, frameType) {
  return {
    schema: 'ai-studio-os/style-frame-proof@1',
    id: `${world.id}-${frameType.id}`,
    worldId: world.id,
    worldLabel: world.label,
    frameType: frameType.id,
    frameLabel: frameType.label,
    viewport: frameType.viewport,
    width: frameType.width,
    height: frameType.height,
    thesisRef: world.thesisRef ?? null,
    worldIdea: world.worldIdea,
    compositionModel: world.compositionModel,
    typographyIntent: world.typographyIntent,
    imageLanguage: world.imageLanguage,
    materialLanguage: world.materialLanguage,
    motionLanguage: world.motionLanguage,
    interactionModel: world.interactionModel,
    responsiveStrategy: world.responsiveStrategy,
    proofPolicy: {
      typography: 'proxy-only-not-approved-family',
      documentaryImagery: 'real-source-or-explicit-placeholder-only',
      syntheticProductClaim: false,
      productionTechnology: 'not-selected',
      purpose: 'compare-art-direction-worlds-before-selection'
    },
    truth: {
      humanVisualApproval: false,
      worldSelected: false,
      typographyApproved: false,
      documentaryProductImageProduced: false,
      productionReady: false
    }
  };
}

export function reviewStyleFrameProof(plan = {}) {
  const findings = [];
  const exploration = plan.exploration ?? null;
  const frames = Array.isArray(plan.frames) ? plan.frames : [];
  const worlds = Array.isArray(exploration?.worlds) ? exploration.worlds : [];

  if (!exploration || exploration.schema !== 'ai-studio-os/creative-world-exploration@1') {
    findings.push(finding('blocker', 'style-frame-world-exploration-missing', 'Style Frame Proof requires a supported Creative World Exploration.'));
  } else if (exploration.reviewReady !== true) {
    findings.push(finding('blocker', 'style-frame-world-exploration-not-ready', 'Style Frame Proof cannot become browser-proof-ready until Creative World Exploration is structurally review-ready.', { status: exploration.status ?? null }));
  }

  if (worlds.length < 3 || worlds.length > 5) {
    findings.push(finding('blocker', 'style-frame-world-count-invalid', 'Style Frame Proof requires 3–5 candidate worlds.', { count: worlds.length }));
  }

  const expectedCount = worlds.length * STYLE_FRAME_TYPES.length;
  if (frames.length !== expectedCount) {
    findings.push(finding('major', 'style-frame-coverage-incomplete', 'Every Creative World requires all five proof frames.', { expectedCount, actualCount: frames.length }));
  }

  for (const world of worlds) {
    const worldFrames = frames.filter((frame) => frame.worldId === world.id);
    for (const type of STYLE_FRAME_TYPES) {
      if (!worldFrames.some((frame) => frame.frameType === type.id)) {
        findings.push(finding('major', 'style-frame-type-missing', `Creative World ${world.id} is missing ${type.id}.`, { worldId: world.id, frameType: type.id }));
      }
    }
  }

  for (const frame of frames) {
    if (!clean(frame.worldIdea)) findings.push(finding('major', 'style-frame-world-idea-missing', 'Frame is not bound to a Creative World idea.', { frameId: frame.id }));
    if (frame.proofPolicy?.typography !== 'proxy-only-not-approved-family') findings.push(finding('blocker', 'style-frame-typography-frozen-too-early', 'Pre-selection style frames may use typography proxies but may not claim approved families.', { frameId: frame.id }));
    if (frame.proofPolicy?.syntheticProductClaim === true) findings.push(finding('blocker', 'style-frame-synthetic-documentary-claim', 'Style-frame proof may not fabricate a real Du Bonheur product as documentary evidence.', { frameId: frame.id }));
    if (frame.truth?.humanVisualApproval === true) findings.push(finding('blocker', 'style-frame-fabricated-approval', 'Browser proof cannot fabricate human visual approval.', { frameId: frame.id }));
  }

  if (plan.truth?.worldSelectedAutomatically === true || exploration?.truth?.selectedAutomatically === true) {
    findings.push(finding('blocker', 'style-frame-auto-selection-forbidden', 'Visual proof may reject weak worlds later, but it may not automatically choose the winning Creative World.'));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const status = blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-for-browser-proof';

  return {
    stage: 'style-frame-proof-review',
    status,
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    findings,
    truth: {
      structuralReviewOnly: true,
      humanVisualApproval: false,
      worldSelectedAutomatically: false,
      styleFrameProductionComplete: false
    }
  };
}

export function buildStyleFrameProof({ exploration = null } = {}) {
  const worlds = Array.isArray(exploration?.worlds) ? exploration.worlds : [];
  const frames = worlds.flatMap((world) => STYLE_FRAME_TYPES.map((type) => frameSpec(world, type)));

  const plan = {
    schema: 'ai-studio-os/style-frame-proof-plan@1',
    stage: 'style-frame-proof',
    exploration,
    explorationRef: exploration ? {
      schema: exploration.schema ?? null,
      status: exploration.status ?? null,
      worldIds: worlds.map((world) => world.id)
    } : null,
    frames,
    comparisons: STYLE_FRAME_TYPES.map((type) => ({
      id: `${type.id}-comparison`,
      frameType: type.id,
      worldIds: worlds.map((world) => world.id),
      purpose: 'compare-the-same-experience-moment-across-worlds'
    })),
    evidenceRequirements: {
      perWorldFrameCount: STYLE_FRAME_TYPES.length,
      crossWorldComparisonCount: STYLE_FRAME_TYPES.length,
      exactBrowserRaster: true,
      desktopProofRequired: true,
      mobileProofRequired: true,
      htmlSourceRequired: true,
      manifestRequired: true
    },
    selection: null,
    truth: {
      worldSelectedAutomatically: false,
      humanVisualApproval: false,
      typographyApproved: false,
      productionTechnologyApproved: false
    }
  };

  const review = reviewStyleFrameProof(plan);
  return {
    ...plan,
    status: review.status,
    pass: review.pass,
    reviewReady: review.reviewReady,
    findings: review.findings,
    review
  };
}
