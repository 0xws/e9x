# @elysia9x/plugin-cursor

Native Cursor Plugin packaging Elysia9X project rules, skills, custom agents and slash commands.

## Install

```bash
bunx --package @elysia9x/plugin-cursor elysia9x-cursor install
```

The installer copies the plugin into `~/.cursor/plugins/local/elysia9x`. Restart Cursor or run **Developer: Reload Window**, then inspect the plugin under **Customize**. Use `--home PATH` to override the home directory during testing, and `--force` to replace existing managed files.

The repository also has a root `.cursor-plugin/marketplace.json` for multi-plugin repository discovery. Submit the public repository at https://cursor.com/marketplace/publish when ready for official marketplace review.

Docs: https://cursor.com/docs/plugins
