import './brand-kit-panel.css';

const required = [
  ['strategy', 'Strategy'],
  ['creative-direction', 'Direction'],
  ['logo', 'Logo system'],
  ['color', 'Color'],
  ['typography', 'Typography'],
  ['icon-system', 'Personalized icons'],
  ['guidelines', 'Guidelines']
];

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
const approved = (status) => ['approved', 'frozen'].includes(status);

function stateForCategory(manifest, category) {
  const candidates = (manifest?.assets ?? []).filter((asset) => asset.category === category);
  if (!candidates.length) return { state: 'waiting', label: 'NOT RUN', note: 'no produced artifact' };
  const ready = candidates.find((asset) => approved(asset.status) && asset.artifactRef);
  if (!ready) return { state: 'review', label: 'REVIEW', note: 'artifact exists but is not approved' };
  if (category === 'icon-system') {
    const metadata = ready.metadata ?? {};
    const personalized = metadata.personalized === true && metadata.iconDNA && Number(metadata.calibrationCount ?? 0) >= 5;
    return personalized
      ? { state: 'ready', label: 'PERSONALIZED', note: `${metadata.calibrationCount} calibration · ${metadata.svgMasterCount ?? 0} SVG masters` }
      : { state: 'blocked', label: 'BLOCKED', note: 'Icon DNA / calibration evidence incomplete' };
  }
  return { state: 'ready', label: String(ready.status).toUpperCase(), note: ready.name ?? ready.id };
}

function summary(manifest, review) {
  if (!manifest) return {
    label: 'NOT RUN', state: 'waiting', dna: 'UNBOUND', detail: 'The production contract is active. No Brand Kit manifest has been emitted for this project yet.'
  };
  const status = review?.status ?? manifest.status ?? 'review';
  return {
    label: status === 'ready' ? 'DELIVERY READY' : status === 'blocked' ? 'BLOCKED' : 'IN REVIEW',
    state: status === 'ready' ? 'ready' : status === 'blocked' ? 'blocked' : 'review',
    dna: manifest.brandDnaVersion ? `DNA ${manifest.brandDnaVersion}` : 'DNA UNVERSIONED',
    detail: review
      ? `${review.counts?.requiredCategoriesPresent ?? 0}/${review.requiredCategories?.length ?? 7} required systems · ${review.counts?.approvedApplications ?? 0} approved applications`
      : 'Manifest received; independent delivery review has not been attached.'
  };
}

function markup(manifest = null, review = null) {
  const headline = summary(manifest, review);
  const rows = required.map(([id, label], index) => {
    const status = manifest ? stateForCategory(manifest, id) : { state: 'waiting', label: 'NOT RUN', note: 'awaiting production' };
    return `<div class="bk-system" data-state="${status.state}"><span>${String(index + 1).padStart(2, '0')}</span><div><b>${label}</b><small>${escapeHtml(status.note)}</small></div><i>${escapeHtml(status.label)}</i></div>`;
  }).join('');
  const legal = manifest?.legal?.trademarkStatus ?? 'unresolved';
  const applications = manifest?.applications?.filter((item) => approved(item.status)).length ?? 0;

  return `
    <section class="brand-kit-panel panel" id="brand-kit-panel" data-state="${headline.state}">
      <div class="bk-head">
        <div>
          <div class="panel-label"><i></i><span>Brand Identity Kit / Production System</span></div>
          <h3>One Brand DNA. Every artifact accountable.</h3>
          <p>Strategy, logo, personalized icons, type, color, imagery, motion, voice and applications inherit one versioned identity contract.</p>
        </div>
        <div class="bk-verdict"><small>${escapeHtml(headline.dna)}</small><strong>${escapeHtml(headline.label)}</strong></div>
      </div>
      <div class="bk-body">
        <div class="bk-systems">${rows}</div>
        <aside class="bk-contract">
          <span>PRODUCTION CONTRACT</span>
          <b>brand-identity-kit-recipe</b>
          <p>${escapeHtml(headline.detail)}</p>
          <dl>
            <div><dt>Icon family</dt><dd>Brand-derived · 5–8 calibration first</dd></div>
            <div><dt>Applications</dt><dd>${applications || '≥ 2 required'}</dd></div>
            <div><dt>Legal</dt><dd>${escapeHtml(String(legal).toUpperCase())}</dd></div>
            <div><dt>Fonts</dt><dd>references + rights; no assumed redistribution</dd></div>
          </dl>
        </aside>
      </div>
      <div class="bk-foot"><span>Identity formation → Logo subsystem → Icon subsystem → System proof → Independent kit review → Manifest / delivery</span><b>No placeholder assets count as complete.</b></div>
    </section>`;
}

export function renderBrandKitPanel(manifest = null, review = null) {
  const current = document.querySelector('#brand-kit-panel');
  if (current) {
    current.outerHTML = markup(manifest, review);
    return;
  }
  const anchor = document.querySelector('.outputs');
  if (anchor) anchor.insertAdjacentHTML('beforebegin', markup(manifest, review));
}

function mount() {
  renderBrandKitPanel();
  window.addEventListener('brand-kit:manifest', (event) => {
    const detail = event.detail ?? {};
    renderBrandKitPanel(detail.manifest ?? null, detail.review ?? null);
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
else queueMicrotask(mount);
