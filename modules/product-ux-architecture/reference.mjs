import crypto from 'node:crypto';

function canonicalArchitectureShape(architecture = {}) {
  return {
    schema: architecture.schema ?? null,
    projectId: architecture.projectId ?? null,
    experiencePrinciple: architecture.experiencePrinciple ?? null,
    primaryInteractionModel: architecture.primaryInteractionModel ?? null,
    shell: architecture.shell ?? null,
    globalNavigation: architecture.globalNavigation ?? [],
    projectNavigation: architecture.projectNavigation ?? [],
    screens: (architecture.screens ?? []).map((screen) => ({
      id: screen.id,
      purpose: screen.purpose,
      primaryInformation: screen.primaryInformation ?? [],
      secondaryInformation: screen.secondaryInformation ?? [],
      primaryActions: screen.primaryActions ?? [],
      entryPoints: screen.entryPoints ?? [],
      exitPaths: screen.exitPaths ?? [],
      alwaysVisible: screen.alwaysVisible ?? [],
      progressiveDisclosure: screen.progressiveDisclosure ?? [],
      antiPatterns: screen.antiPatterns ?? []
    })),
    responseAnatomy: architecture.responseAnatomy ?? [],
    contextPanelTabs: architecture.contextPanelTabs ?? [],
    visibilityHierarchy: architecture.visibilityHierarchy ?? null,
    progressiveDisclosureContract: architecture.progressiveDisclosureContract ?? [],
    reasoningExposure: architecture.reasoningExposure ?? null,
    contextMemoryModel: architecture.contextMemoryModel ?? null,
    actionGovernance: architecture.actionGovernance ?? null,
    primaryJourneys: architecture.primaryJourneys ?? [],
    nonNegotiables: architecture.nonNegotiables ?? [],
    antiPatterns: architecture.antiPatterns ?? []
  };
}

export function productUXArchitectureFingerprint(architecture = {}) {
  const source = JSON.stringify(canonicalArchitectureShape(architecture));
  return crypto.createHash('sha256').update(source).digest('hex').slice(0, 24);
}

export function buildProductUXArchitectureReference(architecture = {}) {
  return {
    schema: 'ai-studio-os/product-ux-architecture-ref@1',
    projectId: architecture.projectId ?? null,
    fingerprint: productUXArchitectureFingerprint(architecture),
    status: architecture.status ?? null,
    reviewReady: architecture.reviewReady === true,
    informationArchitectureFrozen: architecture.truth?.informationArchitectureFrozen === true,
    screenIds: (architecture.screens ?? []).map((screen) => screen.id)
  };
}

export function sameProductUXArchitectureReference(a, b) {
  return a?.schema === 'ai-studio-os/product-ux-architecture-ref@1'
    && b?.schema === 'ai-studio-os/product-ux-architecture-ref@1'
    && a?.projectId === b?.projectId
    && a?.fingerprint === b?.fingerprint
    && Array.isArray(a?.screenIds)
    && Array.isArray(b?.screenIds)
    && JSON.stringify(a.screenIds) === JSON.stringify(b.screenIds);
}
