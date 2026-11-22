# Authorization and permission governance

Authorization is a mandatory subsystem. Authentication establishes a verified principal; authorization decides whether that principal can perform an action on a resource in a context.

## Models

Use only the models the domain needs:

- RBAC for roles and broad capabilities.
- ABAC for principal, resource and environmental attributes.
- ReBAC for ownership, membership, delegation and relationships.
- CEL for safe expression evaluation when policies need to be configurable.

CEL is an evaluator, not an authentication provider or a complete authorization data model.

## PEP and PDP

- PEP (Policy Enforcement Point) enforces access at the operation boundary.
- PDP (Policy Decision Point) evaluates a structured authorization request.
- Policy registry owns stable policy IDs and versions.
- Policy administration controls authoring, testing, review and publication.

The PDP should receive minimal, trusted context: principal, action, resource and verified environment/relationship attributes.

## Fail closed

Missing policies, unauthenticated principals, invalid policy bundles, evaluation failures, timeouts and unknown actions must not grant access. Public endpoints are explicitly declared, justified, reviewed and time-bounded.

## Object and tenant scope

Role checks alone are insufficient for many operations. Verify object ownership, membership and tenant context. Scope repository queries by tenant when possible. Do not trust tenant IDs supplied by the browser without verifying membership. Test cross-tenant reads, writes, deletes, exports and relationship traversal.

## Permission inventory

The CLI uses `.elysia9x/permissions.json`. Each entry records feature, method, route, access state, policy ID, resource scope, test reference, reviewer, review date and expiry. Public entries additionally require a reason. Review metadata is checked for completeness, expiry and configured maximum age.

Example:

```json
{
  "feature": "missions",
  "method": "GET",
  "path": "/missions/:id",
  "access": "protected",
  "policy": "mission:read",
  "resourceScope": "mission ownership and verified tenant membership",
  "authorizationTest": "features/missions/tests/authorization/read-mission.test.ts",
  "reviewer": "security-owner",
  "reviewedAt": "2026-11-01",
  "expiresAt": "2027-05-01"
}
```

## Static audit limitations

Static discovery can find literal route declarations and compare them with the inventory. It cannot prove composed middleware, macro behavior, runtime authorization, property-level filtering or tenant isolation. The CLI reports uncertainty rather than treating a recognizable `authorize()` call as proof.

For stronger assurance, emit a runtime route manifest from the fully composed Elysia application in a safe test environment, compare it with the static inventory and run authorization integration tests against real repository adapters and tenant fixtures.
