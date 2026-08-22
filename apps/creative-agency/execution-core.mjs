import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const EXECUTION_PROJECTS = Object.freeze({
  'creative-agency': Object.freeze({
    id: 'creative-agency',
    name: 'The Creative Agency',
    build: Object.freeze({
      driver: 'vite',
      appRoot: 'apps/creative-agency',
      outDir: '../../dist/creative-agency'
    }),
    distDir: path.join(REPO_ROOT, 'dist/creative-agency'),
    previewBase: '/preview/creative-agency/',
    mode: 'production',
    needs: ['motion'],
    reducedMotionPlan: {
      mode: 'authored',
      fallback: 'Static hierarchy and state changes preserve the same information without continuous motion.'
    }
  })
});

export function getExecutionProject(projectId) {
  const project = EXECUTION_PROJECTS[projectId];
  if (!project) throw new Error(`Unknown execution project: ${projectId}`);
  return project;
}

export function createExecutionJob({ id, projectId, iteration = 0, selectedDirectionId = null } = {}) {
  if (!id) throw new Error('execution id is required');
  getExecutionProject(projectId);
  const now = new Date().toISOString();
  return {
    id,
    projectId,
    status: 'queued',
    stage: 'queued',
    iteration,
    createdAt: now,
    updatedAt: now,
    directionSelection: {
      selectedDirectionId: selectedDirectionId ? String(selectedDirectionId) : null,
      status: selectedDirectionId ? 'locked' : 'not-provided'
    },
    approval: 'pending',
    approvedAt: null,
    productionReady: false,
    releaseDecision: {
      status: 'unmeasured',
      productionReady: false,
      blockerCount: 0,
      majorCount: 0,
      requiredEvidence: [],
      unmeasuredEvidence: []
    },
    baseline: { promoted: false, sourceJobId: null, approvedAt: null },
    steps: [
      { id: 'build', label: 'Build', status: 'pending' },
      { id: 'capture', label: 'Capture', status: 'pending' },
      { id: 'review', label: 'Review', status: 'pending' },
      { id: 'patch', label: 'Patch', status: 'pending' },
      { id: 'approve', label: 'Approve', status: 'pending' }
    ],
    logs: [],
    evidence: {},
    findings: [],
    patches: [],
    artifacts: { previewUrl: null, captures: [], reportUrl: null },
    error: null
  };
}

export function setJobStep(job, stepId, status) {
  const step = job.steps.find((item) => item.id === stepId);
  if (!step) throw new Error(`Unknown job step: ${stepId}`);
  step.status = status;
  job.stage = stepId;
  job.updatedAt = new Date().toISOString();
  return job;
}

export function canPromoteApprovedBaseline(job, captures = []) {
  const hasReducedMotionCapture = captures.some((capture) => capture?.reducedMotion === true && capture?.screenshot);
  return Boolean(
    job?.status === 'complete' &&
    job?.productionReady === true &&
    job?.releaseDecision?.status === 'ready' &&
    job?.releaseDecision?.productionReady === true &&
    hasReducedMotionCapture
  );
}

export function pushJobLog(job, line, maxChars = 28000) {
  const clean = String(line ?? '').replace(/\u001b\[[0-9;]*m/g, '').trim();
  if (!clean) return;
  job.logs.push(clean.slice(0, 1600));
  let joined = job.logs.join('\n');
  if (joined.length > maxChars) {
    joined = joined.slice(joined.length - maxChars);
    job.logs = joined.split('\n');
  }
}

async function walk(dir, files = []) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, files);
    else files.push(full);
  }
  return files;
}

export async function collectBundleEvidence(distDir) {
  const files = await walk(distDir);
  let jsBytes = 0;
  let cssBytes = 0;
  for (const file of files) {
    const stat = await fs.stat(file);
    if (file.endsWith('.js')) jsBytes += stat.size;
    if (file.endsWith('.css')) cssBytes += stat.size;
  }
  return {
    initialJsKb: Math.round((jsBytes / 1024) * 10) / 10,
    initialCssKb: Math.round((cssBytes / 1024) * 10) / 10,
    measured: true,
    method: 'built-asset-byte-sum'
  };
}

export function safeResolve(root, requested = '.') {
  const base = path.resolve(root);
  const resolved = path.resolve(base, requested);
  if (resolved !== base && !resolved.startsWith(`${base}${path.sep}`)) throw new Error('path traversal blocked');
  return resolved;
}

export function publicJob(job) {
  return structuredClone(job);
}
