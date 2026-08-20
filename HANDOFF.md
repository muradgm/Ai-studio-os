# AI Studio OS / The Creative Agency — Agent Handoff

> **Purpose:** This file is the first document a new agent should read before changing the repository.
>
> It records the current product state, architecture, locked decisions, known gaps, active work, roadmap, validation commands, and boundaries that must not be weakened.
>
> **Last grounded against `main`:** 2026-08-20
> **Current baseline:** AI Studio OS **v1.3.2**
> **Main at handoff creation:** `38896bbce3cec31b8dab655bce1add965b4f535a`

---

## 1. What this repository is

This repository contains **AI Studio OS**, the underlying orchestration/runtime, and its public-facing product application, **The Creative Agency**.

The product goal is not to be another chat wrapper or model picker. The intended experience is a working creative floor that can move a real project through strategy, research, exploration, decision, production, review, measurement, delivery, and learning.

Public product positioning:

> **Bring the problem. Leave with the work.**

Supporting line:

> Strategy, design, image, motion, video, writing and implementation — run through one accountable creative process.

Core product spine:

```text
BRIEF → RESEARCH → EXPLORE → DECIDE → MAKE → REVIEW → DELIVER
```

Primary product surfaces:

```text
Projects / Workroom / Council / Assets / Deliveries / Memory
```

Do not turn this into a generic dark AI dashboard, prompt playground, provider marketplace, or rigid wizard.

---

## 2. Architecture at a glance

### Frozen v1 five-epoch core

```text
001 KERNEL
002 CREATIVE RUNTIME
003 ENGINEERING RUNTIME
004 MULTIMODAL RUNTIME
005 OBSERVATION LOOP
```

High-level execution model:

```text
INTENT
→ ROUTING
→ RESEARCH
→ PRODUCT / CREATIVE DIRECTION
→ SPECIALIST CREATION
→ INDEPENDENT REVIEW
→ QA + EVAL
→ SECURITY / GOVERNANCE where needed
→ RELEASE
→ REAL-WORLD DATA
→ LEARNING
→ UPDATE RULES / EXAMPLES ↺
```

The five-epoch core is considered the stable v1 baseline. Prefer focused upgrades around proven gaps rather than adding another broad horizontal epoch.

### Upgrades above v1

#### v1.1 — Creative Production

Adds:

- reference extraction
- design read
- creative dials
- materially distinct concept exploration
- concept selection and kill criteria
- prototype vs production modes
- provider-neutral production recipes
- creative tool gateway
- asset registry / manifests
- bounded asset-level patching and regeneration

Providers are adapters, not architecture.

#### v1.2 — Logo Identity

Adds:

- seven logo-type evaluation
- evidence-aware logo psychology hypotheses
- responsive logo systems
- canonical mark specification
- real SVG artifact inspection
- Shape / SVG / Layer / Overlap / Render locks
- deterministic corruption tests

Important: design originality/confusion review is not legal trademark clearance.

#### Vector Geometry / Icon Systems

Adds:

- `vector-geometry-engineer`
- `icon-system-construction`
- `vector-geometry-review`
- `icon-system-recipe`
- exact geometry specification above SVG
- x/y geometry and logical-z paint/layer order
- Bézier math and C0/C1/C2 continuity checks
- grid/safe-area/anchors/control points
- calibration-first icon-family workflow

Physics belongs primarily to motion/3D, not static SVG.

#### v1.3 — Creative Engineering Runtime

Adds real execution rather than planning-only output:

- Creative Developer
- Realtime WebGL Engineer
- Motion Engineer
- 3D Technical Artist
- Three.js / GSAP / Rive capability planning
- Playwright browser capture
- responsive and reduced-motion capture matrix
- deterministic Blender CLI adapter contract
- browser/runtime evidence
- performance/accessibility/responsive release gates
- evidence-driven patch queues

#### Command Center Execution + Release Intelligence

The Creative Agency now has a real local executor:

