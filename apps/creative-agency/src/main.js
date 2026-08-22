import {
  getExecutionStatus,
  startExecution,
  getExecution,
  approveExecution
} from './execution-client.js';
import { renderCommandCenterView, renderArtifactQueue } from './command-center-view.js';
import { createDirectionSelectionState, directionCandidates } from './direction-state.js';
import { createExecutionCommandCenterState } from '../command-center-artifacts.mjs';

const stages = [
  { id: 'brief', label: 'Brief' },
  { id: 'research', label: 'Research' },
  { id: 'explore', label: 'Explore' },
  { id: 'make', label: 'Make' },
  { id: 'review', label: 'Review' },
  { id: 'deliver', label: 'Deliver' }
];

let activeJob = null;
let pollTimer = null;
let runtimeOnline = false;
let directionState = createDirectionSelectionState();

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));

function setStage(id) {
  const stage = stages.find((item) => item.id === id) ?? stages[0];
  document.querySelectorAll('.spine-step').forEach((el) => el.classList.toggle('active', el.dataset.stage === stage.id));
  const label = document.querySelector('#active-stage-label');
  const chip = document.querySelector('#phase-chip');
  if (label) label.textContent = stage.label;
  if (chip) chip.textContent = `Current · ${stage.label}`;
}

function renderDirectionState() {
  const workspace = document.querySelector('#direction-workspace');
  const lock = document.querySelector('#direction-lock');
  const label = document.querySelector('#selected-direction-label');
  const summary = document.querySelector('#selected-direction-summary');
  const state = document.querySelector('#direction-state');
  const activeStageState = document.querySelector('#active-stage-state');
  if (workspace) workspace.dataset.state = directionState.status;
  if (state) state.textContent = directionState.status === 'locked' ? 'LOCKED' : 'SELECTION REQUIRED';
  if (label) label.textContent = directionState.selected?.label ?? 'None selected';
  if (summary) summary.textContent = directionState.selected
    ? `${directionState.selected.premise} Next layer: typography, layout, imagery, motion, then measured build.`
    : 'Choose one direction before build, review, typography, imagery, or motion work continues.';
  if (activeStageState) activeStageState.textContent = directionState.selected ? 'Direction locked' : 'Direction required';
  if (lock) lock.dataset.state = directionState.status;
  document.querySelectorAll('.direction-card').forEach((card) => {
    const selected = card.dataset.directionId === directionState.selectedId;
    card.classList.toggle('selected', selected);
    card.setAttribute('aria-selected', selected ? 'true' : 'false');
  });
  document.querySelectorAll('.direction-select').forEach((button) => {
    const selected = button.dataset.directionId === directionState.selectedId;
    button.textContent = selected ? 'Selected' : 'Select Direction';
  });
}

function toast(title, copy) {
  const el = document.querySelector('#toast');
  const titleEl = document.querySelector('#toast-title');
  const copyEl = document.querySelector('#toast-copy');
  if (!el || !titleEl || !copyEl) return;
  titleEl.textContent = title;
  copyEl.textContent = copy;
  el.classList.add('show');
  window.setTimeout(() => el.classList.remove('show'), 4200);
}

function setRuntimeStatus(online, label) {
  runtimeOnline = online;
  const pill = document.querySelector('#runtime-pill');
  if (pill) {
    pill.classList.toggle('offline', !online);
    pill.classList.toggle('online', online);
  }
  const runtimeLabel = document.querySelector('#runtime-label');
  if (runtimeLabel) runtimeLabel.textContent = label;
  const disabled = !online || !directionState.canExecute || ['queued','running'].includes(activeJob?.status);
  const run = document.querySelector('#run-execution');
  const review = document.querySelector('#run-review-execution');
  if (run) run.disabled = disabled;
  if (review) review.disabled = disabled;
}

function metricState(value) {
  return value === true ? 'PASS' : value === false ? 'FAIL' : '—';
}

function setEvidenceMetric(id, value, note, state = 'unmeasured') {
  const row = document.querySelector(`#evidence-${id}`);
  const valueEl = document.querySelector(`#metric-${id}`);
  const noteEl = document.querySelector(`#metric-${id}-note`);
  if (row) row.dataset.state = state;
  if (valueEl) valueEl.textContent = value;
  if (noteEl) noteEl.textContent = note;
}

function findingSet(job) {
  return new Set((job.findings ?? []).map((finding) => finding.code));
}

function hasAny(codes, candidates) {
  return candidates.some((code) => codes.has(code));
}

