function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}
function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

export function buildMotionSystemProofEvidence({ system = null, canonicalClips = [], scenarioClips = [], primitiveChecks = [], reducedMotionCheck = null } = {}) {
  const findings = [];
  const expectedScreens = system?.canonicalFixtureRef?.screenIds ?? [];
  const expectedScenarios = (system?.proofScenarios ?? []).map((scenario) => scenario.id);
  const expectedPrimitives = (system?.primitives ?? []).map((primitive) => primitive.id);

  if (system?.reviewReady !== true) findings.push(finding('blocker', 'motion-proof-system-not-ready', 'Motion System must be review-ready before browser proof.'));

  const canonicalByScreen = new Map((Array.isArray(canonicalClips) ? canonicalClips : []).map((clip) => [clip.screenId, clip]));
  for (const screenId of expectedScreens) {
    const clip = canonicalByScreen.get(screenId);
    if (!clip || !clean(clip.videoRef) || !clean(clip.sourceRef) || !clean(clip.endFrameRef)) {
      findings.push(finding('blocker', 'motion-proof-canonical-screen-missing', 'Every frozen canonical screen requires an exact-browser motion integration clip.', { screenId }));
    }
  }

  const scenarioById = new Map((Array.isArray(scenarioClips) ? scenarioClips : []).map((clip) => [clip.scenarioId, clip]));
  for (const scenarioId of expectedScenarios) {
    const clip = scenarioById.get(scenarioId);
    if (!clip || !clean(clip.videoRef) || !clean(clip.sourceRef) || !Array.isArray(clip.eventTrace) || !clip.eventTrace.length) {
      findings.push(finding('blocker', 'motion-proof-runtime-scenario-missing', 'Every authored runtime-state proof scenario requires browser evidence and an event trace.', { scenarioId }));
    }
    if (clip?.eventEvidenceMode !== 'proof-fixture') {
      findings.push(finding('blocker', 'motion-proof-fixture-truth-missing', 'Motion browser scenarios must clearly identify fixture event evidence rather than pretending to be production telemetry.', { scenarioId }));
    }
  }

  const primitiveById = new Map((Array.isArray(primitiveChecks) ? primitiveChecks : []).map((check) => [check.primitiveId, check]));
  for (const primitiveId of expectedPrimitives) {
    const check = primitiveById.get(primitiveId);
    if (!check || check.pass !== true) findings.push(finding('blocker', 'motion-proof-primitive-evidence-failed', 'Every motion primitive must pass runtime-evidence validation in the proof harness.', { primitiveId }));
  }

  if (!reducedMotionCheck || reducedMotionCheck.pass !== true || reducedMotionCheck.motionPreference !== 'reduce') {
    findings.push(finding('blocker', 'motion-proof-reduced-motion-failed', 'Reduced-motion equivalence requires a real browser proof with reduced motion enabled.'));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const reviewReady = blockers.length === 0;
  return {
    schema: 'ai-studio-os/motion-system-proof@1',
    projectId: system?.projectId ?? null,
    motionSystemId: system?.id ?? null,
    motionSystemFingerprint: system?.motionSystemFingerprint ?? null,
    status: reviewReady ? 'ready-for-human-motion-review' : 'blocked',
    pass: reviewReady,
    reviewReady,
    exactBrowserMotionProof: reviewReady,
    canonicalCoverage: `${canonicalByScreen.size}/${expectedScreens.length}`,
    runtimeScenarioCoverage: `${scenarioById.size}/${expectedScenarios.length}`,
    primitiveCoverage: `${primitiveById.size}/${expectedPrimitives.length}`,
    canonicalClips,
    scenarioClips,
    primitiveChecks,
    reducedMotionCheck,
    findings,
    truth: {
      proofFixturesAreProductionTelemetry: false,
      runtimeEventAdaptersImplemented: system?.truth?.runtimeEventAdaptersImplemented === true,
      exactBrowserMotionProofComplete: reviewReady,
      reducedMotionProofComplete: reducedMotionCheck?.pass === true,
      humanMotionApproval: false,
      humanVisualApproval: false,
      finalVisualSystemApproved: false
    }
  };
}
