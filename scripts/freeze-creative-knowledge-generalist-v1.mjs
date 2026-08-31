import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fingerprintCreativeValue } from '../modules/creative-intelligence-foundation/fingerprint.mjs';
import { buildCreativeIntelligenceFoundation, reviewCreativeKnowledgeEntry } from '../modules/creative-intelligence-foundation/runtime.mjs';
import { buildCreativeKnowledgeGraph, reviewCreativeKnowledgeGraph } from '../modules/creative-knowledge-graph/runtime.mjs';
import { buildCreativeKnowledgeRetrievalWithProvenance, reviewCreativeKnowledgeGraphProvenance, reviewCreativeKnowledgeRetrievalProvenance } from '../modules/creative-knowledge-graph/provenance.mjs';
import { CREATIVE_KNOWLEDGE_GENERALIST_V1_ENTRIES } from '../modules/creative-knowledge-generalist-v1/knowledge.mjs';
import { buildCreativeKnowledgeGeneralistV1Charter, reviewCreativeKnowledgeGeneralistV1Charter } from '../modules/creative-knowledge-generalist-v1/charter.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'modules/creative-knowledge-generalist-v1/source-manifest.json');
const freezeMetadataPath = path.join(root, 'modules/creative-knowledge-generalist-v1/freeze-metadata.json');
const freezePath = path.join(root, 'modules/creative-knowledge-generalist-v1/freeze.json');
const forbidden = /benchmark-011|after matter|after-matter|friction-index|condition-d/i;

function fail(message) { throw new Error(`creative-knowledge-generalist-v1: ${message}`); }
function sorted(values) { return [...values].sort(); }

function validateManifest(manifest, entries, freezeMetadata) {
  if (manifest?.schema !== 'ai-studio-os/creative-knowledge-generalist-source-manifest@1') fail('source-manifest-schema-invalid');
  if (manifest?.corpusId !== 'creative-knowledge-generalist-v1') fail('source-manifest-corpus-id-invalid');
  const sourceById = new Map((manifest.sources ?? []).map((source) => [source.sourceId, source]));
  const entryIds = new Set(entries.map((entry) => entry.id));
  if (sourceById.size !== (manifest.sources ?? []).length) fail('source-manifest-source-id-duplicate');
  const evidenceByEntryId = new Map((manifest.entryEvidence ?? []).map((binding) => [binding.entryId, binding]));
  if (evidenceByEntryId.size !== entries.length) fail('entry-evidence-count-invalid');
  for (const source of sourceById.values()) {
    for (const field of ['sourceId', 'sourceType', 'sourceRef', 'title', 'authorOrOrganization', 'publishedAt', 'capturedAt', 'evidenceLocator', 'provenanceNote']) if (!source[field]) fail(`source-manifest-field-missing:${field}`);
    if (source.sourceRef.startsWith('internal://')) fail('source-manifest-internal-provenance');
    if (Date.parse(source.capturedAt) < Date.parse(freezeMetadata.preRegistrationBoundary)) fail(`source-captured-before-charter:${source.sourceId}`);
    if (forbidden.test(JSON.stringify(source))) fail(`source-manifest-active-project-leak:${source.sourceId}`);
    for (const id of source.entryIds ?? []) if (!entryIds.has(id)) fail(`source-manifest-entry-missing:${id}`);
  }
  const sourcesByDomain = new Map();
  for (const entry of entries) {
    if (!sourceById.has(entry.provenance.sourceId)) fail(`entry-primary-source-missing:${entry.id}`);
    const binding = evidenceByEntryId.get(entry.id);
    if (!binding || binding.primarySourceId !== entry.provenance.sourceId) fail(`entry-primary-evidence-binding-drift:${entry.id}`);
    const evidenceIds = sorted(binding.evidenceSourceIds ?? []);
    if (new Set(evidenceIds).size !== evidenceIds.length || !evidenceIds.includes(entry.provenance.sourceId)) fail(`entry-evidence-ids-invalid:${entry.id}`);
    const primary = sourceById.get(entry.provenance.sourceId);
    if (!(primary.entryIds ?? []).includes(entry.id)) fail(`entry-primary-source-cross-binding-missing:${entry.id}`);
    const supported = evidenceIds.map((id) => sourceById.get(id));
    if (supported.some((source) => !source || !(source.entryIds ?? []).includes(entry.id))) fail(`entry-supporting-source-cross-binding-missing:${entry.id}`);
    if (supported.length < 2) fail(`entry-evidence-independence-insufficient:${entry.id}`);
    const set = sourcesByDomain.get(entry.domain) ?? new Set();
    supported.forEach((source) => set.add(source.sourceId));
    sourcesByDomain.set(entry.domain, set);
  }
  for (const [domain, ids] of sourcesByDomain) if (ids.size < 2) fail(`domain-source-diversity-insufficient:${domain}`);
  if (Date.parse(freezeMetadata.frozenAt) < Date.parse(freezeMetadata.createdAt) || Date.parse(freezeMetadata.frozenAt) < Math.max(...[...sourceById.values()].map((source) => Date.parse(source.capturedAt)))) fail('freeze-timestamp-before-source-capture');
  return { sourceById, sourcesByDomain, evidenceByEntryId };
}

