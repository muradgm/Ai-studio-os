import './styles.css';

const app = document.querySelector('#app');

app.innerHTML = `
  <div class="site-shell">
    <header class="topbar">
      <a class="brand" href="#top" aria-label="TraderFrame home">
        <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <span>TraderFrame</span>
      </a>
      <nav class="nav" aria-label="Primary navigation">
        <a href="#system">System</a>
        <a href="#workspace">Workspace</a>
        <a href="#motion">Motion</a>
      </nav>
      <button class="nav-cta" data-scroll="#workspace">View workspace</button>
    </header>

    <main>
      <section class="hero" id="top">
        <canvas id="market-field" aria-hidden="true"></canvas>
        <div class="hero-grid" aria-hidden="true"></div>
        <div class="hero-frame" aria-hidden="true">
          <span class="corner c1"></span><span class="corner c2"></span><span class="corner c3"></span><span class="corner c4"></span>
          <div class="frame-label"><span>FRAME / ACTIVE</span><b>01</b></div>
        </div>

        <div class="hero-copy">
          <div class="eyebrow">MARKET STRUCTURE / DIRECTION 02</div>
          <h1>Frame the<br />market.</h1>
          <p>A focused trading workspace built around context, structure, and decision clarity.</p>
          <div class="hero-actions">
            <button class="button primary" data-scroll="#workspace">View the workspace</button>
            <button class="button ghost" data-scroll="#system">See the system</button>
          </div>
        </div>

        <div class="hero-status" aria-label="Prototype status">
          <span>CONCEPT PROTOTYPE</span>
          <span>NOT LIVE DATA</span>
        </div>
      </section>

      <section class="sequence section" id="system">
        <div class="section-meta"><span>01</span><span>THE SYSTEM</span></div>
        <div class="sequence-list">
          <article class="sequence-row" data-stage="noise">
            <span class="mono">RAW FIELD</span>
            <h2>Noise</h2>
            <p>Movement exists before meaning. The interface should not pretend every change deserves attention.</p>
          </article>
          <article class="sequence-row active" data-stage="structure">
            <span class="mono">FRAME / LOCK</span>
            <h2>Structure</h2>
            <p>Framing creates context. Relationships sharpen; irrelevant motion recedes.</p>
          </article>
          <article class="sequence-row" data-stage="decision">
            <span class="mono">EVENT / 01</span>
            <h2>Decision</h2>
            <p>Vermilion appears only when something changes enough to earn priority.</p>
          </article>
        </div>
      </section>

      <section class="workspace section" id="workspace">
        <div class="section-head">
          <div class="section-meta"><span>02</span><span>THE WORKSPACE</span></div>
          <div>
            <h2>Information first.<br />Spectacle second.</h2>
            <p>The cinematic frame resolves into a flatter product surface. This UI is illustrative and intentionally avoids unverified feature claims.</p>
          </div>
        </div>

        <div class="terminal" role="img" aria-label="Illustrative TraderFrame concept workspace, not live market data">
          <div class="terminal-bar">
            <div class="terminal-brand">TRADERFRAME / CONCEPT UI</div>
            <div class="terminal-state"><span></span> NOT LIVE DATA</div>
          </div>
          <div class="terminal-body">
            <aside class="watch-panel">
              <div class="panel-title">CONTEXT</div>
              <button class="ticker active"><span>INDEX / A</span><b>4,812.6</b><i>+0.42%</i></button>
              <button class="ticker"><span>INDEX / B</span><b>17,406</b><i>+0.18%</i></button>
              <button class="ticker"><span>PAIR / C</span><b>1.0914</b><i>-0.07%</i></button>
              <div class="micro-note">Illustrative values only</div>
            </aside>

            <div class="chart-panel">
              <div class="chart-topline">
                <div><span class="mono">STRUCTURE / 4H</span><strong>INDEX / A</strong></div>
                <div class="chart-values"><span>RANGE</span><b>4,812.6</b></div>
              </div>
              <svg class="concept-chart" viewBox="0 0 900 440" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="fillLine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#F0EAE0" stop-opacity="0.09"/>
                    <stop offset="100%" stop-color="#F0EAE0" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <g class="grid-lines">
                  <path d="M0 70H900M0 150H900M0 230H900M0 310H900M0 390H900" />
                  <path d="M120 0V440M300 0V440M480 0V440M660 0V440M840 0V440" />
                </g>
                <path class="area" d="M0 330 C70 320,100 270,165 292 S275 232,332 250 S430 205,495 218 S600 176,655 196 S760 130,820 142 S870 112,900 98 L900 440 L0 440Z" />
                <path class="price-line" d="M0 330 C70 320,100 270,165 292 S275 232,332 250 S430 205,495 218 S600 176,655 196 S760 130,820 142 S870 112,900 98" />
                <path class="signal-line" d="M655 196 C700 184,750 138,820 142" />
                <line class="frame-level" x1="655" x2="655" y1="54" y2="385" />
                <circle class="signal-dot" cx="820" cy="142" r="5" />
              </svg>
              <div class="chart-annotation"><span>FRAME EVENT</span><b>Structure changed</b></div>
            </div>

            <aside class="state-panel">
              <div class="panel-title">FRAME STATE</div>
              <div class="state-block"><span>CONTEXT</span><b>VISIBLE</b></div>
              <div class="state-block"><span>STRUCTURE</span><b>FOCUSED</b></div>
              <div class="state-block signal"><span>CHANGE</span><b>ACTIVE</b></div>
              <div class="state-rule"></div>
              <p>Use red for the event, not the entire interface.</p>
            </aside>
          </div>
        </div>
      </section>

      <section class="principles section">
        <div class="section-meta"><span>03</span><span>INTERFACE PRINCIPLES</span></div>
        <div class="principle-grid">
          <article><span class="mono">01</span><h3>Keep context on screen.</h3><p>Focus should reduce noise without erasing the surrounding state that gives a move meaning.</p></article>
          <article><span class="mono">02</span><h3>Promote change, not chrome.</h3><p>The interface stays quiet until information changes enough to deserve hierarchy.</p></article>
          <article><span class="mono">03</span><h3>Motion explains state.</h3><p>Transitions show acquisition, focus, and resolution. They do not run simply to make the product feel advanced.</p></article>
        </div>
      </section>

      <section class="motion section" id="motion">
        <div class="motion-copy">
          <div class="section-meta"><span>04</span><span>MOTION BEHAVIOR</span></div>
          <h2>Move only when<br />the state changes.</h2>
          <p>The signature sequence has an end: ambient field → frame acquire → resolve → signal event → UI settle → idle.</p>
        </div>
        <div class="motion-diagram" aria-label="Motion state sequence">
          <div class="motion-state"><span>01</span><b>AMBIENT</b><i></i></div>
          <div class="motion-state"><span>02</span><b>ACQUIRE</b><i></i></div>
          <div class="motion-state active"><span>03</span><b>RESOLVE</b><i></i></div>
          <div class="motion-state"><span>04</span><b>EVENT</b><i></i></div>
          <div class="motion-state"><span>05</span><b>IDLE</b><i></i></div>
        </div>
      </section>

      <section class="closing section">
        <span class="mono">TRADERFRAME / REAL PROJECT RUN 001</span>
        <h2>Enter the frame.</h2>
        <p>This prototype validates a creative direction. Product capabilities, market coverage, pricing, and performance claims remain intentionally unresolved.</p>
        <button class="button primary" data-scroll="#top">Replay direction</button>
      </section>
    </main>
  </div>
`;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

