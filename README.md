# AI Studio OS

AI Studio OS is a modular operating system for AI-assisted product, creative, engineering, multimodal production, creative engineering, brand-system production, and outcome-learning work.

The five-epoch core remains frozen as the **v1 baseline**. **v1.1 — Creative Production Upgrade** strengthened the bridge from creative judgment to tool/asset production. **v1.2 — Logo Identity Upgrade** added geometry-locked identity production. **v1.3 — Creative Engineering Runtime** adds the execution and measurement layer required to turn approved creative direction into observed, release-gated browser artifacts.

## Current baseline

**AI Studio OS v1.3.2 — Creative Engineering Runtime + measured Command Center + Brand Identity Kit production**

v1.3 adds:

- Creative Developer, Realtime WebGL Engineer, Motion Engineer, and 3D Technical Artist roles
- independent Creative Development, WebGL, Performance, Accessibility, and Responsive Motion reviews
- immersive brand-site, cinematic product-page, and interactive-world recipes
- capability-driven Three.js / GSAP / Rive runtime planning
- Playwright-based desktop/tablet/mobile and reduced-motion browser capture
- a real headless-Chromium CI smoke gate
- WebGPU-preferred / WebGL2-fallback realtime scene contracts where justified
- deterministic Blender CLI adapter contracts and web-3D asset manifests
- explicit LCP/interaction/CLS, runtime, bundle, accessibility, responsive and reduced-motion delivery budgets
- capped evidence-driven patch loops rather than one-shot implementation
- a production fixture that bundles Three.js, GSAP, and Rive together
- a first-class `studio creative-engineering` command and Benchmark 007
- The Creative Agency Command Center local executor: whitelisted build → real browser capture → measured review → patch queue → explicit iteration approval
- lab LCP/CLS collection plus a clearly-labelled safe interaction latency proxy for INP-style responsiveness testing
- requestAnimationFrame FPS/frame-time sampling, Long Task observation and Chromium heap evidence
- automated semantic/accessibility baseline checks plus real keyboard traversal and focus-indicator evidence
- reduced-motion runtime inspection, not just media-query detection
- approved reduced-motion screenshot baselines with browser-side pixel-diff regression thresholds
- persisted JSON release reports and CI evidence artifacts
- fail-closed release evidence: `measured:false` and missing evidence cannot silently become PASS

### Brand Identity Kit production

The Brand Kit slice builds on the existing identity, logo-integrity, vector-geometry and icon-system subsystems rather than replacing them. It adds:

- a versioned **Brand DNA** contract shared by downstream identity artifacts
- a first-class `brand-identity-kit-recipe`
- `brand-kit-packaging` and independent `brand-kit-review`
- a canonical Brand Kit manifest and deterministic delivery plan
- required-category and approval/freeze gates
- Brand DNA version-drift detection across logo, icons and applications
- logo-review + Logo Integrity evidence requirements
- personalized Icon DNA + calibration-family + SVG-master + vector-review requirements
- typography rights/redistribution safeguards
- representative application proof before kit release
- visible unresolved trademark/legal status instead of simulated clearance
- a Command Center Brand Identity Kit deliverable lane whose initial state is explicitly `NOT RUN`
- a first-class `studio brand-kit` command and Benchmark 008

Packaging only references produced artifacts. It cannot fabricate missing assets, legal clearance, font redistribution rights, or customer proof.

v1.2 remains the logo/identity integrity layer: seven-type exploration, psychology hypotheses, canonical mark specification, vector geometry, icon systems, responsive marks, SVG/layer/overlap/render locks, and identity QA.

v1.1 remains the provider-agnostic creative-production bridge: calibration, concept selection, production modes/recipes, tool routing, asset registry, and surgical patching.

The original five epochs remain intact: Kernel, Creative Runtime, Engineering Runtime, Multimodal Runtime, and Observation Loop.

## Quick start

```bash
npm install
npm run dev
```

`npm run dev` starts the Workroom and its local execution service together. For validation:

```bash
npm test
node ./bin/studio.mjs creative-engineering creative-engineering-v13
node ./bin/studio.mjs benchmark creative-engineering-v13
node ./bin/studio.mjs brand-kit brand-identity-kit-v1
node ./bin/studio.mjs benchmark brand-identity-kit-v1
npm run build:web
npm run build:creative-engineering
npx playwright install chromium
npm run test:browser-runtime
npm run test:command-center
```

## Design principle

Do not run every module for every task. Route only the capabilities justified by intent, uncertainty, cost, and consequence. Three.js, GSAP, Rive, Blender, and other production tools are capabilities—not visual styles. A production web artifact must be observed in the browser and pass independent responsive, accessibility, performance, motion and implementation review. **Iteration approval never overrides a failed or unmeasured release gate.**

The accessibility lane is an automated release baseline, not a replacement for complete manual WCAG evaluation. Likewise, the Command Center's interaction metric is a controlled lab proxy; it must not be described as field CrUX INP.

A Brand Kit is not considered complete because a logo, palette and icons exist. Required identity artifacts must share one Brand DNA version, pass their independent subsystem reviews, prove the system in representative applications, and carry rights/provenance evidence.

## v1 core

- `001-kernel` — orchestration, reasoning/review, routing, learning
- `002-creative-runtime` — executable inspiration, direction, design, image, motion, creative evals
- `003-engineering-runtime` — implementation planning, code review, security, QA, release gates
- `004-multimodal-runtime` — storyboard, continuity, video, voice, audio, cross-modal review
- `005-observation-loop` — outcome evidence, analytics, feedback, benchmark history, post-launch review, learning promotion

## upgrades

- `upgrades/v1.1-creative-production/` — calibration, concept exploration/selection, production modes/recipes, tool routing, asset registry, surgical patching
- `upgrades/v1.2-logo-identity/` — logo psychology, responsive identity, canonical SVG/vector geometry integrity, icon systems, logo QA
- `upgrades/v1.3-creative-engineering/` — realtime web implementation, browser observation, 3D asset adapters, responsive/motion engineering, delivery budgets, patch loop, release measurement
- `modules/brand-kit/` — Brand DNA inheritance, full-kit manifest validation, personalized-icon requirements, rights-aware delivery planning

## Benchmarks

- `benchmarks/001-du-bonheur/` — real-business Creative Runtime fixture
- `benchmarks/002-workspace-role-update/` — high-risk permission-sensitive Engineering Runtime fixture
- `benchmarks/003-du-bonheur-brand-film/` — 30-second Multimodal Runtime fixture
- `benchmarks/004-du-bonheur-post-launch/` — synthetic post-launch Observation Loop fixture
- `benchmarks/005-du-bonheur-creative-production/` — v1.1 production-orchestration fixture
- `benchmarks/006-logo-identity/` — v1.2 geometry-locked logo-system fixture
- `benchmarks/007-creative-engineering/` — v1.3 capability selection and delivery-gate fixture
- `benchmarks/008-brand-identity-kit/` — Brand DNA inheritance, personalized icons, kit completeness, rights/legal truth fixture

## Executable fixtures

- `apps/creative-agency/` — The Creative Agency Workroom + local measured Command Center executor + Brand Kit deliverable lane
- `apps/creative-engineering-fixture/` — Three.js + GSAP + Rive production-build fixture
