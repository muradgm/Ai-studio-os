import { inspectSvgMarkup } from '../../../modules/production-adapters/local-svg-adapter.mjs';

export const TARGET_SIZES = [16, 20, 24, 32];

export const ICONS = [
  ['strategy-idea', 'Strategy Idea'],
  ['data-snapshot', 'Data Snapshot'],
  ['backtest', 'Backtest'],
  ['metric-report', 'Metric Report'],
  ['risk-review', 'Risk Review'],
  ['operator-decision', 'Operator Decision'],
  ['outcome-logged', 'Outcome Logged'],
  ['learning-event', 'Learning Event']
];

export const SEMANTIC_BRIEFS = {
  'strategy-idea': {
    literalMeaning: 'A proposed trading/research strategy before it has earned evidence.',
    recognitionAnchors: ['plan', 'objective marker', 'proposed route'],
    prohibitedDefaults: ['lightbulb', 'rocket', 'sparkles'],
    transformationRule: 'Use a plan/flag anchor but construct it from TraderFrame gate, trace, and event geometry rather than an illustration.',
    labelDependencyRisk: 'medium'
  },
  'data-snapshot': {
    literalMeaning: 'A bounded capture of source data used as evidence for a research step.',
    recognitionAnchors: ['capture frame', 'sample', 'bounded data'],
    prohibitedDefaults: ['database cylinder', 'generic document', 'camera body'],
    transformationRule: 'Express capture with frame corners and a compact sample field; avoid a literal camera or storage glyph.',
    labelDependencyRisk: 'low'
  },
  backtest: {
    literalMeaning: 'Replay a strategy against historical evidence and inspect the result.',
    recognitionAnchors: ['history', 'return/replay', 'evidence checkpoint'],
    prohibitedDefaults: ['candlestick chart', 'generic line chart', 'play button'],
    transformationRule: 'Combine a return path with a TraderFrame evidence node so history/replay is readable without becoming a chart icon.',
    labelDependencyRisk: 'low'
  },
  'metric-report': {
    literalMeaning: 'A measured result or benchmark derived from research evidence.',
    recognitionAnchors: ['measurement', 'benchmark', 'value marker'],
    prohibitedDefaults: ['bar chart', 'pie chart', 'document sheet'],
    transformationRule: 'Use a measurement axis/ruler anchor and a registered value node; avoid chart-as-category shorthand.',
    labelDependencyRisk: 'medium'
  },
  'risk-review': {
    literalMeaning: 'A risk checkpoint that can hold or block progression before an operator decision.',
    recognitionAnchors: ['checkpoint', 'hold', 'boundary review'],
    prohibitedDefaults: ['shield', 'warning triangle', 'lock'],
    transformationRule: 'Represent risk as evidence meeting a controlled boundary with a visible hold state, not as a security badge.',
    labelDependencyRisk: 'medium'
  },
  'operator-decision': {
    literalMeaning: 'A human operator chooses one route after evidence and risk review.',
    recognitionAnchors: ['branch', 'selection', 'chosen route'],
    prohibitedDefaults: ['cursor hand', 'check-circle', 'person silhouette'],
    transformationRule: 'Use a controlled branch with one selected route so the human decision is encoded as path selection.',
    labelDependencyRisk: 'low'
  },
  'outcome-logged': {
    literalMeaning: 'The resolved outcome is recorded as a durable research event.',
    recognitionAnchors: ['record', 'terminal state', 'registered entry'],
    prohibitedDefaults: ['document checklist', 'floppy disk', 'clipboard'],
    transformationRule: 'Terminate the evidence trace inside a compact register cell rather than using a document/storage metaphor.',
    labelDependencyRisk: 'medium'
  },
  'learning-event': {
    literalMeaning: 'A completed outcome feeds back into future research as a learning event.',
    recognitionAnchors: ['feedback', 'return', 'iteration'],
    prohibitedDefaults: ['brain', 'graduation cap', 'lightbulb'],
    transformationRule: 'Use a return loop with a registered event node to make feedback/iteration visible in the TraderFrame grammar.',
    labelDependencyRisk: 'low'
  }
};

