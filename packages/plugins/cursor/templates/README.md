# Elysia9X for Cursor

Native Cursor Plugin packaging Elysia9X project rules, skills, subagents, and agent commands.

## Local testing

Copy the contents of this `templates/` directory (including `.cursor-plugin/`) to `~/.cursor/plugins/local/elysia9x`, restart Cursor or run **Developer: Reload Window**, then inspect the plugin under **Customize**.

## Marketplace

The repository includes a root `.cursor-plugin/marketplace.json` that lists this plugin. Import `https://github.com/0xws/e9x` as a team marketplace (Teams/Enterprise) or submit the repository/plugin through Cursor's marketplace publishing flow. For quick individual testing, use the local plugin directory above.

## Components

- Rule: `rules/elysia9x.mdc`
- Skills: audit, permissions review, feature implementation
- Subagents: architect and independent reviewer
- Commands: `/elysia9x-audit`, `/elysia9x-permissions`

Cursor plugin format: https://cursor.com/docs/plugins
