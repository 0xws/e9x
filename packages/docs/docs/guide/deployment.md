# Deployment topologies

## Traefik responsibilities

Use Traefik for TLS termination, host/path routing, redirects, edge rate limits, request size controls, health-aware routing and privacy-safe access logs. It is not the application's permission engine.

Restrict the dashboard/API, trust forwarded headers only from known proxy hops and expose only required ports. Keep databases and internal workers on private networks.

## Beta and preview environments

Never use a browser-controlled browser-controlled version-selection cookie as the authorization boundary for beta access. Use a protected hostname, identity-aware access gateway, verified identity claim or explicit allowlist. Routing selects a target; it does not authorize a user.

## Container rules

- Build immutable artifacts and pin runtime/base image versions.
- Run as non-root.
- Keep secrets out of image layers and build logs.
- Use read-only filesystems where feasible and drop unnecessary capabilities.
- Expose only necessary ports.
- Add health checks and graceful shutdown.
- Set resource requests/limits in orchestrated environments.
- Scan dependencies, images and infrastructure configuration.

## Release pipeline

1. Install from lockfile.
2. Format/lint and typecheck.
3. Run unit and architecture tests.
4. Run permission and policy audits.
5. Run integration and contract tests.
6. Build immutable artifacts.
7. Scan dependencies, secrets and images.
8. Validate/rehearse migrations.
9. Deploy to preview/staging and smoke test.
10. Obtain production approval.
11. Roll out progressively where supported.
12. Verify telemetry and recovery readiness.

## Integrated or separate deployment?

Start integrated. Separate Next.js and Elysia deployments when independent scaling, deployment cadence, resource needs, trust boundaries or team ownership justify the operational cost. Keep the same feature and application boundaries in either profile.
