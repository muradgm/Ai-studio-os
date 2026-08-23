function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanList(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean))];
}

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

const REQUIRED_DIMENSIONS = [
  'brandIntegration',
  'typography',
  'color',
  'surfaces',
  'spacingDensity',
  'iconography',
  'componentGrammar',
  'interactionStates',
  'motion',
  'responsive'
];

const REQUIRED_STRESS_STATES = [
  'short-answer',
  'long-answer',
  'code-heavy-answer',
  'dense-evidence',
  'ten-plus-sources',
  'multi-stage-recommendation',
  'tool-execution',
  'error-state',
  'streaming-state',
  'very-long-project-memory'
];

// Deprecated compatibility export. Formal motion authority now lives in ai-studio-os/motion-system@1.
const REQUIRED_MOTION_STATES = [
  'context-reading',
  'council-working',
  'streaming-response',
  'evidence-attachment',
  'approval-boundary',
  'execution-progress',
  'verification'
];

const REQUIRED_COMPONENTS = [
  'app-shell',
  'project-navigation',
  'conversation-thread',
  'council-message',
  'structured-recommendation',
  'context-inspector',
  'evidence-item',
  'approval-request',
  'decision-record',
  'memory-record',
  'composer',
  'code-block',
  'data-table',
  'tool-execution',
  'error-message'
];

