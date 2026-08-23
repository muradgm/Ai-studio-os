---
name: product-understanding
description: Build an evidence-backed model of what a product is, who it serves, how it behaves, why it matters, and which truths must constrain downstream creative work.
category: task
version: 1.0
---

# product-understanding

## Purpose

Understand the real product before creative thesis, visual worlds, branding, interface art direction, or image generation begins.

This skill converts repositories, product docs, runtime behavior, approved briefs, research, and other concrete evidence into a reviewable `ai-studio-os/product-understanding@1` report.

## When to use

Use for:

- brand-defining product work,
- landing pages and launch experiences,
- visual identity for software/products,
- Creative World exploration,
- major redesigns,
- projects supplied primarily as a repository or technical description,
- any case where visual references risk becoming a substitute for product strategy.

Do not skip this because a product already has a name, logo, README, or existing UI.

## Inputs required

Use the strongest available evidence, such as:

- repository README and handoff docs,
- architecture and workflow docs,
- real product routes/screens/runtime behavior,
- tests and contracts that reveal actual invariants,
- product/brand strategy documents,
- approved user/business briefs,
- analytics, research, interviews or customer evidence when available,
- current implementation state and known roadmap boundaries.

## Operating principles

- Product mechanics are more useful than adjectives.
- Separate what exists now from roadmap intent.
- Separate product truth from brand aspiration.
- Separate evidence from assumptions.
- The product is not its technology stack.
- The product is not its category cliché.
- The product is not its current UI.
- “AI agents” are not automatically the differentiator; identify the actual value created by orchestration, governance, memory, evidence, execution, or other mechanics.
- Read contradictions as evidence that the model needs qualification, not averaging.
- Do not design while performing this skill.

## Workflow

1. **Establish source boundary**
   - Record project/repository and revision where possible.
   - Distinguish current implementation, validated behavior, planned behavior, and aspiration.

2. **Define the product**
   - State what it is in concrete language.
   - Identify the category/competitive frame without forcing a misleading category.

3. **Model user value**
   - Identify primary/secondary users.
   - State primary jobs and the problem being solved.
   - Record the value proposition in behavioral/outcome terms.

4. **Model mechanics**
   - Extract core workflow.
   - Identify core objects, actions, important states, intelligence/automation behavior, and system boundaries.

5. **Model trust and governance**
   - What can the system decide?
   - What requires evidence, approval, review, validation, rollback, or human authority?
   - What would make the product unsafe or untrustworthy?

6. **Find differentiation**
   - Compare product mechanics to plausible alternatives.
   - Identify what is structurally unusual or strategically valuable.
   - Reject superficial differentiators that are merely implementation choices.

7. **Map perception**
   - Desired perception.
   - Undesired perception.
   - Category conventions and clichés that could misrepresent the product.
   - Product-grounded opportunities to break convention.

8. **Map evidence**
   - Every major claim needs a concrete source reference.
   - Cover definition, problem, users, jobs, workflow, mechanics, differentiation, trust, governance, and perception.

9. **Expose uncertainty**
   - Keep assumptions and unknowns visible.
   - Do not increase confidence by omitting uncertainty.

10. **Run Product Understanding review**
   - Creative work may proceed only when the report is `ready-for-creative-thesis`.

## Deliverables

- `ai-studio-os/product-understanding@1` report.
- Evidence map with source refs and supported dimensions.
- Confidence and unresolved unknowns.
- Non-negotiables for downstream creative work.
- Category cliché / opportunity map.
- Explicit `ready-for-creative-thesis | provisional | blocked` state.

## Review criteria

A strong report lets an art director answer:

- What behavior is actually ownable here?
- What would a generic category treatment get wrong?
- Which tensions arise from the product itself rather than from current design taste?
- Which visual metaphors are too literal or misleading?
- What must stay true even if three Creative Worlds look radically different?

The report should survive comparison against the repository/runtime without relying on persuasive prose.

## Failure modes

- designing from the current app screenshot,
- treating README marketing language as complete product truth,
- vague users such as “everyone” or “businesses”,
- generic jobs such as “be more productive”,
- naming technologies instead of mechanics,
- confusing multi-agent count with user value,
- inventing customer demand or product maturity,
- hiding roadmap gaps,
- producing visual directions before the understanding gate passes.

## Handoffs

- `brand-strategist` may use this report for positioning, but cannot rewrite product truth without evidence.
- `creative-thesis` consumes the reviewed product model and research opportunity.
- `art-direction` and Creative Worlds inherit its non-negotiables and perception boundaries.
- `creative-skeptic` should challenge unsupported differentiation and category-breaking claims.
