# Coding-agent integrations

Elysia9X separates deterministic governance from LLM reasoning. The CLI discovers routes and checks mechanical rules; skills guide agents through semantic review; independent reviewers challenge the evidence; CI enforces release gates; the human owner approves production risk.

## Recommended agent roles

1. Architect/coordinator: decomposes work, owns ADRs, boundaries and integration.
2. Feature implementer: owns one feature slice and its tests.
3. Independent reviewer: read-only by default; checks security, architecture, migrations and tests.

Use one writer per feature directory per task. Shared-file changes require explicit ownership. Reviewers should not review their own implementation. The human owner retains final approval for production and destructive changes.

## Integrations

| Agent | Package | Install / discovery |
|---|---|---|
| Claude Code | `@elysia9x/plugin-claude` | `elysia9x integrations install claude` |
| Codex | `@elysia9x/plugin-codex` | `elysia9x integrations install codex`, or `codex plugin marketplace add 0xws/e9x` and install from the Plugins directory |
| Cursor | `@elysia9x/plugin-cursor` | `elysia9x integrations install cursor` (user-local install) or import the repository marketplace |
| Mistral Vibe | `@elysia9x/plugin-vibe` | `elysia9x integrations install vibe` |

### Claude Code

The integration writes a project-level `.claude/rules/elysia9x.md` and `.claude/skills/elysia9x-audit/SKILL.md`. Existing files are preserved unless `--force` is supplied.

### Codex

The package uses the portable Agent Plugins 1.0 manifest with OpenAI-specific onboarding metadata. This repository includes a repo marketplace at `.agents/plugins/marketplace.json`. Add the repository as a marketplace using `codex plugin marketplace add 0xws/e9x`, then install Elysia9X from the supported Plugins directory.

### Cursor

The integration is a native Cursor Plugin. It packages a persistent `.mdc` rule, skills, a coordinator agent, an independent reviewer agent and slash commands. For local development, install into `~/.cursor/plugins/local/elysia9x` and reload Cursor. The repository also includes a Cursor marketplace manifest at `.cursor-plugin/marketplace.json`.

### Mistral Vibe

The Vibe package uses Agent Plugins 1.0 plus the `ai.mistral.vibe` extension. It includes skills, a knowledge bundle and a read-only architecture-reviewer subagent. Install project-scoped in `.vibe/plugins/elysia9x` or user-scoped in `~/.vibe/plugins/elysia9x`, then run `/reload-plugins`. Vibe plugin support is experimental; check the host documentation when upgrading.

All integrations preserve existing files by default. `--force` explicitly replaces plugin-managed files. Skills do not grant tool permissions or bypass host approval controls. See [Plugin development](/guide/plugin-development).
