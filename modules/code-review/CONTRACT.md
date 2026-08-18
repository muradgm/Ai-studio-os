# Code review contract

Review implementation evidence independently from the authoring pass.

Severity:
- blocker: correctness, safety, permission, data-loss, or required-test failure
- major: meaningful regression/maintainability risk that should be fixed before merge
- minor: bounded issue that may be deferred intentionally
- taste: subjective preference, never a release blocker by itself

A review passes only with no blocker or major findings and every required test result present and passing.
