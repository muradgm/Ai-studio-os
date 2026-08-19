import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  createCreativeEngineeringPlan,
  evaluateDeliveryGates,
  createPatchQueue,
  createCapturePlan,
  captureWithPlaywright,
  buildResponsiveEvidence
} from '../../modules/creative-engineering/index.mjs';
import {
  REPO_ROOT,
  getExecutionProject,
  createExecutionJob,
  setJobStep,
  pushJobLog,
  collectBundleEvidence,
  safeResolve,
  publicJob
} from './execution-core.mjs';

const jobs = new Map();
const ARTIFACT_ROOT = path.join(REPO_ROOT, 'artifacts/command-center');
const JSON_LIMIT = 64 * 1024;
const REQUIRED_EVIDENCE = ['webVitals', 'runtime', 'bundle', 'accessibility', 'responsive'];

function mime(file) {
  const ext = path.extname(file).toLowerCase();
  return ({
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2'
  })[ext] ?? 'application/octet-stream';
}

function allowOrigin(origin) {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    return (url.hostname === 'localhost' || url.hostname === '127.0.0.1') && ['http:', 'https:'].includes(url.protocol);
  } catch { return false; }
}

function cors(req, res) {
  const origin = req.headers.origin;
  if (allowOrigin(origin)) res.setHeader('Access-Control-Allow-Origin', origin ?? '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
}

function json(res, status, value) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(value));
}

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > JSON_LIMIT) throw new Error('request body too large');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function npmCommand() { return process.platform === 'win32' ? 'npm.cmd' : 'npm'; }

function runBuild(project, job) {
  return new Promise((resolve, reject) => {
    const child = spawn(npmCommand(), ['run', project.buildScript], {
      cwd: REPO_ROOT,
      shell: false,
      windowsHide: true,
      env: { ...process.env, FORCE_COLOR: '0' }
    });
    child.stdout.on('data', (data) => pushJobLog(job, data));
    child.stderr.on('data', (data) => pushJobLog(job, data));
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`build exited with code ${code}`)));
  });
}

function captureFindings(captures = []) {
  return captures.filter((capture) => !capture.pass).map((capture) => ({
    severity: 'blocker',
    code: capture.reducedMotion ? 'reduced-motion-browser-capture-failed' : 'browser-capture-failed',
    message: `${capture.id} failed browser execution.`,
    evidence: { pageErrors: capture.pageErrors, consoleErrors: capture.consoleErrors, status: capture.status }
  }));
}

function artifactUrl(serverOrigin, absolutePath) {
  const relative = path.relative(ARTIFACT_ROOT, absolutePath).split(path.sep).map(encodeURIComponent).join('/');
  return `${serverOrigin}/artifacts/${relative}`;
}

async function executeJob(job, serverOrigin) {
  const project = getExecutionProject(job.projectId);
  job.status = 'running';
  try {
    setJobStep(job, 'build', 'running');
    await runBuild(project, job);
    setJobStep(job, 'build', 'passed');

    const previewUrl = `${serverOrigin}${project.previewBase}`;
    job.artifacts.previewUrl = previewUrl;
    const plan = createCreativeEngineeringPlan({
      projectId: project.id,
      entryUrl: previewUrl,
      mode: project.mode,
      needs: project.needs,
      reducedMotionPlan: project.reducedMotionPlan
    });

    setJobStep(job, 'capture', 'running');
    const capturePlan = createCapturePlan({ baseUrl: serverOrigin, routes: [project.previewBase] });
    const captureDir = path.join(ARTIFACT_ROOT, job.id, 'captures');
    const captured = await captureWithPlaywright(capturePlan, { outputDir: captureDir, settleMs: 180, fullPage: true });
    job.artifacts.captures = captured.captures.map((capture) => ({
      ...capture,
      screenshot: artifactUrl(serverOrigin, capture.screenshot)
    }));
    setJobStep(job, 'capture', captured.pass ? 'passed' : 'failed');

    setJobStep(job, 'review', 'running');
    const responsive = buildResponsiveEvidence(captured.captures);
    const bundle = await collectBundleEvidence(project.distDir);
    const metrics = { bundle, responsive };
    const gates = evaluateDeliveryGates({
      metrics,
      budgets: plan.budgets,
      requiredEvidence: REQUIRED_EVIDENCE
    });
    const findings = [...plan.findings, ...captureFindings(captured.captures), ...gates.findings];
    job.evidence = {
      browser: {
        measured: true,
        captures: captured.captures.length,
        passed: captured.captures.filter((item) => item.pass).length,
        reducedMotionCaptures: captured.captures.filter((item) => item.reducedMotion).length
      },
      responsive,
      bundle,
      webVitals: { measured: false },
      runtime: { measured: false },
      accessibility: { measured: false }
    };
    job.findings = findings;
    job.productionReady = plan.pass && gates.productionReady && captured.pass;
    setJobStep(job, 'review', findings.some((item) => item.severity === 'blocker') ? 'blocked' : 'passed');

    setJobStep(job, 'patch', 'running');
    const queue = createPatchQueue(findings, { iteration: job.iteration, maxIterations: 8 });
    job.patches = queue.patches;
    setJobStep(job, 'patch', queue.status === 'clean' ? 'passed' : queue.status === 'blocked' ? 'blocked' : 'ready');

    job.status = 'complete';
    job.stage = 'approve';
    job.updatedAt = new Date().toISOString();
  } catch (error) {
    job.status = 'error';
    job.error = error instanceof Error ? error.message : String(error);
    job.updatedAt = new Date().toISOString();
    const active = job.steps.find((step) => step.status === 'running');
    if (active) active.status = 'failed';
    pushJobLog(job, job.error);
  }
}