for (const trigger of document.querySelectorAll('[data-scroll]')) {
  trigger.addEventListener('click', () => {
    document.querySelector(trigger.dataset.scroll)?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start'
    });
  });
}

const canvas = document.querySelector('#market-field');
const ctx = canvas.getContext('2d');
const hero = document.querySelector('.hero');
const heroFrame = document.querySelector('.hero-frame');
let width = 0;
let height = 0;
let dpr = 1;
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
let raf = 0;

const palette = {
  black: '#12100F',
  paper: '#F0EAE0',
  vermilion: '#E54832',
  steel: '#6C7772',
  graphite: '#272A26'
};

function resizeCanvas() {
  const rect = hero.getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = Math.max(1, Math.floor(rect.width));
  height = Math.max(1, Math.floor(rect.height));
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function frameRect() {
  const mobile = width < 760;
  const w = mobile ? width * 0.74 : Math.min(540, width * 0.39);
  const h = mobile ? height * 0.27 : Math.min(390, height * 0.48);
  const baseX = mobile ? width * 0.13 : width * 0.54;
  const baseY = mobile ? height * 0.49 : height * 0.25;
  const driftX = reducedMotion ? 0 : mouseX * 12;
  const driftY = reducedMotion ? 0 : mouseY * 8;
  return { x: baseX + driftX, y: baseY + driftY, w, h };
}

function marketY(x, time) {
  const normalized = x / Math.max(width, 1);
  const trend = height * (0.67 - normalized * 0.22);
  const waveA = Math.sin(normalized * 22 + time * 0.00045) * height * 0.028;
  const waveB = Math.sin(normalized * 48 - time * 0.0002) * height * 0.012;
  return trend + waveA + waveB;
}

function drawPerspectiveGrid() {
  const horizon = height * 0.38;
  ctx.save();
  ctx.strokeStyle = 'rgba(108,119,114,0.12)';
  ctx.lineWidth = 1;
  for (let i = -8; i <= 8; i += 1) {
    const topX = width / 2 + i * width * 0.035;
    const bottomX = width / 2 + i * width * 0.14;
    ctx.beginPath();
    ctx.moveTo(topX, horizon);
    ctx.lineTo(bottomX, height * 1.04);
    ctx.stroke();
  }
  for (let i = 0; i < 9; i += 1) {
    const p = i / 8;
    const y = horizon + Math.pow(p, 1.75) * (height - horizon);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function traceMarket(time, strokeStyle, lineWidth) {
  ctx.beginPath();
  const step = Math.max(8, width / 150);
  for (let x = -step; x <= width + step; x += step) {
    const y = marketY(x, time);
    if (x < 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawCandles(time, opacity, clip = false) {
  const frame = frameRect();
  ctx.save();
  if (clip) {
    ctx.beginPath();
    ctx.rect(frame.x, frame.y, frame.w, frame.h);
    ctx.clip();
  }
  const count = width < 760 ? 24 : 46;
  for (let i = 0; i < count; i += 1) {
    const x = (i / (count - 1)) * width;
    const y = marketY(x, time);
    const pulse = Math.sin(i * 1.7 + time * 0.0007);
    const body = 7 + Math.abs(pulse) * 13;
    const wick = body + 10 + Math.abs(Math.cos(i * 0.63)) * 15;
    const signal = x > frame.x + frame.w * 0.64 && x < frame.x + frame.w * 0.82 && clip;
    ctx.strokeStyle = signal ? `rgba(229,72,50,${Math.min(0.9, opacity + 0.4)})` : `rgba(240,234,224,${opacity})`;
    ctx.fillStyle = signal ? `rgba(229,72,50,${Math.min(0.78, opacity + 0.32)})` : `rgba(240,234,224,${opacity * 0.72})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - wick / 2);
    ctx.lineTo(x, y + wick / 2);
    ctx.stroke();
    ctx.fillRect(x - 2, y - body / 2, 4, body);
  }
  ctx.restore();
}

function drawFrameResolution(time) {
  const frame = frameRect();
  ctx.save();
  ctx.beginPath();
  ctx.rect(frame.x, frame.y, frame.w, frame.h);
  ctx.clip();
  ctx.fillStyle = 'rgba(240,234,224,0.015)';
  ctx.fillRect(frame.x, frame.y, frame.w, frame.h);
  traceMarket(time, 'rgba(240,234,224,0.88)', 1.7);
  drawCandles(time, 0.42, true);
  const signalStart = frame.x + frame.w * 0.64;
  const signalEnd = frame.x + frame.w * 0.82;
  ctx.beginPath();
  const step = 5;
  for (let x = signalStart; x <= signalEnd; x += step) {
    const y = marketY(x, time);
    if (x === signalStart) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = palette.vermilion;
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.restore();
}

function render(time = 0) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = palette.black;
  ctx.fillRect(0, 0, width, height);
  drawPerspectiveGrid();
  traceMarket(time, 'rgba(108,119,114,0.28)', 1.1);
  drawCandles(time, 0.12, false);
  drawFrameResolution(time);

  const frame = frameRect();
  heroFrame.style.width = `${frame.w}px`;
  heroFrame.style.height = `${frame.h}px`;
  heroFrame.style.transform = `translate3d(${frame.x}px, ${frame.y}px, 0)`;

  if (!reducedMotion) raf = requestAnimationFrame(render);
}

function onPointerMove(event) {
  if (reducedMotion) return;
  const rect = hero.getBoundingClientRect();
  targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
  targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
}

function easePointer() {
  mouseX += (targetX - mouseX) * 0.06;
  mouseY += (targetY - mouseY) * 0.06;
  if (!reducedMotion) requestAnimationFrame(easePointer);
}

hero.addEventListener('pointermove', onPointerMove, { passive: true });
window.addEventListener('resize', () => {
  resizeCanvas();
  if (reducedMotion) render(0);
});

resizeCanvas();
render(0);
if (!reducedMotion) easePointer();

const rows = [...document.querySelectorAll('.sequence-row')];
const rowObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    rows.forEach((row) => row.classList.toggle('active', row === entry.target));
  }
}, { threshold: 0.58 });
rows.forEach((row) => rowObserver.observe(row));

const motionStates = [...document.querySelectorAll('.motion-state')];
if (!reducedMotion) {
  let motionIndex = 0;
  window.setInterval(() => {
    motionStates.forEach((state, index) => state.classList.toggle('active', index === motionIndex));
    motionIndex = (motionIndex + 1) % motionStates.length;
  }, 1300);
}

window.addEventListener('pagehide', () => cancelAnimationFrame(raf));
