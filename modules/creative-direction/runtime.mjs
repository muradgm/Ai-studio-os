function normalizeTraits(traits = []) {
  return traits.filter((trait) => typeof trait === 'string' && trait.trim().length > 0);
}

function unique(values = []) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim().length > 0))];
}

export function buildCreativeDirection({ intent, businessTruths = [], inspiration, traits = [], antiPrinciples = [], thesis = null }) {
  if (!intent) throw new Error('creative direction requires intent');
  if (!inspiration) throw new Error('creative direction requires inspiration');

  const normalizedTraits = normalizeTraits(traits);
  const gaps = inspiration.opportunityGaps ?? [];
  const thesisTension = thesis?.creativeTension?.label;
  const tension = thesisTension || (normalizedTraits.length >= 2
    ? `${normalizedTraits[0]} × ${normalizedTraits[1]}`
    : normalizedTraits[0] ?? 'business truth × distinctiveness');
  const leadGap = thesis?.sourceOpportunity?.value ?? gaps[0];
  const thesisStatement = thesis?.statement || thesis?.governingIdea?.statement;
  const thesisPrinciples = thesis?.principles ?? [];
  const thesisAntiPrinciples = thesis?.antiPrinciples ?? [];

  return {
    stage: 'creative-direction',
    provisional: inspiration.status !== 'ready' || thesis?.reviewReady === false,
    traits: normalizedTraits,
    tension,
    directionStatement: thesisStatement || `${intent}. Creative tension: ${tension}.${leadGap ? ` Lead opportunity: ${leadGap}.` : ''}`,
    thesisContext: thesis ? {
      schema: thesis.schema ?? null,
      statement: thesis.statement ?? null,
      governingIdea: thesis.governingIdea?.statement ?? null,
      sourceTruthIds: (thesis.sourceTruths ?? []).map((item) => item.id),
      sourceOpportunityId: thesis.sourceOpportunity?.id ?? null,
      reviewStatus: thesis.status ?? null,
      humanApproved: thesis.truth?.humanCreativeApproval === true
    } : null,
    nonNegotiables: [...businessTruths],
    principles: unique([
      ...thesisPrinciples,
      ...normalizedTraits.map((trait) => `Express ${trait} through concrete design decisions.`),
      ...gaps.map((gap) => `Exploit opportunity gap: ${gap}`)
    ]),
    antiPrinciples: unique([...antiPrinciples, ...thesisAntiPrinciples]),
    implications: {
      design: thesis?.expressionTests?.typography
        ? `${thesis.expressionTests.typography} ${thesis.expressionTests.interaction ?? ''}`.trim()
        : 'Hierarchy, typography, composition, and interaction must express the same direction.',
      image: thesis?.expressionTests?.image
        ?? 'Prefer truthful assets; art-direct crop, grade, texture, and continuity before fabrication.',
      motion: thesis?.expressionTests?.motion
        ?? 'Define one motion personality and a small number of signature behaviors.',
      interaction: thesis?.expressionTests?.interaction
        ?? 'Interaction must reinforce the direction rather than exist as generic polish.',
      responsive: thesis?.expressionTests?.responsive
        ?? 'Responsive adaptation must preserve the creative idea, not merely stack the desktop layout.',
      sound: thesis?.expressionTests?.sound
        ?? 'Sound is optional and must reinforce the direction when used.',
      writing: 'Use business-specific claims and remove interchangeable category copy.'
    },
    technologyPolicy: thesis?.technologyPolicy ?? null,
    reviewCriteria: ['business-truth', 'creative-thesis-fit', 'brand-fit', 'distinctiveness', 'coherence', 'usability'],
    unresolvedRisks: unique([...(inspiration.unresolvedUnknowns ?? []), ...(thesis?.unresolvedRisks ?? [])])
  };
}
