# Elysia9X for Mistral Vibe

Agent Plugins 1.0 package with the Elysia9X audit, permissions and feature skills, Vibe knowledge, and a read-only architecture reviewer subagent.

> Mistral Vibe plugin support is experimental and the plugin format may change. Validate this package against the Vibe version you deploy.

## Install as a project plugin

Copy the contents of this `templates/` directory (including `plugin.json`) to `.vibe/plugins/elysia9x/` in a trusted project, then run `/reload-plugins` (or start a new session). For user-wide installation, copy those contents to `~/.vibe/plugins/elysia9x/` or `$VIBE_HOME/plugins/elysia9x/`.

Verify with `/plugins`. Skills are available as `/elysia9x:elysia9x-audit`, `/elysia9x:elysia9x-permissions`, and `/elysia9x:elysia9x-feature`.

## Components

- Agent Plugins 1.0 `plugin.json` with the `ai.mistral.vibe` extension
- Shared skills under `skills/`
- Engineering knowledge under `ai.mistral.vibe/knowledge/`
- Read-only reviewer under `ai.mistral.vibe/agents/`

Vibe plugin documentation: https://docs.mistral.ai/vibe/code/cli/plugins
