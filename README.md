# AI Studio OS

AI Studio OS is a modular operating system for AI-assisted product, creative, and engineering work.

The repository is organized into **epochs**. Each epoch adds a validated capability rather than expanding the system horizontally without proof.

## Current epoch

**Epoch 001 — Kernel**

The first epoch implements:

- intent + routing
- structured reasoning/review commands
- council protocols
- research and inspiration gates
- creative/image/motion entrypoints
- evaluation contracts
- memory + learning promotion rules
- Codex-compatible Agent Skills
- a dependency-free CLI for inspecting workflows
- validation tests for the kernel

## Quick start

```bash
node ./bin/studio.mjs route landing-page
node ./bin/studio.mjs council design
node ./bin/studio.mjs workflow landing-page
npm test
```

## Design principle

Do not run every module for every task. Route only the capabilities justified by intent, uncertainty, cost, and consequence.

## Epochs

- `001-kernel` — orchestration, reasoning/review, routing, learning
- `002-creative-runtime` — deeper design/image/motion execution
- `003-engineering-runtime` — implementation, code review, security, QA
- `004-multimodal` — video/audio/voice production
- `005-observation-loop` — analytics, release feedback, benchmark-driven learning
