import {
  getExecutionStatus,
  getCreativeWorldCatalog,
  startExecution,
  getExecution,
  approveExecution
} from './execution-client.js';
import { renderCommandCenterView, renderArtifactQueue, renderDirectionCandidates } from './command-center-view.js';
import { createDirectionSelectionState } from './direction-state.js';
import { createExecutionCommandCenterState } from '../command-center-artifacts.mjs';

const stages = [
  { id: 'brief', label: 'Brief' },
  { id: 'research', label: 'Research' },
  { id: 'explore', label: 'Explore' },
  { id: 'make', label: 'Make' },
  { id: 'review', label: 'Review' },
  { id: 'deliver', label: 'Deliver' }
];

const params = new URLSearchParams(window.location.search);
const creativeProjectId = window.__CREATIVE_AGENCY_PROJECT_ID__ || params.get('project') || 'ai-council';
const projectName = creativeProjectId.split(/[-_]/).filter(Boolean).map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ');

let activeJob = null;
let pollTimer = null;
let runtimeOnline = false;
let worldCatalog = null;
let directionState = createDirectionSelectionState({ catalogStatus: 'loading' });

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));

function setStage(id) {
  const stage = stages.find((item) => item.id === id) ?? stages[0];
  document.querySelectorAll('.spine-step').forEach((el) => el.classList.toggle('active', el.dataset.stage === stage.id));
  const label = document.querySelector('#active-stage-label');
  const chip = document.querySelector('#phase-chip');
  if (label) label.textContent = stage.label;
  if (chip) chip.textContent = `Current · ${stage.label}`;
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

function stageStateCopy() {
  if (directionState.status === 'execution-locked') return 'World locked to execution';
  if (directionState.status === 'locked') return 'Reviewed world locked';
  if (directionState.status === 'proof-required') return 'Visual proof required';
  if (directionState.status === 'worlds-required') return 'Creative Worlds required';
  return 'Direction selection required';
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
  const activeExecution = ['queued','running'].includes(activeJob?.status);
  const disabled = !online || !directionState.canExecute || activeExecution;
  const run = document.querySelector('#run-execution');
  const review = document.querySelector('#run-review-execution');
  if (run) run.disabled = disabled;
  if (review) review.disabled = disabled;
  const activeStageState = document.querySelector('#active-stage-state');
  if (activeStageState) activeStageState.textContent = stageStateCopy();
}

function bindDirectionButtons() {
  document.querySelectorAll('.direction-select').forEach((button) => button.addEventListener('click', () => {
    if (directionState.immutable) return toast('World is execution-locked', `Execution ${directionState.lockedByExecutionId} already records its Creative World source.`);
    const candidate = worldCatalog?.candidates?.find((item) => item.id === button.dataset.directionId);
    if (!candidate) return toast('Selection unavailable', 'The Creative World is not present in the current project catalog.');

    directionState = createDirectionSelectionState({
      candidates: worldCatalog.candidates,
      selectedId: candidate.id,
      catalogVersion: worldCatalog.catalogVersion,
      catalogStatus: worldCatalog.status
    });
    renderDirectionState();
    setStage('explore');
    if (!candidate.canLock) {
      return toast('Visual proof required', `${candidate.label} is structurally valid, but prose cannot win. Generate and review comparable style-frame proof before locking it.`);
    }
    toast('Creative World locked', `${candidate.label} has reviewed visual proof and is the source world for the next execution.`);
  }));
}

function renderDirectionState() {
  renderDirectionCandidates({
    candidates: directionState.candidates,
    catalogStatus: directionState.catalogStatus,
    immutable: directionState.immutable
  });
  const workspace = document.querySelector('#direction-workspace');
  const lock = document.querySelector('#direction-lock');
  const label = document.querySelector('#selected-direction-label');
  const summary = document.querySelector('#selected-direction-summary');
  const state = document.querySelector('#direction-state');
  if (workspace) workspace.dataset.state = directionState.status;
  if (lock) lock.dataset.state = directionState.status;
  if (state) state.textContent = directionState.status.replaceAll('-', ' ').toUpperCase();
  if (label) label.textContent = directionState.selected?.label ?? 'None selected';
  if (summary) {
    if (directionState.status === 'execution-locked') {
      summary.textContent = `${directionState.selected?.premise ?? ''} Execution ${directionState.lockedByExecutionId} preserves this world and its proof provenance.`;
    } else if (directionState.selected?.canLock) {
      summary.textContent = `${directionState.selected.premise} Reviewed visual proof: ${(directionState.selected.visualProof?.evidenceRefs ?? []).length} evidence ref(s).`;
    } else if (directionState.selected) {
      summary.textContent = `${directionState.selected.premise} This world is not yet authoritative: comparable visual proof must be generated and reviewed first.`;
    } else if (directionState.catalogStatus === 'not-generated') {
      summary.textContent = 'No Creative World artifact exists yet. The studio must finish Product Understanding, research, Creative Thesis and authored world exploration before art direction can be selected.';
    } else {
      summary.textContent = worldCatalog?.selectionRule ?? 'A world becomes authoritative only after comparable visual proof is reviewed. Prose cannot authorize production.';
    }
  }
  document.querySelectorAll('.direction-card').forEach((card) => {
    const selected = card.dataset.directionId === directionState.selectedId;
    card.classList.toggle('selected', selected);
    card.setAttribute('aria-selected', selected ? 'true' : 'false');
  });
  document.querySelectorAll('.direction-select').forEach((button) => {
    const selected = button.dataset.directionId === directionState.selectedId;
    const candidate = directionState.candidates.find((item) => item.id === button.dataset.directionId);
    button.disabled = directionState.immutable;
    button.textContent = selected
      ? (candidate?.canLock ? 'Selected' : 'Proof Required')
      : (candidate?.canLock ? 'Lock Reviewed World' : 'Preview World');
  });
  bindDirectionButtons();
  setRuntimeStatus(runtimeOnline, document.querySelector('#runtime-label')?.textContent ?? 'Execution server offline');
}

function lockDirectionFromExecution(job) {
  const executionSelection = job?.directionSelection;
  if (!executionSelection?.selectedCreativeWorldId) return;
  const candidates = worldCatalog?.candidates ?? directionState.candidates;
  const known = candidates.some((candidate) => candidate.id === executionSelection.selectedCreativeWorldId);
  const executionCandidate = known ? candidates : [{
    id: executionSelection.selectedCreativeWorldId,
    label: executionSelection.selectedCreativeWorldLabel ?? executionSelection.selectedCreativeWorldId,
    premise: 'Creative World recorded by the execution job.',
    worldClass: 'execution-record',
    spatialModel: '', typography: '', interaction: '', mobile: '', risk: '',
    canLock: true,
    visualProof: { reviewReady: true, status: 'review-ready', evidenceRefs: executionSelection.visualEvidenceRefs ?? [] }
  }];
  directionState = createDirectionSelectionState({
    candidates: executionCandidate,
    selectedId: executionSelection.selectedCreativeWorldId,
    catalogVersion: executionSelection.creativeWorldCatalogVersion,
    catalogStatus: 'visual-proof-ready',
    lockedByExecutionId: job.id
  });
  renderDirectionState();
}

async function loadWorldCatalog() {
  try {
    const { catalog } = await getCreativeWorldCatalog(creativeProjectId);
    worldCatalog = catalog;
    directionState = createDirectionSelectionState({
      candidates: catalog.candidates ?? [],
      selectedId: directionState.selectedId,
      catalogVersion: catalog.catalogVersion,
      catalogStatus: catalog.status,
      lockedByExecutionId: directionState.lockedByExecutionId
    });
    renderDirectionState();
    if (catalog.status === 'not-generated') setStage('research');
    else if (catalog.status === 'awaiting-visual-proof') setStage('explore');
  } catch (error) {
    worldCatalog = { status: 'blocked', candidates: [], catalogVersion: null, selectionRule: error.message };
    directionState = createDirectionSelectionState({ candidates: [], catalogStatus: 'blocked' });
    renderDirectionState();
    toast('Creative World catalog unavailable', error.message);
  }
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
  lockDirectionFromExecution(job);
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

  setRuntimeStatus(runtimeOnline, document.querySelector('#runtime-label')?.textContent ?? 'Execution server offline');
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
  if (!directionState.canExecute || !directionState.selected) {
    setStage('explore');
    return toast('Reviewed Creative World required', 'Build is blocked until a project-specific world has comparable visual proof and you explicitly lock it.');
  }
  if (directionState.immutable) return toast('World already execution-locked', `Execution ${directionState.lockedByExecutionId} owns the current selection.`);
  try {
    setStage('make');
    const iteration = Number.isInteger(activeJob?.iteration) ? activeJob.iteration + 1 : 0;
    const result = await startExecution({
      projectId: 'creative-agency',
      creativeProjectId,
      iteration,
      selectedCreativeWorldId: directionState.selectedId,
      creativeWorldCatalogVersion: directionState.catalogVersion
    });
    activeJob = result.job;
    renderExecution(activeJob);
    toast('Measured production started', `${activeJob.id} is building under ${activeJob.directionSelection.selectedCreativeWorldLabel}.`);
    startPolling();
  } catch (error) {
    if (error.status === 409 && error.body?.job) {
      activeJob = error.body.job;
      renderExecution(activeJob);
      startPolling();
      return toast('Execution already running', activeJob.id);
    }
    if (error.status === 422) {
      await loadWorldCatalog();
      return toast('Creative World gate blocked execution', error.body?.findings?.[0]?.message ?? error.message);
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
  await loadWorldCatalog();
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
    toast('Workspace not wired yet', 'Direction truth is wired first. Other sections unlock when their evidence surfaces land.');
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

renderCommandCenterView({ stages, projectName, creativeProjectId });
setStage('brief');
renderArtifactState(null);
bind();
renderDirectionState();
Promise.all([checkRuntime(), loadWorldCatalog()]);
window.setInterval(checkRuntime, 8000);
