<!-- Generated from guide/quality-operations.md; edit the source document instead. -->

# Testing, observability and operational readiness

## Test portfolio

| Test | Purpose |
|---|---|
| Domain unit | Invariants and value objects |
| Use-case unit | Orchestration and failure modes |
| Adapter integration | Real DB, queue and provider behavior |
| Contract | Request/response compatibility |
| Authorization matrix | Allow/deny, object and tenant cases |
| Architecture | Dependency direction and feature boundaries |
| E2E | Critical user journeys |
| Migration | Upgrade from prior schema and data |
| Resilience | Timeout, retry and dependency failure behavior |

Authorization tests must include negative cases, cross-tenant attempts and object-level boundaries.

## Observability

Use structured logs, distributed traces and service metrics. OpenTelemetry is a vendor-neutral option.

Minimum signals:
- Request volume, latency and errors by route template.
- Database latency, pool saturation and transaction failures.
- Outbox/queue lag and dead-letter counts.
- Authorization decisions by policy ID/version, without logging sensitive context.
- Background job duration, failures and retries.
- Deployment version and environment.

Never log passwords, tokens, full session cookies, secrets or unnecessary personal data. Sanitize untrusted log fields.

## Reliability

- Configure explicit timeouts for inbound and downstream operations.
- Retry only transient failures and safe/idempotent operations.
- Use bounded exponential backoff with jitter.
- Add circuit breakers only for meaningful downstream failure modes.
- Support graceful shutdown and drain in-flight requests.
- Separate liveness from readiness.
- Define backup/restore RPO and RTO appropriate to the product.
- Document runbooks, alert ownership and incident escalation.

## Agent definition of done

A feature is complete only when acceptance criteria, runtime validation, tests, authorization declarations, architecture checks, migration/rollout notes and independent review are satisfied. The human owner approves production and material security-risk acceptance.
