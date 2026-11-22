<!-- Generated from guide/context7.md; edit the source document instead. -->

# Context7, `llms.txt` and documentation discovery

Elysia9X is prepared for Context7 indexing, but indexing requires a public repository or public documentation URL to be submitted to Context7. Committing `context7.json` and `llms.txt` alone does not automatically register a library.

## What's included

- Root `context7.json` limits repository parsing to `packages/docs/docs` and defines accepted project metadata and guidance rules.
- The docs build generates `/llms.txt` as a concise index of documentation pages.
- The docs build generates `/llms-full.txt` as a combined Markdown reference.
- The docs build emits Markdown page mirrors under `/llms/pages/` so LLM-oriented tools can fetch individual source pages.
- VitePress generates a sitemap for ordinary search-engine discovery.
- GitHub Actions can refresh the repository's Context7 library after documentation changes.

## Register the repository

1. Publish the repository as public on GitHub.
2. Visit <https://context7.com/add-library> and submit the GitHub repository URL.
3. Confirm the library ID (normally `/owner/repository`).
4. Claim the library to manage its parsing configuration and versions.
5. Add `CONTEXT7_API_KEY` to GitHub Actions secrets. Optionally set repository variable `CONTEXT7_LIBRARY_ID` if the library ID differs from `/${owner}/${repo}`.
6. Set repository variables `DOCS_SITE_URL` and `DOCS_BASE` for the deployed documentation origin and base path; the Pages workflow falls back to GitHub Pages metadata.
7. Push a documentation change and verify the Context7 refresh workflow.

## Submit the hosted `llms.txt` separately (optional)

After deploying the docs site, submit its public `llms.txt` URL using Context7's documented API (the key must have library-management write access):

```bash
curl --request POST \
  --url https://context7.com/api/v2/add/llmstxt \
  --header "Authorization: Bearer ${CONTEXT7_API_KEY}" \
  --header 'Content-Type: application/json' \
  --data '{"llmstxtUrl":"https://0xws.github.io/e9x/llms.txt"}'
```

This is a one-time registration workflow; do not run it on every commit. The repository refresh workflow uses Context7's GitHub library refresh endpoint after the GitHub repository has already been added.

## Context7 configuration

`context7.json` supports project title, description, folders, exclusions, indexing rules and version metadata. The included configuration selects the English Markdown docs rather than indexing generated assets, build output or implementation source. Context7 can index code examples embedded in documentation; keep examples current and runnable.

## Verify deployment

After deployment, check:

- `https://0xws.github.io/e9x/llms.txt`
- `https://0xws.github.io/e9x/llms-full.txt`
- `https://0xws.github.io/e9x/sitemap.xml`
- one Markdown mirror under `/llms/pages/`

Replace the example hostname with the domain you actually control before publication. The `elysia9x.dev` hostname in this repository is a placeholder, not a claim of ownership or availability.
