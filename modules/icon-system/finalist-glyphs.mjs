import { renderCraftGlyphSvg } from './craft-glyphs.mjs';

const WORLD_ATTRS = {
  'provenance-glyph': 'stroke-linecap="square" stroke-linejoin="bevel"',
  'editorial-sign': 'stroke-linecap="round" stroke-linejoin="round"'
};

export const FINALIST_CANDIDATES = {
  'provenance-glyph': {
    council: [
      { id: 'voices-register', label: 'Voices + register', intent: 'Multiple independent perspectives remain separate until a registered synthesis state; no branch/merge topology.' },
      { id: 'deliberation-field', label: 'Deliberation field', intent: 'Three propositions occupy one bounded review field; plurality is spatial rather than connected.' },
      { id: 'perspectives-verdict', label: 'Perspectives + verdict', intent: 'Multiple viewpoints are shown as discrete marks beside a durable outcome mark.' }
    ],
    decision: [
      { id: 'durable-choice', label: 'Durable choice', intent: 'Alternatives remain visible while one becomes the durable selected state.' },
      { id: 'settled-record', label: 'Settled record', intent: 'A decision is a recorded settled state, not a route or branch.' },
      { id: 'choice-seal', label: 'Choice seal', intent: 'Selection is represented through familiar choice geometry with a restrained durable terminal.' }
    ],
    evidence: [
      { id: 'registered-excerpt', label: 'Registered excerpt', intent: 'A concrete source document with one visibly registered supporting passage.' },
      { id: 'cited-passage', label: 'Cited passage', intent: 'Evidence is a specific excerpt within source material, not generic properties plus a connector.' },
      { id: 'source-quote', label: 'Source + quote', intent: 'A source record containing one explicit quoted/supporting region.' }
    ],
    provenance: [
      { id: 'origin-trace', label: 'Origin + retained trace', intent: 'An object carries a known origin and a retained trace without miniaturizing a lineage graph.' },
      { id: 'source-mark', label: 'Source mark', intent: 'A durable object contains a small origin registration rather than crop/scan corners.' },
      { id: 'trace-seal', label: 'Trace seal', intent: 'Traceability is represented as a retained origin seal attached to the object state.' }
    ],
    authority: [
      { id: 'threshold-aperture', label: 'Threshold aperture', intent: 'Advice and consequence sit on opposite sides of a boundary whose crossing point is explicit.' },
      { id: 'held-threshold', label: 'Held threshold', intent: 'Advisory motion stops before a consequential state beyond the boundary.' },
      { id: 'granted-crossing', label: 'Granted crossing', intent: 'The only continuity across the boundary occurs through a deliberate permission aperture, without arrow/security metaphors.' }
    ],
    supersede: [
      { id: 'retained-predecessor', label: 'Retained predecessor', intent: 'Old truth loses current authority but remains visibly retained behind the new state.' },
      { id: 'version-step', label: 'Version step', intent: 'A previous record remains as history while a newer record becomes current; no delete slash.' }
    ],
    verification: [
      { id: 'frame-check', label: 'Frame + check', intent: 'Preserve the familiar checked-against-something metaphor and tune proportion only.' }
    ]
  },
  'editorial-sign': {
    council: [
      { id: 'voices-margin', label: 'Voices + margin', intent: 'Several human-facing statements remain discrete beside a quiet synthesis margin.' },
      { id: 'deliberation-note', label: 'Deliberation note', intent: 'Independent propositions sit around a single review note rather than converging through a graph.' },
      { id: 'plurality-statement', label: 'Plurality + statement', intent: 'Three distinct editorial marks support one composed statement without branch geometry.' }
    ],
    decision: [
      { id: 'settled-dot', label: 'Settled dot', intent: 'A familiar selected state closes a set of alternatives with editorial restraint.' },
      { id: 'final-rule', label: 'Final rule', intent: 'Alternatives remain soft while one final rule becomes durable.' },
      { id: 'sealed-choice', label: 'Sealed choice', intent: 'A choice is shown through a small set of options with one final selected mark.' }
    ],
    evidence: [
      { id: 'excerpt-bracket', label: 'Excerpt bracket', intent: 'A source page carries a clearly bracketed supporting passage.' },
      { id: 'quotation-record', label: 'Quotation record', intent: 'Evidence is treated as quoted source material rather than a property object.' },
      { id: 'registered-passage', label: 'Registered passage', intent: 'One passage inside a calm record receives explicit evidence emphasis.' }
    ],
    provenance: [
      { id: 'origin-dot', label: 'Origin dot', intent: 'A known origin remains attached to an object through one restrained trace.' },
      { id: 'retained-trace', label: 'Retained trace', intent: 'A single trace survives into the present object without becoming a topology diagram.' },
      { id: 'source-imprint', label: 'Source imprint', intent: 'The object visibly carries an origin imprint rather than crop/scan corners.' }
    ],
    authority: [
      { id: 'soft-threshold', label: 'Soft threshold', intent: 'A consequential boundary is explicit but quiet, with a deliberate aperture.' },
      { id: 'permission-margin', label: 'Permission margin', intent: 'An editorial rule separates advisory content from consequential content.' },
      { id: 'consequence-crossing', label: 'Consequence crossing', intent: 'Before and after states are separated by a boundary and one controlled crossing point.' }
    ],
    supersede: [
      { id: 'retained-layer', label: 'Retained layer', intent: 'A previous record remains legible behind the current one.' },
      { id: 'new-edition', label: 'New edition', intent: 'A new edition becomes current while the prior edition remains in history.' }
    ],
    verification: [
      { id: 'frame-check', label: 'Frame + check', intent: 'Keep familiar verification semantics and tune only optical calm.' }
    ]
  }
};

