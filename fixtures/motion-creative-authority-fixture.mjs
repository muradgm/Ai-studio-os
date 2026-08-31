import { authoredCandidateFromDeliberation, buildCreativeThesisDeliberation } from '../modules/creative-thesis/intelligence.mjs';
import { buildCreativeThesis } from '../modules/creative-thesis/runtime.mjs';
import { buildCreativeThesisHumanDecision } from '../modules/creative-thesis/authority.mjs';
import { buildCreativeWorldExploration, selectCreativeWorld } from '../modules/creative-world/runtime.mjs';
import { buildCreativeWorldHumanDecision } from '../modules/creative-world/authority.mjs';
import { buildStyleFrameProof, buildVisualProofEvidence } from '../modules/style-frame/runtime.mjs';
import { buildMotionCreativeExploration } from '../modules/motion-creative-intelligence/runtime.mjs';
import { buildMotionProofPlan, buildMotionProofEvidence } from '../modules/motion-creative-intelligence/proof.mjs';

export const MOTION_FIXTURE_PROJECT_ID = 'motion-creative-intelligence-proof-fixture';

function buildDeliberation(projectId) {
  return buildCreativeThesisDeliberation({
    projectId,
    businessTruths: ['Product truth organizes the experience', 'Meaningful decisions change visible working state'],
    opportunityGaps: ['Turn consequential state change into a legible experience language'],
    contradictions: ['calm × consequence', 'clarity × character'],
    hypotheses: [
      {
        id: 'earned-consequence',
        statement: 'Make earned consequence the organizing experience idea.',
        tension: 'calm × consequence',
        truthRefs: ['Meaningful decisions change visible working state'],
        opportunityRefs: ['Turn consequential state change into a legible experience language'],
        crossDomainConnections: ['decision systems × choreography'],
        experientialConsequences: ['Stillness dominates until meaningful state change earns motion.'],
        commercialConsequences: ['Users can see when an action materially changes the working state.'],
        antiGenericClaims: ['Reject ambient motion detached from product consequence.'],
        critique: ['Must avoid theatricalizing low-value state changes.']
      },
      {
        id: 'truth-sequence',
        statement: 'Let product truth arrive through controlled temporal sequencing.',
        tension: 'clarity × character',
        truthRefs: ['Product truth organizes the experience'],
        opportunityRefs: ['Turn consequential state change into a legible experience language'],
        crossDomainConnections: ['evidence × editorial timing'],
        experientialConsequences: ['Hierarchy appears in deliberate stages.'],
        commercialConsequences: ['Evidence remains readable while character emerges through pacing.'],
        antiGenericClaims: ['Reject decorative transitions without hierarchy change.'],
        critique: ['Could become overly editorial if interaction lacks directness.']
      },
      {
        id: 'material-response',
        statement: 'Use restrained physical response to make commitment perceptible.',
        tension: 'control × tactility',
        truthRefs: ['Meaningful decisions change visible working state'],
        opportunityRefs: ['Turn consequential state change into a legible experience language'],
        crossDomainConnections: ['interaction physics × decision consequence'],
        experientialConsequences: ['Direct actions expose resistance and settling only when consequence warrants it.'],
        commercialConsequences: ['Commitment feels legible without adding ornamental spectacle.'],
        antiGenericClaims: ['Reject universal spring motion.'],
        critique: ['Physical response can become toy-like if energy is too high.']
      }
    ],
    selection: {
      hypothesisId: 'earned-consequence',
      rationale: 'It most directly ties movement and stillness to real product consequence.',
      competitorTransferJudgment: 'A product without consequential state changes cannot reuse the idea unchanged.',
      strategicRelevanceJudgment: 'It keeps motion subordinate to product truth and user decisions.',
      experientialPotentialJudgment: 'It can govern hierarchy, transitions, interaction response, stillness and responsive behavior.'
    }
  });
}

