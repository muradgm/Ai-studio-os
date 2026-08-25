import test from 'node:test';
import assert from 'node:assert/strict';

import {
  authoredCandidateFromDeliberation,
  buildCreativeThesisDeliberation
} from '../modules/creative-thesis/intelligence.mjs';

function strongDeliberation(overrides = {}) {
  return buildCreativeThesisDeliberation({
    projectId: 'du-bonheur',
    businessTruths: ['French pastry craft', 'Contemporary Berlin service context', 'Physical counter ritual'],
    opportunityGaps: ['Make the service ritual distinctive without nostalgic French luxury codes'],
    contradictions: ['precision × pleasure', 'French craft × contemporary Berlin restraint', 'sensory excess × visual control'],
    hypotheses: [
      {
        id: 'counter-theatre',
        statement: 'Turn the counter service sequence into the narrative architecture of the experience.',
        tension: 'service efficiency × ceremony',
        truthRefs: ['Physical counter ritual'],
        opportunityRefs: ['service ritual'],
        crossDomainConnections: ['service × choreography'],
        experientialConsequences: ['Navigation and reveal sequences follow service thresholds.'],
        commercialConsequences: ['Ordering clarity remains part of the concept rather than an afterthought.'],
        antiGenericClaims: ['Avoid nostalgic Parisian luxury staging.'],
        critique: ['Strong project specificity; risk of becoming theatrical if ordering utility is weakened.']
      },
      {
        id: 'temporary-architecture',
        statement: 'Treat each pastry as a temporary designed object whose fragility structures the visual experience.',
        tension: 'architectural control × edible impermanence',
        truthRefs: ['French pastry craft'],
        opportunityRefs: ['product materiality'],
        crossDomainConnections: ['patisserie × temporary architecture'],
        experientialConsequences: ['Composition emphasizes object scale, layers and disappearance.'],
        commercialConsequences: ['Product detail becomes the primary conversion evidence.'],
        antiGenericClaims: ['Avoid generic lifestyle-cafe photography.'],
        critique: ['Excellent image potential; weaker service differentiation unless connected back to ordering.']
      },
      {
        id: 'controlled-indulgence',
        statement: 'Use visual restraint to intensify the perception of sensory abundance.',
        tension: 'sensory excess × Berlin restraint',
        truthRefs: ['Contemporary Berlin service context'],
        opportunityRefs: ['avoid generic luxury'],
        crossDomainConnections: ['indulgence × editorial restraint'],
        experientialConsequences: ['Negative space and pacing make product richness feel more intense.'],
        commercialConsequences: ['Premium perception comes from product focus rather than luxury decoration.'],
        antiGenericClaims: ['Reject generic gold-and-serif luxury coding.'],
        critique: ['Strong art direction; needs service truth to become uniquely Du Bonheur.']
      }
    ],
    selection: {
      hypothesisId: 'counter-theatre',
      rationale: 'It is the most project-specific structure and can absorb the strongest restraint tension from the other hypotheses without losing service truth.',
      competitorTransferJudgment: 'A competitor without the same counter ritual and service truth could not reuse it unchanged without becoming generic theatre.',
      strategicRelevanceJudgment: 'It turns an existing operational truth into differentiation while preserving ordering clarity.',
      experientialPotentialJudgment: 'It can govern composition, navigation, motion, typography pacing, responsive sequencing and physical-product reveals.'
    },
    synthesis: {
      statement: 'Make counter service a choreography of controlled indulgence.',
      sourceHypothesisIds: ['counter-theatre', 'controlled-indulgence'],
      rationale: 'Counter Theatre supplies project-specific structure; Controlled Indulgence supplies the strongest visual tension.'
    },
    ...overrides
  });
}

test('Creative Thesis deliberation requires divergent, grounded, criticized hypotheses before authorship', () => {
  const output = strongDeliberation();
  assert.equal(output.pass, true);
  assert.equal(output.reviewReady, true);
  assert.equal(output.status, 'ready-for-thesis-authorship');
  assert.equal(output.hypotheses.length, 3);
  assert.equal(output.truth.humanCreativeApproval, false);

  const authored = authoredCandidateFromDeliberation(output);
  assert.equal(authored.governingIdea, 'Make counter service a choreography of controlled indulgence.');
  assert.equal(authored.creativeTension, 'service efficiency × ceremony');
  assert.equal(authored.alternativesConsidered.length, 2);
});

test('Creative Thesis deliberation stays provisional when divergence is too thin', () => {
  const output = strongDeliberation({
    hypotheses: [
      {
        id: 'one',
        statement: 'Make service the experience.',
        tension: 'speed × ritual',
        truthRefs: ['Physical counter ritual'],
        experientialConsequences: ['Sequence follows service.'],
        critique: ['Could become generic.']
      },
      {
        id: 'two',
        statement: 'Make service become the experience.',
        tension: 'speed × ritual',
        truthRefs: ['Physical counter ritual'],
        experientialConsequences: ['Sequence follows service.'],
        critique: ['Could become generic.']
      }
    ],
    selection: {
      hypothesisId: 'one',
      rationale: 'Preferred.',
      competitorTransferJudgment: 'Must remain project-specific.',
      strategicRelevanceJudgment: 'Relevant.',
      experientialPotentialJudgment: 'Useful.'
    }
  });
  assert.equal(output.reviewReady, false);
  assert.ok(output.findings.some((item) => item.code === 'creative-thesis-hypothesis-divergence-thin'));
});

test('Creative Thesis deliberation fails closed without a selected hypothesis', () => {
  const output = strongDeliberation({ selection: null });
  assert.equal(output.pass, false);
  assert.equal(output.reviewReady, false);
  assert.ok(output.findings.some((item) => item.code === 'creative-thesis-deliberation-selection-missing'));
  assert.equal(authoredCandidateFromDeliberation(output), null);
});
