import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'kernel/skill-registry.json'), 'utf8'));

const BUNDLES = {
  logo: {
    roles: ['brand-strategist', 'logo-designer', 'art-direction'],
    tasks: ['logo-exploration'],
    reviews: ['logo-review', 'brand-fit-review'],
    recipes: ['logo-system-recipe', 'brand-identity-recipe']
  },
  identity: {
    roles: ['brand-strategist', 'art-direction', 'logo-designer'],
    tasks: ['logo-exploration'],
    reviews: ['brand-fit-review', 'logo-review', 'creative-critic'],
    recipes: ['brand-identity-recipe', 'logo-system-recipe']
  },
  'landing-page': {
    roles: ['brand-strategist', 'art-direction', 'product-designer'],
    tasks: ['landing-page-layout', 'hero-section-design'],
    reviews: ['brand-fit-review', 'creative-critic'],
    recipes: ['landing-page-recipe']
  },
  copy: {
    roles: ['copywriter', 'brand-strategist'],
    tasks: ['headline-writing'],
    reviews: ['copy-review', 'brand-fit-review'],
    recipes: []
  },
  motion: {
    roles: ['motion-designer', 'art-direction'],
    tasks: ['motion-choreography'],
    reviews: ['motion-review', 'creative-critic'],
    recipes: ['scroll-cinematic-recipe']
  },
  image: {
    roles: ['image-director', 'art-direction'],
    tasks: [],
    reviews: ['brand-fit-review', 'creative-critic'],
    recipes: []
  },
  product: {
    roles: ['product-designer', 'art-direction'],
    tasks: [],
    reviews: ['creative-critic', 'brand-fit-review'],
    recipes: []
  },
  vector: {
    roles: ['vector-geometry-engineer'],
    tasks: [],
    reviews: ['vector-geometry-review'],
    recipes: []
  },
  'icon-system': {
    roles: ['art-direction', 'vector-geometry-engineer'],
    tasks: ['icon-system-construction'],
    reviews: ['vector-geometry-review', 'brand-fit-review'],
    recipes: ['icon-system-recipe']
  }
};

const byId = new Map(registry.skills.map((skill) => [skill.id, skill]));
const challengerIds = new Set(registry.routingRules.challengerSkillIds ?? []);

function uniqueKnown(ids = []) {
  return [...new Set(ids)].filter((id) => byId.has(id) && byId.get(id).status === 'active');
}

export function getSkillRegistry() {
  return structuredClone(registry);
}

export function routeSkills(input = {}) {
  const kind = input.kind ?? 'landing-page';
  const phase = input.phase ?? 'create';
  const risk = input.risk ?? 'moderate';
  const needs = new Set(input.needs ?? []);
  const bundle = BUNDLES[kind] ?? {
    roles: ['art-direction'], tasks: [], reviews: ['creative-critic'], recipes: []
  };
  const findings = [];
  const reviewPhase = phase === 'review';

  let roleIds = reviewPhase ? [] : [...bundle.roles];
  if (!reviewPhase && needs.has('copy') && !roleIds.includes('copywriter')) roleIds.push('copywriter');
  if (!reviewPhase && needs.has('image') && !roleIds.includes('image-director')) roleIds.push('image-director');
  if (!reviewPhase && needs.has('motion') && !roleIds.includes('motion-designer')) roleIds.push('motion-designer');
  if (!reviewPhase && needs.has('product') && !roleIds.includes('product-designer')) roleIds.push('product-designer');
  if (!reviewPhase && needs.has('vector') && !roleIds.includes('vector-geometry-engineer')) roleIds.push('vector-geometry-engineer');
  roleIds = uniqueKnown(roleIds).filter((id) => !challengerIds.has(id)).slice(0, registry.routingRules.maxRoleSkills);

  const taskIds = reviewPhase
    ? []
    : uniqueKnown(bundle.tasks).slice(0, registry.routingRules.maxTaskSkills);

  const skepticRequired = registry.routingRules.skepticRequiredAtRisk.includes(risk);
  const challengerSkillIds = skepticRequired
    ? uniqueKnown(['creative-skeptic']).slice(0, registry.routingRules.maxChallengerSkills ?? 1)
    : [];

  const reviewRequired = reviewPhase || registry.routingRules.reviewRequiredAtRisk.includes(risk);
  let reviewIds = reviewRequired ? uniqueKnown(bundle.reviews) : [];
  if (reviewRequired && !reviewIds.length) reviewIds = uniqueKnown(['creative-critic']);

  const requestedRecipe = input.recipe ?? null;
  let recipeIds = [];
  if (requestedRecipe) {
    const requested = byId.get(requestedRecipe);
    if (!requested || requested.status !== 'active' || requested.category !== 'recipe') {
      findings.push(`unknown or inactive requested recipe: ${requestedRecipe}`);
    } else {
      recipeIds = [requestedRecipe];
    }
  } else if (phase === 'recipe') {
    recipeIds = uniqueKnown(bundle.recipes).slice(0, 1);
    if (!recipeIds.length) findings.push(`no recipe registered for kind: ${kind}`);
  }

  const roles = roleIds.map((id) => byId.get(id));
  const tasks = taskIds.map((id) => byId.get(id));
  const challengers = challengerSkillIds.map((id) => byId.get(id));
  const reviews = reviewIds.map((id) => byId.get(id));
  const recipes = recipeIds.map((id) => byId.get(id));

  const ids = [...roles, ...tasks, ...challengers, ...reviews, ...recipes].map((skill) => skill.id);
  if (new Set(ids).size !== ids.length) findings.push('duplicate skill selected');
  if (roles.length > registry.routingRules.maxRoleSkills) findings.push('role skill cap exceeded');
  if (tasks.length > registry.routingRules.maxTaskSkills) findings.push('task skill cap exceeded');
  if (challengers.length > (registry.routingRules.maxChallengerSkills ?? 1)) findings.push('challenger skill cap exceeded');
  if (reviewRequired && reviews.length === 0) findings.push('independent review required but not selected');
  if (skepticRequired && !challengers.some((skill) => skill.id === 'creative-skeptic')) findings.push('high-risk route missing creative-skeptic');
  if (reviewPhase && (roles.length || tasks.length || recipes.length)) findings.push('review-only route cannot invoke maker/task/recipe skills');

  return {
    kind,
    phase,
    risk,
    roles,
    tasks,
    challengers,
    reviews,
    recipes,
    findings,
    status: findings.length ? 'blocked' : 'ready',
    rule: 'Use the smallest specialist set that materially improves the decision or artifact.'
  };
}
