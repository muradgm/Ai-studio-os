# Product Understanding V1 Contract

## Purpose

Creative work must not begin from a product name, a category label, or a visual reference alone.

`Product Understanding` is the upstream evidence-backed product model that must become review-ready before AI Studio OS is allowed to create a Creative Thesis, Creative Worlds, or art direction.

The question it answers is:

> What does AI Studio believe this product actually is, how does it behave, why does it matter, and which truths must constrain creative work?

## Governing sequence

```text
PROJECT / REPOSITORY / BUSINESS SOURCES
        ↓
PRODUCT DISCOVERY
        ↓
PRODUCT UNDERSTANDING
        ↓
EVIDENCE + UNCERTAINTY REVIEW
        ↓
READY-FOR-CREATIVE-THESIS
        ↓
RESEARCH / INSPIRATION
        ↓
CREATIVE THESIS
        ↓
CREATIVE WORLDS
```

A visually attractive brief is not a substitute for product understanding.

## Required model

Schema:

```text
ai-studio-os/product-understanding@1
```

The report should model:

- product definition, category and stage,
- problem being solved,
- primary and secondary users,
- primary and secondary jobs,
- core workflow,
- core product objects,
- important actions and states,
- value proposition,
- differentiators and alternatives,
- product mechanics,
- intelligence/automation behavior when relevant,
- trust, risk and governance model,
- desired and undesired perception,
- non-negotiables and constraints,
- category conventions and clichés,
- opportunities to break convention,
- unknowns and assumptions,
- evidence and provenance,
- confidence.

## Evidence requirements

Evidence entries must contain a concrete `sourceRef`, claim and one or more supported product-model dimensions.

Required evidence dimensions:

```text
definition
problem
users
jobs
workflow
mechanics
differentiation
trust
governance
perception
```

Evidence may come from repositories, product docs, live product/runtime inspection, approved briefs, research, customer evidence, analytics, interviews, or other concrete project sources.

Do not label assumptions as facts.

## Authorship boundary

The deterministic runtime validates, normalizes and gates a Product Understanding report. It does not invent senior product understanding from templates.

A review-ready report requires:

```json
{
  "authorship": {
    "mode": "authored-from-evidence"
  }
}
```

An agent or human must inspect the real project and author the product model from evidence.

## Gate semantics

Possible states:

```text
blocked
provisional
ready-for-creative-thesis
```

`ready-for-creative-thesis` requires:

- no blockers,
- no major findings,
- sufficient evidence coverage,
- evidence-backed authorship,
- confidence >= 0.75.

If the gate is not review-ready:

```text
DO NOT CREATE CREATIVE THESIS
DO NOT CREATE CREATIVE WORLDS
DO NOT GENERATE ART DIRECTION
```

The next action is investigation, evidence acquisition, or explicit clarification.

## Anti-patterns

Reject these shortcuts:

- infer the whole product from its name,
- design from screenshots of another AI Studio OS project,
- treat a repository README as sufficient when runtime/workflow evidence contradicts it,
- turn category clichés into creative truths,
- define the product as its implementation technology,
- describe “multiple agents” as the value proposition without proving why coordination matters,
- hide material unknowns so the pipeline can continue,
- let visual references become product strategy.

## Creative handoff

Product Understanding supplies the truth layer. It does **not** choose colors, typography, composition, imagery, motion, or layout.

Its downstream job is to make better creative questions possible:

- Which product behavior is most ownable?
- Which trust/governance mechanic deserves visual expression?
- Which category convention misrepresents the product?
- Which tension is specific enough to become a Creative Thesis?
- What must remain true across every world even when the visual language changes radically?
