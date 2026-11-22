---
name: engineering-standard
description: Elysia9X architecture, dependency boundaries, security invariants, testing and production engineering conventions.
display_name: Elysia9X engineering standard
icon: 🧭
---

# Elysia9X engineering standard

Elysia9X is a feature-oriented, contract-driven engineering standard for production TypeScript applications.

## Architecture
- Prefer a modular monolith with vertical feature slices.
- Combine DDD where the domain needs explicit language/invariants, Hexagonal Architecture for ports/adapters, BFF contracts for frontend-specific APIs, and selective CQRS for complex reads.
- Organize by business capability. A feature owns domain, application, infrastructure, transport, UI and tests.
- Cross-feature imports use only the feature's public `index.ts`.
- Domain has no framework, persistence, transport or UI dependencies.

## Security
- Authenticate a principal before authorization.
- Explicitly classify each endpoint as protected or reviewed public.
- Missing policy, unknown principal, policy error or evaluator timeout means deny.
- Enforce object-level ownership/relationship and tenant scope server-side.
- UI state is never an authorization boundary.
- Static scans are evidence, not proof.

## Data and operations
- Use runtime validation on external input and explicit DTOs at boundaries.
- Keep transaction scope in application use cases.
- Use database constraints for critical invariants and centrally ordered migrations.
- Use expand-contract for incompatible rolling schema changes.
- Use a transactional outbox for reliable external publication when needed.
- Add timeouts, bounded retries and idempotency where required.
- Use structured telemetry without logging secrets or unnecessary personal data.

## Agent workflow
- One writer owns a feature slice at a time.
- The architect coordinates boundaries; implementers own bounded work; reviewer is independent and read-only by default.
- Human owner approves production/security risk and destructive data operations.
