const WORLD_ATTRS = {
  'quiver-construct': 'stroke-linecap="butt" stroke-linejoin="miter"',
  'editorial-sign': 'stroke-linecap="round" stroke-linejoin="round"',
  'provenance-glyph': 'stroke-linecap="square" stroke-linejoin="bevel"'
};

const Q = {
  council: `<g id="base"><path d="M3 5L10 12M3 12H10M3 19L10 12"/></g><g id="structure"><path d="M10 12H20"/><path d="M17 9L20 12L17 15"/></g><g id="registration"><rect x="9" y="11" width="2" height="2" fill="currentColor" stroke="none"/></g>`,
  decision: `<g id="base"><path d="M3 6H8L13 12M3 18H8L13 12"/></g><g id="structure"><path d="M13 12H20"/><path d="M17 9L20 12L17 15"/></g>`,
  evidence: `<g id="base"><path d="M10 4H4V20H10"/><path d="M7 8H12M7 12H11M7 16H12"/></g><g id="structure"><path d="M12 12H18"/></g><g id="registration"><rect x="17" y="11" width="2" height="2" fill="currentColor" stroke="none"/></g>`,
  provenance: `<g id="base"><path d="M5 12H11M13 12H19"/></g><g id="registration"><rect x="4" y="11" width="2" height="2" fill="currentColor" stroke="none"/><rect x="11" y="11" width="2" height="2" fill="currentColor" stroke="none"/><rect x="18" y="11" width="2" height="2" fill="currentColor" stroke="none"/></g>`,
  memory: `<g id="base"><path d="M6 5H15V17H7V7H6Z"/><path d="M9 8H18V20H9"/></g><g id="registration"><path d="M12 12H15"/><rect x="14" y="11" width="2" height="2" fill="currentColor" stroke="none"/></g>`,
  supersede: `<g id="base"><path d="M3 8H11M3 16H9"/></g><g id="structure"><path d="M9 16L13 12L9 8M13 12H20"/><path d="M17 9L20 12L17 15"/></g><g id="registration"><path d="M5 6L9 10"/></g>`,
  authority: `<g id="base"><path d="M12 3V9M12 15V21"/></g><g id="structure"><path d="M3 12H9M15 12H21"/><path d="M18 9L21 12L18 15"/></g><g id="registration"><path d="M9 10V14M15 10V14"/></g>`,
  verification: `<g id="base"><path d="M5 12L9 16L18 7"/></g><g id="registration"><path d="M4 5H10M4 5V11M20 13V19H14"/></g>`,
  projects: `<g id="base"><path d="M5 4H16V15H5Z"/><path d="M8 8H19V19H8"/></g><g id="registration"><path d="M16 8H19V11"/></g>`,
  search: `<g id="base"><circle cx="9.5" cy="9.5" r="5.5"/><path d="M13.5 13.5L20 20"/></g><g id="registration"><path d="M17.5 17.5L20 20L17.5 20"/></g>`,
  approve: `<g id="base"><path d="M4 12L9 17L20 6"/></g>`,
  history: `<g id="base"><path d="M5 8H2V5"/><path d="M3 8C5 4 9 3 13 4C18 5 21 10 19 15C17 20 11 22 6 19"/></g><g id="structure"><path d="M12 7V12L16 14"/></g>`,
  activity: `<g id="base"><path d="M3 12H7L9 7L12 17L15 10L17 12H21"/></g>`,
  blocked: `<g id="base"><circle cx="12" cy="12" r="8"/><path d="M6.5 17.5L17.5 6.5"/></g>`,
  retry: `<g id="base"><path d="M6 7H3V4"/><path d="M4 7C7 3 13 3 17 6C21 9 21 15 17 18C14 21 9 21 6 18"/></g><g id="structure"><path d="M6 18L4 18L4 16"/></g>`
};

