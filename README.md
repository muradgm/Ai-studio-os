# AI Studio OS

AI Studio OS is a modular operating system for AI-assisted product, creative, engineering, and multimodal production work.

The repository is organized into **epochs**. Each epoch adds a validated capability rather than expanding the system horizontally without proof.

## Current epoch

**Epoch 004 — Multimodal Runtime**

Epoch 004 connects media planning and review into one authored production system:

- timed storyboard beats and shots before media generation
- continuity-bible enforcement across real and generated visual assets
- video direction for camera, edit pacing, transitions, and aspect-ratio adaptation
- voice direction with language, casting, delivery, pronunciation, timing, usage rights, and clone consent
- audio direction with sound design, music-rights evidence, mix hierarchy, captions, and transcript
- cross-modal review that blocks creative-direction drift, continuity drift, timing errors, truth/source gaps, rights gaps, and accessibility failures
- Du Bonheur Brand Film Benchmark 003

Epoch 002 remains the Creative Runtime. Epoch 003 remains the Engineering Runtime.

## Quick start

```bash
node ./bin/studio.mjs route product-film
node ./bin/studio.mjs council multimodal
node ./bin/studio.mjs multimodal du-bonheur-brand-film
node ./bin/studio.mjs benchmark du-bonheur-brand-film
npm test
```

## Design principle

Do not run every module for every task. Route only the capabilities justified by intent, uncertainty, cost, and consequence.

## Epochs

- `001-kernel` — orchestration, reasoning/review, routing, learning
- `002-creative-runtime` — executable inspiration, direction, design, image, motion, creative evals
- `003-engineering-runtime` — implementation planning, code review, security, QA, release gates
- `004-multimodal-runtime` — storyboard, continuity, video, voice, audio, cross-modal review
- `005-observation-loop` — analytics, release feedback, benchmark-driven learning

## Benchmarks

- `benchmarks/001-du-bonheur/` — real-business Creative Runtime fixture
- `benchmarks/002-workspace-role-update/` — high-risk permission-sensitive Engineering Runtime fixture
- `benchmarks/003-du-bonheur-brand-film/` — 30-second Multimodal Runtime fixture
