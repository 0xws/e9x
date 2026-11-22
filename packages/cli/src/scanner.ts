import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import ts from 'typescript'
import type { Endpoint, Finding } from './types.ts'
import { addFinding, lineAt, readText, toPosix } from './utils.ts'

const ignoredDirs = new Set([
  'node_modules', '.git', '.next', '.nuxt', '.output', 'dist', 'build', 'coverage', '.turbo', '.vercel',
])
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts', '.mjs', '.cjs'])
const httpMethods = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head'])

export async function walkFiles(root: string, options: { extensions?: Set<string>; maxDepth?: number } = {}): Promise<string[]> {
  const results: string[] = []
  const maxDepth = options.maxDepth ?? 24
  async function walk(dir: string, depth: number): Promise<void> {
    if (depth > maxDepth) return
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry.isSymbolicLink() || ignoredDirs.has(entry.name)) continue
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) await walk(fullPath, depth + 1)
      else if (entry.isFile() && (!options.extensions || options.extensions.has(path.extname(entry.name).toLowerCase()))) {
        results.push(fullPath)
      }
    }
  }
  await walk(root, 0)
  return results.sort()
}

function featureFor(root: string, file: string): string {
  const relative = toPosix(path.relative(root, file))
  const parts = relative.split('/')
  const featureIndex = parts.indexOf('features')
  return featureIndex >= 0 ? parts[featureIndex + 1] ?? 'unknown' : 'app'
}

function scriptKind(file: string): ts.ScriptKind {
  const extension = path.extname(file).toLowerCase()
  if (extension === '.tsx' || extension === '.jsx') return ts.ScriptKind.TSX
  if (extension === '.js' || extension === '.mjs' || extension === '.cjs') return ts.ScriptKind.JS
  return ts.ScriptKind.TS
}

function isExported(node: ts.Node): boolean {
  const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined
  return Boolean(modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword))
}

function isHttpMethodName(name: string | undefined): name is string {
  return Boolean(name && httpMethods.has(name.toLowerCase()))
}

function routeLiteral(node: ts.Expression | undefined): string | undefined {
  if (!node) return undefined
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    const value = node.text
    return value.startsWith('/') ? value : undefined
  }
  return undefined
}

