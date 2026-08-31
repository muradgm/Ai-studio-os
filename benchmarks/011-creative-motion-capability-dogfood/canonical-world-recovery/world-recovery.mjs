import { fingerprintCreativeValue } from '../../../modules/creative-intelligence-foundation/fingerprint.mjs';
import { reviewCreativeThesisAuthority } from '../../../modules/creative-thesis/authority.mjs';
import { buildCreativeWorldExploration, reviewCreativeWorldExploration } from '../../../modules/creative-world/runtime.mjs';
import { buildStyleFrameProof } from '../../../modules/style-frame/runtime.mjs';

export const APPROVED_THESIS_FINGERPRINT = '03f2924c14696c25fd1724522a434b79a19b8f46a13f0d8447b17732d48d8ca1';
export const HISTORICAL_FRICTION_INDEX_FINGERPRINT = '3e1d94e065ff5a0aca8cc04f65d7788e7bdd29b09901031edced3994e4b51324';

const historicalRefs = [
  'benchmarks/011-creative-motion-capability-dogfood/runs/after-matter-phase0/README.md',
  'benchmarks/011-creative-motion-capability-dogfood/runs/after-matter-phase0/selection.json',
  'benchmarks/011-creative-motion-capability-dogfood/runs/after-matter-phase0/dogfood-brief.json',
  'benchmarks/011-creative-motion-capability-dogfood/runs/after-matter-phase0/index.html',
  'benchmarks/011-creative-motion-capability-dogfood/runs/after-matter-phase0/after-matter-desktop.png',
  'benchmarks/011-creative-motion-capability-dogfood/runs/after-matter-phase0/after-matter-mobile.png',
  'benchmarks/011-creative-motion-capability-dogfood/runs/after-matter-phase0/assets/material-study.png'
];

const moments = [
  { id: 'exhibition-entry', label: 'Exhibition entry', viewport: 'desktop', width: 1440, height: 900, purpose: 'Prove first-contact world identity while exhibition facts and practical navigation remain usable.', productState: 'Visitor enters After Matter with dates, location and tickets immediately available.' },
  { id: 'object-detail-history', label: 'Object detail and history', viewport: 'desktop', width: 1440, height: 900, purpose: 'Prove how one material change leads into factual history while the object remains primary.', productState: 'Visitor examines an explicitly non-documentary material-study placeholder and its factual-history structure.' },
  { id: 'curatorial-reading', label: 'Curatorial reading', viewport: 'desktop', width: 1440, height: 900, purpose: 'Prove long-form reading posture, stillness and contextual continuity.', productState: 'Visitor reads care, provenance and uncertainty in a stable editorial context.' },
  { id: 'visit-ticketing', label: 'Visit and ticketing', viewport: 'desktop', width: 1440, height: 900, purpose: 'Prove date, location and ticket actions remain immediate inside the Creative World.', productState: 'Visitor checks exhibition dates and reserves a ticket without leaving the material-history context.' },
  { id: 'mobile-interpretation', label: 'Mobile interpretation', viewport: 'mobile', width: 390, height: 844, purpose: 'Prove authored narrow-screen object/history interpretation with a clear route to practical museum tasks.', productState: 'Mobile visitor reads one object-history relationship and can reach dates, location and tickets immediately.' }
];

function frictionFromHistorical(world) {
  const preserved = world && typeof world === 'object' ? world : {};
  return {
    id: 'friction-index', label: 'Friction Index', worldIdea: preserved.worldIdea,
    interpretationOfThesis: preserved.interpretationOfThesis,
    signatureBehavior: preserved.signatureBehavior,
    worldClass: preserved.worldClass, narrativeModel: preserved.narrativeModel, compositionModel: preserved.compositionModel,
    typographyIntent: preserved.typographyIntent, imageLanguage: preserved.imageLanguage, materialLanguage: preserved.materialLanguage,
    motionLanguage: preserved.motionLanguage, interactionModel: preserved.interactionModel, responsiveStrategy: preserved.responsiveStrategy,
    soundPolicy: preserved.soundPolicy, categoryTransferTest: preserved.categoryTransferTest, antiPatterns: preserved.antiPatterns,
    unresolvedRisks: preserved.unresolvedRisks
  };
}

