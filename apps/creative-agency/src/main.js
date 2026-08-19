import {
  getExecutionStatus,
  startExecution,
  getExecution,
  approveExecution
} from './execution-client.js';

const stages = [
  { id: 'brief', index: '01', label: 'Brief', kicker: 'Define the real problem', title: 'Start with the <em>brief</em>, not the model.', deck: 'Capture intent, business outcome, audience, constraints, source assets and truth requirements before any creative system starts making.', stat: ['5 constraints', '2 open questions', 'source audit pending'] },
  { id: 'research', index: '02', label: 'Research', kicker: 'Evidence before opinion', title: 'Find the <em>signal</em> before choosing a style.', deck: 'Market context, category pressure, source quality and factual constraints are separated from inspiration so aesthetic preference cannot impersonate evidence.', stat: ['11 sources', '4 competitors', 'confidence 0.82'] },
  { id: 'explore', index: '03', label: 'Explore', kicker: 'Diverge on purpose', title: 'Make alternatives that are <em>actually different</em>.', deck: 'Three to five concept families must change the core mechanism, not just the color, typeface or hero image. Weak directions get killed early.', stat: ['4 directions', '2 killed', '1 challenger'] },
  { id: 'decide', index: '04', label: 'Decide', kicker: 'Independent review', title: 'The Council must earn the <em>decision</em>.', deck: 'Strategy, creative, technical and skeptical reviewers work independently, cross-critique, preserve dissent and expose assumptions before selection.', stat: ['6 reviewers', '2 objections', 'confidence 0.86'] },
  { id: 'make', index: '05', label: 'Make', kicker: 'Production under direction', title: 'Turn the decision into <em>work</em>.', deck: 'Design, image, motion, writing, video and implementation inherit one creative direction. Tools are adapters; the project does not become a model marketplace.', stat: ['runtime v1.3', 'browser executable', 'production gates active'] },
  { id: 'review', index: '06', label: 'Review', kicker: 'Measure the artifact', title: 'Review the <em>running artifact</em>, not a screenshot.', deck: 'The Command Center builds, runs Chromium, measures lab Web Vitals, frame behavior, accessibility, responsive states and reduced motion, then turns failures into a bounded patch queue.', stat: ['7 evidence lanes', '3 viewports', 'release decision synthesized'] },
  { id: 'deliver', index: '07', label: 'Deliver', kicker: 'Ship with evidence', title: 'Release only what has <em>earned</em> release.', deck: 'Iteration approval and production readiness remain separate. A release becomes green only when required evidence is measured and blocker/major budgets pass.', stat: ['no fake PASS', 'baseline regression', 'handoff traceable'] }
];

const decisions = [
  { title: 'Execution runtime', body: 'AI Studio OS v1.3 remains the active creative-engineering baseline.', status: 'ready' },
  { title: 'Measured release gate', body: 'Web Vitals, runtime, accessibility, responsive and reduced-motion evidence now participate in release.', status: 'ready' },
  { title: 'Patch behavior', body: 'Findings create an auditable queue; arbitrary shell/code execution is prohibited.', status: 'review' },
  { title: 'Release status', body: 'Green status is computed from measured evidence; iteration approval cannot override it.', status: 'review' }
];

const evidence = [
  { title: 'Real Chromium', body: 'Playwright browser execution is validated in CI.', status: 'ready' },
  { title: 'Release intelligence', body: 'Lab vitals, frame sampling, semantics, keyboard traversal and reduced motion are measured.', status: 'ready' },
  { title: 'Visual baseline', body: 'Approved reduced-motion captures become the regression baseline for the next iteration.', status: 'ready' },
  { title: 'Local-only executor', body: 'Build service binds to 127.0.0.1 and uses whitelisted shell-free jobs.', status: 'ready' }
];

let activeJob = null;
let pollTimer = null;
let runtimeOnline = false;

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));

