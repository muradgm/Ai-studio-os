import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ARTIFACT_ROOT = path.join(REPO_ROOT, 'artifacts');

function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function list(value) { return [...new Set((Array.isArray(value) ? value : []).map(text).filter(Boolean))]; }
function digest(value) { return crypto.createHash('sha256').update(value).digest('hex'); }

function resolveArtifactRef(ref) {
  const value = text(ref).replaceAll('\\', '/');
  if (!value || value.includes('://') || value.startsWith('/') || value.split('/').includes('..')) return null;
  const absolute = path.resolve(REPO_ROOT, value);
  return absolute === ARTIFACT_ROOT || absolute.startsWith(`${ARTIFACT_ROOT}${path.sep}`) ? absolute : null;
}

export function snapshotComparisonArtifacts(refs = []) {
  return list(refs).sort().map((ref) => {
    if (ref.startsWith('fixture://')) return { ref, mode: 'fixture', sha256: null, byteLength: null, readable: true };
    const absolute = resolveArtifactRef(ref);
    if (!absolute) return { ref, mode: 'artifact', sha256: null, byteLength: null, readable: false };
    try {
      const bytes = fs.readFileSync(absolute);
      return { ref, mode: 'artifact', sha256: digest(bytes), byteLength: bytes.length, readable: bytes.length > 0 };
    } catch {
      return { ref, mode: 'artifact', sha256: null, byteLength: null, readable: false };
    }
  });
}

export function comparisonArtifactSnapshotsEqual(left = [], right = []) {
  const canonical = (items) => [...(Array.isArray(items) ? items : [])]
    .map((item) => ({
      ref: text(item?.ref),
      mode: text(item?.mode),
      sha256: text(item?.sha256).toLowerCase() || null,
      byteLength: Number.isInteger(item?.byteLength) ? item.byteLength : null,
      readable: item?.readable === true
    }))
    .sort((a, b) => a.ref.localeCompare(b.ref));
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}

export function comparisonArtifactSnapshotReady(snapshot = []) {
  return Array.isArray(snapshot)
    && snapshot.length > 0
    && snapshot.every((item) => item?.readable === true
      && (item?.mode === 'fixture' || (typeof item?.sha256 === 'string' && /^[a-f0-9]{64}$/i.test(item.sha256) && item.byteLength > 0)));
}