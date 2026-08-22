# Style Frame Proof Contract v1

## Purpose

Turn a structurally review-ready Creative World Exploration into comparable browser-rendered visual evidence **before** any Creative World is selected.

This stage exists because prose divergence is insufficient evidence of visual quality. It must show how each world behaves at representative experience moments without pretending the proof is production design.

## Required upstream state

- `ai-studio-os/creative-world-exploration@1`
- `reviewReady: true`
- 3–5 authored Creative Worlds
- no automatic world selection

## Required proof moments

Every Creative World must produce exactly five first-pass frames:

1. Opening / Hero
2. Product / Sensory
3. Information / Utility
4. Narrative Transition
5. Mobile Interpretation

The proof set must also produce one same-moment comparison board for each frame type.

## Truth boundaries

Pre-selection style-frame proof may use:

- system-font or local proxy typography;
- abstract/synthetic material studies;
- explicit image placeholders for truth-sensitive documentary assets;
- real supplied assets when rights and provenance permit.

It may not claim:

- an approved font family;
- a fabricated Du Bonheur product photograph;
- human visual approval;
- a selected Creative World;
- approved production technology;
- production readiness.

`browser-rendered` means the PNG reflects the HTML/CSS/SVG produced by this slice. It does not mean the underlying art direction has been approved.

## Canonical schema

Plan:

```text
ai-studio-os/style-frame-proof-plan@1
```

Frame:

```text
ai-studio-os/style-frame-proof@1
```

Each frame carries:

- Creative World id and idea;
- proof moment;
- viewport and dimensions;
- typography intent;
- image/material language;
- motion/interaction context;
- proxy/truth policy;
- approval truth state.

## Evidence requirements

A complete browser proof requires:

- 15 PNGs for the Du Bonheur three-world benchmark;
- 15 matching HTML sources;
- five cross-world comparison PNGs;
- at least one per-world overview board;
- manifest with file hashes and dimensions;
- no network dependency for proof rendering;
- no automated winner.

## Review boundary

Structural checks may verify coverage, dimensions, output existence, provenance and forbidden claims.

They do not decide whether the work is beautiful, distinctive or worth shipping.

The human/creative-director review after this stage may:

- reject all worlds;
- request a new world;
- request a targeted patch;
- select one world for high-fidelity development.

`Engineering pass ≠ Creative pass.`
