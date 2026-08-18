---
name: security-review
description: Derive and verify security controls for authentication, authorization, state mutation, APIs, external I/O, files, PII, and other sensitive surfaces.
---

# security-review

## Procedure
1. Identify security-relevant surfaces from the change, not from a generic checklist.
2. Verify authentication and server-side authorization where required.
3. Verify validation, least privilege, transaction/recovery boundaries, secrets, logging, and data handling as applicable.
4. Record concrete evidence for every required control; labels without evidence do not count.
5. Treat missing required-control evidence and critical/high/medium findings as release blockers.
6. Keep security review independent from ordinary code review.
