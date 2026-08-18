# AI Studio OS

AI Studio OS is a modular operating system for AI-assisted product, creative, engineering, multimodal production, and outcome-learning work.

The five-epoch core remains frozen as the **v1 baseline**. **v1.1 — Creative Production Upgrade** strengthened the bridge from creative judgment to tool/asset production. **v1.2 — Logo Identity Upgrade** adds a focused logo and identity-production runtime without creating a new horizontal epoch.

## Current baseline

**AI Studio OS v1.2 — Logo Identity Upgrade**

v1.2 adds:

- explicit assessment of all seven logo types for every serious identity project
- evidence-aware logo psychology built as testable hypotheses rather than universal symbolism
- dedicated logo inspiration sources: LogoLounge, LogoSystem, LogoMoose, and Inspiration Logo
- concept-family exploration before visual refinement
- raster-for-ideation / vector-for-final-master separation
- responsive logo systems: primary, secondary, symbol, micro mark, wordmark, favicon
- a canonical mark specification above SVG to lock geometry, palette, layers, and intended overlaps
- SVG integrity checks: fixed viewBox, stable shape IDs, normalized transforms, palette tokens, and no unexpected raster/color content
- layer and overlap integrity plus render-diff evidence at 16/32/64/128 px
- monochrome, tiny-size, digital, print, signage, and low-detail reproduction stress tests
- logo-specific Council, QA, originality/confusion review, and AI-generic-risk gate
- Logo Identity Benchmark 006

v1.1 remains the provider-agnostic creative-production bridge: calibration, concept selection, production modes/recipes, tool routing, asset registry, and surgical patching.

The original five epochs remain intact: Kernel, Creative Runtime, Engineering Runtime, Multimodal Runtime, and Observation Loop.

## Quick start

```bash
node ./bin/studio.mjs route logo-identity
node ./bin/studio.mjs council logo
node ./bin/studio.mjs logo identity-v12
node ./bin/studio.mjs benchmark identity-v12
npm test
```

## Design principle

Do not run every module for every task. Route only the capabilities justified by intent, uncertainty, cost, and consequence. Creative tooling is replaceable infrastructure: providers are adapters, not architecture. Logo psychology is evidence-aware and contextual; logo exports are renderings of a locked canonical mark specification, not opportunities for reinterpretation.

## v1 core

- `001-kernel` — orchestration, reasoning/review, routing, learning
- `002-creative-runtime` — executable inspiration, direction, design, image, motion, creative evals
- `003-engineering-runtime` — implementation planning, code review, security, QA, release gates
- `004-multimodal-runtime` — storyboard, continuity, video, voice, audio, cross-modal review
- `005-observation-loop` — outcome evidence, analytics, feedback, benchmark history, post-launch review, learning promotion

## upgrades

- `upgrades/v1.1-creative-production/` — calibration, concept exploration/selection, production modes/recipes, tool routing, asset registry, surgical patching
- `upgrades/v1.2-logo-identity/` — seven-type logo coverage, psychology hypotheses, logo inspiration, vector/refinement system, canonical mark integrity, responsive marks, logo QA

## Benchmarks

- `benchmarks/001-du-bonheur/` — real-business Creative Runtime fixture
- `benchmarks/002-workspace-role-update/` — high-risk permission-sensitive Engineering Runtime fixture
- `benchmarks/003-du-bonheur-brand-film/` — 30-second Multimodal Runtime fixture
- `benchmarks/004-du-bonheur-post-launch/` — **synthetic** post-launch Observation Loop fixture
- `benchmarks/005-du-bonheur-creative-production/` — v1.1 creative calibration and provider-agnostic production-orchestration fixture
- `benchmarks/006-logo-identity/` — v1.2 seven-type, psychology-aware, geometry-locked logo-system fixture
