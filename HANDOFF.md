# AI Studio OS / The Creative Agency — Canonical Agent Handoff

> **READ THIS FIRST.**
>
> This is the canonical continuation document for any new agent working in this repository. It is intended to be sufficient for a competent agent to understand the product, architecture, locked decisions, current implementation state, unresolved work, validation rules, and next priorities **without access to the original chat history**.
>
> **Grounded against `main`:** 2026-08-22
> **Repository:** `muradgm/Ai-studio-os`  
> **Current baseline:** AI Studio OS v1.3.x + The Creative Agency Command Center  
> **`main` at this refresh:** `b8ef917e7b1c45dfdf482f272f97168887edf755`

---

# 0. New-agent startup checklist

Before changing code:

1. Read this entire file.
2. Read `README.md`.
3. Inspect `package.json`.
4. Check open PRs before creating overlapping work.
5. Inspect `kernel/skill-registry.json` and `lib/skill-router.mjs` before touching specialist routing.
6. Inspect the exact runtime/module involved in the requested task.
7. Preserve every **LOCKED** decision below unless the user explicitly reopens it.
8. Never fabricate product capabilities, assets, measurements, legal clearance, rights, provider output, or release readiness.
9. Prefer focused implementation slices over broad architecture expansion.
10. Run the relevant validation gates before merge.

Useful first commands:

```bash
git status
git pull --ff-only origin main
npm install
npx playwright install chromium
npm test
npm run build:web
```

Local start:

```bash
npm run dev
```

Expected services:

```text
The Creative Agency UI   http://localhost:5173/
Execution runtime        http://127.0.0.1:8787
```

---

# 1. What this repository is

This repository contains two tightly connected systems.

## AI Studio OS

The underlying orchestration/runtime for:

- strategy,
- research,
- creative production,
- engineering,
- multimodal work,
- specialist routing,
- council review,
- logo/vector production,
- browser execution,
- measurement/release intelligence,
- asset manifests,
- learning/observation,
- future provider adapters.

## The Creative Agency

The public-facing product/UI that exposes AI Studio OS as a working creative-production environment.

The goal is **not** to build:

- a chat wrapper,
- a generic AI dashboard,
- a model/provider picker,
- a prompt playground,
- a rigid wizard,
- a gallery of disconnected generators.

The intended experience is a working creative floor that can take a real brief through:

```text
BRIEF
→ RESEARCH
→ EXPLORE
→ DECIDE
→ MAKE
→ REVIEW
→ DELIVER
→ LEARN
```

Current positioning:

> **Bring the problem. Leave with the work.**

Supporting line:

> Strategy, design, image, motion, video, writing and implementation — run through one accountable creative process.

Primary product surfaces:

```text
Projects
Workroom / Command Center
Council
Assets
Deliveries
Memory
```

---

# 2. Stable architecture baseline

The original v1 system was built as five epochs:

```text
001 KERNEL
002 CREATIVE RUNTIME
003 ENGINEERING RUNTIME
004 MULTIMODAL RUNTIME
005 OBSERVATION LOOP
```

High-level operating model:

```text
INTENT
→ ROUTING
→ RESEARCH
→ PRODUCT / CREATIVE DIRECTION
→ SPECIALIST CREATION
→ INDEPENDENT REVIEW
→ QA / EVAL
→ SECURITY / GOVERNANCE when required
→ RELEASE
→ REAL-WORLD DATA
→ LEARNING
→ UPDATE RULES / EXAMPLES ↺
```

The five-epoch architecture is considered stable.

**Do not create another broad epoch unless a real recurring production gap cannot be solved by a focused module or upgrade.**

---

# 3. Major upgrades already implemented

## v1.1 — Creative Production

Adds:

- reference extraction,
- design reads,
- creative dials,
- materially different concept exploration,
- concept selection and kill criteria,
- prototype vs production modes,
- provider-neutral production recipes,
- creative tool gateway,
- asset registry / manifests,
- bounded asset-level regeneration and patching.

Core rule:

> Providers are adapters, not architecture.

