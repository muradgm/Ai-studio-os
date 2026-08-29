import { buildCreativeIntelligenceFoundation } from '../modules/creative-intelligence-foundation/runtime.mjs';
import { buildCreativeKnowledgeGraph } from '../modules/creative-knowledge-graph/runtime.mjs';
import { buildCreativeKnowledgeRetrieval } from '../modules/creative-knowledge-graph/retrieval.mjs';
import { buildCreativeKnowledgeRetrievalWithProvenance } from '../modules/creative-knowledge-graph/provenance.mjs';
import { buildCreativeTransferBrief, buildCreativeTransferHypothesis } from '../modules/creative-transfer-intelligence/runtime.mjs';
import { buildCreativeTransferCandidate } from '../modules/creative-transfer-intelligence/candidate.mjs';
import { buildCreativeSynthesisBrief, buildCreativeSynthesisSet } from '../modules/creative-synthesis-intelligence/runtime.mjs';
import { buildCreativeSynthesisCandidateSet } from '../modules/creative-synthesis-intelligence/candidate.mjs';
import { buildMotionIntelligenceV2Brief, reviewMotionIntelligenceV2Brief } from '../modules/motion-intelligence-v2/runtime.mjs';
import { MOTION_INTELLIGENCE_V2_KNOWLEDGE } from '../modules/motion-intelligence-v2/knowledge.mjs';
import { DOGFOOD_CORE_MOTION_KNOWLEDGE_IDS } from '../modules/creative-motion-capability-dogfood/execution.mjs';

const AS_OF = '2026-08-29T18:00:00Z';

function requireReady(label, artifact) {
  if (artifact?.reviewReady !== true) {
    const codes = (artifact?.findings ?? []).map((item) => item.code).join(', ');
    throw new Error(`${label} fixture failed${codes ? `: ${codes}` : ''}`);
  }
  return artifact;
}

function sorted(values = []) {
  return [...values].sort();
}

function sameIds(left = [], right = []) {
  return JSON.stringify(sorted(left)) === JSON.stringify(sorted(right));
}

function buildMotionKnowledge(projectId, knowledgeIds) {
  const expectedIds = sorted(knowledgeIds);
  const entries = MOTION_INTELLIGENCE_V2_KNOWLEDGE.filter((item) => expectedIds.includes(item.id));
  if (!sameIds(entries.map((item) => item.id), expectedIds)) throw new Error('Dogfood Motion knowledge fixture IDs drifted.');

  const foundation = requireReady('Motion Foundation', buildCreativeIntelligenceFoundation({ entries }));
  const graph = requireReady('Motion Knowledge Graph', buildCreativeKnowledgeGraph({ foundation }));
  const retrieval = requireReady('Motion Knowledge retrieval', buildCreativeKnowledgeRetrievalWithProvenance({
    graph,
    foundation,
    projectId,
    asOf: AS_OF,
    purpose: 'Provide the exact verified Motion knowledge profile for Benchmark 011 condition authoring.',
    domains: ['motion'],
    limit: 50
  }));
  if (retrieval.provenanceReady !== true || !sameIds(retrieval.results.map((item) => item.knowledgeId), expectedIds)) {
    throw new Error('Dogfood Motion knowledge retrieval did not preserve the exact requested profile.');
  }
  return { foundation, graph, retrieval };
}

