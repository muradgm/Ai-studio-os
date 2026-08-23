import { renderCalibrationSvg } from './calibration-glyphs.mjs';

const WORLD_ATTRS = {
  'quiver-construct': 'stroke-linecap="butt" stroke-linejoin="miter"',
  'editorial-sign': 'stroke-linecap="round" stroke-linejoin="round"',
  'provenance-glyph': 'stroke-linecap="square" stroke-linejoin="bevel"'
};

const CONTROL_SHAPES = {
  search: '<g id="base"><circle cx="9.5" cy="9.5" r="5.5"/><path d="M13.6 13.6L19.5 19.5"/></g>',
  back: '<g id="base"><path d="M19 12H5M10 6L4 12L10 18"/></g>',
  attach: '<g id="base"><path d="M8 12.5L13.8 6.7C15.2 5.3 17.4 5.3 18.8 6.7C20.2 8.1 20.2 10.3 18.8 11.7L11.1 19.4C8.9 21.6 5.4 21.6 3.2 19.4C1 17.2 1 13.7 3.2 11.5L10.2 4.5"/></g>',
  send: '<g id="base"><path d="M3 5L21 12L3 19L7 12Z"/><path d="M7 12H16"/></g>',
  edit: '<g id="base"><path d="M5 17.5L6 13.5L15.8 3.7L20.3 8.2L10.5 18L6.5 19Z"/><path d="M13.8 5.7L18.3 10.2"/></g>'
};

function variant(size) {
  if (size <= 14) return 'micro';
  if (size <= 16) return 'small';
  if (size <= 18) return 'compact';
  return 'master';
}
function titleNode(title) {
  return title ? `<title>${String(title).replace(/[&<>]/g, '')}</title>` : '';
}
function wrap(worldId, body, { title = null } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" ${WORLD_ATTRS[worldId]} vector-effect="non-scaling-stroke">${titleNode(title)}${body}</svg>`;
}

function qShape(iconId, size) {
  const v = variant(size);
  const shapes = {
    council: v === 'micro'
      ? '<g id="base"><path d="M4 6L10 12M4 12H10M4 18L10 12M10 12H20"/></g>'
      : '<g id="base"><path d="M4 5L10 11M4 12H9M4 19L10 13M13 12H20"/></g><g id="semantic-mark"><path d="M10 9L13 12L10 15L7 12Z"/></g>',
    decision: v === 'micro'
      ? '<g id="base"><path d="M4 7H8L12 12M4 17H8L12 12M12 12H18M18 8V16"/></g>'
      : '<g id="base"><path d="M4 6H8L12 11M4 18H8L12 13M12 12H18M18 7V17"/></g><g id="semantic-mark"><path d="M18 10H20M18 14H20"/></g>',
    evidence: v === 'micro'
      ? '<g id="base"><path d="M5 4H12V20H5Z"/><path d="M8 9H10M8 13H10M12 12H18"/><rect x="18" y="11" width="2" height="2" fill="currentColor" stroke="none"/></g>'
      : '<g id="base"><path d="M5 4H12V20H5Z"/><path d="M8 8H10M8 12H10M8 16H10M12 12H18"/></g><g id="semantic-mark"><rect x="18" y="10.5" width="3" height="3" fill="none"/></g>',
    provenance: v === 'micro'
      ? '<g id="base"><path d="M4 12H9M12 12H20"/><path d="M9 10V14M12 10V14"/></g>'
      : '<g id="base"><path d="M4 12H9M14 12H20"/><path d="M9 9V15M14 9V15"/></g><g id="semantic-mark"><path d="M10.5 12H12.5"/></g>',
    memory: v === 'micro'
      ? '<g id="base"><path d="M6 5H16V18H6Z"/><path d="M9 8H19V20H9"/><path d="M11 13H15"/></g>'
      : '<g id="base"><path d="M5 4H15V16H5Z"/><path d="M9 8H19V20H9"/><path d="M12 12H16M12 15H15"/></g>',
    supersede: v === 'micro'
      ? '<g id="base"><rect x="4" y="5" width="6" height="6"/><path d="M5 12L10 7M10 8H13V17H16"/><rect x="16" y="14" width="5" height="5"/></g>'
      : '<g id="base"><rect x="4" y="4" width="7" height="7"/><path d="M5 12L11 6M11 7H14V17H17"/><rect x="17" y="13" width="4" height="7"/></g>',
    authority: '<g id="base"><path d="M12 4V9M12 15V20M4 12H9M15 12H20"/></g><g id="semantic-mark"><path d="M9 10V14M15 10V14"/></g>',
    verification: v === 'micro'
      ? '<g id="base"><path d="M5 8V5H8M16 5H19V8M19 16V19H16M8 19H5V16"/><path d="M8 12L11 15L16 9"/></g>'
      : '<g id="base"><path d="M5 9V5H9M15 5H19V9M19 15V19H15M9 19H5V15"/><path d="M8 12.5L11 15.5L16.5 8.5"/></g>',
    projects: v === 'micro'
      ? '<g id="base"><rect x="5" y="5" width="10" height="10"/><rect x="9" y="9" width="10" height="10"/></g>'
      : '<g id="base"><rect x="4" y="4" width="11" height="11"/><rect x="9" y="9" width="11" height="11"/></g>',
    search: CONTROL_SHAPES.search
  };
  return shapes[iconId] ?? null;
}