const icon = (name) => {
  const paths = {
    projects: '<path d="M4 5h16v14H4zM8 2v6M16 2v6"/>',
    work: '<path d="M4 7h16v12H4zM9 7V4h6v3M4 11h16"/>',
    council: '<circle cx="12" cy="8" r="3"/><path d="M5 20c.7-4 3-6 7-6s6.3 2 7 6"/>',
    assets: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
    delivery: '<path d="M4 12h12M12 8l4 4-4 4M4 5h16v14H4"/>',
    memory: '<path d="M7 4h10a2 2 0 0 1 2 2v14l-7-4-7 4V6a2 2 0 0 1 2-2z"/>'
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">${paths[name]}</svg>`;
};

const mark = () => `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M8 21h21c6 0 11 5 11 11S35 43 29 43H8" stroke="currentColor" stroke-width="7"/><path d="M56 21H35c-6 0-11 5-11 11s5 11 11 11h21" stroke="#f16445" stroke-width="7"/><path d="M28 16h8v10h-8zM28 38h8v10h-8z" fill="#0a0b0b"/></svg>`;

const flowGraphic = () => `
<svg class="flow-svg" viewBox="0 0 900 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <g class="flow-grid">
    ${Array.from({length: 13}, (_,i)=>`<line x1="${i*75}" y1="0" x2="${i*75}" y2="520"/>`).join('')}
    ${Array.from({length: 8}, (_,i)=>`<line x1="0" y1="${i*75}" x2="900" y2="${i*75}"/>`).join('')}
  </g>
  <path class="route-base" d="M-50 175H220c62 0 76 48 76 88s24 82 80 82h104c56 0 82-42 82-82s17-88 79-88h309"/>
  <path class="route-base" d="M-40 345h190c65 0 82-45 82-82s19-88 78-88h280c60 0 78 45 78 88s19 82 82 82h190"/>
  <path class="route-live" d="M-50 175H220c62 0 76 48 76 88s24 82 80 82h104c56 0 82-42 82-82s17-88 79-88h309"/>
  <path class="route-live accent" d="M-40 345h190c65 0 82-45 82-82s19-88 78-88h280c60 0 78 45 78 88s19 82 82 82h190"/>
  <rect class="gate gate-a" x="434" y="201" width="32" height="54" rx="2" fill="#0a0b0b" stroke="rgba(241,238,230,.28)"/>
  <rect class="gate gate-b" x="434" y="269" width="32" height="54" rx="2" fill="#0a0b0b" stroke="rgba(241,238,230,.28)"/>
  <circle class="flow-node live" cx="232" cy="263" r="6"/><circle class="flow-node" cx="668" cy="263" r="6"/>
  <circle class="flow-node" cx="450" cy="175" r="5"/><circle class="flow-node" cx="450" cy="345" r="5"/>
</svg>`;

const outputCard = (n, title, note) => `
  <article class="output-card">
    <div class="output-visual"><div class="output-glyph"></div></div>
    <div class="output-body"><div><h4>${title}</h4><p>${note}</p></div><span class="output-number">0${n}</span></div>
  </article>`;

function row(item, i) {
  return `<div class="decision-row"><span class="row-index">0${i+1}</span><div><h4>${item.title}</h4><p>${item.body}</p></div><span class="badge ${item.status}">${item.status}</span></div>`;
}

function render() {
  document.querySelector('#app').innerHTML = `
    <div class="app-shell">
      <aside class="rail">
        <div class="rail-mark" title="Provisional app mark — not canonical">${mark()}</div>
        <nav class="rail-nav" aria-label="Primary">
          <button class="rail-button" aria-label="Projects">${icon('projects')}</button>
          <button class="rail-button active" aria-label="Workroom">${icon('work')}</button>
          <button class="rail-button" aria-label="Council">${icon('council')}</button>
          <button class="rail-button" aria-label="Assets">${icon('assets')}</button>
          <button class="rail-button" aria-label="Deliveries">${icon('delivery')}</button>
          <button class="rail-button" aria-label="Memory">${icon('memory')}</button>
        </nav>
        <div class="rail-index">AI Studio OS · v1.3</div>
      </aside>

      <main class="workspace">
        <header class="topbar">
          <div class="brandline"><strong>The Creative Agency</strong><span>Command Center / Project 001</span></div>
          <div class="top-actions"><div class="status-pill offline" id="runtime-pill"><i class="status-dot"></i><span id="runtime-label">Execution server offline</span></div><button class="icon-button" aria-label="More options">···</button></div>
        </header>

        <section class="project-head">
          <div><div class="eyebrow">Measurement Slice · Brand / Website</div><h1 class="project-title">Build. Measure.<br/>Earn release.</h1><div class="project-meta"><span>Owner <b>Creative Council</b></span><span>Mode <b>Measured production gate</b></span><span>Engine <b>AI Studio OS v1.3</b></span></div></div>
          <div class="phase-chip" id="phase-chip">Current · Brief</div>
        </section>

        <nav class="project-spine" aria-label="Project stages">
          ${stages.map((s,i)=>`<button class="spine-step ${i===0?'active':''}" data-stage="${s.id}" ${i === 0 ? 'data-release-probe="stage-brief"' : ''}><small>${s.index}</small><strong>${s.label}</strong></button>`).join('')}
        </nav>

        <section class="work-grid">
          <article class="panel motion-panel" id="motion-panel" data-state="brief">
            <div class="panel-head"><div class="panel-label"><i></i><span id="panel-stage">Live process / Brief</span></div><div class="panel-count">AGENCY_HANDOFF_001</div></div>
            <div class="motion-stage">${flowGraphic()}</div>
            <div class="motion-stat" id="motion-stat"></div>
            <div class="motion-copy"><div class="motion-kicker" id="motion-kicker"></div><h2 class="motion-title" id="motion-title"></h2><p class="motion-deck" id="motion-deck"></p></div>
          </article>

          <div class="stack">
            <article class="panel"><div class="panel-head"><div class="panel-label"><span>Decisions</span></div><div class="panel-count">04</div></div><div class="decision-list">${decisions.map((d,i)=>row(d,i)).join('')}</div></article>
            <article class="panel"><div class="panel-head"><div class="panel-label"><span>Execution Council</span></div><div class="panel-count">07 gates</div></div><div class="council-strip"><div class="council-avatars">${['DEV','PERF','A11Y','MOT','RESP','VIS'].map(x=>`<div class="avatar">${x}</div>`).join('')}</div><p><strong>Rule:</strong> makers build the artifact; measured browser evidence and independent delivery gates decide what can ship.</p></div></article>
            <article class="panel"><div class="panel-head"><div class="panel-label"><span>Evidence</span></div><div class="panel-count">04</div></div><div class="evidence-list">${evidence.map((d,i)=>row(d,i)).join('')}</div></article>
          </div>

          <section class="command-center panel" id="command-center">
            <div class="cc-head">
              <div><div class="panel-label"><i></i><span>Command Center / Release Intelligence</span></div><p>Real local build, browser observation, lab performance, accessibility and regression evidence.</p></div>
              <div class="cc-actions"><button class="cc-button secondary" id="refresh-execution">Refresh</button><button class="cc-button primary" id="run-execution">Run measured review</button></div>
            </div>

            <div class="execution-spine" id="execution-spine">
              ${['Build','Capture','Review','Patch','Approve'].map((label,i)=>`<div class="execution-step" data-execution-step="${label.toLowerCase()}"><span>0${i+1}</span><b>${label}</b><i>waiting</i></div>`).join('')}
            </div>

            <div class="cc-grid">
              <div class="preview-surface">
                <div class="surface-head"><span>LIVE BUILD</span><b id="job-id">NO EXECUTION</b></div>
                <div class="preview-empty" id="preview-empty"><strong>Measured build evidence appears here.</strong><span>Start the local executor, then run a measured review.</span></div>
                <iframe id="live-preview" title="Live build preview" hidden></iframe>
              </div>

              <aside class="evidence-rail">
                <div class="surface-head"><span>DELIVERY EVIDENCE</span><b id="release-state">UNMEASURED</b></div>
                <div class="evidence-metric" id="evidence-browser" data-state="unmeasured"><span>Browser capture</span><b id="metric-browser">UNMEASURED</b><i id="metric-browser-note">not run</i></div>
                <div class="evidence-metric" id="evidence-responsive" data-state="unmeasured"><span>Responsive</span><b id="metric-responsive">UNMEASURED</b><i id="metric-responsive-note">not run</i></div>
                <div class="evidence-metric" id="evidence-vitals" data-state="unmeasured"><span>Lab Web Vitals</span><b id="metric-vitals">UNMEASURED</b><i id="metric-vitals-note">LCP · interaction proxy · CLS</i></div>
                <div class="evidence-metric" id="evidence-runtime" data-state="unmeasured"><span>Runtime</span><b id="metric-runtime">UNMEASURED</b><i id="metric-runtime-note">FPS · frame · long tasks</i></div>
                <div class="evidence-metric" id="evidence-accessibility" data-state="unmeasured"><span>Accessibility</span><b id="metric-accessibility">UNMEASURED</b><i id="metric-accessibility-note">semantics · keyboard · focus</i></div>
                <div class="evidence-metric" id="evidence-motion" data-state="unmeasured"><span>Reduced motion</span><b id="metric-motion">UNMEASURED</b><i id="metric-motion-note">continuous animation gate</i></div>
                <div class="evidence-metric" id="evidence-visual" data-state="unmeasured"><span>Visual regression</span><b id="metric-visual">UNMEASURED</b><i id="metric-visual-note">approved reduced-motion baseline</i></div>
                <div class="evidence-metric" id="evidence-bundle" data-state="unmeasured"><span>Bundle</span><b id="metric-bundle">UNMEASURED</b><i id="metric-bundle-note">built asset bytes</i></div>
              </aside>
            </div>

            <div class="cc-lower">
              <div class="capture-area"><div class="surface-head"><span>BROWSER CAPTURES</span><b id="capture-count">0</b></div><div class="capture-grid" id="capture-grid"><div class="empty-line">No captures yet.</div></div></div>
              <div class="review-area"><div class="surface-head"><span>FINDINGS / PATCH QUEUE</span><b id="finding-count">0</b></div><div id="finding-list" class="finding-list"><div class="empty-line">No review evidence yet.</div></div></div>
            </div>

            <div class="approval-bar">
              <div><span>ITERATION APPROVAL</span><p>Approval promotes the reduced-motion visual baseline. It does not override release blockers.</p></div>
              <div class="approval-actions"><a class="report-link" id="release-report" href="#" hidden target="_blank" rel="noreferrer">Release report</a><button class="cc-button approve" id="approve-execution" disabled>Approve iteration</button></div>
            </div>
          </section>

          <div class="outputs">
            ${outputCard(1,'Measured browser build','Rendered artifact with performance and accessibility probes')}
            ${outputCard(2,'Release evidence','Responsive · reduced motion · lab vitals · runtime')}
            ${outputCard(3,'Visual baseline','Approved iteration becomes the next regression reference')}
          </div>
        </section>
      </main>

      <form class="command-bar" id="command-form"><input class="command-input" id="command-input" aria-label="Command Center command" autocomplete="off" placeholder="Build, review, refresh or approve this project…"/><span class="command-hint">⌘ K</span><button class="command-submit" aria-label="Run command">↗</button></form>
      <div class="toast" id="toast"><b id="toast-title">Command Center</b><span id="toast-copy"></span></div>
    </div>`;
  setStage('brief');
}

function setStage(id) {
  const stage = stages.find(s => s.id === id) || stages[0];
  const idx = stages.indexOf(stage);
  document.querySelectorAll('.spine-step').forEach(el => el.classList.toggle('active', el.dataset.stage === stage.id));
  document.documentElement.style.setProperty('--stage-progress', `${(idx/(stages.length-1))*100}%`);
  document.querySelector('#phase-chip').textContent = `Current · ${stage.label}`;
  document.querySelector('#panel-stage').textContent = `Live process / ${stage.label}`;
  document.querySelector('#motion-kicker').textContent = stage.kicker;
  document.querySelector('#motion-title').innerHTML = stage.title;
  document.querySelector('#motion-deck').textContent = stage.deck;
  document.querySelector('#motion-stat').innerHTML = stage.stat.map(x=>`${escapeHtml(x)}<br/>`).join('');
  document.querySelector('#motion-panel').dataset.state = stage.id;
}

function toast(title, copy) {
  const el = document.querySelector('#toast');
  document.querySelector('#toast-title').textContent = title;
  document.querySelector('#toast-copy').textContent = copy;
  el.classList.add('show');
  window.setTimeout(() => el.classList.remove('show'), 4200);
}

function setRuntimeStatus(online, label) {
  runtimeOnline = online;
  const pill = document.querySelector('#runtime-pill');
  pill.classList.toggle('offline', !online);
  pill.classList.toggle('online', online);
  document.querySelector('#runtime-label').textContent = label;
  document.querySelector('#run-execution').disabled = !online || ['queued','running'].includes(activeJob?.status);
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

function renderExecution(job) {
  if (!job) return;
  activeJob = job;
  document.querySelector('#job-id').textContent = job.id.toUpperCase();

  const release = job.releaseDecision ?? {};
  const releaseState = document.querySelector('#release-state');
  if (job.status !== 'complete') {
    releaseState.textContent = job.status.toUpperCase();
    releaseState.className = '';
  } else if (release.status === 'ready') {
    releaseState.textContent = 'RELEASE READY';
    releaseState.className = 'release-ready';
  } else if (release.status === 'review') {
    releaseState.textContent = 'RELEASE REVIEW';
    releaseState.className = 'release-review';
  } else {
    releaseState.textContent = 'RELEASE BLOCKED';
    releaseState.className = 'release-blocked';
  }

  for (const step of job.steps ?? []) {
    const el = document.querySelector(`[data-execution-step="${step.id}"]`);
    if (!el) continue;
    el.dataset.status = step.status;
    el.querySelector('i').textContent = step.status;
  }

  const preview = document.querySelector('#live-preview');
  const empty = document.querySelector('#preview-empty');
  if (job.artifacts?.previewUrl) {
    if (preview.src !== job.artifacts.previewUrl) preview.src = job.artifacts.previewUrl;
    preview.hidden = false;
    empty.hidden = true;
  }

  const codes = findingSet(job);
  const browser = job.evidence?.browser;
  setEvidenceMetric(
    'browser',
    browser ? `${browser.passed}/${browser.captures}` : 'UNMEASURED',
    browser ? `${browser.reducedMotionCaptures} reduced-motion` : 'not run',
    browser ? (browser.passed === browser.captures ? 'pass' : 'fail') : 'unmeasured'
  );

  const responsive = job.evidence?.responsive ?? {};
  const responsiveValues = ['mobile','tablet','desktop'].map((id) => responsive[id]?.pass);
  const responsiveMeasured = responsiveValues.some((value) => typeof value === 'boolean');
  const responsivePass = responsiveMeasured && responsiveValues.every((value) => value === true);
  setEvidenceMetric(
    'responsive',
    responsiveMeasured ? metricState(responsivePass) : 'UNMEASURED',
    responsiveMeasured ? ['M','T','D'].map((label,i)=>`${label}:${metricState(responsiveValues[i])}`).join(' · ') : 'not run',
    responsiveMeasured ? (responsivePass ? 'pass' : 'fail') : 'unmeasured'
  );

  const vitals = job.evidence?.webVitals;
  const vitalFailed = hasAny(codes, ['lcp-budget-failed','inp-budget-failed','cls-budget-failed','web-vitals-evidence-missing']);
  setEvidenceMetric(
    'vitals',
    vitals?.measured ? `LCP ${Math.round(vitals.lcpMs)} ms` : 'UNMEASURED',
    vitals?.measured ? `interaction ${Math.round(vitals.inpMs)} ms · CLS ${Number(vitals.cls).toFixed(3)}` : 'LCP · interaction proxy · CLS',
    vitals?.measured ? (vitalFailed ? 'fail' : 'pass') : 'unmeasured'
  );

  const runtime = job.evidence?.runtime;
  const runtimeFailed = hasAny(codes, ['fps-budget-failed','frame-time-budget-failed','long-task-budget-failed','runtime-evidence-missing']);
  setEvidenceMetric(
    'runtime',
    runtime?.measured ? `${runtime.fps} FPS` : 'UNMEASURED',
    runtime?.measured ? `${runtime.maxFrameMs} ms max · ${runtime.longTasks} long tasks${runtime.usedJsHeapMb ? ` · ${runtime.usedJsHeapMb} MB heap` : ''}` : 'FPS · frame · long tasks',
    runtime?.measured ? (runtimeFailed ? 'fail' : 'pass') : 'unmeasured'
  );

  const accessibility = job.evidence?.accessibility;
  const accessibilityFailed = hasAny(codes, ['accessibility-blockers','accessibility-majors','accessibility-evidence-missing']);
  setEvidenceMetric(
    'accessibility',
    accessibility?.measured ? `${accessibility.blockers}B / ${accessibility.majors}M` : 'UNMEASURED',
    accessibility?.measured ? `${accessibility.keyboard?.uniqueVisited ?? 0} focus states · ${Math.round((accessibility.keyboard?.visibleRatio ?? 0) * 100)}% visible focus` : 'semantics · keyboard · focus',
    accessibility?.measured ? (accessibilityFailed ? 'fail' : 'pass') : 'unmeasured'
  );

  const reducedMotion = job.evidence?.reducedMotion;
  setEvidenceMetric(
    'motion',
    reducedMotion?.measured ? metricState(reducedMotion.pass) : 'UNMEASURED',
    reducedMotion?.measured ? `${reducedMotion.continuousAnimations} continuous animations · media ${reducedMotion.mediaQuery ? 'active' : 'missing'}` : 'continuous animation gate',
    reducedMotion?.measured ? (reducedMotion.pass ? 'pass' : 'fail') : 'unmeasured'
  );

  const visual = job.evidence?.visualRegression;
  const visualValue = visual?.status === 'baseline-seed'
    ? 'BASELINE SEED'
    : visual?.measured
      ? metricState(visual.pass)
      : 'UNMEASURED';
  const visualNote = visual?.status === 'baseline-seed'
    ? 'approve iteration to promote baseline'
    : visual?.status === 'compared'
      ? `${((visual.maxChangedRatio ?? 0) * 100).toFixed(2)}% max drift · ${(visual.threshold * 100).toFixed(2)}% limit`
      : 'approved reduced-motion baseline';
  setEvidenceMetric(
    'visual',
    visualValue,
    visualNote,
    visual?.status === 'baseline-seed' ? 'baseline' : visual?.measured ? (visual.pass ? 'pass' : 'fail') : 'unmeasured'
  );

  const bundle = job.evidence?.bundle;
  const bundleFailed = hasAny(codes, ['initial-js-budget-failed','initial-css-budget-failed','bundle-evidence-missing']);
  setEvidenceMetric(
    'bundle',
    bundle?.measured ? `${bundle.initialJsKb} KB JS` : 'UNMEASURED',
    bundle?.measured ? `${bundle.initialCssKb} KB CSS · measured` : 'built asset bytes',
    bundle?.measured ? (bundleFailed ? 'fail' : 'pass') : 'unmeasured'
  );

  const captures = job.artifacts?.captures ?? [];
  document.querySelector('#capture-count').textContent = String(captures.length).padStart(2, '0');
  document.querySelector('#capture-grid').innerHTML = captures.length ? captures.map((capture) => `
    <a class="capture-card ${capture.pass ? 'pass' : 'fail'}" href="${escapeHtml(capture.screenshot)}" target="_blank" rel="noreferrer">
      <img src="${escapeHtml(capture.screenshot)}" alt="${escapeHtml(capture.id)} browser capture" loading="lazy" />
      <div><b>${escapeHtml(capture.viewport?.id ?? 'viewport')}</b><span>${capture.reducedMotion ? 'reduced motion' : 'full motion'}</span><i>${capture.pass ? 'PASS' : 'FAIL'}</i></div>
    </a>`).join('') : '<div class="empty-line">No captures yet.</div>';

  const findings = job.findings ?? [];
  const patches = new Map((job.patches ?? []).map((patch) => [patch.sourceFinding, patch]));
  document.querySelector('#finding-count').textContent = String(findings.length).padStart(2, '0');
  document.querySelector('#finding-list').innerHTML = findings.length ? findings.map((finding) => {
    const patch = patches.get(finding.code);
    return `<article class="finding-item ${escapeHtml(finding.severity)}"><div><span>${escapeHtml(finding.severity)}</span><b>${escapeHtml(finding.code)}</b></div><p>${escapeHtml(finding.message)}</p>${patch ? `<small>PATCH · ${escapeHtml(patch.instruction)}</small>` : ''}</article>`;
  }).join('') : '<div class="empty-line">No findings.</div>';

  const report = document.querySelector('#release-report');
  if (job.artifacts?.reportUrl) {
    report.href = job.artifacts.reportUrl;
    report.hidden = false;
  } else {
    report.hidden = true;
  }

  const approve = document.querySelector('#approve-execution');
  approve.disabled = job.status !== 'complete' || job.approval === 'iteration-approved';
  approve.textContent = job.approval === 'iteration-approved' ? 'Iteration approved' : 'Approve iteration';
  document.querySelector('#run-execution').disabled = !runtimeOnline || ['queued','running'].includes(job.status);
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
  if (!runtimeOnline) return toast('Execution unavailable', 'Run npm run dev so the local execution service starts with the Workroom.');
  try {
    setStage('make');
    const result = await startExecution({ projectId: 'creative-agency', iteration: activeJob?.iteration ? activeJob.iteration + 1 : 0 });
    activeJob = result.job;
    renderExecution(activeJob);
    toast('Measured review started', `${activeJob.id} is building and measuring the current Creative Agency artifact.`);
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
          toast(
            'Measured review complete',
            decision === 'ready'
              ? 'Required release evidence passed. This build is production-ready.'
              : decision === 'review'
                ? 'No blockers remain, but major findings still require review.'
                : 'Release blockers remain visible in the Command Center.'
          );
        } else toast('Execution failed', job.error ?? 'Unknown execution error.');
      }
    } catch (error) { window.clearInterval(pollTimer); toast('Polling stopped', error.message); }
  }, 1100);
}

