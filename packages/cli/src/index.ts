#!/usr/bin/env bun
import { access, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { installClaudePlugin } from '@elysia9x/plugin-claude'
import { installCodexPlugin } from '@elysia9x/plugin-codex'
import { installCursorPlugin } from '@elysia9x/plugin-cursor'
import { installVibePlugin } from '@elysia9x/plugin-vibe'
import type { AuditReport, Endpoint, Finding } from './types.ts'
import { auditPermissions } from './permissions.ts'
import { auditArchitecture, auditDatabase, auditEnvironment, discoverEndpoints } from './scanner.ts'
import {
  buildSummary, CONFIG_DIR, hasFlag, parseOption, PERMISSIONS_FILE,
  POLICIES_FILE, printFindings, resolveProjectRoot, toPosix, VERSION, writeJsonIfMissing,
} from './utils.ts'

const rawArgs = process.argv.slice(2)
const command = rawArgs[0] ?? 'help'
const subcommand = rawArgs[1] ?? ''
const root = resolveProjectRoot(rawArgs)
const findings: Finding[] = []
const endpoints: Endpoint[] = []

function help(): void {
  console.log(`Elysia9X — production engineering governance for Bun and TypeScript

Usage:
  elysia9x init [--cwd PATH]
  elysia9x doctor [--cwd PATH]
  elysia9x scan [--cwd PATH] [--json]
  elysia9x permissions audit [--feature NAME] [--cwd PATH] [--json]
  elysia9x routes inventory [--cwd PATH] [--json]
  elysia9x architecture audit [--cwd PATH] [--json]
  elysia9x database audit [--cwd PATH] [--json]
  elysia9x env audit [--cwd PATH] [--json]
  elysia9x report --format json|markdown [--out FILE] [--cwd PATH]
  elysia9x integrations list
  elysia9x integrations install claude|codex|cursor|vibe [--force] [--cwd PATH]
  elysia9x integrations install vibe --user [--force]

Options:
  --cwd PATH       Project directory to inspect/install project-scoped integrations (defaults to current directory)
                   Cursor integration installs to the current user's local plugin directory
  --feature NAME   Limit permission inventory to one feature
  --json           Emit machine-readable JSON
  --format FORMAT  Report format: json or markdown
  --out FILE       Write report to a file
  --force          Overwrite files managed by an integration
  --version        Print the CLI version
  --help           Show this help

Exit codes:
  0  No error-severity findings
  1  Audit completed with error-severity findings
  2  Invalid command, invalid configuration or execution error

Static analysis is evidence, not proof. Dynamic routes, composed plugins and runtime authorization require runtime tests.`)
}

async function init(): Promise<void> {
  const base = path.join(root, CONFIG_DIR)
  await mkdir(base, { recursive: true })
  const created: string[] = []
  const configPath = path.join(base, 'config.json')
  const permissionsPath = path.join(root, PERMISSIONS_FILE)
  const policiesPath = path.join(root, POLICIES_FILE)
  const configCreated = await writeJsonIfMissing(configPath, {
    version: 1,
    projectName: path.basename(root),
    featuresDir: 'features',
    permissionsFile: PERMISSIONS_FILE,
    policiesFile: POLICIES_FILE,
    reviewMaxAgeDays: 180,
    scanner: { reportUnverified: true, failOn: ['error'] },
  })
  if (configCreated) created.push(toPosix(path.relative(root, configPath)))
  if (await writeJsonIfMissing(permissionsPath, { version: 1, routes: [] })) created.push(PERMISSIONS_FILE)
  if (await writeJsonIfMissing(policiesPath, { version: 1, policies: [] })) created.push(POLICIES_FILE)
  console.log(created.length ? `Initialized Elysia9X metadata:\n${created.map((item) => `  + ${item}`).join('\n')}` : 'Elysia9X metadata already exists; no files were overwritten.')
  console.log('No endpoint was granted public access. Inventory routes and declare permissions explicitly.')
}

async function doctor(): Promise<void> {
  const checks: Array<[string, boolean, string]> = []
  checks.push(['Bun runtime', typeof Bun !== 'undefined', 'Install Bun 1.2 or later to run this CLI.'])
  checks.push(['Project directory', await exists(root), `Project directory not found: ${root}`])
  checks.push(['package.json', await exists(path.join(root, 'package.json')), 'Run this inside a project or use --cwd.'])
  checks.push(['features/ directory', await exists(path.join(root, 'features')), 'Create features/ or configure your project layout.'])
  checks.push(['Elysia9X metadata', await exists(path.join(root, CONFIG_DIR)), 'Run `elysia9x init`.'])
  for (const [name, ok, advice] of checks) console.log(`${ok ? 'PASS' : 'WARN'} ${name}${ok ? '' : ` — ${advice}`}`)
  if (checks.some(([, ok]) => !ok)) process.exitCode = 1
}

async function exists(file: string): Promise<boolean> {
  try { await access(file); return true } catch { return false }
}

function outputReport(format: 'json' | 'markdown', report: AuditReport): string {
  if (format === 'json') return `${JSON.stringify(report, null, 2)}\n`
  const lines = [
    '# Elysia9X audit report',
    '',
    `- Project: \`${report.projectRoot}\``,
    `- Generated: ${report.generatedAt}`,
    `- Endpoints discovered: ${report.endpoints.length}`,
    `- Findings: ${report.summary.total} (${report.summary.errors} errors, ${report.summary.warnings} warnings, ${report.summary.info} info)`,
    '',
    '## Endpoint inventory',
    '',
    '| Feature | Method | Path | Access | Policy | Review | Source |',
    '|---|---|---|---|---|---|---|',
    ...report.endpoints.map((endpoint) => `| ${endpoint.feature} | ${endpoint.method} | \`${endpoint.path}\` | ${endpoint.access ?? 'unreviewed'} | ${endpoint.policy ?? '—'} | ${endpoint.reviewStatus ?? 'unreviewed'} | ${endpoint.file}:${endpoint.line} |`),
    '',
    '## Findings',
    '',
    ...(report.findings.length ? report.findings.map((finding) => `### ${finding.severity.toUpperCase()}: ${finding.ruleId}\n\n${finding.message}\n\nRemediation: ${finding.remediation}\n`) : ['No findings.']),
    '',
    '> Static analysis is evidence, not proof. Runtime authorization and dynamic route composition require tests.',
  ]
  return `${lines.join('\n')}\n`
}

async function runAudits(scope: string[]): Promise<AuditReport> {
  const featureFilter = parseOption(scope, '--feature')
  const needsPermissionAudit = scope.some((item) => ['permissions', 'scan', 'report'].includes(item))
  if (needsPermissionAudit) {
    endpoints.push(...await auditPermissions(root, findings, featureFilter))
  } else {
    endpoints.push(...await discoverEndpoints(root))
  }
  if (scope.includes('architecture') || scope.includes('scan') || scope.includes('report')) await auditArchitecture(root, findings)
  if (scope.includes('database') || scope.includes('scan') || scope.includes('report')) await auditDatabase(root, findings)
  if (scope.includes('env') || scope.includes('scan') || scope.includes('report')) await auditEnvironment(root, findings)
  if (scope.includes('scan')) {
    // Cross-domain checks are deliberately composed here so CI has one entry point.
  }
  const uniqueEndpoints = [...new Map(endpoints.map((item) => [`${item.file}|${item.method}|${item.path}|${item.line}`, item])).values()]
  return {
    tool: 'elysia9x', version: VERSION, generatedAt: new Date().toISOString(),
    projectRoot: root, endpoints: uniqueEndpoints, findings,
    summary: buildSummary(findings),
  }
}

async function writeOrPrint(report: AuditReport): Promise<void> {
  const format = parseOption(rawArgs, '--format') ?? (hasFlag(rawArgs, '--json') ? 'json' : 'text')
  if (format === 'json' || format === 'markdown') {
    const content = outputReport(format, report)
    const out = parseOption(rawArgs, '--out')
    if (out) {
      const outputPath = path.resolve(root, out)
      await mkdir(path.dirname(outputPath), { recursive: true })
      await writeFile(outputPath, content)
      console.log(`Wrote ${toPosix(path.relative(root, outputPath))}`)
    } else console.log(content)
  } else {
    console.log(`\nEndpoints discovered: ${report.endpoints.length}`)
    for (const endpoint of report.endpoints) console.log(`${endpoint.method.padEnd(7)} ${endpoint.path.padEnd(34)} ${(endpoint.access ?? 'unreviewed').padEnd(12)} ${(endpoint.policy ?? '—').padEnd(24)} ${endpoint.file}:${endpoint.line}`)
    printFindings(report.findings, root)
  }
  if (report.summary.errors > 0) process.exitCode = 1
}

async function integrations(): Promise<void> {
  if (subcommand === 'list') {
    console.log('Available Elysia9X integrations:\n  claude  @elysia9x/plugin-claude  Claude Code rules and skills\n  codex   @elysia9x/plugin-codex   Portable Codex plugin + repo marketplace\n  cursor  @elysia9x/plugin-cursor  Native Cursor plugin (user local plugin directory)\n  vibe    @elysia9x/plugin-vibe    Mistral Vibe plugin (project or user scope)')
    return
  }
  if (subcommand === 'install') {
    const pluginName = rawArgs[2]
    const force = hasFlag(rawArgs, '--force')
    if (pluginName === 'claude') {
      const result = await installClaudePlugin({ cwd: root, force })
      for (const item of result.written) console.log(`+ ${item}`)
      for (const item of result.skipped) console.log(`= ${item} (already exists; use --force to replace)`)
      console.log('Claude Code integration installed. Review the generated instructions before use.')
      return
    }
    if (pluginName === 'codex') {
      const result = await installCodexPlugin({ cwd: root, force })
      for (const item of result.written) console.log(`+ ${item}`)
      for (const item of result.skipped) console.log(`= ${item} (already exists; use --force to replace)`)
      console.log('Codex plugin and repo marketplace installed. Open the supported Plugins directory to enable it.')
      return
    }
    if (pluginName === 'cursor') {
      const result = await installCursorPlugin({ force })
      for (const item of result.written) console.log(`+ ${item}`)
      for (const item of result.skipped) console.log(`= ${item} (already exists; use --force to replace)`)
      console.log(`Cursor plugin installed at ${result.destination}. Reload Cursor to discover it.`)
      return
    }
    if (pluginName === 'vibe') {
      const result = await installVibePlugin({ cwd: root, scope: hasFlag(rawArgs, '--user') ? 'user' : 'project', force })
      for (const item of result.written) console.log(`+ ${item}`)
      for (const item of result.skipped) console.log(`= ${item} (already exists; use --force to replace)`)
      console.log(`Mistral Vibe plugin installed at ${result.destination}. Run /reload-plugins.`)
      return
    }
    throw new Error(`Unknown integration: ${pluginName ?? '(missing)'}. Run integrations list.`)
  }
  throw new Error('Usage: elysia9x integrations list | integrations install claude|codex|cursor|vibe')
}

async function main(): Promise<void> {
  if (hasFlag(rawArgs, '--version') || command === 'version') return console.log(VERSION)
  if (hasFlag(rawArgs, '--help') || command === 'help') return help()
  if (command === 'init') return init()
  if (command === 'doctor') return doctor()
  if (command === 'integrations') return integrations()

  if (command === 'permissions' && subcommand === 'audit') {
    const report = await runAudits(['permissions', ...rawArgs.slice(2)])
    return writeOrPrint(report)
  }
  if (command === 'routes' && subcommand === 'inventory') {
    const discovered = await discoverEndpoints(root)
    if (hasFlag(rawArgs, '--json')) console.log(JSON.stringify(discovered, null, 2))
    else {
      console.log(`Discovered ${discovered.length} statically visible endpoints in ${root}\n`)
      for (const endpoint of discovered) console.log(`${endpoint.method.padEnd(7)} ${endpoint.path.padEnd(36)} ${endpoint.feature.padEnd(18)} ${endpoint.file}:${endpoint.line}`)
      console.log('\nDynamic Elysia registration and composed plugins may not appear in this inventory.')
    }
    return
  }
  if (command === 'architecture' && subcommand === 'audit') return writeOrPrint(await runAudits(['architecture']))
  if (command === 'database' && subcommand === 'audit') return writeOrPrint(await runAudits(['database']))
  if (command === 'env' && subcommand === 'audit') return writeOrPrint(await runAudits(['env']))
  if (command === 'scan') return writeOrPrint(await runAudits(['scan']))
  if (command === 'report') return writeOrPrint(await runAudits(['report']))

  throw new Error(`Unknown command: ${[command, subcommand].filter(Boolean).join(' ')}. Run --help.`)
}

try {
  await main()
} catch (error) {
  console.error(`Elysia9X: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 2
}
