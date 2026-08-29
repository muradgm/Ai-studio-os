# Agent Instruction Hierarchy V1

Status: implemented instruction architecture for repository/Codex work.

## Purpose
AI Studio OS uses hierarchical `AGENTS.md` files to keep invariant rules close to the scope where they matter without forcing every task to load every specialist playbook.

The design separates four kinds of context:

```text
AGENTS.md        = rules that must be obeyed while working in a scope
SKILL.md         = reusable professional procedure/craft knowledge
architecture doc = system explanation, status, rationale, boundaries
task prompt      = the current objective and acceptance criteria
```

## Hierarchy

```text
/
├── AGENTS.md
├── .agents/
│   ├── AGENTS.md
│   └── skills/**/SKILL.md
├── modules/
│   └── AGENTS.md
├── lib/
│   └── AGENTS.md
├── test/
│   └── AGENTS.md
├── fixtures/
│   └── AGENTS.md
└── docs/architecture/
    └── AGENTS.md
```

### Root `AGENTS.md`
Contains only repository-wide invariants: scope discipline, authority integrity, evidence/truth, compatibility, core creative principles, engineering/release discipline, and validation/completion behavior.

A rule belongs at root only when it should affect almost every repository task.

### `.agents/AGENTS.md`
Owns skill-authoring and skill-catalog rules: role/task/review/recipe boundaries, routing restraint, maker/reviewer independence, required skill structure, and the anti-sprawl gate.

Detailed professional knowledge remains in the individual `SKILL.md` files.

### `modules/AGENTS.md`
Owns runtime/specialist contract rules: candidate/review/evidence/human/canonical separation, canonical authority rebinding, schema semantics, specialist authority boundaries, provider-neutral production intent, and consequential negative testing expectations.

When module behavior changes a domain contract, the relevant domain skill and architecture document must also be consulted.

### `lib/AGENTS.md`
Owns shared-library/integration constraints: stable interfaces, deterministic helpers, no hidden domain authority, no silent mode changes, fail-closed consequential inputs, and conservative abstraction.

### `test/AGENTS.md`
Owns test doctrine: prove invariants, use real builders for valid authority chains, allow hand-shaped adversarial invalid cases, add regressions for corrected failures, and never weaken valid tests merely to restore green CI.

### `fixtures/AGENTS.md`
Owns fixture truth: no fabricated human approval/evidence, deterministic identity, internally consistent valid chains, explicit adversarial fixtures, and migration with schema/authority changes.

### `docs/architecture/AGENTS.md`
Owns architecture-document discipline: distinguish implemented/proposed/deferred/historical states, keep documentation bound to executable truth, and prevent diagrams/roadmaps from masquerading as runtime authority.

## Precedence policy
The root file is the repository constitution. Nested files add local constraints for their subtree. A child instruction file may be more specific or stricter, but it should not relax root authority, evidence, truth, security, or compatibility invariants.

If two instructions appear to conflict:
1. preserve root safety/authority/truth invariants;
2. apply the nearest scope-specific instruction for implementation detail;
3. inspect the canonical architecture/runtime contract;
4. report unresolved ambiguity rather than guessing.

## Why detailed domain rules are not kept in root
The repository already has dedicated skills for creative production, logo design/integrity/inspiration, vector geometry, motion, multimodal production, observation, WebGL/3D, image direction, review, and other domains.

Loading those playbooks into every task creates irrelevant context and encourages cross-domain leakage. The root therefore carries only durable cross-domain invariants; domain craft is loaded when the task actually touches that domain.

## When to add another nested `AGENTS.md`
Do not create one merely because a directory exists.

A new child file must earn its existence through at least one of these conditions:
- a durable local invariant is repeatedly violated;
- the subtree has a distinct authority/security/compatibility model;
- tasks in the subtree repeatedly need instructions that are irrelevant elsewhere;
- the local rules are stable enough to outlive one feature slice.

Prefer improving an existing parent instruction file or a domain `SKILL.md` when the need is procedural rather than scope-invariant.

## Typical loading patterns

Module/runtime change:
```text
/AGENTS.md
+ /modules/AGENTS.md
+ relevant SKILL.md / architecture contract on demand
+ task prompt
```

Test-only change:
```text
/AGENTS.md
+ /test/AGENTS.md
+ task prompt
```

Fixture change:
```text
/AGENTS.md
+ /fixtures/AGENTS.md
+ task prompt
```

Skill change:
```text
/AGENTS.md
+ /.agents/AGENTS.md
+ target SKILL.md
+ task prompt
```

Architecture-doc change:
```text
/AGENTS.md
+ /docs/architecture/AGENTS.md
+ task prompt
```

## Maintenance rule
When a new rule is proposed, classify it before adding it:

```text
universal invariant?      -> root AGENTS.md
subtree invariant?        -> nearest AGENTS.md
reusable domain procedure -> SKILL.md
system explanation/status -> architecture doc
one-time objective        -> task prompt / issue / PR
```

Do not duplicate the same full rule set across layers. Keep one authoritative home and reference it from the narrower context when needed.
