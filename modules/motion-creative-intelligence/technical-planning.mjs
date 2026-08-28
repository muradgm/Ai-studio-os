import { reviewMotionDirectionAuthority } from './direction-authority.mjs';

function finding(severity, code, message, evidence = {}) { return { severity, code, message, evidence }; }

export function buildMotionTechnicalPlanningHandoff({ motionDirection } = {}) {
  const findings = [];
  const directionReview = reviewMotionDirectionAuthority(motionDirection ?? {});
  if (!directionReview.reviewReady) {
    findings.push(finding(
      'blocker',
      'motion-technical-planning-direction-invalid',
      'Motion technical planning requires a Motion Direction whose proof, Critic and human-selection authority can be recomputed.',
      { authorityFindingCodes: directionReview.findings.map((item) => item.code) }
    ));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const pass = blockers.length === 0;
  return {
    schema: 'ai-studio-os/motion-technical-planning-handoff@1',
    stage: 'motion-technical-planning-handoff',
    pass,
    reviewReady: pass,
    status: pass ? 'ready-for-motion-technical-strategy' : 'blocked',
    authority: pass ? directionReview.authority : null,
    creativeRequirements: pass ? {
      motionLanguage: motionDirection.language,
      motionMoments: motionDirection.motionMoments,
      stillMoments: motionDirection.stillMoments,
      hierarchyConsequences: motionDirection.hierarchyConsequences,
      responsiveConsequences: motionDirection.responsiveConsequences,
      antiPatterns: motionDirection.antiPatterns,
      specialistHandoffs: motionDirection.specialistHandoffs
    } : null,
    decisionPolicy: {
      creativeIntentFirst: true,
      chooseCheapestSufficientModel: true,
      technologyMustBeJustifiedByBehavior: true,
      spatialTechnologyRequiresSpatialSpecialistAuthority: true,
      accessibilityAndPerformanceCanConstrainImplementation: true,
      technicalFeasibilityCannotRewriteCreativeAuthority: true
    },
    findings,
    directionReview,
    truth: {
      provenMotionDirectionRequired: true,
      motionDirectionAuthorityRecomputed: true,
      technicalStrategyMayNowBegin: pass,
      implementationTechnologySelected: false,
      gsapSelected: false,
      webAnimationsSelected: false,
      riveSelected: false,
      threeJsSelected: false,
      webglSelected: false,
      webgpuSelected: false,
      blenderPipelineSelected: false,
      physicsEngineSelected: false,
      shaderImplementationSelected: false,
      productionApproved: false
    }
  };
}
