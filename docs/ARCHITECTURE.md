# Architecture

AI Studio OS separates **control-plane reasoning** from **specialist production**.

```text
Intent
  ↓
Routing
  ↓
Question / Analyze
  ↓
Research + Inspiration (when needed)
  ↓
Product / Creative Direction
  ↓
Specialists
  ↓
Critique / Review / Red Team
  ↓
Evals
  ↓
Release
  ↓
Learning
```

Epoch 001 focuses on the control plane. Specialist modules are represented by contracts rather than deep implementation.
