---
name: product-ux-architecture
description: Freeze interface information architecture, screen hierarchy, navigation, progressive disclosure, and primary user flows before visual design.
category: task
version: 1.0
---

# product-ux-architecture

## Purpose

Translate evidence-backed Product Understanding into a user-facing application structure **before** creative direction is allowed to invent layouts, metaphors, or visual systems.

The goal is to prevent internal runtime architecture from becoming the application's information architecture by accident.

## When to use

- after Product Understanding is review-ready for an interface-centric product;
- before Creative Thesis, Creative Worlds, visual direction, or high-fidelity UI are allowed to define the application structure;
- when the product's internal systems are more complex than the desired default user experience;
- when several art directions need to be compared against the same canonical screens and flows;
- when project continuity, memory, evidence, approvals, or advanced inspectors require explicit progressive-disclosure rules.

Do not require this stage for creative work that has no meaningful application information architecture, such as a standalone image-retouch task.

## Inputs required

- review-ready Product Understanding;
- authored UX/product brief where available;
- product objects, jobs, workflows, governance and trust boundaries;
- primary and secondary user goals;
- known project/context/memory semantics;
- action and approval requirements;
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
- Creative Worlds may express the approved product skeleton, but may not silently replace it.

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

## Deliverables

- `ai-studio-os/product-ux-architecture@1` artifact;
- application-shell definition with dominance and collapse behavior;
- global and project navigation model;
- canonical screen inventory;
- per-screen information and action hierarchy;
- primary journey definitions;
- progressive-disclosure hierarchy and capability visibility contract;
- context-versus-memory semantics;
- reasoning-exposure and governance rules;
- non-negotiables and anti-patterns;
- evidence/provenance for the authored architecture;
- optional neutral structural wireframe proof using the canonical screens.

The artifact authorizes **interface creative exploration**, not final UI production.

## Review criteria

- the primary interaction surface is obvious and aligned with the user's main job;
- navigation reflects user goals rather than implementation topology;
- every canonical screen has a clear purpose, primary information, and primary actions;
- primary journeys can be completed without exposing unnecessary internal machinery;
- advanced reasoning, specialists, providers, tools, and telemetry follow explicit disclosure levels;
- current context and persistent memory are distinguishable;
- memory remains correctable by the user;
- consequential actions make authority, risk, scope, rollback, and approval visible;
- mobile preserves the same product model rather than shrinking desktop;
- raw hidden chain-of-thought is not part of the normal product surface;
- competing Creative Worlds can be evaluated against the same frozen screen and flow contract.

## Failure modes

- mapping runtime modules directly to navigation;
- making agents/models/tools primary destinations without a user-goal reason;
- allowing a Creative World to invent different product screens than competing worlds;
- exposing every reasoning subsystem simultaneously;
- treating project memory as raw chat history;
- hiding external-state changes behind conversational text instead of explicit approval surfaces;
- allowing context panels to permanently compete with the primary workspace;
- reducing mobile to generic cards/chat without preserving project, decision, evidence and authority state;
- freezing visual styling or typography while the information architecture is still unresolved.

## Handoffs

- `product-understanding` supplies product truth, jobs, workflows, trust, governance, and constraints;
- `inspiration` and research operate after the interface skeleton is sufficiently grounded;
- `creative-thesis` receives the frozen interface architecture as a constraint, not a suggestion;
- `creative-world-exploration` creates different expressive worlds around the same canonical product structure;
- `style-frame-proof` compares those worlds on identical product screens and states;
- `product-designer`, `art-direction`, typography, motion, and engineering consume the selected direction without reopening the information architecture unless new product evidence requires it.
