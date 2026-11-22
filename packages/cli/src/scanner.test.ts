import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { auditArchitecture, discoverEndpoints } from './scanner.ts'
import type { Finding } from './types.ts'

let temporaryRoot = ''
afterEach(async () => {
  if (temporaryRoot) await rm(temporaryRoot, { recursive: true, force: true })
})

describe('TypeScript AST discovery', () => {
  test('discovers literal Elysia routes but ignores comments and dynamic paths', async () => {
    temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'elysia9x-ast-'))
    const routeDir = path.join(temporaryRoot, 'features', 'missions', 'transport')
    await mkdir(routeDir, { recursive: true })
    await writeFile(path.join(routeDir, 'routes.ts'), `
      // app.get('/comment-only', handler)
      const routes = new Elysia().get('/missions/:id', handler)
      routes.post(prefix + '/dynamic', handler)
    `)

    const endpoints = await discoverEndpoints(temporaryRoot)
    expect(endpoints).toHaveLength(1)
    expect(endpoints[0]?.method).toBe('GET')
    expect(endpoints[0]?.path).toBe('/missions/:id')
  })
})

describe('architecture audit', () => {
  test('flags framework imports in domain modules', async () => {
    temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'elysia9x-arch-'))
    const domainDir = path.join(temporaryRoot, 'features', 'missions', 'domain')
    await mkdir(domainDir, { recursive: true })
    await writeFile(path.join(domainDir, 'mission.ts'), `import { pgTable } from 'drizzle-orm/pg-core'\n`)

    const findings: Finding[] = []
    await auditArchitecture(temporaryRoot, findings)
    expect(findings.some((finding) => finding.ruleId === 'ARCH.DOMAIN_FRAMEWORK_IMPORT')).toBe(true)
  })
})