The OS should first decide **what capability is needed**, then select the best available adapter. Do not hard-wire product logic to one model/vendor.

---

## v1.2 — Logo Identity

Adds:

- seven logo-type evaluation,
- evidence-aware logo psychology hypotheses,
- responsive logo systems,
- canonical mark specifications,
- real SVG artifact inspection,
- Shape Lock,
- SVG Lock,
- Layer Lock,
- Overlap Lock,
- Render Lock,
- deterministic corruption tests.

Boundary:

> Design originality/confusion review is not legal trademark clearance.

Never describe preliminary design/search review as formal legal clearance.

---

## Vector Geometry / Icon Systems

Adds:

- `vector-geometry-engineer`,
- `icon-system-construction`,
- `vector-geometry-review`,
- `icon-system-recipe`,
- exact geometry specification above SVG,
- x/y coordinates,
- logical z as deterministic SVG paint/layer order,
- Bézier point/derivative/curvature math,
- C0/C1/C2 continuity classification,
- safe area / grid / anchors / handles,
- optical correction,
- calibration-first icon-family workflow,
- multi-size inspection.

Mental model:

```text
SVG = output format
Geometry spec = source of truth
```

Static SVG uses logical layer order, not invented 3D coordinates. Real x/y/z remains in the 3D/motion stack and is projected into 2D when needed.

Physics belongs primarily to motion/3D. Static vector production is geometry-first.

---

## v1.3 — Creative Engineering Runtime

Adds executable creative engineering rather than planning-only output.

Core specialist roles include:

- Creative Developer,
- Realtime WebGL Engineer,
- Motion Engineer,
- 3D Technical Artist.

Capabilities include:

- Three.js capability planning,
- GSAP capability planning,
- Rive capability planning,
- Playwright browser capture,
- responsive and reduced-motion capture matrices,
- deterministic Blender CLI adapter contract,
- runtime evidence,
- performance review,
- accessibility review,
- responsive review,
- bounded patch queues.

Important separation:

```text
Motion Designer → what motion should communicate / feel like
Motion Engineer → deterministic browser implementation
```

and:

```text
Art Direction → spatial / visual idea
WebGL / Creative Engineering → renderer / browser architecture
```

---

# 4. Command Center execution and release intelligence

The Creative Agency has a real local executor.

Current path:

```text
BUILD
→ PRODUCTION BUILD
→ LIVE PREVIEW
→ REAL CHROMIUM
→ CAPTURE
→ MEASURE
→ REVIEW
→ PATCH QUEUE
→ ITERATION APPROVAL
```

Current release-evidence lanes:

```text
WEB VITALS / LAB RESPONSIVENESS
RUNTIME PERFORMANCE
BUNDLE
ACCESSIBILITY BASELINE
RESPONSIVE
REDUCED MOTION
VISUAL REGRESSION
```

Critical product rule:

```text
ITERATION APPROVED ≠ PRODUCTION READY
```

A user can approve the creative iteration while release evidence still blocks production readiness.
That approval records the human creative decision only; it must not promote the visual-regression baseline unless the release decision is `ready` and `productionReady:true`.

Missing evidence must fail closed:

```text
UNMEASURED
→ BLOCKED / REVIEW
→ READY only after required evidence passes
```

Do not convert `measured:false`, missing evidence, or an unavailable provider into a green state.

### Performance policy

Runtime performance should use meaningful thresholds rather than brittle binary rules.

Current logic intentionally uses:

- bounded long-task count,
- Total Blocking Time,
- FPS / frame-time evidence,
- Core Web Vitals targets where appropriate.

Do not call lab interaction timing field INP/CrUX evidence.

### Accessibility policy

Automated accessibility inspection is a **release baseline**, not complete manual WCAG certification.

---

# 5. Windows execution — do not regress this

A real Windows bug was found and fixed during local testing.

Problem:

```text
npm.cmd + spawn(..., shell:false)
→ spawn EINVAL on Windows
```

Current policy:

