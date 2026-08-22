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
    formClass: 'skeletal-open',
    strokeWidth: 1.5,
    intent: 'Airy, precise, system-like geometry with explicit construction and generous negative space.',
    risks: ['can remain too diagrammatic', 'may feel visually timid at small sizes']
  },
  {
    id: 'compact-symbolic',
    label: 'Compact / Symbolic',
    formClass: 'enclosed-compact',
    strokeWidth: 1.75,
    intent: 'Compress the locked meaning into a bounded emblem-like construction with tighter internal relationships and less loose linework.',
    risks: ['can become dense', 'enclosure can make the family feel too UI-container-like']
  },
  {
    id: 'bold-reduced',
    label: 'Bold / Reduced',
    formClass: 'reduced-gesture',
    strokeWidth: 2,
    intent: 'Reduce each semantic to a stronger directional gesture with fewer structural elements and a more dominant event hierarchy.',
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
      <g data-layer="base" data-primitive="bounded-field"><path d="M6 18V6h12v12"/></g>
      <g data-layer="structure" data-primitive="embedded-plan"><path d="M9 16V8h6l-2 2 2 2H9"/></g>
      <g data-layer="event" data-primitive="node"><path d="M15 8.25l1.75 1.75L15 11.75 13.25 10 15 8.25Z"/></g>`,
    'operator-decision': `
      <g data-layer="base" data-primitive="decision-field"><path d="M6 7v10h12"/></g>
      <g data-layer="structure" data-primitive="junction"><path d="M8 12h5M13 12l4-3M13 12l4 3"/></g>
      <g data-layer="event" data-primitive="node"><path d="M17 7.25L18.75 9 17 10.75 15.25 9 17 7.25Z"/></g>`,
    'learning-event': `
      <g data-layer="base" data-primitive="feedback-field"><path d="M17 7v10H7V9"/></g>
      <g data-layer="structure" data-primitive="return-corner"><path d="M7 9l3-3M7 9l3 3"/></g>
      <g data-layer="event" data-primitive="node"><path d="M14 15.25L15.75 17 14 18.75 12.25 17 14 15.25Z"/></g>`
  },
  'bold-reduced': {
    'strategy-idea': `
      <g data-layer="base" data-primitive="plan-gesture"><path d="M7 19V5M7 7h9l-4 3 4 3H7"/></g>
      <g data-layer="structure" data-primitive="cut"><path d="M12 10h4"/></g>
      <g data-layer="event" data-primitive="node"><path d="M16 7.5l2.5 2.5-2.5 2.5-2.5-2.5 2.5-2.5Z"/></g>`,
    'operator-decision': `
      <g data-layer="base" data-primitive="choice-gesture"><path d="M4 12h7l8-7M11 12l7 7"/></g>
      <g data-layer="structure" data-primitive="selected-route"><path d="M14 9l5-4"/></g>
      <g data-layer="event" data-primitive="node"><path d="M18 3.5l2.5 2.5L18 8.5 15.5 6 18 3.5Z"/></g>`,
    'learning-event': `
      <g data-layer="base" data-primitive="return-gesture"><path d="M18 5v13H7M7 18l4-4M7 18l4 4"/></g>
      <g data-layer="structure" data-primitive="feed"><path d="M10 8h8"/></g>
      <g data-layer="event" data-primitive="node"><path d="M17 4.5l2.5 2.5L17 9.5 14.5 7 17 4.5Z"/></g>`
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
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${direction.strokeWidth}" stroke-linecap="square" stroke-linejoin="miter" data-system="traderframe-form-refinement-v1" data-direction="${directionId}" data-form-class="${direction.formClass}" data-semantic="${iconId}" data-source-concept="${anchor.lockedSemanticConcept}">${body}\n</svg>`;
}

export function reviewFormRefinement() {
  const findings = [];
  for (const anchor of CALIBRATION_ANCHORS) {
    const observedClasses = new Set();
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
      if (!svg.includes(`data-form-class="${direction.formClass}"`)) findings.push({ severity: 'major', code: 'form-class-missing', iconId: anchor.iconId, directionId: direction.id, message: 'Candidate lost its declared formal construction class.' });
      observedClasses.add(direction.formClass);
    }
    if (observedClasses.size !== FORM_DIRECTIONS.length) findings.push({ severity: 'major', code: 'cosmetic-form-exploration', iconId: anchor.iconId, message: 'Formal exploration collapsed into cosmetic variants instead of three construction classes.' });
  }
  const blocking = findings.filter((item) => ['blocker', 'major'].includes(item.severity));
  return {
    stage: 'traderframe-icon-form-refinement-review',
    status: blocking.length ? 'changes-required' : 'formal-candidates-ready-for-render-review',
    pass: blocking.length === 0,
    findings,
    semanticLock: 'v2 semantic concepts are fixed; this stage may change form only',
    formClasses: FORM_DIRECTIONS.map(({ id, formClass }) => ({ id, formClass })),
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
    directions: FORM_DIRECTIONS.map(({ id, label, formClass, intent, risks }) => ({ id, label, formClass, intent, risks })),
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
