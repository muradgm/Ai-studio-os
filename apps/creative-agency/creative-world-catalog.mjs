import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PROJECT_ID = /^[a-z0-9][a-z0-9_-]*$/i;

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanList(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean))];
}

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

function normalizeProjectId(value) {
  const id = clean(value);
  if (!id || !PROJECT_ID.test(id)) throw new Error('invalid creative project id');
  return id;
}

export function creativeWorldCatalogFile(projectId, { repoRoot = REPO_ROOT } = {}) {
  const id = normalizeProjectId(projectId);
  return path.join(repoRoot, 'projects', id, 'creative-worlds.json');
}

function catalogHash(exploration) {
  const source = JSON.stringify({
    schema: exploration?.schema ?? null,
    projectId: exploration?.thesisRef?.projectId ?? exploration?.projectId ?? null,
    thesisRef: exploration?.thesisRef ?? null,
    reviewReady: exploration?.reviewReady === true,
    worlds: (exploration?.worlds ?? []).map((world) => ({
      id: world?.id,
      schema: world?.schema,
      reviewReady: world?.reviewReady === true,
      worldIdea: world?.worldIdea,
      signatureBehavior: world?.signatureBehavior,
      worldClass: world?.worldClass,
      narrativeModel: world?.narrativeModel,
      compositionModel: world?.compositionModel,
      typographyIntent: world?.typographyIntent,
      imageLanguage: world?.imageLanguage,
      materialLanguage: world?.materialLanguage,
      motionLanguage: world?.motionLanguage,
      interactionModel: world?.interactionModel,
      responsiveStrategy: world?.responsiveStrategy,
      categoryTransferTest: world?.categoryTransferTest,
      antiPatterns: world?.antiPatterns
    })),
    visualProof: exploration?.visualProof ?? null
  });
  return crypto.createHash('sha256').update(source).digest('hex').slice(0, 20);
}

function proofForWorld(exploration, worldId) {
  const proof = exploration?.visualProof;
  const entry = proof?.worlds?.find?.((item) => item?.worldId === worldId)
    ?? proof?.byWorld?.[worldId]
    ?? null;
  const evidenceRefs = cleanList(entry?.evidenceRefs ?? entry?.visualEvidenceRefs ?? []);
  const reviewReady = proof?.reviewReady === true && entry?.reviewReady === true && evidenceRefs.length > 0;
  return {
    reviewReady,
    evidenceRefs,
    comparisonRef: clean(proof?.comparisonRef) || null,
    status: reviewReady ? 'review-ready' : evidenceRefs.length ? 'proof-not-reviewed' : 'proof-required'
  };
}

function mapWorld(exploration, world) {
  const proof = proofForWorld(exploration, world.id);
  return {
    id: clean(world.id),
    label: clean(world.label) || clean(world.id),
    premise: clean(world.worldIdea),
    signatureBehavior: clean(world.signatureBehavior),
    worldClass: clean(world.worldClass),
    narrativeModel: clean(world.narrativeModel),
    spatialModel: clean(world.compositionModel),
    typography: clean(world.typographyIntent?.statement),
    imageLanguage: clean(world.imageLanguage),
    materialLanguage: clean(world.materialLanguage),
    motionLanguage: clean(world.motionLanguage),
    interaction: clean(world.interactionModel),
    mobile: clean(world.responsiveStrategy),
    risk: clean(world.unresolvedRisks?.[0]) || clean(world.categoryTransferTest?.transferRisk) || 'No explicit world risk recorded.',
    thesisRef: structuredClone(world.thesisRef ?? exploration.thesisRef ?? {}),
    reviewReady: world.reviewReady === true,
    visualProof: proof,
    canLock: world.reviewReady === true && proof.reviewReady === true
  };
}

