<!-- Generated from guide/cli.md; edit the source document instead. -->

# `@elysia9x/cli`

The CLI is a Bun-native, dependency-light governance tool. It is read-only by default except for explicit initialization and integration installation commands.

## Install

```bash
bunx --package @elysia9x/cli elysia9x --help
```

Or add it as a development dependency:

```bash
bun add -d @elysia9x/cli
```

## Commands

```bash
elysia9x init
elysia9x doctor
elysia9x scan
elysia9x permissions audit
elysia9x permissions audit --feature missions
elysia9x routes inventory
elysia9x architecture audit
elysia9x database audit
elysia9x env audit
elysia9x report --format json
elysia9x integrations install claude
elysia9x integrations install codex
elysia9x integrations install cursor
elysia9x integrations install vibe
elysia9x integrations install vibe --user
```

Commands accept `--cwd <directory>` so a tool can audit a project without changing its current working directory.

## Project metadata

`elysia9x init` creates `.elysia9x/config.json`, `.elysia9x/permissions.json` and `.elysia9x/policies.json` without overwriting existing files. It does not grant public access to any endpoint.

## Findings

A finding includes a stable rule ID, severity, confidence, evidence, file/line when available and a remediation. Permission audit reports also include the discovered endpoint access state, policy ID and review freshness. JSON output is suitable for CI and future SARIF conversion.

The CLI distinguishes errors from warnings and low-confidence signals. Static route discovery supports literal Elysia route declarations and Next.js Route Handler exports in the initial release; dynamic registration and composed plugins may be missed.

## CI

Run the CLI in CI and block high-confidence errors. Review warnings and low-confidence findings explicitly. Never treat a green static scan as a security certification.
