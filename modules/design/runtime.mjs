import { buildTypographyConsumptionContract } from './typography-consumption.mjs';

function defaultTypographyStrategy() {
  return {
    display: 'character-bearing display role; never select a typeface by category cliché alone',
    body: 'high-legibility supporting role',
    utility: 'compact functional role for metadata/navigation'
  };
}

export function buildDesignPacket({ direction, preferences = {}, typography = null }) {
  if (!direction) throw new Error('design packet requires creative direction');
  const typographyStrategy = defaultTypographyStrategy();
  const typographyContract = buildTypographyConsumptionContract(typography);
  const typographyPacket = typography?.pass === true
    ? {
        strategy: typographyStrategy,
        selection: typography.selection,
        production: typography.production,
        application: typography.application ?? null,
        consumption: typographyContract,
        systemScore: typography.systemCritique?.score ?? typography.systems?.[0]?.overall ?? null,
        pairingScore: typography.systems?.[0]?.pairing?.score ?? null
      }
    : typographyStrategy;

  return {
    stage: 'design',
    directionContext: {
      statement: direction.directionStatement,
      traits: direction.traits ?? [],
      antiPrinciples: direction.antiPrinciples ?? []
    },
    hierarchy: {
      primary: preferences.primaryAction ?? 'business-primary-action',
      sequence: preferences.sequence ?? ['identity', 'value', 'proof', 'offer', 'visit-or-convert']
    },
    typography: typographyPacket,
    composition: {
      approach: preferences.composition ?? 'editorial-asymmetry-with-clear-anchors',
      density: preferences.density ?? 'restrained',
      imageBehavior: preferences.imageBehavior ?? 'cropped-as-composition-not-card-decoration'
    },
    responsive: {
      principle: 'preserve hierarchy and intent, not desktop geometry',
      mobilePriority: preferences.mobilePriority ?? ['status', 'location-or-primary-action', 'offer', 'proof']
    },
    interactions: preferences.interactions ?? ['navigation-response', 'product-discovery', 'primary-action-feedback'],
    accessibility: ['semantic-hierarchy', 'keyboard-operability', 'contrast', 'reduced-motion-compatible'],
    antiPatterns: [
      'generic centered hero by default',
      'three-card feature grid without product reason',
      'decorative glassmorphism',
      'category-cliche typography without justification',
      'motion used to compensate for weak hierarchy',
      'downstream typography recomputation that drifts from approved tokens'
    ],
    directionRef: direction.directionStatement
  };
}
