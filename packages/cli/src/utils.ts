import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { Confidence, Finding, Severity } from './types.ts'

export const VERSION = '0.1.0'
export const CONFIG_DIR = '.elysia9x'
export const PERMISSIONS_FILE = `${CONFIG_DIR}/permissions.json`
export const POLICIES_FILE = `${CONFIG_DIR}/policies.json`

export function parseOption(args: string[], name: string): string | undefined {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

export function hasFlag(args: string[], name: string): boolean {
  return args.includes(name)
}

export function resolveProjectRoot(args: string[]): string {
  return path.resolve(parseOption(args, '--cwd') ?? process.cwd())
}

export function toPosix(value: string): string {
  return value.replaceAll('\\', '/')
}

export function lineAt(source: string, index: number): number {
  return source.slice(0, index).split('\n').length
}

export function addFinding(
  findings: Finding[],
  ruleId: string,
  severity: Severity,
  confidence: Confidence,
  message: string,
  remediation: string,
  extra: Partial<Omit<Finding, 'ruleId' | 'severity' | 'confidence' | 'message' | 'remediation' | 'autofix'>> = {},
): void {
  findings.push({ ruleId, severity, confidence, message, remediation, autofix: false, ...extra })
}

export async function readText(file: string): Promise<string> {
  try {
    return await readFile(file, 'utf8')
  } catch {
    return ''
  }
}

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(file, 'utf8')) as T
  } catch {
    return fallback
  }
}

export async function writeJsonIfMissing(file: string, value: unknown): Promise<boolean> {
  try {
    await readFile(file)
    return false
  } catch {
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, `${JSON.stringify(value, null, 2)}\n`)
    return true
  }
}

export function routeKey(route: { feature: string; method: string; path: string }): string {
  const normalized = route.path
    .replace(/:[A-Za-z_$][\w$]*/g, ':param')
    .replace(/\{[^}]+\}/g, ':param')
    .replace(/\[\.\.\.[^\]]+\]/g, '*')
    .replace(/\[\[\.\.\.[^\]]+\]\]/g, '*')
    .replace(/\[\.\.\.[^\]]+\]/g, '*')
    .replace(/\[[^\]]+\]/g, ':param')
    .replace(/\/+/g, '/')
  return `${route.feature}|${route.method.toUpperCase()}|${normalized}`
}

export function printFindings(findings: Finding[], projectRoot: string): void {
  const rank: Record<Severity, number> = { error: 0, warning: 1, info: 2 }
  const sorted = [...findings].sort((a, b) => rank[a.severity] - rank[b.severity] || a.ruleId.localeCompare(b.ruleId))
  console.log(`\nElysia9X audit — ${projectRoot}\n`)
  for (const finding of sorted) {
    const location = finding.file ? ` ${finding.file}${finding.line ? `:${finding.line}` : ''}` : ''
    console.log(`${finding.severity.toUpperCase().padEnd(7)} ${finding.ruleId}${location}`)
    console.log(`        ${finding.message}`)
    console.log(`        Remediation: ${finding.remediation}`)
  }
  const errors = sorted.filter((item) => item.severity === 'error').length
  const warnings = sorted.filter((item) => item.severity === 'warning').length
  const info = sorted.filter((item) => item.severity === 'info').length
  console.log(`\nFindings: ${sorted.length} | Errors: ${errors} | Warnings: ${warnings} | Info: ${info}`)
  console.log('Static analysis is evidence, not proof. Review low-confidence and runtime behavior manually.')
}

export function buildSummary(findings: Finding[]) {
  return {
    total: findings.length,
    errors: findings.filter((item) => item.severity === 'error').length,
    warnings: findings.filter((item) => item.severity === 'warning').length,
    info: findings.filter((item) => item.severity === 'info').length,
  }
}
