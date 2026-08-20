import { routeSkills } from './skill-router.mjs';
import {
  createBrandDNA,
  createBrandKitManifest,
  evaluateBrandKitManifest,
  createBrandKitDeliveryPlan
} from '../modules/brand-kit/runtime.mjs';
import { createBrandKitArtifactGraph } from '../modules/brand-kit/artifact-graph.mjs';

export function runBrandKitRuntime(input = {}) {
  const route = routeSkills({
    kind: 'brand-kit',
    phase: 'recipe',
    risk: input.risk ?? 'moderate',
    recipe: input.recipe ?? 'brand-identity-kit-recipe'
  });
  const brandDNA = createBrandDNA(input.brandDNA ?? {});
  const manifest = createBrandKitManifest({
    brandDNA,
    assets: input.assets ?? [],
    applications: input.applications ?? [],
    reviews: input.reviews ?? [],
    legal: input.legal ?? {},
    requiredCategories: input.requiredCategories
  });
  const review = evaluateBrandKitManifest(manifest, input.deliveryRequirements ?? {});
  const delivery = createBrandKitDeliveryPlan(manifest, input.deliveryRequirements ?? {});
  const artifactGraph = createBrandKitArtifactGraph({
    brandDNA,
    manifest,
    review,
    delivery,
    recipe: input.recipe ?? 'brand-identity-kit-recipe'
  });

  return {
    stage: 'brand-identity-kit-runtime',
    route,
    brandDNA,
    manifest,
    review,
    delivery,
    artifactGraph,
    pass: route.status === 'ready'
      && brandDNA.pass
      && review.productionReady
      && delivery.status === 'ready-to-package'
      && artifactGraph.pass
  };
}

export function validateBrandKitBenchmark(output = {}, expected = {}) {
  const failures = [];
  if (expected.routeRecipe && output.route?.recipes?.[0]?.id !== expected.routeRecipe) failures.push(`expected route recipe ${expected.routeRecipe}`);
  if (expected.brandDnaPass !== undefined && output.brandDNA?.pass !== expected.brandDnaPass) failures.push(`expected Brand DNA pass=${expected.brandDnaPass}`);
  if (expected.reviewStatus && output.review?.status !== expected.reviewStatus) failures.push(`expected review status ${expected.reviewStatus}`);
  if (expected.productionReady !== undefined && output.review?.productionReady !== expected.productionReady) failures.push(`expected productionReady=${expected.productionReady}`);
  if (expected.requiredCategoriesPresent !== undefined && output.review?.counts?.requiredCategoriesPresent !== expected.requiredCategoriesPresent) failures.push(`expected ${expected.requiredCategoriesPresent} required categories present`);
  if (expected.approvedApplications !== undefined && output.review?.counts?.approvedApplications !== expected.approvedApplications) failures.push(`expected ${expected.approvedApplications} approved applications`);
  if (expected.deliveryStatus && output.delivery?.status !== expected.deliveryStatus) failures.push(`expected delivery status ${expected.deliveryStatus}`);
  if (expected.personalizedIcon === true) {
    const icons = output.manifest?.assets?.find((asset) => asset.category === 'icon-system');
    if (icons?.metadata?.personalized !== true || !icons?.metadata?.iconDNA) failures.push('expected personalized Icon DNA-backed system');
  }
  if (expected.unresolvedTrademarkVisible === true && !output.review?.findings?.some((item) => item.code === 'trademark-status-unresolved')) failures.push('expected unresolved trademark risk to remain visible');
  if (expected.artifactGraphPass !== undefined && output.artifactGraph?.pass !== expected.artifactGraphPass) failures.push(`expected Artifact Graph pass=${expected.artifactGraphPass}`);
  if (expected.artifactGraphArtifacts !== undefined && output.artifactGraph?.counts?.graphArtifacts !== expected.artifactGraphArtifacts) failures.push(`expected ${expected.artifactGraphArtifacts} Brand Kit graph artifacts`);
  if (expected.artifactGraphMinimumEdges !== undefined && Number(output.artifactGraph?.counts?.graphEdges ?? 0) < expected.artifactGraphMinimumEdges) failures.push(`expected at least ${expected.artifactGraphMinimumEdges} Brand Kit graph edges`);
  return { pass: failures.length === 0, failures };
}
