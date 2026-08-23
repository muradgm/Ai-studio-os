import { buildProductUnderstanding } from '../modules/product-understanding/runtime.mjs';
import { buildProductUXArchitecture } from '../modules/product-ux-architecture/runtime.mjs';
import { runCreativeRuntime } from './creative-runtime.mjs';

function architectureRef(architecture) {
  if (!architecture) return null;
  return {
    schema: architecture.schema ?? null,
    projectId: architecture.projectId ?? null,
    status: architecture.status ?? null,
    reviewReady: architecture.reviewReady === true,
    screenIds: (architecture.screens ?? []).map((screen) => screen.id),
    informationArchitectureFrozen: architecture.truth?.informationArchitectureFrozen === true
  };
}

export function runInterfaceCreativeRuntime(input = {}) {
  const productUnderstanding = buildProductUnderstanding({
    ...(input.productUnderstanding ?? {}),
    projectId: input.id ?? input.productUnderstanding?.projectId
  });

  if (!productUnderstanding.reviewReady) {
    return {
      id: input.id,
      taskType: input.taskType,
      status: 'blocked',
      stages: ['product-understanding'],
      productUnderstanding,
      productUXArchitecture: null,
      inspiration: null,
      creativeThesis: null,
      creativeWorldExploration: null,
      styleFrameProof: null,
      selectedCreativeWorld: null,
      creativeDirection: null,
      design: null,
      image: null,
      motion: null,
      findings: [{
        severity: 'blocker',
        code: 'interface-creative-product-understanding-not-ready',
        message: 'Interface architecture cannot be frozen until Product Understanding is review-ready.'
      }]
    };
  }

  const productUXArchitecture = buildProductUXArchitecture({
    ...(input.productUXArchitecture ?? {}),
    projectId: input.id ?? input.productUXArchitecture?.projectId,
    productUnderstandingRef: {
      schema: productUnderstanding.schema,
      projectId: productUnderstanding.projectId,
      sourceProject: productUnderstanding.sourceProject,
      sourceRevision: productUnderstanding.sourceRevision,
      reviewReady: productUnderstanding.reviewReady
    }
  });

  if (!productUXArchitecture.reviewReady) {
    return {
      id: input.id,
      taskType: input.taskType,
      status: 'blocked',
      stages: ['product-understanding', 'product-ux-architecture'],
      productUnderstanding,
      productUXArchitecture,
      inspiration: null,
      creativeThesis: null,
      creativeWorldExploration: null,
      styleFrameProof: null,
      selectedCreativeWorld: null,
      creativeDirection: null,
      design: null,
      image: null,
      motion: null,
      findings: [{
        severity: 'blocker',
        code: 'interface-creative-product-ux-not-ready',
        message: 'Research, Creative Thesis, Creative Worlds, and visual direction are blocked until Product UX Architecture is review-ready.'
      }]
    };
  }

  const creative = runCreativeRuntime(input);
  const ref = architectureRef(productUXArchitecture);
  const stages = [...creative.stages];
  const productIndex = stages.indexOf('product-understanding');
  if (!stages.includes('product-ux-architecture')) stages.splice(productIndex >= 0 ? productIndex + 1 : 0, 0, 'product-ux-architecture');

  return {
    ...creative,
    stages,
    productUnderstanding,
    productUXArchitecture,
    creativeThesis: creative.creativeThesis ? {
      ...creative.creativeThesis,
      interfaceArchitectureRef: ref
    } : null,
    interfaceArchitectureRef: ref,
    truth: {
      ...(creative.truth ?? {}),
      informationArchitectureFrozenBeforeCreativeWorlds: true
    }
  };
}

export function validateInterfaceCreativeOutput(output = {}) {
  const failures = [];
  if (output.productUnderstanding?.reviewReady !== true) failures.push('product understanding is not review-ready');
  if (output.productUXArchitecture?.reviewReady !== true) failures.push('product UX architecture is not review-ready');
  if (output.productUXArchitecture?.truth?.informationArchitectureFrozen !== true) failures.push('information architecture is not frozen');
  if (!output.stages?.includes('product-ux-architecture')) failures.push('product UX architecture stage is missing');
  if (output.creativeThesis && output.creativeThesis.interfaceArchitectureRef?.reviewReady !== true) failures.push('creative thesis is not bound to review-ready interface architecture');
  return { pass: failures.length === 0, failures };
}
