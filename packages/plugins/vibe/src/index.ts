#!/usr/bin/env bun
import { installVibePlugin } from './plugin.ts'
const args = process.argv.slice(2)
if ((args[0] ?? 'help') === 'install') {
  const scope = args.includes('--user') ? 'user' : 'project'
  const cwd = args.includes('--cwd') ? args[args.indexOf('--cwd') + 1] : process.cwd()
  const result = await installVibePlugin({ scope, cwd, force: args.includes('--force') })
  for (const item of result.written) console.log(`+ ${item}`)
  for (const item of result.skipped) console.log(`= ${item} (preserved; use --force to replace)`)
  console.log(`Installed Mistral Vibe plugin at ${result.destination}. Run /reload-plugins or start a new session.`)
} else console.log('Elysia9X Mistral Vibe integration\n\nUsage: elysia9x-vibe install [--user] [--cwd PATH] [--force]\n\nProject default: .vibe/plugins/elysia9x; user: ~/.vibe/plugins/elysia9x.')
