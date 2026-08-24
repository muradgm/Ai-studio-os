# Icon System exploration contract

Icon System exploration is the creative/semantic layer above the existing deterministic Vector Geometry subsystem.

It does **not** replace `icon-system-recipe`, `icon-system-construction`, `vector-geometry-engineer`, `vector-geometry-review`, or SVG integrity. It decides which brand-native icon grammar is worth handing to those production systems.

## Governing rule

> AI Studio OS designs an original icon system from the approved product, brand, Visual System, and Motion constitutions. Existing icon libraries may inform convention research, but they are never used as geometry to style-transfer or trace.

## Three different icon problems

The system keeps these separate:

1. **Product/UI glyphs** — navigation, controls, and common actions.
2. **Semantic/status symbols** — AI Council-specific state and meaning such as evidence, authority, provenance, verification, supersession, and memory.
3. **Product/app icon family** — launcher, favicon, PWA, desktop, mobile, and OS assets.

The app-icon family is downstream of UI glyph grammar selection. Shared DNA does not require shared geometry.

## Familiarity budget

Every icon is classified as either:

- `convention-dominant` — preserve a familiar semantic silhouette while inheriting AI Council construction grammar; or
- `brand-semantic` — the concept is distinctive enough to justify original semantic construction.

Do not make Search, Settings, Attach, or similar controls intentionally obscure just to make them branded.

## Exploration before production

Do not construct the full library before the family grammar survives difficult cases.

Required sequence:

`SEMANTIC INVENTORY → 3 ICON WORLDS → 8–10 CALIBRATION GLYPHS/WORLD → SEMANTIC + INTERFACE + SMALL-SIZE PROOF → HUMAN WORLD SELECTION → ~25 ICON DNA SET → VECTOR REVIEW → SVG INTEGRITY → HUMAN ICON-SYSTEM APPROVAL → SCALE PRODUCTION`

Quiver Line / Quiver Construct is a hypothesis only until human icon-world selection.

## Calibration proof

Each world must render exactly the same calibration glyphs and contexts. A world may not improve its appearance by removing difficult semantics.

Required proof includes:

- identical calibration concepts across worlds;
- monochrome masters;
- 24×24 canonical viewBox;
- 12 / 14 / 16 / 18 / 20 / 24 / 32 px optical proof;
- interface-context proof in navigation, evidence, decision/memory, approval/authority, and mobile/control use;
- confusing-pair review such as Evidence ≠ Verification, Decision ≠ Approval, History ≠ Provenance, Memory ≠ Archive, Authority ≠ Lock, Supersede ≠ Refresh;
- SVG validity and browser rendering.

The critical rejection range is 14–18px.

## Semantic color boundary

Canonical glyph geometry is monochrome / semantic-neutral.

Visual System supplies semantic color at use time:

- neutral → ordinary product glyphs;
- evidence violet → evidence/source state;
- lineage green → real provenance/chronology relationships;
- consequence vermilion → approval required, blocked/destructive/high-risk/failure/security boundary;
- focus token → accessibility focus.

An Authority glyph is not inherently red.

## Motion readiness

Static geometry comes first, but selected geometry should retain stable layer IDs, anchors, pivots, and state relationships where future Motion System transitions may need them.

Examples:

- advisory → approval required → authorized;
- validating → verified;
- current memory → superseded memory.

Do not animate an icon that is semantically weak when static.

## Vector subsystem boundary

Exploration may author geometry hypotheses and calibration SVG candidates, but canonical production masters must pass the existing order:

`APPROVED ICON INTENT → GEOMETRY SPEC → NORMALIZED SVG → INDEPENDENT VECTOR REVIEW → SVG / LAYER / OVERLAP / RENDER INTEGRITY`

Production SVG cannot be approved solely because it looks clean in a specimen sheet.

## Truth boundary

Before exploration:

```text
iconSemanticInventoryAuthored = false
iconWorldExplorationComplete = false
iconWorldHumanSelected = false
iconSystemHumanApproved = false
productionIconMastersComplete = false
appIconHumanApproved = false
finalVisualSystemApproved = false
```

After a complete three-world calibration proof:

```text
iconSemanticInventoryAuthored = true
iconWorldExplorationComplete = true
iconWorldHumanSelected = false
iconSystemHumanApproved = false
productionIconMastersComplete = false
appIconHumanApproved = false
finalVisualSystemApproved = false
```

No automatic winner is allowed.
