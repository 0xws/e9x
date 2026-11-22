---
name: elysia9x-feature
description: Design or implement a business capability as a vertical feature slice using Elysia9X boundaries.
---

# Elysia9X feature implementation

1. Read the project `AGENTS.md`, architecture guide and target feature public API.
2. Confirm feature ownership and list intended files before editing.
3. Keep business rules in `domain/`; keep orchestration in `application/`; keep Drizzle, queues and external clients in `infrastructure/`; keep HTTP schemas/routes/presenters in `transport/`; keep React components in `ui/`.
4. Domain code must not import React, Next.js, Elysia, Eden Treaty, Drizzle or infrastructure modules.
5. Expose only stable contracts through the feature's `index.ts`. Never import another feature's internals.
6. Validate external input at runtime. Return intentional DTOs; do not expose Drizzle rows or domain entities directly.
7. Put multi-step state changes in explicit transactions. Use database constraints for invariants that must survive concurrency.
8. Declare and enforce authorization for every protected operation, including object and tenant scope.
9. Add domain, use-case, adapter, contract and authorization tests appropriate to the change; include deny and cross-tenant cases.
10. Run typecheck, tests and relevant Elysia9X audits. Explain any command not run.

Avoid creating an interface or abstraction without a real boundary or second implementation need. Keep the change local to the feature unless an architectural change is approved and documented with an ADR.
