const statuses = {
  build: ['Production build', 'Vite · shell-free'],
  capture: ['Browser capture', 'Chromium · responsive'],
  review: ['Measured review', 'Vitals · a11y · motion'],
  patch: ['Patch queue', 'Auditable findings only'],
  approve: ['Iteration approval', 'Never overrides release gate']
};

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

function queueMarkup() {
  return Object.entries(statuses).map(([id, [title, note]], index) => `
    <div class="concept-queue-row" data-queue-step="${id}" data-state="waiting">
      <span class="concept-queue-index">${String(index + 1).padStart(2, '0')}</span>
      <div><b>${escapeHtml(title)}</b><small>${escapeHtml(note)}</small></div>
      <i>WAITING</i>
    </div>`).join('');
}

function decorateRail() {
  const rail = document.querySelector('.rail');
  if (!rail || rail.dataset.conceptReady) return;
  rail.dataset.conceptReady = 'true';

  const lockup = document.createElement('div');
  lockup.className = 'concept-brand-lockup';
  lockup.innerHTML = '<strong>CA</strong><span>The Creative<br/>Agency</span>';
  rail.prepend(lockup);

  const nav = rail.querySelector('.rail-nav');
  if (nav) {
    const label = document.createElement('div');
    label.className = 'concept-rail-section';
    label.textContent = 'COMMAND';
    nav.before(label);
    nav.querySelectorAll('.rail-button').forEach((button) => {
      const text = document.createElement('span');
      text.className = 'concept-rail-label';
      text.textContent = button.getAttribute('aria-label') === 'Workroom' ? 'Command Center' : button.getAttribute('aria-label');
      button.append(text);
    });
  }
}

function moveActions() {
  const head = document.querySelector('.project-head');
  const actions = document.querySelector('.cc-actions');
  if (!head || !actions || head.querySelector('.concept-project-actions')) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'concept-project-actions';

  const queueButton = document.createElement('button');
  queueButton.className = 'cc-button secondary concept-patch-button';
  queueButton.type = 'button';
  queueButton.textContent = 'Patch Queue';
  queueButton.addEventListener('click', () => document.querySelector('.review-area')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));

  const approve = document.querySelector('#approve-execution');
  if (approve) approve.classList.add('concept-approve-top');

  wrapper.append(...actions.children, queueButton);
  if (approve) wrapper.append(approve);
  head.append(wrapper);
}

function buildConceptLayout() {
  const cc = document.querySelector('#command-center');
  if (!cc || cc.dataset.conceptReady) return;
  cc.dataset.conceptReady = 'true';

  const preview = cc.querySelector('.preview-surface');
  const evidence = cc.querySelector('.evidence-rail');
  const captures = cc.querySelector('.capture-area');
  const review = cc.querySelector('.review-area');
  const spine = cc.querySelector('.execution-spine');
  const approval = cc.querySelector('.approval-bar');
  const outputs = document.querySelector('.outputs');
  const brandKit = document.querySelector('#brand-kit-panel');

  const queue = document.createElement('aside');
  queue.className = 'concept-production-queue';
  queue.innerHTML = `
    <div class="concept-panel-head"><span>PRODUCTION QUEUE</span><b>05</b></div>
    <div class="concept-queue-list">${queueMarkup()}</div>
    <button type="button" class="concept-link" data-scroll-review>View full queue <span>→</span></button>`;
  queue.querySelector('[data-scroll-review]')?.addEventListener('click', () => review?.scrollIntoView({ behavior: 'smooth', block: 'center' }));

  const center = document.createElement('div');
  center.className = 'concept-center-column';

  const outputWrap = document.createElement('section');
  outputWrap.className = 'concept-output-wrap';
  outputWrap.innerHTML = '<div class="concept-panel-head"><span>GENERATED OUTPUTS</span><b>ACTUAL ARTIFACTS</b></div>';
  if (outputs) outputWrap.append(outputs);

  const right = document.createElement('aside');
  right.className = 'concept-right-column';

  const evidenceWrap = document.createElement('section');
  evidenceWrap.className = 'concept-evidence-wrap';
  if (evidence) evidenceWrap.append(evidence);

  const reviewWrap = document.createElement('section');
  reviewWrap.className = 'concept-review-wrap';
  if (review) reviewWrap.append(review);

  const layout = document.createElement('div');
  layout.className = 'concept-command-layout';

  if (preview) center.append(preview);
  center.append(outputWrap);
  if (captures) center.append(captures);
  right.append(evidenceWrap, reviewWrap);
  layout.append(queue, center, right);

  const oldGrid = cc.querySelector('.cc-grid');
  const oldLower = cc.querySelector('.cc-lower');
  oldGrid?.remove();
  oldLower?.remove();

  if (spine) cc.insertBefore(spine, cc.firstChild);
  cc.append(layout);
  if (brandKit) cc.append(brandKit);
  if (approval) cc.append(approval);
}

function syncQueue() {
  const sync = () => {
    document.querySelectorAll('.execution-step').forEach((step) => {
      const id = step.dataset.executionStep;
      const row = document.querySelector(`[data-queue-step="${id}"]`);
      if (!row) return;
      const state = step.dataset.status || 'waiting';
      row.dataset.state = state;
      const status = row.querySelector('i');
      if (status) status.textContent = state.toUpperCase();
    });
  };
  sync();
  const spine = document.querySelector('.execution-spine');
  if (spine) new MutationObserver(sync).observe(spine, { attributes: true, subtree: true, attributeFilter: ['data-status'] });
}

function polishCopy() {
  const brandline = document.querySelector('.brandline');
  if (brandline) brandline.innerHTML = '<span>PROJECT</span><strong>The Creative Agency</strong>';

  const projectTitle = document.querySelector('.project-title');
  if (projectTitle) projectTitle.innerHTML = 'Command Center';

  const eyebrow = document.querySelector('.eyebrow');
  if (eyebrow) eyebrow.textContent = 'LIVE PRODUCTION WORKSPACE';

  const ccHead = document.querySelector('.cc-head');
  if (ccHead) ccHead.querySelector('p')?.replaceChildren(document.createTextNode('Build → capture → measure → review → patch → explicit iteration approval.'));
}

function mount() {
  document.body.classList.add('command-center-concept-v1');
  decorateRail();
  moveActions();
  buildConceptLayout();
  syncQueue();
  polishCopy();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => queueMicrotask(mount), { once: true });
else queueMicrotask(mount);
