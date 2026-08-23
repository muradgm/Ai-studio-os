function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanList(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean))];
}

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

function normalizeEvidence(items = []) {
  return (Array.isArray(items) ? items : []).map((item, index) => ({
    id: clean(item?.id) || `ux-evidence-${index + 1}`,
    sourceType: clean(item?.sourceType) || 'unknown',
    sourceRef: clean(item?.sourceRef),
    claim: clean(item?.claim),
    supports: cleanList(item?.supports)
  })).filter((item) => item.sourceRef && item.claim);
}

function normalizeScreen(screen = {}, index = 0) {
  return {
    id: clean(screen.id) || `screen-${index + 1}`,
    label: clean(screen.label) || `Screen ${index + 1}`,
    purpose: clean(screen.purpose),
    primaryInformation: cleanList(screen.primaryInformation),
    secondaryInformation: cleanList(screen.secondaryInformation),
    primaryActions: cleanList(screen.primaryActions),
    entryPoints: cleanList(screen.entryPoints),
    exitPaths: cleanList(screen.exitPaths),
    alwaysVisible: cleanList(screen.alwaysVisible),
    progressiveDisclosure: cleanList(screen.progressiveDisclosure),
    antiPatterns: cleanList(screen.antiPatterns)
  };
}

function normalizeJourney(journey = {}, index = 0) {
  return {
    id: clean(journey.id) || `journey-${index + 1}`,
    label: clean(journey.label) || `Journey ${index + 1}`,
    goal: clean(journey.goal),
    steps: cleanList(journey.steps),
    successCondition: clean(journey.successCondition)
  };
}

const INFRASTRUCTURE_PRIMARY_NAV = new Set([
  'agents', 'tools', 'models', 'providers', 'routing', 'critic', 'critics',
  'evidence planner', 'intent verification', 'problem formulation'
]);

const REQUIRED_SCREEN_ROLES = [
  'project-home',
  'conversation',
  'structured-response',
  'evidence-context',
  'approval',
  'decision-detail',
  'project-memory',
  'mobile-conversation'
];

const REQUIRED_VISIBILITY_LEVELS = ['level1', 'level2', 'level3', 'level4'];

function hasScreen(report, id) {
  return report.screens?.some((screen) => screen.id === id) === true;
}

