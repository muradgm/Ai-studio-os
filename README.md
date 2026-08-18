# AI Studio OS

AI Studio OS is a modular operating system for AI-assisted product, creative, and engineering work.

The repository is organized into **epochs**. Each epoch adds a validated capability rather than expanding the system horizontally without proof.

## Current epoch

**Epoch 003 — Engineering Runtime**

Epoch 003 turns engineering review and release discipline into connected executable gates:

- implementation planning with explicit risk classification, invariants, required tests, rollback, and observability needs
- independent code review with blocker/major/minor/taste severity and required-test enforcement
- security planning derived from the actual change surface
- permission-boundary, failure-recovery, regression, accessibility, and observability QA
- release readiness that refuses unsafe high-risk changes rather than averaging scores
- Workspace Role Update Benchmark 002 for a permission-sensitive SaaS feature

Epoch 002 remains the creative runtime for inspiration, art direction, design, image, motion, and creative evals.

## Quick start

```bash
node ./bin/studio.mjs route landing-page
node ./bin/studio.mjs council design
node ./bin/studio.mjs creative du-bonheur
node ./bin/studio.mjs engineering workspace-role-update
node ./bin/studio.mjs benchmark du-bonheur
node ./bin/studio.mjs benchmark workspace-role-update
npm test
```

## Design principle

Do not run every module for every task. Route only the capabilities justified by intent, uncertainty, cost, and consequence.

## Epochs

- `001-kernel` — orchestration, reasoning/review, routing, learning
- `002-creative-runtime` — executable inspiration, direction, design, image, motion, creative evals
- `003-engineering-runtime` — implementation planning, code review, security, QA, release gates
- `004-multimodal` — video/audio/voice production
- `005-observation-loop` — analytics, release feedback, benchmark-driven learning

## Benchmarks

- `benchmarks/001-du-bonheur/` — real-business creative runtime fixture
- `benchmarks/002-workspace-role-update/` — high-risk permission-sensitive engineering fixture