function escTitle(value) {
  return String(value ?? '').replace(/[&<>]/g, '');
}
function wrap(worldId, body, title = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" ${WORLD_ATTRS[worldId]} vector-effect="non-scaling-stroke"><title>${escTitle(title)}</title>${body}</svg>`;
}
function micro(size) {
  return Number(size) <= 14;
}

function provenanceShape(iconId, candidateId, size) {
  const m = micro(size);
  const shapes = {
    council: {
      'voices-register': m
        ? '<g><path d="M4 6H9M4 12H9M4 18H9"/><path d="M13 6V18M13 6H18M13 18H18"/><rect x="17" y="10.5" width="3" height="3"/></g>'
        : '<g><path d="M4 5.5H9M4 12H10M4 18.5H9"/><path d="M13 5V19M13 5H18M13 19H18"/><rect x="17" y="10" width="3.5" height="4"/></g>',
      'deliberation-field': m
        ? '<g><rect x="4" y="5" width="4" height="3"/><rect x="4" y="10.5" width="5" height="3"/><rect x="4" y="16" width="4" height="3"/><path d="M12 6H20V18H12Z"/><path d="M15 12H18"/></g>'
        : '<g><rect x="4" y="4.5" width="4.5" height="3.5"/><rect x="4" y="10.25" width="5.5" height="3.5"/><rect x="4" y="16" width="4.5" height="3.5"/><path d="M12.5 5H20V19H12.5Z"/><path d="M15 10H18M15 14H18"/></g>',
      'perspectives-verdict': m
        ? '<g><path d="M4 6H9M4 12H10M4 18H9"/><rect x="14" y="7" width="6" height="10"/><path d="M16 12H18"/></g>'
        : '<g><path d="M4 5H9M4 12H10M4 19H9"/><rect x="14" y="6" width="6" height="12"/><path d="M16 10H18M16 14H18"/></g>'
    },
    decision: {
      'durable-choice': m
        ? '<g><path d="M4 7H10M4 12H10M4 17H10"/><rect x="15" y="9" width="5" height="6"/><path d="M11.5 12H15"/></g>'
        : '<g><path d="M4 6H10M4 12H11M4 18H10"/><rect x="15" y="8.5" width="5" height="7"/><path d="M12 12H15"/></g>',
      'settled-record': m
        ? '<g><path d="M5 5H13V19H5Z"/><path d="M8 9H11M8 13H11"/><rect x="16" y="8" width="4" height="8"/></g>'
        : '<g><path d="M5 4H13V20H5Z"/><path d="M8 8H11M8 12H11M8 16H11"/><rect x="16" y="7" width="4" height="10"/></g>',
      'choice-seal': m
        ? '<g><circle cx="6" cy="7" r="1.5"/><circle cx="6" cy="12" r="1.5"/><circle cx="6" cy="17" r="1.5"/><path d="M9 7H13M9 12H13M9 17H13"/><rect x="16" y="9" width="4" height="6"/></g>'
        : '<g><circle cx="6" cy="6" r="1.7"/><circle cx="6" cy="12" r="1.7"/><circle cx="6" cy="18" r="1.7"/><path d="M9 6H13M9 12H14M9 18H13"/><rect x="16" y="8" width="4" height="8"/></g>'
    },
    evidence: {
      'registered-excerpt': m
        ? '<g><path d="M5 4H19V20H5Z"/><path d="M8 8H16M8 12H16M8 16H14"/><path d="M7 10V14M7 10H9M7 14H9"/></g>'
        : '<g><path d="M5 4H19V20H5Z"/><path d="M8 8H16M8 12H16M8 16H14"/><path d="M7 9.5V14.5M7 9.5H9M7 14.5H9"/><path d="M10 14.5H16"/></g>',
      'cited-passage': m
        ? '<g><path d="M5 5H18V19H5Z"/><path d="M8 8H15M8 12H15M8 16H13"/><rect x="7" y="10.5" width="9" height="3"/></g>'
        : '<g><path d="M5 4H18V20H5Z"/><path d="M8 8H15M8 12H15M8 16H13"/><rect x="7" y="10.25" width="9" height="3.5"/></g>',
      'source-quote': m
        ? '<g><path d="M5 4H19V20H5Z"/><path d="M8 8H16M8 16H14"/><path d="M8 11H10V14H8M12 11H14V14H12"/></g>'
        : '<g><path d="M5 4H19V20H5Z"/><path d="M8 8H16M8 17H14"/><path d="M8 11H10.5V14.5H8M12.5 11H15V14.5H12.5"/></g>'
    },
    provenance: {
      'origin-trace': m
        ? '<g><circle cx="5.5" cy="12" r="2"/><path d="M7.5 12H10"/><path d="M10 6H20V18H10Z"/><path d="M13 10H17M13 14H16"/></g>'
        : '<g><circle cx="5" cy="12" r="2.2"/><path d="M7.2 12H10"/><path d="M10 5H20V19H10Z"/><path d="M13 9H17M13 13H17M13 17H16"/></g>',
      'source-mark': m
        ? '<g><path d="M6 5H19V19H6Z"/><path d="M6 10H9V14H6"/><path d="M11 9H16M11 13H16"/></g>'
        : '<g><path d="M6 4H19V20H6Z"/><path d="M6 9H9.5V15H6"/><path d="M12 8H16M12 12H17M12 16H15"/></g>',
      'trace-seal': m
        ? '<g><path d="M8 5H20V19H8Z"/><circle cx="7" cy="12" r="2.5"/><path d="M9.5 12H13M13 9V15"/></g>'
        : '<g><path d="M8 4H20V20H8Z"/><circle cx="7" cy="12" r="2.75"/><path d="M9.75 12H14M14 8.5V15.5"/><path d="M16 9H18M16 15H18"/></g>'
    },
    authority: {
      'threshold-aperture': m
        ? '<g><path d="M12 4V9M12 15V20"/><path d="M4 12H10M14 12H20"/><path d="M10 10V14M14 10V14"/></g>'
        : '<g><path d="M12 4V9M12 15V20"/><path d="M4 12H9.5M14.5 12H20"/><path d="M9.5 9.5V14.5M14.5 9.5V14.5"/></g>',
      'held-threshold': m
        ? '<g><path d="M13 4V20"/><path d="M4 10H10"/><rect x="16" y="12" width="4" height="5"/><path d="M10 8V12"/></g>'
        : '<g><path d="M13 4V20"/><path d="M4 10H10"/><rect x="16" y="11.5" width="4" height="5.5"/><path d="M10 7.5V12.5"/></g>',
      'granted-crossing': m
        ? '<g><path d="M12 4V9M12 15V20"/><path d="M4 12H9M15 12H20"/><rect x="10" y="10" width="4" height="4"/></g>'
        : '<g><path d="M12 4V9M12 15V20"/><path d="M4 12H9M15 12H20"/><rect x="9.75" y="9.75" width="4.5" height="4.5"/></g>'
    },
    supersede: {
      'retained-predecessor': m
        ? '<g><path d="M4 5H13V14H4Z"/><path d="M8 9H20V20H8Z"/><path d="M6 7H10M12 17H17"/></g>'
        : '<g><path d="M4 4H14V14H4Z"/><path d="M8 8H20V20H8Z"/><path d="M6 7H11M12 12H17M12 16H17"/></g>',
      'version-step': m
        ? '<g><path d="M5 5H14V14H5V10"/><path d="M9 9H20V20H9Z"/><path d="M12 13H17M12 17H17"/></g>'
        : '<g><path d="M4 4H14V14H4V9"/><path d="M9 9H20V20H9Z"/><path d="M12 13H17M12 17H17"/></g>'
    },
    verification: {
      'frame-check': m
        ? '<g><path d="M5 8V5H9M15 5H19V8M19 16V19H15M9 19H5V16"/><path d="M8 12L11 15L16 9"/></g>'
        : '<g><path d="M5 9V5H9M15 5H19V9M19 15V19H15M9 19H5V15"/><path d="M8 12L11 15L16 9"/></g>'
    }
  };
  return shapes[iconId]?.[candidateId] ?? null;
}

