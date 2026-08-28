# Creative Synthesis Intelligence V1

## Purpose

Creative Synthesis Intelligence V1 combines multiple independently verified **Creative Transfer Candidate Egress** inputs into a small set of project-grounded creative hypotheses.

It exists between Creative Transfer and the existing Creative Thesis deliberation layer.

It does **not** choose a winner, score ideas, recommend a thesis, grant approval, or authorize production.

## Constitutional inheritance

```text
KNOWLEDGE != AUTHORITY
REFERENCE != DIRECTION
PATTERN != SOLUTION
TREND != JUSTIFICATION
TECHNOLOGY != CONCEPT
CRITIC SCORE != SELECTION
```

Synthesis inherits the same boundary:

```text
TRANSFER CANDIDATE != SYNTHESIS
SYNTHESIS HYPOTHESIS != THESIS
STRUCTURAL DIVERGENCE != SEMANTIC DIVERGENCE
STRUCTURAL VALIDITY != CREATIVE QUALITY
SYNTHESIS SET != RECOMMENDATION
```

## Placement

```text
Creative Intelligence Foundation
        ↓
Creative Knowledge Graph
        ↓
Creative Transfer Intelligence
        ↓
verified Transfer Candidate Egress × 2+
        ↓
Creative Synthesis Brief
        ↓
3+ structurally divergent Synthesis hypotheses
        ↓
verified Synthesis Candidate Egress
        ↓
existing Creative Thesis deliberation
        ↓
existing human Creative Thesis authority gate
```

The existing Creative Thesis layer remains responsible for comparative deliberation, recommendation/authorship and later human approval.

Creative Synthesis must not duplicate those responsibilities.

## Source authority boundary

Synthesis consumes only canonical `creative-transfer-candidate@1` egress artifacts.

It must not consume raw Transfer hypotheses, Graph retrieval rank, shared Graph objects, or Foundation entries directly as creative instruction.

For every requested Transfer source, the Synthesis Brief independently re-verifies:

```text
Transfer Candidate
→ Transfer Hypothesis
→ Transfer Brief
→ Retrieval
→ Creative Knowledge Graph
→ Creative Intelligence Foundation
```

Cached `reviewReady` or `provenanceReady` flags are not authority.

### Fail-closed all-source rule

Synthesis does not silently drop an invalid source and continue with the rest.

If any requested source:

- fails independent provenance;
- belongs to another project;
- targets another domain;
- duplicates another Transfer Candidate snapshot;
- aliases another source under a different ID;

then:

```text
sourceCandidates = []
allSourcesVerified = false
reviewReady = false
provenanceReady = false
```

This prevents provenance failure from silently changing the creative problem.

## Creative Synthesis Brief

Canonical brief:

```text
creative-synthesis-brief@1
```

The brief binds:

- project identity;
- target domain/problem/effect;
- explicit project truths;
- explicit productive contradictions;
- project constraints;
- exact verified Transfer Candidate receipts;
- exact safe Transfer Candidate projections.

The brief is evidence infrastructure only.

It cannot rank sources or select a creative direction.

## Productive contradictions

Synthesis V1 expects at least two explicit project contradictions before it is review-ready.

Contradictions are project tensions such as:

```text
clarity × distinctiveness
speed × ceremony
confidence × uncertainty
continuity × surprise
familiarity × authorship
restraint × expression
```

They are not generated truth and do not become authority.

Every Synthesis hypothesis must exercise at least one contradiction, and the full candidate set must cover every contradiction in the brief.

A contradiction left unused keeps the set provisional.

## Multiple-source requirement

Every Synthesis hypothesis must combine at least two distinct verified Transfer candidates.

For each claimed source, the hypothesis must state an explicit source contribution:

```text
sourceCandidateId
contribution
```

The contribution set must exactly equal the hypothesis source set.

This prevents a hypothesis from citing multiple sources while actually using only one.

## Structural synthesis strategies

V1 defines six structural combination strategies:

```text
reinforcement
productive-contradiction
hierarchical
sequential
conditional
counterpoint
```

These are structural reasoning modes, not styles.

### reinforcement

Two source logics strengthen the same project consequence through different mechanisms.

### productive-contradiction

Two source logics pull in different directions and the concept preserves the useful tension rather than averaging them away.

### hierarchical

One source logic governs the primary experience while another governs secondary behavior or detail.

### sequential

Different source logics govern different stages in time or progression.

### conditional

Different source logics apply under explicit conditions, contexts, states or user needs.

### counterpoint

One source logic establishes a dominant behavior while another creates a restrained secondary behavior that remains legible without competing for primacy.

## Divergence gate

A review-ready Synthesis set requires:

```text
hypothesisCount >= 3
distinctStrategyCount >= 3
```

Renaming an identical hypothesis payload does not create divergence.

This is deliberately described as **structural divergence** only.

V1 does not claim that three strategies prove semantic, artistic or conceptual divergence.