export function reviewProductUXArchitecture(report = {}) {
  const findings = [];
  const screens = Array.isArray(report.screens) ? report.screens : [];
  const evidence = Array.isArray(report.evidence) ? report.evidence : [];
  const regions = Array.isArray(report.shell?.regions) ? report.shell.regions : [];

  if (!clean(report.projectId)) findings.push(finding('blocker', 'product-ux-project-missing', 'Product UX Architecture requires a concrete project id.'));
  if (report.productUnderstandingRef?.reviewReady !== true) findings.push(finding('blocker', 'product-ux-product-understanding-not-ready', 'Product UX Architecture requires review-ready Product Understanding.'));
  if (!clean(report.experiencePrinciple)) findings.push(finding('blocker', 'product-ux-principle-missing', 'A governing experience principle is required before interface structure is frozen.'));
  if (!clean(report.primaryInteractionModel)) findings.push(finding('blocker', 'product-ux-primary-interaction-missing', 'The primary interaction model must be explicit.'));

  if (regions.length < 2) findings.push(finding('blocker', 'product-ux-shell-thin', 'The application shell must define its major regions.'));
  if (!regions.some((region) => region.id === 'conversation-workspace' && region.dominance === 'primary')) {
    findings.push(finding('major', 'product-ux-primary-surface-unclear', 'A conversational product should explicitly identify its dominant primary workspace.'));
  }
  const rightPanel = regions.find((region) => region.id === 'context-panel');
  if (rightPanel && rightPanel.collapsible !== true) findings.push(finding('major', 'product-ux-context-panel-not-collapsible', 'Supporting context must not permanently compete with the primary workspace.'));

  if (!Array.isArray(report.globalNavigation) || report.globalNavigation.length < 3) findings.push(finding('major', 'product-ux-global-navigation-thin', 'Global navigation needs a small set of user-goal destinations.'));
  for (const item of report.globalNavigation ?? []) {
    if (INFRASTRUCTURE_PRIMARY_NAV.has(clean(item).toLowerCase())) findings.push(finding('major', 'product-ux-infrastructure-primary-nav', `Infrastructure concept '${item}' should not be primary navigation by default.`, { item }));
  }

  if (screens.length < 6) findings.push(finding('blocker', 'product-ux-screen-model-thin', 'The canonical product skeleton needs enough screens to prove the primary experience.'));
  const screenIds = screens.map((screen) => screen.id);
  if (new Set(screenIds).size !== screenIds.length) findings.push(finding('blocker', 'product-ux-screen-id-duplicate', 'Canonical screen ids must be unique.'));
  for (const required of REQUIRED_SCREEN_ROLES) {
    if (!hasScreen(report, required)) findings.push(finding('major', 'product-ux-required-screen-missing', `Canonical UX proof is missing '${required}'.`, { screenId: required }));
  }
  for (const screen of screens) {
    if (!clean(screen.purpose)) findings.push(finding('major', 'product-ux-screen-purpose-missing', `Screen '${screen.id}' needs a user-facing purpose.`, { screenId: screen.id }));
    if ((screen.primaryInformation?.length ?? 0) < 1) findings.push(finding('major', 'product-ux-screen-primary-information-missing', `Screen '${screen.id}' needs primary information hierarchy.`, { screenId: screen.id }));
    if ((screen.primaryActions?.length ?? 0) < 1) findings.push(finding('major', 'product-ux-screen-actions-missing', `Screen '${screen.id}' needs at least one primary action.`, { screenId: screen.id }));
  }

  for (const level of REQUIRED_VISIBILITY_LEVELS) {
    if (!Array.isArray(report.visibilityHierarchy?.[level]) || report.visibilityHierarchy[level].length < 1) findings.push(finding('major', 'product-ux-visibility-level-missing', `Progressive disclosure hierarchy is missing ${level}.`, { level }));
  }
  if (!Array.isArray(report.progressiveDisclosureContract) || report.progressiveDisclosureContract.length < 3) findings.push(finding('major', 'product-ux-progressive-disclosure-thin', 'Internal capabilities need explicit default visibility rules.'));

  if (!clean(report.contextMemoryModel?.contextDefinition) || !clean(report.contextMemoryModel?.memoryDefinition)) {
    findings.push(finding('major', 'product-ux-context-memory-undifferentiated', 'Context and persistent memory must be distinct concepts in the UX.'));
  }
  const authorityActions = new Set(cleanList(report.contextMemoryModel?.userAuthorityActions).map((item) => item.toLowerCase()));
  for (const action of ['edit', 'confirm', 'supersede', 'remove']) {
    if (!authorityActions.has(action)) findings.push(finding('major', 'product-ux-memory-user-authority-thin', `Project memory should preserve user authority through '${action}'.`, { action }));
  }

  if (report.reasoningExposure?.rawChainOfThoughtAllowed === true) findings.push(finding('blocker', 'product-ux-raw-cot-exposure-forbidden', 'The normal product UX must expose structured conclusions, not raw hidden chain-of-thought.'));
  if (!clean(report.reasoningExposure?.defaultPolicy)) findings.push(finding('major', 'product-ux-reasoning-policy-missing', 'Reasoning exposure needs an explicit default policy.'));

  if (report.actionGovernance?.externalStateChangesRequireApproval !== true) findings.push(finding('major', 'product-ux-action-approval-boundary-missing', 'External state changes should surface explicit approval when governance requires it.'));
  if (!Array.isArray(report.primaryJourneys) || report.primaryJourneys.length < 2) findings.push(finding('major', 'product-ux-primary-journeys-thin', 'At least two primary user journeys should anchor the product skeleton.'));
  for (const journey of report.primaryJourneys ?? []) {
    if ((journey.steps?.length ?? 0) < 3 || !clean(journey.successCondition)) findings.push(finding('major', 'product-ux-journey-incomplete', `Journey '${journey.id}' needs a meaningful path and success condition.`, { journeyId: journey.id }));
  }

  if ((report.nonNegotiables?.length ?? 0) < 4) findings.push(finding('major', 'product-ux-nonnegotiables-thin', 'The UX contract needs enough hard constraints to prevent design drift.'));
  if ((report.antiPatterns?.length ?? 0) < 4) findings.push(finding('major', 'product-ux-antipatterns-thin', 'The UX contract should explicitly reject known failure modes.'));
  if (evidence.length < 3) findings.push(finding('major', 'product-ux-evidence-thin', 'Product UX Architecture should be traceable to product evidence and an authored UX brief.', { count: evidence.length }));
  if (report.authorship?.mode !== 'authored-from-product-truth') findings.push(finding('major', 'product-ux-authorship-required', 'A generic template cannot freeze a product UX architecture without authored product judgment.'));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const status = blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-for-interface-creative-thesis';

  return {
    stage: 'product-ux-architecture-review',
    status,
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    findings,
    truth: {
      informationArchitectureFrozen: blockers.length === 0 && majors.length === 0,
      visualDesignApproved: false,
      typographyApproved: false,
      creativeWorldSelected: false
    }
  };
}

