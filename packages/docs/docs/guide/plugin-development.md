# Developing agent plugins

Agent integrations live under `packages/plugins/<agent>/` and are independent workspace packages. Keep the core CLI provider-neutral wherever practical; provider-specific manifests and components belong in the adapter package.

## Current integrations

- Claude Code: project rules and skills.
- Codex: portable Agent Plugins 1.0 `plugin.json` plus `extensions.com.openai` metadata; repo marketplace at `.agents/plugins/marketplace.json`.
- Cursor: native Cursor Plugin with `.cursor-plugin/plugin.json`, rules, skills, agents and commands; marketplace at `.cursor-plugin/marketplace.json`.
- Mistral Vibe: Agent Plugins 1.0 plus `extensions.ai.mistral.vibe`, skills, knowledge and a read-only subagent. Vibe plugin support is experimental.

## Installer contract

An installer should export a small function with explicit options and a result containing files written, files preserved and the destination. It should:

- Preserve existing files by default.
- Overwrite only with explicit `force: true`.
- Be safe to run repeatedly.
- Modify only files owned by its integration.
- Never silently change permissions, secrets or production settings.
- Include path handling and preservation tests.

## Agent instruction design

Rules should be short and actionable. Skills should define a repeatable procedure, required evidence and a safe output format. Delegate deterministic discovery to `@elysia9x/cli`; use the agent for semantic review. Never claim static checks prove security. Do not let an agent plugin bypass host-level approval or tool permissions.

## Publishing

Publish provider packages independently through Changesets. Keep versions synchronized through workspace release configuration and test plugin manifests/paths in CI before publishing. See the official platform documentation before changing a manifest: [Codex plugins](https://developers.openai.com/plugins/build/plugins), [Cursor plugins](https://cursor.com/docs/plugins), and [Mistral Vibe plugins](https://docs.mistral.ai/vibe/code/cli/plugins).
