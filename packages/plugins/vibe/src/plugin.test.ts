import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { installVibePlugin } from './plugin.ts'
let root = ''
afterEach(async () => { if (root) await rm(root, { recursive: true, force: true }) })
describe('Mistral Vibe plugin installer', () => {
  test('installs project plugin with Vibe extension', async () => {
    root = await mkdtemp(path.join(os.tmpdir(), 'e9x-vibe-'))
    const result = await installVibePlugin({ cwd: root })
    const manifest = JSON.parse(await readFile(path.join(result.destination, 'plugin.json'), 'utf8'))
    expect(manifest.extensions['ai.mistral.vibe'].schemaVersion).toBe(1)
    expect(result.written).toContain('skills/elysia9x-permissions/SKILL.md')
  })
})
