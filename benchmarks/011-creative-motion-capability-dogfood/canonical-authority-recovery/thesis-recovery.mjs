import { fingerprintCreativeValue } from '../../../modules/creative-intelligence-foundation/fingerprint.mjs';
import { reviewCreativeThesisAuthority } from '../../../modules/creative-thesis/authority.mjs';
import { authoredCandidateFromDeliberation, buildCreativeThesisDeliberation } from '../../../modules/creative-thesis/intelligence.mjs';
import { buildCreativeThesis } from '../../../modules/creative-thesis/runtime.mjs';

const RECOVERY_SCHEMA = 'ai-studio-os/benchmark-011-after-matter-thesis-recovery@1';

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function historicalGrounding(brief) {
  return {
    frozenBriefFingerprint: fingerprintCreativeValue(brief),
    historicalPhase0Refs: [
      'benchmarks/011-creative-motion-capability-dogfood/runs/after-matter-phase0/dogfood-brief.json',
      'benchmarks/011-creative-motion-capability-dogfood/runs/after-matter-phase0/selection.json',
      'benchmarks/011-creative-motion-capability-dogfood/runs/after-matter-phase0/after-matter-desktop.png',
      'benchmarks/011-creative-motion-capability-dogfood/runs/after-matter-phase0/after-matter-mobile.png',
      'benchmarks/011-creative-motion-capability-dogfood/runs/after-matter-phase0/index.html'
    ],
    historicalSelectedWorld: {
      id: 'friction-index',
      fingerprint: text(brief.canonicalCreativeWorldFingerprint)
    },
    historicalFactsOnly: true,
    recoveryAuthorshipIsNew: true
  };
}

function hypotheses(brief) {
  const truths = brief.projectTruths;
  return [
    {
      id: 'trace-as-evidence-system',
      statement: 'Let each object\'s accumulated change become evidence that guides movement: a visitor enters history through one visible trace, then returns to the object with its use made legible.',
      tension: 'archival authority x tactile sensuality',
      truthRefs: [truths[0], truths[1], truths[2]],
      opportunityRefs: ['material-evidence-without-spectacle'],
      crossDomainConnections: ['object conservation x navigable evidence index'],
      experientialConsequences: ['Object encounters begin with one factual trace rather than an atmospheric transition.', 'Reading holds after a trace has established its historical consequence.'],
      commercialConsequences: ['Ticketing and visit details remain visibly available because evidence-led exploration cannot become a navigation maze.'],
      antiGenericClaims: ['Reject generic distressed styling that is not tied to an actual object history.', 'Reject cinematic movement that carries visitors past the objects.'],
      risks: ['The trace could become a decorative filter if object-specific evidence is unavailable.'],
      critique: ['Strongest continuity with the historical Friction Index selection, but it can over-privilege one interaction pattern across all exhibition moments.']
    },
    {
      id: 'repair-as-public-record',
      statement: 'Treat repair, care, uncertainty and alteration as the exhibition\'s public record, making preservation itself a readable editorial structure rather than a hidden conservation backstory.',
      tension: 'material permanence x digital ephemerality',
      truthRefs: [truths[0], truths[1], truths[3]],
      opportunityRefs: ['material-evidence-without-spectacle'],
      crossDomainConnections: ['conservation ledger x editorial reading system'],
      experientialConsequences: ['Visitors can move from an object to a legible chain of repair and care without losing the object context.', 'Long-form curatorial writing accommodates uncertainty and provenance as meaningful evidence.'],
      commercialConsequences: ['Visit planning stays concise and factual, counterbalancing the denser archival material.'],
      antiGenericClaims: ['Reject restoration as a luxury patina.', 'Reject an interface that turns documentation into decorative metadata.'],
      risks: ['The record can become bureaucratic and obscure the sensuous encounter with the object.'],
      critique: ['Most intellectually distinct, but risks making one hundred object encounters feel like an archive interface rather than an exhibition experience.']
    },
    {
      id: 'hundred-temporal-portraits',
      statement: 'Make one hundred distinct object lives perceptible as a shared tempo: each encounter isolates a particular change, while deliberate stillness lets the collection cohere without flattening its differences.',
      tension: 'one hundred distinct objects x one coherent exhibition identity',
      truthRefs: [truths[0], truths[2], truths[4]],
      opportunityRefs: ['material-evidence-without-spectacle'],
      crossDomainConnections: ['museum sequence x portrait cycle'],
      experientialConsequences: ['Each object receives a distinct temporal encounter rather than a universal animated template.', 'Reduced motion preserves the same sequence of object, change and context through stable hierarchy.'],
      commercialConsequences: ['The collection identity can carry across desktop and mobile without reducing practical visit-planning tasks to a secondary route.'],
      antiGenericClaims: ['Reject one branded motion gesture applied uniformly to every object.', 'Reject ambient movement used to signal cultural prestige.'],
      risks: ['The collection-level idea may be too diffuse to guide a visitor through an individual object journey.'],
      critique: ['Best collection-scale frame, but less immediately actionable for wayfinding and may dilute the specificity of repair as evidence.']
    }
  ];
}