const TRANSFER_SOURCES = Object.freeze([
  {
    id: 'dogfood-transfer-editorial',
    domain: 'editorial-composition',
    term: 'hierarchy',
    principle: 'concentrate perceptual priority before releasing secondary detail',
    surface: 'oversized editorial headline treatment',
    strip: 'oversized editorial headline treatment',
    rule: 'rebuild hierarchy through target-domain variables instead of source styling',
    risk: 'copying editorial surface styling',
    transferClaim: 'Concentrate one primary state before secondary choices enter.',
    causalBridge: 'Unequal source emphasis becomes unequal product-state emphasis so one consequential change is understood before optional detail competes.',
    targetConsequence: 'The consequential state should register before supporting options compete for attention.',
    adaptationAction: 'Reserve the strongest temporal and spatial emphasis for the consequential state.'
  },
  {
    id: 'dogfood-transfer-architecture',
    domain: 'architecture',
    term: 'threshold',
    principle: 'make a state boundary perceptible before entry into a different condition',
    surface: 'monumental portal composition',
    strip: 'monumental portal composition',
    rule: 'translate threshold logic into product-state transition logic',
    risk: 'copying architectural monumentality',
    transferClaim: 'Make consequential state changes feel like deliberate boundary crossings rather than arbitrary swaps.',
    causalBridge: 'A spatial threshold makes a condition change legible; the product analogue is a staged state boundary that clarifies departure and arrival.',
    targetConsequence: 'Users should recognize when an action moves the system into a materially different state.',
    adaptationAction: 'Give meaningful state change a clear before-boundary-after sequence without literal architectural imagery.'
  },
  {
    id: 'dogfood-transfer-rhythm',
    domain: 'music',
    term: 'rhythm',
    principle: 'alternate tension and release so progression remains perceptible over time',
    surface: 'recognizable musical phrase',
    strip: 'recognizable musical phrase',
    rule: 'translate rhythmic logic into non-musical temporal behavior',
    risk: 'turning product motion into literal musical visualization',
    transferClaim: 'Alternate held moments and release moments so multi-step progression has perceptible cadence.',
    causalBridge: 'Temporal expectation can clarify sequence when restraint and release correspond to meaningful product progression rather than decorative tempo.',
    targetConsequence: 'Multi-step flows should feel paced and legible instead of uniformly mechanical.',
    adaptationAction: 'Use brief holds before meaningful reveals and quieter timing between them.'
  }
]);

function transferKnowledgeEntry(config) {
  return {
    id: config.id,
    kind: 'principle',
    domain: config.domain,
    title: `${config.term} transfer source`,
    definition: `${config.term} can organize attention or progression when its causal role is explicit rather than decorative.`,
    causalRationale: `${config.term} changes how priority, transition or sequence is perceived by altering competition between simultaneous or successive cues.`,
    perceptualEffects: [`clear ${config.term} relationship`, 'directed attention'],
    worksWhen: ['one relationship must become legible before optional detail'],
    failsWhen: ['all elements require equal simultaneous weight'],
    creativeVariables: ['contrast', 'sequence', 'density'],
    crossDomainApplications: ['product experience', 'interaction systems'],
    failureModes: [`decorative ${config.term} without causal purpose`],
    counterexamples: ['a neutral comparison surface where parity is the primary task'],
    diagnostics: [`remove decorative styling and verify the ${config.term} relationship still changes comprehension`],
    relationships: [],
    provenance: {
      sourceId: `source-${config.id}`,
      sourceType: 'curated-principle',
      sourceRef: `internal://${config.id}`,
      capturedAt: AS_OF
    },
    confidence: 0.9,
    confidenceBasis: 'Qualified causal principle with explicit boundary conditions.',
    scope: 'general',
    transferability: 'Transfer the causal principle only and rebuild expression for the target project.',
    transfer: {
      transferablePrinciples: [config.principle],
      surfaceSignature: [config.surface],
      mustStrip: [config.strip],
      adaptationRules: [config.rule],
      copyRisks: [config.risk]
    }
  };
}

function buildTransferSource(projectId, config) {
  const foundation = requireReady('Transfer Foundation', buildCreativeIntelligenceFoundation({ entries: [transferKnowledgeEntry(config)] }));
  const graph = requireReady('Transfer Graph', buildCreativeKnowledgeGraph({ foundation }));
  const retrieval = requireReady('Transfer retrieval', buildCreativeKnowledgeRetrieval({
    graph,
    projectId,
    asOf: AS_OF,
    purpose: 'Retrieve one verified cross-domain source for Benchmark 011 Synthesis fixture construction.',
    terms: [config.term]
  }));
  if (!sameIds(retrieval.results.map((item) => item.knowledgeId), [config.id])) throw new Error('Transfer fixture retrieval drifted.');

  const brief = requireReady('Transfer Brief', buildCreativeTransferBrief({
    retrieval,
    graph,
    foundation,
    target: {
      domain: 'product-experience',
      problem: 'Make consequential state changes clear and authored without decorative theatre.',
      desiredEffect: 'A deliberate experience that communicates priority and progression.'
    },
    projectTruths: [{ id: 'transfer-truth', statement: 'Consequential state changes must remain understandable.' }],
    constraints: ['Do not reproduce recognizable source styling.']
  }));
  if (brief.provenanceReady !== true) throw new Error('Transfer Brief provenance fixture failed.');

  const hypothesis = requireReady('Transfer hypothesis', buildCreativeTransferHypothesis({
    brief,
    retrieval,
    graph,
    foundation,
    sourceKnowledgeIds: [config.id],
    projectTruthRefs: ['transfer-truth'],
    counterevidenceKnowledgeIds: [],
    hiddenCounterevidenceAcknowledged: false,
    transferClaim: config.transferClaim,
    causalBridge: config.causalBridge,
    targetConsequence: config.targetConsequence,
    adaptationActions: [config.adaptationAction],
    strippedSurfaceSignatures: [config.strip],
    adaptationRuleResponses: [{
      rule: config.rule,
      action: `Apply the causal ${config.term} relationship through product timing, state and hierarchy rather than source appearance.`
    }],
    copyRiskMitigations: [{
      risk: config.risk,
      mitigation: `Reject recognizable ${config.domain} surface styling and preserve only the causal relationship.`
    }],
    uncertainty: `The ${config.term} transfer may become over-emphasized if applied to routine interaction.`,
    falsifier: `Reject the ${config.term} transfer if it reduces comprehension or becomes recognizable source imitation.`
  }));
  if (hypothesis.provenanceReady !== true) throw new Error('Transfer hypothesis provenance fixture failed.');

  const candidateArtifact = requireReady('Transfer candidate', buildCreativeTransferCandidate({ hypothesis, brief, retrieval, graph, foundation }));
  return { id: config.id, candidateArtifact, hypothesis, brief, retrieval, graph, foundation };
}