const body = {
  'strategy-idea': {
    'plan-flag': `
      <g data-layer="base" data-primitive="trace"><path d="M7 19V5"/></g>
      <g data-layer="structure" data-primitive="plan"><path d="M7 6h9l-2.5 3L16 12H7"/></g>
      <g data-layer="event" data-primitive="node"><path d="M16 7l2 2-2 2-2-2 2-2Z"/></g>`,
    'hypothesis-route': `
      <g data-layer="base" data-primitive="trace"><path d="M4 16h6V9h4"/></g>
      <g data-layer="structure" data-primitive="branch"><path d="M14 9h3l3-3M17 9l3 3"/></g>
      <g data-layer="event" data-primitive="node"><path d="M10 13l3 3-3 3-3-3 3-3Z"/></g>`,
    'framed-proposal': `
      <g data-layer="base" data-primitive="frame"><path d="M7 5H4v3M17 19h3v-3"/></g>
      <g data-layer="structure" data-primitive="trace"><path d="M6 16l5-5 3 2 4-5"/></g>
      <g data-layer="event" data-primitive="node"><path d="M11 8l3 3-3 3-3-3 3-3Z"/></g>`
  },
  'data-snapshot': {
    'capture-window': `
      <g data-layer="base" data-primitive="frame"><path d="M7 5H4v4M17 5h3v4M7 19H4v-4M17 19h3v-4"/></g>
      <g data-layer="structure" data-primitive="sample"><path d="M8 13v3M12 9v7M16 11v5"/></g>
      <g data-layer="event" data-primitive="node"><path d="M12 7l2 2-2 2-2-2 2-2Z"/></g>`,
    'sample-strip': `
      <g data-layer="base" data-primitive="frame"><path d="M5 8v8M19 8v8M5 12h14"/></g>
      <g data-layer="structure" data-primitive="sample"><path d="M9 10v4M15 9v6"/></g>
      <g data-layer="event" data-primitive="node"><path d="M12 9l3 3-3 3-3-3 3-3Z"/></g>`,
    'freeze-field': `
      <g data-layer="base" data-primitive="frame"><path d="M6 6H4v3M18 6h2v3M6 18H4v-3M18 18h2v-3"/></g>
      <g data-layer="structure" data-primitive="sample"><path d="M8 12h2M14 12h2"/></g>
      <g data-layer="event" data-primitive="node"><path d="M12 9l3 3-3 3-3-3 3-3Z"/></g>`
  },
  backtest: {
    'replay-evidence': `
      <g data-layer="base" data-primitive="return"><path d="M18 7H10a6 6 0 0 0-6 6v3M4 16l3-3M4 16l3 3"/></g>
      <g data-layer="structure" data-primitive="trace"><path d="M10 12h7"/></g>
      <g data-layer="event" data-primitive="node"><path d="M14 9l3 3-3 3-3-3 3-3Z"/></g>`,
    'before-after': `
      <g data-layer="base" data-primitive="frame"><path d="M5 6v12M19 6v12"/></g>
      <g data-layer="structure" data-primitive="compare"><path d="M8 9h3M8 15h3M13 9h3M13 15h3"/></g>
      <g data-layer="event" data-primitive="node"><path d="M12 9l3 3-3 3-3-3 3-3Z"/></g>`,
    'history-window': `
      <g data-layer="base" data-primitive="return"><path d="M18 6v12H8M8 18l3-3M8 18l3 3"/></g>
      <g data-layer="structure" data-primitive="trace"><path d="M7 10h8"/></g>
      <g data-layer="event" data-primitive="node"><path d="M11 7l3 3-3 3-3-3 3-3Z"/></g>`
  },
  'metric-report': {
    'measure-axis': `
      <g data-layer="base" data-primitive="measure"><path d="M5 15h14M7 12v3M11 10v5M15 12v3M19 10v5"/></g>
      <g data-layer="structure" data-primitive="benchmark"><path d="M7 7h10"/></g>
      <g data-layer="event" data-primitive="node"><path d="M15 5l2 2-2 2-2-2 2-2Z"/></g>`,
    'benchmark-bracket': `
      <g data-layer="base" data-primitive="measure"><path d="M6 7v10M18 7v10M6 12h12"/></g>
      <g data-layer="structure" data-primitive="benchmark"><path d="M10 9v6M14 10v4"/></g>
      <g data-layer="event" data-primitive="node"><path d="M14 9l3 3-3 3-3-3 3-3Z"/></g>`,
    'delta-pair': `
      <g data-layer="base" data-primitive="measure"><path d="M6 9h12M6 15h12"/></g>
      <g data-layer="structure" data-primitive="compare"><path d="M9 7v4M15 13v4"/></g>
      <g data-layer="event" data-primitive="node"><path d="M12 9l3 3-3 3-3-3 3-3Z"/></g>`
  },
  'risk-review': {
    'checkpoint-hold': `
      <g data-layer="base" data-primitive="trace"><path d="M4 12h8"/></g>
      <g data-layer="structure" data-primitive="gate"><path d="M15 5v5M15 14v5M12 8v8"/></g>
      <g data-layer="event" data-primitive="node"><path d="M11 9l3 3-3 3-3-3 3-3Z"/></g>`,
    'bounded-exception': `
      <g data-layer="base" data-primitive="gate"><path d="M6 5v14M18 5v14"/></g>
      <g data-layer="structure" data-primitive="trace"><path d="M6 12h7l5-4"/></g>
      <g data-layer="event" data-primitive="node"><path d="M13 9l3 3-3 3-3-3 3-3Z"/></g>`,
    'review-threshold': `
      <g data-layer="base" data-primitive="measure"><path d="M5 16h14M8 13v3M16 10v6"/></g>
      <g data-layer="structure" data-primitive="gate"><path d="M16 6v4"/></g>
      <g data-layer="event" data-primitive="node"><path d="M12 10l3 3-3 3-3-3 3-3Z"/></g>`
  },
  'operator-decision': {
    'selected-branch': `
      <g data-layer="base" data-primitive="trace"><path d="M4 12h10"/></g>
      <g data-layer="structure" data-primitive="branch"><path d="M14 12l5-5M14 12l5 5"/></g>
      <g data-layer="event" data-primitive="node"><path d="M17 7l2 2-2 2-2-2 2-2Z"/></g>`,
    'binary-gate': `
      <g data-layer="base" data-primitive="gate"><path d="M8 5v14M16 5v14"/></g>
      <g data-layer="structure" data-primitive="branch"><path d="M4 12h4M8 12l8-5M8 12l8 5"/></g>
      <g data-layer="event" data-primitive="node"><path d="M16 5l2 2-2 2-2-2 2-2Z"/></g>`,
    'route-pick': `
      <g data-layer="base" data-primitive="trace"><path d="M5 17h5V7h5"/></g>
      <g data-layer="structure" data-primitive="branch"><path d="M10 12h5l4-4M15 12l4 4"/></g>
      <g data-layer="event" data-primitive="node"><path d="M15 5l2 2-2 2-2-2 2-2Z"/></g>`
  },
  'outcome-logged': {
    'register-terminal': `
      <g data-layer="base" data-primitive="trace"><path d="M4 12h8"/></g>
      <g data-layer="structure" data-primitive="register"><path d="M12 8h7v8h-7ZM14 11h3M14 13h2"/></g>
      <g data-layer="event" data-primitive="node"><path d="M12 9l3 3-3 3-3-3 3-3Z"/></g>`,
    'resolved-record': `
      <g data-layer="base" data-primitive="trace"><path d="M5 12h7"/></g>
      <g data-layer="structure" data-primitive="register"><path d="M12 6h7v12h-7M15 9h2M15 15h2"/></g>
      <g data-layer="event" data-primitive="node"><path d="M12 9l3 3-3 3-3-3 3-3Z"/></g>`,
    'event-ledger': `
      <g data-layer="base" data-primitive="register"><path d="M7 5h10v14H7Z"/></g>
      <g data-layer="structure" data-primitive="trace"><path d="M10 9h4M10 15h4"/></g>
      <g data-layer="event" data-primitive="node"><path d="M12 9l3 3-3 3-3-3 3-3Z"/></g>`
  },
  'learning-event': {
    'feedback-return': `
      <g data-layer="base" data-primitive="return"><path d="M18 6v11H8M8 17l3-3M8 17l3 3"/></g>
      <g data-layer="structure" data-primitive="trace"><path d="M8 8h7"/></g>
      <g data-layer="event" data-primitive="node"><path d="M12 5l3 3-3 3-3-3 3-3Z"/></g>`,
    'iteration-cycle': `
      <g data-layer="base" data-primitive="return"><path d="M17 7H9v10h8M17 17l-3-3M17 17l-3 3"/></g>
      <g data-layer="structure" data-primitive="trace"><path d="M9 12h5"/></g>
      <g data-layer="event" data-primitive="node"><path d="M14 9l3 3-3 3-3-3 3-3Z"/></g>`,
    'learned-node': `
      <g data-layer="base" data-primitive="return"><path d="M19 6v12H6V9"/></g>
      <g data-layer="structure" data-primitive="trace"><path d="M6 9l3 3M6 9l-3 3"/></g>
      <g data-layer="event" data-primitive="node"><path d="M13 9l3 3-3 3-3-3 3-3Z"/></g>`
  }
};