function authoredWorlds() {
  return [
    {
      id: 'consequential-continuity',
      label: 'Consequential Continuity',
      worldIdea: 'A calm continuous field in which meaningful decisions reshape one persistent spatial system.',
      interpretationOfThesis: 'Stillness dominates until consequential state change earns a continuous spatial handoff.',
      signatureBehavior: 'One persistent anchor survives important transitions and changes role rather than being replaced.',
      worldClass: 'persistent-spatial-field',
      narrativeModel: 'continuity-through-consequence',
      compositionModel: 'anchored-asymmetrical-field',
      typographyIntent: { statement: 'Typography stays stable and precise while consequential state change carries movement.' },
      imageLanguage: 'restrained depth with one persistent focal layer',
      materialLanguage: 'matte surfaces with selective luminous state change',
      motionLanguage: 'continuous interpolation, measured inertia and deliberate settling',
      interactionModel: 'direct manipulation with visible continuity between pre- and post-action states',
      responsiveStrategy: 'preserve anchor and hierarchy while reducing travel and depth on smaller screens',
      categoryTransferTest: { whyProjectSpecific: 'The world depends on a decision-oriented intelligence product where authority changes the working state.' },
      antiPatterns: ['ambient motion with no state meaning', 'independent section animation that destroys continuity']
    },
    {
      id: 'editorial-consequence',
      label: 'Editorial Consequence',
      worldIdea: 'An editorial decision journal where hierarchy changes through decisive chapter boundaries.',
      interpretationOfThesis: 'Stillness holds each reading state; movement punctuates actual information hierarchy changes.',
      signatureBehavior: 'State changes arrive as chapter cuts with controlled masking and typographic re-ordering.',
      worldClass: 'editorial-decision-journal',
      narrativeModel: 'chaptered-argument',
      compositionModel: 'modular-column-field',
      typographyIntent: { statement: 'Typographic scale and sequence carry authority; motion sharpens chapter changes.' },
      imageLanguage: 'flat evidence crops and editorial proof panels',
      materialLanguage: 'paper-like fields, rules and clipped windows',
      motionLanguage: 'short decisive cuts, masks and ordered hierarchy reveals',
      interactionModel: 'explicit chapter changes and direct state swaps',
      responsiveStrategy: 'collapse columns into one reading order while preserving chapter boundaries',
      categoryTransferTest: { whyProjectSpecific: 'The world maps to review, evidence and decision-making rather than generic editorial branding.' },
      antiPatterns: ['soft cinematic drift between every section', 'decorative text splitting without hierarchy change']
    },
    {
      id: 'tactile-consequence',
      label: 'Tactile Consequence',
      worldIdea: 'A tactile decision surface where meaningful actions have perceptual resistance and recovery.',
      interpretationOfThesis: 'Stillness is the resting state; movement communicates resistance, commitment and recovery after direct action.',
      signatureBehavior: 'Primary actions compress, displace and settle with controlled physical character.',
      worldClass: 'tactile-decision-surface',
      narrativeModel: 'action-resistance-commit-settle',
      compositionModel: 'dense-centered-reactive-surface',
      typographyIntent: { statement: 'Typography remains structurally fixed while containers express pressure and release.' },
      imageLanguage: 'close tactile surfaces with constrained depth cues',
      materialLanguage: 'soft rigid panels with compressed edges and restrained highlights',
      motionLanguage: 'weighted response, damping, compression and short recovery arcs',
      interactionModel: 'press, drag and commit behavior with perceptual resistance',
      responsiveStrategy: 'replace wide displacement with compact compression and opacity change on touch devices',
      categoryTransferTest: { whyProjectSpecific: 'Physical behavior maps to commitment and approval actions in an intelligence workflow.' },
      antiPatterns: ['bouncy spring on every element', 'physics spectacle unrelated to interaction consequence']
    }
  ];
}

function proofMoments() {
  return [
    { id: 'opening', label: 'Opening', viewport: 'desktop', width: 1440, height: 900, purpose: 'Prove first-contact hierarchy.', productState: 'first contact' },
    { id: 'core', label: 'Core', viewport: 'desktop', width: 1440, height: 900, purpose: 'Prove primary behavior.', productState: 'primary interaction' },
    { id: 'decision', label: 'Decision', viewport: 'desktop', width: 1440, height: 900, purpose: 'Prove decision clarity.', productState: 'decision boundary' },
    { id: 'mobile', label: 'Mobile', viewport: 'mobile', width: 390, height: 844, purpose: 'Prove mobile reinterpretation.', productState: 'mobile primary interaction' }
  ];
}

