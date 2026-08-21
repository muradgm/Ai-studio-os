import fs from 'node:fs/promises';
import { readTypographyCatalog } from './catalog.mjs';

const DEFAULT_INTELLIGENCE_CACHE = '.tmp/google-fonts/intelligence.json';

async function readJsonFile(path, readFile = fs.readFile) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

function objectOrEmpty(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? structuredClone(value) : {};
}

export async function loadTypographyRuntimeResources({
  catalogCachePath,
  intelligenceCachePath = process.env.GOOGLE_FONTS_INTELLIGENCE_CACHE || DEFAULT_INTELLIGENCE_CACHE,
  readFile = fs.readFile
} = {}) {
  const catalog = await readTypographyCatalog({ ...(catalogCachePath ? { cachePath:catalogCachePath } : {}), readFile });
  const intelligence = await readJsonFile(intelligenceCachePath, readFile);
  const findings = [];

  if (!catalog?.fonts?.length) findings.push({ severity:'blocker', code:'typography-orchestrator-catalog-cache-missing' });
  if (catalog && catalog.provider !== 'google-fonts') findings.push({ severity:'blocker', code:'typography-orchestrator-catalog-provider-unexpected', provider:catalog.provider ?? null });
  if (intelligence && !Array.isArray(intelligence.evidence)) findings.push({ severity:'blocker', code:'typography-orchestrator-intelligence-cache-invalid' });
  if (intelligence?.provider && catalog?.provider && intelligence.provider !== catalog.provider) {
    findings.push({ severity:'blocker', code:'typography-orchestrator-provider-drift', catalogProvider:catalog.provider, intelligenceProvider:intelligence.provider });
  }
  if (intelligence?.catalogFetchedAt && catalog?.fetchedAt && intelligence.catalogFetchedAt !== catalog.fetchedAt) {
    findings.push({ severity:'major', code:'typography-orchestrator-evidence-stale-for-catalog', catalogFetchedAt:catalog.fetchedAt, evidenceCatalogFetchedAt:intelligence.catalogFetchedAt });
  }

  return {
    stage:'typography-runtime-resources',
    catalog:catalog?.fonts ?? [],
    fontEvidence:intelligence?.evidence ?? [],
    metadata:{
      catalogFetchedAt:catalog?.fetchedAt ?? null,
      evidenceAnalyzedAt:intelligence?.analyzedAt ?? null,
      catalogCount:catalog?.fonts?.length ?? 0,
      evidenceCount:intelligence?.evidence?.length ?? 0
    },
    findings,
    pass:!findings.some((item)=>item.severity === 'blocker')
  };
}

export async function prepareProjectTypographyInput(input = {}, options = {}) {
  if (input.typography === false || input.autoTypography === false) {
    return { enabled:false, input:structuredClone(input), resources:null, pass:true, findings:[] };
  }

  const explicitTypography = input.typography && typeof input.typography === 'object' && !Array.isArray(input.typography)
    ? objectOrEmpty(input.typography)
    : null;
  const context = input.typographyContext && typeof input.typographyContext === 'object' && !Array.isArray(input.typographyContext)
    ? objectOrEmpty(input.typographyContext)
    : null;
  const shouldEnable = Boolean(explicitTypography || (input.autoTypography === true && context));
  if (!shouldEnable) return { enabled:false, input:structuredClone(input), resources:null, pass:true, findings:[] };

  const resources = await loadTypographyRuntimeResources(options);
  if (!resources.pass) return { enabled:true, input:structuredClone(input), resources, pass:false, findings:resources.findings };

  const request = explicitTypography ?? context;
  const prepared = {
    ...structuredClone(input),
    typography:{
      ...request,
      catalog:undefined,
      fontEvidence:resources.fontEvidence
    },
    fontCatalog:resources.catalog
  };

  return {
    enabled:true,
    input:prepared,
    resources,
    pass:true,
    findings:resources.findings
  };
}
