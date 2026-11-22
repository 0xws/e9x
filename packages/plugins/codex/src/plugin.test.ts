import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { installCodexPlugin } from './plugin.ts'
let root = ''
afterEach(async () => { if (root) await rm(root, { recursive: true, force: true }) })
describe('Codex plugin installer', () => {
  test('copies portable plugin and registers local marketplace', async () => {
    root = await mkdtemp(path.join(os.tmpdir(), 'e9x-codex-'))
    const result = await installCodexPlugin({ cwd: root })
    expect(result.written).toContain('plugins/elysia9x/plugin.json')
    const marketplace = JSON.parse(await readFile(path.join(root, '.agents/plugins/marketplace.json'), 'utf8'))
    expect(marketplace.plugins[0].name).toBe('elysia9x')
  })
})