export function buildCanonicalMotionAuthorityFixture(projectId = MOTION_FIXTURE_PROJECT_ID) {
  const deliberation = buildDeliberation(projectId);
  const authored = authoredCandidateFromDeliberation(deliberation);
  const builtThesis = buildCreativeThesis({
    projectId,
    intent: 'Build a distinctive motion-aware experience around product truth and consequential decisions.',
    businessTruths: deliberation.sourceTruths,
    inspiration: { opportunityGaps: deliberation.sourceOpportunities },
    antiPrinciples: ['ambient animation without meaning', 'technology as the creative concept'],
    audience: 'People reviewing evidence and making consequential product decisions',
    commercialObjective: 'Increase clarity and confidence without sacrificing character',
    authoredCandidate: authored
  });
  const thesis = { ...builtThesis, id: 'motion-thesis-1' };
  const humanDecision = buildCreativeThesisHumanDecision({ deliberation, thesis, decision: 'approve-recommendation', sourceCandidateId: deliberation.selection.hypothesisId, rationale: 'The human approves the reviewed Thesis recommendation.', humanConfirmed: true, decidedAt: '2026-08-31T10:55:36.158Z', evidenceRef: 'fixture://motion-thesis-decision' });

  const preSelectionExploration = buildCreativeWorldExploration({ creativeThesis: thesis, authoredWorlds: authoredWorlds() });
  if (!preSelectionExploration.reviewReady) throw new Error(`Canonical Motion fixture world exploration failed: ${preSelectionExploration.findings.map((item) => item.code).join(', ')}`);

  const styleFrameProof = buildStyleFrameProof({ exploration: preSelectionExploration, moments: proofMoments() });
  if (!styleFrameProof.reviewReady) throw new Error(`Canonical Motion fixture style-frame plan failed: ${styleFrameProof.findings.map((item) => item.code).join(', ')}`);
  const renderedFrames = styleFrameProof.frames.map((frame) => ({
    frameId: frame.id,
    worldId: frame.worldId,
    imageRef: `fixture://visual/${frame.id}.png`,
    sourceRef: `fixture://visual/${frame.id}.html`
  }));
  const visualProofEvidence = buildVisualProofEvidence({ plan: styleFrameProof, renderedFrames, comparisonRefs: ['fixture://visual/all-worlds-comparison'] });
  if (!visualProofEvidence.reviewReady) throw new Error(`Canonical Motion fixture visual evidence failed: ${visualProofEvidence.findings.map((item) => item.code).join(', ')}`);

  const selectedEvidenceRefs = visualProofEvidence.worlds.find((item) => item.worldId === 'consequential-continuity').evidenceRefs;
  const creativeWorldHumanDecision = buildCreativeWorldHumanDecision({ exploration: preSelectionExploration, visualProofEvidence, selectedWorldId: 'consequential-continuity', reviewedWorldEvidenceRefs: selectedEvidenceRefs, reviewedComparisonRefs: visualProofEvidence.comparisonRefs, rationale: 'The continuity world best expresses calm authority while making consequential state changes legible.', humanConfirmed: true, decidedAt: '2026-08-31T10:56:00Z', evidenceRef: 'fixture://motion-world-decision' });
  const creativeWorldExploration = selectCreativeWorld(preSelectionExploration, { humanDecision: creativeWorldHumanDecision, visualProofEvidence });
  const selectedCreativeWorld = creativeWorldExploration.selectedWorld;
  if (!selectedCreativeWorld) throw new Error(`Canonical Motion fixture world selection failed: ${creativeWorldExploration.findings.map((item) => item.code).join(', ')}`);

  const creativeDirection = {
    provisional: false,
    directionStatement: 'Use calm persistent structure and reserve expressive change for consequential state transitions.',
    thesisContext: { statement: thesis.statement },
    worldContext: { id: selectedCreativeWorld.id },
    findings: []
  };

  return {
    projectId,
    creativeThesisDeliberation: deliberation,
    creativeThesis: thesis,
    creativeThesisHumanDecision: humanDecision,
    creativeWorldHumanDecision,
    selectedCreativeWorld,
    creativeWorldExploration,
    styleFrameProof,
    visualProofEvidence,
    creativeDirection
  };
}

