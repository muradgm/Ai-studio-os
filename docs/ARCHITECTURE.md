# Architecture

AI Studio OS separates **control-plane reasoning** from **specialist production runtimes**.

```text
Intent
  ↓
Routing
  ↓
Question / Analyze
  ↓
Research + Inspiration
  ↓
Product Truth
  ↓
Creative Direction
  ↓
Design / Image / Motion runtimes
  ↓
Critique / Review / Red Team
  ↓
Creative Evals
  ↓
Release
  ↓
Learning
```

## Epoch 002 boundary

Epoch 002 does not generate finished production assets by itself. It creates **structured work packets, deterministic routing decisions, and evaluation gates** that an agent or production tool can execute consistently.

The runtime must make these decisions explicit:

- what evidence is still missing,
- what inspiration is being used and why,
- what is being rejected,
- what business/product truths are non-negotiable,
- whether an image should be used, retouched, generatively edited, generated as support, or recaptured,
- what motion is for,
- what quality threshold must be met before approval.
