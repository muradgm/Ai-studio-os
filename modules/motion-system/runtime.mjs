import crypto from 'node:crypto';

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}
function cleanList(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean))];
}
function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}
function hash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 24);
}

export const REQUIRED_OPERATIONAL_STATES = ['loading', 'working', 'reasoning-status', 'execution-progress'];
// Backward-compatible export name. These are operational states, not motion roles.
export const REQUIRED_STATE_CLASSES = REQUIRED_OPERATIONAL_STATES;
export const ALLOWED_OPERATIONAL_STATES = ['none', ...REQUIRED_OPERATIONAL_STATES];
export const REQUIRED_MOTION_ROLES = [
  'none',
  'content-transition',
  'context-registration',
  'evidence-registration',
  'coordination-transition',
  'comparison-transition',
  'authority-transition',
  'verification-transition',
  'result-transition',
  'failure-transition',
  'lineage-transition',
  'memory-transition',
  'navigation-transition'
];
export const REQUIRED_MOTION_PRIMITIVES = [
  'message-submission',
  'task-understanding',
  'project-context-loading',
  'evidence-acquisition',
  'council-review',
  'strategy-comparison',
  'long-running-work',
  'structured-answer-reveal',
  'verification',
  'critic-interruption',
  'approval-boundary',
  'execution',
  'validation',
  'success',
  'failure',
  'decision-lineage',
  'memory-update',
  'panel-transition',
  'mobile-navigation',
  'reduced-motion'
];

const BANNED_COPY = /thinking deeply|neural pathways|consulting \d+ agents|chain[- ]of[- ]thought|internal thoughts|fake progress|analyzing neural/i;

function stableFingerprint(system) {
  return hash({
    schema: system.schema,
    projectId: system.projectId,
    id: system.id,
    selectedWorldRef: system.selectedWorldRef,
    visualSystemCandidateRef: system.visualSystemCandidateRef,
    governingIdea: system.governingIdea,
    coreRule: system.coreRule,
    sourceResponsibilities: system.sourceResponsibilities,
    stateClasses: system.stateClasses,
    speedHierarchy: system.speedHierarchy,
    runtimeEvidencePolicy: system.runtimeEvidencePolicy,
    eventTaxonomyRef: system.eventTaxonomyRef,
    eventVocabulary: system.eventVocabulary,
    primitives: system.primitives,
    canonicalScreenBindings: system.canonicalScreenBindings,
    proofScenarios: system.proofScenarios,
    antiPatterns: system.antiPatterns
  });
}

function normalizeEvents(events = []) {
  return (Array.isArray(events) ? events : []).map((event, index) => {
    if (typeof event === 'string') return { id: event, status: 'active', sequence: index };
    return {
      id: clean(event?.id),
      status: clean(event?.status) || 'active',
      sequence: Number.isFinite(event?.sequence) ? event.sequence : index,
      operationId: clean(event?.operationId) || null,
      participant: clean(event?.participant) || null,
      label: clean(event?.label) || null,
      deterministicProgress: event?.deterministicProgress === true,
      completed: event?.completed === true || event?.status === 'completed'
    };
  }).filter((event) => event.id);
}

