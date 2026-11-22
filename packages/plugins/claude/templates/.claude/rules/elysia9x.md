# Elysia9X project rules

Apply the Elysia9X engineering standard documented in the repository.

## Architecture

- Organize code by business feature, not by global technical file type.
- Keep domain code independent of React, Next.js, Elysia, Drizzle, databases and I/O.
- Application use cases depend on domain contracts and ports, not concrete adapters.
- Cross-feature imports use only the other feature's public entry point.
- Keep HTTP handlers thin; delegate business operations to application use cases.
- Validate every external input at runtime and return intentional DTOs rather than ORM records.

## Security

- Every endpoint must be explicitly protected or explicitly reviewed public.
- Missing or invalid permission metadata never means public access.
- Authorization must be enforced server-side at the protected operation boundary.
- Verify object ownership and tenant scope; a role check alone may be insufficient.
- Fail closed when identity, policy lookup or policy evaluation fails.
- Never weaken authorization to make a test pass.
- Never add credentials, secrets or sensitive request payloads to source control or logs.

## Data and operations

- Use database constraints for critical invariants and explicit transaction boundaries for multi-step operations.
- Migrations are centrally ordered and deployment-safe; prefer expand-contract for rolling releases.
- Use outbox/idempotency patterns where a committed DB change triggers asynchronous side effects.
- Document timeout, retry, graceful-shutdown and failure behavior for production-sensitive operations.

## Agent conduct

- Work within the assigned feature and file ownership boundary.
- Do not silently change shared infrastructure or another feature's internals.
- Run the relevant Elysia9X CLI audits and tests.
- Report assumptions, touched files, checks run and unresolved risks.
- Static scanner success is not proof of security.
- Do not execute destructive production operations or approve production deployment.