export function buildCreativeWorldCatalog(projectId, exploration, { sourceRef = null } = {}) {
  const id = normalizeProjectId(projectId);
  const findings = [];

  if (!exploration || exploration.schema !== 'ai-studio-os/creative-world-exploration@1') {
    findings.push(finding('blocker', 'creative-world-catalog-schema-invalid', 'Project Creative World artifact must use ai-studio-os/creative-world-exploration@1.'));
  }
  if (exploration?.reviewReady !== true) {
    findings.push(finding('blocker', 'creative-world-catalog-not-review-ready', 'Creative World exploration must be structurally review-ready before the Command Center can expose candidates.'));
  }

  const rawWorlds = Array.isArray(exploration?.worlds) ? exploration.worlds : [];
  if (rawWorlds.length < 3 || rawWorlds.length > 5) {
    findings.push(finding('blocker', 'creative-world-catalog-count-invalid', 'Creative World catalog requires 3–5 project-specific worlds.', { count: rawWorlds.length }));
  }

  const seen = new Set();
  const candidates = [];
  for (const world of rawWorlds) {
    const worldId = clean(world?.id);
    if (!worldId || seen.has(worldId)) {
      findings.push(finding('blocker', 'creative-world-catalog-world-id-invalid', 'Creative World ids must be present and unique.', { worldId: worldId || null }));
      continue;
    }
    seen.add(worldId);
    if (world?.schema !== 'ai-studio-os/creative-world@1' || world?.reviewReady !== true) {
      findings.push(finding('blocker', 'creative-world-catalog-world-not-review-ready', 'Only structurally review-ready Creative World artifacts may enter the selection workspace.', { worldId }));
      continue;
    }
    candidates.push(mapWorld(exploration, world));
  }

  const version = catalogHash(exploration);
  const pass = !findings.some((item) => item.severity === 'blocker');
  const lockableCount = candidates.filter((candidate) => candidate.canLock).length;

  return {
    schema: 'ai-studio-os/creative-world-catalog@1',
    projectId: id,
    sourceRef: sourceRef ?? `projects/${id}/creative-worlds.json`,
    catalogVersion: version,
    thesisRef: structuredClone(exploration?.thesisRef ?? {}),
    status: !pass ? 'blocked' : lockableCount ? 'visual-proof-ready' : 'awaiting-visual-proof',
    pass,
    reviewReady: pass,
    candidates,
    lockableCount,
    selectionRule: 'A Creative World can be locked only after comparable visual proof is reviewed and evidence refs exist.',
    findings
  };
}

export async function loadCreativeWorldCatalog(projectId, { repoRoot = REPO_ROOT } = {}) {
  const id = normalizeProjectId(projectId);
  const file = creativeWorldCatalogFile(id, { repoRoot });
  const sourceRef = path.relative(repoRoot, file).split(path.sep).join('/');
  try {
    const exploration = JSON.parse(await fs.readFile(file, 'utf8'));
    return buildCreativeWorldCatalog(id, exploration, { sourceRef });
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return {
        schema: 'ai-studio-os/creative-world-catalog@1',
        projectId: id,
        sourceRef,
        catalogVersion: null,
        thesisRef: null,
        status: 'not-generated',
        pass: false,
        reviewReady: false,
        candidates: [],
        lockableCount: 0,
        selectionRule: 'Product Understanding, research, Creative Thesis, Creative Worlds and visual proof must exist before selection.',
        findings: [finding('blocker', 'creative-world-catalog-missing', 'No project Creative World artifact exists yet.', { sourceRef })]
      };
    }
    return {
      schema: 'ai-studio-os/creative-world-catalog@1',
      projectId: id,
      sourceRef,
      catalogVersion: null,
      thesisRef: null,
      status: 'blocked',
      pass: false,
      reviewReady: false,
      candidates: [],
      lockableCount: 0,
      selectionRule: 'Invalid project artifacts cannot authorize downstream creative execution.',
      findings: [finding('blocker', 'creative-world-catalog-read-failed', error instanceof Error ? error.message : String(error), { sourceRef })]
    };
  }
}

export function validateCreativeWorldSelection(catalog, { selectedWorldId, catalogVersion } = {}) {
  const findings = [];
  const id = clean(selectedWorldId);
  const version = clean(catalogVersion);

  if (catalog?.reviewReady !== true) {
    findings.push(finding('blocker', 'creative-world-selection-catalog-not-ready', 'Creative World catalog is not review-ready.'));
  }
  if (!version || version !== catalog?.catalogVersion) {
    findings.push(finding('blocker', 'creative-world-selection-catalog-stale', 'Selection must reference the current Creative World catalog version.', { expected: catalog?.catalogVersion ?? null, received: version || null }));
  }

  const selected = catalog?.candidates?.find((candidate) => candidate.id === id) ?? null;
  if (!selected) {
    findings.push(finding('blocker', 'creative-world-selection-id-invalid', 'Selected Creative World must exist in the current project catalog.', { selectedWorldId: id || null }));
  } else if (selected.canLock !== true) {
    findings.push(finding('blocker', 'creative-world-selection-visual-proof-required', 'Creative World cannot be locked from prose. Reviewed visual proof is required first.', { selectedWorldId: id, proofStatus: selected.visualProof?.status ?? null }));
  }

  const pass = !findings.some((item) => item.severity === 'blocker');
  return {
    pass,
    selected: pass ? structuredClone(selected) : null,
    selection: pass ? {
      creativeProjectId: catalog.projectId,
      selectedCreativeWorldId: selected.id,
      selectedCreativeWorldLabel: selected.label,
      catalogVersion: catalog.catalogVersion,
      sourceRef: catalog.sourceRef,
      thesisRef: structuredClone(catalog.thesisRef ?? {}),
      visualEvidenceRefs: [...(selected.visualProof?.evidenceRefs ?? [])],
      comparisonRef: selected.visualProof?.comparisonRef ?? null,
      status: 'locked'
    } : null,
    findings
  };
}
