# AI Studio OS

AI Studio OS is a modular operating system for AI-assisted product, creative, engineering, multimodal production, and outcome-learning work.

The five-epoch core is now frozen as the **v1 baseline**. **v1.1 — Creative Production Upgrade** strengthens the bridge between creative judgment and actual asset/tool production without adding a new horizontal epoch.

## Current baseline

**AI Studio OS v1.1 — Creative Production Upgrade**

v1.1 adds:

- reference decomposition into transferable design principles instead of visual cloning
- a compact Design Read before art direction
- explicit Creative Dials with rationale
- 3–5 concept divergence before Council selection
- concept-selection rationale, rejected alternatives, and kill criteria
- explicit Prototype versus Production modes
- reusable provider-independent Production Recipes
- a capability-based Creative Tool Gateway
- stable Asset Registry records with provenance, rights, continuity, direction, dependencies, and versions
- asset-level patch/regeneration rather than whole-project reruns
- Du Bonheur Creative Production Benchmark 005

The original five epochs remain intact: Kernel, Creative Runtime, Engineering Runtime, Multimodal Runtime, and Observation Loop.

## Quick start

```bash
node ./bin/studio.mjs route creative-production
node ./bin/studio.mjs council creative-production
node ./bin/studio.mjs production du-bonheur-v11
node ./bin/studio.mjs benchmark du-bonheur-v11
npm test
```

## Design principle

Do not run every module for every task. Route only the capabilities justified by intent, uncertainty, cost, and consequence. Creative tooling is replaceable infrastructure: providers are adapters, not architecture.

## v1 core

- `001-kernel` — orchestration, reasoning/review, routing, learning
- `002-creative-runtime` — executable inspiration, direction, design, image, motion, creative evals
- `003-engineering-runtime` — implementation planning, code review, security, QA, release gates
- `004-multimodal-runtime` — storyboard, continuity, video, voice, audio, cross-modal review
- `005-observation-loop` — outcome evidence, analytics, feedback, benchmark history, post-launch review, learning promotion

## v1.1 upgrade

- `upgrades/v1.1-creative-production/` — calibration, concept exploration/selection, production modes/recipes, tool routing, asset registry, surgical patching

## Benchmarks

- `benchmarks/001-du-bonheur/` — real-business Creative Runtime fixture
- `benchmarks/002-workspace-role-update/` — high-risk permission-sensitive Engineering Runtime fixture
- `benchmarks/003-du-bonheur-brand-film/` — 30-second Multimodal Runtime fixture
- `benchmarks/004-du-bonheur-post-launch/` — **synthetic** post-launch Observation Loop fixture
- `benchmarks/005-du-bonheur-creative-production/` — v1.1 creative calibration and provider-agnostic production-orchestration fixture