export function buildMotionHypotheses(worldId = 'consequential-continuity') {
  return [
    {
      id: 'continuity',
      title: 'Persistent Continuity',
      interpretation: 'Treat meaningful state changes as transformations of one persistent spatial relationship so the primary object remains continuously legible.',
      creativeWorldRefs: [`${worldId}:motionLanguage`, `${worldId}:signatureBehavior`],
      language: {
        motionThesis: 'Continuity is earned by consequence: one anchor persists while context reorganizes around it.',
        signatureMotionBehavior: 'A persistent focal object crosses important state boundaries with measured travel and depth interpolation.',
        temporalRhythm: 'Long still holds followed by one sustained consequential transition and a calm settle.',
        spatialBehavior: 'The focal object remains spatially legible while surrounding layers reposition around it.',
        transitionGrammar: 'Transform existing relationships before introducing new elements.',
        interactionCharacter: 'Deliberate low-latency response followed by visible inertia only when consequence is significant.',
        easingLanguage: 'Controlled ease-in-out with restrained settling and no decorative overshoot.',
        energyCurve: 'Quiet baseline, one sustained rise through consequence, then controlled decay.',
        depthModel: 'Depth is persistent and functional; foreground changes explain hierarchy rather than spectacle.',
        stillnessPolicy: 'Navigation, labels and secondary evidence remain still until the primary state actually changes.',
        reducedMotionInterpretation: 'Preserve continuity through opacity, hierarchy and immediate position change without simulated travel.'
      },
      motionMoments: ['Primary object earns movement when a state transition changes its role or authority.'],
      stillMoments: ['Reading and comparison states remain still while evidence is evaluated.'],
      hierarchyConsequences: ['Secondary context waits until the persistent focal object establishes the new state.'],
      responsiveConsequences: ['Mobile reduces travel distance and depth while preserving focal continuity.'],
      antiPatterns: ['No perpetual drift.', 'No unrelated parallax layers.'],
      critique: ['Continuity can become slow or self-important if minor changes inherit the same transition weight.'],
      technicalOptions: [], specialistIntent: {}
    },
    {
      id: 'editorial',
      title: 'Editorial Rhythm',
      interpretation: 'Treat movement as punctuation: still compositions hold until hierarchy changes, then decisive cuts, masks and ordered reveals establish a new chapter.',
      creativeWorldRefs: [`${worldId}:motionLanguage`, `${worldId}:narrativeModel`],
      language: {
        motionThesis: 'Movement behaves like editorial punctuation rather than continuous ambience.',
        signatureMotionBehavior: 'A chapter cut changes hierarchy through clipping, replacement and a short ordered reveal.',
        temporalRhythm: 'Long static reading beats are interrupted by brief decisive transitions.',
        spatialBehavior: 'Elements mostly hold position; hierarchy changes through masking, scale steps and replacement.',
        transitionGrammar: 'Cut, mask, reveal, hold.',
        interactionCharacter: 'Immediate and precise with minimal inertial tail.',
        easingLanguage: 'Fast asymmetric easing with crisp completion and no bounce.',
        energyCurve: 'Flat reading plateau, sharp pulse at chapter change, immediate return to stillness.',
        depthModel: 'Mostly planar; depth is reserved for evidence-priority changes.',
        stillnessPolicy: 'The interface remains motionless during reading, scanning and decision comparison.',
        reducedMotionInterpretation: 'Use instantaneous chapter replacement plus contrast and focus change; preserve reveal order without travel.'
      },
      motionMoments: ['Movement appears only when the information chapter or decision hierarchy changes.'],
      stillMoments: ['Ordinary reading and navigation states remain static.'],
      hierarchyConsequences: ['Primary information appears first; supporting detail follows after the chapter boundary is clear.'],
      responsiveConsequences: ['Mobile turns multi-column cuts into ordered vertical replacement with shorter timing.'],
      antiPatterns: ['No soft cinematic transition between every section.', 'No decorative text splitting.'],
      critique: ['Editorial cuts can feel cold or abrupt if overused for low-consequence interactions.'],
      technicalOptions: [], specialistIntent: {}
    },
    {
      id: 'tactile',
      title: 'Tactile Materiality',
      interpretation: 'Treat direct interaction as pressure on a material system so meaningful actions compress, resist, release and settle with perceptual weight.',
      creativeWorldRefs: [`${worldId}:motionLanguage`, `${worldId}:interactionModel`],
      language: {
        motionThesis: 'Physical response communicates commitment: consequential action should have controlled perceptual resistance.',
        signatureMotionBehavior: 'A focused surface compresses under input, displaces supporting layers and settles with controlled damping.',
        temporalRhythm: 'Short anticipation, immediate pressure response, brief release and finite settle.',
        spatialBehavior: 'Local deformation and depth shifts stay attached to the interacted surface.',
        transitionGrammar: 'Press, commit, release, settle.',
        interactionCharacter: 'Responsive and weighted, with stronger resistance reserved for higher-consequence actions.',
        easingLanguage: 'Critically damped spring character with tightly limited overshoot.',
        energyCurve: 'Fast input spike, constrained rebound, quick dissipation.',
        depthModel: 'Local layered depth communicates pressure while the global composition stays stable.',
        stillnessPolicy: 'Unengaged surfaces remain completely still; tactile response exists only around direct action or state commitment.',
        reducedMotionInterpretation: 'Replace compression and displacement with immediate contrast, border and opacity state change.'
      },
      motionMoments: ['Direct commitment actions earn tactile compression and settling.'],
      stillMoments: ['Unfocused surfaces and background composition remain fixed.'],
      hierarchyConsequences: ['Only the acted-on surface and immediate consequence move; background context stays stable.'],
      responsiveConsequences: ['Touch uses compact compression and shorter settle distances instead of pointer-scale displacement.'],
      antiPatterns: ['No bouncy response on passive content.', 'No whole-page physics simulation.'],
      critique: ['Tactile behavior can become toy-like if spring energy exceeds the seriousness of the action.'],
      technicalOptions: [], specialistIntent: {}
    }
  ];
}