const metadata = {
  'strategy-idea': [
    ['plan-flag', 'objective marker', 8.2, 3, 'medium', 'The flag/plan anchor is immediately familiar but reduced to the shared linear grammar.'],
    ['hypothesis-route', 'proposed route', 7.7, 4, 'low', 'Brand-fit is strong, but it can collide with Operator Decision without the label.'],
    ['framed-proposal', 'bounded proposal', 7.2, 5, 'low', 'Highly ownable, but recognition depends more on context than the other candidates.']
  ],
  'data-snapshot': [
    ['capture-window', 'capture frame', 8.4, 4, 'low', 'Frame corners provide a strong snapshot cue while the internal samples preserve the data meaning.'],
    ['sample-strip', 'bounded sample strip', 7.5, 4, 'low', 'Reads as data, but less clearly as a snapshot/capture action.'],
    ['freeze-field', 'frozen field', 7.1, 5, 'low', 'Distinctive but more abstract and therefore more label-dependent.']
  ],
  backtest: [
    ['replay-evidence', 'history/replay', 8.7, 4, 'low', 'The return arrow is a recognizable historical/replay anchor and the node makes it evidence-specific.'],
    ['before-after', 'before/after comparison', 7.4, 3, 'medium', 'Comparison is understandable but can read as a generic diff/view toggle.'],
    ['history-window', 'historical window', 7.9, 4, 'low', 'Clear return cue, but the window relationship is weaker than replay-evidence.']
  ],
  'metric-report': [
    ['measure-axis', 'measurement axis', 8.3, 4, 'low', 'Ruler/measurement semantics survive without falling back to a chart icon.'],
    ['benchmark-bracket', 'benchmark range', 7.6, 4, 'low', 'Communicates measured range but can resemble controls at small sizes.'],
    ['delta-pair', 'comparison/delta', 7.2, 3, 'medium', 'Useful for comparison, but too close to generic settings/equalizer language.']
  ],
  'risk-review': [
    ['checkpoint-hold', 'checkpoint/hold', 8.1, 5, 'low', 'The trace visibly stops at a controlled boundary, matching GateZero risk semantics without a shield.'],
    ['bounded-exception', 'bounded exception', 7.5, 5, 'low', 'Brand-ownable, but the deviation can read as a route change rather than risk review.'],
    ['review-threshold', 'threshold review', 7.0, 4, 'medium', 'Semantically valid but risks sliding toward measurement/settings language.']
  ],
  'operator-decision': [
    ['selected-branch', 'chosen route', 8.8, 5, 'low', 'A branch with one registered route directly communicates operator choice and remains a strong family anchor.'],
    ['binary-gate', 'binary choice', 7.6, 4, 'medium', 'Clearly decision-related but visually denser and more mechanical.'],
    ['route-pick', 'route selection', 8.0, 4, 'low', 'Readable route selection, but more complex than selected-branch at 16px.']
  ],
  'outcome-logged': [
    ['register-terminal', 'registered entry', 8.0, 4, 'low', 'A trace visibly terminates in a compact record cell, preserving log semantics without a document icon.'],
    ['resolved-record', 'resolved record', 7.5, 4, 'low', 'Still recognizably recorded, but the open register frame is less compact.'],
    ['event-ledger', 'ledger entry', 7.0, 3, 'medium', 'Very literal record semantics, but too close to a generic document/ledger silhouette.']
  ],
  'learning-event': [
    ['feedback-return', 'feedback loop', 8.8, 5, 'low', 'The return arrow is immediately iterative and the evidence node makes it a learning event rather than generic undo.'],
    ['iteration-cycle', 'iteration', 8.0, 4, 'low', 'Strong iteration cue but denser and more container-like.'],
    ['learned-node', 'feedback re-entry', 7.8, 5, 'low', 'Ownable and coherent, but the semantic cue is less immediate than feedback-return.']
  ]
};