export function buildProductUXArchitecture(input = {}) {
  const report = {
    schema: 'ai-studio-os/product-ux-architecture@1',
    stage: 'product-ux-architecture',
    projectId: clean(input.projectId ?? input.id),
    productUnderstandingRef: structuredClone(input.productUnderstandingRef ?? null),
    experiencePrinciple: clean(input.experiencePrinciple),
    productDescription: clean(input.productDescription),
    primaryInteractionModel: clean(input.primaryInteractionModel),
    shell: {
      centerDominant: input.shell?.centerDominant === true,
      regions: (Array.isArray(input.shell?.regions) ? input.shell.regions : []).map((region) => ({
        id: clean(region.id),
        label: clean(region.label),
        purpose: clean(region.purpose),
        dominance: clean(region.dominance) || 'supporting',
        collapsible: region.collapsible === true,
        defaultVisibility: clean(region.defaultVisibility) || 'visible'
      })).filter((region) => region.id)
    },
    globalNavigation: cleanList(input.globalNavigation),
    projectNavigation: cleanList(input.projectNavigation),
    screens: (Array.isArray(input.screens) ? input.screens : []).map(normalizeScreen),
    responseAnatomy: cleanList(input.responseAnatomy),
    composerCapabilities: cleanList(input.composerCapabilities),
    contextPanelTabs: cleanList(input.contextPanelTabs),
    visibilityHierarchy: {
      level1: cleanList(input.visibilityHierarchy?.level1),
      level2: cleanList(input.visibilityHierarchy?.level2),
      level3: cleanList(input.visibilityHierarchy?.level3),
      level4: cleanList(input.visibilityHierarchy?.level4)
    },
    progressiveDisclosureContract: (Array.isArray(input.progressiveDisclosureContract) ? input.progressiveDisclosureContract : []).map((item) => ({
      capability: clean(item.capability),
      defaultVisibility: clean(item.defaultVisibility),
      surface: clean(item.surface),
      rationale: clean(item.rationale)
    })).filter((item) => item.capability),
    reasoningExposure: {
      defaultPolicy: clean(input.reasoningExposure?.defaultPolicy),
      rawChainOfThoughtAllowed: input.reasoningExposure?.rawChainOfThoughtAllowed === true,
      structuredConclusionExamples: cleanList(input.reasoningExposure?.structuredConclusionExamples)
    },
    contextMemoryModel: {
      contextDefinition: clean(input.contextMemoryModel?.contextDefinition),
      memoryDefinition: clean(input.contextMemoryModel?.memoryDefinition),
      userAuthorityActions: cleanList(input.contextMemoryModel?.userAuthorityActions)
    },
    actionGovernance: {
      externalStateChangesRequireApproval: input.actionGovernance?.externalStateChangesRequireApproval === true,
      approvalInformation: cleanList(input.actionGovernance?.approvalInformation),
      approvalActions: cleanList(input.actionGovernance?.approvalActions)
    },
    primaryJourneys: (Array.isArray(input.primaryJourneys) ? input.primaryJourneys : []).map(normalizeJourney),
    nonNegotiables: cleanList(input.nonNegotiables),
    antiPatterns: cleanList(input.antiPatterns),
    evidence: normalizeEvidence(input.evidence),
    authorship: {
      mode: clean(input.authorship?.mode) || 'deterministic-normalization',
      source: clean(input.authorship?.source) || null
    },
    truth: {
      informationArchitectureFrozen: false,
      visualDesignApproved: false,
      typographyApproved: false,
      creativeWorldSelected: false
    }
  };

  const review = reviewProductUXArchitecture(report);
  return {
    ...report,
    status: review.status,
    pass: review.pass,
    reviewReady: review.reviewReady,
    findings: review.findings,
    truth: {
      ...report.truth,
      ...review.truth
    },
    review
  };
}

export const PRODUCT_UX_REQUIRED_SCREEN_ROLES = REQUIRED_SCREEN_ROLES;
