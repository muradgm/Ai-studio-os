function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanList(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean))];
}

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

export const DEFAULT_STYLE_FRAME_MOMENTS = Object.freeze([
  { id: 'opening', label: 'Opening / Proposition', viewport: 'desktop', width: 1440, height: 900, purpose: 'Prove the world at first contact.' },
  { id: 'core', label: 'Core Product Behavior', viewport: 'desktop', width: 1440, height: 900, purpose: 'Prove the world while the primary product mechanic is active.' },
  { id: 'decision', label: 'Decision / Action', viewport: 'desktop', width: 1440, height: 900, purpose: 'Prove the world at a meaningful user decision or action boundary.' },
  { id: 'outcome', label: 'Outcome / Evidence', viewport: 'desktop', width: 1440, height: 900, purpose: 'Prove the world after consequence, feedback, or validation.' },
  { id: 'mobile', label: 'Mobile Interpretation', viewport: 'mobile', width: 390, height: 844, purpose: 'Prove that the world survives narrow-screen constraints.' }
]);

function normalizeMoment(moment = {}, index = 0) {
  const viewport = clean(moment.viewport) || (clean(moment.id) === 'mobile' ? 'mobile' : 'desktop');
  const width = Number.isFinite(Number(moment.width)) ? Number(moment.width) : viewport === 'mobile' ? 390 : 1440;
  const height = Number.isFinite(Number(moment.height)) ? Number(moment.height) : viewport === 'mobile' ? 844 : 900;
  return {
    id: clean(moment.id) || `moment-${index + 1}`,
    label: clean(moment.label) || `Proof Moment ${index + 1}`,
    viewport,
    width,
    height,
    purpose: clean(moment.purpose),
    productState: clean(moment.productState) || null
  };
}

function normalizeMoments(moments) {
  const source = Array.isArray(moments) && moments.length ? moments : DEFAULT_STYLE_FRAME_MOMENTS;
  return source.map(normalizeMoment);
}

function frameSpec(world, moment) {
  return {
    schema: 'ai-studio-os/style-frame-proof@2',
    id: `${world.id}-${moment.id}`,
    worldId: world.id,
    worldLabel: world.label,
    momentId: moment.id,
    momentLabel: moment.label,
    viewport: moment.viewport,
    width: moment.width,
    height: moment.height,
    purpose: moment.purpose,
    productState: moment.productState,
    thesisRef: structuredClone(world.thesisRef ?? null),
    worldIdea: world.worldIdea,
    signatureBehavior: world.signatureBehavior,
    compositionModel: world.compositionModel,
    typographyIntent: structuredClone(world.typographyIntent ?? {}),
    imageLanguage: world.imageLanguage,
    materialLanguage: world.materialLanguage,
    motionLanguage: world.motionLanguage,
    interactionModel: world.interactionModel,
    responsiveStrategy: world.responsiveStrategy,
    proofPolicy: {
      typography: 'proxy-only-not-approved-family',
      documentaryImagery: 'real-source-or-explicit-placeholder-only',
      productionTechnology: 'not-selected',
      exactBrowserRasterRequired: true,
      purpose: 'compare-creative-worlds-before-human-selection'
    },
    truth: {
      humanVisualApproval: false,
      worldSelected: false,
      typographyApproved: false,
      productionTechnologyApproved: false,
      productionReady: false
    }
  };
}