export function buildVisualSystem(input = {}, { selection = null, architectureRef = null, fixtureRef = null, motionSystem = null } = {}) {
  const system = structuredClone(input ?? {});
  const findings = [];

  if (system.schema !== 'ai-studio-os/visual-system@1') {
    findings.push(finding('blocker', 'visual-system-schema-invalid', 'Visual System must use ai-studio-os/visual-system@1.'));
  }
  if (!clean(system.projectId) || !clean(system.id)) {
    findings.push(finding('blocker', 'visual-system-identity-invalid', 'Visual System requires projectId and id.'));
  }
  if (selection?.schema !== 'ai-studio-os/hybrid-world-selection@1'
    || selection?.truth?.humanWorldSelectionConfirmed !== true
    || selection?.truth?.creativeWorldExplorationClosed !== true
    || selection?.selectedWorld?.id !== system.selectedWorldRef?.id) {
    findings.push(finding('blocker', 'visual-system-selected-world-not-authoritative', 'Visual System V1 requires the human-selected Hybrid world and closed Creative World exploration.', {
      selectedWorldId: selection?.selectedWorld?.id ?? null,
      visualSystemWorldId: system.selectedWorldRef?.id ?? null
    }));
  }
  if (selection?.truth?.humanVisualApproval !== false || selection?.truth?.finalVisualSystemApproved !== false) {
    findings.push(finding('blocker', 'visual-system-upstream-truth-invalid', 'World selection must not already claim final visual approval.'));
  }
  if (architectureRef?.fingerprint !== selection?.proofRef?.architectureFingerprint
    || fixtureRef?.fingerprint !== selection?.proofRef?.canonicalFixtureFingerprint) {
    findings.push(finding('blocker', 'visual-system-product-proof-stale', 'Visual System must remain bound to the architecture and canonical fixture used for human world selection.', {
      architectureFingerprint: architectureRef?.fingerprint ?? null,
      selectedArchitectureFingerprint: selection?.proofRef?.architectureFingerprint ?? null,
      fixtureFingerprint: fixtureRef?.fingerprint ?? null,
      selectedFixtureFingerprint: selection?.proofRef?.canonicalFixtureFingerprint ?? null
    }));
  }

  for (const dimension of REQUIRED_DIMENSIONS) {
    if (!system[dimension] || typeof system[dimension] !== 'object') {
      findings.push(finding('major', 'visual-system-dimension-missing', `Visual System requires ${dimension}.`, { dimension }));
    }
  }

  const canonicalScreenIds = cleanList(system.canonicalScreenIds);
  const expectedScreenIds = cleanList(fixtureRef?.screenIds);
  if (JSON.stringify(canonicalScreenIds) !== JSON.stringify(expectedScreenIds)) {
    findings.push(finding('blocker', 'visual-system-screen-drift', 'Visual System proof coverage must exactly match the frozen canonical screen set.', { canonicalScreenIds, expectedScreenIds }));
  }

  const typography = system.typography ?? {};
  if (!clean(typography.readingFamily) || !clean(typography.interfaceFamily)) {
    findings.push(finding('major', 'visual-system-typography-families-missing', 'Visual System V1 requires explicit reading and interface font candidates.'));
  }
  if (!(typography.roles && Object.keys(typography.roles).length >= 5)) {
    findings.push(finding('major', 'visual-system-typography-roles-thin', 'Typography requires explicit roles for conversation, recommendation, body, metadata, and code/technical content.'));
  }
  if (!Array.isArray(typography.densityRules) || typography.densityRules.length < 3) {
    findings.push(finding('major', 'visual-system-typography-density-rules-thin', 'Typography must define how editorial hierarchy adapts under dense technical content.'));
  }

  const color = system.color ?? {};
  for (const token of ['canvas', 'surface', 'ink', 'mutedInk', 'line', 'lineage', 'evidence', 'consequence', 'focus']) {
    if (!clean(color.tokens?.[token])) findings.push(finding('major', 'visual-system-color-token-missing', 'Color system is missing a required semantic token.', { token }));
  }
  if (color.consequencePolicy?.ordinaryConversationAllowed !== false || color.consequencePolicy?.permanentNavigationAllowed !== false) {
    findings.push(finding('blocker', 'visual-system-consequence-color-leak', 'Consequence color must remain excluded from ordinary conversation and permanent navigation.'));
  }

  const components = cleanList((system.componentGrammar?.components ?? []).map((item) => item?.id ?? item));
  for (const id of REQUIRED_COMPONENTS) {
    if (!components.includes(id)) findings.push(finding('major', 'visual-system-component-missing', 'Visual System component grammar does not cover a required product primitive.', { componentId: id }));
  }

  const stressStates = cleanList((system.stressTests ?? []).map((item) => item?.id ?? item));
  for (const id of REQUIRED_STRESS_STATES) {
    if (!stressStates.includes(id)) findings.push(finding('major', 'visual-system-stress-state-missing', 'Visual System cannot become browser-proof ready without the required dense/edge-state stress case.', { stressStateId: id }));
  }

  const motionRef = system.motionSystemRef ?? {};
  if (clean(motionRef.schema) !== 'ai-studio-os/motion-system@1' || !clean(motionRef.id) || !clean(motionRef.sourceRef)) {
    findings.push(finding('blocker', 'visual-system-motion-system-ref-invalid', 'Visual System V1 must declare the formal Motion System V1 artifact that owns motion truth.'));
  }
  if (motionSystem) {
    if (motionSystem?.schema !== 'ai-studio-os/motion-system@1'
      || motionSystem?.reviewReady !== true
      || clean(motionRef.id) !== clean(motionSystem?.id)
      || clean(motionRef.schema) !== motionSystem?.schema) {
      findings.push(finding('blocker', 'visual-system-motion-system-not-ready', 'Supplied Motion System V1 is not review-ready or does not match the declared reference.', {
        motionSystemRef: motionRef,
        suppliedMotionSystemId: motionSystem?.id ?? null,
        suppliedMotionSystemStatus: motionSystem?.status ?? null
      }));
    } else {
      if (motionSystem.selectedWorldRef?.id !== system.selectedWorldRef?.id
        || motionSystem.visualSystemCandidateRef?.id !== system.id) {
        findings.push(finding('blocker', 'visual-system-motion-system-authority-mismatch', 'Motion System must inherit the same selected Hybrid world and current Visual System candidate.'));
      }
      if (motionSystem.architectureRef?.fingerprint !== architectureRef?.fingerprint
        || motionSystem.canonicalFixtureRef?.fingerprint !== fixtureRef?.fingerprint) {
        findings.push(finding('blocker', 'visual-system-motion-system-proof-stale', 'Motion System is bound to stale product architecture or canonical fixture evidence.'));
      }
    }
  }
  if (clean(system.motion?.sourceOfTruth) !== clean(motionRef.sourceRef)) {
    findings.push(finding('major', 'visual-system-motion-consumption-source-invalid', 'Inline Visual System motion rules must identify the formal Motion System artifact as their source of truth.'));
  }
  if (system.motion?.humanApproved !== false) {
    findings.push(finding('blocker', 'visual-system-motion-approval-fabricated', 'Visual System candidate may not claim Motion System human approval before explicit review.'));
  }

  if (!Array.isArray(system.responsive?.breakpoints) || system.responsive.breakpoints.length < 3
    || !Array.isArray(system.responsive?.mobileRules) || system.responsive.mobileRules.length < 4) {
    findings.push(finding('major', 'visual-system-responsive-thin', 'Responsive grammar requires explicit breakpoints and mobile simplification rules.'));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const reviewReady = blockers.length === 0 && majors.length === 0;

  return {
    ...system,
    canonicalScreenIds,
    status: reviewReady ? 'ready-for-visual-system-browser-proof' : blockers.length ? 'blocked' : 'provisional',
    pass: blockers.length === 0,
    reviewReady,
    selectedWorldRef: structuredClone(system.selectedWorldRef ?? null),
    motionSystemRef: structuredClone(system.motionSystemRef ?? null),
    motionSystemFingerprint: motionSystem?.motionSystemFingerprint ?? null,
    architectureRef: structuredClone(architectureRef ?? null),
    canonicalFixtureRef: structuredClone(fixtureRef ?? null),
    findings,
    proofRequirements: {
      canonicalScreens: canonicalScreenIds.length,
      stressStates: REQUIRED_STRESS_STATES,
      exactBrowserProof: true,
      semanticFixtureInvariant: true,
      exactMotionBrowserProof: true,
      reducedMotionEquivalence: true,
      runtimeEventAdaptersRequiredBeforeProduction: true,
      humanVisualApprovalRequiredAfterProof: true
    },
    truth: {
      creativeWorldSelected: selection?.truth?.humanWorldSelectionConfirmed === true,
      creativeWorldExplorationClosed: selection?.truth?.creativeWorldExplorationClosed === true,
      visualSystemCandidateAuthored: true,
      formalMotionSystemRefDeclared: clean(motionRef.schema) === 'ai-studio-os/motion-system@1' && Boolean(clean(motionRef.id)),
      formalMotionSystemBound: motionSystem?.reviewReady === true,
      runtimeMotionAdaptersImplemented: motionSystem?.truth?.runtimeEventAdaptersImplemented === true,
      typographyHumanApproved: false,
      colorHumanApproved: false,
      motionHumanApproved: false,
      humanVisualApproval: false,
      finalVisualSystemApproved: false
    }
  };
}

export { REQUIRED_DIMENSIONS, REQUIRED_STRESS_STATES, REQUIRED_MOTION_STATES, REQUIRED_COMPONENTS };
