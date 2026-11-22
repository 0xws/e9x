<!-- Generated from guide/introduction.md; edit the source document instead. -->

# What is Elysia9X?

Elysia9X is an independent engineering standard and toolchain for building production TypeScript applications, especially applications using Bun, React, Next.js and Elysia.

It is not an official ElysiaJS project and does not replace Elysia. It provides architecture conventions and governance tooling for teams that choose this stack.

## Repository packages

- `@elysia9x/docs`: the documentation site and LLM-readable reference.
- `@elysia9x/cli`: the Bun-native project auditor and initializer.
- `@elysia9x/plugin-claude`, `@elysia9x/plugin-codex`, `@elysia9x/plugin-cursor`, and `@elysia9x/plugin-vibe`: provider-specific agent integrations.

New integrations belong under `packages/plugins/` and should implement a small, documented installation contract.

## What Elysia9X is not

Elysia9X does not mandate microservices, Kubernetes, Redis, Kafka, event sourcing or a separate CQRS database. A modular monolith is the default. Add complexity only when the application's measured requirements justify it.

## Status and assurance

The CLI's initial scanners use conservative static analysis. They can identify suspicious patterns and missing declarations, but they cannot prove that runtime middleware, resource-level access checks or tenant isolation are correct. Treat uncertain findings as a prompt for source inspection and integration tests.
