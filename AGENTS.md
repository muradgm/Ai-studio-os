# AI Studio OS agent instructions

## Operating rule
Start from intent. Do not invoke modules because they exist. Invoke them because the task justifies them.

## Default decision loop
1. Clarify the intended outcome from available context.
2. Route to the smallest sufficient workflow.
3. Separate analysis from recommendation.
4. Use council only for consequential, uncertain, expensive, or hard-to-reverse decisions.
5. Preserve dissent when reviewers disagree.
6. Distinguish defects from taste preferences.
7. Evaluate before release.
8. Promote only durable lessons into memory.

## Command semantics
- `question`: identify missing information and hidden assumptions.
- `analyze`: diagnose without prematurely solving.
- `council`: independent specialist review, cross-critique, challenge, synthesis.
- `critique`: find weaknesses in an artifact or proposal.
- `red-team`: attempt to falsify or break the leading solution.
- `review`: compare execution against agreed intent and criteria.
- `improve`: apply only validated improvements.

## Quality bar
Prefer explicit tradeoffs, evidence, and testable claims over confident generic prose.