export const CANDIDATES = Object.fromEntries(Object.entries(metadata).map(([iconId, items]) => [iconId, items.map(([id, primaryAnchor, heuristicScore, brandFit, genericRisk, rationale]) => ({
  id,
  primaryAnchor,
  heuristicScore,
  brandFit,
  genericRisk,
  rationale,
  status: 'candidate-not-user-tested'
}))]));

export const SELECTED = Object.fromEntries(Object.entries(CANDIDATES).map(([iconId, candidates]) => {
  const selected = candidates.slice().sort((a, b) => b.heuristicScore - a.heuristicScore)[0];
  return [iconId, selected.id];
}));

export function renderSemanticCandidate(iconId, candidateId) {
  const candidateBody = body[iconId]?.[candidateId];
  if (!candidateBody) throw new Error(`unknown-traderframe-semantic-candidate:${iconId}:${candidateId}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" data-system="traderframe-semantic-construction-v2" data-semantic="${iconId}" data-concept="${candidateId}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter">${candidateBody}\n</svg>`;
}

export function renderSelectedSemanticIcon(iconId) {
  return renderSemanticCandidate(iconId, SELECTED[iconId]);
}

function finding(severity, code, message, data = {}) {
  return { severity, code, message, ...data };
}

export function reviewSemanticConstruction() {
  const findings = [];
  const selectedAnchors = new Map();
  for (const [iconId] of ICONS) {
    const brief = SEMANTIC_BRIEFS[iconId];
    const candidates = CANDIDATES[iconId] ?? [];
    if (!brief || brief.recognitionAnchors.length < 3) findings.push(finding('blocker', 'semantic-brief-incomplete', `${iconId} requires at least three recognition anchors.`, { iconId }));
    if (candidates.length !== 3) findings.push(finding('blocker', 'semantic-concept-count-invalid', `${iconId} requires exactly three recognition-first concepts.`, { iconId, count: candidates.length }));
    const selectedId = SELECTED[iconId];
    const selected = candidates.find((candidate) => candidate.id === selectedId);
    if (!selected) findings.push(finding('blocker', 'semantic-selection-missing', `${iconId} has no selected semantic concept.`, { iconId }));
    if (selected?.genericRisk === 'high') findings.push(finding('major', 'semantic-selected-generic-risk-high', `${iconId} selected concept remains high generic risk.`, { iconId, selectedId }));
    if ((selected?.heuristicScore ?? 0) < 7.5) findings.push(finding('major', 'semantic-selected-heuristic-too-weak', `${iconId} selected concept is too weak to enter visual production.`, { iconId, selectedId, heuristicScore: selected?.heuristicScore ?? null }));
    const anchor = selected?.primaryAnchor;
    if (anchor) {
      if (selectedAnchors.has(anchor)) findings.push(finding('major', 'semantic-primary-anchor-collision', `${iconId} and ${selectedAnchors.get(anchor)} reuse the same primary recognition anchor.`, { iconId, otherIconId: selectedAnchors.get(anchor), anchor }));
      selectedAnchors.set(anchor, iconId);
    }
    for (const candidate of candidates) {
      const svg = renderSemanticCandidate(iconId, candidate.id);
      const inspection = inspectSvgMarkup(svg, { requireFontFree: true, vectorOnly: true });
      if (!inspection.pass) findings.push(...inspection.findings.map((item) => ({ ...item, iconId, candidateId: candidate.id })));
      if ((svg.match(/data-layer="event"/g) ?? []).length !== 1) findings.push(finding('blocker', 'semantic-event-layer-count-invalid', `${iconId}/${candidate.id} must contain exactly one semantic event layer.`, { iconId, candidateId: candidate.id }));
      if (/#[0-9a-fA-F]{3,8}/.test(svg)) findings.push(finding('blocker', 'semantic-hard-coded-color-forbidden', `${iconId}/${candidate.id} hard-codes paint instead of currentColor.`, { iconId, candidateId: candidate.id }));
    }
  }
  const blocking = findings.filter((item) => ['blocker', 'major'].includes(String(item.severity).toLowerCase()));
  return {
    stage: 'traderframe-icon-semantic-construction-review',
    status: blocking.length ? 'changes-required' : 'construction-ready-awaiting-human-recognition-test',
    pass: blocking.length === 0,
    approval: 'blind-human-recognition-and-independent-vector-review-required',
    findings,
    selected: structuredClone(SELECTED),
    note: 'Heuristic scores rank construction candidates only. They are not human recognizability measurements.'
  };
}

export function buildBlindReviewProtocol(order = [3, 0, 6, 2, 5, 1, 7, 4]) {
  const ids = order.map((index) => ICONS[index]?.[0]).filter(Boolean);
  return {
    schema: 'ai-studio-os/blind-icon-recognition-review@1',
    method: 'Show the numbered icons without labels. For each number, record the first meaning/function that comes to mind and confidence from 1-5 before viewing the answer key.',
    passGuidance: 'Do not freeze the family from automation alone. Use human recognition results to identify semantic collisions and label-dependent icons.',
    order: ids.map((iconId, index) => ({ number: index + 1, iconId })),
    responseTemplate: ids.map((_, index) => ({ number: index + 1, guessedMeaning: '', confidence: null })),
    answerKey: ids.map((iconId, index) => ({ number: index + 1, iconId, label: ICONS.find(([id]) => id === iconId)?.[1] ?? iconId, selectedConcept: SELECTED[iconId] }))
  };
}
