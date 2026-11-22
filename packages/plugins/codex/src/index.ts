#!/usr/bin/env bun
import path from 'node:path'
import { installCodexPlugin } from './plugin.ts'
const args = process.argv.slice(2)
const command = args[0] ?? 'help'
const cwd = path.resolve(args.includes('--cwd') ? args[args.indexOf('--cwd') + 1] ?? process.cwd() : process.cwd())
if (command === 'install') {
  const result = await installCodexPlugin({ cwd, force: args.includes('--force') })
  for (const item of result.written) console.log(`+ ${item}`)
  for (const item of result.skipped) console.log(`= ${item} (preserved; use --force to replace)`)
  console.log('Codex marketplace manifest installed. Open the supported Plugins directory to enable Elysia9X.')
} else console.log('Elysia9X Codex integration\n\nUsage: elysia9x-codex install [--cwd PATH] [--force]\n\nAdds the plugin under plugins/elysia9x and registers it in .agents/plugins/marketplace.json.')
