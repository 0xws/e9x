#!/usr/bin/env bun
import { installCursorPlugin } from './plugin.ts'
const args = process.argv.slice(2)
if ((args[0] ?? 'help') === 'install') {
  const homeIndex = args.indexOf('--home')
  const homeDir = homeIndex >= 0 ? args[homeIndex + 1] : undefined
  if (homeIndex >= 0 && !homeDir) throw new Error('--home requires a directory path.')
  const options = homeDir ? { homeDir, force: args.includes('--force') } : { force: args.includes('--force') }
  const result = await installCursorPlugin(options)
  for (const item of result.written) console.log(`+ ${item}`)
  for (const item of result.skipped) console.log(`= ${item} (preserved; use --force to replace)`)
  console.log(`Installed Cursor plugin at ${result.destination}. Reload Cursor to discover it.`)
} else console.log('Elysia9X Cursor integration\n\nUsage: elysia9x-cursor install [--home PATH] [--force]\n\nInstalls a native plugin into ~/.cursor/plugins/local/elysia9x.')
