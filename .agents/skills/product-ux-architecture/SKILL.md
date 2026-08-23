---
name: product-ux-architecture
description: Freeze interface information architecture, screen hierarchy, navigation, progressive disclosure, and primary user flows before visual design.
category: task
version: 1.0
---

# product-ux-architecture

## Purpose

Translate evidence-backed Product Understanding into a user-facing application structure **before** creative direction is allowed to invent layouts, metaphors, or visual systems.

Use this skill for products where internal architecture is substantially more complex than the desired user experience.

## Inputs

- review-ready Product Understanding;
- authored UX/product brief where available;
- product objects, jobs, workflows, governance and trust boundaries;
- target user sophistication;
- known desktop/mobile constraints.

## Operating principles

- Design around user goals, not module names.
- Prefer familiar interaction models where familiarity lowers cognitive load.
- Keep the primary task surface dominant.
- Make supporting context collapsible or contextual.
- Use progressive disclosure for trust, reasoning detail, agents, tools, models and telemetry.
- Do not expose raw hidden chain-of-thought; expose structured conclusions, evidence, alternatives, confidence and uncertainty where useful.
- Distinguish current context from persistent memory.
- Preserve user authority over editable project memory.
- Treat approvals as product UX, not a backend implementation detail.
- Infrastructure concepts are not default primary navigation.
- Mobile must preserve the task model rather than miniaturize desktop.

## Workflow

1. Restate the product's primary interaction model.
2. Define the shell and identify the dominant region.
3. Define global navigation by user goals.
4. Define project-level navigation by project work objects.
5. Specify canonical screens.
6. For each screen define purpose, primary information, secondary information, primary actions, entry points and exit paths.
7. Define the progressive-disclosure hierarchy.
8. Define context vs memory semantics and user authority.
9. Define reasoning inspection and action-approval boundaries.
10. Walk the primary journeys end-to-end.
11. Record anti-patterns that future visual design is forbidden to reintroduce.
12. Freeze the architecture for comparative Creative World proof.

## Deliverable

`ai-studio-os/product-ux-architecture@1`

The artifact authorizes **interface creative exploration**, not final UI production.

## Failure modes

- mapping runtime modules directly to navigation;
- making agents/models/tools primary destinations without a user-goal reason;
- allowing a Creative World to invent different product screens than competing worlds;
- exposing every reasoning subsystem simultaneously;
- treating project memory as raw chat history;
- hiding external-state changes behind conversational text instead of explicit approval surfaces;
- allowing context panels to permanently compete with the primary workspace;
- reducing mobile to generic cards/chat without preserving project, decision, evidence and authority state.