function renderArtifactState(job = activeJob) {
  try {
    const { state } = createExecutionCommandCenterState(job, { projectId: 'creative-agency', limit: 20 });
    renderArtifactQueue(state);
  } catch (error) {
    renderArtifactQueue({ releaseState: 'blocked', queue: [] });
    console.error('Artifact Graph projection failed', error);
  }
}

function renderExecution(job) {
  if (!job) return;
  activeJob = job;
  const jobId = document.querySelector('#job-id');
  if (jobId) jobId.textContent = job.id.toUpperCase();

  const release = job.releaseDecision ?? {};
  const releaseState = document.querySelector('#release-state');
  if (releaseState) {
    releaseState.className = '';
    if (job.status !== 'complete') releaseState.textContent = job.status.toUpperCase();
    else if (release.status === 'ready') { releaseState.textContent = 'RELEASE READY'; releaseState.className = 'release-ready'; }
    else if (release.status === 'review') { releaseState.textContent = 'RELEASE REVIEW'; releaseState.className = 'release-review'; }
    else { releaseState.textContent = 'RELEASE BLOCKED'; releaseState.className = 'release-blocked'; }
  }

  for (const step of job.steps ?? []) {
    const el = document.querySelector(`[data-execution-step="${step.id}"]`);
    if (!el) continue;
    el.dataset.status = step.status;
    const value = el.querySelector('i');
    if (value) value.textContent = step.status;
  }

  const preview = document.querySelector('#live-preview');
  const empty = document.querySelector('#preview-empty');
  if (job.artifacts?.previewUrl && preview && empty) {
    if (preview.src !== job.artifacts.previewUrl) preview.src = job.artifacts.previewUrl;
    preview.hidden = false;
    empty.hidden = true;
  }

  const codes = findingSet(job);
  const browser = job.evidence?.browser;
  setEvidenceMetric('browser', browser ? `${browser.passed}/${browser.captures}` : 'UNMEASURED', browser ? `${browser.reducedMotionCaptures ?? 0} reduced-motion` : 'not run', browser ? (browser.passed === browser.captures ? 'pass' : 'fail') : 'unmeasured');

  const responsive = job.evidence?.responsive ?? {};
  const responsiveValues = ['mobile','tablet','desktop'].map((id) => responsive[id]?.pass);
  const responsiveMeasured = responsiveValues.some((value) => typeof value === 'boolean');
  const responsivePass = responsiveMeasured && responsiveValues.every((value) => value === true);
  setEvidenceMetric('responsive', responsiveMeasured ? metricState(responsivePass) : 'UNMEASURED', responsiveMeasured ? ['M','T','D'].map((label,index)=>`${label}:${metricState(responsiveValues[index])}`).join(' · ') : 'not run', responsiveMeasured ? (responsivePass ? 'pass' : 'fail') : 'unmeasured');

  const vitals = job.evidence?.webVitals;
  const vitalFailed = hasAny(codes, ['lcp-budget-failed','inp-budget-failed','cls-budget-failed','web-vitals-evidence-missing']);
  setEvidenceMetric('vitals', vitals?.measured ? `LCP ${Math.round(vitals.lcpMs)} ms` : 'UNMEASURED', vitals?.measured ? `interaction ${Math.round(vitals.inpMs)} ms · CLS ${Number(vitals.cls).toFixed(3)}` : 'LCP · interaction proxy · CLS', vitals?.measured ? (vitalFailed ? 'fail' : 'pass') : 'unmeasured');

  const runtime = job.evidence?.runtime;
  const runtimeFailed = hasAny(codes, ['fps-budget-failed','frame-time-budget-failed','long-task-budget-failed','runtime-evidence-missing']);
  setEvidenceMetric('runtime', runtime?.measured ? `${runtime.fps} FPS` : 'UNMEASURED', runtime?.measured ? `${runtime.maxFrameMs} ms max · ${runtime.longTasks} long tasks${runtime.usedJsHeapMb ? ` · ${runtime.usedJsHeapMb} MB heap` : ''}` : 'FPS · frame · long tasks', runtime?.measured ? (runtimeFailed ? 'fail' : 'pass') : 'unmeasured');

  const accessibility = job.evidence?.accessibility;
  const accessibilityFailed = hasAny(codes, ['accessibility-blockers','accessibility-majors','accessibility-evidence-missing']);
  setEvidenceMetric('accessibility', accessibility?.measured ? `${accessibility.blockers}B / ${accessibility.majors}M` : 'UNMEASURED', accessibility?.measured ? `${accessibility.keyboard?.uniqueVisited ?? 0} focus states · ${Math.round((accessibility.keyboard?.visibleRatio ?? 0) * 100)}% visible focus` : 'semantics · keyboard · focus', accessibility?.measured ? (accessibilityFailed ? 'fail' : 'pass') : 'unmeasured');

  const reducedMotion = job.evidence?.reducedMotion;
  setEvidenceMetric('motion', reducedMotion?.measured ? metricState(reducedMotion.pass) : 'UNMEASURED', reducedMotion?.measured ? `${reducedMotion.continuousAnimations} continuous animations · media ${reducedMotion.mediaQuery ? 'active' : 'missing'}` : 'continuous animation gate', reducedMotion?.measured ? (reducedMotion.pass ? 'pass' : 'fail') : 'unmeasured');

  const visual = job.evidence?.visualRegression;
  const visualValue = visual?.status === 'baseline-seed' ? 'BASELINE SEED' : visual?.measured ? metricState(visual.pass) : 'UNMEASURED';
  const visualNote = visual?.status === 'baseline-seed' ? 'approve iteration to promote baseline' : visual?.status === 'compared' ? `${((visual.maxChangedRatio ?? 0) * 100).toFixed(2)}% max drift · ${(visual.threshold * 100).toFixed(2)}% limit` : 'approved reduced-motion baseline';
  setEvidenceMetric('visual', visualValue, visualNote, visual?.status === 'baseline-seed' ? 'baseline' : visual?.measured ? (visual.pass ? 'pass' : 'fail') : 'unmeasured');

  const bundle = job.evidence?.bundle;
  const bundleFailed = hasAny(codes, ['initial-js-budget-failed','initial-css-budget-failed','bundle-evidence-missing']);
  setEvidenceMetric('bundle', bundle?.measured ? `${bundle.initialJsKb} KB JS` : 'UNMEASURED', bundle?.measured ? `${bundle.initialCssKb} KB CSS · measured` : 'built asset bytes', bundle?.measured ? (bundleFailed ? 'fail' : 'pass') : 'unmeasured');

  const captures = job.artifacts?.captures ?? [];
  const captureCount = document.querySelector('#capture-count');
  const captureGrid = document.querySelector('#capture-grid');
  if (captureCount) captureCount.textContent = String(captures.length).padStart(2, '0');
  if (captureGrid) captureGrid.innerHTML = captures.length ? captures.map((capture) => `
    <a class="capture-card ${capture.pass ? 'pass' : 'fail'}" href="${escapeHtml(capture.screenshot)}" target="_blank" rel="noreferrer">
      <img src="${escapeHtml(capture.screenshot)}" alt="${escapeHtml(capture.id)} browser capture" loading="lazy" />
      <div><b>${escapeHtml(capture.viewport?.id ?? 'viewport')}</b><span>${capture.reducedMotion ? 'reduced motion' : 'full motion'}</span><i>${capture.pass ? 'PASS' : 'FAIL'}</i></div>
    </a>`).join('') : '<div class="empty-line">No produced captures yet.</div>';

  const findings = job.findings ?? [];
  const patches = new Map((job.patches ?? []).map((patch) => [patch.sourceFinding, patch]));
  const findingCount = document.querySelector('#finding-count');
  const findingList = document.querySelector('#finding-list');
  if (findingCount) findingCount.textContent = String(findings.length).padStart(2, '0');
  if (findingList) findingList.innerHTML = findings.length ? findings.map((finding) => {
    const patch = patches.get(finding.code);
    return `<article class="finding-item ${escapeHtml(finding.severity)}"><div><span>${escapeHtml(finding.severity)}</span><b>${escapeHtml(finding.code)}</b></div><p>${escapeHtml(finding.message)}</p>${patch ? `<small>PATCH · ${escapeHtml(patch.instruction)}</small>` : ''}</article>`;
  }).join('') : '<div class="empty-line">No findings.</div>';

  const report = document.querySelector('#release-report');
  if (report) {
    if (job.artifacts?.reportUrl) { report.href = job.artifacts.reportUrl; report.hidden = false; }
    else report.hidden = true;
  }

  const approve = document.querySelector('#approve-execution');
  if (approve) {
    approve.disabled = job.status !== 'complete' || job.approval === 'iteration-approved';
    approve.innerHTML = job.approval === 'iteration-approved' ? '<span class="action-icon">✓</span>Iteration Approved' : '<span class="action-icon">✓</span>Approve Iteration';
  }

  const disableRun = !runtimeOnline || ['queued','running'].includes(job.status);
  const run = document.querySelector('#run-execution');
  const review = document.querySelector('#run-review-execution');
  if (run) run.disabled = disableRun;
  if (review) review.disabled = disableRun;
  renderArtifactState(job);
}

