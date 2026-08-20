const navLabels = ['Projects', 'Command Center', 'Council', 'Assets', 'Deliveries', 'Memory'];

function decorateNavigation() {
  const rail = document.querySelector('.rail');
  if (!rail || rail.dataset.redesign === 'true') return;
  rail.dataset.redesign = 'true';

  const mark = rail.querySelector('.rail-mark');
  if (mark) {
    mark.innerHTML = '<span class="ca-monogram">CA</span><span class="ca-wordmark">The Creative<br>Agency</span>';
    mark.setAttribute('title', 'The Creative Agency — provisional identity treatment');
  }

  rail.querySelectorAll('.rail-button').forEach((button, index) => {
    const label = navLabels[index] ?? button.getAttribute('aria-label') ?? 'Workspace';
    button.insertAdjacentHTML('beforeend', `<span class="rail-label">${label}</span>`);
    if (label === 'Command Center') button.classList.add('active');
  });

  const system = document.createElement('div');
  system.className = 'rail-system-label';
  system.textContent = 'SYSTEM';
  const nav = rail.querySelector('.rail-nav');
  if (nav) nav.insertAdjacentElement('afterend', system);
}

function decorateProjectHeader() {
  const brandline = document.querySelector('.brandline');
  if (brandline) brandline.innerHTML = '<span class="header-kicker">PROJECT</span><strong>Reframe Campaign</strong><span class="project-star" aria-hidden="true">☆</span>';

  const projectHead = document.querySelector('.project-head');
  if (projectHead) {
    const title = projectHead.querySelector('.project-title');
    const eyebrow = projectHead.querySelector('.eyebrow');
    const meta = projectHead.querySelector('.project-meta');
    const chip = projectHead.querySelector('.phase-chip');
    if (eyebrow) eyebrow.textContent = 'PIPELINE STAGE';
    if (title) title.innerHTML = 'Make <small><i></i> In Progress</small>';
    if (meta) meta.hidden = true;
    if (chip) chip.hidden = true;
  }

  const actions = document.querySelector('.top-actions');
  if (actions && !actions.querySelector('.concept-actions')) {
    actions.insertAdjacentHTML('beforeend', `<div class="concept-actions">
      <button type="button" data-command-action="build">⌁ <span>Build</span></button>
      <button type="button" data-command-action="review">▷ <span>Run Review</span></button>
      <button type="button" data-command-action="patch">⌘ <span>Patch Queue</span></button>
      <button type="button" class="approve-concept" data-command-action="approve">✓ <span>Approve Iteration</span></button>
    </div>`);
  }
}

function decorateCommandCenter() {
  const cc = document.querySelector('#command-center');
  if (!cc || cc.dataset.redesign === 'true') return;
  cc.dataset.redesign = 'true';

  const label = cc.querySelector('.cc-head .panel-label span');
  if (label) label.textContent = 'LIVE PREVIEW · HERO · V12';

  const previewHead = cc.querySelector('.preview-surface .surface-head span');
  if (previewHead) previewHead.textContent = 'LIVE PREVIEW';

  const evidenceHead = cc.querySelector('.evidence-rail .surface-head span');
  if (evidenceHead) evidenceHead.textContent = 'EVIDENCE & RELEASE STATUS';

  const run = document.querySelector('#run-execution');
  if (run) run.textContent = 'Run Review';
  const refresh = document.querySelector('#refresh-execution');
  if (refresh) refresh.textContent = 'Build';

  const approve = document.querySelector('#approve-execution');
  if (approve) approve.textContent = 'Approve Iteration';
}

function wireConceptActions() {
  document.querySelector('[data-command-action="build"]')?.addEventListener('click', () => document.querySelector('#refresh-execution')?.click());
  document.querySelector('[data-command-action="review"]')?.addEventListener('click', () => document.querySelector('#run-execution')?.click());
  document.querySelector('[data-command-action="approve"]')?.addEventListener('click', () => document.querySelector('#approve-execution')?.click());
  document.querySelector('[data-command-action="patch"]')?.addEventListener('click', () => document.querySelector('.finding-list')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
}

function applyRedesign() {
  document.documentElement.classList.add('command-center-redesign');
  decorateNavigation();
  decorateProjectHeader();
  decorateCommandCenter();
  wireConceptActions();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyRedesign, { once: true });
else queueMicrotask(applyRedesign);