- Vite is launched through `process.execPath` / Node.
- The local Vite JS entrypoint is invoked directly.
- Command execution remains shell-free.
- The Command Center internal build runner follows the same pattern.
- No `shell:true` workaround should be introduced.
- No arbitrary shell command field should be added.

Do not regress this security/portability boundary.

---

# 6. Specialist skill architecture

Skills are split into four categories.

## Role

How a specialist thinks, what they own, and what they must not own.

## Task

A repeatable exact operation.

## Review

Independent judgment and quality gates.

## Recipe

Multi-specialist stage composition.

Anti-sprawl rule:

> Add a skill only when it owns a genuinely distinct recurring responsibility with clear inputs, deliverables, failure modes, review criteria, and handoffs.

Routing rules:

- use the smallest specialist set that materially improves the work,
- maker roles are bounded,
- task skills are bounded,
- high-risk work gets independent review,
- `creative-skeptic` uses a challenger lane,
- review phase excludes makers,
- makers do not certify their own work,
- explicitly requested unknown recipes fail closed instead of disappearing.

---

# 7. Council model

Reasoning commands include:

```text
/question
/analyze
/council
/critique
/redteam
/review
/improve
```

Council flow:

```text
QUESTION / ARTIFACT
↓
INDEPENDENT REVIEW
↓
SKEPTIC | DOMAIN | BUSINESS | CREATIVE | TECHNICAL
↓
CROSS-CRITIQUE
↓
CHALLENGER / RED TEAM
↓
REBUTTAL
↓
SYNTHESIZER / CHAIR
↓
DECISION + DISSENT + CONFIDENCE
```

Expected verdict contract:

```text
COUNCIL VERDICT
Recommendation:
Why:
Strongest supporting evidence:
Strongest objection:
Unresolved disagreement:
Assumptions still requiring validation:
Kill criteria:
Confidence:
Next action:
```

Do not flatten genuine disagreement into fake consensus.

---

# 8. Product truth / evidence rules — NON-NEGOTIABLE

Never invent:

- customer proof,
- user numbers,
- market coverage,
- pricing,
- realtime capabilities,
- latency claims,
- performance claims,
- integrations,
- legal clearance,
- ownership / rights evidence,
- asset production that did not happen,
- provider output that was never generated.

Additional rules:

- Do not call a prototype production-ready.
- Do not call lab responsiveness field INP/CrUX data.
- Automated accessibility review is not complete WCAG certification.
- Do not redistribute font binaries without rights.
- Do not call a design/trademark screen legal clearance.
- Do not count planned assets as produced assets.
- Truth-sensitive imagery should prefer real sources / capture-required workflows rather than fake documentary-looking imagery.

---

# 9. The Creative Agency — current product state

Implemented:

- runnable Vite app under `apps/creative-agency/`,
- Workroom / Command Center UI,
- local execution server,
- Windows-safe shell-free Vite execution,
- real Chromium capture,
- responsive captures,
- reduced-motion captures,
- release-intelligence evidence,
- patch queue,
- iteration approval,
- release-report artifacts,
- Brand Identity Kit infrastructure currently present in `main`.

Local start:

```bash
npm install
npx playwright install chromium
npm run dev
```

Expected output:

```text
Creative Agency execution runtime: http://127.0.0.1:8787
VITE ready
Local: http://localhost:5173/
```

---

# 10. LOCKED Command Center redesign direction

The user visually approved and explicitly locked a new Command Center identity/UI direction.

**Do not redesign it again unless explicitly asked.**

Core visual characteristics:

- dark carbon / black / graphite workspace,
- warm ivory / paper typography,
- restrained warm sand accent for primary approval/action,
- green only for measured/live success,
- red only for blockers/errors,
- editorial display serif paired with disciplined grotesk UI typography,
- premium creative-studio/editorial tone,
- dense but controlled production workspace,
- no generic AI-dashboard look,
- no excessive SaaS-card decoration.

Approved layout characteristics:

```text
LEFT NAVIGATION
    ↓
PROJECT / PIPELINE HEADER
    ↓
PRODUCTION QUEUE | LARGE LIVE PREVIEW | RELEASE / REVIEW RAIL
    ↓
GENERATED OUTPUT STRIP
    ↓
VERSION / MEMORY / TEAM FOOTER
```