const E = {
  council: `<g id="base"><path d="M4 5C7 5 8.5 8.5 11 12C8.5 15.5 7 19 4 19"/><path d="M4 12H11"/></g><g id="structure"><path d="M11 12C14 12 16 12 20 12"/></g>`,
  decision: `<g id="base"><path d="M4 6C8 6 9 9 12 12C9 15 8 18 4 18"/></g><g id="structure"><path d="M12 12C15 12 17 12 20 12"/></g>`,
  evidence: `<g id="base"><path d="M10 4H6C4.9 4 4 4.9 4 6V18C4 19.1 4.9 20 6 20H10"/><path d="M7 8H12M7 12H11M7 16H12"/></g><g id="structure"><path d="M13 12C15 10 17 10 19 12C17 14 15 14 13 12Z"/></g>`,
  provenance: `<g id="base"><path d="M4 13C7 8 10 8 12 12C14 16 17 16 20 11"/></g><g id="semantic-mark"><circle cx="4" cy="13" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="20" cy="11" r="1.2" fill="currentColor" stroke="none"/></g>`,
  memory: `<g id="base"><path d="M7 5H15C16.1 5 17 5.9 17 7V17C17 18.1 16.1 19 15 19H7C5.9 19 5 18.1 5 17V7C5 5.9 5.9 5 7 5Z"/><path d="M9 8H18C18.6 8 19 8.4 19 9V18"/></g><g id="semantic-mark"><path d="M9 12C11 10.5 13 10.5 15 12"/></g>`,
  supersede: `<g id="base"><path d="M4 8C7 8 9 9 11 11"/><path d="M4 16C8 16 10 15 12 13"/></g><g id="structure"><path d="M11 11C14 14 16 14 20 14"/><path d="M17.5 11.5L20 14L17.5 16.5"/></g><g id="semantic-mark"><path d="M5.5 6.5L8.5 9.5"/></g>`,
  authority: `<g id="base"><path d="M12 4C10.5 7 10.5 10 12 12C13.5 14 13.5 17 12 20"/></g><g id="structure"><path d="M4 12H9M15 12H20"/><path d="M18 10L20 12L18 14"/></g>`,
  verification: `<g id="base"><circle cx="12" cy="12" r="8"/></g><g id="structure"><path d="M8 12.5L10.8 15.3L16.5 8.8"/></g>`,
  projects: `<g id="base"><rect x="5" y="4" width="11" height="11" rx="2"/><rect x="8" y="8" width="11" height="11" rx="2"/></g>`,
  search: `<g id="base"><circle cx="9.5" cy="9.5" r="5.5"/><path d="M13.7 13.7L19.5 19.5"/></g>`,
  approve: `<g id="base"><path d="M5 12.5C7 14 8.5 16 10 17C13 13 15.5 10 19 7"/></g>`,
  history: `<g id="base"><path d="M5 7C8 3.5 14 3.5 18 7C21.5 10.5 20.5 16.5 16.5 19C12.5 21.5 7.5 20 5 17"/><path d="M5 7H2V4"/></g><g id="structure"><path d="M12 7.5V12L15.5 14"/></g>`,
  activity: `<g id="base"><path d="M3 12C5 12 6.5 12 7.5 10C8.5 8 9.5 7 10.5 12C11.5 17 13 17 14.5 12C16 8 17 12 21 12"/></g>`,
  blocked: `<g id="base"><circle cx="12" cy="12" r="8"/><path d="M7 17L17 7"/></g>`,
  retry: `<g id="base"><path d="M5 7C8 3.5 14 3.5 18 7C21 10 20.5 15.5 17 18C13.5 20.5 8.5 20 5.5 17"/><path d="M5 7H2.5V4.5"/></g>`
};

