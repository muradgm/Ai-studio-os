import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { buildProductUnderstanding } from '../modules/product-understanding/runtime.mjs';
import { buildProductUXArchitecture } from '../modules/product-ux-architecture/runtime.mjs';
import { runInterfaceCreativeRuntime, validateInterfaceCreativeOutput } from '../lib/interface-creative-runtime.mjs';

const read = (name) => JSON.parse(fs.readFileSync(new URL(`../projects/ai-council/${name}`, import.meta.url), 'utf8'));
const productInput = read('product-understanding.json');
const uxInput = read('product-ux-architecture.json');
const researchInput = read('creative-research.json');
const thesisInput = read('creative-thesis.json');
const candidateInput = read('creative-world-candidates.json');
const momentsInput = read('style-frame-moments.json');

function buildArchitecture() {
  const productUnderstanding = buildProductUnderstanding(productInput);
  const productUXArchitecture = buildProductUXArchitecture({
    ...uxInput,
    productUnderstandingRef: {
      schema: productUnderstanding.schema,
      projectId: productUnderstanding.projectId,
      sourceProject: productUnderstanding.sourceProject,
      sourceRevision: productUnderstanding.sourceRevision,
      reviewReady: productUnderstanding.reviewReady
    }
  });
  return { productUnderstanding, productUXArchitecture };
}

function interfaceInput() {
  const businessTruths = [
    productInput.productDefinition,
    productInput.problem,
    productInput.valueProposition,
    ...productInput.nonNegotiables.slice(0, 3)
  ];
  return {
    id: 'ai-council',
    taskType: 'product-interface',
    productUnderstanding: productInput,
    productUXArchitecture: uxInput,
    inspiration: researchInput,
    intent: thesisInput.intent,
    businessTruths,
    creativeTraits: thesisInput.creativeTraits,
    antiPrinciples: thesisInput.antiPrinciples,
    audience: thesisInput.audience,
    commercialObjective: thesisInput.commercialObjective,
    creativeThesisCandidate: thesisInput.authoredCandidate,
    creativeWorldCandidates: candidateInput.worlds,
    styleFrameMoments: momentsInput.moments,
    assets: [],
    motion: {}
  };
}

test('AI Council Product UX Architecture freezes the canonical product skeleton before visual design', () => {
  const { productUnderstanding, productUXArchitecture } = buildArchitecture();
  assert.equal(productUnderstanding.reviewReady, true, JSON.stringify(productUnderstanding.findings, null, 2));
  assert.equal(productUXArchitecture.reviewReady, true, JSON.stringify(productUXArchitecture.findings, null, 2));
  assert.equal(productUXArchitecture.status, 'ready-for-interface-creative-thesis');
  assert.equal(productUXArchitecture.truth.informationArchitectureFrozen, true);
  assert.equal(productUXArchitecture.truth.visualDesignApproved, false);
  assert.equal(productUXArchitecture.truth.creativeWorldSelected, false);
  assert.equal(productUXArchitecture.shell.centerDominant, true);
  assert.equal(productUXArchitecture.shell.regions.find((region) => region.id === 'conversation-workspace')?.dominance, 'primary');
  assert.equal(productUXArchitecture.shell.regions.find((region) => region.id === 'context-panel')?.collapsible, true);
  assert.deepEqual(productUXArchitecture.screens.map((screen) => screen.id), [
    'project-home',
    'conversation',
    'structured-response',
    'evidence-context',
    'approval',
    'decision-detail',
    'project-memory',
    'mobile-conversation'
  ]);
  assert.equal(productUXArchitecture.reasoningExposure.rawChainOfThoughtAllowed, false);
  assert.deepEqual(productUXArchitecture.contextMemoryModel.userAuthorityActions.map((item) => item.toLowerCase()), ['edit', 'confirm', 'supersede', 'remove']);
});

test('Product UX Architecture rejects infrastructure-first navigation and raw chain-of-thought exposure', () => {
  const { productUnderstanding } = buildArchitecture();
  const broken = buildProductUXArchitecture({
    ...uxInput,
    globalNavigation: ['Projects', 'Agents', 'Models'],
    reasoningExposure: { ...uxInput.reasoningExposure, rawChainOfThoughtAllowed: true },
    productUnderstandingRef: { schema: productUnderstanding.schema, projectId: 'ai-council', reviewReady: true }
  });
  assert.equal(broken.reviewReady, false);
  assert.ok(broken.findings.some((item) => item.code === 'product-ux-infrastructure-primary-nav'));
  assert.ok(broken.findings.some((item) => item.code === 'product-ux-raw-cot-exposure-forbidden'));
});

test('interface creative runtime fails closed before research when UX architecture is weak', () => {
  const input = interfaceInput();
  input.productUXArchitecture = {
    projectId: 'ai-council',
    experiencePrinciple: 'A chat app',
    primaryInteractionModel: 'Chat'
  };
  const output = runInterfaceCreativeRuntime(input);
  assert.equal(output.status, 'blocked');
  assert.deepEqual(output.stages, ['product-understanding', 'product-ux-architecture']);
  assert.equal(output.inspiration, null);
  assert.equal(output.creativeThesis, null);
  assert.equal(output.creativeWorldExploration, null);
  assert.ok(output.findings.some((item) => item.code === 'interface-creative-product-ux-not-ready'));
});

test('interface creative runtime binds downstream creative work to the frozen AI Council architecture', () => {
  const output = runInterfaceCreativeRuntime(interfaceInput());
  const validation = validateInterfaceCreativeOutput(output);
  assert.equal(validation.pass, true, JSON.stringify(validation.failures, null, 2));
  assert.equal(output.productUXArchitecture.reviewReady, true);
  assert.equal(output.stages[0], 'product-understanding');
  assert.equal(output.stages[1], 'product-ux-architecture');
  assert.equal(output.creativeThesis.interfaceArchitectureRef.reviewReady, true);
  assert.equal(output.creativeThesis.interfaceArchitectureRef.informationArchitectureFrozen, true);
  assert.deepEqual(output.creativeThesis.interfaceArchitectureRef.screenIds, uxInput.screens.map((screen) => screen.id));
  assert.equal(output.truth.informationArchitectureFrozenBeforeCreativeWorlds, true);
});
