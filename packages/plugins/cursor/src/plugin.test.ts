import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtemp, readFile, rm, mkdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { installCursorPlugin } from './plugin.ts'
let root = ''
afterEach(async () => { if (root) await rm(root, { recursive: true, force: true }) })
describe('Cursor plugin installer', () => {
  test('installs native manifest under local plugin directory', async () => {
    root = await mkdtemp(path.join(os.tmpdir(), 'e9x-cursor-'))
    const result = await installCursorPlugin({ homeDir: root })
    expect(result.written).toContain('.cursor-plugin/plugin.json')
    expect(JSON.parse(await readFile(path.join(result.destination, '.cursor-plugin/plugin.json'), 'utf8')).name).toBe('elysia9x')
  })
  test('preserves existing files by default', async () => {
    root = await mkdtemp(path.join(os.tmpdir(), 'e9x-cursor-preserve-'))
    const destination = path.join(root, '.cursor/plugins/local/elysia9x/rules/elysia9x.mdc')
    await mkdir(path.dirname(destination), { recursive: true })
    await writeFile(destination, 'custom rule')
    const result = await installCursorPlugin({ homeDir: root })
    expect(result.skipped).toContain('rules/elysia9x.mdc')
    expect(await readFile(destination, 'utf8')).toBe('custom rule')
  })
})
