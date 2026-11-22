import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtemp, readFile, rm, mkdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { installClaudePlugin } from './plugin.ts'

let temporaryRoot = ''

afterEach(async () => {
  if (temporaryRoot) await rm(temporaryRoot, { recursive: true, force: true })
})

describe('Claude plugin installer', () => {
  test('installs rules and skill without overwriting existing files', async () => {
    temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'elysia9x-claude-'))
    const existing = path.join(temporaryRoot, '.claude', 'rules', 'elysia9x.md')
    await mkdir(path.dirname(existing), { recursive: true })
    await writeFile(existing, 'user-owned content\n')

    const result = await installClaudePlugin({ cwd: temporaryRoot })

    expect(result.skipped).toContain('.claude/rules/elysia9x.md')
    expect(result.written).toContain('.claude/skills/elysia9x-audit/SKILL.md')
    expect(await readFile(existing, 'utf8')).toBe('user-owned content\n')
  })

  test('force replaces plugin-managed files when explicitly requested', async () => {
    temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'elysia9x-claude-force-'))
    const existing = path.join(temporaryRoot, '.claude', 'rules', 'elysia9x.md')
    await mkdir(path.dirname(existing), { recursive: true })
    await writeFile(existing, 'old content\n')

    const result = await installClaudePlugin({ cwd: temporaryRoot, force: true })

    expect(result.written).toContain('.claude/rules/elysia9x.md')
    expect(await readFile(existing, 'utf8')).toContain('Elysia9X')
  })
})