```text
BUILD
→ PRODUCTION BUILD
→ LIVE PREVIEW
→ CHROMIUM CAPTURE
→ MEASURE
→ REVIEW
→ PATCH QUEUE
→ ITERATION APPROVAL
```

Release evidence lanes:

```text
WEB VITALS / LAB RESPONSIVENESS
RUNTIME PERFORMANCE
BUNDLE
ACCESSIBILITY BASELINE
RESPONSIVE
REDUCED MOTION
VISUAL REGRESSION
```

Important distinction:

```text
Iteration approved ≠ Production ready
```

Missing or `measured:false` evidence must fail closed.

#### v1.3.2 — Brand Identity Kit Production

Adds:

- versioned Brand DNA contract
- `brand-identity-kit-recipe`
- `brand-kit-packaging`
- independent `brand-kit-review`
- canonical Brand Kit manifest
- Brand DNA inheritance/drift checks
- personalized Icon DNA requirements
- calibration-family + SVG-master + vector-review requirements
- typography licensing/redistribution safeguards
- representative application proof
- rights/legal uncertainty reporting
- deterministic delivery plan using only produced artifacts
- `studio brand-kit`
- Benchmark 008
- Command Center Brand Identity Kit deliverable lane

The Brand Kit runtime is real, but the Command Center lane begins as **NOT RUN** and must not fabricate assets that do not exist.

---

## 3. Specialist skill architecture

Skills are intentionally split into four categories:

1. **Role** — how a specialist thinks and what they own
2. **Task** — an exact repeatable operation
3. **Review** — independent judgment / quality gate
4. **Recipe** — multi-discipline workflow composition

Anti-sprawl rule:

> Do not add a new skill unless it has a distinct responsibility, concrete deliverables, known failure modes, review criteria, and a recurring real-project use case.

Routing principle:

> Use the smallest specialist set that materially improves the decision or artifact.

Important registry constraints:

- maker roles are capped
- task skills are capped
- high-risk work gets independent review
- `creative-skeptic` routes through a challenger lane
- review phase excludes makers
- unknown explicitly requested recipes block instead of silently disappearing
- makers cannot certify their own work

---

## 4. Council model

Reasoning commands:

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

Council output contract:

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

Do not flatten disagreement into fake consensus.

---

## 5. Product truth and evidence rules

These rules are non-negotiable:

- Do not invent customer proof.
- Do not invent realtime/live product capabilities.
- Do not invent pricing, performance, latency, integrations, or market coverage.
- Do not call a prototype production-ready.
- Do not call lab responsiveness data field INP/CrUX data.
- Automated accessibility review is a release baseline, not a complete manual WCAG certification.
- Do not redistribute font binaries without explicit rights.
- Do not call a trademark/design screen legal clearance.
- Do not count a planned asset as produced.
- Do not fabricate source/right/consent evidence.
- Truth-sensitive imagery should prefer real source material or capture-required paths over invented documentary-looking AI imagery.

---

## 6. The Creative Agency — current product state

### What is implemented

- runnable Vite app under `apps/creative-agency/`
- Workroom/project-spine UI
- local execution server
- Windows-safe shell-free Vite execution
- real Chromium browser capture
- responsive captures
- reduced-motion captures
- measured release intelligence
- patch queue
- iteration approval
- release report artifacts
- Brand Identity Kit deliverable lane

Local start:

```bash
npm install
npx playwright install chromium
npm run dev
```

Expected local services:

```text
UI:        http://localhost:5173/
Executor:  http://127.0.0.1:8787
```

### Approved new Command Center visual direction — LOCKED, NOT YET IMPLEMENTED

A new Command Center UI/brand direction was visually approved by the user on 2026-08-19.

Treat the direction as locked unless the user explicitly asks to reopen it.

Key characteristics:

