import { inspectSvgMarkup } from '../../../modules/production-adapters/local-svg-adapter.mjs';

export const FORM_TARGET_SIZES = [16, 20, 24, 32, 64];
export const EXACT_RASTER_SIZE = 512;

export const CALIBRATION_ANCHORS = [
  {
    iconId: 'strategy-idea',
    label: 'Strategy Idea',
    semantic: 'A proposed trading/research strategy before it has earned evidence.',
    lockedSemanticConcept: 'plan-flag',
    recognitionAnchor: 'objective marker / plan flag'
  },
  {
    iconId: 'operator-decision',
    label: 'Operator Decision',
    semantic: 'A human operator chooses one route after evidence and risk review.',
    lockedSemanticConcept: 'selected-branch',
    recognitionAnchor: 'chosen route / branch'
  },
  {
    iconId: 'learning-event',
    label: 'Learning Event',
    semantic: 'A completed outcome feeds back into future research as a learning event.',
    lockedSemanticConcept: 'feedback-return',
    recognitionAnchor: 'feedback / return loop'
  }
];

export const FORM_DIRECTIONS = [
  {
    id: 'linear-architectural',
    label: 'Linear / Architectural',
    strokeWidth: 1.5,
    intent: 'Airy, precise, system-like geometry with explicit construction and generous negative space.',
    risks: ['can remain too diagrammatic', 'may feel visually timid at small sizes']
  },
  {
    id: 'compact-symbolic',
    label: 'Compact / Symbolic',
    strokeWidth: 1.75,
    intent: 'Compress each locked semantic into a tighter symbol while preserving the TraderFrame trace/node vocabulary.',
    risks: ['can become dense', 'may reduce the distinction between structural and event layers']
  },
  {
    id: 'bold-reduced',
    label: 'Bold / Reduced',
    strokeWidth: 2,
    intent: 'Use fewer strokes and stronger silhouette hierarchy to increase confidence without changing the locked semantic idea.',
    risks: ['can overpower the wider UI', 'may drift from the current 1.5-stroke candidate DNA if promoted without review']
  }
];

const FORM_BODIES = {
  'linear-architectural': {
    'strategy-idea': `
      <g data-layer="base" data-primitive="mast"><path d="M6 19V5"/></g>
      <g data-layer="structure" data-primitive="plan"><path d="M6 6h10l-2.5 3L16 12H6"/></g>
      <g data-layer="event" data-primitive="node"><path d="M16 7l2 2-2 2-2-2 2-2Z"/></g>`,
    'operator-decision': `
      <g data-layer="base" data-primitive="trace"><path d="M4 12h10"/></g>
      <g data-layer="structure" data-primitive="branch"><path d="M14 12l6-5M14 12l6 5"/></g>
      <g data-layer="event" data-primitive="node"><path d="M18 5l2 2-2 2-2-2 2-2Z"/></g>`,
    'learning-event': `
      <g data-layer="base" data-primitive="return"><path d="M18 6v11H8M8 17l3-3M8 17l3 3"/></g>
      <g data-layer="structure" data-primitive="trace"><path d="M8 8h7"/></g>
      <g data-layer="event" data-primitive="node"><path d="M12 6l2 2-2 2-2-2 2-2Z"/></g>`
  },
  'compact-symbolic': {
    'strategy-idea': `
      <g data-layer="base" data-primitive="mast"><path d="M8 18V6"/></g>
      <g data-layer="structure" data-primitive="plan"><path d="M8 7h8l-2 2.5 2 2.5H8"/></g>
      <g data-layer="event" data-primitive="node"><path d="M15 8l1.75 1.75L15 11.5l-1.75-1.75L15 8Z"/></g>`,
    'operator-decision': `
      <g data-layer="base" data-primitive="trace"><path d="M5 12h8"/></g>
      <g data-layer="structure" data-primitive="branch"><path d="M13 12l5-4M13 12l5 4"/></g>
      <g data-layer="event" data-primitive="node"><path d="M17 6.25L18.75 8 17 9.75 15.25 8 17 6.25Z"/></g>`,
    'learning-event': `
      <g data-layer="base" data-primitive="return"><path d="M17 7v9H9M9 16l2.5-2.5M9 16l2.5 2.5"/></g>
      <g data-layer="structure" data-primitive="trace"><path d="M9 9h6"/></g>
      <g data-layer="event" data-primitive="node"><path d="M12 7.25L13.75 9 12 10.75 10.25 9 12 7.25Z"/></g>`
  },
  'bold-reduced': {
    'strategy-idea': `
      <g data-layer="base" data-primitive="mast"><path d="M7 19V5"/></g>
      <g data-layer="structure" data-primitive="plan"><path d="M7 7h9l-3 3 3 3H7"/></g>
      <g data-layer="event" data-primitive="node"><path d="M16 7.5l2.5 2.5-2.5 2.5-2.5-2.5 2.5-2.5Z"/></g>`,
    'operator-decision': `
      <g data-layer="base" data-primitive="trace"><path d="M4 12h9"/></g>
      <g data-layer="structure" data-primitive="branch"><path d="M13 12l7-6M13 12l7 6"/></g>
      <g data-layer="event" data-primitive="node"><path d="M18 4l2.5 2.5L18 9l-2.5-2.5L18 4Z"/></g>`,
    'learning-event': `
      <g data-layer="base" data-primitive="return"><path d="M18 5v13H8M8 18l4-4M8 18l4 4"/></g>
      <g data-layer="structure" data-primitive="trace"><path d="M8 8h7"/></g>
      <g data-layer="event" data-primitive="node"><path d="M12 5.5l2.5 2.5-2.5 2.5L9.5 8 12 5.5Z"/></g>`
  }
};