function authoredCandidate(deliberation) {
  const base = authoredCandidateFromDeliberation(deliberation);
  return {
    ...base,
    governingIdea: 'Let accumulated material change become the exhibition’s evidence system, so time is perceived through what the objects have endured rather than through decorative spectacle.',
    whyThisProject: 'After Matter is about one hundred real objects whose wear, repair, fading and deformation are evidence of use. The thesis keeps those histories primary while preserving reading, wayfinding, ticketing, mobile access and reduced-motion meaning.',
    principles: [
      'Accumulated material change must remain connected to real object histories rather than decorative atmosphere.',
      'Stillness is the default state for reading, comparison and practical museum tasks.',
      'Repair and accumulated change are evidence of use, not luxury surface treatment.',
      'Each medium interprets the evidence system differently without replacing real objects with synthetic spectacle.'
    ],
    expressionTests: {
      typography: 'Separate contemplative exhibition voice from factual trace labels and durable reading without making type compete with object evidence.',
      image: 'Use licensed object photography or new capture to show actual wear, repair and material change; Phase 0 placeholders remain explicitly non-documentary.',
      motion: 'Make changes in material condition or historical understanding perceptible when they matter, then preserve deliberate stillness; no continuous drift.',
      interaction: 'Let visitors encounter objects and their material histories without losing orientation or access to practical museum routes.',
      sound: 'Silence remains the default; any later sound must be grounded in object evidence and retain a silent equivalent.',
      responsive: 'On desktop, mobile and under reduced motion, preserve the same evidence relationships, reading clarity and access to practical museum tasks through authored reinterpretation.'
    },
    antiPrinciples: [
      'Generic scroll-triggered fade-and-rise sequences applied uniformly to every section.',
      'Floating glass cards, glowing AI gradients or decorative particles unrelated to material memory.',
      'Scroll-jacking that delays reading or practical tasks.'
    ],
    selectionRationale: 'This recovery Thesis is the broadest project-specific governing idea supported by the frozen After Matter brief: material change is meaningful evidence, but the later Creative World determines whether that evidence becomes navigation, editorial record, collection rhythm, or another materially grounded behavior.',
    competitorTransferTest: {
      question: 'Could another museum or design site reuse this evidence-system Thesis unchanged without the specific collection truth that wear, repair, fading and deformation are meaningful records of use?',
      passCondition: 'The Thesis should weaken without After Matter’s one hundred real objects and its requirement to make accumulated material time perceptible while preserving reading, wayfinding, ticketing, mobile access and reduced-motion equivalence.'
    },
    technologyPolicy: 'Implementation tools serve the evidence system. Motion, browser APIs, generated media and spatial tools are considered only when they make object-specific material time more legible without displacing the objects or museum tasks.'
  };
}