Important actions shown in the approved direction:

- Build
- Run Review
- Patch Queue
- Approve Iteration

The approved visual reference showed a `CA` monogram / wordmark concept.

**Do not treat the raster concept as a canonical production logo yet.**

If that identity becomes official:

```text
LOGO DESIGN
→ VECTOR GEOMETRY ENGINEER
→ VECTOR REVIEW
→ SHAPE / SVG / LAYER / OVERLAP / RENDER LOCKS
→ CANONICAL SVG MASTER
```

The approved visual reference was created in conversation but is not guaranteed to exist in the repository. If pixel-faithful implementation needs the image, add it as an explicit design artifact first rather than reconstructing details from memory.

---

# 11. Brand Identity Kit capability

Current `main` contains Brand Identity Kit infrastructure, including:

- `brand-identity-kit-recipe`,
- Brand Kit runtime/module,
- Brand Kit packaging/review skills,
- Brand Kit Command Center panel,
- Brand Kit tests / benchmark infrastructure.

Inspect these before changing anything:

```text
modules/brand-kit/
lib/brand-kit-runtime.mjs
apps/creative-agency/src/brand-kit-panel.js
.agents/skills/brand-identity-kit-recipe/
.agents/skills/brand-kit-packaging/
.agents/skills/brand-kit-review/
benchmarks/008-brand-identity-kit/
test/brand-kit.test.mjs
test/brand-kit-command-center.test.mjs
```

Intended end-to-end capability:

```text
BRAND BRIEF
↓
STRATEGY
↓
BRAND DNA
↓
IDENTITY EXPLORATION
↓
LOGO SYSTEM
↓
CANONICAL VECTOR MASTER
↓
PERSONALIZED ICON DNA
↓
5–8 CALIBRATION ICONS
↓
ICON FAMILY REVIEW / FREEZE
↓
COLOR / TYPE / IMAGE / MOTION / VOICE
↓
REPRESENTATIVE APPLICATIONS
↓
INDEPENDENT BRAND REVIEW
↓
PACKAGING
↓
BRAND KIT DELIVERY
```

A personalized icon family means icons generated from the brand’s own geometry / visual grammar.

Recolored stock icons must **not** pass as a custom icon system.

A kit can only contain assets that actually exist.

Do not fabricate:

- logo masters,
- icon SVGs,
- guideline PDFs,
- licensed fonts,
- image rights,
- motion/video assets,
- delivery files.

If an asset is planned but not produced, mark it planned/missing.

---

# 12. TraderFrame — important project state

TraderFrame is a major real-project benchmark for the OS.

## LOCKED visual identity direction

Terminal Red palette:

```text
Black       #12100F
Paper       #F0EAE0
Vermilion   #E54832
Steel       #6C7772
Graphite    #272A26
```

Typography direction:

```text
Space Grotesk
Inter
IBM Plex Mono
```

Selected landing-page concept:

> **The Frame**

Core idea:

> The frame is an information instrument. Outside the frame, market movement is subordinate/unresolved; inside it, structure sharpens and a meaningful event can be promoted.

Marketing may use restrained cinematic 3D.

Core product UI should remain flatter, quieter, denser, and precise.

Do not default TraderFrame into generic:

- dark fintech terminal,
- neon market UI,
- green/red casino language,
- floating glass cards,
- metallic candlesticks,
- meaningless particle fields,
- generic “trade smarter / edge / alpha / power / precision” copy.

## TraderFrame product truth — unresolved

Do not invent:

- exact primary user segment,
- exact market/data coverage,
- broker/execution capability,
- pricing,
- latency/realtime guarantees,
- integrations,
- adoption/customer proof,
- verified performance claims.

---

# 13. Open PRs and TraderFrame branches — handle deliberately

## Current open PR

As of this refresh, GitHub reports one open PR:

