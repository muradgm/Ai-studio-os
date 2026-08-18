# Engineering runtime contract

Turn an approved product/design specification into a bounded implementation plan.

Required output:
- risk classification and factors
- affected surfaces and contracts
- implementation sequence
- invariants that must remain true
- caller-specified plus surface-derived required tests
- rollback requirement
- observability requirement

Security- and state-sensitive surfaces must derive baseline test obligations even when the caller forgets to list them. High-risk changes must not reach release without explicit rollback and observability plans.
