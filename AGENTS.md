# AI Studio OS agent instructions

## Operating rule
Start from intent. Do not invoke modules because they exist. Invoke them because the task justifies them.

## Default decision loop
1. Clarify the intended outcome from available context.
2. Route to the smallest sufficient workflow.
3. Separate analysis from recommendation.
4. Use council only for consequential, uncertain, expensive, or hard-to-reverse decisions.
5. For creative work, calibrate with inspiration before committing to art direction.
6. Preserve business/product truth, especially when editing or generating imagery.
7. Preserve dissent when reviewers disagree.
8. Distinguish defects from taste preferences.
9. Evaluate before release.
10. Observe real outcomes before promoting durable lessons.

## Command semantics
- `question`: identify missing information and hidden assumptions.
- `analyze`: diagnose without prematurely solving.
- `council`: independent specialist review, cross-critique, challenge, synthesis.
- `critique`: find weaknesses in an artifact or proposal.
- `red-team`: attempt to falsify or break the leading solution.
- `review`: compare execution against agreed intent and criteria.
- `improve`: apply only validated improvements.

## Creative runtime rules
- Inspiration must include direct industry, adjacent industries, trends, anti-references, and opportunity gaps.
- Do not average contradictory references into generic compromise; choose a direction.
- For real businesses, prefer real assets and controlled edits. Missing truthful product imagery should trigger new capture before synthetic documentary representation.
- Motion is designed with reduced-motion and performance constraints from the start.
- A high average eval score does not override critical failures in authenticity, accessibility, brand fit, or business clarity.

## Creative production v1.1 rules
- Decompose references into transferable principles; never treat a reference as permission to reproduce its exact composition or style package.
- Write a Design Read before concept generation so the system states what it understood about the business, emotional target, category expectation, opportunity, memorable idea, and risks.
- Creative Dials are calibration constraints, not taste scores. Every dial needs a 0–10 value and a rationale.
- Diverge before converging: serious creative work should explore 3–5 genuinely different concepts, not cosmetic variants of one layout.
- Concept selection must explain rejected alternatives and define kill criteria.
- Prototype Mode is explicitly non-final. Production Mode requires strict truth, rights, accessibility, and performance expectations.
- Production Recipes describe reusable production patterns; they must not hard-code a provider.
- The Creative Tool Gateway selects adapters by capability, availability, budget, and explicit task priority—not vendor identity.
- Truth-sensitive real products or people cannot route to synthetic documentary generation. Require real-source editing or new capture.
- Every generated/edited asset gets a stable asset ID, version, direction reference, continuity reference, provenance/rights state, and dependency record.
- Regenerate weak assets surgically. Patch only validated blocker/major findings, preserve continuity/direction constraints, and require integration review after replacement.
- Cap repeated patch attempts; endless regeneration is a process failure, not iteration.

## Logo identity v1.2 rules
- Every serious logo project must assess all seven types: wordmark, lettermark/monogram, pictorial mark, abstract mark, mascot, combination mark, and emblem. Assessment is mandatory; exploration can shortlist only the types that fit.
- Logo psychology is a set of testable hypotheses, not a dictionary of universal symbols. Require intended effect, evidence basis, test method, and falsifier.
- Treat color associations as contextual/cultural. Do not encode one-to-one rules such as blue = trust or black = luxury.
- Evaluate processing fluency, shape semantics, complexity, harmony, abstraction, typography, figure-ground, and distinctiveness/familiarity.
- Use LogoLounge for curated/trend intelligence, LogoSystem for type/style/shape/motion filtering, LogoMoose for long-tail identity/packaging context, and Inspiration Logo for wildcard/negative-space exploration.
- Inspiration references require provenance plus take/reject/transform notes. Copying exact marks, geometry, lockups, or motion is blocked.
- Explore at least three genuinely different logo concept families before refinement.
- Generated raster marks are concept sketches only. Final logo masters require vector reconstruction and optical refinement.
- The canonical mark specification sits above SVG and locks viewBox, stable shape IDs, geometry fingerprints, transforms, bounding boxes, palette tokens, shape-to-layer assignments, layer order, masks/clips, and intended overlap relationships.
- SVG export cannot reinterpret the design: palette drift, raw unapproved colors, extra/missing shapes, geometry drift, viewBox drift, embedded raster artwork, or non-normalized transforms block approval.
- Multi-layer marks require an explicit layer manifest. Layer z-order, role, opacity, masks/clips, and shape membership are invariants.
- Intended overlaps require explicit pair IDs, overlap mode, ownership, and intersection-area signature/tolerance. Unexpected overlaps or layer-occlusion violations block approval.
- Require render-diff evidence against the canonical master at 16, 32, 64, and 128 px; visible export drift is blocking even if the SVG parses correctly.
- Build a responsive identity system: primary lockup, secondary lockup, symbol, micro mark, wordmark, favicon.
- Stress-test monochrome, inverse, 16/32/64/128px, favicon/app icon, web header, social avatar, print, signage, and stamp/embroidery-like reproduction.
- Block approval on unresolved originality/confusion risk, weak small-size behavior, poor optical quality, or excessive AI-generic risk.
- Derive logo motion from structural/concept logic; do not animate decoratively.

## Engineering runtime rules
- Classify change risk before implementation; do not infer safety from small diff size.
- Define invariants and required tests before code review.
- Code review and security review are separate gates.
- Missing required tests block review.
- Permission-sensitive changes require server-side authorization, least privilege, and auditability.
- State mutations require validation and a transaction/recovery boundary.
- High-risk changes require explicit rollback and observability plans before release.
- Release readiness is boolean evidence, not an averaged confidence score.

## Multimodal runtime rules
- Storyboard and timing precede media generation.
- Storyboard, video, voice, and audio inherit one shared creative direction; cross-modal drift blocks approval.
- Use a continuity bible for facts and visual decisions that must remain stable across shots.
- Truth-sensitive real visuals require real-source evidence; unresolved capture remains pending.
- Voice usage rights are required, and voice cloning requires explicit consent evidence.
- Commercial music requires concrete rights evidence, not a label alone.
- Spoken content requires captions and transcript.
- Aspect-ratio variants require intentional recomposition; do not blindly crop a master.
- A multimodal plan is approved only when timing, continuity, truth, rights, accessibility, and creative coherence all pass.

## Observation loop rules
- Metric movement is not evidence quality; require a launch hypothesis and validate source type/provenance, sample, window, baseline, observed values, and threshold justification before interpretation.
- Use metric-specific meaningful-change thresholds and keep flat movement distinct from improvement.
- Guardrail regressions are not averaged away by primary metric gains.
- Default post-launch attribution to correlational; causal language requires evidenced controlled experiments.
- Unsupported anecdotes do not become reliable feedback themes.
- Preserve benchmark regression history while distinguishing active failures from recovered ones.
- Project rules require independent evidence sources in one context; global rules additionally require evidenced recurrence across at least two distinct contexts.
- Reliable conflicting evidence rejects a candidate learning rather than being averaged into consensus.

## Quality bar
Prefer explicit tradeoffs, evidence, and testable claims over confident generic prose.