```text
PR #42 — Consolidate Command Center into native Artifact-backed view
Status: OPEN / DRAFT
Head: cleanup/native-command-center-consolidation-v1
Base: main
```

Purpose:

- native Artifact-backed Command Center consolidation,
- removal of superseded decorator behavior,
- preservation of measured execution/release behavior.

Before merge, verify that iteration approval still stays separate from production readiness and that visual-regression baseline promotion only occurs for production-ready releases.

## Historical TraderFrame specialist/icon branches

Earlier handoffs referenced TraderFrame PR #9 and PR #11 as open draft work. They are no longer open in GitHub at this refresh. Their branch content should still be handled deliberately if resurrected:

### TraderFrame specialist run

- real-project specialist run,
- selected concept: **The Frame**,
- runnable prototype,
- explicit truth boundaries.

It was created against an older `main` baseline.

**Do not merge blindly.** Rebase/review any resurrected work against current architecture first.

### TraderFrame six-icon calibration family

Contains six deterministic SVG calibration icons:

- Frame
- Trend
- Watchlist
- Signal
- Filter
- Risk

Geometry DNA:

```text
24×24 viewBox
1.5 stroke
square caps
miter joins
0° / 45° / 90° dominant geometry
sharp / chamfer corner family
currentColor canonical masters
max one semantic event layer
Terminal Red applied at product/application level
```

The historical review state was **DO NOT FREEZE** until visual approval is explicit.

If the user later approves the deterministic SVG set as final calibration v1:

1. set Icon DNA status to `frozen-v1`,
2. record approval/freeze date,
3. update docs/tests,
4. rerun CI,
5. merge,
6. treat those six glyphs as immutable calibration anchors unless a versioned revision is requested.

---

# 14. Design principles / anti-patterns

Prefer:

- work/results before machinery,
- strong hierarchy,
- editorial restraint,
- real evidence,
- capability-driven tooling,
- precise motion,
- deterministic assets,
- independent critique,
- small specialist sets,
- surgical iteration.

Avoid:

- generic AI gradients/glow,
- glassmorphism for its own sake,
- floating orb/network/brain metaphors,
- excessive cards,
- fade-up/parallax spam,
- gratuitous 3D,
- dark-terminal fintech cliché,
- fake `LIVE` states,
- invented metrics,
- pretending AI generation equals finished art direction,
- one-shot generation when iterative review is needed.

For web work, high visual ambition must not bypass performance, accessibility, reduced-motion, or responsive gates.

---

# 15. Current roadmap / next priorities

## P0 — Implement the approved Command Center redesign

This is the clearest next product/UI task.

Requirements:

- reproduce the locked visual direction in the actual app,
- preserve current execution/release behavior,
- keep accessibility and responsive behavior intact,
- use real project/run data where available,
- do not replace measured evidence with decorative mock values,
- run browser capture and release intelligence on the redesigned interface itself.

## P0 — Run the Brand Identity Kit end-to-end on a real identity

Recommended benchmark candidate: **The Creative Agency itself**.

Use the product to create its own:

- Brand DNA,
- canonical logo system,
- personalized icon family,
- palette,
- type system,
- image direction,
- motion language,
- voice/tone,
- application proof,
- delivery/guideline package.

This is the strongest way to expose missing production adapters and coherence problems.

## P1 — Resolve TraderFrame icon freeze decision

Either explicitly approve/freeze the six-icon calibration family or revise it. Do not leave it indefinitely half-frozen.

## P1 — Rebase/redo TraderFrame as a serious creative-engineering benchmark

Goal:

```text
SPECIALIST DIRECTION
→ THREE / GSAP only where justified
→ REAL RESPONSIVE BUILD
→ CHROMIUM CAPTURE
→ MEASURED REVIEW
→ PATCH
→ REBUILD
→ RELEASE DECISION
```

The target is a genuinely runnable high-end product-marketing experience, not another static visual.

## P1 — Connect real production adapters

Highest-value gaps:

- image generation/edit execution,
- video generation/edit execution,
- audio/voice execution,
- Blender/3D execution where available,
- artifact ingest/register/download loop,
- provenance/rights/cost registration.

