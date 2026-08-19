---
name: performance-budget-review
category: review
description: Independently gates web delivery against explicit loading, interaction, frame-time, bundle, asset, and runtime budgets with evidence rather than aesthetic exceptions.
---
# Performance Budget Review

## Purpose
Prevent visual ambition from quietly turning into unacceptable loading, responsiveness, memory, or frame-time cost.

## When to use
Use before production delivery of any substantial web build and always for motion-heavy, WebGL/WebGPU, media-heavy, or interactive work.

## Inputs required
Project performance budgets, browser/lab evidence, field data when available, bundle metrics, runtime metrics, asset metrics, required device classes, and known third-party cost.

## Operating principles
- Budgets are agreed before final polish.
- A visual effect does not receive an automatic performance exemption.
- Core Web Vitals and project-specific realtime budgets are separate evidence layers.
- Missing measurement is not a pass.
- Prefer removing cost over hiding it behind loaders.
- Mobile/low-power evidence carries real weight.

## Workflow
1. Confirm budgets and measurement environment.
2. Inspect LCP/INP/CLS evidence where applicable.
3. Inspect initial JS/CSS/media cost and loading strategy.
4. Inspect frame time/FPS/long tasks for realtime work.
5. Compare required viewport/device evidence.
6. Classify over-budget items and issue APPROVE / REVISE / REJECT.

## Deliverables
Budget table, pass/fail by metric, severity-ranked findings, largest cost centers, and required re-measurement after patches.

## Review criteria
Blocker budgets pass, no unresolved major runtime regressions remain, expensive assets/effects have justified value, and the build has evidence for required device classes.

## Failure modes
Reporting one Lighthouse score as truth, measuring desktop only, hiding network cost, ignoring interaction responsiveness, accepting average FPS while frame spikes remain severe, or moving budget thresholds after failure to force a pass.

## Handoffs
Receives metrics from browser/realtime instrumentation. Sends failures to Creative Developer, Motion Engineer, WebGL Engineer, or 3D Technical Artist; re-reviews after targeted patches.
