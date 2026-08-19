---
name: copy-review
description: Independently review copy for comprehension, hierarchy, truthfulness, specificity, voice, rhythm, CTA logic, and generic AI/marketing language.
category: review
version: 1.0
---

# copy-review

## Purpose
Judge whether copy communicates the intended message clearly, credibly, and distinctly without relying on inflated claims or generic marketing language.

## When to use
- Public-facing brand, landing-page, campaign, launch, and product copy.
- Moderate/high-risk messaging or claims.
- When writing sounds polished but may not be specific or truthful enough.

## Inputs required
- Message hierarchy and positioning.
- Audience/context and desired action.
- Verified product/business facts and claim evidence.
- Copy in its actual layout/context when possible.

## Operating principles
- Review meaning before style.
- Separate unclear message, unsupported claim, weak voice, and taste.
- Claims must be verifiable or explicitly qualified.
- Distinctiveness does not justify obscurity.
- CTA language should match user intent and commitment.
- Generic AI/SaaS phrasing is a quality risk even when grammatically correct.

## Workflow
1. Read without strategy notes and summarize what the copy appears to promise.
2. Compare that read to the intended message hierarchy.
3. Flag unsupported, absolute, vague, repetitive, or category-generic claims.
4. Check headline/subhead/body/CTA for information redundancy.
5. Review rhythm, sentence length, jargon, tone, and scanability in layout.
6. Test whether competitors could use the copy unchanged.
7. Classify findings as BLOCKER / MAJOR / MINOR / TASTE.
8. Return APPROVE / REVISE / REJECT with priority corrections.

## Deliverables
- Cold-read message summary.
- Claim/evidence findings.
- Hierarchy and redundancy findings.
- Voice/generic-language findings.
- CTA findings.
- Decision and prioritized corrections.

## Review criteria
- Core value is understandable quickly.
- Every important claim is truthful and supportable.
- Copy adds information instead of repeating visual cues or neighboring text.
- Voice feels specific without becoming theatrical.
- CTA is clear and proportionate to user readiness.

## Failure modes
- Editing for elegance while missing a false claim.
- Rewriting everything into the reviewer's preferred voice.
- Flagging short copy as “too simple” without a communication problem.
- Allowing empty words such as seamless, innovative, premium, or powerful to substitute for proof.
- Reviewing text without considering the intended layout.

## Handoffs
- `copywriter` performs revisions.
- `brand-fit-review` checks strategic/voice coherence.
- Legal/domain review is required separately for regulated or consequential claims.