function editorialShape(iconId, candidateId, size) {
  const m = micro(size);
  const shapes = {
    council: {
      'voices-margin': m
        ? '<g><path d="M4 6H9M4 12H10M4 18H9"/><path d="M13 5C15 7 15 17 13 19"/><circle cx="18" cy="12" r="2"/></g>'
        : '<g><path d="M4 5.5H9M4 12H10M4 18.5H9"/><path d="M13 5C15.5 7.5 15.5 16.5 13 19"/><circle cx="18" cy="12" r="2.2"/></g>',
      'deliberation-note': m
        ? '<g><path d="M4 7C7 7 8 9 10 10M4 12H10M4 17C7 17 8 15 10 14"/><path d="M14 7H20V17H14Z"/><path d="M16 12H18"/></g>'
        : '<g><path d="M4 6C7.5 6 8.5 9 10.5 10M4 12H10M4 18C7.5 18 8.5 15 10.5 14"/><path d="M14 6H20V18H14Z"/><path d="M16 10H18M16 14H18"/></g>',
      'plurality-statement': m
        ? '<g><circle cx="5" cy="7" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="5" cy="17" r="1.5"/><path d="M8 7H11M8 12H12M8 17H11"/><path d="M15 8C18 8 20 10 20 12C20 14 18 16 15 16Z"/></g>'
        : '<g><circle cx="5" cy="6" r="1.7"/><circle cx="5" cy="12" r="1.7"/><circle cx="5" cy="18" r="1.7"/><path d="M8 6H11M8 12H12M8 18H11"/><path d="M15 7C18 7 20 9.5 20 12C20 14.5 18 17 15 17Z"/></g>'
    },
    decision: {
      'settled-dot': m
        ? '<g><circle cx="6" cy="7" r="1.5"/><circle cx="6" cy="12" r="1.5"/><circle cx="6" cy="17" r="1.5"/><path d="M9 7H13M9 12H13M9 17H13"/><circle cx="18" cy="12" r="2.5" fill="currentColor" stroke="none"/></g>'
        : '<g><circle cx="6" cy="6" r="1.7"/><circle cx="6" cy="12" r="1.7"/><circle cx="6" cy="18" r="1.7"/><path d="M9 6H13M9 12H14M9 18H13"/><circle cx="18" cy="12" r="2.7" fill="currentColor" stroke="none"/></g>',
      'final-rule': m
        ? '<g><path d="M4 7C7 7 9 8 11 10M4 17C7 17 9 16 11 14"/><path d="M14 8V16M14 12H20"/></g>'
        : '<g><path d="M4 6C7.5 6 9 8 11 10M4 18C7.5 18 9 16 11 14"/><path d="M14 7V17M14 12H20"/></g>',
      'sealed-choice': m
        ? '<g><circle cx="6" cy="7" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="6" cy="17" r="2"/><circle cx="6" cy="12" r="1" fill="currentColor" stroke="none"/><path d="M10 7H18M10 12H19M10 17H17"/></g>'
        : '<g><circle cx="6" cy="6" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="6" cy="12" r="1.1" fill="currentColor" stroke="none"/><path d="M10 6H18M10 12H19M10 18H17"/></g>'
    },
    evidence: {
      'excerpt-bracket': m
        ? '<g><path d="M6 4H18V20H6C5 20 4 19 4 18V6C4 5 5 4 6 4Z"/><path d="M8 8H15M8 12H15M8 16H13"/><path d="M7 10V14M7 10H9M7 14H9"/></g>'
        : '<g><path d="M6 4H18V20H6C5 20 4 19 4 18V6C4 5 5 4 6 4Z"/><path d="M8 8H15M8 12H15M8 16H13"/><path d="M7 9.5V14.5M7 9.5H9M7 14.5H9"/></g>',
      'quotation-record': m
        ? '<g><path d="M6 4H18V20H6C5 20 4 19 4 18V6C4 5 5 4 6 4Z"/><path d="M8 8H15M8 16H13"/><path d="M8 11H10V14H8M12 11H14V14H12"/></g>'
        : '<g><path d="M6 4H18V20H6C5 20 4 19 4 18V6C4 5 5 4 6 4Z"/><path d="M8 8H15M8 17H13"/><path d="M8 11H10.5V14.5H8M12.5 11H15V14.5H12.5"/></g>',
      'registered-passage': m
        ? '<g><path d="M6 4H18V20H6C5 20 4 19 4 18V6C4 5 5 4 6 4Z"/><path d="M8 8H15M8 12H15M8 16H13"/><circle cx="16" cy="12" r="1.5"/></g>'
        : '<g><path d="M6 4H18V20H6C5 20 4 19 4 18V6C4 5 5 4 6 4Z"/><path d="M8 8H15M8 12H14M8 16H13"/><circle cx="16" cy="12" r="1.7"/></g>'
    },
    provenance: {
      'origin-dot': m
        ? '<g><circle cx="5" cy="12" r="2"/><path d="M7 12C9 9 10 9 12 12"/><path d="M12 6H20V18H12Z"/></g>'
        : '<g><circle cx="5" cy="12" r="2.2"/><path d="M7.2 12C9.5 8.5 10.5 8.5 12.5 12"/><path d="M12.5 5H20V19H12.5Z"/><path d="M15 10H18M15 14H18"/></g>',
      'retained-trace': m
        ? '<g><circle cx="5" cy="12" r="1.7" fill="currentColor" stroke="none"/><path d="M7 12C10 8 13 16 16 12"/><path d="M16 7V17M16 12H20"/></g>'
        : '<g><circle cx="5" cy="12" r="1.8" fill="currentColor" stroke="none"/><path d="M7 12C10 7.5 13 16.5 16 12"/><path d="M16 6V18M16 12H20"/></g>',
      'source-imprint': m
        ? '<g><path d="M7 5H19V19H7Z"/><circle cx="7" cy="12" r="2.5"/><path d="M11 9H16M11 13H16"/></g>'
        : '<g><path d="M7 4H19V20H7Z"/><circle cx="7" cy="12" r="2.7"/><path d="M11 8H16M11 12H17M11 16H15"/></g>'
    },
    authority: {
      'soft-threshold': m
        ? '<g><path d="M12 4C11 7 11 9 12 10M12 14C13 16 13 18 12 20"/><path d="M4 12H9M15 12H20"/></g>'
        : '<g><path d="M12 4C10.8 7 10.8 9 12 10M12 14C13.2 16 13.2 18 12 20"/><path d="M4 12H9M15 12H20"/></g>',
      'permission-margin': m
        ? '<g><path d="M13 4V20"/><path d="M4 9H10M4 13H9"/><path d="M16 12H20"/><circle cx="16" cy="12" r="1.5"/></g>'
        : '<g><path d="M13 4V20"/><path d="M4 8H10M4 12H9M4 16H10"/><path d="M16 12H20"/><circle cx="16" cy="12" r="1.7"/></g>',
      'consequence-crossing': m
        ? '<g><path d="M12 4V9M12 15V20"/><path d="M4 10H9M15 14H20"/><path d="M9 10C11 10 13 14 15 14"/></g>'
        : '<g><path d="M12 4V9M12 15V20"/><path d="M4 9.5H9M15 14.5H20"/><path d="M9 9.5C11.5 9.5 12.5 14.5 15 14.5"/></g>'
    },
    supersede: {
      'retained-layer': m
        ? '<g><path d="M5 5H14V14H5Z"/><path d="M9 9H20V20H9Z"/><path d="M12 13H17"/></g>'
        : '<g><path d="M4 4H14V14H4Z"/><path d="M9 9H20V20H9Z"/><path d="M12 13H17M12 17H17"/></g>',
      'new-edition': m
        ? '<g><path d="M5 5H14V14H5V10"/><path d="M9 9H20V20H9C8.5 20 8 19.5 8 19V10C8 9.5 8.5 9 9 9Z"/></g>'
        : '<g><path d="M4 4H14V14H4V9"/><path d="M9 9H20V20H9C8.5 20 8 19.5 8 19V10C8 9.5 8.5 9 9 9Z"/><path d="M12 13H17M12 17H16"/></g>'
    },
    verification: {
      'frame-check': m
        ? '<g><path d="M5 9V6H8M16 6H19V9M19 15V18H16M8 18H5V15"/><path d="M8 12L11 15L16 9"/></g>'
        : '<g><path d="M5 9V5H9M15 5H19V9M19 15V19H15M9 19H5V15"/><path d="M8 12L11 15L16.5 8.5"/></g>'
    }
  };
  return shapes[iconId]?.[candidateId] ?? null;
}

