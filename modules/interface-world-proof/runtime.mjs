import { buildProductUXArchitectureReference, sameProductUXArchitectureReference } from '../product-ux-architecture/reference.mjs';
import { buildCanonicalInterfaceFixture, buildCanonicalInterfaceFixtureReference, sameCanonicalInterfaceFixtureReference } from './fixture.mjs';

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanList(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean))];
}

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

export function buildInterfaceWorldProofPlan({ architecture = null, exploration = null, fixture = null } = {}) {
  const findings = [];
  const architectureRef = buildProductUXArchitectureReference(architecture ?? {});
  const canonicalFixture = buildCanonicalInterfaceFixture(fixture ?? {}, { architectureRef });
  const canonicalFixtureRef = buildCanonicalInterfaceFixtureReference(canonicalFixture, { architectureRef });
  const worlds = Array.isArray(exploration?.worlds) ? exploration.worlds : [];
  const screens = Array.isArray(architecture?.screens) ? architecture.screens : [];

  if (architecture?.schema !== 'ai-studio-os/product-ux-architecture@1' || architecture?.reviewReady !== true || architecture?.truth?.informationArchitectureFrozen !== true) {
    findings.push(finding('blocker', 'interface-world-proof-architecture-not-ready', 'Canonical interface Creative World proof requires a review-ready frozen Product UX Architecture.'));
  }
  if (canonicalFixture.reviewReady !== true) {
    findings.push(finding('blocker', 'interface-world-proof-fixture-not-ready', 'Canonical interface Creative World proof requires a review-ready canonical fixture with coherent context, state-aware memory, status taxonomy, and mobile navigation.', { fixtureFindings: canonicalFixture.findings }));
  }
  if (exploration?.schema !== 'ai-studio-os/creative-world-exploration@1' || exploration?.reviewReady !== true) {
    findings.push(finding('blocker', 'interface-world-proof-worlds-not-ready', 'Canonical interface proof requires review-ready Creative Worlds.'));
  }
  if (worlds.length < 3 || worlds.length > 5) findings.push(finding('blocker', 'interface-world-proof-world-count-invalid', 'Canonical interface proof requires 3–5 Creative Worlds.', { count: worlds.length }));
  if (screens.length < 4) findings.push(finding('blocker', 'interface-world-proof-screen-count-thin', 'Canonical interface proof requires a meaningful frozen screen set.', { count: screens.length }));
  if (canonicalFixture.canonicalScreenIds && JSON.stringify(canonicalFixture.canonicalScreenIds) !== JSON.stringify(screens.map((screen) => screen.id))) {
    findings.push(finding('blocker', 'interface-world-proof-fixture-screen-drift', 'Canonical fixture screen order must exactly match the frozen Product UX Architecture.', { fixtureScreenIds: canonicalFixture.canonicalScreenIds, architectureScreenIds: screens.map((screen) => screen.id) }));
  }

  const frames = worlds.flatMap((world) => screens.map((screen) => ({
    schema: 'ai-studio-os/interface-world-proof-frame@1',
    id: `${world.id}-${screen.id}`,
    projectId: architecture?.projectId ?? exploration?.projectId ?? null,
    worldId: world.id,
    worldLabel: world.label,
    screenId: screen.id,
    screenLabel: screen.label,
    screenPurpose: screen.purpose,
    primaryInformation: structuredClone(screen.primaryInformation ?? []),
    secondaryInformation: structuredClone(screen.secondaryInformation ?? []),
    primaryActions: structuredClone(screen.primaryActions ?? []),
    alwaysVisible: structuredClone(screen.alwaysVisible ?? []),
    progressiveDisclosure: structuredClone(screen.progressiveDisclosure ?? []),
    antiPatterns: structuredClone(screen.antiPatterns ?? []),
    worldIdea: world.worldIdea,
    signatureBehavior: world.signatureBehavior,
    compositionModel: world.compositionModel,
    typographyIntent: structuredClone(world.typographyIntent ?? {}),
    materialLanguage: world.materialLanguage,
    motionLanguage: world.motionLanguage,
    interactionModel: world.interactionModel,
    responsiveStrategy: world.responsiveStrategy,
    interfaceArchitectureRef: structuredClone(architectureRef),
    canonicalFixtureRef: structuredClone(canonicalFixtureRef),
    comparisonInvariants: structuredClone(canonicalFixture.comparisonInvariants ?? []),
    worldVariationAllowed: structuredClone(canonicalFixture.worldVariationAllowed ?? []),
    truth: {
      sameCanonicalProductSkeleton: true,
      sameCanonicalFixture: true,
      humanVisualApproval: false,
      worldSelected: false,
      finalUIApproved: false
    }
  })));

  for (const world of worlds) {
    if (world?.schema !== 'ai-studio-os/creative-world@1' || world?.reviewReady !== true) findings.push(finding('blocker', 'interface-world-proof-world-invalid', 'Every proof world must be structurally review-ready.', { worldId: world?.id ?? null }));
  }
  for (const screen of screens) {
    if (!clean(screen.id) || !clean(screen.purpose) || !(screen.primaryInformation?.length > 0) || !(screen.primaryActions?.length > 0)) findings.push(finding('major', 'interface-world-proof-screen-thin', 'Every canonical proof screen must preserve purpose, primary information, and primary actions.', { screenId: screen?.id ?? null }));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const reviewReady = blockers.length === 0 && majors.length === 0;

  return {
    schema: 'ai-studio-os/interface-world-proof-plan@1',
    projectId: architecture?.projectId ?? exploration?.projectId ?? null,
    stage: 'interface-world-proof',
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-for-browser-proof',
    pass: blockers.length === 0,
    reviewReady,
    interfaceArchitectureRef: architectureRef,
    canonicalFixtureRef,
    fixtureTruth: structuredClone(canonicalFixture.truth ?? {}),
    screenModel: structuredClone(canonicalFixture.screenModel ?? {}),
    statusTaxonomy: structuredClone(canonicalFixture.statusTaxonomy ?? {}),
    mobileNavigation: structuredClone(canonicalFixture.mobileNavigation ?? {}),
    explorationRef: {
      schema: exploration?.schema ?? null,
      projectId: exploration?.projectId ?? exploration?.thesisRef?.projectId ?? null,
      reviewReady: exploration?.reviewReady === true,
      worldIds: worlds.map((world) => world.id)
    },
    screenIds: screens.map((screen) => screen.id),
    frames,
    comparisons: screens.map((screen) => ({
      id: `${screen.id}-comparison`,
      screenId: screen.id,
      screenLabel: screen.label,
      worldIds: worlds.map((world) => world.id),
      purpose: 'compare-the-same-canonical-product-screen-and-fixture-across-all-creative-worlds'
    })),
    selection: null,
    findings,
    truth: {
      informationArchitectureFrozen: architecture?.truth?.informationArchitectureFrozen === true,
      canonicalFixtureFrozen: canonicalFixture.reviewReady === true,
      sameCanonicalProductSkeleton: true,
      sameCanonicalFixture: true,
      humanVisualApproval: false,
      humanWorldSelectionConfirmed: false,
      selectedAutomatically: false
    }
  };
}

export function buildInterfaceWorldProofEvidence({ plan = null, renderedFrames = [], comparisonRefs = [], overviewRefs = [] } = {}) {
  const findings = [];
  const frames = Array.isArray(renderedFrames) ? renderedFrames : [];
  const expected = Array.isArray(plan?.frames) ? plan.frames : [];
  const worldIds = cleanList(plan?.explorationRef?.worldIds);
  const screenIds = cleanList(plan?.screenIds);
  const comparisons = cleanList(comparisonRefs);
  const overviews = cleanList(overviewRefs);

  if (plan?.reviewReady !== true) findings.push(finding('blocker', 'interface-world-proof-plan-not-ready', 'Rendered evidence requires a review-ready canonical interface proof plan.'));
  for (const frame of expected) {
    const rendered = frames.find((item) => item.frameId === frame.id);
    if (!rendered?.imageRef || !rendered?.sourceRef) findings.push(finding('major', 'interface-world-proof-frame-evidence-missing', 'Every world/screen pair requires an exact browser image and matching source reference.', { frameId: frame.id }));
    if (rendered?.interfaceArchitectureFingerprint && rendered.interfaceArchitectureFingerprint !== plan?.interfaceArchitectureRef?.fingerprint) findings.push(finding('blocker', 'interface-world-proof-render-architecture-drift', 'Rendered frame architecture fingerprint differs from the proof plan.', { frameId: frame.id }));
    if (rendered?.canonicalFixtureFingerprint && rendered.canonicalFixtureFingerprint !== plan?.canonicalFixtureRef?.fingerprint) findings.push(finding('blocker', 'interface-world-proof-render-fixture-drift', 'Rendered frame fixture fingerprint differs from the proof plan.', { frameId: frame.id }));
  }
  if (comparisons.length !== screenIds.length) findings.push(finding('major', 'interface-world-proof-comparison-coverage-thin', 'Every canonical screen requires a same-screen cross-world comparison board.', { expected: screenIds.length, actual: comparisons.length }));
  if (overviews.length !== worldIds.length) findings.push(finding('major', 'interface-world-proof-overview-coverage-thin', 'Every Creative World requires a full canonical-screen overview board.', { expected: worldIds.length, actual: overviews.length }));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const reviewReady = blockers.length === 0 && majors.length === 0;

  return {
    schema: 'ai-studio-os/interface-world-proof-evidence@1',
    projectId: plan?.projectId ?? null,
    status: reviewReady ? 'ready-for-human-visual-review' : blockers.length ? 'blocked' : 'provisional',
    pass: blockers.length === 0,
    reviewReady,
    interfaceArchitectureRef: structuredClone(plan?.interfaceArchitectureRef ?? null),
    canonicalFixtureRef: structuredClone(plan?.canonicalFixtureRef ?? null),
    screenModel: structuredClone(plan?.screenModel ?? {}),
    statusTaxonomy: structuredClone(plan?.statusTaxonomy ?? {}),
    mobileNavigation: structuredClone(plan?.mobileNavigation ?? {}),
    comparisonRef: comparisons[0] ?? null,
    comparisonRefs: comparisons,
    overviewRefs: overviews,
    worlds: worldIds.map((worldId) => {
      const worldFrames = frames.filter((frame) => frame.worldId === worldId);
      return {
        worldId,
        reviewReady: reviewReady && worldFrames.length === screenIds.length,
        evidenceRefs: worldFrames.map((frame) => frame.imageRef).filter(Boolean),
        sourceRefs: worldFrames.map((frame) => frame.sourceRef).filter(Boolean),
        overviewRef: overviews.find((ref) => ref.includes(`${worldId}-overview`)) ?? null
      };
    }),
    findings,
    truth: {
      exactBrowserRaster: true,
      sameCanonicalProductSkeleton: true,
      sameCanonicalFixture: true,
      humanVisualApproval: false,
      humanWorldSelectionConfirmed: false,
      selectedAutomatically: false,
      finalUIApproved: false
    }
  };
}

export function proofMatchesInterfaceArchitecture(proof, requiredRef) {
  return sameProductUXArchitectureReference(proof?.interfaceArchitectureRef, requiredRef);
}

export function proofMatchesCanonicalInterfaceFixture(proof, requiredRef) {
  return sameCanonicalInterfaceFixtureReference(proof?.canonicalFixtureRef, requiredRef);
}