Adapters should execute real jobs, collect real outputs, register evidence, and fail closed when unavailable.

## P2 — Safe source-patching adapter

The Command Center currently creates auditable patch instructions. It should not freely mutate source code from arbitrary AI text.

If automatic source mutation is added:

- scope writes to approved project roots,
- use explicit file-level patches,
- keep diffs visible,
- run tests/build/release gates after each patch,
- cap iterations,
- preserve rollback,
- never expose arbitrary shell execution.

## P2 — Persistence / collaboration / deployment

Future needs may include:

- durable project persistence,
- project/version history,
- team/user permissions,
- artifact storage,
- provider credential management,
- remote execution workers,
- deployment adapters,
- production observability.

Do not add these before a concrete workflow requires them.

---

# 16. Validation commands

Run the relevant subset and preferably all gates before merging architecture/runtime changes:

```bash
npm test
node ./bin/studio.mjs benchmark creative-engineering-v13
node ./bin/studio.mjs benchmark brand-identity-kit-v1
npm run build:web
npm run build:creative-engineering
npm run test:browser-runtime
npm run test:command-center
npm run test:logo-integrity
```

First-time Playwright setup:

```bash
npx playwright install chromium
```

Windows/Git Bash note:

The repo intentionally avoids `npm.cmd + shell:false` child-process execution. Vite is launched through `process.execPath` and the local Vite JS entrypoint so Windows remains shell-free and secure. Do not regress this by switching the executor to `shell:true`.

---

# 17. Core files/directories to inspect first

```text
README.md
HANDOFF.md
package.json
kernel/skill-registry.json
lib/skill-router.mjs
lib/brand-kit-runtime.mjs
modules/brand-kit/
modules/creative-engineering/
modules/vector-geometry/
modules/logo-integrity/
apps/creative-agency/
apps/creative-engineering-fixture/
upgrades/v1.1-creative-production/
upgrades/v1.2-logo-identity/
upgrades/v1.3-creative-engineering/
benchmarks/
test/
integration/
.github/workflows/ci.yml
```

For named projects, inspect:

```text
projects/<project>/
apps/<project>/
```

before assuming their current state.

---

# 18. How a new agent should work in this repository

1. Read this file and `README.md`.
2. Inspect current `main`, open PRs, and exact project files.
3. Separate facts into:
   - implemented,
   - approved/locked but not implemented,
   - experimental,
   - unresolved.
4. Do not silently reopen locked decisions.
5. Do not silently merge old draft PRs.
6. Use a focused branch/PR for meaningful changes.
7. Preserve independent review and fail-closed evidence behavior.
8. Run relevant benchmark/build/browser/integrity gates.
9. Report exact head/merge SHA and remaining boundaries.
10. Update this file whenever a major baseline, locked decision, open-work status, or roadmap item materially changes.

---

# 19. Current status snapshot

```text
AI Studio OS core             STABLE
Five-epoch architecture       FROZEN / STABLE
Creative Production           MERGED
Logo Identity                 MERGED
Specialist Architecture       MERGED
Vector Geometry / Icons       MERGED
Creative Engineering          MERGED
Command Center Execution      MERGED
Release Intelligence          MERGED
Windows Shell-Free Fix        MERGED
Brand Identity Kit infra      PRESENT IN MAIN

Command Center redesign       APPROVED / LOCKED / PR #42 OPEN DRAFT
Command Center baseline guard IMPLEMENTED ON codex/command-center-baseline-guard
TraderFrame specialist run    HISTORICAL / NOT OPEN
TraderFrame icon calibration  HISTORICAL / REVIEW-CANDIDATE / FREEZE DECISION UNRESOLVED
```

The strongest next move is **real-project validation and product execution**, not another large architecture layer.

---

# 20. Final continuity rule

If a future agent is unsure whether to add architecture, create a new skill, add a provider, or build another subsystem, default to this question:

> **What real project failure are we solving?**

If there is no concrete failure, do not expand the system yet.

Build the work, run it, measure it, critique it, then evolve the OS from evidence.
