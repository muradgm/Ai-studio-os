# Security runtime contract

Security review is independent from ordinary code review.

Derive controls from the change surface, then verify concrete evidence for those controls.
Authorization-sensitive and data-writing changes must be treated as security-relevant even when the implementation appears small.

Critical, high, or medium findings and missing required-control evidence block release unless a future explicit risk-acceptance mechanism is introduced.
