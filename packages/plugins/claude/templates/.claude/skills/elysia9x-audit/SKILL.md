---
name: elysia9x-audit
description: Audit an Elysia9X TypeScript project for endpoint authorization, architecture boundaries, database migration hazards and environment hygiene. Use before releases, after endpoint changes, or during security reviews.
---

# Elysia9X audit

## Workflow

1. Identify the repository root and read `AGENTS.md` and the Elysia9X architecture guide if present.
2. Run `bunx --package @elysia9x/cli elysia9x doctor` and `bunx --package @elysia9x/cli elysia9x scan`.
3. Run `bunx --package @elysia9x/cli elysia9x permissions audit` and `bunx --package @elysia9x/cli elysia9x routes inventory`.
4. Group all endpoints by feature folder.
5. For each protected endpoint, inspect the actual Elysia plugin/macro composition and use case to verify that a PEP is enforced.
6. Verify policy IDs exist, policies fail closed, resource/tenant scope is enforced and DTOs do not expose fields the principal should not see.
7. Inspect positive and negative authorization tests, including cross-tenant and object-level access.
8. Review public endpoints for explicit purpose, reviewer, review date and expiry.
9. Review architecture findings, migration findings and environment findings.
10. Re-run the relevant commands after remediation.

## Finding severity

- Critical: demonstrated authorization bypass, cross-tenant access or fail-open behavior.
- High: protected endpoint lacks a policy declaration, policy is unknown, or public access lacks approval.
- Medium: resource scope is unclear, review is stale, or negative tests are missing.
- Low: documentation gap or low-confidence static signal.

## Required report

- Endpoint inventory grouped by feature and HTTP method.
- Policy/access declaration for each endpoint.
- Evidence of runtime enforcement, or an explicit `UNVERIFIED` status.
- Object-level and tenant-level risks.
- Test coverage gaps.
- Architecture and migration findings.
- Remediation recommendations with file references.
- Release recommendation: PASS, FAIL or HUMAN REVIEW REQUIRED.

## Safety constraints

Do not invent policy semantics, grant public access, remove authorization, publish policies, alter production configuration, delete data or claim certification. Ask for human approval before changes to security policy, destructive migrations or production systems. Static analysis is evidence, not proof.
