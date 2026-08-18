function normalizeTraits(traits = []) {
  return traits.filter((trait) => typeof trait === 'string' && trait.trim().length > 0);
}

export function buildCreativeDirection({ intent, businessTruths = [], inspiration, traits = [], antiPrinciples = [] }) {
  if (!intent) throw new Error('creative direction requires intent');
  if (!inspiration) throw new Error('creative direction requires inspiration');

  const normalizedTraits = normalizeTraits(traits);
  const gaps = inspiration.opportunityGaps ?? [];
  const tension = normalizedTraits.length >= 2
    ? `${normalizedTraits[0]} × ${normalizedTraits[1]}`
    : normalizedTraits[0] ?? 'business truth × distinctiveness';
  const leadGap = gaps[0];

  return {
    stage: 'creative-direction',
    provisional: inspiration.status !== 'ready',
    traits: normalizedTraits,
    tension,
    directionStatement: `${intent}. Creative tension: ${tension}.${leadGap ? ` Lead opportunity: ${leadGap}.` : ''}`,
    nonNegotiables: [...businessTruths],
    principles: [
      ...normalizedTraits.map((trait) => `Express ${trait} through concrete design decisions.`),
      ...gaps.map((gap) => `Exploit opportunity gap: ${gap}`)
    ],
    antiPrinciples: [...antiPrinciples],
    implications: {
      design: 'Hierarchy, typography, composition, and interaction must express the same direction.',
      image: 'Prefer truthful assets; art-direct crop, grade, texture, and continuity before fabrication.',
      motion: 'Define one motion personality and a small number of signature behaviors.',
      writing: 'Use business-specific claims and remove interchangeable category copy.'
    },
    reviewCriteria: ['business-truth', 'brand-fit', 'distinctiveness', 'coherence', 'usability'],
    unresolvedRisks: inspiration.unresolvedUnknowns ?? []
  };
}
