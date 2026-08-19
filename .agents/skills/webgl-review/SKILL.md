---
name: webgl-review
category: review
description: Independently reviews realtime browser graphics for renderer architecture, scene lifecycle, asset cost, shader/material discipline, camera behavior, fallbacks, and GPU failure safety.
---
# WebGL Review

## Purpose
Determine whether the realtime layer is technically justified, stable, measurable, and safe enough to remain in the production experience.

## When to use
Use for any production build containing Three.js, WebGL, WebGPU, custom shaders, realtime particles, spatial camera systems, or GPU-heavy visual effects.

## Inputs required
Live build, scene spec, asset manifest, renderer/fallback decision, resource metrics, browser captures, device evidence, cleanup lifecycle, and known limitations.

## Operating principles
- Realtime graphics must earn their cost.
- Essential content must survive renderer failure.
- Review scene lifecycle as aggressively as scene appearance.
- High-end desktop success does not establish production readiness.
- Missing evidence is a finding, not permission to assume success.

## Workflow
1. Confirm the realtime requirement cannot be met more simply without harming the concept.
2. Inspect renderer/fallback and scene graph.
3. Review camera, loading, resize, route/disposal, and failure paths.
4. Inspect geometry, draw calls, textures, materials, shaders, postprocessing, and animation cost evidence.
5. Test low-performance/reduced-motion behavior.
6. Classify findings and issue APPROVE / REVISE / REJECT.

## Deliverables
Verdict, renderer/lifecycle findings, asset/shader findings, fallback assessment, severity ranking, and required re-test evidence.

## Review criteria
Realtime graphics materially support the concept, fail safely, fit budgets, clean up resources, adapt across devices, and do not hide essential content or input behind GPU success.

## Failure modes
Reviewing FPS only, ignoring memory/disposal, accepting missing fallbacks, rewarding shader complexity, approving fixed desktop cameras, or assuming WebGPU availability.

## Handoffs
Receives build evidence from Realtime WebGL Engineer and 3D Technical Artist. Sends findings into the patch loop and coordinates blocking performance issues with Performance Budget Review.