export function listFinalistCandidates(worldId, iconId) {
  return FINALIST_CANDIDATES[worldId]?.[iconId] ?? [];
}

export function renderFinalistGlyphSvg(worldId, iconId, candidateId, { size = 24, title = null } = {}) {
  if (!WORLD_ATTRS[worldId]) throw new Error(`Unknown finalist Icon World: ${worldId}`);
  const candidate = listFinalistCandidates(worldId, iconId).find((item) => item.id === candidateId);
  if (!candidate) throw new Error(`Unknown finalist candidate: ${worldId}:${iconId}:${candidateId}`);
  const body = worldId === 'provenance-glyph'
    ? provenanceShape(iconId, candidateId, size)
    : editorialShape(iconId, candidateId, size);
  if (!body) throw new Error(`Missing finalist geometry: ${worldId}:${iconId}:${candidateId}:${size}`);
  return {
    svg: wrap(worldId, body, title ?? `${worldId} ${iconId} ${candidate.label} ${size}px`),
    worldId,
    iconId,
    candidateId,
    candidateLabel: candidate.label,
    intent: candidate.intent,
    size,
    semanticRefined: true
  };
}

export function renderFinalistPreservedGlyphSvg(worldId, iconId, { size = 16, title = null } = {}) {
  return renderCraftGlyphSvg(worldId, iconId, { size, title });
}
