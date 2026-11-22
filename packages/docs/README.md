# @elysia9x/docs

VitePress documentation site for Elysia9X. The `build` script generates `llms.txt`, `llms-full.txt`, Markdown mirrors and the static site.

```bash
bun run dev
bun run build
bun run context7:submit # requires CONTEXT7_API_KEY and a deployed docs URL
```

Set `DOCS_SITE_URL` and optionally `DOCS_BASE` before building for a non-default host or path.