function recoveryWorlds(historicalFriction) {
  return [
    frictionFromHistorical(historicalFriction),
    {
      id: 'repair-ledger', label: 'Repair Ledger',
      worldIdea: 'Care is the editorial voice: repair, uncertainty and conservation records gather beside each object as a public, readable ledger.',
      interpretationOfThesis: 'Accumulated material change becomes evidence through an inspectable chronology of care, so repair and uncertainty are understood as real histories rather than decorative surface.',
      signatureBehavior: 'Annotations gather beside the object, then settle into a stable chronological ledger that remains readable without pulling attention away from the object.',
      worldClass: 'conservation-led editorial record', narrativeModel: 'move from object encounter into a chronological ledger of care, uncertainty and context, then return to the object with the record retained.',
      compositionModel: 'object field with a calm adjacent ledger, durable reading column and compact visit rail; documentation is ordered as evidence rather than ornament.',
      typographyIntent: { statement: 'A measured editorial hierarchy distinguishes object title, conservation annotation, uncertainty and long-form curatorial reading without approving a final family.', roles: { object: 'quietly prominent', ledger: 'precise chronology', reading: 'durable and generous', visit: 'immediate and functional' }, preferredCategories: { display: ['serif'], body: ['sans-serif', 'serif'] }, avoidCategories: ['bureaucratic database density', 'luxury restoration language'], pressures: { readingClarity: 95, objectPrimacy: 91, chronologyLegibility: 94, practicalTaskClarity: 94 }, antiPatterns: ['metadata used as texture', 'type that makes care feel bureaucratic'] },
      imageLanguage: 'licensed exhibition object photography or new capture paired with close documentation crops; this proof uses an explicitly labelled non-documentary material-study placeholder.',
      materialLanguage: 'paper fiber, conservation tissue, graphite notation, repaired joins, archival tabs and restrained ink rules.',
      motionLanguage: 'annotations gather and settle into chronology, followed by still reading; no theatrical reveal or ambient drift.',
      interactionModel: 'inspect a care record, compare sequential interventions, retain object context and reach visit tasks immediately.',
      responsiveStrategy: 'mobile becomes a single chronological reading stack with the object and visit route held in context; it is not a compressed desktop ledger.',
      soundPolicy: 'Silence by default. Any future sound must be factual, rights-cleared and have a silent equivalent.',
      categoryTransferTest: { whyProjectSpecific: 'After Matter treats wear, repair, fading and deformation across one hundred real objects as evidence of use; the ledger is meaningful because care is part of each object history.', transferRisk: 'high if generic museum metadata or decorative annotations replace factual conservation evidence.' },
      antiPatterns: ['decorative metadata', 'generic archive-dashboard UI', 'documentation that obscures the object'],
      unresolvedRisks: ['Requires object-specific conservation records and licensed photography before production.', 'Chronology can become dense if uncertainty is not editorially prioritized.']
    },
    {
      id: 'pressure-room', label: 'Pressure Room',
      worldIdea: 'Time is felt as resistance: one object receives a concentrated encounter where pressure and release make quiet attention the dramatic event.',
      interpretationOfThesis: 'Accumulated change is understood through a focused encounter with the resistance an object has endured, then released into factual history and practical museum access.',
      signatureBehavior: 'A deliberate threshold concentrates attention on one object-history relationship, then releases into stable context without forcing waiting or blocking access.',
      worldClass: 'concentrated encounter rhythm', narrativeModel: 'arrive at one object, experience a composed threshold of resistance, open its factual history, then release back to a still exhibition field.',
      compositionModel: 'one dominant object plane, a compressed threshold edge and a surrounding still field with persistent practical navigation.',
      typographyIntent: { statement: 'Sparse spatial typography holds attention around one object while factual history and practical routes stay immediately legible; no final family is approved.', roles: { encounter: 'measured and spacious', history: 'factual and close', reading: 'calm and durable', visit: 'persistent and direct' }, preferredCategories: { display: ['serif', 'humanist sans-serif'], body: ['sans-serif'] }, avoidCategories: ['cinematic title-card drama', 'oversized type that blocks the object'], pressures: { encounterFocus: 94, readingClarity: 90, practicalTaskClarity: 95, objectPrimacy: 96 }, antiPatterns: ['forced waiting', 'fake loading state'] },
      imageLanguage: 'licensed object photography or new capture shown at concentrated scale with materially specific close detail; this proof uses an explicitly labelled non-documentary material-study placeholder.',
      materialLanguage: 'dark mineral ground, compressed shadow, worn surfaces, fine pressure lines and restrained light at repaired edges.',
      motionLanguage: 'brief resistance, release and long stillness; reduced motion preserves the same threshold relationship as a stable state change.',
      interactionModel: 'enter or bypass a composed object threshold, inspect its factual history, return to the exhibition field and access visit tasks at every point.',
      responsiveStrategy: 'mobile uses a vertical encounter sequence with a visible bypass and immediate visit route; pressure is expressed through hierarchy, never elapsed time.',
      soundPolicy: 'Silence by default. Any future sound must support an object-specific causal relationship and retain a silent equivalent.',
      categoryTransferTest: { whyProjectSpecific: 'The encounter is specific to After Matter because one hundred real objects carry distinct resistance through wear, repair, fading and deformation, not because a generic cultural site needs theatrical tension.', transferRisk: 'high if the threshold turns into a cinematic intro, scroll-jacking or a technology demonstration.' },
      antiPatterns: ['cinematic intro', 'forced waiting', 'scroll-jacking', 'fake loading state', 'inaccessible timed gate', 'technology demo'],
      unresolvedRisks: ['The threshold requires clear bypass and reduced-motion equivalence.', 'Concentration must not suppress reading, dates, location or ticket access.']
    }
  ];
}

