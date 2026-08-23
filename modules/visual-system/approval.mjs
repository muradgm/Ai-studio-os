function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

export function resolveVisualSystemHumanApproval(approval = {}, { visualSystem = null, selection = null } = {}) {
  const findings = [];
  if (approval.schema !== 'ai-studio-os/visual-system-human-approval@1') {
    findings.push(finding('blocker', 'visual-system-approval-schema-invalid', 'Visual System human approval must use ai-studio-os/visual-system-human-approval@1.'));
  }
  if (!visualSystem || approval.visualSystemRef?.id !== visualSystem.id) {
    findings.push(finding('blocker', 'visual-system-approval-candidate-mismatch', 'Human approval must reference the exact Visual System candidate that was reviewed.', {
      approvalVisualSystemId: approval.visualSystemRef?.id ?? null,
      visualSystemId: visualSystem?.id ?? null
    }));
  }
  if (!selection || approval.selectedWorldRef?.id !== selection.selectedWorld?.id || selection.truth?.humanWorldSelectionConfirmed !== true) {
    findings.push(finding('blocker', 'visual-system-approval-world-mismatch', 'Human visual approval must remain bound to the human-selected Creative World.', {
      approvalWorldId: approval.selectedWorldRef?.id ?? null,
      selectedWorldId: selection?.selectedWorld?.id ?? null
    }));
  }
  if (approval.truth?.humanVisualApproval !== true || approval.truth?.visualSystemDirectionFrozen !== true) {
    findings.push(finding('blocker', 'visual-system-human-approval-missing', 'Human approval must explicitly freeze the Visual System direction.'));
  }
  if (approval.truth?.finalVisualSystemApproved !== false) {
    findings.push(finding('blocker', 'visual-system-final-approval-overclaimed', 'Visual-language approval cannot claim the final production Visual System is approved.'));
  }
  if (approval.truth?.motionHumanApproved !== false || approval.truth?.productionInteractionProofComplete !== false) {
    findings.push(finding('blocker', 'visual-system-production-refinement-overclaimed', 'Visual-language approval must keep motion and production interaction proof open until they are independently reviewed.'));
  }
  if (!approval.approvalEvent?.recordedAt || approval.approvalEvent?.decision !== 'approve-visual-language-for-production-refinement') {
    findings.push(finding('major', 'visual-system-approval-event-incomplete', 'Human visual approval requires a dated approval event and explicit production-refinement decision.'));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const approved = blockers.length === 0 && majors.length === 0;
  return {
    schema: 'ai-studio-os/visual-system-human-approval-resolution@1',
    projectId: approval.projectId ?? visualSystem?.projectId ?? null,
    visualSystemRef: approval.visualSystemRef ?? null,
    selectedWorldRef: approval.selectedWorldRef ?? null,
    status: approved ? 'human-visual-language-approved' : blockers.length ? 'blocked' : 'provisional',
    approved,
    findings,
    freezeBoundary: approval.freezeBoundary ?? null,
    productionRefinementRisks: approval.evidence?.productionRefinementRisks ?? [],
    truth: {
      humanVisualApproval: approved,
      visualSystemDirectionFrozen: approved,
      conceptualVisualSearchClosed: approved,
      motionHumanApproved: false,
      finalVisualSystemApproved: false
    }
  };
}
