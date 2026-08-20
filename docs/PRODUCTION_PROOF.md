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

This is the foundational production data model for Command Center production truth, Brand Kit coherence, production adapters, delivery, provenance/rights, memory, review/evidence and future runtime consolidation.

### P1 — Runtime consolidation

Move toward a shared `StudioRuntime` primitive with capability, task, artifact, review, approval, evidence and tool registries. Existing creative/engineering/multimodal/observation/logo/brand-kit runtimes should migrate incrementally; no flag-day rewrite.

### P1 — Real production adapters

**Production adapter foundation merged in PR #25.** The shared execution boundary routes only explicitly assigned adapters, writes real output files, normalizes output into universal Artifacts, returns Artifact Graphs, and fails closed when output/provenance constraints are not satisfied.

**Vector production merged in PR #26.** `local-svg` writes real SVG masters and records vector hygiene evidence without self-declaring creative/logo approval.

**OpenAI image production merged in PR #27.** `openai-image` provides hosted raster generation/edit through a credential-gated provider boundary and writes real validated output files.

**ComfyUI local raster PR #28 is CI-green.** `comfyui-image` executes supplied API-format workflows through the local prompt/history/view HTTP boundary, writes real raster Artifacts and keeps remote execution opt-in.

**Active stacked slice: `feature/gemini-image-adapter-v1`.** Add a second hosted image provider using Google's current Gemini Interactions image API. `gemini-image` defaults to `gemini-3.1-flash-image`, supports the current Flash Lite/Flash/Pro image family, writes real PNG/JPEG output, accepts auditable local reference images for editing, enforces provider-specific size/aspect capabilities and the 20 MB inline-request boundary, and records SynthID as expected provider provenance rather than a locally verified watermark.

The adapter roadmap now is:

- vector/SVG — merged
- OpenAI hosted raster generation/edit — merged
- ComfyUI local raster generation — PR #28 green
- Gemini hosted raster generation/edit — active
- capability/evidence-aware provider comparison and routing — next after hosted/local breadth is stable
- OpenClaw — evaluate as a gateway/orchestration adapter, not a fake image provider
- Claude/DeepSeek — evaluate in creative-direction/review recipes where benchmarks prove value
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