export const FORM_REVIEW_CRITERIA = [
  'semantic continuity: the locked v2 meaning remains legible',
  'silhouette: the icon reads as a deliberate symbol rather than loose diagram fragments',
  'optical mass: no direction is excessively timid or heavy relative to its peers',
  'negative space: internal gaps survive at 16–24px',
  'brand character: trace / event / controlled-decision language remains recognizably TraderFrame',
  'small-size performance: the icon survives 16 / 20 / 24 / 32px evidence'
];

function directionById(directionId) {
  return FORM_DIRECTIONS.find((item) => item.id === directionId);
}

function anchorById(iconId) {
  return CALIBRATION_ANCHORS.find((item) => item.iconId === iconId);
}

export function renderFormCandidate(directionId, iconId) {
  const direction = directionById(directionId);
  const anchor = anchorById(iconId);
  const body = FORM_BODIES[directionId]?.[iconId];
  if (!direction || !anchor || !body) throw new Error(`Unknown TraderFrame form candidate ${directionId}/${iconId}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${direction.strokeWidth}" stroke-linecap="square" stroke-linejoin="miter" vector-effect="non-scaling-stroke" data-system="traderframe-form-refinement-v1" data-direction="${directionId}" data-semantic="${iconId}" data-source-concept="${anchor.lockedSemanticConcept}">${body}\n</svg>`;
}

export function reviewFormRefinement() {
  const findings = [];
  for (const anchor of CALIBRATION_ANCHORS) {
    for (const direction of FORM_DIRECTIONS) {
      let svg = '';
      try {
        svg = renderFormCandidate(direction.id, anchor.iconId);
      } catch (error) {
        findings.push({ severity: 'blocker', code: 'form-candidate-missing', iconId: anchor.iconId, directionId: direction.id, message: error.message });
        continue;
      }
      const inspection = inspectSvgMarkup(svg, { requireFontFree: true, vectorOnly: true });
      if (!inspection.pass) findings.push({ severity: 'blocker', code: 'form-candidate-svg-invalid', iconId: anchor.iconId, directionId: direction.id, message: 'Candidate fails SVG/vector integrity.', evidence: inspection.findings });
      if ((svg.match(/data-layer="event"/g) ?? []).length !== 1) findings.push({ severity: 'major', code: 'form-event-layer-count', iconId: anchor.iconId, directionId: direction.id, message: 'Form candidate must contain exactly one semantic event layer.' });
      if (!svg.includes(`data-source-concept="${anchor.lockedSemanticConcept}"`)) findings.push({ severity: 'blocker', code: 'semantic-lock-drift', iconId: anchor.iconId, directionId: direction.id, message: 'Formal refinement changed or lost the locked v2 semantic source concept.' });
    }
  }
  const blocking = findings.filter((item) => ['blocker', 'major'].includes(item.severity));
  return {
    stage: 'traderframe-icon-form-refinement-review',
    status: blocking.length ? 'changes-required' : 'formal-candidates-ready-for-render-review',
    pass: blocking.length === 0,
    findings,
    semanticLock: 'v2 semantic concepts are fixed; this stage may change form only',
    approval: 'human-form-direction-selection-required'
  };
}

export function buildFormSelectionGate() {
  return {
    schema: 'ai-studio-os/icon-form-selection-gate@1',
    status: 'awaiting-human-form-direction-selection',
    required: true,
    completed: false,
    winner: null,
    anchors: CALIBRATION_ANCHORS.map(({ iconId, label, lockedSemanticConcept }) => ({ iconId, label, lockedSemanticConcept })),
    directions: FORM_DIRECTIONS.map(({ id, label, intent, risks }) => ({ id, label, intent, risks })),
    criteria: FORM_REVIEW_CRITERIA,
    responseTemplate: FORM_DIRECTIONS.map(({ id, label }) => ({ directionId: id, label, silhouette: null, semanticClarity: null, opticalConfidence: null, brandCharacter: null, smallSize: null, notes: '' })),
    truth: 'No automated metric may mark a formal direction approved. Human visual selection is required before the full eight-icon family is reconstructed.'
  };
}

export function exactRasterPlan() {
  return FORM_DIRECTIONS.flatMap((direction) => CALIBRATION_ANCHORS.map((anchor) => ({
    directionId: direction.id,
    iconId: anchor.iconId,
    size: EXACT_RASTER_SIZE,
    outputPath: `exact-png/${direction.id}/${anchor.iconId}-${EXACT_RASTER_SIZE}px.png`
  })));
}