function synthesisHypotheses() {
  return [
    {
      id: 'dogfood-synthesis-boundary-priority',
      strategy: 'reinforcement',
      sourceCandidateIds: ['dogfood-transfer-architecture', 'dogfood-transfer-editorial'],
      sourceContributions: [
        { sourceCandidateId: 'dogfood-transfer-architecture', contribution: 'Defines when a consequential state crossing needs a perceptible boundary.' },
        { sourceCandidateId: 'dogfood-transfer-editorial', contribution: 'Defines which state should dominate immediately after that boundary.' }
      ],
      projectTruthRefs: ['synthesis-truth-consequence', 'synthesis-truth-restraint'],
      contradictionRefs: ['synthesis-contradiction-speed-character'],
      governingIdea: 'A consequential choice crosses one restrained boundary and lands in an unmistakable primary state.',
      productiveTension: 'Immediate comprehension × authored transition.',
      combinationMechanism: 'Boundary logic controls when change is staged while asymmetric priority controls where attention lands.',
      experientialConsequences: ['Meaningful changes feel deliberate without forcing ceremony onto routine navigation.'],
      antiGenericClaims: ['Reject equal-weight reveal of every new state and indiscriminate animated transitions.'],
      ownabilityRisk: 'The behavior becomes generic if consequence no longer determines which boundaries receive emphasis.',
      competitorTransferTest: {
        question: 'Would this behavior remain equally convincing after removing the project rule that consequence governs temporal emphasis?',
        failureCondition: 'Reject it if the same treatment can be applied unchanged to every ordinary interface transition.'
      },
      failureModes: ['Routine changes become over-staged.', 'The landing hierarchy is weaker than the boundary itself.'],
      uncertainty: 'Frequent expert workflows may require a compressed version of the boundary.',
      falsifier: 'Reject if users understand the new state faster with an immediate stable replacement.',
      critique: ['The transition must never become more memorable than the decision it clarifies.']
    },
    {
      id: 'dogfood-synthesis-held-crossing',
      strategy: 'productive-contradiction',
      sourceCandidateIds: ['dogfood-transfer-architecture', 'dogfood-transfer-rhythm'],
      sourceContributions: [
        { sourceCandidateId: 'dogfood-transfer-architecture', contribution: 'Keeps temporal pacing tied to a real state boundary.' },
        { sourceCandidateId: 'dogfood-transfer-rhythm', contribution: 'Introduces selective hold and release around that boundary without continuous motion.' }
      ],
      projectTruthRefs: ['synthesis-truth-consequence', 'synthesis-truth-restraint'],
      contradictionRefs: ['synthesis-contradiction-speed-character', 'synthesis-contradiction-authorship-copy'],
      governingIdea: 'Important transitions alternate a brief contained beat with decisive release while ordinary states remain quiet.',
      productiveTension: 'Restraint × momentum.',
      combinationMechanism: 'State boundaries determine the event while temporal cadence determines how attention prepares and resolves.',
      experientialConsequences: ['Complex progression gains rhythm while stable reading time remains dominant.'],
      antiGenericClaims: ['Reject perpetual ambient movement and identical timing across all state changes.'],
      ownabilityRisk: 'The cadence becomes mannerism if holds are detached from actual consequence.',
      competitorTransferTest: {
        question: 'Does the cadence still make sense when the product has no meaningful state boundary?',
        failureCondition: 'Reject it if temporal styling survives unchanged after removing consequence from the flow.'
      },
      failureModes: ['A hold becomes decorative latency.', 'Release timing competes with comprehension.'],
      uncertainty: 'High-frequency actions may need near-zero anticipation.',
      falsifier: 'Reject if repeated use makes the authored cadence feel slower than a stable state change.',
      critique: ['Temporal character must be earned by sequence, not added as atmosphere.']
    },
    {
      id: 'dogfood-synthesis-quiet-counterpoint',
      strategy: 'counterpoint',
      sourceCandidateIds: ['dogfood-transfer-editorial', 'dogfood-transfer-rhythm'],
      sourceContributions: [
        { sourceCandidateId: 'dogfood-transfer-editorial', contribution: 'Maintains one dominant information channel during change.' },
        { sourceCandidateId: 'dogfood-transfer-rhythm', contribution: 'Lets optional depth arrive later as a quieter temporal counterpoint.' }
      ],
      projectTruthRefs: ['synthesis-truth-consequence', 'synthesis-truth-restraint'],
      contradictionRefs: ['synthesis-contradiction-authorship-copy'],
      governingIdea: 'One dominant state settles first; optional depth follows in a quieter second beat only when it helps inspection.',
      productiveTension: 'Dominance × quiet discovery.',
      combinationMechanism: 'Persistent priority establishes the first read while restrained sequencing delays secondary information until it cannot compete.',
      experientialConsequences: ['The experience feels layered without sacrificing the clarity of the consequential state.'],
      antiGenericClaims: ['Reject dashboards where every module moves with equal salience.'],
      ownabilityRisk: 'The pattern becomes a generic staggered reveal if the dominant state is not project-specific.',
      competitorTransferTest: {
        question: 'Could the same primary-secondary cadence be copied unchanged into a product with different consequence rules?',
        failureCondition: 'Reject it if the temporal hierarchy remains persuasive without the project-specific decision structure.'
      },
      failureModes: ['Secondary motion steals the first fixation.', 'Delayed detail harms tasks requiring simultaneous comparison.'],
      uncertainty: 'Some evidence surfaces may require immediate parity instead of sequential depth.',
      falsifier: 'Reject on surfaces where delayed optional information reduces comparison accuracy.',
      critique: ['Counterpoint must not become a universal stagger recipe.']
    }
  ];
}