async function refreshExecution() {
  await checkRuntime();
  if (!activeJob?.id) return;
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
        : 'Creative iteration approved and promoted as the visual baseline. Release blockers are still enforced.'
    );
  } catch (error) { toast('Approval blocked', error.message); }
}

function bind() {
  document.querySelectorAll('.spine-step').forEach(el => el.addEventListener('click', () => setStage(el.dataset.stage)));
  document.querySelector('#run-execution').addEventListener('click', startBuild);
  document.querySelector('#refresh-execution').addEventListener('click', refreshExecution);
  document.querySelector('#approve-execution').addEventListener('click', approveIteration);

  document.addEventListener('pointermove', (e) => {
    document.documentElement.style.setProperty('--mx', `${(e.clientX/window.innerWidth)*100}%`);
    document.documentElement.style.setProperty('--my', `${(e.clientY/window.innerHeight)*100}%`);
  }, { passive: true });

  const form = document.querySelector('#command-form');
  const input = document.querySelector('#command-input');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    input.value = '';
    if (/\b(build|capture|review|measure|run)\b/i.test(value)) return startBuild();
    if (/\bapprove\b/i.test(value)) return approveIteration();
    if (/\b(refresh|status)\b/i.test(value)) return refreshExecution();
    toast('Command routed', 'This slice executes measured build/review/approval actions. Free-form AI source mutation remains intentionally unconnected until its write adapter is auditable.');
  });

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.focus(); }
    if (e.key >= '1' && e.key <= '7' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) setStage(stages[Number(e.key)-1].id);
  });
}

render();
bind();
checkRuntime();
window.setInterval(checkRuntime, 8000);
