# AI Studio OS

AI Studio OS is a modular operating system for AI-assisted product, creative, and engineering work.

The repository is organized into **epochs**. Each epoch adds a validated capability rather than expanding the system horizontally without proof.

## Current epoch

**Epoch 002 — Creative Runtime**

Epoch 002 turns the creative contracts from Epoch 001 into executable planning and evaluation primitives:

- structured inspiration packets with direct, adjacent, trend, anti-reference, and opportunity-gap lanes
- creative-direction synthesis from product truth + reference evidence
- design-system planning for hierarchy, typography, composition, responsive behavior, and interaction
- image asset routing: use → retouch → generative edit → supporting generation / new capture
- motion-system planning with choreography, reduced-motion, and performance constraints
- creative evaluation gates with explicit thresholds and AI-generic-risk limits
- Du Bonheur Benchmark 001 as a deterministic creative-runtime regression fixture

## Quick start

```bash
node ./bin/studio.mjs route landing-page
node ./bin/studio.mjs council design
node ./bin/studio.mjs creative du-bonheur
node ./bin/studio.mjs benchmark du-bonheur
npm test
```

## Design principle

Do not run every module for every task. Route only the capabilities justified by intent, uncertainty, cost, and consequence.

## Epochs

- `001-kernel` — orchestration, reasoning/review, routing, learning
- `002-creative-runtime` — executable inspiration, direction, design, image, motion, creative evals
- `003-engineering-runtime` — implementation, code review, security, QA
- `004-multimodal` — video/audio/voice production
- `005-observation-loop` — analytics, release feedback, benchmark-driven learning

## Benchmark 001

`benchmarks/001-du-bonheur/` contains the first creative-runtime fixture. It models a real-business landing-page redesign and verifies that the OS:

1. looks outward before deciding,
2. protects business/product truth,
3. prefers real assets and controlled edits,
4. defines motion as a system,
5. evaluates distinctiveness and AI-generic risk explicitly.
