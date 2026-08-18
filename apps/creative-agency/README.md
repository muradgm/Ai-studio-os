# The Creative Agency — Prototype Slice 01

A runnable motion-first Workroom prototype powered by AI Studio OS v1.2.

## Run locally

From the repository root:

```bash
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`).

## Production build

```bash
npm run build:web
npm run preview:web
```

## Current prototype behavior

- project spine: Brief → Research → Explore → Decide → Make → Review → Deliver
- animated SVG handoff/gate field whose state changes with the project stage
- decisions, evidence, Council verdict, and output surfaces
- stage keyboard shortcuts `1`–`7`
- `Cmd/Ctrl + K` command focus
- reduced-motion support
- responsive desktop/mobile layout
- command execution is intentionally stubbed until the next slice wires UI state to the provider-agnostic AI Studio OS router

## Identity note

The small Bounded Flow-style glyph used as the prototype favicon/UI marker is **provisional UI art**, not an approved canonical logo master. v1.2 Logo Integrity must not freeze it until a logo candidate is explicitly approved through the logo workflow.