function buildVerifiedSynthesis(projectId) {
  const sources = TRANSFER_SOURCES.map((config) => buildTransferSource(projectId, config));
  const brief = requireReady('Synthesis Brief', buildCreativeSynthesisBrief({
    projectId,
    target: {
      domain: 'product-experience',
      problem: 'Turn consequential state changes into an authored but restrained interaction language.',
      desiredEffect: 'Clear progression with project-specific temporal character.'
    },
    projectTruths: [
      { id: 'synthesis-truth-consequence', statement: 'Consequential changes deserve stronger temporal emphasis than routine navigation.' },
      { id: 'synthesis-truth-restraint', statement: 'Reading and comparison states should remain calm and inspectable.' }
    ],
    contradictions: [
      { id: 'synthesis-contradiction-speed-character', statement: 'The experience needs immediate clarity without becoming mechanically flat.' },
      { id: 'synthesis-contradiction-authorship-copy', statement: 'The motion language should feel authored without importing recognizable source styling.' }
    ],
    constraints: ['No literal source styling.', 'No authority or human approval may be inferred from Synthesis.'],
    sources
  }));
  if (brief.provenanceReady !== true) throw new Error('Synthesis Brief provenance fixture failed.');

  const synthesis = requireReady('Synthesis set', buildCreativeSynthesisSet({ brief, sources, hypotheses: synthesisHypotheses() }));
  if (synthesis.provenanceReady !== true) throw new Error('Synthesis set provenance fixture failed.');
  const candidateArtifact = requireReady('Synthesis candidate egress', buildCreativeSynthesisCandidateSet({ synthesis, brief, sources }));
  return { candidateArtifact, synthesis, brief, sources };
}