function validateEntries(entries, charter) {
  if (entries.length !== charter.plannedEntryCount) fail('entry-count-invalid');
  const counts = Object.fromEntries(charter.domains.map((domain) => [domain, 0]));
  const ids = new Set();
  for (const entry of entries) {
    if (forbidden.test(JSON.stringify(entry))) fail(`entry-active-project-leak:${entry.id}`);
    if (ids.has(entry.id)) fail(`entry-id-duplicate:${entry.id}`);
    ids.add(entry.id);
    if (!Object.hasOwn(counts, entry.domain)) fail(`entry-domain-unregistered:${entry.id}`);
    counts[entry.domain] += 1;
    if (entry.kind !== charter.entryContract.kind || entry.scope !== charter.entryContract.scope) fail(`entry-contract-drift:${entry.id}`);
    if (![0.7, 0.8, 0.9].includes(entry.confidence)) fail(`entry-confidence-unregistered:${entry.id}`);
    if (!entry.transfer || charter.entryContract.requiredTransferFields.some((field) => !(entry.transfer[field] ?? []).length)) fail(`entry-transfer-incomplete:${entry.id}`);
    const review = reviewCreativeKnowledgeEntry(entry);
    if (!review.reviewReady) fail(`entry-not-review-ready:${entry.id}`);
  }
  for (const [domain, count] of Object.entries(counts)) if (count !== charter.plannedEntriesPerDomain) fail(`domain-entry-count-invalid:${domain}`);
  return counts;
}

function validateConfidenceEvidence(entries, sourceById, evidenceByEntryId) {
  const strongClasses = new Set(['peer-reviewed-research', 'academic-book-chapter', 'academic-book', 'international-standard']);
  for (const entry of entries) {
    if (entry.confidence !== 0.9) continue;
    const binding = evidenceByEntryId.get(entry.id);
    const sources = (binding?.evidenceSourceIds ?? []).map((id) => sourceById.get(id));
    if (sources.length < 2 || sources.some((source) => !strongClasses.has(source?.sourceType)) || !/multiple|independent/i.test(entry.confidenceBasis)) fail(`confidence-evidence-insufficient:${entry.id}`);
  }
}

function smokeRetrievals(graph, foundation) {
  const cases = [
    ['editorial-and-information-design', 'information reading'], ['architecture-and-spatial-experience', 'spatial orientation'],
    ['industrial-and-product-design', 'product feedback'], ['film-and-cinematography', 'framing attention'],
    ['music-and-rhythm', 'rhythmic temporal'], ['interaction-and-hci', 'interaction feedback']
  ];
  return cases.map(([domain, terms]) => {
    const retrieval = buildCreativeKnowledgeRetrievalWithProvenance({ graph, foundation, projectId: 'generalist-retrieval-smoke', asOf: '2026-08-31T00:00:00Z', purpose: 'Validate general retrieval mechanics.', domains: [domain], kinds: ['principle'], terms, limit: 3 });
    const review = reviewCreativeKnowledgeRetrievalProvenance({ retrieval, graph, foundation });
    if (!review.reviewReady || !retrieval.results.length) fail(`retrieval-smoke-failed:${domain}`);
    return { domain, retrievalSnapshotFingerprint: retrieval.snapshotFingerprint, resultIds: retrieval.results.map((item) => item.knowledgeId) };
  });
}

