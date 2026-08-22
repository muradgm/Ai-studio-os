const navLabels = ['Projects', 'Command Center', 'Council', 'Assets', 'Deliveries', 'Memory'];

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));

function decorateNavigation() {
  const rail = document.querySelector('.rail');
  if (!rail || rail.dataset.fidelity === 'true') return;
  rail.dataset.fidelity = 'true';

  const mark = rail.querySelector('.rail-mark');
  if (mark) {
    mark.innerHTML = '<span class="ca-monogram">CA</span><span class="ca-wordmark">The Creative<br>Agency</span>';
    mark.setAttribute('title', 'The Creative Agency — provisional identity treatment');
  }

  rail.querySelectorAll('.rail-button').forEach((button, index) => {
    const label = navLabels[index] ?? button.getAttribute('aria-label') ?? 'Workspace';
    button.querySelector('.rail-label')?.remove();
    button.insertAdjacentHTML('beforeend', `<span class="rail-label">${escapeHtml(label)}</span>`);
    button.classList.toggle('active', label === 'Command Center');
  });

  rail.querySelector('.rail-system-label')?.remove();
  const system = document.createElement('div');
  system.className = 'rail-system-label';
  system.textContent = 'SYSTEM';
  rail.querySelector('.rail-nav')?.insertAdjacentElement('afterend', system);
}

function conceptActions() {
  return `<div class="approved-actions" aria-label="Command Center actions">
    <button type="button" data-command-action="build"><span class="action-icon">⌁</span>Build</button>
    <button type="button" data-command-action="review"><span class="action-icon">▷</span>Run Review</button>
    <button type="button" data-command-action="patch"><span class="action-icon">⌘</span>Patch Queue</button>
    <button type="button" class="approved-primary" data-command-action="approve"><span class="action-icon">✓</span>Approve Iteration</button>
  </div>`;
}

function queueMarkup() {
  const labels = [
    ['build', 'Build Production', 'Production artifact'],
    ['capture', 'Browser Capture', 'Responsive evidence'],
    ['review', 'Review Evidence', 'Independent gates'],
    ['patch', 'Patch Queue', 'Auditable findings'],
    ['approve', 'Approve Iteration', 'Human decision']
  ];
  return labels.map(([id, title, note], index) => `<div class="approved-queue-item" data-queue-step="${id}" data-state="waiting">
    <span class="queue-index">0${index + 1}</span>
    <span class="queue-status-dot" aria-hidden="true"></span>
    <div><strong>${title}</strong><small>${note}</small></div>
    <b>WAITING</b>
  </div>`).join('');
}

function syncQueue() {
  document.querySelectorAll('#execution-spine .execution-step').forEach((step) => {
    const id = step.dataset.executionStep;
    const target = document.querySelector(`[data-queue-step="${id}"]`);
    if (!target) return;
    const state = step.dataset.status || 'waiting';
    const label = step.querySelector('i')?.textContent?.trim() || state;
    target.dataset.state = state;
    const verdict = target.querySelector('b');
    if (verdict) verdict.textContent = label.toUpperCase();
  });
}

function syncReviewCount() {
  const count = document.querySelectorAll('.approved-review-list .finding-item').length;
  const node = document.querySelector('#approved-review-count');
  if (node) node.textContent = String(count).padStart(2, '0');
}

