import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBrandDNA,
  createBrandKitManifest,
  evaluateBrandKitManifest,
  createBrandKitDeliveryPlan
} from '../modules/brand-kit/runtime.mjs';
import { routeSkills } from '../lib/skill-router.mjs';

function approvedDNA() {
  return createBrandDNA({
    brandId: 'calibration-brand',
    version: '1.0.0',
    status: 'approved',
    strategy: {
      positioning: 'A precise creative-production system for teams that need coherent brand work.',
      audience: 'Design-led product teams',
      promise: 'One accountable system from direction to delivery.',
      personality: ['precise', 'editorial', 'confident']
    },
    creativeDirection: {
      idea: 'Bounded expression: rigor contains creative range.',
      visualPrinciples: ['Structured negative space', 'One semantic accent', 'Editorial hierarchy'],
      antiReferences: ['generic AI glow', 'decorative glass panels']
    },
    geometry: { grid: 8, dominantAngles: [0, 45, 90] },
    iconDNA: { canvas: 24, stroke: 1.5, caps: 'square', joins: 'miter' }
  });
}

function completeAssets(version = '1.0.0') {
  const base = (id, category, metadata = {}, extra = {}) => ({
    id,
    category,
    name: id,
    artifactRef: `artifacts/${id}`,
    brandDnaVersion: version,
    status: 'approved',
    metadata,
    ...extra
  });
  return [
    base('strategy-v1.md', 'strategy'),
    base('direction-v1.md', 'creative-direction'),
    base('logo-master.svg', 'logo', {}, { review: { logoReview: 'passed' }, integrity: { status: 'passed' } }),
    base('palette.json', 'color'),
    base('typography.json', 'typography', { families: [{ family: 'Example Sans', role: 'UI' }], redistributeFontFiles: false }, { rights: { licenseStatus: 'reference-only' } }),
    base('icons/core-v1', 'icon-system', {
      personalized: true,
      calibrationCount: 6,
      svgMasterCount: 24,
      iconDNA: { canvas: 24, stroke: 1.5, grammar: 'brand-derived' }
    }, { review: { vectorGeometry: 'passed' } }),
    base('brand-guidelines.pdf', 'guidelines')
  ];
}

function completeManifest(overrides = {}) {
  const dna = overrides.brandDNA ?? approvedDNA();
  return createBrandKitManifest({
    brandDNA: dna,
    assets: overrides.assets ?? completeAssets(dna.version),
    applications: overrides.applications ?? [
      { id: 'web', name: 'Website application', artifactRef: 'artifacts/apps/web.png', brandDnaVersion: dna.version, status: 'approved' },
      { id: 'social', name: 'Social application', artifactRef: 'artifacts/apps/social.png', brandDnaVersion: dna.version, status: 'approved' }
    ],
    reviews: overrides.reviews ?? [
      { type: 'brand-fit-review', reviewer: 'independent-brand-reviewer', independent: true, status: 'passed', evidenceRef: 'reviews/brand-fit.json' },
      { type: 'brand-kit-review', reviewer: 'independent-kit-reviewer', independent: true, status: 'passed', evidenceRef: 'reviews/brand-kit.json' }
    ],
    legal: overrides.legal ?? { trademarkStatus: 'unresolved', notes: ['Formal clearance remains external to this kit.'] }
  });
}

test('Brand DNA fails closed without positioning/audience/creative direction', () => {
  const dna = createBrandDNA({ brandId: 'incomplete' });
  assert.equal(dna.pass, false);
  const codes = new Set(dna.findings.map((item) => item.code));
  assert.ok(codes.has('positioning-missing'));
  assert.ok(codes.has('audience-missing'));
  assert.ok(codes.has('creative-direction-missing'));
});

test('complete coherent brand kit reaches ready while preserving unresolved trademark risk', () => {
  const manifest = completeManifest();
  const review = evaluateBrandKitManifest(manifest);
  assert.equal(review.status, 'ready');
  assert.equal(review.productionReady, true);
  assert.equal(review.counts.requiredCategoriesPresent, 7);
  assert.equal(review.counts.approvedApplications, 2);
  assert.ok(review.findings.some((item) => item.code === 'trademark-status-unresolved'));
  assert.equal(review.findings.some((item) => item.severity === 'blocker' || item.severity === 'major'), false);
});

test('personalized icon contract blocks stock/cosmetic icon substitution', () => {
  const assets = completeAssets();
  const icon = assets.find((asset) => asset.category === 'icon-system');
  icon.metadata.personalized = false;
  delete icon.metadata.iconDNA;
  icon.metadata.calibrationCount = 2;
  const review = evaluateBrandKitManifest(completeManifest({ assets }));
  const codes = new Set(review.findings.map((item) => item.code));
  assert.equal(review.status, 'blocked');
  assert.ok(codes.has('icon-system-not-personalized'));
  assert.ok(codes.has('icon-dna-missing'));
  assert.ok(codes.has('icon-calibration-insufficient'));
});

test('Brand DNA drift across assets blocks the kit', () => {
  const assets = completeAssets();
  assets.find((asset) => asset.category === 'logo').brandDnaVersion = '0.9.0';
  const review = evaluateBrandKitManifest(completeManifest({ assets }));
  assert.equal(review.productionReady, false);
  assert.ok(review.findings.some((item) => item.code === 'brand-dna-version-drift'));
});

test('font binaries cannot be packaged without explicit redistribution rights', () => {
  const assets = completeAssets();
  const type = assets.find((asset) => asset.category === 'typography');
  type.metadata.redistributeFontFiles = true;
  type.rights = { licenseStatus: 'licensed', redistributionAllowed: false };
  const review = evaluateBrandKitManifest(completeManifest({ assets }));
  assert.equal(review.status, 'blocked');
  assert.ok(review.findings.some((item) => item.code === 'font-redistribution-rights-missing'));
});

test('delivery plan contains only produced artifact references and blocks incomplete kits', () => {
  const manifest = completeManifest();
  const plan = createBrandKitDeliveryPlan(manifest);
  assert.equal(plan.status, 'ready-to-package');
  assert.equal(plan.files.length, 7);
  assert.ok(plan.files.every((file) => file.source));

  manifest.assets.find((asset) => asset.category === 'guidelines').artifactRef = '';
  const blocked = createBrandKitDeliveryPlan(manifest);
  assert.equal(blocked.status, 'blocked');
  assert.equal(blocked.files.some((file) => file.id === 'brand-guidelines.pdf'), false);
});

test('brand-kit route selects the dedicated recipe and independent kit review without breaking skill caps', () => {
  const recipe = routeSkills({ kind: 'brand-kit', phase: 'recipe', risk: 'high' });
  assert.equal(recipe.status, 'ready');
  assert.equal(recipe.recipes[0].id, 'brand-identity-kit-recipe');
  assert.ok(recipe.challengers.some((skill) => skill.id === 'creative-skeptic'));
  assert.ok(recipe.reviews.some((skill) => skill.id === 'brand-kit-review'));
  assert.ok(recipe.roles.length <= 3);
  assert.ok(recipe.tasks.length <= 2);

  const review = routeSkills({ kind: 'brand-kit', phase: 'review', risk: 'moderate' });
  assert.equal(review.roles.length, 0);
  assert.equal(review.tasks.length, 0);
  assert.equal(review.recipes.length, 0);
  assert.ok(review.reviews.some((skill) => skill.id === 'brand-kit-review'));
});