const P = {
  council: `<g id="state"><rect x="3" y="4" width="3" height="3"/><rect x="3" y="10.5" width="3" height="3"/><rect x="3" y="17" width="3" height="3"/></g><g id="lineage"><path d="M6 5.5H10L13 12M6 12H13M6 18.5H10L13 12M13 12H20"/></g><g id="registration"><circle cx="13" cy="12" r="1.3" fill="currentColor" stroke="none"/></g>`,
  decision: `<g id="state"><rect x="3" y="5" width="3" height="3"/><rect x="3" y="16" width="3" height="3"/><rect x="18" y="10.5" width="3" height="3"/></g><g id="lineage"><path d="M6 6.5H10L13 12M6 17.5H10L13 12M13 12H18"/></g><g id="registration"><circle cx="13" cy="12" r="1.3" fill="currentColor" stroke="none"/></g>`,
  evidence: `<g id="state"><path d="M4 4H11V20H4Z"/><path d="M7 8H9M7 12H9M7 16H9"/></g><g id="lineage"><path d="M11 12H15"/></g><g id="registration"><circle cx="18" cy="12" r="2.5"/><circle cx="18" cy="12" r=".8" fill="currentColor" stroke="none"/></g>`,
  provenance: `<g id="state"><rect x="3" y="10.5" width="3" height="3"/><rect x="10.5" y="5" width="3" height="3"/><rect x="18" y="10.5" width="3" height="3"/></g><g id="lineage"><path d="M6 12H9M12 8V10M13.5 12H18"/></g><g id="registration"><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/></g>`,
  memory: `<g id="state"><path d="M5 5H15V16H5Z"/><path d="M9 8H19V19H9"/></g><g id="lineage"><path d="M7 18H7.5M15 12H17"/></g><g id="registration"><circle cx="17" cy="12" r="1.2" fill="currentColor" stroke="none"/></g>`,
  supersede: `<g id="state"><rect x="3" y="5" width="5" height="5"/><rect x="16" y="14" width="5" height="5"/></g><g id="lineage"><path d="M8 7.5H12V16.5H16"/><path d="M4 12L8 8"/></g><g id="registration"><circle cx="12" cy="16.5" r="1.2" fill="currentColor" stroke="none"/></g>`,
  authority: `<g id="state"><rect x="3" y="10.5" width="3" height="3"/><rect x="18" y="10.5" width="3" height="3"/></g><g id="lineage"><path d="M6 12H10M14 12H18"/><path d="M12 3V9M12 15V21"/></g><g id="registration"><rect x="10.5" y="10.5" width="3" height="3" fill="currentColor" stroke="none"/></g>`,
  verification: `<g id="state"><rect x="4" y="4" width="16" height="16"/></g><g id="lineage"><path d="M7 12L10.5 15.5L17 8.5"/></g><g id="registration"><circle cx="17" cy="8.5" r="1.2" fill="currentColor" stroke="none"/></g>`,
  projects: `<g id="state"><rect x="4" y="4" width="10" height="10"/><rect x="10" y="10" width="10" height="10"/></g><g id="lineage"><path d="M14 8H17V10"/></g>`,
  search: `<g id="state"><circle cx="9.5" cy="9.5" r="5.5"/></g><g id="lineage"><path d="M13.5 13.5L16 16M18 18L20 20"/></g><g id="registration"><rect x="16" y="16" width="2" height="2" fill="currentColor" stroke="none"/></g>`,
  approve: `<g id="state"><rect x="4" y="4" width="16" height="16"/></g><g id="lineage"><path d="M7 12L10.5 15.5L17 8.5"/></g>`,
  history: `<g id="state"><rect x="4" y="4" width="16" height="16"/></g><g id="lineage"><path d="M12 7V12L16 14"/><path d="M7 7H4V4"/></g><g id="registration"><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none"/></g>`,
  activity: `<g id="state"><rect x="3" y="10.5" width="3" height="3"/><rect x="18" y="10.5" width="3" height="3"/></g><g id="lineage"><path d="M6 12H8L10 8L13 16L16 12H18"/></g>`,
  blocked: `<g id="state"><rect x="4" y="4" width="16" height="16"/></g><g id="lineage"><path d="M6.5 17.5L17.5 6.5"/></g><g id="registration"><rect x="10.5" y="10.5" width="3" height="3" fill="currentColor" stroke="none"/></g>`,
  retry: `<g id="state"><rect x="4" y="5" width="3" height="3"/><rect x="17" y="16" width="3" height="3"/></g><g id="lineage"><path d="M7 6.5H13C17 6.5 19 9 19 12C19 15 17 17.5 13 17.5H7"/><path d="M7 17.5L10 14.5M7 17.5L10 20.5"/></g>`
};

const SHAPES = {
  'quiver-construct': Q,
  'editorial-sign': E,
  'provenance-glyph': P
};

export const CALIBRATION_GLYPH_IDS = ['council','decision','evidence','provenance','memory','supersede','authority','verification','projects','search'];
export const CONTRAST_GLYPH_IDS = ['approve','history','activity','blocked','retry'];
export const PROOF_GLYPH_IDS = [...CALIBRATION_GLYPH_IDS, ...CONTRAST_GLYPH_IDS];

export function renderCalibrationSvg(worldId, iconId, { title = null } = {}) {
  const shapes = SHAPES[worldId];
  if (!shapes) throw new Error(`Unknown Icon World: ${worldId}`);
  const body = shapes[iconId];
  if (!body) throw new Error(`Unknown proof glyph: ${iconId}`);
  const attrs = WORLD_ATTRS[worldId];
  const titleNode = title ? `<title>${String(title).replace(/[&<>]/g, '')}</title>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" ${attrs} vector-effect="non-scaling-stroke">${titleNode}${body}</svg>`;
}

export function validateCalibrationSvg(svg) {
  const findings = [];
  const text = String(svg ?? '');
  if (!/^<svg\b/.test(text)) findings.push('missing-svg-root');
  if (!/viewBox="0 0 24 24"/.test(text)) findings.push('invalid-viewbox');
  if (/<image\b/i.test(text)) findings.push('raster-content');
  if (/\btransform=/i.test(text)) findings.push('transform-present');
  if (/<(?:clipPath|mask)\b/i.test(text)) findings.push('clip-or-mask-present');
  if (/display="none"|visibility="hidden"/i.test(text)) findings.push('hidden-geometry');
  const pathData = [...text.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)].map((match) => match[1]);
  if (pathData.length !== new Set(pathData).size) findings.push('duplicate-path-data');
  return { pass: findings.length === 0, findings };
}