export async function discoverEndpoints(root: string): Promise<Endpoint[]> {
  const featureDir = path.join(root, 'features')
  const appDir = path.join(root, 'app')
  const files = [
    ...(await walkFiles(featureDir, { extensions: sourceExtensions })),
    ...(await walkFiles(appDir, { extensions: sourceExtensions })),
  ]
  const endpoints: Endpoint[] = []

  for (const file of files) {
    const source = await readText(file)
    const relative = toPosix(path.relative(root, file))
    const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, scriptKind(file))
    const isNextRoute = /(^|\/)route\.(ts|tsx|js|jsx|mts|mjs)$/.test(relative)

    // The optional catch-all is normally the one Next.js-to-Elysia adapter, not a business route.
    const isElysiaCatchAllAdapter = isNextRoute && /\[\[\.\.\./.test(relative)

    if (isNextRoute && !isElysiaCatchAllAdapter) {
      for (const statement of sourceFile.statements) {
        if (ts.isFunctionDeclaration(statement) && statement.name && isExported(statement)) {
          const method = statement.name.text.toUpperCase()
          if (httpMethods.has(method.toLowerCase())) {
            const routePath = relative
              .replace(/^app\//, '/')
              .replace(/\/route\.[^.]+$/, '')
              .replace(/\[\.\.\.([^\]]+)\]/g, '*$1')
              .replace(/\[([^\]]+)\]/g, ':$1')
            endpoints.push({
              feature: featureFor(root, file), method, path: routePath || '/', file: relative,
              line: sourceFile.getLineAndCharacterOfPosition(statement.getStart(sourceFile)).line + 1,
              framework: 'next-route-handler', snippet: statement.getText(sourceFile).slice(0, 1600),
            })
          }
        }
        if (ts.isVariableStatement(statement) && isExported(statement)) {
          for (const declaration of statement.declarationList.declarations) {
            if (ts.isIdentifier(declaration.name) && httpMethods.has(declaration.name.text.toLowerCase())) {
              const method = declaration.name.text.toUpperCase()
              const line = sourceFile.getLineAndCharacterOfPosition(statement.getStart(sourceFile)).line + 1
              endpoints.push({
                feature: featureFor(root, file), method,
                path: relative.replace(/^app\//, '/').replace(/\/route\.[^.]+$/, '').replace(/\[\.\.\.([^\]]+)\]/g, '*$1').replace(/\[([^\]]+)\]/g, ':$1'),
                file: relative, line, framework: 'next-route-handler', snippet: statement.getText(sourceFile).slice(0, 1600),
              })
            }
          }
        }
      }
    }

    if (isElysiaCatchAllAdapter) continue

    function visit(node: ts.Node): void {
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        const method = node.expression.name.text.toLowerCase()
        const routePath = routeLiteral(node.arguments[0])
        if (isHttpMethodName(method) && routePath) {
          const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
          endpoints.push({
            feature: featureFor(root, file), method: method.toUpperCase(), path: routePath,
            file: relative, line, framework: 'elysia-static',
            snippet: node.getText(sourceFile).slice(0, 1600),
          })
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(sourceFile)
  }

  const seen = new Set<string>()
  return endpoints.filter((endpoint) => {
    const key = `${endpoint.file}|${endpoint.method}|${endpoint.path}|${endpoint.line}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function moduleSpecifiers(sourceFile: ts.SourceFile): Array<{ value: string; node: ts.Node }> {
  const imports: Array<{ value: string; node: ts.Node }> = []
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      imports.push({ value: statement.moduleSpecifier.text, node: statement })
    }
    if (ts.isExportDeclaration(statement) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
      imports.push({ value: statement.moduleSpecifier.text, node: statement })
    }
  }
  return imports
}

export async function auditArchitecture(root: string, findings: Finding[]): Promise<void> {
  const featuresRoot = path.join(root, 'features')
  const files = await walkFiles(featuresRoot, { extensions: sourceExtensions })

  for (const file of files) {
    const source = await readText(file)
    const relative = toPosix(path.relative(root, file))
    const feature = featureFor(root, file)
    const segments = relative.split('/')
    const layer = segments[2] ?? ''
    const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, scriptKind(file))

    for (const item of moduleSpecifiers(sourceFile)) {
      const target = item.value
      const line = sourceFile.getLineAndCharacterOfPosition(item.node.getStart(sourceFile)).line + 1
      const crossFeature = target.match(/(?:^|\/|@\/)?features\/([^/]+)/)
      if (crossFeature && crossFeature[1] !== feature) {
        const targetFeature = crossFeature[1]!
        const isPublicEntry = target === `features/${targetFeature}`
          || target === `@/features/${targetFeature}`
          || target.endsWith(`/features/${targetFeature}/index`)
          || target.endsWith(`/features/${targetFeature}`)
        if (!isPublicEntry) addFinding(findings, 'ARCH.CROSS_FEATURE_INTERNAL_IMPORT', 'error', 'medium',
          `Feature ${feature} appears to import an internal path of feature ${targetFeature}.`,
          `Import from features/${targetFeature}'s public entry point or expose a deliberate public contract.`,
          { feature, file: relative, line, evidence: target })
      }

      if (layer === 'domain' && /^(react|next|elysia|drizzle-orm|@elysiajs)(\/|$)/.test(target)) {
        addFinding(findings, 'ARCH.DOMAIN_FRAMEWORK_IMPORT', 'error', 'high',
          `Domain layer imports framework/infrastructure package ${target}.`,
          'Move framework and persistence dependencies to an outer adapter.',
          { feature, file: relative, line, evidence: target })
      }
      if (layer === 'domain' && /(^|\/)(infrastructure|transport|ui)\//.test(target)) {
        addFinding(findings, 'ARCH.DOMAIN_OUTWARD_IMPORT', 'error', 'medium',
          'Domain layer appears to import an outer layer.',
          'Reverse the dependency through a domain or application contract.',
          { feature, file: relative, line, evidence: target })
      }
    }

    let consoleFinding: ts.CallExpression | undefined
    function checkConsole(node: ts.Node): void {
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)
        && ts.isIdentifier(node.expression.expression) && node.expression.expression.text === 'console'
        && ['log', 'debug', 'info'].includes(node.expression.name.text)) consoleFinding ??= node
      ts.forEachChild(node, checkConsole)
    }
    checkConsole(sourceFile)
    if (consoleFinding) addFinding(findings, 'OPS.CONSOLE_LOG', 'warning', 'high',
      'Console logging found in feature code.',
      'Use the project structured logger and verify that sensitive data is not logged.',
      { feature, file: relative, line: sourceFile.getLineAndCharacterOfPosition(consoleFinding.getStart(sourceFile)).line + 1 })

    const envMatch = /\bprocess\.env\.[A-Z][A-Z0-9_]*/.exec(source)
    if (envMatch && !relative.startsWith('server/config/')) addFinding(findings, 'CONFIG.DIRECT_ENV_ACCESS', 'warning', 'medium',
      'Direct process.env access found outside the configuration boundary.',
      'Validate environment once and inject a typed configuration object.',
      { feature, file: relative, line: lineAt(source, envMatch.index) })
  }

  let featureEntries = []
  try { featureEntries = await readdir(featuresRoot, { withFileTypes: true }) } catch { return }
  for (const entry of featureEntries.filter((item) => item.isDirectory())) {
    const base = path.join(featuresRoot, entry.name)
    try { await stat(path.join(base, 'index.ts')) } catch {
      addFinding(findings, 'FEATURE.PUBLIC_ENTRY_MISSING', 'warning', 'high',
        `Feature ${entry.name} is missing index.ts.`,
        'Create an intentional public entry point for cross-feature consumers or document why the feature is private.',
        { feature: entry.name, file: toPosix(path.relative(root, base)) })
    }
  }
}

