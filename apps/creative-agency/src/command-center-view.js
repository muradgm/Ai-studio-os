const nav = [
  ['projects', 'Projects'],
  ['command', 'Command Center'],
  ['council', 'Council'],
  ['assets', 'Assets'],
  ['delivery', 'Deliveries'],
  ['memory', 'Memory']
];

const icons = {
  projects: '<path d="M4 5h16v14H4zM8 2v6M16 2v6"/>',
  command: '<path d="M4 7h16v12H4zM9 7V4h6v3M4 11h16"/>',
  council: '<circle cx="12" cy="8" r="3"/><path d="M5 20c.7-4 3-6 7-6s6.3 2 7 6"/>',
  assets: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
  delivery: '<path d="M4 12h12M12 8l4 4-4 4M4 5h16v14H4"/>',
  memory: '<path d="M7 4h10a2 2 0 0 1 2 2v14l-7-4-7 4V6a2 2 0 0 1 2-2z"/>'
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">${icons[name]}</svg>`;
}

function evidenceMetric(id, label, note) {
  return `<div class="evidence-metric" id="evidence-${id}" data-state="unmeasured">
    <span>${label}</span><b id="metric-${id}">UNMEASURED</b><i id="metric-${id}-note">${note}</i>
  </div>`;
}

function executorMirror() {
  return `<div class="execution-spine execution-spine-hidden" id="execution-spine" aria-hidden="true">
    ${['build','capture','review','patch','approve'].map((id, index) => `<div class="execution-step" data-execution-step="${id}"><span>0${index + 1}</span><b>${id}</b><i>waiting</i></div>`).join('')}
  </div>`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}

