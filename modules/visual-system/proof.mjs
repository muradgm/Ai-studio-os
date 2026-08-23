function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanList(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean))];
}

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

export function buildVisualSystemProofEvidence({ system = null, canonicalFrames = [], stressFrames = [], overviewRefs = [] } = {}) {
  const findings = [];
  const canonical = Array.isArray(canonicalFrames) ? canonicalFrames : [];
  const stress = Array.isArray(stressFrames) ? stressFrames : [];
  const overviews = cleanList(overviewRefs);

  if (system?.reviewReady !== true || system?.status !== 'ready-for-visual-system-browser-proof') {
    findings.push(finding('blocker', 'visual-system-proof-system-not-ready', 'Exact browser proof requires a review-ready Visual System candidate.'));
  }

  const screenIds = cleanList(system?.canonicalScreenIds);
  const stressIds = cleanList((system?.stressTests ?? []).map((item) => item?.id));
  for (const screenId of screenIds) {
    const frame = canonical.find((item) => item.screenId === screenId);
    if (!frame?.imageRef || !frame?.sourceRef || !frame?.semanticFingerprint || frame?.semanticFixtureInvariant !== true) {
      findings.push(finding('major', 'visual-system-proof-canonical-frame-missing', 'Each canonical screen requires exact browser image/source evidence and semantic-fixture invariance.', { screenId }));
    }
  }
  for (const stressId of stressIds) {
    const frame = stress.find((item) => item.stressId === stressId);
    if (!frame?.imageRef || !frame?.sourceRef) {
      findings.push(finding('major', 'visual-system-proof-stress-frame-missing', 'Each required Visual System stress state requires exact browser evidence.', { stressId }));
    }
  }
  if (overviews.length < 2) {
    findings.push(finding('major', 'visual-system-proof-overviews-missing', 'Visual System proof requires separate canonical-system and stress-state overview boards.'));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const reviewReady = blockers.length === 0 && majors.length === 0;

  return {
    schema: 'ai-studio-os/visual-system-proof-evidence@1',
    projectId: system?.projectId ?? null,
    visualSystemId: system?.id ?? null,
    status: reviewReady ? 'ready-for-human-visual-system-review' : blockers.length ? 'blocked' : 'provisional',
    pass: blockers.length === 0,
    reviewReady,
    selectedWorldRef: structuredClone(system?.selectedWorldRef ?? null),
    architectureRef: structuredClone(system?.architectureRef ?? null),
    canonicalFixtureRef: structuredClone(system?.canonicalFixtureRef ?? null),
    canonicalFrames: canonical,
    stressFrames: stress,
    overviewRefs: overviews,
    findings,
    truth: {
      exactBrowserProof: reviewReady,
      canonicalSemanticFixturePreserved: reviewReady && canonical.every((item) => item.semanticFixtureInvariant === true),
      denseStressCoverageComplete: reviewReady && stress.length === stressIds.length,
      humanVisualApproval: false,
      finalVisualSystemApproved: false
    }
  };
}