export function buildAfterMatterCreativeWorldRecovery({ thesisPacket = null, historicalSelection = null } = {}) {
  const thesis = thesisPacket?.proposedCreativeThesis ?? null;
  const authority = reviewCreativeThesisAuthority({ deliberation: thesisPacket?.deliberation, thesis, humanDecision: thesisPacket?.humanDecision });
  const thesisFingerprint = fingerprintCreativeValue(thesis ?? {});
  const valid = authority.reviewReady === true && thesisFingerprint === APPROVED_THESIS_FINGERPRINT && authority.authority?.humanApproved === true && authority.authority?.humanDecisionMode === 'refine-candidate' && authority.authority?.machineRecommendationWasNotFinalAuthority === true;
  if (!valid) return { schema: 'ai-studio-os/benchmark-011-after-matter-world-recovery@1', status: 'blocked', thesisAuthorityReview: authority, findings: [{ severity: 'blocker', code: 'after-matter-canonical-thesis-authority-invalid' }], truth: { geminiGenerationUsed: false, productionApproved: false } };

  const historicalFriction = historicalSelection?.selectedWorld ?? null;
  const exploration = buildCreativeWorldExploration({ creativeThesis: thesis, authoredWorlds: recoveryWorlds(historicalFriction) });
  const review = reviewCreativeWorldExploration(exploration);
  const styleFramePlan = buildStyleFrameProof({ exploration, moments });
  const provenance = exploration.worlds.map((world) => ({
    worldId: world.id, historicalEvidenceRefs: historicalRefs, canonicalThesisFingerprint: thesisFingerprint,
    canonicalRecoveredWorldFingerprint: fingerprintCreativeValue(world), structuralReviewReady: world.reviewReady === true,
    recoveryAuthorship: world.id === 'friction-index' ? 'canonical-rebinding-from-historical-structured-world' : 'new-canonical-recovery-authorship',
    ...(world.id === 'friction-index' ? { historicalPhase0WorldFingerprint: HISTORICAL_FRICTION_INDEX_FINGERPRINT } : {})
  }));
  const packet = { schema: 'ai-studio-os/benchmark-011-after-matter-world-recovery@1', stage: 'creative-world-recovery', status: styleFramePlan.reviewReady ? 'ready-for-browser-style-frame-proof' : 'provisional', projectId: thesis.projectId, approvedThesis: thesis, approvedThesisFingerprint: thesisFingerprint, thesisAuthorityReview: authority, exploration, structuralReview: review, recoveryProvenance: provenance, styleFramePlan, historicalPhase0: { selectedWorldId: 'friction-index', selectedWorldFingerprint: HISTORICAL_FRICTION_INDEX_FINGERPRINT, selectionIsEvidenceOnly: true }, selection: null, selectedWorld: null, truth: { humanWorldSelectionConfirmed: false, selectedAutomatically: false, creativeDirectionAuthorityCreated: false, motionAuthorityCreated: false, productionApproved: false, geminiGenerationUsed: false } };
  return { ...packet, snapshotFingerprint: fingerprintCreativeValue(packet) };
}

export { moments as afterMatterStyleFrameMoments };