export async function auditDatabase(root: string, findings: Finding[]): Promise<void> {
  const files = [
    ...(await walkFiles(path.join(root, 'server', 'db'), { extensions: new Set(['.sql']) })),
    ...(await walkFiles(path.join(root, 'drizzle'), { extensions: new Set(['.sql']) })),
  ]
  const seen = new Set<string>()
  for (const file of files) {
    if (seen.has(file)) continue
    seen.add(file)
    const source = await readText(file)
    const relative = toPosix(path.relative(root, file))
    const destructive = /\b(DROP\s+(TABLE|COLUMN|SCHEMA)|TRUNCATE\s+(TABLE\s+)?\w+)/i.exec(source)
    if (destructive) addFinding(findings, 'DB.DESTRUCTIVE_MIGRATION', 'warning', 'high',
      'Potential destructive SQL found in a migration.',
      'Review data impact, backup/restore readiness, compatibility with old application versions and expand-contract alternatives.',
      { file: relative, line: lineAt(source, destructive.index) })

    const updateWithoutWhere = /\bUPDATE\s+[\w."`]+\s+SET\b[\s\S]*?;/gi
    for (const match of source.matchAll(updateWithoutWhere)) {
      if (!/\bWHERE\b/i.test(match[0])) addFinding(findings, 'DB.UNBOUNDED_UPDATE', 'warning', 'medium',
        'UPDATE statement has no WHERE clause in the same statement.',
        'Confirm the full-table update is intentional; use bounded batches for large data backfills.',
        { file: relative, line: lineAt(source, match.index ?? 0), evidence: match[0].slice(0, 180) })
    }
    const deleteWithoutWhere = /\bDELETE\s+FROM\s+[\w."`]+\s*;/gi
    for (const match of source.matchAll(deleteWithoutWhere)) addFinding(findings, 'DB.UNBOUNDED_DELETE', 'error', 'high',
      'DELETE statement removes all rows from a table.',
      'Add an intentional filter or document and separately approve the destructive migration.',
      { file: relative, line: lineAt(source, match.index ?? 0), evidence: match[0] })
  }

  const migrationDirs = [path.join(root, 'server', 'db', 'migrations'), path.join(root, 'drizzle')]
  let foundMigrations = false
  for (const dir of migrationDirs) {
    try { if ((await readdir(dir)).length > 0) foundMigrations = true } catch { /* optional */ }
  }
  if (!foundMigrations) addFinding(findings, 'DB.MIGRATIONS_NOT_FOUND', 'info', 'medium',
    'No migration directory found in conventional locations.',
    'Declare the project migration directory in .elysia9x/config.json or document the chosen migration strategy.')
}

export async function auditEnvironment(root: string, findings: Finding[]): Promise<void> {
  const files = await walkFiles(root, { extensions: sourceExtensions })
  const referenced = new Map<string, string>()
  const patterns = [ /(?:process\.env|Bun\.env)\.([A-Z][A-Z0-9_]*)/g, /(?:process\.env|Bun\.env)\[['"]([A-Z][A-Z0-9_]*)['"]\]/g ]
  for (const file of files) {
    const source = await readText(file)
    for (const pattern of patterns) {
      for (const match of source.matchAll(pattern)) referenced.set(match[1]!, toPosix(path.relative(root, file)))
    }
  }

  const examplePath = path.join(root, '.env.example')
  const example = await readText(examplePath)
  if (referenced.size && !example) addFinding(findings, 'ENV.EXAMPLE_MISSING', 'warning', 'high',
    'Environment variables are referenced but .env.example is missing.',
    'Add a safe template containing variable names and non-secret example values.')
  else {
    for (const [name, file] of referenced) {
      if (!new RegExp(`^\\s*${name}\\s*=`, 'm').test(example)) addFinding(findings, 'ENV.EXAMPLE_GAP', 'warning', 'medium',
        `Environment variable ${name} is referenced but missing from .env.example.`,
        'Document the variable name with a safe placeholder; never commit its real secret.',
        { file })
    }
  }

  const likelySecret = /(?:api[_-]?key|client[_-]?secret|password|access[_-]?token)\s*[:=]\s*['"][A-Za-z0-9_\/+.-]{20,}['"]/i
  for (const file of await walkFiles(root, { extensions: new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.yml', '.yaml', '.toml']) })) {
    const relative = toPosix(path.relative(root, file))
    if (relative.includes('.example') || relative.includes('node_modules')) continue
    const source = await readText(file)
    const match = likelySecret.exec(source)
    if (match) addFinding(findings, 'SECURITY.POSSIBLE_HARDCODED_SECRET', 'error', 'low',
      'Possible hard-coded credential pattern. This heuristic may be a false positive.',
      'Verify whether the value is a real credential. Rotate exposed credentials and use a secret manager. Run a dedicated secret scanner.',
      { file: relative, line: lineAt(source, match.index) })
  }
}
