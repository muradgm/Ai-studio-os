const stages = [
  { id: 'brief', index: '01', label: 'Brief', kicker: 'Define the real problem', title: 'Start with the <em>brief</em>, not the model.', deck: 'Capture intent, business outcome, audience, constraints, source assets and truth requirements before any creative system starts making.', stat: ['5 constraints', '2 open questions', 'source audit pending'] },
  { id: 'research', index: '02', label: 'Research', kicker: 'Evidence before opinion', title: 'Find the <em>signal</em> before choosing a style.', deck: 'Market context, category pressure, source quality and factual constraints are separated from inspiration so aesthetic preference cannot impersonate evidence.', stat: ['11 sources', '4 competitors', 'confidence 0.82'] },
  { id: 'explore', index: '03', label: 'Explore', kicker: 'Diverge on purpose', title: 'Make alternatives that are <em>actually different</em>.', deck: 'Three to five concept families must change the core mechanism, not just the color, typeface or hero image. Weak directions get killed early.', stat: ['4 directions', '2 killed', '1 challenger'] },
  { id: 'decide', index: '04', label: 'Decide', kicker: 'Independent review', title: 'The Council must earn the <em>decision</em>.', deck: 'Strategy, creative, technical and skeptical reviewers work independently, cross-critique, preserve dissent and expose assumptions before selection.', stat: ['6 reviewers', '2 objections', 'confidence 0.86'] },
  { id: 'make', index: '05', label: 'Make', kicker: 'Production under direction', title: 'Turn the decision into <em>work</em>.', deck: 'Design, image, motion, writing, video and implementation inherit one creative direction. Tools are adapters; the project does not become a model marketplace.', stat: ['8 assets', '3 adapters', 'direction locked'] },
  { id: 'review', index: '06', label: 'Review', kicker: 'Critique the artifact', title: 'Separate taste from <em>failure</em>.', deck: 'Critique, red-team, QA and integrity checks distinguish blockers from majors, minors and taste. Weak assets are patched surgically instead of rerunning the whole project.', stat: ['1 blocker', '3 majors', 'SVG lock active'] },
  { id: 'deliver', index: '07', label: 'Deliver', kicker: 'Ship with evidence', title: 'Leave with the <em>work</em>, not a chat transcript.', deck: 'Approved assets, versions, rights, source evidence, implementation notes and exports are packaged for handoff. The observation loop begins after release.', stat: ['12 outputs', 'rights verified', 'handoff ready'] }
];

const decisions = [
  { title: 'Public name', body: 'The Creative Agency — working name locked; commercial clearance unresolved.', status: 'review' },
  { title: 'Identity symbol', body: 'Bounded Flow v2 / Agency Handoff advances to visual exploration.', status: 'ready' },
  { title: 'Prototype scope', body: 'One Brand / Website journey before exposing the wider OS.', status: 'ready' },
  { title: 'Final SVG master', body: 'Blocked until a visual candidate is explicitly approved.', status: 'blocked' }
];

const evidence = [
  { title: 'Name collision territory', body: 'Exact phrase is descriptive and actively used by agencies.', status: 'review' },
  { title: 'Seven-type logo assessment', body: 'Combination + abstract mark lead the identity system.', status: 'ready' },
  { title: 'Council verdict', body: 'ADVANCE TO PROTOTYPE — confidence 0.86.', status: 'ready' }
];

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
  <article class="output-card" tabindex="0">
    <div class="output-visual"><div class="output-glyph"></div></div>
    <div class="output-body"><div><h4>${title}</h4><p>${note}</p></div><span class="output-number">0${n}</span></div>
  </article>`;

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
        <div class="rail-index">AI Studio OS · v1.2</div>
      </aside>

      <main class="workspace">
        <header class="topbar">
          <div class="brandline"><strong>The Creative Agency</strong><span>Workroom / Project 001</span></div>
          <div class="top-actions"><div class="status-pill"><i class="status-dot"></i> Runtime connected</div><button class="icon-button" aria-label="More options">···</button></div>
        </header>

        <section class="project-head">
          <div><div class="eyebrow">Prototype Slice 01 · Brand / Website</div><h1 class="project-title">Build the agency<br/>that builds the work.</h1><div class="project-meta"><span>Owner <b>Creative Council</b></span><span>Mode <b>Prototype</b></span><span>Engine <b>AI Studio OS v1.2</b></span></div></div>
          <div class="phase-chip" id="phase-chip">Current · Brief</div>
        </section>

        <nav class="project-spine" aria-label="Project stages">
          ${stages.map((s,i)=>`<button class="spine-step ${i===0?'active':''}" data-stage="${s.id}"><small>${s.index}</small><strong>${s.label}</strong></button>`).join('')}
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
            <article class="panel"><div class="panel-head"><div class="panel-label"><span>Council</span></div><div class="panel-count">06 roles</div></div><div class="council-strip"><div class="council-avatars">${['STR','CD','UX','ENG','BR','SK'].map(x=>`<div class="avatar">${x}</div>`).join('')}</div><p><strong>Verdict:</strong> advance one complete project journey. Do not expose the engine as product theater.</p></div></article>
            <article class="panel"><div class="panel-head"><div class="panel-label"><span>Evidence</span></div><div class="panel-count">03</div></div><div class="evidence-list">${evidence.map((d,i)=>row(d,i)).join('')}</div></article>
          </div>

          <div class="outputs">
            ${outputCard(1,'Identity direction','Bounded Flow v2 · visual exploration')}
            ${outputCard(2,'Workroom system','Project spine + accountable gates')}
            ${outputCard(3,'Launch slice','One end-to-end brand / website job')}
          </div>
        </section>
      </main>

      <form class="command-bar" id="command-form"><input class="command-input" id="command-input" autocomplete="off" placeholder="Ask the agency to critique, explore, review or improve…"/><span class="command-hint">⌘ K</span><button class="command-submit" aria-label="Run command">↗</button></form>
      <div class="toast" id="toast"><b>Agency command routed</b><span id="toast-copy"></span></div>
    </div>`;
  setStage('brief');
}

function row(item, i) {
  return `<div class="decision-row"><span class="row-index">0${i+1}</span><div><h4>${item.title}</h4><p>${item.body}</p></div><span class="badge ${item.status}">${item.status}</span></div>`;
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
  document.querySelector('#motion-stat').innerHTML = stage.stat.map(x=>`${x}<br/>`).join('');
  document.querySelector('#motion-panel').dataset.state = stage.id;
}

function bind() {
  document.querySelectorAll('.spine-step').forEach(el => el.addEventListener('click', () => setStage(el.dataset.stage)));
  document.addEventListener('pointermove', (e) => {
    document.documentElement.style.setProperty('--mx', `${(e.clientX/window.innerWidth)*100}%`);
    document.documentElement.style.setProperty('--my', `${(e.clientY/window.innerHeight)*100}%`);
  }, { passive: true });

  const form = document.querySelector('#command-form');
  const input = document.querySelector('#command-input');
  const toast = document.querySelector('#toast');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    document.querySelector('#toast-copy').textContent = `“${value}” → router classified this as a prototype command. Provider execution is intentionally stubbed in Slice 01.`;
    toast.classList.add('show');
    input.value = '';
    window.setTimeout(()=>toast.classList.remove('show'), 4300);
  });

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.focus(); }
    if (e.key >= '1' && e.key <= '7' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) setStage(stages[Number(e.key)-1].id);
  });
}

render();
bind();