async function checkRuntime() {
  try {
    const status = await getExecutionStatus();
    setRuntimeStatus(true, `Runtime ready · ${status.measurement ?? status.runtime}`);
  } catch {
    setRuntimeStatus(false, 'Execution server offline');
  }
}

async function startBuild() {
  if (!runtimeOnline) return toast('Execution unavailable', 'Run npm run dev so the local execution service starts with the Command Center.');
  if (!directionState.canExecute) {
    setStage('explore');
    return toast('Select a direction first', 'Choose one of the three creative directions before the build and review loop can run.');
  }
  try {
    setStage('make');
    const iteration = Number.isInteger(activeJob?.iteration) ? activeJob.iteration + 1 : 0;
    const result = await startExecution({ projectId: 'creative-agency', iteration, selectedDirectionId: directionState.selectedId });
    activeJob = result.job;
    renderExecution(activeJob);
    toast('Measured production started', `${activeJob.id} is building, capturing and reviewing the current artifact.`);
    startPolling();
  } catch (error) {
    if (error.status === 409 && error.body?.job) {
      activeJob = error.body.job;
      renderExecution(activeJob);
      startPolling();
      return toast('Execution already running', activeJob.id);
    }
    toast('Build failed to start', error.message);
  }
}

function startPolling() {
  window.clearInterval(pollTimer);
  if (!activeJob?.id) return;
  pollTimer = window.setInterval(async () => {
    try {
      const { job } = await getExecution(activeJob.id);
      renderExecution(job);
      if (['complete','error'].includes(job.status)) {
        window.clearInterval(pollTimer);
        if (job.status === 'complete') {
          setStage('review');
          const decision = job.releaseDecision?.status ?? 'blocked';
          toast('Measured review complete', decision === 'ready' ? 'Required release evidence passed. This build is production-ready.' : decision === 'review' ? 'No blockers remain, but major findings still require review.' : 'Release blockers remain visible in the Command Center.');
        } else toast('Execution failed', job.error ?? 'Unknown execution error.');
      }
    } catch (error) {
      window.clearInterval(pollTimer);
      toast('Polling stopped', error.message);
    }
  }, 1100);
}

