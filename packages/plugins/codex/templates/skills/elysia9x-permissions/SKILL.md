---
name: elysia9x-permissions
description: Review every discovered API endpoint and its authorization declaration, enforcement path, resource scope, review state, and tests.
---

# Elysia9X permission review

## 1. Inventory
Run:

```bash
elysia9x routes inventory --json
elysia9x permissions audit --json
```

Group endpoints by `features/<feature>/`. Include Next.js Route Handlers and Elysia routes. Identify dynamic plugin-composed routes that static discovery may not see; request or generate a runtime route manifest for those.

## 2. Review each endpoint
For every method/path, verify:
- explicit `protected` or intentionally `public` status;
- named policy exists in the registry and matches the action/resource;
- authentication uses a verified principal;
- the policy enforcement point runs on the actual operation path;
- object-level ownership/relationship access is checked;
- tenant scope comes from trusted identity/context and is applied to reads and writes;
- returned properties are appropriate for the caller;
- evaluator failures, missing policies and malformed context fail closed;
- allow, deny, cross-user, cross-tenant and failure tests exist;
- public review includes rationale, reviewer, date and expiry;
- review is not stale after route, policy, resource-model or auth-context changes.

## 3. Static vs semantic evidence
The CLI can discover declarations, compare manifests, find stale references and identify missing test references. It cannot prove dynamic middleware composition, policy meaning, data query isolation or actual runtime behavior. Mark these `UNVERIFIED` and inspect the code/tests; never turn uncertainty into an automatic pass.

## 4. Severity
- Critical: demonstrated authorization bypass, cross-tenant access or fail-open behavior.
- High: missing policy on protected endpoint, invalid policy reference, unreviewed public exposure.
- Medium: unclear resource scope, stale review, incomplete negative tests.
- Low: documentation gaps or low-confidence static hints.

## 5. Required report
Return an endpoint matrix with feature, method, route, access state, policy, enforcement evidence, resource/tenant scope, test references, reviewer status, findings and remediation. End with PASS, FAIL or HUMAN REVIEW REQUIRED.

Never invent a policy, grant public access, weaken a check, or approve your own security-sensitive changes.
