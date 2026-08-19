const DEFAULT_REQUIRED_CATEGORIES = Object.freeze([
  'strategy',
  'creative-direction',
  'logo',
  'color',
  'typography',
  'icon-system',
  'guidelines'
]);

const APPROVED_STATES = new Set(['approved', 'frozen']);
const ASSET_CATEGORIES = new Set([
  ...DEFAULT_REQUIRED_CATEGORIES,
  'voice',
  'imagery',
  'motion',
  'graphic-system',
  'copy',
  'applications',
  'social',
  'presentation'
]);

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

function compactStrings(values = []) {
  return [...new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean))];
}

function objectOrEmpty(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? structuredClone(value) : {};
}

function normalizeAsset(asset, brandDnaVersion) {
  const category = String(asset?.category ?? '').trim();
  return {
    id: String(asset?.id ?? '').trim(),
    category,
    name: String(asset?.name ?? asset?.id ?? category).trim(),
    artifactRef: String(asset?.artifactRef ?? asset?.path ?? '').trim(),
    version: String(asset?.version ?? '1.0.0'),
    brandDnaVersion: String(asset?.brandDnaVersion ?? brandDnaVersion ?? ''),
    status: String(asset?.status ?? 'draft'),
    provenance: objectOrEmpty(asset?.provenance),
    rights: objectOrEmpty(asset?.rights),
    review: objectOrEmpty(asset?.review),
    integrity: objectOrEmpty(asset?.integrity),
    metadata: objectOrEmpty(asset?.metadata)
  };
}

export function createBrandDNA(input = {}) {
  const findings = [];
  const brandId = String(input.brandId ?? '').trim();
  const version = String(input.version ?? '1.0.0').trim();
  const strategy = objectOrEmpty(input.strategy);
  const creativeDirection = objectOrEmpty(input.creativeDirection);

  if (!brandId) findings.push(finding('blocker', 'brand-id-missing', 'Brand DNA requires a stable brandId.'));
  if (!String(strategy.positioning ?? '').trim()) findings.push(finding('blocker', 'positioning-missing', 'Brand DNA requires an explicit positioning statement.'));
  if (!String(strategy.audience ?? '').trim()) findings.push(finding('blocker', 'audience-missing', 'Brand DNA requires an explicit primary audience.'));
  if (!String(strategy.promise ?? strategy.valuePromise ?? '').trim()) findings.push(finding('major', 'brand-promise-missing', 'Brand DNA should state the customer-facing promise or value.'));
  if (!String(creativeDirection.idea ?? creativeDirection.principle ?? '').trim()) {
    findings.push(finding('blocker', 'creative-direction-missing', 'Brand DNA requires one approved creative idea or governing principle.'));
  }

  const visualPrinciples = compactStrings(creativeDirection.visualPrinciples ?? input.visualPrinciples ?? []);
  if (visualPrinciples.length < 2) {
    findings.push(finding('major', 'visual-principles-thin', 'Brand DNA should define at least two concrete visual principles.', { count: visualPrinciples.length }));
  }

  const dna = {
    schema: 'ai-studio-os/brand-dna@1',
    brandId,
    version,
    status: String(input.status ?? 'draft'),
    strategy: {
      positioning: String(strategy.positioning ?? '').trim(),
      audience: String(strategy.audience ?? '').trim(),
      promise: String(strategy.promise ?? strategy.valuePromise ?? '').trim(),
      categoryTension: String(strategy.categoryTension ?? '').trim(),
      personality: compactStrings(strategy.personality ?? [])
    },
    creativeDirection: {
      idea: String(creativeDirection.idea ?? creativeDirection.principle ?? '').trim(),
      visualPrinciples,
      antiReferences: compactStrings(creativeDirection.antiReferences ?? [])
    },
    voice: objectOrEmpty(input.voice),
    color: objectOrEmpty(input.color),
    typography: objectOrEmpty(input.typography),
    geometry: objectOrEmpty(input.geometry),
    imagery: objectOrEmpty(input.imagery),
    motion: objectOrEmpty(input.motion),
    iconDNA: objectOrEmpty(input.iconDNA),
    provenance: objectOrEmpty(input.provenance),
    unresolved: compactStrings(input.unresolved ?? []),
    findings
  };
  dna.pass = !findings.some((item) => item.severity === 'blocker');
  return dna;
}

