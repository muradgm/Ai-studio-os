export function buildCreativeDirection({ intent, businessTruths = [], inspiration, traits = [], antiPrinciples = [] }) {
  if (!intent) throw new Error('creative direction requires intent');
  if (!inspiration) throw new Error('creative direction requires inspiration');

  const gaps = inspiration.opportunityGaps ?? [];
  return {
    stage: 'creative-direction',
    provisional: inspiration.status !== 'ready',
    directionStatement: `${intent}. Build from business truth, then use inspiration to create a distinct authored system rather than a category template.`,
    nonNegotiables: [...businessTruths],
    principles: [
      ...traits.map((trait) => `Express ${trait} through concrete design decisions.`),
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
