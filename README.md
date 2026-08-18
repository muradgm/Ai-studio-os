# AI Studio OS

AI Studio OS is a modular operating system for AI-assisted product, creative, engineering, multimodal production, and outcome-learning work.

The repository is organized into **epochs**. Each epoch adds a validated capability rather than expanding the system horizontally without proof.

## Current epoch

**Epoch 005 — Observation Loop**

Epoch 005 closes the system after shipping:

- outcome evidence with explicit provenance, sample size, window, and evidence thresholds
- analytics that separates improvement, flat movement, regression, target achievement, and insufficient evidence
- qualitative feedback synthesis with evidence-backed themes
- post-launch review with conservative attribution and guardrail protection
- benchmark history that distinguishes active regressions from recovered historical regressions
- learning promotion that treats project rules and global rules differently
- Du Bonheur Post-launch Benchmark 004 as a clearly synthetic observation fixture

Epochs 002–004 remain the Creative, Engineering, and Multimodal runtimes.

## Quick start

```bash
node ./bin/studio.mjs route post-launch-review
node ./bin/studio.mjs council observation
node ./bin/studio.mjs observation du-bonheur-post-launch
node ./bin/studio.mjs benchmark du-bonheur-post-launch
npm test
```

## Design principle

Do not run every module for every task. Route only the capabilities justified by intent, uncertainty, cost, and consequence. Do not promote durable rules from weak or noisy outcome evidence.

## Epochs

- `001-kernel` — orchestration, reasoning/review, routing, learning
- `002-creative-runtime` — executable inspiration, direction, design, image, motion, creative evals
- `003-engineering-runtime` — implementation planning, code review, security, QA, release gates
- `004-multimodal-runtime` — storyboard, continuity, video, voice, audio, cross-modal review
- `005-observation-loop` — outcome evidence, analytics, feedback, benchmark history, post-launch review, learning promotion

## Benchmarks

- `benchmarks/001-du-bonheur/` — real-business Creative Runtime fixture
- `benchmarks/002-workspace-role-update/` — high-risk permission-sensitive Engineering Runtime fixture
- `benchmarks/003-du-bonheur-brand-film/` — 30-second Multimodal Runtime fixture
- `benchmarks/004-du-bonheur-post-launch/` — **synthetic** post-launch Observation Loop fixture
