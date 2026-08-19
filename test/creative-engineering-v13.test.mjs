import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import {
  createCreativeEngineeringPlan,
  evaluateDeliveryGates,
  createPatchQueue,
  createCapturePlan,
  buildResponsiveEvidence,
  createBlenderJob,
  executeBlenderJob,
  createRealtimeSceneSpec,
  createRiveRuntimeSpec,
  createMotionEngineeringSpec,
  createWebStackManifest
} from '../modules/creative-engineering/index.mjs';
import { routeSkills } from '../lib/skill-router.mjs';

test('v1.3 creative engineering plan selects capabilities without forcing spectacle', () => {
  const simple = createCreativeEngineeringPlan({ projectId: 'simple', entryPath: 'index.html', needs: [] });
  assert.equal(simple.pass, true);
  assert.deepEqual(simple.stack.packages.map((item) => item.package), ['playwright']);

  const immersive = createCreativeEngineeringPlan({
    projectId: 'immersive',
    entryPath: 'index.html',
    needs: ['3d', 'motion', 'rive'],
    assetPlan: { status: 'ready' },
    reducedMotionPlan: { mode: 'authored' }
  });
  assert.equal(immersive.pass, true);
  assert.deepEqual(immersive.stack.packages.map((item) => item.package), ['playwright', 'three', 'gsap', '@rive-app/canvas']);
});

test('web stack manifest keeps WebGPU preferred with WebGL2 fallback when requested', () => {
  const stack = createWebStackManifest({ needs: ['webgpu'] });
  assert.equal(stack.rendererPreference.preferred, 'webgpu');
  assert.equal(stack.rendererPreference.fallback, 'webgl2');
});

test('production plan flags missing 3d asset plan and reduced motion as majors', () => {
  const plan = createCreativeEngineeringPlan({ projectId: 'x', entryPath: 'x.html', needs: ['3d', 'motion'] });
  assert.equal(plan.pass, true);
  assert.deepEqual(plan.findings.map((item) => item.code).sort(), ['3d-asset-plan-missing', 'reduced-motion-plan-missing']);
});

test('delivery gates fail closed on core web, accessibility, and responsive blockers', () => {
  const result = evaluateDeliveryGates({
    metrics: {
      webVitals: { lcpMs: 2700, inpMs: 140, cls: 0.05 },
      runtime: { fps: 60, maxFrameMs: 18, longTasks: 0 },
      bundle: { initialJsKb: 300, initialCssKb: 40 },
      accessibility: { blockers: 1, majors: 0 },
      responsive: { mobile: { pass: true }, tablet: { pass: false }, desktop: { pass: true } }
    }
  });
  assert.equal(result.pass, false);
  assert.equal(result.productionReady, false);
  assert.ok(result.findings.some((item) => item.code === 'lcp-budget-failed'));
  assert.ok(result.findings.some((item) => item.code === 'accessibility-blockers'));
  assert.ok(result.findings.some((item) => item.code === 'responsive-viewport-failed'));
});

test('delivery gates pass clean evidence and distinguish major performance debt from blockers', () => {
  const clean = evaluateDeliveryGates({ metrics: {
    webVitals: { lcpMs: 1900, inpMs: 120, cls: 0.03 },
    runtime: { fps: 60, maxFrameMs: 16, longTasks: 0 },
    bundle: { initialJsKb: 320, initialCssKb: 50 },
    accessibility: { blockers: 0, majors: 0 },
    responsive: { mobile: { pass: true }, tablet: { pass: true }, desktop: { pass: true } }
  }});
  assert.equal(clean.pass, true);
  assert.equal(clean.productionReady, true);

  const major = evaluateDeliveryGates({ metrics: {
    runtime: { fps: 42 },
    accessibility: { blockers: 0, majors: 0 },
    responsive: { mobile: { pass: true }, tablet: { pass: true }, desktop: { pass: true } }
  }});
  assert.equal(major.pass, true);
  assert.equal(major.productionReady, false);
  assert.ok(major.findings.some((item) => item.code === 'fps-budget-failed'));
});

test('patch loop is ordered and capped', () => {
  const queue = createPatchQueue([
    { severity: 'minor', code: 'spacing', message: 'Fix spacing' },
    { severity: 'blocker', code: 'keyboard', message: 'Restore keyboard path' }
  ], { iteration: 2, maxIterations: 4 });
  assert.equal(queue.status, 'ready');
  assert.equal(queue.patches[0].sourceFinding, 'keyboard');
  assert.equal(createPatchQueue([], { iteration: 4, maxIterations: 4 }).status, 'blocked');
});

test('browser capture plan covers viewports and reduced motion deterministically', () => {
  const plan = createCapturePlan({ baseUrl: 'https://example.test', routes: ['/'] });
  assert.equal(plan.targets.length, 6);
  assert.equal(plan.targets.filter((target) => target.reducedMotion).length, 3);
  const evidence = buildResponsiveEvidence([
    { viewport: { id: 'mobile', width: 390 }, reducedMotion: false, pass: true, documentState: { width: 390 }, pageErrors: [], consoleErrors: [], screenshot: 'm.png' }
  ]);
  assert.equal(evidence.mobile.pass, true);
});

test('blender adapter builds shell-free deterministic jobs and reports missing binary', async () => {
  const job = createBlenderJob({ sourceFile: '/tmp/source.blend', scriptFile: '/tmp/export.py', outputDir: '/tmp/out' });
  assert.equal(job.args[0], '--background');
  assert.equal(job.args.includes('--python'), true);
  const fakeSpawn = () => {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    queueMicrotask(() => child.emit('error', new Error('ENOENT')));
    return child;
  };
  const result = await executeBlenderJob(job, { spawnImpl: fakeSpawn });
  assert.equal(result.pass, false);
  assert.equal(result.code, 'blender-unavailable');
});

test('realtime, Rive, and motion specs block or flag missing execution contracts', () => {
  assert.equal(createRealtimeSceneSpec({}).pass, false);
  assert.equal(createRiveRuntimeSpec({}).pass, false);
  const motion = createMotionEngineeringSpec({ states: ['intro', 'idle'], trigger: 'load', settleState: 'idle' });
  assert.equal(motion.pass, true);
});

test('new specialist bundles route makers, independent reviews, recipes, and challenger correctly', () => {
  const immersive = routeSkills({ kind: 'immersive-web', phase: 'create', risk: 'high' });
  assert.equal(immersive.status, 'ready');
  assert.deepEqual(immersive.roles.map((item) => item.id), ['creative-developer', 'realtime-webgl-engineer', 'motion-engineer']);
  assert.deepEqual(immersive.tasks.map((item) => item.id), ['webgl-scene-construction', 'responsive-immersive-adaptation']);
  assert.ok(immersive.reviews.some((item) => item.id === 'performance-budget-review'));
  assert.deepEqual(immersive.challengers.map((item) => item.id), ['creative-skeptic']);

  const recipe = routeSkills({ kind: 'interactive-world', phase: 'recipe', risk: 'high' });
  assert.equal(recipe.status, 'ready');
  assert.equal(recipe.recipes[0].id, 'interactive-world-recipe');

  const review = routeSkills({ kind: 'cinematic-product-page', phase: 'review', risk: 'high' });
  assert.equal(review.roles.length, 0);
  assert.equal(review.tasks.length, 0);
  assert.equal(review.recipes.length, 0);
  assert.ok(review.reviews.some((item) => item.id === 'responsive-motion-review'));
});
