# AI Studio OS

AI Studio OS is a modular operating system for AI-assisted product, creative, and engineering work.

The project is being built in **epochs**. Each epoch must make the system more executable, testable, and useful rather than expanding the architecture for its own sake.

## Epoch 001 — Kernel

Epoch 001 establishes the smallest useful runtime:

- orchestration and task routing
- structured reasoning/review commands
- council presets and synthesis protocol
- research and inspiration contracts
- creative direction
- image and motion direction/review
- evaluation rubrics
- memory and compound-learning rules
- Codex-compatible agent skills
- a dependency-free CLI for inspecting routes and councils
- Du Bonheur as the first benchmark fixture

## Principles

1. **Intent before execution.** Define the outcome before selecting tools or skills.
2. **Route, don't bureaucratize.** Activate only the modules needed for a task.
3. **Independent critique matters.** Creation and final judgment should be separated when consequence or uncertainty is meaningful.
4. **Inspiration is analysis, not copying.** References must be annotated with what to take, what to reject, and what opportunity remains.
5. **Real assets before fabrication.** For real businesses: use → retouch → generative edit → full generation.
6. **Motion is a design discipline.** It must communicate hierarchy, causality, state, or atmosphere—not decorate.
7. **Preserve dissent.** Councils must surface unresolved objections rather than averaging them away.
8. **Learn selectively.** Promote durable principles, not every correction.
9. **Evidence over confidence.** Claims should be traceable to sources, tests, or explicit assumptions.
10. **The OS must earn its complexity.** Every module must prove value on benchmarks.

## CLI

```bash
node ./bin/studio.mjs help
node ./bin/studio.mjs route landing-page
node ./bin/studio.mjs route image-retouch
node ./bin/studio.mjs council design
node ./bin/studio.mjs validate
```

Or, with npm scripts:

```bash
npm run studio -- route landing-page
npm test
```

## Repository map

```text
00_orchestration/       intent and routing
01_reasoning_review/    question, analyze, council, critique, review, red-team, improve
02_research/            evidence and source-quality contracts
03_inspiration/         industry/adjacent references, anti-references, opportunity gaps
04_product/             product decision contract
05_creative_direction/  creative brief, art direction, taste
06_design/              design system contract
07_image/               asset audit, retouch/generation priority, image review
08_motion/              motion direction, system, review
09_video/               video contract
10_audio/               audio contract
11_writing/             writing contract
12_engineering/         engineering contract
13_security/            security contract
14_qa/                  QA contract
15_evals/               rubrics and acceptance logic
16_assets/              asset source-of-truth contract
17_release_operations/  release contract
18_growth/              growth contract
19_analytics/            analytics contract
20_governance/           governance contract
21_memory_learning/      decisions, corrections, promoted rules
.agents/skills/          agent-discoverable workflows
benchmarks/              benchmark fixtures and expected outputs
bin/                     dependency-free CLI
lib/                     runtime logic
scripts/                 validation tools
tests/                   kernel tests
```

## Benchmark 001

The first benchmark is a redesign workflow for **Du Bonheur**, a French pâtisserie in Berlin. It tests whether the OS can route a real-business landing-page task through research, inspiration, asset audit, creative direction, design, motion, critique, evals, and learning without activating irrelevant modules.

## Status

**Architecture:** v1.0 locked  
**Runtime:** Epoch 001 / Kernel  
**Next:** Epoch 002 / Creative Runtime
