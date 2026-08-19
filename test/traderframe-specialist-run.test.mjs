import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { routeSkills } from '../lib/skill-router.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectPath = path.join(root, 'projects/traderframe/run-001/project.json');
const reportPath = path.join(root, 'projects/traderframe/run-001/README.md');
const htmlPath = path.join(root, 'apps/traderframe/index.html');
const jsPath = path.join(root, 'apps/traderframe/src/main.js');
const cssPath = path.join(root, 'apps/traderframe/src/styles.css');

const project = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
const report = fs.readFileSync(reportPath, 'utf8');
const html = fs.readFileSync(htmlPath, 'utf8');
const js = fs.readFileSync(jsPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');

test('TraderFrame run preserves locked Terminal Red palette and selected direction', () => {
  assert.equal(project.selectedDirection, 'The Frame');
  assert.deepEqual(project.identity.palette, {
    black: '#12100F',
    paper: '#F0EAE0',
    vermilion: '#E54832',
    steel: '#6C7772',
    graphite: '#272A26'
  });
  for (const value of Object.values(project.identity.palette)) {
    assert.ok(css.includes(value), `prototype CSS must include ${value}`);
  }
});

test('TraderFrame exploration contains four materially named concept directions', () => {
  assert.equal(project.concepts.length, 4);
  assert.deepEqual(project.concepts.map((concept) => concept.name), [
    'After Hours',
    'The Frame',
    'Decision Surface',
    'Pressure Field'
  ]);
  assert.ok(report.includes('### COUNCIL VERDICT'));
  assert.ok(report.includes('## 8. Selected Creative Direction — THE FRAME'));
});

test('high-risk landing-page direction route preserves makers and challenger', () => {
  const result = routeSkills({ kind: 'landing-page', phase: 'create', risk: 'high' });
  assert.equal(result.status, 'ready');
  assert.deepEqual(result.roles.map((skill) => skill.id), ['brand-strategist', 'art-direction', 'product-designer']);
  assert.deepEqual(result.challengers.map((skill) => skill.id), ['creative-skeptic']);
  assert.ok(result.reviews.some((skill) => skill.id === 'brand-fit-review'));
});

test('prototype visibly labels illustrative product data and avoids unsupported product claims', () => {
  const combined = `${html}\n${js}`;
  assert.ok(combined.includes('NOT LIVE DATA'));
  assert.ok(combined.includes('CONCEPT UI'));
  const blockedClaims = [
    /real[- ]?time data/i,
    /execute trades?/i,
    /broker integration/i,
    /guaranteed/i,
    /win rate/i,
    /100 million/i,
    /ai-powered/i
  ];
  for (const claim of blockedClaims) {
    assert.doesNotMatch(combined, claim);
  }
});

test('prototype includes reduced-motion behavior and frame-state logic', () => {
  assert.match(js, /prefers-reduced-motion/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(js, /drawFrameResolution/);
  assert.match(js, /frameRect/);
  assert.ok(report.includes('AMBIENT FIELD → FRAME ACQUIRE → RESOLVE → SIGNAL EVENT → UI SETTLE → IDLE'));
});
