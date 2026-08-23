import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCreativeWorldCatalog,
  validateCreativeWorldSelection
} from '../apps/creative-agency/creative-world-catalog.mjs';
import { createDirectionSelectionState } from '../apps/creative-agency/src/direction-state.js';

function world(id, index) {
  return {
    schema: 'ai-studio-os/creative-world@1',
    id,
    label: `World ${index}`,
    worldIdea: `Premise ${index}`,
    signatureBehavior: `Signature ${index}`,
    worldClass: `Class ${index}`,
    narrativeModel: `Narrative ${index}`,
    compositionModel: `Composition ${index}`,
    typographyIntent: { statement: `Typography ${index}` },
    imageLanguage: `Image ${index}`,
    materialLanguage: `Material ${index}`,
    motionLanguage: `Motion ${index}`,
    interactionModel: `Interaction ${index}`,
    responsiveStrategy: `Responsive ${index}`,
    categoryTransferTest: { whyProjectSpecific: `Specific ${index}`, transferRisk: 'medium' },
    antiPatterns: [`anti-${index}-1`, `anti-${index}-2`],
    thesisRef: { schema:'ai-studio-os/creative-thesis@1', projectId:'test-project', governingIdea:'Evidence before decoration.' },
    reviewReady: true
  };
}

function exploration({ proof = true } = {}) {
  return {
    schema: 'ai-studio-os/creative-world-exploration@1',
    projectId: 'test-project',
    reviewReady: true,
    thesisRef: { schema:'ai-studio-os/creative-thesis@1', projectId:'test-project', governingIdea:'Evidence before decoration.' },
    worlds: [world('world-1', 1), world('world-2', 2), world('world-3', 3)],
    visualProof: proof ? {
      reviewReady: true,
      comparisonRef: 'artifact://comparison',
      worlds: [
        { worldId:'world-1', reviewReady:true, evidenceRefs:['artifact://world-1'] },
        { worldId:'world-2', reviewReady:true, evidenceRefs:['artifact://world-2'] },
        { worldId:'world-3', reviewReady:true, evidenceRefs:['artifact://world-3'] }
      ]
    } : { reviewReady:false, worlds:[] }
  };
}

test('Command Center catalog derives candidates from project Creative World artifacts instead of hard-coded directions', () => {
  const catalog = buildCreativeWorldCatalog('test-project', exploration());
  assert.equal(catalog.pass, true, JSON.stringify(catalog.findings));
  assert.equal(catalog.status, 'visual-proof-ready');
  assert.deepEqual(catalog.candidates.map((candidate) => candidate.id), ['world-1','world-2','world-3']);
  assert.ok(catalog.candidates.every((candidate) => candidate.canLock));
  assert.ok(catalog.catalogVersion);
});

test('structurally ready worlds without reviewed visual proof can be previewed but not locked', () => {
  const catalog = buildCreativeWorldCatalog('test-project', exploration({ proof:false }));
  assert.equal(catalog.pass, true);
  assert.equal(catalog.status, 'awaiting-visual-proof');
  assert.ok(catalog.candidates.every((candidate) => candidate.canLock === false));
  const result = validateCreativeWorldSelection(catalog, {
    selectedWorldId:'world-1',
    catalogVersion:catalog.catalogVersion
  });
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((item) => item.code === 'creative-world-selection-visual-proof-required'));
});

test('server-side selection rejects arbitrary ids and stale catalog versions', () => {
  const catalog = buildCreativeWorldCatalog('test-project', exploration());
  const arbitrary = validateCreativeWorldSelection(catalog, { selectedWorldId:'invented-world', catalogVersion:catalog.catalogVersion });
  assert.equal(arbitrary.pass, false);
  assert.ok(arbitrary.findings.some((item) => item.code === 'creative-world-selection-id-invalid'));

  const stale = validateCreativeWorldSelection(catalog, { selectedWorldId:'world-1', catalogVersion:'old-version' });
  assert.equal(stale.pass, false);
  assert.ok(stale.findings.some((item) => item.code === 'creative-world-selection-catalog-stale'));
});

test('validated selection carries world, thesis, catalog and visual-proof provenance', () => {
  const catalog = buildCreativeWorldCatalog('test-project', exploration());
  const result = validateCreativeWorldSelection(catalog, { selectedWorldId:'world-2', catalogVersion:catalog.catalogVersion });
  assert.equal(result.pass, true, JSON.stringify(result.findings));
  assert.equal(result.selection.status, 'locked');
  assert.equal(result.selection.selectedCreativeWorldId, 'world-2');
  assert.equal(result.selection.catalogVersion, catalog.catalogVersion);
  assert.deepEqual(result.selection.visualEvidenceRefs, ['artifact://world-2']);
  assert.equal(result.selection.comparisonRef, 'artifact://comparison');
  assert.equal(result.selection.thesisRef.projectId, 'test-project');
});

test('browser selection state becomes immutable once an execution records the world', () => {
  const catalog = buildCreativeWorldCatalog('test-project', exploration());
  const initial = createDirectionSelectionState({
    candidates:catalog.candidates,
    selectedId:'world-1',
    catalogVersion:catalog.catalogVersion,
    catalogStatus:catalog.status
  });
  assert.equal(initial.canExecute, true);
  assert.equal(initial.immutable, false);

  const locked = createDirectionSelectionState({
    candidates:catalog.candidates,
    selectedId:'world-1',
    catalogVersion:catalog.catalogVersion,
    catalogStatus:catalog.status,
    lockedByExecutionId:'exec-123'
  });
  assert.equal(locked.status, 'execution-locked');
  assert.equal(locked.immutable, true);
  assert.equal(locked.lockedByExecutionId, 'exec-123');
});