export function buildAfterMatterThesisRecovery(brief = {}, { humanDecision = null } = {}) {
  const exactBrief = brief && typeof brief === 'object' ? brief : {};
  const projectId = text(exactBrief.projectId);
  const deliberation = buildCreativeThesisDeliberation({
    projectId,
    businessTruths: [...(exactBrief.projectTruths ?? []), ...(exactBrief.nonNegotiables ?? [])],
    opportunityGaps: ['material-evidence-without-spectacle'],
    contradictions: exactBrief.contradictions,
    hypotheses: hypotheses(exactBrief),
    selection: {
      hypothesisId: 'trace-as-evidence-system',
      rationale: 'It gives the exhibition a project-specific interaction rule: factual material change becomes the route into history, while the strongest constraints from the other candidates preserve repair as evidence and stillness as an active museum posture.',
      competitorTransferJudgment: 'A generic museum or design site cannot reuse this unchanged: without a collection where scratches, repairs, fading and deformation are actual evidence of use, the trace-as-route rule loses its reason to exist.',
      strategicRelevanceJudgment: 'It differentiates the launch experience without sacrificing the practical routes that make dates, access, events and ticket reservation usable.',
      experientialPotentialJudgment: 'It can govern imagery, hierarchy, object navigation, motion restraint, reading posture, responsive recomposition and reduced-motion equivalence without making any technology the concept.'
    },
    synthesis: {
      statement: 'Let accumulated material change become the exhibition\'s evidence system: each trace opens a factual route into an object\'s lived history, then returns attention to the object and the practical museum visit.',
      sourceHypothesisIds: ['trace-as-evidence-system', 'repair-as-public-record'],
      rationale: 'Trace as Evidence System supplies the navigable object-to-history behavior; Repair as Public Record ensures that the trace remains factual care and provenance rather than a generic distressed aesthetic.'
    }
  });
  const candidate = authoredCandidate(deliberation);
  const thesis = buildCreativeThesis({
    projectId,
    intent: exactBrief.challenge,
    businessTruths: [...(exactBrief.projectTruths ?? []), ...(exactBrief.nonNegotiables ?? [])],
    inspiration: {
      opportunityGaps: ['material-evidence-without-spectacle'],
      antiReferences: exactBrief.antiPatterns,
      unresolvedUnknowns: ['Final licensed object photography and object-specific historical records remain outside this recovery pass.'],
      evidenceReady: true
    },
    traits: ['archival authority', 'tactile sensuality'],
    antiPrinciples: exactBrief.antiPatterns,
    audience: exactBrief.audience,
    commercialObjective: 'Make the exhibition memorable while preserving clear access to dates, location, events and ticket reservation.',
    authoredCandidate: candidate
  });
  const authorityReview = reviewCreativeThesisAuthority({ deliberation, thesis, humanDecision });
  const packet = {
    schema: RECOVERY_SCHEMA,
    stage: 'creative-thesis-recovery-review',
    status: authorityReview.reviewReady ? 'human-approved-thesis-awaiting-world-exploration' : 'awaiting-human-creative-thesis-approval',
    projectId,
    historicalGrounding: historicalGrounding(exactBrief),
    deliberation,
    proposedCreativeThesis: thesis,
    proposedCreativeThesisFingerprint: fingerprintCreativeValue(thesis),
    humanDecision: humanDecision ?? null,
    thesisAuthorityReview: authorityReview,
    deterministicRecommendation: {
      hypothesisId: deliberation.selection?.hypothesisId ?? null,
      authoredCandidateFingerprint: fingerprintCreativeValue(candidate),
      rationale: deliberation.selection?.rationale ?? null
    },
    truth: {
      recoveryPassIsNewAuthorship: true,
      historicalPhase0SelectionPreservedOnlyAsEvidence: true,
      humanCreativeApprovalRecordedByDecision: authorityReview.authority?.humanApproved === true,
      machineRecommendationWasNotFinalAuthority: authorityReview.authority?.machineRecommendationWasNotFinalAuthority === true,
      creativeWorldSelectionAuthorityCreated: false,
      productionApproved: false,
      geminiGenerationUsed: false
    }
  };
  return { ...packet, snapshotFingerprint: fingerprintCreativeValue(packet) };
}
