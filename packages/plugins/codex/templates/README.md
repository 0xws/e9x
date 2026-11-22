# Elysia9X for Codex

Portable Agent Plugins 1.0 package for Codex. It bundles Elysia9X onboarding, feature implementation, architecture audit and permission-review skills.

## Install from the Elysia9X repository

Add the repository as a plugin marketplace:

```bash
codex plugin marketplace add 0xws/e9x
```

Then open the Plugins directory in the supported Codex desktop experience and install **Elysia9X** from the Elysia9X marketplace. For local development, use `codex plugin marketplace add /path/to/e9x`.

After installation, use the bundled skills, for example:

- `elysia9x-audit`
- `elysia9x-permissions`
- `elysia9x-feature`

## Package format

The plugin payload is the `templates/` directory (the directory containing `plugin.json`). This package uses the portable Agent Plugins 1.0 manifest at `plugin.json` and `skills/<name>/SKILL.md`. The `extensions.com.openai` block supplies Codex/OpenAI onboarding and presentation metadata. No MCP server, credentials or lifecycle hooks are bundled.

Codex plugin packaging and marketplace behavior: https://developers.openai.com/plugins/build/plugins
