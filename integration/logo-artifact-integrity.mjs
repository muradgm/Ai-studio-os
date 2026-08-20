import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectLogoArtifacts } from '../modules/logo-integrity/artifact-adapter.mjs';

const base = new URL('../test/fixtures/logo-integrity/', import.meta.url);
const canonical = fileURLToPath(new URL('canonical.svg', base));
const specJson = fileURLToPath(new URL('mark-spec.json', base));
const master = fs.readFileSync(canonical,'utf8');
function candidate(name, transform) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'logo-integrity-'));
  const file=path.join(dir,name);
  fs.writeFileSync(file,transform(master));
  return file;
}
function inspect(file){ return inspectLogoArtifacts({canonicalSvg:canonical,candidateSvg:file,specJson}); }

test('real artifact adapter locks identical SVG', () => {
  const r=inspect(canonical);
  assert.equal(r.status,'locked');
  assert.match(r.canonical.fileSha256,/^[a-f0-9]{64}$/);
  assert.equal(r.renderEvidence.length,4);
  assert.deepEqual(r.canonical.shapeIds,['arm-a','arm-b']);
  assert.equal(r.inspectorEvidence,'artifact-inspector:playwright-chromium');
});

const corruptions = [
  ['shape translation', s=>s.replace('id="arm-b" fill="#E54832"','id="arm-b" transform="translate(3 0)" fill="#E54832"'), /shape geometry drift|rendered bbox drift|visual drift/],
  ['Bezier drift', s=>s.replace('C60 20 40 35 40 50','C60 20 43 35 40 50'), /shape geometry drift/],
  ['color drift', s=>s.replace('#E54832','#E64C35'), /color|unapproved/],
  ['layer swap', s=>s.replace('  <g id="layer-base" data-layer-id="base" data-role="foundation">\n    <path id="arm-a" fill="#12100F" d="M15 20 C40 20 60 35 60 50 C60 65 40 80 15 80 Z"/>\n  </g>\n  <g id="layer-top" data-layer-id="top" data-role="overlay" mask="url(#center-cut)">\n    <path id="arm-b" fill="#E54832" d="M85 20 C60 20 40 35 40 50 C40 65 60 80 85 80 Z"/>\n  </g>', '  <g id="layer-top" data-layer-id="top" data-role="overlay" mask="url(#center-cut)">\n    <path id="arm-b" fill="#E54832" d="M85 20 C60 20 40 35 40 50 C40 65 60 80 85 80 Z"/>\n  </g>\n  <g id="layer-base" data-layer-id="base" data-role="foundation">\n    <path id="arm-a" fill="#12100F" d="M15 20 C40 20 60 35 60 50 C60 65 40 80 15 80 Z"/>\n  </g>'), /layer structure\/order drift/],
  ['removed mask', s=>s.replace(' mask="url(#center-cut)"',''), /layer structure\/order drift/],
  ['overlap drift', s=>s.replace('M85 20 C60 20 40 35 40 50 C40 65 60 80 85 80 Z','M85 20 C64 20 48 35 48 50 C48 65 64 80 85 80 Z'), /overlap geometry drift|shape geometry drift/],
  ['extra shape', s=>s.replace('</svg>','  <circle id="surprise" cx="50" cy="10" r="3" fill="#12100F"/>\n</svg>'), /unexpected shape IDs/],
  ['viewBox drift', s=>s.replace('viewBox="0 0 100 100"','viewBox="0 0 120 100"'), /viewBox drift/],
  ['flattened layers', s=>s.replace('  <g id="layer-base" data-layer-id="base" data-role="foundation">\n','').replace('  </g>\n  <g id="layer-top" data-layer-id="top" data-role="overlay" mask="url(#center-cut)">\n','').replace('  </g>\n</svg>','</svg>'), /shape layer drift|layer structure\/order drift/],
  ['embedded raster', s=>s.replace('</svg>','  <image id="raster" x="1" y="1" width="1" height="1" href="data:image/png;base64,iVBORw0KGgo="/>\n</svg>'), /embedded raster/],
  ['external resource', s=>s.replace('</svg>','  <image id="external" href="https://example.com/x.png" x="0" y="0" width="5" height="5"/>\n</svg>'), /unsafe\/external content/],
  ['CSS import', s=>s.replace('</svg>','  <style>@import url("https://example.com/remote.css");</style>\n</svg>'), /unsafe\/external content/],
  ['DTD/entity source', s=>'<!DOCTYPE svg [<!ENTITY x "boom">]>\n'+s, /unsafe\/external content/]
];
for (const [name,mutate,pattern] of corruptions) {
  test(`corruption pack blocks ${name}`, () => {
    const r=inspect(candidate('candidate.svg',mutate));
    assert.equal(r.status,'blocked');
    assert(r.findings.some((f)=>pattern.test(f)), JSON.stringify(r.findings));
  });
}