function buildV2Context({ projectId, canonicalCreativeAuthority, knowledge, synthesis = null }) {
  const authorityInputs = { canonicalCreativeAuthority, knowledge, synthesis };
  const v2Brief = requireReady('Motion V2 Brief', buildMotionIntelligenceV2Brief({
    projectId,
    canonicalCreativeAuthority,
    knowledge,
    synthesis,
    projectTruths: [
      { id: 'dogfood-truth-material', statement: 'Material memory and consequence should remain legible through time rather than decorative motion.' },
      { id: 'dogfood-truth-stillness', statement: 'Stillness should dominate while reading, comparison and inspection are primary.' }
    ],
    constraints: [
      'Motion must remain subordinate to the selected Creative World.',
      'Mobile and reduced-motion modes must preserve semantic hierarchy.',
      'Implementation technology cannot become the creative concept.'
    ]
  }));
  const fresh = reviewMotionIntelligenceV2Brief(v2Brief, authorityInputs);
  if (!fresh.reviewReady) throw new Error(`Motion V2 Brief fresh review failed: ${fresh.findings.map((item) => item.code).join(', ')}`);
  return { v2Brief, authorityInputs };
}

export function buildMotionDogfoodV2AuthoringContexts({ projectId, canonicalCreativeAuthority } = {}) {
  if (!projectId || !canonicalCreativeAuthority) throw new Error('Dogfood V2 authoring fixture requires project and canonical Creative World authority.');
  const coreKnowledge = buildMotionKnowledge(projectId, DOGFOOD_CORE_MOTION_KNOWLEDGE_IDS);
  const fullIds = MOTION_INTELLIGENCE_V2_KNOWLEDGE.map((item) => item.id);
  const fullKnowledge = buildMotionKnowledge(projectId, fullIds);
  const verifiedSynthesis = buildVerifiedSynthesis(projectId);

  return {
    B: buildV2Context({ projectId, canonicalCreativeAuthority, knowledge: coreKnowledge }),
    C: buildV2Context({ projectId, canonicalCreativeAuthority, knowledge: fullKnowledge }),
    D: buildV2Context({ projectId, canonicalCreativeAuthority, knowledge: fullKnowledge, synthesis: verifiedSynthesis }),
    synthesisCandidateIds: verifiedSynthesis.candidateArtifact.candidates.map((item) => item.id)
  };
}

function contributions(ids, label) {
  return ids.map((sourceId) => ({ sourceId, contribution: `${label} uses ${sourceId} as a verified causal constraint on project-specific temporal behavior.` }));
}

function synthesisUse(brief, index, label) {
  const candidates = Array.isArray(brief?.synthesisCandidates) ? brief.synthesisCandidates : [];
  if (!candidates.length) return { synthesisCandidateRefs: [], synthesisContributions: [] };
  const candidate = candidates[index % candidates.length];
  return {
    synthesisCandidateRefs: [candidate.id],
    synthesisContributions: [{ sourceId: candidate.id, contribution: `${label} adapts this verified Synthesis candidate into Motion reasoning without treating it as direction or authority.` }]
  };
}

