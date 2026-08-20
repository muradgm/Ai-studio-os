import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateLogoIntegrity } from '../modules/logo-integrity/runtime.mjs';
const base = new URL('../test/fixtures/logo-integrity/', import.meta.url);
const canonical=fileURLToPath(new URL('canonical.svg',base));
const specJson=fileURLToPath(new URL('mark-spec.json',base));
const master=fs.readFileSync(canonical,'utf8');
function tempSvg(transform){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'logo-runtime-'));const p=path.join(dir,'candidate.svg');fs.writeFileSync(p,transform(master));return p;}
const input=(candidateSvg)=>({artifacts:{canonicalSvg:canonical,candidateSvg,specJson}});
test('runtime prefers artifact-derived integrity evidence',()=>{const r=validateLogoIntegrity(input(canonical));assert.equal(r.status,'locked');assert.equal(r.evidenceMode,'artifact-derived');assert.equal(r.locks.shape.status,'locked');});
test('runtime maps real color drift into SVG lock',()=>{const p=tempSvg(s=>s.replace('#E54832','#E64C35'));const r=validateLogoIntegrity(input(p));assert.equal(r.status,'blocked');assert.equal(r.locks.svg.status,'blocked');});
test('runtime maps real overlap drift into overlap lock',()=>{const p=tempSvg(s=>s.replace('M85 20 C60 20 40 35 40 50 C40 65 60 80 85 80 Z','M85 20 C64 20 48 35 48 50 C48 65 64 80 85 80 Z'));const r=validateLogoIntegrity(input(p));assert.equal(r.status,'blocked');assert.equal(r.locks.overlap.status,'blocked');});
