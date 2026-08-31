const DOMAIN_IDS = Object.freeze([
  'editorial-and-information-design',
  'architecture-and-spatial-experience',
  'industrial-and-product-design',
  'film-and-cinematography',
  'photography-and-visual-framing',
  'music-and-rhythm',
  'interaction-and-hci',
  'visual-perception-and-cognition'
]);

const CONSTITUTION = Object.freeze({
  knowledgeIsAuthority: false,
  referenceIsDirection: false,
  patternIsSolution: false,
  trendIsJustification: false,
  technologyIsConcept: false,
  criticScoreIsSelection: false
});

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function finding(code, message, evidence = {}) {
  return { severity: 'blocker', code, message, evidence };
}

export const CREATIVE_KNOWLEDGE_GENERALIST_V1_CHARTER = Object.freeze({
  schema: 'ai-studio-os/creative-knowledge-generalist-charter@1',
  corpusId: 'creative-knowledge-generalist-v1',
  corpusVersion: 'creative-knowledge-generalist-v1',
  status: 'pre-registered',
  scope: 'general',
  purpose: 'Provide a durable cross-domain creative reasoning substrate that AI Studio OS can retrieve from for project-specific Transfer and Synthesis without treating knowledge as creative authority.',
  constitution: CONSTITUTION,
  entryContract: {
    schema: 'ai-studio-os/creative-knowledge-entry@1',
    kind: 'principle',
    scope: 'general',
    requiredFields: [
      'id', 'kind', 'domain', 'title', 'definition', 'causalRationale', 'perceptualEffects', 'worksWhen', 'failsWhen',
      'creativeVariables', 'crossDomainApplications', 'failureModes', 'counterexamples', 'diagnostics', 'relationships',
      'provenance', 'confidence', 'confidenceBasis', 'scope', 'transferability'
    ],
    requiredTransferFields: ['transferablePrinciples', 'surfaceSignature', 'mustStrip', 'adaptationRules', 'copyRisks'],
    prohibitedKinds: ['project-observation', 'benchmark-learning', 'human-preference', 'current-trend'],
    minimumConfidence: 0.7,
    maximumConfidence: 0.9
  },
  domains: DOMAIN_IDS,
  plannedEntriesPerDomain: 3,
  plannedEntryCount: 24,
  sourceQuality: {
    allowedClassesInPriorityOrder: [
      'peer-reviewed-research',
      'academic-or-institutional-publication',
      'authoritative-professional-standard-or-documented-theory',
      'established-book-or-text-with-bibliographic-locator',
      'first-party-recognized-practitioner-or-institution-writing'
    ],
    forbiddenPrimaryEvidence: [
      'seo-blog', 'generic-design-listicle', 'marketing-page', 'unsourced-medium-post', 'ai-generated-summary',
      'pinterest-or-reference-aggregator', 'current-benchmark-artifact', 'ai-studio-os-fixture-or-test', 'prior-generated-dogfood-knowledge'
    ],
    minimumIndependentSourceIdentitiesPerDomain: 2,
    noSingleSourceMayDominateDomain: true
  },
  provenanceRequirements: [
    'sourceId', 'sourceType', 'sourceRef', 'title', 'authorOrOrganization', 'publishedAt', 'capturedAt', 'evidenceLocator', 'provenanceNote'
  ],
  provenanceRules: {
    externalResolutionRequiredWherePossible: true,
    internalSourceRefForbidden: true,
    copiedSourcePassagesForbidden: true
  },
  confidenceRubric: {
    '0.90': 'Multiple strong independent sources and a well-bounded causal claim.',
    '0.80': 'Strong primary or authoritative source plus supporting evidence, with known context dependency.',
    '0.70': 'Credible documented principle with meaningful supporting evidence but wider uncertainty or domain dependence.',
    belowMinimum: 'Do not include in Generalist V1.',
    certaintyOneForbidden: true
  },
  diversityRules: {
    distinctCausalMechanismsPerDomain: true,
    avoidCrossCorpusConceptDuplication: true,
    permittedRelationshipTypes: ['reinforces', 'conflicts-with', 'depends-on', 'qualifies', 'counterexample-to', 'derived-from']
  },
  contaminationFirewall: {
    activeProjectTargetingForbidden: true,
    forbiddenTerms: ['benchmark-011', 'after-matter', 'friction-index'],
    forbiddenInputs: [
      'benchmark-011-project-truths', 'benchmark-011-creative-thesis', 'friction-index', 'condition-d-needs',
      'after-matter-brief', 'current-motion-hypotheses', 'expected-benchmark-scoring-dimensions'
    ]
  },
  retrievalNeutrality: {
    preselectedBenchmarkKnowledgeIdsForbidden: true,
    benchmarkEligibilityFlagForbidden: true,
    projectSpecificEligibilityMappingForbidden: true,
    futureRetrievalMustUseExistingGraphAndRetrievalContracts: true
  },
  populationProtocol: [
    'research-sources-under-this-charter', 'create-source-manifest-records', 'author-exactly-24-principles',
    'build-creative-intelligence-foundation', 'build-creative-knowledge-graph', 'review-every-entry',
    'freeze-corpus-library-and-graph-fingerprints', 'test-provenance', 'run-retrieval-neutrality-smoke-tests',
    'merge-before-benchmark-011-resumes'
  ],
  futureFreezeContract: [
    'corpusId', 'corpusVersion', 'entryCount', 'domainCounts', 'entryIds', 'sourceManifestFingerprint',
    'knowledgeLibraryFingerprint', 'foundationSnapshotFingerprint', 'knowledgeGraphFingerprint', 'createdAt', 'frozenAt', 'truth'
  ],
  futureFreezeTruth: {
    generalPurpose: true,
    benchmarkTailored: false,
    projectAuthority: false,
    creativeAuthority: false,
    productionAuthority: false
  },
  truth: {
    populated: false,
    knowledgeLibraryCreated: false,
    benchmark011Touched: false,
    providerCallsMade: false,
    projectAuthority: false,
    creativeAuthority: false,
    productionAuthority: false
  }
});

export function buildCreativeKnowledgeGeneralistV1Charter() {
  return copy(CREATIVE_KNOWLEDGE_GENERALIST_V1_CHARTER);
}

export function reviewCreativeKnowledgeGeneralistV1Charter(candidate = {}) {
  const expected = CREATIVE_KNOWLEDGE_GENERALIST_V1_CHARTER;
  const findings = [];

  for (const [field, value] of Object.entries(expected)) {
    if (!sameValue(candidate?.[field], value)) {
      findings.push(finding('creative-knowledge-generalist-charter-drift', 'The Generalist V1 charter must match its pre-registered canonical contract exactly.', { field }));
    }
  }
  for (const field of Object.keys(candidate && typeof candidate === 'object' ? candidate : {})) {
    if (!Object.hasOwn(expected, field)) {
      findings.push(finding('creative-knowledge-generalist-charter-unknown-field', 'The Generalist V1 charter cannot add unreviewed fields during pre-registration.', { field }));
    }
  }

  return {
    schema: 'ai-studio-os/creative-knowledge-generalist-charter-review@1',
    pass: findings.length === 0,
    findings,
    truth: {
      knowledgeAuthorityCreated: false,
      creativeAuthorityCreated: false,
      productionAuthorityCreated: false
    }
  };
}
