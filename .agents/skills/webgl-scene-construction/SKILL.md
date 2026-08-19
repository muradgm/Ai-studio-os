---
name: webgl-scene-construction
category: task
description: Constructs a realtime browser scene from an approved spatial specification with explicit camera, scene graph, renderer, asset, interaction, and fallback contracts.
---
# WebGL Scene Construction

## Purpose
Turn an approved spatial concept into a minimal measurable realtime scene before expensive polish.

## When to use
Use when WebGL/WebGPU is justified by actual spatial, shader, particle, or camera requirements.

## Inputs required
Scene brief, camera contract, scene graph, asset manifest, lighting intent, interaction states, renderer policy, responsive/reduced-motion fallback, and performance budget.

## Operating principles
- Start with the smallest representative scene.
- Validate camera and silhouette before material polish.
- Load progressively; essential content must not wait on the scene.
- Keep draw calls, geometry, texture memory, shader cost, and postprocessing observable.
- Make resource ownership/disposal explicit.

## Workflow
1. Validate the realtime scene spec.
2. Create renderer/camera/scene skeleton.
3. Load one representative asset or primitive.
4. Establish lighting/material baseline.
5. Add interaction and motion states.
6. Add optimization/fallback paths.
7. Capture browser evidence at required viewports.
8. Hand off for WebGL and performance review.

## Deliverables
Runnable scene, scene-graph map, asset-loader behavior, renderer fallback, disposal lifecycle, performance evidence, and fallback state.

## Review criteria
The scene implements the approved concept with minimal complexity, stable camera behavior, explicit fallbacks, and measurable resource/runtime behavior.

## Failure modes
Polishing before measurement, essential content inside canvas only, no loading/failure state, no cleanup, excessive postprocessing, fixed desktop camera assumptions, and adding effects unrelated to the brief.

## Handoffs
Owned by Realtime WebGL Engineer with Creative Developer integration. 3D Technical Artist supplies optimized assets. WebGL Review and Performance Budget Review approve independently.