function buildApprovedShell() {
  const workspace = document.querySelector('.workspace');
  if (!workspace || document.querySelector('.approved-command-shell')) return;

  const oldTopbar = workspace.querySelector('.topbar');
  const oldProjectHead = workspace.querySelector('.project-head');
  const projectSpine = workspace.querySelector('.project-spine');
  const oldWorkGrid = workspace.querySelector('.work-grid');
  const commandCenter = workspace.querySelector('#command-center');
  const preview = commandCenter?.querySelector('.preview-surface');
  const evidence = commandCenter?.querySelector('.evidence-rail');
  const captureArea = commandCenter?.querySelector('.capture-area');
  const findingList = commandCenter?.querySelector('.finding-list');
  const executionSpine = commandCenter?.querySelector('#execution-spine');
  const runtimePill = oldTopbar?.querySelector('#runtime-pill');

  if (!projectSpine || !commandCenter || !preview || !evidence || !captureArea || !findingList || !executionSpine) return;

  const shell = document.createElement('section');
  shell.className = 'approved-command-shell';
  shell.innerHTML = `
    <header class="approved-header">
      <div class="approved-project">
        <span>PROJECT</span>
        <div><h1>Reframe Campaign</h1><i aria-hidden="true">☆</i></div>
      </div>
      <div class="approved-stage">
        <span>PIPELINE STAGE</span>
        <div><h2>Make</h2><small><i></i>In Progress</small></div>
      </div>
      ${conceptActions()}
    </header>
    <div class="approved-pipeline"></div>
    <div class="approved-main-grid">
      <section class="approved-panel approved-queue">
        <header><span>PRODUCTION QUEUE</span><b>05</b><i>•••</i></header>
        <div class="approved-queue-list">${queueMarkup()}</div>
        <footer>Execution state mirrors the measured runtime.</footer>
      </section>
      <section class="approved-panel approved-preview"></section>
      <aside class="approved-right-rail">
        <section class="approved-panel approved-evidence"></section>
        <section class="approved-panel approved-review">
          <header><span>REVIEW & CRITIQUE</span><b id="approved-review-count">00</b><i>•••</i></header>
          <div class="approved-review-list"></div>
          <footer>Only measured findings and review evidence appear here.</footer>
        </section>
      </aside>
      <section class="approved-panel approved-outputs"></section>
    </div>
    <footer class="approved-utility">
      <div class="utility-version"><button type="button">v1.3 <span>⌄</span></button><span>Measured production workspace</span></div>
      <div class="utility-runtime"></div>
      <div class="utility-links"><span>Project Memory</span><span>Team</span><button type="button" aria-label="Open project messages">•••</button></div>
    </footer>`;

  workspace.prepend(shell);

  shell.querySelector('.approved-pipeline').append(projectSpine);
  shell.querySelector('.approved-preview').append(preview);
  shell.querySelector('.approved-evidence').append(evidence);
  shell.querySelector('.approved-review-list').append(findingList);
  shell.querySelector('.approved-outputs').append(captureArea);
  if (runtimePill) shell.querySelector('.utility-runtime').append(runtimePill);

  oldTopbar?.classList.add('legacy-command-surface');
  oldProjectHead?.classList.add('legacy-command-surface');
  oldWorkGrid?.classList.add('legacy-command-surface');
  document.querySelector('.command-bar')?.classList.add('legacy-command-surface');
  document.querySelector('#brand-kit-panel')?.classList.add('secondary-workspace-surface');

  const observer = new MutationObserver(() => {
    syncQueue();
    syncReviewCount();
  });
  observer.observe(executionSpine, { subtree: true, attributes: true, childList: true, characterData: true });
  observer.observe(findingList, { subtree: true, childList: true });

  syncQueue();
  syncReviewCount();
}

function wireActions() {
  document.querySelector('[data-command-action="build"]')?.addEventListener('click', () => document.querySelector('#refresh-execution')?.click());
  document.querySelector('[data-command-action="review"]')?.addEventListener('click', () => document.querySelector('#run-execution')?.click());
  document.querySelector('[data-command-action="approve"]')?.addEventListener('click', () => document.querySelector('#approve-execution')?.click());
  document.querySelector('[data-command-action="patch"]')?.addEventListener('click', () => document.querySelector('.approved-review')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
}

function applyRedesign() {
  document.documentElement.classList.add('command-center-redesign', 'command-center-fidelity');
  decorateNavigation();
  buildApprovedShell();
  wireActions();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyRedesign, { once: true });
else queueMicrotask(applyRedesign);
