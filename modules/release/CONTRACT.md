# Release readiness contract

Release readiness is a gate over evidence from implementation planning, code review, security, and QA.

A release is blocked when:
- code review, security, or QA fails
- a high-risk change lacks a concrete non-empty rollback plan
- a non-low-risk change lacks a concrete non-empty observability plan

The gate must return explicit blockers rather than an average score.
