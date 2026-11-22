# Security policy

Please do not publish exploitable vulnerabilities as public issues before maintainers have had an opportunity to assess them. Use GitHub's private vulnerability reporting for the repository once it is published and private reporting is enabled.

Elysia9X is an architecture and static-analysis toolkit, not a security certification. Findings may be incomplete or incorrect; validate important decisions with runtime tests and qualified security review.

Never send credentials, customer data or private source code to the Elysia9X maintainers when reporting an issue. Provide a minimal sanitized reproduction.

## Dependency review workflow

The GitHub Actions dependency-review job requires the repository Dependency Graph feature. For this public repository, enable it under **Settings → Advanced Security → Dependency graph**. GitHub's dependency review API returns HTTP 403 when the feature is disabled. The workflow intentionally uses the standard unprivileged `pull_request` event and a read-only token; do not switch to `pull_request_target` merely to work around a disabled repository feature.
