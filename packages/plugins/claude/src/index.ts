#!/usr/bin/env bun
import path from 'node:path'
import { installClaudePlugin } from './plugin.ts'

const args = process.argv.slice(2)
const command = args[0] ?? 'help'
function option(name: string) {
  const index = args.indexOf(name)
  return index < 0 ? undefined : args[index + 1]
}

if (command === 'help' || args.includes('--help')) {
  console.log(`Elysia9X Claude Code integration

Usage:
  elysia9x-claude install [--cwd PATH] [--force]

Creates .claude/rules/elysia9x.md and .claude/skills/elysia9x-audit/SKILL.md.
Existing files are preserved unless --force is provided.`)
} else if (command === 'install') {
  const result = await installClaudePlugin({ cwd: path.resolve(option('--cwd') ?? process.cwd()), force: args.includes('--force') })
  for (const file of result.written) console.log(`+ ${file}`)
  for (const file of result.skipped) console.log(`= ${file} (preserved; use --force to overwrite)`)
  console.log('Claude Code integration installed.')
} else {
  console.error(`Unknown command: ${command}`)
  process.exitCode = 2
}