export function createBrandKitManifest({
  brandDNA,
  assets = [],
  applications = [],
  reviews = [],
  legal = {},
  requiredCategories = DEFAULT_REQUIRED_CATEGORIES
} = {}) {
  const dna = brandDNA ? structuredClone(brandDNA) : null;
  const brandDnaVersion = String(dna?.version ?? '');
  return {
    schema: 'ai-studio-os/brand-kit-manifest@1',
    id: dna?.brandId ? `${dna.brandId}-brand-kit` : 'unbound-brand-kit',
    brandId: String(dna?.brandId ?? ''),
    brandDnaVersion,
    status: 'review-candidate',
    requiredCategories: compactStrings(requiredCategories),
    brandDNA: dna,
    assets: assets.map((asset) => normalizeAsset(asset, brandDnaVersion)),
    applications: applications.map((application) => ({
      id: String(application?.id ?? '').trim(),
      name: String(application?.name ?? application?.id ?? '').trim(),
      artifactRef: String(application?.artifactRef ?? application?.path ?? '').trim(),
      brandDnaVersion: String(application?.brandDnaVersion ?? brandDnaVersion),
      status: String(application?.status ?? 'draft'),
      review: objectOrEmpty(application?.review)
    })),
    reviews: reviews.map((review) => ({
      type: String(review?.type ?? '').trim(),
      reviewer: String(review?.reviewer ?? '').trim(),
      independent: review?.independent === true,
      status: String(review?.status ?? 'pending'),
      evidenceRef: String(review?.evidenceRef ?? '').trim()
    })),
    legal: {
      trademarkStatus: String(legal?.trademarkStatus ?? 'unresolved'),
      evidenceRef: String(legal?.evidenceRef ?? '').trim(),
      notes: compactStrings(legal?.notes ?? [])
    }
  };
}

function categoryMap(assets = []) {
  const map = new Map();
  for (const asset of assets) {
    if (!map.has(asset.category)) map.set(asset.category, []);
    map.get(asset.category).push(asset);
  }
  return map;
}

function reviewPassed(reviews, type) {
  return reviews.some((review) => review.type === type && review.independent === true && review.status === 'passed');
}