function eShape(iconId, size) {
  const v = variant(size);
  const shapes = {
    council: v === 'micro'
      ? '<g id="base"><path d="M4 6C8 6 8 10 11 12C8 14 8 18 4 18M4 12H11M13 12H20"/></g>'
      : '<g id="base"><path d="M4 5C7 5 8.5 9 11 11M4 12H10M4 19C7 19 8.5 15 11 13M14 12H20"/></g><g id="semantic-mark"><circle cx="12" cy="12" r="2"/></g>',
    decision: v === 'micro'
      ? '<g id="base"><path d="M4 7C8 7 9 10 12 12M4 17C8 17 9 14 12 12M12 12H18M18 8V16"/></g>'
      : '<g id="base"><path d="M4 6C8 6 9 9.5 12 11.5M4 18C8 18 9 14.5 12 12.5M12 12H18M18 7V17"/></g><g id="semantic-mark"><circle cx="19" cy="12" r="1.5"/></g>',
    evidence: '<g id="base"><path d="M6 4H12V20H6C4.9 20 4 19.1 4 18V6C4 4.9 4.9 4 6 4Z"/><path d="M8 8H11M8 12H11M8 16H11"/><path d="M13.5 12C15 10.5 17.5 10.5 19 12C17.5 13.5 15 13.5 13.5 12Z"/></g>',
    provenance: v === 'micro'
      ? '<g id="base"><circle cx="5" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><path d="M6.5 12C10 8 14 16 17.5 12"/></g>'
      : '<g id="base"><circle cx="5" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><path d="M7 12C10 7 13 8 15 12C16 14 17 14 17.5 12"/></g><g id="semantic-mark"><path d="M11.5 9.5L13 12L11.5 14.5"/></g>',
    memory: v === 'micro'
      ? '<g id="base"><path d="M7 4H17V20L12 17L7 20Z"/><path d="M10 9H14M10 13H14"/></g>'
      : '<g id="base"><path d="M7 4H17V20L12 16.5L7 20Z"/><path d="M10 8.5H14M10 12H14"/></g>',
    supersede: '<g id="base"><path d="M4 8C8 8 10 9 12 11M4 16C8 16 10 15 12 13M12 12C15 12 17 14 20 14"/><path d="M6 6L9 9"/></g>',
    authority: '<g id="base"><path d="M12 4C11.2 7 11.2 9 12 10M12 14C12.8 16 12.8 18 12 20M4 12H9M15 12H20"/></g>',
    verification: v === 'micro'
      ? '<g id="base"><path d="M5 9V6H8M16 6H19V9M19 15V18H16M8 18H5V15"/><path d="M8 12L11 15L16 9"/></g>'
      : '<g id="base"><path d="M5 9V5H9M15 5H19V9M19 15V19H15M9 19H5V15"/><path d="M8 12L11 15L16.5 8.5"/></g><g id="semantic-mark"><circle cx="16.5" cy="8.5" r="1" fill="currentColor" stroke="none"/></g>',
    projects: '<g id="base"><rect x="5" y="4" width="11" height="11" rx="2"/><rect x="8" y="8" width="11" height="11" rx="2"/></g>',
    search: CONTROL_SHAPES.search
  };
  return shapes[iconId] ?? null;
}

function provenanceNodeCount(iconId, size) {
  if (['authority', 'memory', 'projects', 'search'].includes(iconId)) return 0;
  if (iconId === 'provenance') return size >= 18 ? 1 : 0;
  if (iconId === 'council' || iconId === 'decision' || iconId === 'verification' || iconId === 'evidence' || iconId === 'supersede') {
    return size >= 18 ? 1 : size === 16 ? 1 : 0;
  }
  return 0;
}

