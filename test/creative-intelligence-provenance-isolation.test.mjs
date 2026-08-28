import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCreativeIntelligenceFoundation } from '../modules/creative-intelligence-foundation/runtime.mjs';
import { buildCreativeIntelligenceContextWithProvenance } from '../modules/creative-intelligence-foundation/provenance.mjs';

function projectEntry(projectId, definition) {
  return {
    id: `knowledge-${projectId}`,
    kind: 'project-observation',
    domain: 'product-experience',
    title: `Scoped knowledge ${projectId}`,
    definition,
    causalRationale: 'This observation is meaningful only inside the project evidence that produced it.',
    perceptualEffects: ['project-specific consequence clarity'],
    worksWhen: ['used inside the same project scope'],
    failsWhen: ['transferred into another project without evidence'],
    creativeVariables: ['hierarchy'],
    crossDomainApplications: [],
    failureModes: ['cross-project leakage'],
    counterexamples: ['a project with different product truth'],
    diagnostics: ['confirm exact project identity before selection'],
    relationships: [],
    provenance: {
      sourceId: `source-${projectId}`,
      sourceType: 'project-observation',
      sourceRef: `project://${projectId}/private`
    },
    confidence: 0.9,
    confidenceBasis: 'Direct evidence inside one project only.',
    scope: 'project',
    projectId,
    transferability: 'Project-scoped unless later promoted through independent recurrence evidence.'
  };
}

function ref(knowledgeId) {
  return {
    knowledgeId,
    role: 'project-evidence',
    relevance: 'Relevant to this project reasoning question.',
    projectFit: 'Must match the current project scope.',
    caution: 'Do not transfer project evidence across projects.'
  };
}

test('provenance verification does not re-embed unrelated shared Foundation knowledge', () => {
  const projectBPrivateText = 'PROJECT-B-PRIVATE-PROVENANCE-CONTENT-MUST-NOT-LEAK';
  const foundation = buildCreativeIntelligenceFoundation({
    entries: [
      projectEntry('project-a', 'Project A evidence.'),
      projectEntry('project-b', projectBPrivateText)
    ]
  });
  assert.equal(foundation.reviewReady, true);

  const context = buildCreativeIntelligenceContextWithProvenance({
    projectId: 'project-a',
    purpose: 'Use only Project A evidence with independently verified Foundation provenance.',
    projectTruths: ['Project A has its own product truth.'],
    foundation,
    entryRefs: [ref('knowledge-project-a')]
  });

  assert.equal(context.reviewReady, true);
  assert.equal(context.provenanceReady, true);
  assert.equal(context.provenanceReview.sourceFoundationReceipt.truth.receiptContainsFoundationKnowledge, false);
  assert.equal(context.truth.fullSharedFoundationExcludedFromProvenanceReceipt, true);
  assert.equal(JSON.stringify(context).includes(projectBPrivateText), false);
});