export function evaluateBrandKitManifest(manifest = {}, options = {}) {
  const findings = [];
  const requiredCategories = compactStrings(options.requiredCategories ?? manifest.requiredCategories ?? DEFAULT_REQUIRED_CATEGORIES);
  const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
  const applications = Array.isArray(manifest.applications) ? manifest.applications : [];
  const reviews = Array.isArray(manifest.reviews) ? manifest.reviews : [];
  const dna = manifest.brandDNA;
  const brandDnaVersion = String(manifest.brandDnaVersion ?? dna?.version ?? '');
  const byCategory = categoryMap(assets);

  if (!dna || typeof dna !== 'object') {
    findings.push(finding('blocker', 'brand-dna-missing', 'Brand Kit cannot be released without Brand DNA.'));
  } else {
    for (const inherited of dna.findings ?? []) {
      if (inherited.severity === 'blocker') findings.push(finding('blocker', 'brand-dna-invalid', inherited.message, { source: inherited.code }));
    }
    if (!brandDnaVersion) findings.push(finding('blocker', 'brand-dna-version-missing', 'Brand Kit must bind every artifact to a Brand DNA version.'));
  }

  for (const category of requiredCategories) {
    const candidates = byCategory.get(category) ?? [];
    if (!candidates.length) {
      findings.push(finding('blocker', 'required-brand-asset-missing', `Required brand-kit category '${category}' has no produced artifact.`, { category }));
      continue;
    }
    if (!candidates.some((asset) => asset.artifactRef)) {
      findings.push(finding('blocker', 'brand-asset-reference-missing', `Required category '${category}' has no artifact reference.`, { category }));
    }
    if (!candidates.some((asset) => APPROVED_STATES.has(asset.status))) {
      findings.push(finding('blocker', 'brand-asset-unapproved', `Required category '${category}' has no approved/frozen artifact.`, { category }));
    }
  }

  for (const asset of assets) {
    if (!asset.id) findings.push(finding('major', 'brand-asset-id-missing', 'Brand-kit artifact is missing a stable id.', { category: asset.category }));
    if (!ASSET_CATEGORIES.has(asset.category)) findings.push(finding('major', 'unknown-brand-asset-category', `Unknown brand-kit category '${asset.category}'.`, { id: asset.id }));
    if (brandDnaVersion && asset.brandDnaVersion !== brandDnaVersion) {
      findings.push(finding('blocker', 'brand-dna-version-drift', `${asset.id || asset.category} targets Brand DNA ${asset.brandDnaVersion || 'none'} instead of ${brandDnaVersion}.`, {
        id: asset.id,
        actual: asset.brandDnaVersion || null,
        expected: brandDnaVersion
      }));
    }
  }

  const logo = (byCategory.get('logo') ?? []).find((asset) => APPROVED_STATES.has(asset.status));
  if (logo) {
    if (logo.review.logoReview !== 'passed') findings.push(finding('blocker', 'logo-review-evidence-missing', 'Approved logo artifact must carry passed logo-review evidence.', { id: logo.id }));
    if (logo.integrity.status !== 'passed') findings.push(finding('blocker', 'logo-integrity-evidence-missing', 'Approved logo artifact must pass Logo Integrity.', { id: logo.id }));
  }

  const icons = (byCategory.get('icon-system') ?? []).find((asset) => APPROVED_STATES.has(asset.status));
  if (icons) {
    const calibrationCount = Number(icons.metadata.calibrationCount ?? 0);
    const svgMasterCount = Number(icons.metadata.svgMasterCount ?? 0);
    if (icons.metadata.personalized !== true) findings.push(finding('blocker', 'icon-system-not-personalized', 'Brand Kit icon system must be constructed from the brand geometry rather than substituted stock icons.', { id: icons.id }));
    if (!icons.metadata.iconDNA || typeof icons.metadata.iconDNA !== 'object') findings.push(finding('blocker', 'icon-dna-missing', 'Personalized icon system requires an explicit Icon DNA contract.', { id: icons.id }));
    if (calibrationCount < 5) findings.push(finding('blocker', 'icon-calibration-insufficient', 'Personalized icon system requires at least five hard calibration icons before scaling.', { calibrationCount }));
    if (svgMasterCount < calibrationCount) findings.push(finding('blocker', 'icon-svg-masters-incomplete', 'Every approved calibration icon must have an actual SVG master.', { calibrationCount, svgMasterCount }));
    if (icons.review.vectorGeometry !== 'passed') findings.push(finding('blocker', 'icon-vector-review-missing', 'Personalized icon system requires independent vector-geometry review.', { id: icons.id }));
  }

  const typography = (byCategory.get('typography') ?? []).find((asset) => APPROVED_STATES.has(asset.status));
  if (typography) {
    if (!typography.metadata.families || !Array.isArray(typography.metadata.families) || !typography.metadata.families.length) {
      findings.push(finding('major', 'typography-family-missing', 'Typography artifact must record the selected font family/families and roles.', { id: typography.id }));
    }
    if (!typography.rights.licenseStatus) findings.push(finding('major', 'typography-license-unrecorded', 'Typography handoff should record source/license status.', { id: typography.id }));
    if (typography.metadata.redistributeFontFiles === true && typography.rights.redistributionAllowed !== true) {
      findings.push(finding('blocker', 'font-redistribution-rights-missing', 'Font binaries cannot be packaged without explicit redistribution rights.', { id: typography.id }));
    }
  }

  const minimumApplications = Number.isFinite(options.minimumApplications) ? options.minimumApplications : 2;
  const approvedApplications = applications.filter((application) => APPROVED_STATES.has(application.status));
  if (approvedApplications.length < minimumApplications) {
    findings.push(finding('major', 'representative-applications-insufficient', `Brand Kit should prove the system in at least ${minimumApplications} approved applications.`, {
      approved: approvedApplications.length,
      required: minimumApplications
    }));
  }
  for (const application of approvedApplications) {
    if (brandDnaVersion && application.brandDnaVersion !== brandDnaVersion) {
      findings.push(finding('blocker', 'application-brand-dna-drift', `${application.id || application.name} uses a different Brand DNA version.`, {
        id: application.id,
        actual: application.brandDnaVersion,
        expected: brandDnaVersion
      }));
    }
  }

  if (!reviewPassed(reviews, 'brand-fit-review')) findings.push(finding('major', 'brand-fit-review-missing', 'Brand Kit needs independent brand-fit review.'));
  if (!reviewPassed(reviews, 'brand-kit-review')) findings.push(finding('blocker', 'brand-kit-review-missing', 'Final kit must pass an independent brand-kit review before delivery.'));

  const legal = manifest.legal ?? {};
  if (legal.trademarkStatus === 'cleared' && !legal.evidenceRef) {
    findings.push(finding('blocker', 'trademark-clearance-evidence-missing', 'Trademark status cannot be represented as cleared without evidence.'));
  } else if (legal.trademarkStatus !== 'cleared') {
    findings.push(finding('risk', 'trademark-status-unresolved', 'Trademark/legal clearance remains unresolved and must stay visible in the handoff.', { status: legal.trademarkStatus ?? 'unresolved' }));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const status = blockers.length ? 'blocked' : majors.length ? 'review' : 'ready';
  return {
    stage: 'brand-kit-delivery-review',
    status,
    productionReady: status === 'ready',
    brandId: manifest.brandId ?? null,
    brandDnaVersion: brandDnaVersion || null,
    requiredCategories,
    counts: {
      assets: assets.length,
      requiredCategoriesPresent: requiredCategories.filter((category) => (byCategory.get(category) ?? []).length > 0).length,
      approvedApplications: approvedApplications.length,
      blockers: blockers.length,
      majors: majors.length
    },
    findings
  };
}

export function createBrandKitDeliveryPlan(manifest = {}, options = {}) {
  const review = evaluateBrandKitManifest(manifest, options);
  const categoryFolder = {
    strategy: 'strategy',
    'creative-direction': 'direction',
    logo: 'logo',
    color: 'color',
    typography: 'typography',
    'icon-system': 'icons',
    guidelines: 'guidelines',
    voice: 'voice',
    imagery: 'imagery',
    motion: 'motion',
    'graphic-system': 'graphic-system',
    copy: 'copy',
    social: 'applications/social',
    presentation: 'applications/presentation'
  };
  const files = (manifest.assets ?? [])
    .filter((asset) => asset.artifactRef)
    .map((asset) => ({
      id: asset.id,
      source: asset.artifactRef,
      destination: `${categoryFolder[asset.category] ?? `other/${asset.category || 'uncategorized'}`}/${asset.name || asset.id}`,
      status: asset.status,
      brandDnaVersion: asset.brandDnaVersion
    }));

  return {
    stage: 'brand-kit-delivery-plan',
    status: review.productionReady ? 'ready-to-package' : 'blocked',
    review,
    files,
    applications: (manifest.applications ?? []).filter((application) => application.artifactRef).map((application) => ({
      id: application.id,
      source: application.artifactRef,
      destination: `applications/${application.name || application.id}`,
      brandDnaVersion: application.brandDnaVersion
    })),
    manifestFile: 'brand-kit.manifest.json',
    rule: 'Package only produced artifact references. A delivery plan does not fabricate missing assets or font rights.'
  };
}

export { DEFAULT_REQUIRED_CATEGORIES };
