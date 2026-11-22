# @elysia9x/plugin-codex

Portable Agent Plugins 1.0 package for OpenAI Codex. Includes Elysia9X architecture, feature implementation, security and permission-audit skills.

## Install

```bash
bunx --package @elysia9x/plugin-codex elysia9x-codex install --cwd .
```

This copies the plugin payload to `plugins/elysia9x/` and registers it in `.agents/plugins/marketplace.json`. Then open Codex's Plugins directory and install Elysia9X from the local repository marketplace. For direct marketplace installation, add `0xws/e9x`.

Existing plugin files are preserved. Pass `--force` only when you intend to replace them.

The portable `plugin.json` lives at the root of the installed plugin and carries OpenAI-specific metadata in `extensions.com.openai`. No MCP server, credentials or hooks are bundled.

Documentation: https://developers.openai.com/plugins/build/plugins
