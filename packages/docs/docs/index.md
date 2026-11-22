---
title: Elysia9X — Production Engineering Standard
description: A feature-oriented, security-first architecture and deterministic governance toolkit for Bun and TypeScript.
---

# Elysia9X

**A production engineering standard for Bun, TypeScript and AI-assisted software delivery.**

Elysia9X turns architecture principles into an executable engineering discipline. It defines how applications are structured, how features communicate, how permissions are reviewed, how systems are deployed, and how coding agents work safely within a project.

**[Read the guide](/guide/introduction)** · **[Explore the CLI](/guide/cli)**

## The model

| Layer | Responsibility |
|---|---|
| Architecture standard | Feature boundaries, domain isolation, BFF, data and operations rules |
| `@elysia9x/cli` | Deterministic scans, inventories, audits and reports |
| Plugins | Install agent-specific rules and skills |
| Documentation | Human-readable and LLM-readable operating reference |

## Design goals

- **Feature-first:** code is colocated by business capability.
- **Domain isolation:** business rules do not depend on frameworks or databases.
- **Explicit security:** endpoints are intentionally public or protected.
- **Runtime correctness:** TypeScript types complement, not replace, runtime validation.
- **Executable governance:** repeatable checks run locally and in CI.
- **Agent-ready:** coding agents receive bounded responsibilities and verifiable rules.

## Start here

1. [Understand the principles](/guide/principles).
2. [Explore the reference architecture](/guide/architecture).
3. [Install and run the CLI](/guide/cli).
4. [Audit permissions](/guide/authorization).
5. [Connect coding agents](/guide/agents).
