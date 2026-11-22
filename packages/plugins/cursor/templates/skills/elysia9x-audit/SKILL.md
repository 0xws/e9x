---
name: elysia9x-audit
description: Audit an application that follows Elysia9X. Use for architecture reviews, pre-merge checks, security reviews, and release readiness assessments.
---

# Elysia9X project audit

Use the deterministic CLI for mechanical facts and your reasoning for semantic review.

## Procedure
1. Identify the project root and read `AGENTS.md`, `.elysia9x/config.json`, and relevant architecture documents.
2. Run `elysia9x doctor` and `elysia9x scan --json` (or `bunx --package @elysia9x/cli elysia9x scan` if the binary is not installed).
3. Run focused inventories: `elysia9x routes inventory --json` and `elysia9x permissions audit --json`.
4. Group findings by feature and inspect source, tests, policy declarations and relevant database queries.
5. Check dependency direction, runtime validation, DTO boundaries, transaction scope, object-level access, tenant isolation, error handling, observability and migration safety.
6. Distinguish facts from uncertainty. A static pass is not proof of runtime correctness.
7. Report critical/high issues first with file/line, evidence, impact and a concrete remediation.
8. Re-run relevant checks after fixes. Do not claim completion when tests or runtime checks were not run.

## Security invariants
- Missing policy never means public access.
- Protected operations authorize a verified principal against the specific resource and tenant.
- Policy errors and unknown states fail closed.
- UI visibility is never an authorization boundary.
- Secrets and sensitive payloads must not be logged.
- A policy declaration or `authorize()` call alone does not prove enforcement.

## Output
Provide: scope, commands run, endpoint totals by feature, findings by severity, unverified areas, tests run, residual risks and PASS / FAIL / HUMAN REVIEW REQUIRED.

Do not change access decisions, publish policies, delete data, or make production changes during an audit unless the user explicitly requests implementation.
