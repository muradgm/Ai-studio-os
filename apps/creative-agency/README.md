# The Creative Agency — Command Center Execution Slice

A runnable Workroom + local execution Command Center powered by **AI Studio OS v1.3**.

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

The **Run build + review** action now executes a real local pipeline:

1. runs the whitelisted production build (`npm run build:web`)
2. serves that built artifact from the execution service
3. launches real Playwright Chromium
4. captures desktop, tablet and mobile in full + reduced-motion states
5. records browser errors and horizontal-overflow evidence
6. measures built JS/CSS byte totals
7. runs v1.3 delivery gates
8. creates a bounded patch queue from findings
9. displays live preview, screenshots, evidence and findings in the Command Center
10. allows explicit **iteration approval** without overriding release gates

## Evidence policy

Production readiness fails closed.

The first execution slice measures browser capture, responsive evidence and built bundle size. It does **not** yet perform complete field/lab Web Vitals, realtime frame profiling, or a full accessibility audit. Those appear as **UNMEASURED** and remain release blockers rather than silently becoming PASS.

## Security boundary

The local executor:

- binds to `127.0.0.1`
- accepts only known project ids
- maps projects to whitelisted npm scripts
- uses shell-free child processes
- blocks path traversal for previews/artifacts
- caps JSON request bodies and retained logs
- does not execute arbitrary text from the command bar

Free-form AI source mutation is not connected in this slice. Patch instructions are auditable findings; a future write adapter must preserve repository approval/security rules before it can apply source changes automatically.

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

The provisional Bounded Flow-style favicon/UI glyph remains **prototype UI art**, not an approved canonical logo master.
