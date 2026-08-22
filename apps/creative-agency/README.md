# The Creative Agency — Command Center

A runnable Workroom + local measured execution Command Center powered by **AI Studio OS v1.3**.

## Run locally

From the repository root:

```bash
npm install
npm run dev
```

`npm run dev` starts both:

- the Vite Workroom UI (normally `http://localhost:5173`)
- the local execution service at `http://127.0.0.1:8787`

You can also run them separately:

```bash
npm run dev:execution
npm run dev:web
```

## What is real in this slice

The **Run measured review** action executes a real local pipeline:

1. runs the whitelisted production build (`npm run build:web`)
2. serves that built artifact from the execution service
3. launches real Playwright Chromium
4. captures desktop, tablet and mobile in full + reduced-motion states
5. records browser errors and horizontal-overflow evidence
6. measures built JS/CSS byte totals
7. measures lab LCP and CLS with PerformanceObserver
8. runs a labelled safe-click-to-next-paint interaction latency proxy for INP-style responsiveness
9. samples requestAnimationFrame FPS / max frame time and Long Tasks
10. records Chromium JS heap evidence when available
11. runs automated semantic checks plus real keyboard traversal and focus-indicator inspection
12. verifies reduced-motion media mode has no continuous runtime animations
13. compares reduced-motion captures with the last approved visual baseline
14. runs v1.3 delivery gates and synthesizes a release decision
15. creates a bounded patch queue from findings
16. writes a downloadable JSON release report
17. allows explicit **iteration approval**, promoting reduced-motion screenshots as the next visual baseline only when the release is production-ready

## Evidence policy

Production readiness fails closed.

Required evidence lanes are:

- Web Vitals / interaction responsiveness
- runtime performance
- bundle size
- accessibility baseline
- responsive behavior
- reduced-motion runtime behavior
- visual regression state

A present object with `measured:false` is treated as unmeasured. Missing evidence cannot silently become PASS.

### Important scope boundaries

The interaction value stored in `inpMs` is a **controlled lab proxy** measured from a safe Playwright click to the second animation frame. It is not field CrUX INP and must be presented as such.

The accessibility lane checks programmatic names/labels, duplicate IDs, image alt presence, iframe titles, zoom restrictions, tabindex misuse, keyboard traversal and visible focus behavior. It is an automated release baseline—not a replacement for complete manual WCAG testing with assistive technology.

Visual regression uses approved **reduced-motion** screenshots so continuous motion does not create meaningless pixel noise. The first approved production-ready iteration seeds the baseline; following iterations are compared against it.

## Security boundary

The local executor:

- binds to `127.0.0.1`
- accepts only known project ids
- maps projects to whitelisted npm scripts
- uses shell-free child processes
- blocks path traversal for previews/artifacts
- caps JSON request bodies and retained logs
- does not execute arbitrary text from the command bar

Free-form AI source mutation is still not connected. Patch instructions are auditable findings; a future write adapter must preserve repository approval/security rules before it can apply source changes automatically.

## Production build

```bash
npm run build:web
npm run preview:web
```

## Validation

```bash
npm test
npm run build:web
npx playwright install chromium
npm run test:command-center
```

The Command Center smoke performs two measured executions: the first establishes/promotes a production-ready approved baseline, and the second verifies measured visual regression against that baseline.

The provisional Bounded Flow-style favicon/UI glyph remains **prototype UI art**, not an approved canonical logo master.
