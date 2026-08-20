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

### P0 — Command Center truth + native architecture

**Artifact-backed state merged in PR #23.** The Command Center now has a deterministic projection of Artifact Graph truth with explicit `blocked`, `stale`, `review`, `queued`, `produced`, `approved`, and `released` states.

**Native architecture is implemented in PR #24 and CI is green.** It removes the DOM-decorator/CSS-override shell and makes the approved dense production workspace the real frontend structure. Keep PR #24 unmerged until the final 1440×900 / 1600×900 visual fidelity check can be performed on desktop.

### P0 — Universal Artifact + Artifact Graph

**Foundation merged in PR #20.** The shared `ai-studio-os/artifact@1` and `ai-studio-os/artifact-graph@1` contracts now model versioned artifacts, dependencies, cycles and downstream stale/review impact without silently mutating descendants.

**Brand Kit projection merged in PR #22.** Brand DNA, identity assets, representative applications and the Brand Kit manifest now participate in the shared graph without fabricating package files.

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

**Production adapter foundation merged in PR #25.** The shared execution boundary now routes only explicitly assigned adapters, writes real output files, normalizes output into universal Artifacts, returns Artifact Graphs, and fails closed when output/provenance constraints are not satisfied.

**Vector production merged in PR #26.** `local-svg` writes real SVG masters, records SHA-256/bytes/structural measurements, rejects unsafe/external/raster/font-dependent content when required, and never self-declares creative/logo approval.

**OpenAI image slice PR #27 is implemented and its pre-reconciliation CI run was green.** The branch has been reconciled to the merged SVG foundation and now has a clean one-commit diff against `main`; post-reconciliation CI remains the merge gate. `openai-image` uses OpenAI's Image API for routed raster generation/edit jobs, writes decoded provider output to real local files, preserves provider/model/request provenance, validates output format bytes, and remains unavailable without an explicit API credential.

**Active stacked slice: `feature/comfyui-image-adapter-v1`.** Add the first local raster-production adapter. `comfyui-image` executes a supplied ComfyUI API-format workflow through the native prompt/history/view HTTP surface, accepts loopback execution by default, writes the returned raster to a real local Artifact, and records prompt/output provenance without pretending local compute is free or creatively approved.

The adapter roadmap remains:

- vector/SVG — merged
- image generation/edit — OpenAI external adapter in PR #27
- local raster generation — active ComfyUI slice
- Gemini image adapter — next hosted-provider candidate after local raster proof
- gateway/orchestration adapters — evaluate OpenClaw after direct-provider/local capability is stable
- review/planning providers — Claude/DeepSeek should enter recipes where benchmarked value justifies them rather than being mislabeled as image producers
- video
- audio/voice
- 3D/Blender where available
- browser/web/code
- document/guideline export — foundation proof merged

Adapters must record real output refs, provenance, rights, cost and failures. Unavailable adapters fail closed. Adapter success never implies creative approval or release readiness.

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
