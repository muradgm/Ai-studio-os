# Production Proof Phase

## Decision

AI Studio OS has enough broad architecture for the current product stage. The next phase is **Production Proof**: prove that the existing system can repeatedly create, observe, critique, patch, package and deliver real creative work.

Until a real production benchmark demonstrates a missing capability, broad architecture expansion is frozen.

## Working branch policy

New work should use one of three branch classes:

- `feature/*` — intended product/runtime improvements with a clear path to `main`
- `experiment/*` — disposable explorations or benchmarks that must prove value before promotion
- `release/*` — stabilization only; no speculative capability expansion

Merged historical epoch/slice/run branches should be archived or removed after confirming no unique work remains. Git tags/commits preserve history better than permanent branch archaeology.

## Phase order

### P0 — Finish the current Command Center fidelity pass

The approved visual reference is the layout/design contract. Finish PR #19 visually, then refactor the temporary DOM-decorator/CSS-override implementation into the real frontend structure. Preserve measured runtime IDs and evidence behavior.

### P0 — Universal Artifact + Artifact Graph

Create one shared Artifact contract for logo, image, icon, motion, code, web, video, audio, 3D, document and delivery outputs. Model explicit dependencies and deterministic downstream invalidation/review requirements.

This is the foundational production data model for:

- Command Center production queue
- Brand Kit dependency coherence
- external production adapters
- packaging/delivery
- provenance/rights
- memory
- review/evidence
- future runtime consolidation

### P1 — Runtime consolidation

Move toward a shared `StudioRuntime` primitive with capability, task, artifact, review, approval, evidence and tool registries. Existing creative/engineering/multimodal/observation/logo/brand-kit runtimes should migrate incrementally; no flag-day rewrite.

### P1 — Real production adapters

Implement provider-neutral adapters that execute jobs and return universal Artifacts:

- image generation/edit
- vector/SVG
- video
- audio/voice
- 3D/Blender where available
- browser/web/code
- document/guideline export

Adapters must record real output refs, provenance, rights, cost and failures. Unavailable adapters fail closed.

### P1 — Creative Agency Brand Kit dogfood

Use The Creative Agency itself as the first full production benchmark. Produce actual openable files for Brand DNA, logo, personalized icon family, type/color tokens, imagery, motion, applications and guidelines.

### P1 — Council economics

Measure reviewer value instead of assuming more agents improve quality. Track findings raised, findings accepted, patches caused, quality gain and cost. Remove low-value reviewers from recipes.

### P1 — Skill quality tiers

Classify skills as `core`, `specialist`, `experimental`, or `deprecated`; attach benchmark status, cost/trigger information, known limitations and last validation.

### P1 — Creative-quality / anti-generic review

Add evidence-oriented checks for category-default identity, cosmetic concept variation, generic AI visual tropes, weak proprietary gestures and inspiration drift. Do not reduce creative judgment to one score.

### P2 — Memory separation

Separate project, brand, decision, artifact, learning and user-preference memory. Prevent project-local creative choices from being promoted into universal user preferences without evidence.

### P2 — Security hardening before remote execution

Keep execution local until workspace isolation, filesystem/network boundaries, secret management, resource limits, provider scopes, artifact sanitization and audit logging are designed and tested.

### P2 — Narrow sellable promise

Product surface: **The Creative Agency**.
Engine: **AI Studio OS**.

Initial sellable promise:

> From brief to production-ready brand system and digital launch experience, with specialist critique and measurable release evidence.

Do not broaden the commercial promise until this workflow is proven end to end.

## Phase rule

For every proposed new subsystem ask:

1. Which real production benchmark is blocked without it?
2. Can an existing capability solve the problem with a smaller change?
3. What openable artifact or measured outcome will prove the new subsystem works?

If those questions cannot be answered, defer the subsystem.