const MOTION_VARIANTS = Object.freeze([
  {
    id: 'dogfood-v2-continuity',
    title: 'Persistent Material Continuity',
    strategy: 'continuity',
    worldPaths: ['motionLanguage', 'signatureBehavior'],
    semanticIntent: 'Preserve one consequential material identity across state change so continuity explains what became what.',
    signatureBehavior: 'A persistent anchor crosses one meaningful boundary while supporting context waits, then settles into a stable inspectable state.',
    rhythm: 'Long still reading intervals surround one sustained consequential handoff.',
    spatial: 'Preserve one anchor while nearby context reorganizes around it.',
    interaction: 'Acknowledge input immediately, then expose the causal handoff.',
    editing: 'Use one continuous consequential beat followed by a stable hold.',
    continuity: 'Reserve continuity for genuinely preserved identity.',
    material: 'Restrained material response confirms the state crossing.',
    reduced: 'Use immediate anchored re-layout, focus and contrast change while preserving the same before-boundary-after meaning.'
  },
  {
    id: 'dogfood-v2-punctuation',
    title: 'Decisive Temporal Punctuation',
    strategy: 'punctuation',
    worldPaths: ['narrativeModel', 'typographyIntent.statement'],
    semanticIntent: 'Treat motion as brief punctuation between stable reading states so hierarchy changes are unmistakable without continuous animation.',
    signatureBehavior: 'A short chapter boundary establishes the new primary statement first and then releases supporting detail into complete stillness.',
    rhythm: 'Long static plateaus are separated by short asymmetric hierarchy-changing pulses.',
    spatial: 'Most elements hold position while priority changes through concise replacement behavior.',
    interaction: 'The requested chapter changes immediately with no post-action lockout.',
    editing: 'Cut, establish the new primary state, release support, then hold.',
    continuity: 'Use cuts for categorical hierarchy changes and continuity only when identity truly persists.',
    material: 'Surface treatment stays quiet while hierarchy carries the change.',
    reduced: 'Use immediate content replacement, focus and contrast hierarchy while preserving primary-before-support order.'
  },
  {
    id: 'dogfood-v2-material',
    title: 'Controlled Material Response',
    strategy: 'material-response',
    worldPaths: ['interactionModel', 'materialLanguage'],
    semanticIntent: 'Give direct consequential action restrained resistance and recovery while surrounding information remains structurally quiet.',
    signatureBehavior: 'The acted-on surface compresses locally, commits with a short displacement, and returns to a highly damped stable state.',
    rhythm: 'Short local responses appear inside long stable inspection intervals.',
    spatial: 'Keep response local to the acted-on surface and preserve surrounding anchors.',
    interaction: 'Pressure maps directly to the consequential action and resolves quickly.',
    editing: 'Contact, commit and settle without unrelated temporal decoration.',
    continuity: 'Preserve continuity only for the acted-on surface whose state actually changes.',
    material: 'Local compression and recovery carry the physical character.',
    reduced: 'Replace compression and travel with immediate contrast, state and focus changes that preserve agency and commitment.'
  }
]);