- dark carbon/graphite workspace
- warm ivory / paper typography and surfaces
- restrained warm sand accent for primary approval/action
- green only for measured success / live status
- red only for blocking/error states
- editorial display serif paired with disciplined grotesk UI typography
- high-density creative-production workspace without looking like an AI dashboard
- left navigation
- central live-preview workspace
- production queue
- evidence/release-status rail
- review/critique rail
- generated-output strip
- explicit Build / Run Review / Patch Queue / Approve Iteration actions
- premium studio/editorial tone rather than SaaS-card decoration

The approved concept also showed a `CA` monogram / wordmark treatment. **Do not treat that raster concept as the canonical production logo yet.** If it becomes the official logo, run it through the v1.2 logo/vector/integrity workflow first and freeze a canonical SVG master.

The visual reference image itself was approved in conversation but is not yet committed to the repository. If implementation fidelity requires it, first add the approved reference as a proper project/design artifact rather than reconstructing it from memory.

---

## 7. Brand Identity Kit — intended end-to-end capability

The target product experience is:

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
VECTOR MASTER / LOCKS
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

Personalized icons must be designed from the brand's own geometry/visual grammar. Recolored stock icons must not pass as a custom brand icon family.

A complete kit may include strategy docs, Brand DNA, logo variants, icon masters, palette/tokens, typography guidance, imagery/motion direction, tone/voice guidance, application proof, guidelines, manifests, and export packages — but only if those artifacts were actually produced.

---

## 8. Active / unresolved repository work

### PR #9 — TraderFrame specialist run

Status at handoff creation: **OPEN / DRAFT**.

Purpose:

- real-project specialist run
- selected concept: **The Frame**
- runnable TraderFrame prototype
- explicit product-truth boundaries

Do not merge blindly. It was created against an older main baseline and should be reviewed/rebased against the current v1.3.2 architecture before use.

### PR #11 — TraderFrame six-icon calibration family

Status at handoff creation: **OPEN / DRAFT**.

Contains the refined six calibration icons:

- Frame
- Trend
- Watchlist
- Signal
- Filter
- Risk

Geometry language:

```text
24×24
1.5 stroke
square caps
miter joins
0° / 45° / 90° dominant geometry
currentColor canonical masters
max one semantic event layer
Terminal Red applied at product level, not hard-coded into the canonical SVG
```

Current repo state remains `review-candidate`. Do not merge/freeze it unless the user explicitly approves the refined deterministic SVG set as the final calibration v1.

If approved:

- change Icon DNA status to `frozen-v1`
- record user approval/freeze date
- update tests/docs
- rerun CI
- merge PR #11
- treat those six glyphs as immutable calibration anchors unless a versioned change is requested

### TraderFrame product truth

Known/locked:

- Terminal Red palette
  - Black `#12100F`
  - Paper `#F0EAE0`
  - Vermilion `#E54832`
  - Steel `#6C7772`
  - Graphite `#272A26`
- type direction: Space Grotesk / Inter / IBM Plex Mono
- selected landing-page direction: **The Frame**
- marketing may use cinematic 3D
- core product UI should remain flatter, quieter, and more precise

Unresolved and must not be invented:

- exact primary user segment
- exact market/data coverage
- broker/execution capability
- pricing
- latency/realtime guarantees
- integrations
- customer proof/adoption
- verified performance claims

---

## 9. Recommended roadmap from here

### P0 — Implement the approved Command Center redesign

Do this before adding more speculative architecture.

Target:

- reproduce the locked visual direction in the actual app
- preserve existing execution/release behavior
- keep accessibility and responsive evidence intact
- use real project/run data where available
- do not replace functional evidence with decorative mock values
- run browser capture and release intelligence on the redesigned interface itself

### P0 — Run Brand Identity Kit end-to-end on a real identity

The runtime is merged; now prove the actual workflow.

Recommended benchmark candidate: **The Creative Agency itself**.

Use the product to create its own:

- Brand DNA
- canonical logo system
- color system
- type system
- personalized icon family
- motion language
- imagery direction
- voice/tone
- application proof
- brand guidelines / delivery package

This is the strongest way to expose missing production adapters and coherence problems.

