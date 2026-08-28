import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCreativeIntelligenceContext,
  buildCreativeIntelligenceFoundation
} from '../modules/creative-intelligence-foundation/runtime.mjs';

function projectEntry(projectId, privateText) {
  return {
    id: `knowledge-${projectId}`,
    kind: 'project-observation',
    domain: 'product-experience',
    title: `Scoped observation ${projectId}`,
    definition: privateText,
    causalRationale: 'The project observation is useful only because it is grounded in this project’s own product evidence.',
    perceptualEffects: ['project-specific consequence clarity'],
    worksWhen: ['reasoning inside the same project scope'],
    failsWhen: ['silently transferred into another project'],
    creativeVariables: ['hierarchy'],
    crossDomainApplications: [],
    failureModes: ['cross-project leakage'],
    counterexamples: ['another project with different product truth'],
    diagnostics: ['confirm project identity before selecting the observation'],
    relationships: [],
    provenance: {
      sourceId: `source-${projectId}`,
      sourceType: 'project-observation',
      sourceRef: `project://${projectId}/private-observation`
    },
    confidence: 0.85,
    confidenceBasis: 'Direct project evidence; no general transfer claim.',
    scope: 'project',
    projectId,
    transferability: 'Project-scoped unless later promoted through independent recurrence evidence.'
  };
}

function ref(knowledgeId) {
  return {
    knowledgeId,
    role: 'project-evidence',
    relevance: 'Relevant only if its project scope matches.',
    projectFit: 'Must match current project identity.',
    caution: 'Do not transfer project-specific evidence across projects.'
  };
}

test('project context emits selected evidence only and never embeds the shared Foundation', () => {
  const projectBPrivateText = 'PROJECT-B-ONLY-CONTENT-DO-NOT-EXPOSE-TO-PROJECT-A';
  const foundation = buildCreativeIntelligenceFoundation({
    entries: [
      projectEntry('project-a', 'Project A scoped evidence.'),
      projectEntry('project-b', projectBPrivateText)
    ]
  });
  assert.equal(foundation.reviewReady, true);

  const context = buildCreativeIntelligenceContext({
    projectId: 'project-a',
    purpose: 'Reason only with Project A evidence.',
    projectTruths: ['Project A has its own product truth.'],
    foundation,
    entryRefs: [ref('knowledge-project-a')]
  });

  assert.equal(context.reviewReady, true);
  assert.equal(Object.hasOwn(context, 'foundation'), false);
  assert.deepEqual(context.selectedEvidence.map((entry) => entry.id), ['knowledge-project-a']);
  assert.equal(JSON.stringify(context).includes(projectBPrivateText), false);
  assert.equal(context.truth.fullSharedFoundationExcludedFromProjectPayload, true);
});

test('blocked cross-project selection is redacted before payload construction', () => {
  const projectBPrivateText = 'PROJECT-B-ONLY-CONTENT-DO-NOT-EXPOSE-TO-PROJECT-A';
  const foundation = buildCreativeIntelligenceFoundation({
    entries: [
      projectEntry('project-a', 'Project A scoped evidence.'),
      projectEntry('project-b', projectBPrivateText)
    ]
  });

  const context = buildCreativeIntelligenceContext({
    projectId: 'project-a',
    purpose: 'Attempt an invalid cross-project selection.',
    projectTruths: ['Project A has its own product truth.'],
    foundation,
    entryRefs: [ref('knowledge-project-b')]
  });

  assert.equal(context.reviewReady, false);
  assert.equal(context.selectedEvidence.length, 0);
  assert.equal(JSON.stringify(context).includes(projectBPrivateText), false);
  assert.ok(context.findings.some((item) => item.code === 'creative-intelligence-project-knowledge-drift'));
  assert.ok(context.findings.some((item) => item.code === 'creative-intelligence-evidence-snapshot-missing'));
});