function buildVariantHypothesis({ variant, knowledgeRefs, synthesis, worldId, truthRefs }) {
  const label = variant.title;
  return {
    id: variant.id,
    title: variant.title,
    temporalStrategy: variant.strategy,
    projectTruthRefs: variant.strategy === 'material-response' ? truthRefs.slice(0, 2) : [truthRefs[variant.strategy === 'punctuation' ? 1 : 0]],
    creativeWorldRefs: variant.worldPaths.map((path) => `${worldId}:${path}`),
    knowledgeRefs,
    knowledgeContributions: contributions(knowledgeRefs, label),
    ...synthesis,
    semanticIntent: variant.semanticIntent,
    signatureBehavior: variant.signatureBehavior,
    motionNecessity: {
      moves: true,
      rationale: `${label} permits movement only when temporal change clarifies a consequential state, hierarchy or agency relationship.`,
      earnedBy: [`${label} is used when a consequential state change would be harder to understand as an unexplained instant replacement.`, `${label} must expose a real causal or hierarchy change.`],
      stillnessCases: ['Evidence reading remains still.', 'Routine navigation and unaffected content remain still.'],
      stillnessRationale: `Stable inspection gives ${label.toLowerCase()} enough contrast to remain meaningful rather than ambient.`
    },
    attentionSequence: [
      { id: `${variant.id}-before`, focus: 'Current meaningful state', reason: `Establish the state before ${label.toLowerCase()} begins.`, next: `${variant.id}-change` },
      { id: `${variant.id}-change`, focus: 'Consequential change', reason: 'Make the causal or hierarchy boundary explicit.', next: `${variant.id}-after` },
      { id: `${variant.id}-after`, focus: 'Stable resulting state', reason: 'Return attention to an inspectable outcome.', next: null }
    ],
    temporalComposition: {
      rhythm: variant.rhythm,
      pacing: `${label} completes decisively enough to preserve responsiveness and then returns to rest.`,
      anticipation: 'Use only the minimum anticipation required to acknowledge the consequential action.',
      holds: 'Hold stable states for reading; do not add decorative pauses.',
      overlap: 'Secondary change begins only after the primary relationship is perceptually established.',
      stillness: 'The terminal state and unrelated content remain fully still.',
      easingLanguage: variant.strategy === 'material-response' ? 'Firm resistance followed by strongly damped recovery.' : variant.strategy === 'punctuation' ? 'Fast asymmetric completion with crisp stops.' : 'Controlled acceleration and deceleration with restrained settling.',
      energyCurve: variant.strategy === 'material-response' ? 'Sharp local input, constrained release, rapid dissipation.' : variant.strategy === 'punctuation' ? 'Flat plateau, short pulse, immediate return to flat.' : 'Quiet baseline, one sustained rise, then controlled decay.'
    },
    motionHierarchy: `${label} gives the consequential primary relationship the strongest temporal emphasis while supporting information remains later, quieter or static.`,
    physicalCharacter: {
      mass: variant.strategy === 'punctuation' ? 'Light and editorial.' : 'Moderate and stable.',
      inertia: variant.strategy === 'material-response' ? 'Immediate response with limited carried momentum.' : 'Low enough for direct response with measured continuation.',
      friction: variant.strategy === 'material-response' ? 'Perceptible resistance at the commitment threshold.' : 'Restrained resistance that never reads as delay.',
      elasticity: variant.strategy === 'material-response' ? 'Low elasticity with tightly constrained recovery.' : 'Near rigid with no playful rebound.',
      damping: 'High damping with a finite settle.',
      rationale: `${label} should communicate consequence and control rather than entertainment.`
    },
    choreography: {
      spatial: variant.spatial,
      interaction: variant.interaction,
      scroll: 'Ordinary reading scroll remains independent of the authored state-change behavior.',
      depthModel: variant.strategy === 'punctuation' ? 'Primarily planar because depth is unnecessary to the chapter model.' : 'Use shallow functional depth only when it clarifies hierarchy.'
    },
    cinematicLanguage: {
      camera: 'Keep the camera fixed.',
      framing: 'Keep the consequential relationship inside a stable compositional region.',
      reveal: 'Reveal supporting information only after the primary state is understood.',
      continuity: variant.continuity,
      editing: variant.editing
    },
    mediaMotion: {
      typography: variant.strategy === 'punctuation' ? 'Typography may change hierarchy briefly while body reading remains stable.' : 'Typography remains structurally stable unless its semantic hierarchy changes.',
      image: 'Evidence imagery remains anchored unless its role changes with the consequential state.',
      material: variant.material,
      procedural: 'No autonomous procedural motion is required.'
    },
    responsivePlan: {
      desktop: `${label} may use moderate spatial range while preserving the primary anchor.`,
      mobile: `${label} reduces travel and depth while preserving the same semantic ordering.`,
      touch: 'Acknowledge touch immediately and avoid behavior that competes with vertical scrolling.'
    },
    reducedMotionEquivalent: variant.reduced,
    accessibilityConstraints: ['Avoid unnecessary large-field movement.', 'Make the terminal state understandable without remembering the transition.'],
    performanceReasoning: {
      complexityClass: variant.strategy === 'continuity' ? 'medium' : 'low',
      costDrivers: variant.strategy === 'continuity' ? ['persistent-object transform', 'coordinated supporting re-layout'] : ['short local transform', 'brief hierarchy transition'],
      justification: `${label} earns its cost only when it materially clarifies the selected temporal relationship.`,
      fallback: 'Use immediate stable re-layout plus focus and contrast hierarchy.'
    },
    antiPatterns: ['No perpetual ambient motion.', `No decorative ${variant.strategy} behavior on routine state changes.`],
    failureModes: [`${label} becomes mannerism when consequence no longer gates it.`, 'Secondary motion competes with the primary state change.'],
    uncertainty: `${label} may need a shorter or flatter expression for frequent expert workflows.`,
    falsifier: `Reject ${label} if a stable immediate state communicates the same consequential relationship faster and more accurately.`,
    critique: [`${label} must remain subordinate to product meaning and inspection.`]
  };
}

export function buildMotionDogfoodV2Hypotheses({ brief, selectedCreativeWorld } = {}) {
  const ids = Array.isArray(brief?.knowledgeBinding?.knowledgeIds) ? brief.knowledgeBinding.knowledgeIds : [];
  if (ids.length < 8) throw new Error('Dogfood V2 hypothesis fixture requires at least eight verified Motion knowledge IDs.');
  const worldId = selectedCreativeWorld?.id ?? brief?.creativeWorldId;
  const refs = [[ids[0], ids[1], ids[2]], [ids[3], ids[4], ids[5]], [ids[0], ids[6], ids[7]]];
  const truthRefs = (brief?.projectTruths ?? []).map((item) => item.id);
  return MOTION_VARIANTS.map((variant, index) => buildVariantHypothesis({
    variant,
    knowledgeRefs: refs[index],
    synthesis: synthesisUse(brief, index, variant.title),
    worldId,
    truthRefs
  }));
}
