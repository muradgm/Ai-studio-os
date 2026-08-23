function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanList(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean))];
}

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

export function selectReviewedHybridWorld({
  constitution = null,
  assistantReview = null,
  worldDefinition = null,
  humanConfirmed = false,
  visualReviewConfirmed = false,
  visualEvidenceRefs = [],
  selectedAt = null,
  selectionStatement = '',
  selectionSource = 'human'
} = {}) {
  const findings = [];
  const evidenceRefs = cleanList(visualEvidenceRefs);
  const candidateId = clean(constitution?.candidateId);

  if (constitution?.schema !== 'ai-studio-os/hybrid-interface-constitution@1' || !candidateId) {
    findings.push(finding('blocker', 'hybrid-selection-constitution-invalid', 'Human selection requires the reviewed Hybrid Constitution candidate.'));
  }
  if (assistantReview?.schema !== 'ai-studio-os/hybrid-interface-review@1'
    || assistantReview?.candidateId !== candidateId
    || assistantReview?.status !== 'candidate-outperformed-baseline-awaiting-human-selection') {
    findings.push(finding('blocker', 'hybrid-selection-review-not-ready', 'Hybrid selection requires the completed head-to-head review that advanced the same candidate to human selection.', {
      candidateId,
      reviewCandidateId: assistantReview?.candidateId ?? null,
      reviewStatus: assistantReview?.status ?? null
    }));
  }
  if (!(Number(assistantReview?.weightedScore) > Number(assistantReview?.baselineScore))) {
    findings.push(finding('blocker', 'hybrid-selection-baseline-not-beaten', 'Selected Hybrid must have cleared the accepted Decision Spine baseline in the reviewed proof.'));
  }
  if (humanConfirmed !== true) {
    findings.push(finding('blocker', 'hybrid-selection-human-confirmation-required', 'Only explicit human selection can close Creative World exploration.'));
  }
  if (visualReviewConfirmed !== true || evidenceRefs.length < 9) {
    findings.push(finding('blocker', 'hybrid-selection-visual-review-required', 'Human selection requires reviewed eight-screen head-to-head evidence plus the Hybrid system overview.', { evidenceRefCount: evidenceRefs.length }));
  }
  if (!clean(selectedAt) || !clean(selectionStatement)) {
    findings.push(finding('major', 'hybrid-selection-event-thin', 'Selection requires a timestamp and explicit human selection statement.'));
  }
  if (selectionSource !== 'human') {
    findings.push(finding('blocker', 'hybrid-selection-source-invalid', 'Hybrid selection authority must remain human.'));
  }

  if (worldDefinition?.schema !== 'ai-studio-os/creative-world@1'
    || worldDefinition?.id !== candidateId
    || worldDefinition?.reviewReady !== true) {
    findings.push(finding('blocker', 'hybrid-selection-world-definition-invalid', 'Selected Hybrid must be persisted as a review-ready Creative World definition using the constitution candidate id.'));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const confirmed = blockers.length === 0 && majors.length === 0;
  const selectedWorld = confirmed ? {
    ...structuredClone(worldDefinition),
    selected: true,
    truth: {
      ...(worldDefinition?.truth ?? {}),
      humanCreativeSelectionConfirmed: true,
      visualWorldProofReviewed: true,
      styleFrameReviewComplete: true,
      typographyApproved: false,
      productionTechnologyApproved: false
    }
  } : null;

  return {
    schema: 'ai-studio-os/hybrid-world-selection@1',
    projectId: constitution?.projectId ?? null,
    candidateId: candidateId || null,
    status: confirmed ? 'selected-awaiting-visual-system-v1' : blockers.length ? 'blocked' : 'provisional',
    pass: blockers.length === 0,
    reviewReady: confirmed,
    selectedWorld,
    selection: {
      worldId: candidateId || null,
      humanConfirmed: confirmed,
      visualReviewConfirmed: confirmed,
      visualEvidenceRefs: evidenceRefs,
      selectedAt: clean(selectedAt) || null,
      selectionStatement: clean(selectionStatement) || null,
      selectionSource,
      selectedAutomatically: false
    },
    freezeBoundary: {
      frozen: [
        'Hybrid Constitution V1 source responsibilities',
        'screen-by-screen source hierarchy',
        'Decision Spine semantic lineage rule',
        'Counterpoint reading and judgment role',
        'Threshold consequence-only role',
        'canonical Product UX Architecture',
        'canonical UX fixture'
      ],
      explicitlyNotFrozen: [
        'exact typography',
        'current colors',
        'sidebar proportions',
        'button appearance',
        'spacing scale',
        'border treatment',
        'icons',
        'final header hierarchy',
        'exact mobile measurements',
        'current component styling',
        'motion details'
      ]
    },
    nextStage: 'visual-system-v1',
    findings,
    truth: {
      creativeWorldExplorationClosed: confirmed,
      humanWorldSelectionConfirmed: confirmed,
      humanVisualApproval: false,
      finalVisualSystemApproved: false,
      selectedAutomatically: false
    }
  };
}