function resolveEventTaxonomy(rawEvents, taxonomy, findings) {
  if (taxonomy?.schema !== 'ai-studio-os/motion-event-taxonomy@1') {
    findings.push(finding('blocker', 'motion-system-taxonomy-schema-invalid', 'Motion System requires ai-studio-os/motion-event-taxonomy@1 before production integration.'));
    return rawEvents.map(({ class: _legacyClass, ...event }) => ({ ...event, operationalState: 'none', motionRole: 'none' }));
  }
  if (clean(taxonomy.motionSystemId) === '' || clean(taxonomy.motionSystemId) !== clean(taxonomy.__expectedMotionSystemId)) {
    findings.push(finding('blocker', 'motion-system-taxonomy-system-mismatch', 'Motion event taxonomy must reference the exact Motion System id.', {
      expected: taxonomy.__expectedMotionSystemId ?? null,
      received: taxonomy.motionSystemId ?? null
    }));
  }

  const semanticRows = Array.isArray(taxonomy.events) ? taxonomy.events : [];
  const semanticIds = semanticRows.map((row) => clean(row?.id)).filter(Boolean);
  if (semanticIds.length !== new Set(semanticIds).size) {
    findings.push(finding('blocker', 'motion-system-taxonomy-event-duplicate', 'Motion event taxonomy ids must be unique.'));
  }
  const rawIds = rawEvents.map((event) => clean(event?.id)).filter(Boolean);
  if (JSON.stringify([...semanticIds].sort()) !== JSON.stringify([...rawIds].sort())) {
    findings.push(finding('blocker', 'motion-system-taxonomy-coverage-mismatch', 'Motion event taxonomy must cover exactly the authored event vocabulary.', {
      authoredEventIds: rawIds,
      taxonomyEventIds: semanticIds
    }));
  }

  const semantics = new Map(semanticRows.map((row) => [clean(row?.id), row]));
  const resolved = rawEvents.map((raw) => {
    const row = semantics.get(clean(raw?.id)) ?? {};
    const operationalState = clean(row.operationalState);
    const motionRole = clean(row.motionRole);
    if (!ALLOWED_OPERATIONAL_STATES.includes(operationalState)) {
      findings.push(finding('blocker', 'motion-system-operational-state-invalid', 'Each event must map to none or one of the four operational states.', {
        eventId: raw?.id ?? null,
        operationalState: row.operationalState ?? null
      }));
    }
    if (!REQUIRED_MOTION_ROLES.includes(motionRole)) {
      findings.push(finding('blocker', 'motion-system-motion-role-invalid', 'Each event must map to a known orthogonal motion role.', {
        eventId: raw?.id ?? null,
        motionRole: row.motionRole ?? null
      }));
    }
    const { class: _legacyClass, ...canonical } = raw ?? {};
    return { ...canonical, operationalState, motionRole };
  });

  const byId = new Map(resolved.map((event) => [event.id, event]));
  const requiredSemantics = [
    ['approval-required', 'none', 'authority-transition'],
    ['ui-project-navigation-opened', 'none', 'navigation-transition'],
    ['evidence-source-added', 'working', 'evidence-registration'],
    ['validation-started', 'execution-progress', 'none'],
    ['execution-completed', 'none', 'lineage-transition']
  ];
  for (const [eventId, operationalState, motionRole] of requiredSemantics) {
    const event = byId.get(eventId);
    if (!event || event.operationalState !== operationalState || event.motionRole !== motionRole) {
      findings.push(finding('blocker', 'motion-system-semantic-assertion-failed', 'Motion event taxonomy violates an authority/navigation/provenance semantic invariant.', {
        eventId,
        expected: { operationalState, motionRole },
        received: event ? { operationalState: event.operationalState, motionRole: event.motionRole } : null
      }));
    }
  }
  return resolved;
}

