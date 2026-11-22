# Elysia9X agent integrations

Each adapter is a separate workspace package and follows the target agent's documented extension format.

| Agent | Package | Format | Recommended install |
|---|---|---|---|
| Claude Code | `@elysia9x/plugin-claude` | Claude Code rules/skills | `elysia9x integrations install claude` |
| Codex | `@elysia9x/plugin-codex` | Agent Plugins 1.0 + `extensions.com.openai` | Add `0xws/e9x` as a plugin marketplace |
| Cursor | `@elysia9x/plugin-cursor` | Native Cursor Plugin | Import repo marketplace or install locally |
| Mistral Vibe | `@elysia9x/plugin-vibe` | Agent Plugins 1.0 + `ai.mistral.vibe` | `elysia9x integrations install vibe` |

## Shared guarantees

- Existing project/user files are preserved by default by the installers.
- `--force` is required to replace an existing managed file.
- Skills guide the agent; they do not grant tool permissions or bypass host approval controls.
- Integrations do not collect or transmit project source, credentials or telemetry.
- Static permission audits are not security certification; agents must mark dynamic and semantic checks as unverified until tested.

## Platform notes

- **Codex:** `codex plugin marketplace add 0xws/e9x`; use the supported Plugins directory to install Elysia9X from that repository marketplace. See the package README for local testing.
- **Cursor:** Import the repository as a team marketplace where available, or install under `~/.cursor/plugins/local/elysia9x` for local development and reload Cursor.
- **Mistral Vibe:** plugins can be project-scoped in `.vibe/plugins/` or user-scoped in `~/.vibe/plugins/`. Vibe plugin support is experimental; check the host docs before upgrading.