### P1 — Complete TraderFrame calibration decision

Either explicitly approve/freeze PR #11 or revise it. Do not leave the calibration family indefinitely half-frozen.

### P1 — Rebase/redo TraderFrame as the first serious creative-engineering benchmark

After the Command Center redesign is stable, use TraderFrame to prove:

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

The goal is a genuinely runnable high-end product-marketing experience, not another static visual.

### P1 — Connect real asset-production adapters

Highest-value gaps:

- image generation/edit provider execution
- video generation/edit execution
- audio/voice execution
- Blender/3D execution where available
- robust artifact ingest/register/download loop

The Tool Gateway currently has the right provider-neutral architecture. Adapters should execute jobs, collect real outputs, register provenance/rights/cost, and fail closed when unavailable.

### P2 — Safe source-patching adapter

The Command Center currently creates auditable patch instructions. It does not yet freely mutate source code from arbitrary AI text.

If automatic source mutation is added:

- scope writes to approved project roots
- use explicit file-level patches
- keep diffs visible
- run tests/build/release gates after every patch
- cap iterations
- preserve rollback
- never expose arbitrary shell execution

### P2 — Persistence / collaboration / deployment

Likely future product needs:

- durable project persistence
- project/version history beyond process memory
- team/user permissions
- artifact storage
- provider credentials management
- remote execution workers
- deployment adapters
- production observability

Do not add these before a concrete workflow needs them.

---

## 10. Validation commands

Before merging architecture/runtime changes, run the relevant subset and preferably all gates:

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

## 11. Core files and directories to inspect first

```text
README.md
HANDOFF.md
package.json
kernel/skill-registry.json
lib/skill-router.mjs
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

For any named project, inspect `projects/<project>/` and `apps/<project>/` before assuming its current state.

---

## 12. Design principles / anti-patterns

Prefer:

- work/results before machinery
- strong hierarchy
- editorial restraint
- real evidence
- capability-driven tooling
- precise motion
- deterministic assets
- independent critique
- small specialist sets
- surgical iteration

Avoid:

- generic AI gradients/glow
- glassmorphism for its own sake
- floating orb/network/brain metaphors
- excessive cards
- fade-up/parallax spam
- gratuitous 3D
- dark-terminal fintech cliché
- fake "LIVE" states
- invented metrics
- pretending AI generation equals finished art direction
- one-shot generation when iterative review is needed

For web work, high visual ambition must not bypass performance, accessibility, reduced-motion, or responsive gates.

---

## 13. How a new agent should work in this repository

1. Read `HANDOFF.md` and `README.md`.
2. Inspect current `main`, open PRs, and the exact project files involved.
3. Separate facts into:
   - implemented
   - approved/locked but not implemented
   - experimental
   - unresolved
4. Do not silently reopen locked product/design decisions.
5. Do not silently merge old draft PRs.
6. Use a focused branch/PR for meaningful changes.
7. Preserve independent review and fail-closed evidence behavior.
8. Run the relevant benchmark/build/browser/integrity gates.
9. Report exact head/merge SHA and any remaining boundary.
10. Update this file whenever a major baseline, locked decision, open-work status, or roadmap item materially changes.

---

## 14. Current status snapshot

At the time this handoff was created:

```text
AI Studio OS              v1.3.2
Five-epoch core           FROZEN / STABLE
Creative Production       MERGED
Logo Identity             MERGED
Specialist Architecture   MERGED
Vector Geometry / Icons   MERGED
Creative Engineering      MERGED
Command Center Execution  MERGED
Release Intelligence      MERGED
Windows Shell-Free Fix    MERGED
Brand Identity Kit        MERGED

Command Center redesign   APPROVED / LOCKED / NOT IMPLEMENTED
TraderFrame PR #9         OPEN DRAFT
TraderFrame PR #11        OPEN DRAFT / REVIEW-CANDIDATE
```

The strongest next move is **real-project validation**, not another large architecture layer.
