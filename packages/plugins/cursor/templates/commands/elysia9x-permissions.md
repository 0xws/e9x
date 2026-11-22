---
description: Review permissions for all API endpoints, grouped by feature.
---

Run `elysia9x routes inventory --json` and `elysia9x permissions audit --json`. Review each endpoint's policy, enforcement, object scope, tenant isolation, public exposure, review freshness and positive/negative tests. Never infer public access or auto-grant a permission. Mark runtime behavior that cannot be statically proven as UNVERIFIED.