export function buildMotionExplorationFixture({ selection = null, canonicalCreativeAuthority = null } = {}) {
  const canonical = canonicalCreativeAuthority ?? buildCanonicalMotionAuthorityFixture();
  const exploration = buildMotionCreativeExploration({
    projectId: canonical.projectId,
    canonicalCreativeAuthority: canonical,
    hypotheses: buildMotionHypotheses(canonical.selectedCreativeWorld.id),
    selection
  });
  return { canonical, exploration };
}

export function renderedMotionStudiesFromPlan(plan) {
  return plan.studies.map((study, index) => ({
    studyId: study.id,
    hypothesisId: study.hypothesisId,
    momentId: study.momentId,
    videoRef: `fixture://motion/${study.id}.webm`,
    captureRef: `fixture://motion/${study.id}.png`,
    sourceRef: `fixture://motion/${study.id}.html`,
    timelineRef: `fixture://motion/${study.id}.timeline.json`,
    sourceSha256: `${(index % 10)}`.repeat(64),
    timelineSha256: `${((index + 1) % 10)}`.repeat(64),
    viewport: study.viewport,
    input: study.input,
    durationMs: 900 + index,
    frameCount: 48 + index,
    browserRendered: true,
    exactSourceRendered: true
  }));
}

export function buildMotionProofFixture({ selection = null, canonicalCreativeAuthority = null } = {}) {
  const { canonical, exploration } = buildMotionExplorationFixture({ selection, canonicalCreativeAuthority });
  const plan = buildMotionProofPlan({ exploration });
  const renderedStudies = renderedMotionStudiesFromPlan(plan);
  const evidence = buildMotionProofEvidence({
    plan,
    renderedStudies,
    comparisonRefs: ['fixture://motion/comparison-board.html']
  });
  return { canonical, exploration, plan, renderedStudies, evidence };
}
