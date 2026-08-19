# AI Studio OS v1.3 — Creative Engineering Runtime

v1.3 closes the gap between **creative direction** and a **measured running browser artifact**. It is an upgrade to the existing five-epoch core, not a sixth epoch.

## Purpose

Earlier versions could research, direct, design, route tools, produce assets, review work, and build conventional prototypes. The missing production layer was creative engineering: realtime web implementation, deterministic motion, 3D asset preparation, actual browser observation, iterative patching, and delivery gates.

v1.3 adds that layer.

## Runtime flow

```text
APPROVED CREATIVE DIRECTION
        ↓
CREATIVE ENGINEERING PLAN
        ↓
STATIC / SEMANTIC BASELINE
        ↓
MOTION / RIVE / REALTIME 3D AS JUSTIFIED
        ↓
3D ASSET PIPELINE WHEN REQUIRED
        ↓
RUNNING BROWSER ARTIFACT
        ↓
PLAYWRIGHT CAPTURE
 desktop / tablet / mobile
 full motion / reduced motion
        ↓
INDEPENDENT REVIEWS
 creative development
 WebGL
 responsive motion
 performance
 accessibility
        ↓
CAPPED PATCH LOOP ↺
        ↓
DELIVERY GATES
        ↓
RELEASE
```

## Specialist catalog added

### Roles
- `creative-developer`
- `realtime-webgl-engineer`
- `motion-engineer`
- `three-d-technical-artist`

### Tasks
- `webgl-scene-construction`
- `three-d-asset-optimization`
- `responsive-immersive-adaptation`

### Independent reviews
- `creative-development-review`
- `webgl-review`
- `performance-budget-review`
- `accessibility-delivery-review`
- `responsive-motion-review`

### Recipes
- `immersive-brand-site-recipe`
- `cinematic-product-page-recipe`
- `interactive-world-recipe`

## Runtime modules

`modules/creative-engineering/`

- `web-stack.mjs` — capability-driven Three.js / GSAP / Rive / Playwright stack manifest
- `runtime.mjs` — execution plan, delivery budgets/gates, capped patch queue
- `browser-loop.mjs` — Playwright capture plans and real browser evidence
- `realtime-spec.mjs` — realtime scene, Rive, and motion-engineering contracts
- `blender-adapter.mjs` — deterministic shell-free Blender CLI job contract and 3D asset manifest

## Production stack policy

Three.js, GSAP, and Rive are optional capabilities. A normal page must not become an immersive page because the libraries exist. Playwright is required for v1.3 production observation.

Renderer policy for realtime 3D is **WebGPU preferred when useful, WebGL2 fallback**, with a non-realtime fallback for essential experience/content where required.

## Delivery budgets

The runtime starts with explicit default gates for:
- LCP / INP / CLS
- FPS / frame time / long tasks
- initial JS / CSS budgets
- accessibility blocker/major counts
- required mobile / tablet / desktop evidence

Projects may tighten budgets. A project may not silently relax them after failure simply to obtain a pass.

## Browser observation

`npm run test:browser-runtime` launches real headless Chromium through Playwright, emulates a mobile viewport plus reduced-motion preference, inspects DOM state, and writes a screenshot artifact.

CI installs Chromium and runs this smoke gate so browser execution is validated on the exact PR head.

## 3D asset production

Blender is treated as an external executable adapter, not assumed infrastructure. Jobs contain explicit source `.blend`, processing `.py`, output directory, and format. The adapter uses `spawn(..., { shell: false })` and fails closed when Blender is unavailable or the job exits unsuccessfully.

The 3D Technical Artist owns source normalization, LODs, baking, material/texture strategy, export, provenance, and runtime derivatives. The Realtime WebGL Engineer owns the browser budget and rendering consequences.

## Truth boundary

v1.3 makes the web-production pipeline materially more executable, but it does not make every DCC/VFX tool magically present on a machine. Blender/Houdini-style production still requires the corresponding external executable/provider and source assets. The OS must report missing infrastructure rather than pretending a render occurred.

## Commands

```bash
npm install
npm test
npm run build:web
npm run build:creative-engineering
npx playwright install chromium
npm run test:browser-runtime
```

## Release definition

An immersive or cinematic build is not production-ready because it looks good. It must have:
- an approved direction;
- a running browser artifact;
- required viewport and reduced-motion evidence;
- no blocking WebGL/accessibility/responsive findings;
- no unresolved major delivery-budget finding;
- a traceable asset/provenance state;
- a completed independent review and patch loop.
