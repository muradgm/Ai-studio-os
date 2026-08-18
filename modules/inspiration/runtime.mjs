const REQUIRED_LANES = ['directIndustry', 'bestInClass', 'adjacentIndustries', 'trends', 'antiReferences'];

function hasReferenceEvidence(reference) {
  return reference
    && typeof reference.reference === 'string'
    && reference.reference.length > 0
    && typeof reference.take === 'string'
    && typeof reference.reject === 'string'
    && typeof reference.evidence === 'string'
    && reference.evidence.length > 0;
}

export function buildInspirationPacket(input) {
  const missing = REQUIRED_LANES.filter((key) => !Array.isArray(input[key]) || input[key].length === 0);
  const opportunityGaps = [...new Set(input.opportunityGaps ?? [])];
  const referenceMatrix = input.referenceMatrix ?? [];
  const evidenceReady = referenceMatrix.length > 0 && referenceMatrix.every(hasReferenceEvidence);

  let status = 'ready';
  if (missing.length) status = 'needs-lanes';
  else if (!evidenceReady) status = 'ready-for-research';

  return {
    stage: 'inspiration',
    status,
    missingLanes: missing,
    evidenceReady,
    lanes: {
      directIndustry: input.directIndustry ?? [],
      bestInClass: input.bestInClass ?? [],
      adjacentIndustries: input.adjacentIndustries ?? [],
      trends: input.trends ?? [],
      antiReferences: input.antiReferences ?? []
    },
    referenceMatrix,
    referenceMatrixSchema: ['reference', 'take', 'reject', 'evidence'],
    opportunityGaps,
    unresolvedUnknowns: input.unresolvedUnknowns ?? [],
    rule: 'References calibrate judgment; they do not authorize copying.'
  };
}
