# Elysia9X repository contribution rules

- This repository is a Bun workspaces monorepo. Keep concerns within their package.
- `@elysia9x/docs` is the human- and LLM-facing architecture source of truth.
- `@elysia9x/cli` contains deterministic scanners. Never overstate heuristic/static checks as proof.
- Agent adapters live in `packages/plugins/<agent>/` and must be optional, scoped, non-destructive installers.
- Do not commit credentials, generated secrets or user project data.
- Context7 integration must remain opt-in until a public repository and API key are configured.
- Update `llms.txt` and `llms-full.txt` by running the docs generator; do not hand-edit generated mirrors.
- Every command that changes a target project must be explicit, idempotent and preserve existing files by default.
- Security-sensitive autofixes must never infer or grant public permissions.
- Add tests for scanner rules and package behavior.

## Validation

```bash
bun install
bun run --filter @elysia9x/cli typecheck
bun run --filter @elysia9x/cli test
bun run --filter @elysia9x/docs build
```
