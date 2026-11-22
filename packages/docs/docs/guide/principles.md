# Engineering principles

## 1. Organize around business capabilities

Prefer `features/missions/` over global `controllers/`, `models/` and `views/` directories. The code that changes together should be easy to find together.

## 2. Keep dependency direction inward

The domain is independent of HTTP, React, Next.js, Elysia, Drizzle and infrastructure. Application use cases depend on ports. Infrastructure and transport implement adapters around those contracts.

## 3. Keep a modular monolith by default

Feature boundaries are valuable even when every feature ships as one application. Extract services only when independent scaling, deployment, reliability or ownership creates a measurable benefit.

## 4. Treat contracts as product interfaces

BFF endpoints express frontend capabilities and return explicit DTOs. Persistence models do not become public API schemas by accident.

## 5. Security is explicit and fail-closed

Every endpoint is classified as protected or intentionally public. Missing policy, missing identity, evaluator failure and unknown access states must never silently become allow decisions.

## 6. Make correctness executable

Architecture rules, route inventories, permission declarations, migration checks and environment audits should be machine-checkable where evidence permits.

## 7. Separate deterministic checks from semantic review

The CLI discovers facts and reports patterns. Human reviewers and coding agents inspect intent, exploitability and business meaning. Static scanning is not a security certification.

## 8. Keep humans accountable for production risk

Agents may implement bounded work and propose changes. A human owner approves production deployment, destructive data changes and material security-risk acceptance.