async function refreshExecution() {
  await checkRuntime();
  if (!activeJob?.id) { renderArtifactState(null); return; }
  try { renderExecution((await getExecution(activeJob.id)).job); }
  catch (error) { toast('Refresh failed', error.message); }
}

async function approveIteration() {
  if (!activeJob?.id) return;
  try {
    const { job } = await approveExecution(activeJob.id);
    renderExecution(job);
    setStage('deliver');
    toast(
      'Iteration approved',
      job.productionReady
        ? 'Iteration approved. Its reduced-motion captures are now the regression baseline and the release is production-ready.'
        : 'Creative iteration approved. Release blockers remain enforced, so the visual baseline was not promoted.'
    );
  } catch (error) {
    toast('Approval blocked', error.message);
  }
}

function bind() {
  document.querySelectorAll('.spine-step').forEach((el) => el.addEventListener('click', () => setStage(el.dataset.stage)));
  document.querySelectorAll('.rail-button').forEach((el) => el.addEventListener('click', () => {
    if (el.classList.contains('active')) return;
    toast('Workspace not wired yet', 'This packet makes direction selection real first. Other sections will unlock as their evidence surfaces land.');
  }));
  document.querySelectorAll('.direction-select').forEach((el) => el.addEventListener('click', () => {
    directionState = createDirectionSelectionState({ selectedId: el.dataset.directionId });
    renderDirectionState();
    setRuntimeStatus(runtimeOnline, document.querySelector('#runtime-label')?.textContent ?? 'Execution server offline');
    setStage('explore');
    toast('Direction locked', `${directionState.selected.label} is now the source direction for the next layers.`);
  }));
  document.querySelector('#run-execution')?.addEventListener('click', startBuild);
  document.querySelector('#run-review-execution')?.addEventListener('click', () => {
    toast('Measured review pipeline', 'The current local executor performs build, capture and independent review as one auditable job.');
    return startBuild();
  });
  document.querySelector('#refresh-execution')?.addEventListener('click', refreshExecution);
  document.querySelector('#approve-execution')?.addEventListener('click', approveIteration);
  document.querySelector('#patch-queue-action')?.addEventListener('click', () => document.querySelector('#review-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  document.addEventListener('keydown', (event) => {
    if (event.key >= '1' && event.key <= '6' && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) setStage(stages[Number(event.key) - 1].id);
  });
}

renderCommandCenterView({ stages, projectName: 'Project 001', directions: directionCandidates });
setStage('brief');
renderDirectionState();
renderArtifactState(null);
bind();
checkRuntime();
window.setInterval(checkRuntime, 8000);
