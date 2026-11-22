# Contributing

## Prerequisites

- Bun 1.4.5 or later is the reference development environment.
- Git.

## Setup

```bash
bun install
```

## Checks

```bash
bun run --filter @elysia9x/cli typecheck
bun run --filter @elysia9x/cli test
bun run --filter @elysia9x/docs typecheck
bun run --filter @elysia9x/docs build
```

## Package boundaries

- Documentation changes belong in `packages/docs/docs/`.
- CLI behavior belongs in `packages/cli/` and should have stable rule IDs and tests.
- Provider-specific agent files belong in `packages/plugins/<provider>/`.
- Keep root package configuration minimal; workspace packages own their dependencies.

## Security-sensitive changes

Permission rules, authorization checks, secret handling and destructive migration checks require negative tests and an independent review. Do not add autofixes that infer public access. Never include real project secrets in fixtures.

## Release order

Changesets manages independent releases for the CLI and public plugin packages. The docs package is private and is not published to the package registry by default. Set `NPM_TOKEN` in GitHub Actions before enabling package releases. Commit the generated `bun.lock` so CI can use frozen installs.
