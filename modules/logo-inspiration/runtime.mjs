export const LOGO_INSPIRATION_SOURCES = [
  {
    id: 'logolounge',
    name: 'LogoLounge',
    url: 'https://www.logolounge.com/',
    role: 'curated-corpus-and-trend-intelligence',
    priority: 'high',
    useFor: ['trend-history', 'category-patterns', 'award-caliber-reference', 'designer-attribution'],
    guardrail: 'Extract principles and trend signals; never copy a submitted mark.'
  },
  {
    id: 'logosystem',
    name: 'LogoSystem',
    url: 'https://logosystem.co/',
    role: 'filterable-form-language-and-motion-library',
    priority: 'high',
    useFor: ['type', 'industry', 'style', 'shape', 'color', 'mood', 'animated-logos'],
    guardrail: 'Use filters to map territory and white space; trace work back to original designers.'
  },
  {
    id: 'logomoose',
    name: 'LogoMoose',
    url: 'https://logomoose.com/',
    role: 'community-long-tail-and-identity-context',
    priority: 'medium',
    useFor: ['long-tail-examples', 'identity-context', 'packaging-context', 'category-search'],
    guardrail: 'Quality varies; use as breadth, not as an authority signal.'
  },
  {
    id: 'inspirationlogo',
    name: 'Inspiration Logo',
    url: 'https://inspirationlogo.tumblr.com/',
    role: 'wildcard-negative-space-and-brand-book-inspiration',
    priority: 'exploratory',
    useFor: ['negative-space', 'brand-book', 'unexpected-directions', 'wildcard-reference'],
    guardrail: 'Treat as exploratory input and verify provenance before using a reference in a decision.'
  }
];

const REQUIRED_FIELDS = ['reference', 'sourceId', 'evidence', 'take', 'reject', 'transform'];

export function buildLogoInspirationPacket(input = {}) {
  const references = Array.isArray(input.references) ? input.references : [];
  const allowedSources = new Set(LOGO_INSPIRATION_SOURCES.map((s) => s.id));
  const findings = [];

  for (const ref of references) {
    for (const field of REQUIRED_FIELDS) {
      if (typeof ref?.[field] !== 'string' || !ref[field].trim()) findings.push(`reference ${ref?.id ?? '(unknown)'} missing ${field}`);
    }
    if (ref?.sourceId && !allowedSources.has(ref.sourceId)) findings.push(`reference ${ref.id ?? '(unknown)'} uses unknown source: ${ref.sourceId}`);
    const copyIntent = `${ref?.take ?? ''} ${ref?.transform ?? ''}`.toLowerCase();
    if (/copy|clone|exact|recreate pixel|same logo/.test(copyIntent)) findings.push(`reference ${ref?.id ?? '(unknown)'} expresses copy intent`);
  }

  const sourceCoverage = LOGO_INSPIRATION_SOURCES.map((source) => ({
    ...source,
    referenced: references.some((ref) => ref.sourceId === source.id)
  }));

  return {
    stage: 'logo-inspiration',
    sources: sourceCoverage,
    references,
    findings,
    status: findings.length ? 'blocked' : references.length ? 'ready' : 'ready-for-research',
    rule: 'Reference libraries map territory; they do not authorize visual replication.'
  };
}