function pShape(iconId, size) {
  const v = variant(size);
  const node = provenanceNodeCount(iconId, size) > 0;
  const shapes = {
    council: v === 'micro'
      ? '<g id="state"><path d="M4 6H8L12 12M4 12H12M4 18H8L12 12M12 12H20"/></g>'
      : `<g id="state"><path d="M4 5H8L12 10M4 12H10M4 19H8L12 14M14 12H20"/></g><g id="lineage"><path d="M10 12H14"/></g>${node ? '<g id="registration"><circle data-registration-node="true" cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/></g>' : ''}`,
    decision: v === 'micro'
      ? '<g id="state"><path d="M4 7H8L12 12M4 17H8L12 12M12 12H18M18 8V16"/></g>'
      : `<g id="state"><path d="M4 6H8L12 11M4 18H8L12 13M14 12H18M18 7V17"/></g><g id="lineage"><path d="M10 12H14"/></g>${node ? '<g id="registration"><circle data-registration-node="true" cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/></g>' : ''}`,
    evidence: v === 'micro'
      ? '<g id="state"><path d="M5 4H12V20H5Z"/><path d="M8 9H10M8 13H10M12 12H19"/><path d="M17 10V14"/></g>'
      : `<g id="state"><path d="M5 4H12V20H5Z"/><path d="M8 8H10M8 12H10M8 16H10M12 12H17"/></g><g id="lineage"><circle cx="19" cy="12" r="2.5"/></g>${node ? '<g id="registration"><circle data-registration-node="true" cx="19" cy="12" r=".8" fill="currentColor" stroke="none"/></g>' : ''}`,
    provenance: v === 'micro'
      ? '<g id="state"><path d="M4 12H9M12 9V15M15 12H20"/></g>'
      : `<g id="state"><path d="M4 12H9M15 12H20"/></g><g id="lineage"><path d="M11 9V15M13 9V15"/></g>${node ? '<g id="registration"><circle data-registration-node="true" cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/></g>' : ''}`,
    memory: v === 'micro'
      ? '<g id="state"><path d="M7 4H18V20H7Z"/><path d="M4 9H7M4 15H7M10 12H15"/></g>'
      : '<g id="state"><path d="M7 4H18V20H7Z"/><path d="M4 8H7M4 12H7M4 16H7M10 9H15M10 13H15"/></g>',
    supersede: v === 'micro'
      ? '<g id="state"><rect x="4" y="5" width="6" height="6"/><path d="M5 12L10 7M10 8H13V17H17"/><path d="M17 14H20V20H17Z"/></g>'
      : `<g id="state"><rect x="4" y="4" width="7" height="7"/><path d="M5 12L11 6M17 13H21V20H17Z"/></g><g id="lineage"><path d="M11 7H14V16.5H17"/></g>${node ? '<g id="registration"><circle data-registration-node="true" cx="14" cy="16.5" r="1.2" fill="currentColor" stroke="none"/></g>' : ''}`,
    authority: '<g id="state"><path d="M12 4V9M12 15V20M4 12H9M15 12H20"/></g><g id="lineage"><path d="M9 10V14M15 10V14"/></g>',
    verification: v === 'micro'
      ? '<g id="state"><path d="M5 8V5H9M15 5H19V8M19 16V19H15M9 19H5V16"/><path d="M8 12L11 15L16 9"/></g>'
      : `<g id="state"><path d="M5 9V5H9M15 5H19V9M19 15V19H15M9 19H5V15"/><path d="M8 12L11 15L16 9"/></g>${node ? '<g id="registration"><circle data-registration-node="true" cx="16" cy="9" r="1" fill="currentColor" stroke="none"/></g>' : ''}`,
    projects: v === 'micro'
      ? '<g id="state"><rect x="5" y="5" width="10" height="10"/><rect x="9" y="9" width="10" height="10"/></g>'
      : '<g id="state"><rect x="4" y="4" width="11" height="11"/><rect x="9" y="9" width="11" height="11"/></g>',
    search: CONTROL_SHAPES.search
  };
  return shapes[iconId] ?? null;
}

function craftBody(worldId, iconId, size) {
  if (CONTROL_SHAPES[iconId]) return CONTROL_SHAPES[iconId];
  if (worldId === 'quiver-construct') return qShape(iconId, size);
  if (worldId === 'editorial-sign') return eShape(iconId, size);
  if (worldId === 'provenance-glyph') return pShape(iconId, size);
  return null;
}

export function renderCraftGlyphSvg(worldId, iconId, { size = 24, title = null } = {}) {
  if (!WORLD_ATTRS[worldId]) throw new Error(`Unknown Icon World: ${worldId}`);
  const body = craftBody(worldId, iconId, size);
  if (!body) {
    return {
      svg: renderCalibrationSvg(worldId, iconId, { title }),
      variant: 'baseline-fallback',
      registrationNodeCount: 0,
      signatureNodeCount: 0,
      craftCorrected: false
    };
  }
  const registrationNodeCount = worldId === 'provenance-glyph' ? provenanceNodeCount(iconId, size) : 0;
  const signatureNodeCount = CONTROL_SHAPES[iconId] ? 0 : registrationNodeCount;
  return {
    svg: wrap(worldId, body, { title }),
    variant: variant(size),
    registrationNodeCount,
    signatureNodeCount,
    craftCorrected: true
  };
}