export function renderCommandCenterView({ stages = [], projectName = 'Project 001', directions = [] } = {}) {
  document.documentElement.classList.add('command-center-fidelity');
  document.querySelector('#app').innerHTML = `
  <div class="app-shell">
    <aside class="rail">
      <div class="rail-mark" title="The Creative Agency — provisional identity treatment"><span class="ca-monogram">CA</span><span class="ca-wordmark">The Creative<br/>Agency</span></div>
      <nav class="rail-nav" aria-label="Primary">
        ${nav.map(([id, label]) => `<button type="button" class="rail-button ${id === 'command' ? 'active' : ''}" aria-label="${label}">${icon(id)}<span class="rail-label">${label}</span></button>`).join('')}
      </nav>
      <div class="rail-system-label">SYSTEM</div>
      <div class="rail-index">AI Studio OS · Production Proof</div>
    </aside>

    <main class="workspace" id="command-center">
      <section class="approved-command-shell">
        <header class="approved-header">
          <div class="approved-project"><span>PROJECT</span><div><h1>${escapeHtml(projectName)}</h1><i aria-hidden="true">☆</i></div></div>
          <div class="approved-stage"><span>PIPELINE STAGE</span><div><h2 id="active-stage-label">Brief</h2><small><i></i><span id="active-stage-state">Direction required</span></small></div></div>
          <div class="approved-actions">
            <button type="button" id="run-execution"><span class="action-icon">⌁</span>Build</button>
            <button type="button" id="run-review-execution"><span class="action-icon">▷</span>Run Review</button>
            <button type="button" id="patch-queue-action"><span class="action-icon">⌘</span>Patch Queue</button>
            <button type="button" class="approved-primary" id="approve-execution" disabled><span class="action-icon">✓</span>Approve Iteration</button>
          </div>
        </header>

        <div class="approved-pipeline">
          <nav class="project-spine" aria-label="Project stages">
            ${stages.map((stage, index) => `<button type="button" class="spine-step ${index === 0 ? 'active' : ''}" data-stage="${stage.id}" ${index === 0 ? 'data-release-probe="stage-brief"' : ''}><small>${String(index + 1).padStart(2, '0')}</small><strong>${escapeHtml(stage.label)}</strong></button>`).join('')}
          </nav>
        </div>

        <div class="approved-main-grid">
          <section class="approved-panel direction-workspace" id="direction-workspace" data-state="selection-required">
            <header><span>DIRECTION SELECTION</span><b id="direction-count">${String(directions.length).padStart(2, '0')}</b><i id="direction-state">SELECTION REQUIRED</i></header>
            <div class="direction-grid" id="direction-grid">
              ${directions.map((direction, index) => `<article class="direction-card" data-direction-id="${escapeHtml(direction.id)}">
                <div class="direction-card-head"><span>${String(index + 1).padStart(2, '0')}</span><b>${escapeHtml(direction.label)}</b></div>
                <p>${escapeHtml(direction.premise)}</p>
                <dl>
                  <div><dt>Space</dt><dd>${escapeHtml(direction.spatialModel)}</dd></div>
                  <div><dt>Type</dt><dd>${escapeHtml(direction.typography)}</dd></div>
                  <div><dt>Interaction</dt><dd>${escapeHtml(direction.interaction)}</dd></div>
                  <div><dt>Mobile</dt><dd>${escapeHtml(direction.mobile)}</dd></div>
                </dl>
                <small>${escapeHtml(direction.risk)}</small>
                <button type="button" class="direction-select" data-direction-id="${escapeHtml(direction.id)}">Select Direction</button>
              </article>`).join('')}
            </div>
            <aside class="direction-lock" id="direction-lock">
              <span>LOCKED DIRECTION</span>
              <b id="selected-direction-label">None selected</b>
              <p id="selected-direction-summary">Choose one direction before build, review, typography, imagery, or motion work continues.</p>
            </aside>
          </section>

          <section class="approved-panel approved-queue">
            <header><span>PRODUCTION QUEUE</span><b id="artifact-queue-count">00</b><i>•••</i></header>
            <div class="approved-queue-list" id="artifact-queue"><div class="empty-line">Artifact Graph state is loading.</div></div>
            <footer><span id="artifact-release-state">UNMEASURED</span><span> · Artifact Graph truth</span></footer>
          </section>

          <section class="approved-panel approved-preview">
            <div class="preview-surface">
              <div class="surface-head"><span>LIVE PREVIEW</span><b id="job-id">NO EXECUTION</b></div>
              <div class="preview-empty" id="preview-empty"><strong>Measured build evidence appears here.</strong><span>Run the local production pipeline to create a live artifact.</span></div>
              <iframe id="live-preview" title="Live build preview" hidden></iframe>
            </div>
          </section>

          <aside class="approved-right-rail">
            <section class="approved-panel approved-evidence">
              <aside class="evidence-rail">
                <div class="surface-head"><span>EVIDENCE & RELEASE STATUS</span><b id="release-state">UNMEASURED</b></div>
                ${evidenceMetric('browser', 'Browser capture', 'not run')}
                ${evidenceMetric('responsive', 'Responsive', 'not run')}
                ${evidenceMetric('vitals', 'Lab Web Vitals', 'LCP · interaction proxy · CLS')}
                ${evidenceMetric('runtime', 'Runtime', 'FPS · frame · long tasks')}
                ${evidenceMetric('accessibility', 'Accessibility', 'semantics · keyboard · focus')}
                ${evidenceMetric('motion', 'Reduced motion', 'continuous animation gate')}
                ${evidenceMetric('visual', 'Visual regression', 'approved reduced-motion baseline')}
                ${evidenceMetric('bundle', 'Bundle', 'built asset bytes')}
              </aside>
            </section>

            <section class="approved-panel approved-review" id="review-panel">
              <header><span>REVIEW & CRITIQUE</span><b id="finding-count">00</b><i>•••</i></header>
              <div class="approved-review-list finding-list" id="finding-list"><div class="empty-line">No review evidence yet.</div></div>
              <footer>Only measured findings and executable patch evidence appear here.</footer>
            </section>
          </aside>

          <section class="approved-panel approved-outputs">
            <div class="capture-area">
              <div class="surface-head"><span>GENERATED OUTPUTS / BROWSER CAPTURES</span><b id="capture-count">00</b></div>
              <div class="capture-grid" id="capture-grid"><div class="empty-line">No produced captures yet.</div></div>
            </div>
          </section>
        </div>

        <footer class="approved-utility">
          <div class="utility-version"><button type="button">v1.3.2 <span>⌄</span></button><span id="phase-chip">Current · Brief</span></div>
          <div class="utility-runtime"><div class="status-pill offline" id="runtime-pill"><i class="status-dot"></i><span id="runtime-label">Execution server offline</span></div></div>
          <div class="utility-links"><a class="report-link" id="release-report" href="#" hidden target="_blank" rel="noreferrer">Release report</a><button type="button" id="refresh-execution">Refresh</button><span>Project Memory</span><span>Team</span></div>
        </footer>
        ${executorMirror()}
      </section>
    </main>

    <div class="toast" id="toast"><b id="toast-title">Command Center</b><span id="toast-copy"></span></div>
  </div>`;
}

export function renderArtifactQueue(state = {}) {
  const queue = Array.isArray(state.queue) ? state.queue : [];
  const root = document.querySelector('#artifact-queue');
  const count = document.querySelector('#artifact-queue-count');
  const release = document.querySelector('#artifact-release-state');
  if (count) count.textContent = String(queue.length).padStart(2, '0');
  if (release) {
    release.textContent = String(state.releaseState ?? 'unmeasured').toUpperCase();
    release.dataset.state = state.releaseState ?? 'unmeasured';
  }
  if (!root) return;
  if (!queue.length) {
    root.innerHTML = '<div class="empty-line">No Artifact Graph production items.</div>';
    return;
  }
  root.innerHTML = queue.map((item, index) => `<article class="approved-queue-item" data-state="${escapeHtml(item.state)}">
    <span class="queue-index">${String(index + 1).padStart(2, '0')}</span>
    <span class="queue-status-dot" aria-hidden="true"></span>
    <div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.kind)} · v${escapeHtml(item.version)}</small></div>
    <b>${escapeHtml(item.state).toUpperCase()}</b>
    <small class="queue-evidence">${item.evidence.files} files · ${item.evidence.measurements} measurements</small>
  </article>`).join('');
}