export function reviewStyleFrameProof(plan = {}) {
  const findings = [];
  const exploration = plan.exploration ?? null;
  const worlds = Array.isArray(exploration?.worlds) ? exploration.worlds : [];
  const moments = Array.isArray(plan.moments) ? plan.moments : [];
  const frames = Array.isArray(plan.frames) ? plan.frames : [];

  if (!exploration || exploration.schema !== 'ai-studio-os/creative-world-exploration@1') {
    findings.push(finding('blocker', 'style-frame-world-exploration-missing', 'Style Frame Proof requires a supported Creative World Exploration.'));
  } else if (exploration.reviewReady !== true) {
    findings.push(finding('blocker', 'style-frame-world-exploration-not-ready', 'Style Frame Proof cannot proceed until Creative World Exploration is structurally review-ready.', { status: exploration.status ?? null }));
  }

  if (worlds.length < 3 || worlds.length > 5) {
    findings.push(finding('blocker', 'style-frame-world-count-invalid', 'Style Frame Proof requires 3–5 candidate worlds.', { count: worlds.length }));
  }

  if (moments.length < 4 || moments.length > 7) {
    findings.push(finding('major', 'style-frame-moment-count-invalid', 'Style Frame Proof requires 4–7 comparable project moments.', { count: moments.length }));
  }

  const momentIds = moments.map((moment) => moment.id);
  if (new Set(momentIds).size !== momentIds.length) {
    findings.push(finding('blocker', 'style-frame-moment-id-duplicate', 'Style Frame proof moment ids must be unique.'));
  }

  for (const moment of moments) {
    if (!clean(moment.id) || !clean(moment.label) || !clean(moment.purpose)) {
      findings.push(finding('major', 'style-frame-moment-incomplete', 'Each proof moment requires id, label, and product-specific purpose.', { momentId: moment.id ?? null }));
    }
    if (!Number.isFinite(moment.width) || moment.width < 320 || !Number.isFinite(moment.height) || moment.height < 480) {
      findings.push(finding('blocker', 'style-frame-moment-viewport-invalid', 'Proof moment viewport dimensions are invalid.', { momentId: moment.id ?? null, width: moment.width, height: moment.height }));
    }
  }

  if (!moments.some((moment) => moment.viewport === 'mobile')) {
    findings.push(finding('major', 'style-frame-mobile-proof-missing', 'At least one mobile proof moment is required.'));
  }

  const expectedCount = worlds.length * moments.length;
  if (frames.length !== expectedCount) {
    findings.push(finding('major', 'style-frame-coverage-incomplete', 'Every Creative World requires every configured proof moment.', { expectedCount, actualCount: frames.length }));
  }

  for (const world of worlds) {
    const worldFrames = frames.filter((frame) => frame.worldId === world.id);
    for (const moment of moments) {
      if (!worldFrames.some((frame) => frame.momentId === moment.id)) {
        findings.push(finding('major', 'style-frame-moment-missing', `Creative World ${world.id} is missing ${moment.id}.`, { worldId: world.id, momentId: moment.id }));
      }
    }
  }

  for (const frame of frames) {
    if (!clean(frame.worldIdea) || !clean(frame.signatureBehavior)) findings.push(finding('major', 'style-frame-world-binding-thin', 'Frame must preserve the Creative World idea and signature behavior.', { frameId: frame.id }));
    if (!clean(frame.purpose) || !clean(frame.productState)) findings.push(finding('major', 'style-frame-product-state-thin', 'Project-specific proof should state what product moment/state the frame is proving.', { frameId: frame.id }));
    if (frame.proofPolicy?.typography !== 'proxy-only-not-approved-family') findings.push(finding('blocker', 'style-frame-typography-frozen-too-early', 'Pre-selection style frames may use typography proxies but may not claim approved families.', { frameId: frame.id }));
    if (frame.proofPolicy?.documentaryImagery !== 'real-source-or-explicit-placeholder-only') findings.push(finding('blocker', 'style-frame-documentary-policy-weakened', 'Style-frame documentary imagery must remain real-source or explicitly placeholder-only.', { frameId: frame.id }));
    if (frame.truth?.humanVisualApproval === true || frame.truth?.worldSelected === true) findings.push(finding('blocker', 'style-frame-fabricated-approval', 'Browser proof cannot fabricate human visual approval or world selection.', { frameId: frame.id }));
  }

  if (plan.selection) findings.push(finding('blocker', 'style-frame-selection-premature', 'Style Frame Proof is evidence for selection and may not contain a selected world.'));
  if (plan.truth?.worldSelectedAutomatically === true || exploration?.truth?.selectedAutomatically === true) {
    findings.push(finding('blocker', 'style-frame-auto-selection-forbidden', 'Visual proof may expose differences but may not automatically choose the winning Creative World.'));
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

export function buildStyleFrameProof({ exploration = null, moments = null } = {}) {
  const normalizedMoments = normalizeMoments(moments);
  const worlds = Array.isArray(exploration?.worlds) ? exploration.worlds : [];
  const frames = worlds.flatMap((world) => normalizedMoments.map((moment) => frameSpec(world, moment)));
  const projectId = clean(exploration?.projectId ?? exploration?.thesisRef?.projectId) || null;

  const plan = {
    schema: 'ai-studio-os/style-frame-proof-plan@2',
    stage: 'style-frame-proof',
    projectId,
    exploration,
    explorationRef: exploration ? {
      schema: exploration.schema ?? null,
      status: exploration.status ?? null,
      reviewReady: exploration.reviewReady === true,
      worldIds: worlds.map((world) => world.id)
    } : null,
    moments: normalizedMoments,
    frames,
    comparisons: normalizedMoments.map((moment) => ({
      id: `${moment.id}-comparison`,
      momentId: moment.id,
      momentLabel: moment.label,
      worldIds: worlds.map((world) => world.id),
      purpose: 'compare-the-same-product-state-across-all-creative-worlds'
    })),
    evidenceRequirements: {
      perWorldFrameCount: normalizedMoments.length,
      crossWorldComparisonCount: normalizedMoments.length,
      exactBrowserRaster: true,
      desktopProofRequired: normalizedMoments.some((moment) => moment.viewport === 'desktop'),
      mobileProofRequired: normalizedMoments.some((moment) => moment.viewport === 'mobile'),
      htmlSourceRequired: true,
      manifestRequired: true,
      humanSelectionRequiredAfterProof: true
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

export function buildVisualProofEvidence({ plan, renderedFrames = [], comparisonRefs = [] } = {}) {
  const findings = [];
  const frames = Array.isArray(renderedFrames) ? renderedFrames : [];
  const worlds = Array.isArray(plan?.exploration?.worlds) ? plan.exploration.worlds : [];
  const expected = Array.isArray(plan?.frames) ? plan.frames : [];
  const refs = cleanList(comparisonRefs);

  if (plan?.reviewReady !== true) findings.push(finding('blocker', 'style-frame-plan-not-ready', 'Visual proof evidence requires a review-ready Style Frame Proof plan.'));
  for (const expectedFrame of expected) {
    const rendered = frames.find((item) => item.frameId === expectedFrame.id);
    if (!rendered?.imageRef || !rendered?.sourceRef) findings.push(finding('major', 'style-frame-render-evidence-missing', 'Each planned frame requires exact browser image and source references.', { frameId: expectedFrame.id }));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const reviewReady = blockers.length === 0 && majors.length === 0;

  return {
    schema: 'ai-studio-os/style-frame-proof-evidence@2',
    projectId: plan?.projectId ?? null,
    status: reviewReady ? 'ready-for-human-visual-review' : blockers.length ? 'blocked' : 'provisional',
    pass: blockers.length === 0,
    reviewReady,
    comparisonRef: refs[0] ?? null,
    comparisonRefs: refs,
    worlds: worlds.map((world) => {
      const evidenceRefs = frames.filter((frame) => frame.worldId === world.id).map((frame) => frame.imageRef).filter(Boolean);
      return {
        worldId: world.id,
        reviewReady: reviewReady && evidenceRefs.length === plan.moments.length,
        evidenceRefs,
        sourceRefs: frames.filter((frame) => frame.worldId === world.id).map((frame) => frame.sourceRef).filter(Boolean)
      };
    }),
    findings,
    truth: {
      exactBrowserRaster: true,
      humanVisualApproval: false,
      humanWorldSelectionConfirmed: false,
      selectedAutomatically: false,
      typographyApproved: false,
      productionTechnologyApproved: false
    }
  };
}
