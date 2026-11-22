import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { auditPermissions } from './permissions.ts'
import type { Finding } from './types.ts'

let temporaryRoot = ''
afterEach(async () => {
  if (temporaryRoot) await rm(temporaryRoot, { recursive: true, force: true })
})

describe('permissions audit', () => {
  test('reports an endpoint without a declaration', async () => {
    temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'elysia9x-'))
    const routeDir = path.join(temporaryRoot, 'features', 'missions', 'transport')
    await mkdir(routeDir, { recursive: true })
    await writeFile(path.join(routeDir, 'routes.ts'), `const routes = new Elysia().get('/missions', handler)\n`)
    await mkdir(path.join(temporaryRoot, '.elysia9x'), { recursive: true })
    await writeFile(path.join(temporaryRoot, '.elysia9x', 'permissions.json'), JSON.stringify({ version: 1, routes: [] }))
    await writeFile(path.join(temporaryRoot, '.elysia9x', 'policies.json'), JSON.stringify({ version: 1, policies: [] }))
    const findings: Finding[] = []
    const endpoints = await auditPermissions(temporaryRoot, findings)
    expect(endpoints).toHaveLength(1)
    expect(findings.some((finding) => finding.ruleId === 'AUTHZ.MISSING_DECLARATION')).toBe(true)
  })
})