```text
structuralDivergenceOnly = true
semanticDivergenceVerified = false
```

Semantic judgment remains downstream review work.

## Hypothesis contract

Each hypothesis contains:

```text
id
strategy
sourceCandidateIds
sourceContributions
projectTruthRefs
contradictionRefs
governingIdea
productiveTension
combinationMechanism
experientialConsequences
antiGenericClaims
ownabilityRisk
competitorTransferTest
failureModes
uncertainty
falsifier
critique
```

A hypothesis must explain **how** its source logics combine causally.

Simply listing sources is not synthesis.

## Project grounding

Every hypothesis must cite project truth from the bound Synthesis Brief.

The set also tracks whether every verified Transfer source was exercised by at least one hypothesis.

Unused sources keep the set provisional rather than allowing evidence to disappear silently.

## Anti-generic and ownability reasoning

Each hypothesis must include:

- at least one explicit anti-generic claim;
- an ownability risk;
- an explicit competitor-transfer test;
- at least one failure mode;
- uncertainty;
- a falsifier;
- adversarial critique.

These fields do not certify originality or quality.

They make the reasoning inspectable and easier to reject when it collapses into category default.

## Source-restatement firewall

Creative Transfer already strips recognizable source surface styling before candidate egress.

Creative Synthesis adds another boundary: it cannot simply repeat a complete Transfer Candidate sentence and relabel it as a synthesized idea.

The Synthesis reviewer builds a probe set from the verified Transfer Candidate freeform fields:

```text
transferClaim
causalBridge
targetConsequence
adaptationActions
adaptationRuleActions
copyRiskMitigations
uncertainty
falsifier
```

Only sufficiently substantive phrases are probed.

All Synthesis hypothesis freeform output is checked after:

```text
Unicode NFKC normalization
case normalization
Unicode Cf format-character removal
punctuation normalization
whitespace normalization
```

If a complete normalized Transfer phrase is reproduced:

```text
creative-synthesis-source-restatement-detected
```

The finding exposes only `hitCount`, not the copied phrase.

This is a **literal restatement firewall** only.

It does not claim semantic plagiarism detection, paraphrase detection, originality certification or legal non-infringement.

## Raw Synthesis vs downstream egress

The raw `creative-synthesis-set@1` artifact is an inspectable reasoning artifact.

Downstream Creative Thesis should consume only:

```text
creative-synthesis-candidate-set@1
```

Candidate egress independently re-verifies:

```text
Synthesis Set
→ Synthesis Brief
→ every Transfer Candidate
→ Transfer Hypothesis
→ Transfer Brief
→ Retrieval
→ Graph
→ Foundation
```

If provenance or structural review fails:

```text
candidates = null
reviewReady = false
status = blocked
```

Blocked egress contains no candidate creative content.

## No ranking or recommendation

Creative Synthesis V1 has no canonical fields for:

```text
winner
recommended
selection
score
approval
canonicalDirection
productionApproved
```

Unknown fields are blocked.

Truth-state fabrication is also blocked.

Creative Thesis deliberation remains the first layer allowed to comparatively recommend a hypothesis for authorship, and even that does not create final human authority.

## Truth boundary

Synthesis V1 keeps these truths explicit:

```text
hypothesesAreCandidatesOnly = true
noWinnerOrRecommendationProduced = true
noScoresProduced = true
structuralDivergenceOnly = true
semanticDivergenceVerified = false
semanticSynthesisVerified = false
creativeThesisSelected = false
creativeDirectionSelected = false
humanApprovalGranted = false
productionApproved = false
```

A review-ready Synthesis set means only that the candidate set is structurally complete, provenance-bound, project-grounded, contradiction-aware, multi-source and safe for downstream Creative Thesis deliberation.

It does not mean the ideas are good.

## Adversarial regression requirements

V1 must cover at least:

1. valid multi-source Synthesis with no authority;
2. one forged Transfer source invalidates the entire Synthesis Brief;
3. cross-project Transfer injection;
4. duplicate Transfer Candidate aliasing;
5. insufficient hypothesis count;
6. insufficient strategy divergence;
7. identical payload renamed as a new hypothesis;
8. source-contribution set drift;
9. exact Transfer phrase restatement;
10. zero-width/Unicode-format-character restatement smuggling;
11. unused productive contradictions;
12. fabricated winner/score/selection/approval fields;
13. forged cached Synthesis provenance at downstream egress.

## Deliberate V1 exclusions

Creative Synthesis V1 does not add:

- automatic winner selection;
- learned synthesis ranking;
- embedding-based semantic divergence scoring;
- LLM-claimed semantic originality;
- autonomous Creative Thesis authorship;
- autonomous human approval;
- Creative Direction selection;
- automatic style fusion;
- legal copyright/trademark judgment;
- Motion Intelligence V2;
- Spatial Creative Intelligence V1.
