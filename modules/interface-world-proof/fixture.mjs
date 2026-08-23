import crypto from 'node:crypto';
import { sameProductUXArchitectureReference } from '../product-ux-architecture/reference.mjs';

const STATUS_TAXONOMY = {
  decisionLifecycle: ['Active', 'Superseded', 'Rejected'],
  memoryVerification: ['Confirmed', 'Proposed', 'Disputed'],
  confidence: ['High', 'Medium', 'Low'],
  authority: ['Advisory', 'Approval required', 'Authorized']
};

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanList(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean))];
}

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function fingerprint(value) {
  return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex').slice(0, 24);
}

export function expectedMemoryActions(item = {}) {
  const lifecycle = clean(item.lifecycle);
  const verification = clean(item.verification);
  if (lifecycle === 'Superseded') return ['View replacement', 'Restore / reopen if permitted'];
  if (verification === 'Proposed') return ['Confirm', 'Reject', 'Edit'];
  if (verification === 'Disputed') return ['Review evidence', 'Resolve', 'Remove from active memory'];
  if (verification === 'Confirmed') return ['Edit', 'Supersede', 'Remove from active memory'];
  return [];
}

function sameList(a = [], b = []) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function buildCanonicalInterfaceFixture(input = {}, { architectureRef = null } = {}) {
  const fixture = structuredClone(input ?? {});
  const findings = [];

  if (fixture.schema !== 'ai-studio-os/canonical-interface-fixture@1') {
    findings.push(finding('blocker', 'canonical-interface-fixture-schema-invalid', 'Canonical interface fixture must use ai-studio-os/canonical-interface-fixture@1.'));
  }
  if (!clean(fixture.projectId) || !clean(fixture.fixtureId) || !Number.isInteger(fixture.version) || fixture.version < 1) {
    findings.push(finding('blocker', 'canonical-interface-fixture-identity-invalid', 'Canonical interface fixture requires projectId, fixtureId, and a positive integer version.'));
  }

  const screenIds = cleanList(fixture.canonicalScreenIds);
  if (screenIds.length < 4) findings.push(finding('blocker', 'canonical-interface-fixture-screen-set-thin', 'Canonical interface fixture requires the complete frozen screen set.', { count: screenIds.length }));
  if (architectureRef?.screenIds && !sameList(screenIds, architectureRef.screenIds)) {
    findings.push(finding('blocker', 'canonical-interface-fixture-architecture-screen-drift', 'Canonical fixture screen ids must exactly match the current frozen Product UX Architecture.', { fixtureScreenIds: screenIds, architectureScreenIds: architectureRef.screenIds }));
  }

  const activeThreadId = clean(fixture.activeThread?.id);
  const contextThreadId = clean(fixture.currentContext?.threadId);
  if (!activeThreadId || activeThreadId !== contextThreadId) {
    findings.push(finding('blocker', 'canonical-interface-fixture-context-thread-mismatch', 'Active conversation and current context must refer to the same canonical task thread.', { activeThreadId: activeThreadId || null, contextThreadId: contextThreadId || null }));
  }
  if (!clean(fixture.activeThread?.topic) || !clean(fixture.currentContext?.label) || !clean(fixture.currentContext?.goal)) {
    findings.push(finding('major', 'canonical-interface-fixture-context-thin', 'Canonical fixture requires an explicit task topic, context label, and goal so screenshots cannot imply the wrong context.'));
  }
  if (!clean(fixture.conversation?.userQuestion) || !clean(fixture.conversation?.answer) || !clean(fixture.conversation?.recommendation)) {
    findings.push(finding('blocker', 'canonical-interface-fixture-conversation-thin', 'Canonical fixture requires the exact user question, answer, and recommendation used across worlds.'));
  }

  for (const [dimension, expected] of Object.entries(STATUS_TAXONOMY)) {
    const actual = cleanList(fixture.statusTaxonomy?.[dimension]?.values);
    if (!sameList(actual, expected)) findings.push(finding('blocker', 'canonical-interface-fixture-status-taxonomy-drift', 'Lifecycle, verification, confidence, and authority must remain separate canonical dimensions.', { dimension, expected, actual }));
  }

  const memory = Array.isArray(fixture.memory) ? fixture.memory : [];
  if (memory.length < 2) findings.push(finding('major', 'canonical-interface-fixture-memory-thin', 'Canonical fixture requires multiple memory states to prove state-aware controls.'));
  for (const item of memory) {
    const expected = expectedMemoryActions(item);
    const actual = cleanList(item.actions);
    if (!expected.length || !sameList(actual, expected)) {
      findings.push(finding('blocker', 'canonical-interface-fixture-memory-actions-invalid', 'Memory controls must derive from verification/lifecycle state; confirmed memory must not expose Confirm.', { memoryId: item?.id ?? null, verification: item?.verification ?? null, lifecycle: item?.lifecycle ?? null, expected, actual }));
    }
    if (item?.verification === 'Confirmed' && actual.includes('Confirm')) {
      findings.push(finding('blocker', 'canonical-interface-fixture-confirmed-memory-reconfirm', 'Confirmed memory cannot expose a Confirm action.', { memoryId: item?.id ?? null }));
    }
  }

  const history = fixture.memoryHistoryExample ?? {};
  if (history.lifecycle !== 'Superseded' || !sameList(cleanList(history.actions), expectedMemoryActions(history))) {
    findings.push(finding('major', 'canonical-interface-fixture-superseded-memory-actions-invalid', 'Superseded memory must point to replacement/history actions rather than active-memory controls.'));
  }

  if (fixture.memoryRemovalSemantics?.preservesHistory !== true || fixture.memoryRemovalSemantics?.destructiveErase !== false || clean(fixture.memoryRemovalSemantics?.label) !== 'Remove from active memory') {
    findings.push(finding('blocker', 'canonical-interface-fixture-removal-semantics-invalid', 'Removing memory from active truth must preserve provenance and history; it cannot be modeled as destructive erase.'));
  }

  const mobileItems = cleanList(fixture.mobileNavigation?.items);
  const mobileTrigger = clean(fixture.mobileNavigation?.triggerLabel);
  const requiredMobileSignals = ['Project Home', 'New conversation'];
  if (!mobileTrigger || !requiredMobileSignals.every((item) => mobileItems.includes(item)) || !mobileItems.some((item) => /current thread/i.test(item))) {
    findings.push(finding('major', 'canonical-interface-fixture-mobile-navigation-thin', 'Mobile conversation continuity must define project home, current thread, other project conversations, and new-conversation access behind the project/thread trigger.', { mobileTrigger, mobileItems }));
  }

  const workspaceStates = cleanList(fixture.screenModel?.workspaceStates);
  const destinationSurfaces = cleanList(fixture.screenModel?.destinationSurfaces);
  const responsiveExpressions = Array.isArray(fixture.screenModel?.responsiveExpressions) ? fixture.screenModel.responsiveExpressions : [];
  const classified = new Set([...workspaceStates, ...destinationSurfaces, ...responsiveExpressions.map((item) => clean(item?.screenId)).filter(Boolean)]);
  if (classified.size !== screenIds.length || !screenIds.every((id) => classified.has(id))) {
    findings.push(finding('blocker', 'canonical-interface-fixture-screen-model-incomplete', 'Every canonical proof screen must be classified as a workspace state, destination surface, or responsive expression.', { screenIds, classified: [...classified] }));
  }
  if (!responsiveExpressions.some((item) => item?.screenId === 'mobile-conversation' && item?.expressionOf === 'conversation')) {
    findings.push(finding('major', 'canonical-interface-fixture-mobile-model-invalid', 'Mobile Conversation Continuity must be explicitly modeled as a responsive expression of the conversation workspace.'));
  }

  const invariants = cleanList(fixture.comparisonInvariants);
  for (const required of ['same words', 'same data', 'same information priority', 'same functionality', 'same viewport', 'same interaction state', 'same canonical screen identity']) {
    if (!invariants.includes(required)) findings.push(finding('major', 'canonical-interface-fixture-comparison-invariant-missing', 'Creative World comparison must keep product semantics invariant.', { required }));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const reviewReady = blockers.length === 0 && majors.length === 0;
  const architectureMatch = !architectureRef || sameList(screenIds, architectureRef.screenIds ?? []);

  return {
    ...fixture,
    canonicalScreenIds: screenIds,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-for-interface-world-proof',
    pass: blockers.length === 0,
    reviewReady,
    architectureMatch,
    findings,
    truth: {
      contextContentCoherent: activeThreadId && activeThreadId === contextThreadId,
      memoryControlsStateAware: !findings.some((item) => item.code === 'canonical-interface-fixture-memory-actions-invalid' || item.code === 'canonical-interface-fixture-confirmed-memory-reconfirm'),
      statusDimensionsSeparated: !findings.some((item) => item.code === 'canonical-interface-fixture-status-taxonomy-drift'),
      mobileNavigationDefined: !findings.some((item) => item.code === 'canonical-interface-fixture-mobile-navigation-thin'),
      screenModelClassified: !findings.some((item) => item.code === 'canonical-interface-fixture-screen-model-incomplete'),
      historicalMemoryPreservedOnRemoval: fixture.memoryRemovalSemantics?.preservesHistory === true && fixture.memoryRemovalSemantics?.destructiveErase === false,
      humanVisualApproval: false
    }
  };
}

export function buildCanonicalInterfaceFixtureReference(fixture = {}, { architectureRef = null } = {}) {
  const reviewed = fixture?.findings ? fixture : buildCanonicalInterfaceFixture(fixture, { architectureRef });
  const source = {
    schema: reviewed.schema ?? null,
    projectId: reviewed.projectId ?? null,
    fixtureId: reviewed.fixtureId ?? null,
    version: reviewed.version ?? null,
    canonicalScreenIds: reviewed.canonicalScreenIds ?? [],
    activeProject: reviewed.activeProject ?? null,
    activeThread: reviewed.activeThread ?? null,
    currentContext: reviewed.currentContext ?? null,
    projectState: reviewed.projectState ?? null,
    conversation: reviewed.conversation ?? null,
    evidenceInspection: reviewed.evidenceInspection ?? null,
    approval: reviewed.approval ?? null,
    decision: reviewed.decision ?? null,
    memory: reviewed.memory ?? [],
    memoryHistoryExample: reviewed.memoryHistoryExample ?? null,
    memoryRemovalSemantics: reviewed.memoryRemovalSemantics ?? null,
    statusTaxonomy: reviewed.statusTaxonomy ?? null,
    mobileNavigation: reviewed.mobileNavigation ?? null,
    screenModel: reviewed.screenModel ?? null,
    comparisonInvariants: reviewed.comparisonInvariants ?? [],
    worldVariationAllowed: reviewed.worldVariationAllowed ?? []
  };
  return {
    schema: 'ai-studio-os/canonical-interface-fixture-ref@1',
    projectId: reviewed.projectId ?? null,
    fixtureId: reviewed.fixtureId ?? null,
    version: reviewed.version ?? null,
    fingerprint: fingerprint(source),
    architectureFingerprint: architectureRef?.fingerprint ?? null,
    screenIds: [...(reviewed.canonicalScreenIds ?? [])],
    reviewReady: reviewed.reviewReady === true
  };
}

export function sameCanonicalInterfaceFixtureReference(a, b) {
  return Boolean(a && b
    && a.schema === 'ai-studio-os/canonical-interface-fixture-ref@1'
    && b.schema === 'ai-studio-os/canonical-interface-fixture-ref@1'
    && a.projectId === b.projectId
    && a.fixtureId === b.fixtureId
    && a.version === b.version
    && a.fingerprint === b.fingerprint
    && a.architectureFingerprint === b.architectureFingerprint
    && sameList(a.screenIds ?? [], b.screenIds ?? []));
}

export { STATUS_TAXONOMY };