async function serveFile(res, file) {
  try {
    const body = await fs.readFile(file);
    res.statusCode = 200;
    res.setHeader('Content-Type', mime(file));
    res.setHeader('Cache-Control', file.endsWith('.html') ? 'no-store' : 'public, max-age=60');
    res.end(body);
  } catch {
    res.statusCode = 404;
    res.end('Not found');
  }
}

async function servePreview(pathname, res) {
  const project = getExecutionProject('creative-agency');
  if (pathname === project.previewBase || pathname === project.previewBase.slice(0, -1)) {
    return serveFile(res, path.join(project.distDir, 'index.html'));
  }
  if (pathname.startsWith(project.previewBase)) {
    const relative = decodeURIComponent(pathname.slice(project.previewBase.length));
    const file = safeResolve(project.distDir, relative || 'index.html');
    return serveFile(res, file);
  }
  if (pathname.startsWith('/assets/')) return serveFile(res, safeResolve(project.distDir, decodeURIComponent(pathname.slice(1))));
  if (pathname === '/mark.svg') return serveFile(res, safeResolve(project.distDir, 'mark.svg'));
  return false;
}

async function handler(req, res, serverOrigin) {
  cors(req, res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  const url = new URL(req.url ?? '/', serverOrigin);
  const pathname = url.pathname;

  if (pathname === '/api/status' && req.method === 'GET') {
    return json(res, 200, { status: 'ready', runtime: 'creative-engineering-v1.3', transport: 'local-http', host: '127.0.0.1' });
  }

  if (pathname === '/api/executions' && req.method === 'POST') {
    try {
      const body = await readJson(req);
      const projectId = body.projectId ?? 'creative-agency';
      getExecutionProject(projectId);
      const running = [...jobs.values()].find((item) => item.projectId === projectId && ['queued', 'running'].includes(item.status));
      if (running) return json(res, 409, { error: 'execution-already-running', job: publicJob(running) });
      const id = `exec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const job = createExecutionJob({ id, projectId, iteration: Number(body.iteration ?? 0) });
      jobs.set(id, job);
      queueMicrotask(() => executeJob(job, serverOrigin));
      return json(res, 202, { job: publicJob(job) });
    } catch (error) {
      return json(res, 400, { error: error instanceof Error ? error.message : String(error) });
    }
  }

  const match = pathname.match(/^\/api\/executions\/([^/]+)(?:\/(approve))?$/);
  if (match) {
    const job = jobs.get(match[1]);
    if (!job) return json(res, 404, { error: 'execution-not-found' });
    if (!match[2] && req.method === 'GET') return json(res, 200, { job: publicJob(job) });
    if (match[2] === 'approve' && req.method === 'POST') {
      if (job.status !== 'complete') return json(res, 409, { error: 'execution-not-complete', job: publicJob(job) });
      job.approval = 'iteration-approved';
      job.approvedAt = new Date().toISOString();
      job.updatedAt = job.approvedAt;
      const step = job.steps.find((item) => item.id === 'approve');
      step.status = 'approved';
      return json(res, 200, { job: publicJob(job) });
    }
  }

  if (pathname.startsWith('/artifacts/') && req.method === 'GET') {
    try { return serveFile(res, safeResolve(ARTIFACT_ROOT, decodeURIComponent(pathname.slice('/artifacts/'.length)))); }
    catch { res.statusCode = 403; return res.end('Forbidden'); }
  }

  if (req.method === 'GET') {
    try {
      const served = await servePreview(pathname, res);
      if (served !== false) return served;
    } catch { res.statusCode = 403; return res.end('Forbidden'); }
  }

  json(res, 404, { error: 'not-found' });
}

export async function startExecutionServer({ host = '127.0.0.1', port = 8787 } = {}) {
  await fs.mkdir(ARTIFACT_ROOT, { recursive: true });
  let origin = `http://${host}:${port}`;
  const server = http.createServer((req, res) => handler(req, res, origin).catch((error) => json(res, 500, { error: String(error) })));
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });
  const address = server.address();
  const actualPort = typeof address === 'object' && address ? address.port : port;
  origin = `http://${host}:${actualPort}`;
  return { server, origin, close: () => new Promise((resolve) => server.close(resolve)) };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  startExecutionServer({ port: Number(process.env.CREATIVE_AGENCY_EXECUTION_PORT ?? 8787) })
    .then(({ origin }) => console.log(`Creative Agency execution runtime: ${origin}`))
    .catch((error) => { console.error(error); process.exitCode = 1; });
}