export function buildMotionSystem(input = {}, {
  selection = null,
  visualSystemId = null,
  architectureRef = null,
  fixtureRef = null,
  taxonomy = null
} = {}) {
  const system = structuredClone(input ?? {});
  const findings = [];

  if (system.schema !== 'ai-studio-os/motion-system@1') {
    findings.push(finding('blocker', 'motion-system-schema-invalid', 'Motion System must use ai-studio-os/motion-system@1.'));
  }
  if (!clean(system.projectId) || !clean(system.id)) {
    findings.push(finding('blocker', 'motion-system-identity-invalid', 'Motion System requires projectId and id.'));
  }
  if (selection?.truth?.humanWorldSelectionConfirmed !== true
    || selection?.truth?.creativeWorldExplorationClosed !== true
    || selection?.selectedWorld?.id !== system.selectedWorldRef?.id) {
    findings.push(finding('blocker', 'motion-system-selected-world-not-authoritative', 'Motion System requires the human-selected Hybrid world and closed Creative World exploration.'));
  }
  if (visualSystemId && clean(system.visualSystemCandidateRef?.id) !== clean(visualSystemId)) {
    findings.push(finding('blocker', 'motion-system-visual-system-ref-mismatch', 'Motion System must bind to the current Visual System candidate.', { expected: visualSystemId, received: system.visualSystemCandidateRef?.id ?? null }));
  }
  if (architectureRef?.fingerprint !== selection?.proofRef?.architectureFingerprint
    || fixtureRef?.fingerprint !== selection?.proofRef?.canonicalFixtureFingerprint) {
    findings.push(finding('blocker', 'motion-system-product-proof-stale', 'Motion System must remain bound to the architecture and fixture used for human world selection.'));
  }

  if (!clean(system.governingIdea) || !clean(system.coreRule)) {
    findings.push(finding('major', 'motion-system-governing-rule-missing', 'Motion System requires a governing idea and truth-first core rule.'));
  }

  for (const operationalState of REQUIRED_OPERATIONAL_STATES) {
    if (!system.stateClasses?.[operationalState]) findings.push(finding('major', 'motion-system-state-class-missing', 'Motion System is missing one of the four required operational states.', { operationalState }));
  }

  const speed = system.speedHierarchy ?? {};
  for (const token of ['microInteractionMs', 'contentTransitionMs', 'contextLineageMs', 'authorityTransitionMs']) {
    const range = speed[token];
    if (!Array.isArray(range) || range.length !== 2 || !range.every(Number.isFinite) || range[0] < 0 || range[1] < range[0]) {
      findings.push(finding('major', 'motion-system-speed-token-invalid', 'Motion System speed hierarchy contains an invalid range.', { token, range }));
    }
  }
  if (!Number.isFinite(speed.workingMessageMinDwellMs) || speed.workingMessageMinDwellMs < 900) {
    findings.push(finding('major', 'motion-system-working-cadence-too-fast', 'Working status copy must not churn rapidly; minimum dwell must be at least 900ms.'));
  }

  const policy = system.runtimeEvidencePolicy ?? {};
  const requiredTruthFlags = [
    ['statusClaimsRequireRuntimeEvent', true],
    ['specialistNamesRequireParticipantEvent', true],
    ['completedMarksRequireCompletedEvent', true],
    ['unknownProgressUsesPercentage', false],
    ['percentAllowedOnlyWhenDeterministic', true],
    ['rawChainOfThoughtAllowed', false],
    ['simulatedAgentDialogueAllowed', false],
    ['simulatedInternalThoughtAllowed', false]
  ];
  for (const [key, expected] of requiredTruthFlags) {
    if (policy[key] !== expected) findings.push(finding('blocker', 'motion-system-runtime-truth-policy-invalid', 'Motion System runtime-evidence policy would permit misleading activity.', { key, expected, received: policy[key] }));
  }

  const rawEvents = Array.isArray(system.eventVocabulary) ? system.eventVocabulary : [];
  const rawEventIds = rawEvents.map((event) => clean(event?.id)).filter(Boolean);
  if (rawEventIds.length !== new Set(rawEventIds).size) findings.push(finding('blocker', 'motion-system-event-id-duplicate', 'Motion event vocabulary ids must be unique.'));
  for (const event of rawEvents) {
    if (!clean(event?.copy) || BANNED_COPY.test(clean(event?.copy))) findings.push(finding('blocker', 'motion-system-event-copy-invalid', 'Motion event copy is missing or simulates hidden thought.', { eventId: event?.id ?? null, copy: event?.copy ?? null }));
  }

  const taxonomyInput = structuredClone(taxonomy ?? {});
  taxonomyInput.__expectedMotionSystemId = system.id;
  system.eventVocabulary = resolveEventTaxonomy(rawEvents, taxonomyInput, findings);
  system.eventTaxonomyRef = taxonomy?.schema === 'ai-studio-os/motion-event-taxonomy@1' ? {
    schema: taxonomy.schema,
    motionSystemId: taxonomy.motionSystemId,
    fingerprint: hash({ events: taxonomy.events, operationalStates: taxonomy.operationalStates, motionRoles: taxonomy.motionRoles }),
    runtimeTaxonomyResolved: taxonomy.truth?.motionRuntimeTaxonomyResolved === true
  } : null;
  if (system.eventTaxonomyRef?.runtimeTaxonomyResolved !== true) {
    findings.push(finding('blocker', 'motion-system-runtime-taxonomy-unresolved', 'Motion production integration is blocked until operationalState and motionRole taxonomy is explicitly resolved.'));
  }

  const eventIds = system.eventVocabulary.map((event) => event.id);
  const primitives = Array.isArray(system.primitives) ? system.primitives : [];
  const primitiveIds = primitives.map((primitive) => clean(primitive?.id)).filter(Boolean);
  for (const id of REQUIRED_MOTION_PRIMITIVES) {
    if (!primitiveIds.includes(id)) findings.push(finding('major', 'motion-system-primitive-missing', 'Motion System is missing a required AI Council primitive.', { primitiveId: id }));
  }
  if (primitiveIds.length !== new Set(primitiveIds).size) findings.push(finding('blocker', 'motion-system-primitive-id-duplicate', 'Motion primitive ids must be unique.'));

  for (const primitive of primitives) {
    const id = clean(primitive?.id);
    if (!['counterpoint', 'decision-spine', 'threshold'].includes(clean(primitive?.owner))) {
      findings.push(finding('major', 'motion-system-owner-invalid', 'Every primitive must inherit one Hybrid source responsibility.', { primitiveId: id, owner: primitive?.owner ?? null }));
    }
    const duration = primitive?.durationMs;
    if (!Array.isArray(duration) || duration.length !== 2 || !duration.every(Number.isFinite) || duration[0] < 0 || duration[1] < duration[0]) {
      findings.push(finding('major', 'motion-system-duration-invalid', 'Motion primitive requires a valid duration range.', { primitiveId: id, duration }));
    }
    if (!clean(primitive?.behavior) || !clean(primitive?.reducedMotion)) findings.push(finding('major', 'motion-system-primitive-behavior-thin', 'Motion primitive requires normal and reduced-motion behavior.', { primitiveId: id }));
    const evidence = primitive?.runtimeEvidence ?? {};
    if (id !== 'reduced-motion' && evidence.required !== true) findings.push(finding('blocker', 'motion-system-runtime-evidence-not-required', 'All state-claiming motion primitives must require runtime evidence.', { primitiveId: id }));
    for (const eventId of cleanList(evidence.eventIds)) {
      if (!eventIds.includes(eventId)) findings.push(finding('major', 'motion-system-primitive-event-unknown', 'Primitive references an unknown runtime event.', { primitiveId: id, eventId }));
    }
  }

  const expectedScreens = cleanList(fixtureRef?.screenIds);
  const bindings = Array.isArray(system.canonicalScreenBindings) ? system.canonicalScreenBindings : [];
  const boundScreens = cleanList(bindings.map((binding) => binding?.screenId));
  if (JSON.stringify(boundScreens) !== JSON.stringify(expectedScreens)) {
    findings.push(finding('blocker', 'motion-system-canonical-screen-drift', 'Motion System must bind to exactly the frozen canonical screen set.', { expectedScreens, boundScreens }));
  }
  for (const binding of bindings) {
    for (const primitiveId of cleanList(binding?.primitiveIds)) {
      if (!primitiveIds.includes(primitiveId)) findings.push(finding('major', 'motion-system-screen-binding-unknown-primitive', 'Canonical screen binding references an unknown primitive.', { screenId: binding?.screenId ?? null, primitiveId }));
    }
  }

  const scenarios = Array.isArray(system.proofScenarios) ? system.proofScenarios : [];
  if (scenarios.length < 8) findings.push(finding('major', 'motion-system-proof-scenarios-thin', 'Motion System requires canonical-screen and real-runtime-state proof scenarios.'));
  if (!scenarios.some((scenario) => scenario?.reducedMotion === true)) findings.push(finding('major', 'motion-system-reduced-motion-proof-missing', 'Motion System requires a reduced-motion equivalence proof scenario.'));
  for (const scenario of scenarios) {
    if (!expectedScreens.includes(clean(scenario?.screenId))) findings.push(finding('major', 'motion-system-proof-screen-invalid', 'Motion proof scenario references a non-canonical screen.', { scenarioId: scenario?.id ?? null, screenId: scenario?.screenId ?? null }));
    for (const eventId of cleanList(scenario?.events)) {
      if (!eventIds.includes(eventId)) findings.push(finding('major', 'motion-system-proof-event-unknown', 'Motion proof scenario references an unknown runtime event.', { scenarioId: scenario?.id ?? null, eventId }));
    }
  }

  const antiPatterns = cleanList(system.antiPatterns);
  for (const required of ['fake percentage completion', 'fake internal thoughts', 'simulated agent conversations', 'celebratory confetti']) {
    if (!antiPatterns.some((item) => item.toLowerCase().includes(required))) findings.push(finding('major', 'motion-system-anti-pattern-missing', 'Motion System is missing a required deception/noise ban.', { required }));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const reviewReady = blockers.length === 0 && majors.length === 0;
  const motionSystemFingerprint = stableFingerprint(system);

  return {
    ...system,
    motionSystemFingerprint,
    status: reviewReady ? 'ready-for-motion-browser-proof' : blockers.length ? 'blocked' : 'provisional',
    pass: blockers.length === 0,
    reviewReady,
    findings,
    architectureRef: structuredClone(architectureRef ?? null),
    canonicalFixtureRef: structuredClone(fixtureRef ?? null),
    proofRequirements: {
      canonicalScreens: expectedScreens,
      scenarioCount: scenarios.length,
      exactChromiumMotionProof: true,
      reducedMotionEquivalence: true,
      runtimeEventEvidence: true,
      orthogonalRuntimeTaxonomy: true,
      productionRuntimeAdaptersRequiredBeforeRelease: true
    },
    truth: {
      humanMotionApproval: false,
      motionRuntimeTaxonomyResolved: system.eventTaxonomyRef?.runtimeTaxonomyResolved === true,
      exactBrowserMotionProofComplete: false,
      reducedMotionProofComplete: false,
      runtimeEventAdaptersImplemented: false,
      finalVisualSystemApproved: false
    }
  };
}

export function validateMotionPresentation(system, primitiveId, runtimeEvents = []) {
  const primitive = system?.primitives?.find?.((item) => item?.id === primitiveId) ?? null;
  const findings = [];
  if (!primitive) {
    findings.push(finding('blocker', 'motion-presentation-primitive-missing', 'Unknown Motion System primitive.', { primitiveId }));
    return { pass: false, findings, primitive: null, matchedEvents: [] };
  }
  const events = normalizeEvents(runtimeEvents);
  const allowed = new Set(cleanList(primitive.runtimeEvidence?.eventIds));
  const matchedEvents = events.filter((event) => allowed.has(event.id));
  if (primitive.runtimeEvidence?.required === true && matchedEvents.length === 0) {
    findings.push(finding('blocker', 'motion-presentation-runtime-evidence-missing', 'Motion/status claim cannot render without a matching runtime event.', { primitiveId, expectedAnyOf: [...allowed] }));
  }
  if (events.some((event) => event.participant) && system.runtimeEvidencePolicy?.specialistNamesRequireParticipantEvent !== true) {
    findings.push(finding('blocker', 'motion-presentation-participant-policy-invalid', 'Specialist activity cannot be shown without participant-event truth policy.'));
  }
  const pass = !findings.some((item) => item.severity === 'blocker');
  return { pass, findings, primitive: structuredClone(primitive), matchedEvents };
}

export function deriveWorkingStatus(system, runtimeEvents = []) {
  const events = normalizeEvents(runtimeEvents).sort((a, b) => a.sequence - b.sequence);
  const vocabulary = new Map((system?.eventVocabulary ?? []).map((event) => [event.id, event]));
  const operationalEvents = events.filter((event) => {
    const spec = vocabulary.get(event.id);
    return spec && spec.operationalState && spec.operationalState !== 'none';
  });
  const current = [...operationalEvents].reverse().find((event) => !event.completed) ?? null;
  if (!current) {
    return {
      status: 'idle',
      current: null,
      completed: operationalEvents.filter((event) => event.completed).map((event) => ({
        eventId: event.id,
        copy: vocabulary.get(event.id)?.copy ?? event.id,
        operationalState: vocabulary.get(event.id)?.operationalState ?? 'none'
      }))
    };
  }
  const spec = vocabulary.get(current.id);
  const copy = current.label || spec.copy;
  return {
    status: 'active',
    current: {
      eventId: current.id,
      copy,
      operationalState: spec.operationalState,
      participant: current.participant,
      operationId: current.operationId
    },
    completed: operationalEvents.filter((event) => event.completed).map((event) => ({
      eventId: event.id,
      copy: vocabulary.get(event.id)?.copy ?? event.id,
      operationalState: vocabulary.get(event.id)?.operationalState ?? 'none'
    }))
  };
}

export function deriveMotionRole(system, runtimeEvents = []) {
  const events = normalizeEvents(runtimeEvents).sort((a, b) => a.sequence - b.sequence);
  const vocabulary = new Map((system?.eventVocabulary ?? []).map((event) => [event.id, event]));
  const event = [...events].reverse().find((candidate) => {
    const spec = vocabulary.get(candidate.id);
    return spec && spec.motionRole && spec.motionRole !== 'none';
  }) ?? null;
  if (!event) return null;
  const spec = vocabulary.get(event.id);
  return {
    eventId: event.id,
    motionRole: spec.motionRole,
    copy: event.label || spec.copy,
    sequence: event.sequence,
    participant: event.participant,
    operationId: event.operationId
  };
}

export function deriveMotionPresentationState(system, runtimeEvents = []) {
  return {
    operational: deriveWorkingStatus(system, runtimeEvents),
    transition: deriveMotionRole(system, runtimeEvents)
  };
}
