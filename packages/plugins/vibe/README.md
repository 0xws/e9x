# @elysia9x/plugin-vibe

Agent Plugins 1.0 package for Mistral Vibe. Includes Elysia9X skills, architecture knowledge and a read-only architecture reviewer subagent.

> **Experimental:** Mistral Vibe currently documents plugin support as experimental and under active development. Validate against the exact Vibe release you use.

## Project install

```bash
bunx --package @elysia9x/plugin-vibe elysia9x-vibe install --cwd .
```

Project plugins live in `.vibe/plugins/elysia9x/` and are loaded only for trusted projects. Reload with `/reload-plugins` or start a new Vibe session.

## User install

```bash
bunx --package @elysia9x/plugin-vibe elysia9x-vibe install --user
```

User plugins live in `~/.vibe/plugins/elysia9x/` or `$VIBE_HOME/plugins/elysia9x/`. Verify discovery with `/plugins`. Skills use the `/elysia9x:<skill-name>` namespace.

Existing files are preserved unless `--force` is passed.

Docs: https://docs.mistral.ai/vibe/code/cli/plugins