export function buildCreativeKnowledgeGeneralistV1Freeze({ sourceManifest, freezeMetadata, entries = CREATIVE_KNOWLEDGE_GENERALIST_V1_ENTRIES } = {}) {
  const charter = buildCreativeKnowledgeGeneralistV1Charter();
  if (!reviewCreativeKnowledgeGeneralistV1Charter(charter).pass) fail('charter-invalid');
  const domainCounts = validateEntries(entries, charter);
  if (freezeMetadata?.schema !== 'ai-studio-os/creative-knowledge-generalist-freeze-metadata@1') fail('freeze-metadata-schema-invalid');
  const { sourceById, sourcesByDomain } = validateManifest(sourceManifest, entries, freezeMetadata);
  validateConfidenceEvidence(entries, sourceById, new Map((sourceManifest.entryEvidence ?? []).map((binding) => [binding.entryId, binding])));
  const foundation = buildCreativeIntelligenceFoundation({ entries });
  if (!foundation.reviewReady) fail('foundation-not-review-ready');
  const graph = buildCreativeKnowledgeGraph({ foundation });
  if (!reviewCreativeKnowledgeGraph(graph).reviewReady || !reviewCreativeKnowledgeGraphProvenance({ graph, foundation }).reviewReady) fail('graph-not-review-ready');
  const retrievalSmoke = smokeRetrievals(graph, foundation);
  const sourceManifestFingerprint = fingerprintCreativeValue(sourceManifest);
  const corpusContentFingerprint = fingerprintCreativeValue(entries);
  const freeze = {
    schema: 'ai-studio-os/creative-knowledge-generalist-freeze@1', corpusId: charter.corpusId, corpusVersion: charter.corpusVersion,
    entryCount: entries.length, domainCounts, entryIds: sorted(entries.map((entry) => entry.id)), sourceIds: sorted(sourceById.keys()),
    sourceManifestFingerprint, knowledgeLibraryFingerprint: foundation.knowledgeLibrary.snapshotFingerprint,
    foundationSnapshotFingerprint: foundation.snapshotFingerprint, knowledgeGraphFingerprint: graph.snapshotFingerprint, corpusContentFingerprint,
    createdAt: freezeMetadata.createdAt, frozenAt: freezeMetadata.frozenAt, experimentIntegrity: {
      benchmark011KnownBeforeCorpusPopulation: charter.experimentIntegrity.benchmark011KnownBeforeCorpusPopulation,
      benchmark011BlindConfirmatoryUseAllowed: charter.experimentIntegrity.benchmark011BlindConfirmatoryUseAllowed,
      benchmark011DevelopmentalUseAllowed: charter.experimentIntegrity.benchmark011DevelopmentalUseAllowed,
      benchmark011CapabilityInterpretationRequiresPostTargetDisclosure: charter.experimentIntegrity.benchmark011CapabilityInterpretationRequiresPostTargetDisclosure,
      unseenBenchmarkRequiredForCleanConfirmatoryEvaluation: charter.experimentIntegrity.unseenBenchmarkRequiredForCleanConfirmatoryEvaluation,
      corpusFreezeRequiredBeforeUnseenBenchmarkReveal: charter.experimentIntegrity.corpusFreezeRequiredBeforeUnseenBenchmarkReveal,
      architectureMustRemainFrozenThroughUnseenBenchmarkExperiment: charter.experimentIntegrity.architectureMustRemainFrozenThroughUnseenBenchmarkExperiment
    },
    retrievalNeutralitySmoke: retrievalSmoke,
    truth: { generalPurpose: true, benchmarkTailored: false, benchmark011KnownBeforePopulation: true, benchmark011BlindConfirmatoryUseAllowed: false, benchmark011DevelopmentalUseAllowed: true, unseenBenchmarkRequiredForCleanConfirmation: true, projectAuthority: false, creativeAuthority: false, productionAuthority: false, providerGenerationUsed: false }
  };
  return { freeze, foundation, graph, sourcesByDomain };
}

function main() {
  const sourceManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const freezeMetadata = JSON.parse(fs.readFileSync(freezeMetadataPath, 'utf8'));
  const { freeze } = buildCreativeKnowledgeGeneralistV1Freeze({ sourceManifest, freezeMetadata });
  if (process.argv.includes('--verify')) {
    if (!fs.existsSync(freezePath) || fingerprintCreativeValue(JSON.parse(fs.readFileSync(freezePath, 'utf8'))) !== fingerprintCreativeValue(freeze)) fail('freeze-artifact-drift');
    console.log('Creative Knowledge Generalist V1 freeze verified.');
    return;
  }
  fs.writeFileSync(freezePath, `${JSON.stringify(freeze, null, 2)}\n`);
  console.log('Creative Knowledge Generalist V1 freeze written.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
