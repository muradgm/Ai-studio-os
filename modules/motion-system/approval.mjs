function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

export function resolveMotionSystemHumanApproval(approval = {}, {
  motionSystem = null,
  taxonomy = null,
  visualSystemApprovalResolution = null
} = {}) {
  const findings = [];

  if (approval.schema !== 'ai-studio-os/motion-system-human-approval@1') {
    findings.push(finding('blocker', 'motion-system-approval-schema-invalid', 'Motion System human approval must use ai-studio-os/motion-system-human-approval@1.'));
  }
  if (!motionSystem || approval.motionSystemRef?.id !== motionSystem.id) {
    findings.push(finding('blocker', 'motion-system-approval-candidate-mismatch', 'Human motion approval must reference the exact Motion System candidate that was reviewed.', {
      approvalMotionSystemId: approval.motionSystemRef?.id ?? null,
      motionSystemId: motionSystem?.id ?? null
    }));
  }
  if (taxonomy?.schema !== 'ai-studio-os/motion-event-taxonomy@1'
    || taxonomy?.motionSystemId !== motionSystem?.id
    || taxonomy?.truth?.motionRuntimeTaxonomyResolved !== true) {
    findings.push(finding('blocker', 'motion-system-approval-taxonomy-unresolved', 'Human motion approval must remain bound to the corrected operationalState + motionRole taxonomy.'));
  }
  if (visualSystemApprovalResolution?.approved !== true
    || visualSystemApprovalResolution?.truth?.humanVisualApproval !== true) {
    findings.push(finding('blocker', 'motion-system-approval-visual-language-unapproved', 'Motion language approval requires the underlying Visual System direction to be human-approved.'));
  }
  if (approval.truth?.humanMotionApproval !== true || approval.truth?.motionCreativeDirectionFrozen !== true) {
    findings.push(finding('blocker', 'motion-system-human-approval-missing', 'Human approval must explicitly approve and freeze the Motion System creative direction.'));
  }
  if (approval.truth?.motionRuntimeTaxonomyResolved !== true) {
    findings.push(finding('blocker', 'motion-system-human-approval-taxonomy-flag-missing', 'Human motion approval must preserve the resolved runtime taxonomy boundary.'));
  }
  if (approval.truth?.motionProductionReady !== false
    || approval.truth?.runtimeEventAdaptersImplemented !== false
    || approval.truth?.productionInteractionProofComplete !== false
    || approval.truth?.finalVisualSystemApproved !== false) {
    findings.push(finding('blocker', 'motion-system-production-readiness-overclaimed', 'Motion creative approval must not claim production readiness, runtime adapters, final interaction proof, or final Visual System approval.'));
  }
  if (!approval.approvalEvent?.recordedAt
    || approval.approvalEvent?.decision !== 'approve-motion-language-for-development') {
    findings.push(finding('major', 'motion-system-approval-event-incomplete', 'Human Motion System approval requires a dated approval event and explicit development decision.'));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const approved = blockers.length === 0 && majors.length === 0;

  return {
    schema: 'ai-studio-os/motion-system-human-approval-resolution@1',
    projectId: approval.projectId ?? motionSystem?.projectId ?? null,
    motionSystemRef: approval.motionSystemRef ?? null,
    eventTaxonomyRef: approval.eventTaxonomyRef ?? null,
    visualSystemApprovalRef: approval.visualSystemApprovalRef ?? null,
    status: approved ? 'human-motion-language-approved' : blockers.length ? 'blocked' : 'provisional',
    approved,
    findings,
    freezeBoundary: approval.freezeBoundary ?? null,
    productionGuidance: approval.productionGuidance ?? null,
    truth: {
      humanVisualApproval: visualSystemApprovalResolution?.truth?.humanVisualApproval === true,
      humanMotionApproval: approved,
      motionCreativeDirectionFrozen: approved,
      motionRuntimeTaxonomyResolved: approved,
      motionProductionReady: false,
      runtimeEventAdaptersImplemented: false,
      productionInteractionProofComplete: false,
      finalVisualSystemApproved: false
    }
  };
}
