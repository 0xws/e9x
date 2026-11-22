import { cp, mkdir, readdir, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
export interface InstallOptions { cwd?: string; homeDir?: string; scope?: 'project' | 'user'; force?: boolean }
export interface InstallResult { written: string[]; skipped: string[]; destination: string }
async function files(dir: string): Promise<string[]> {
  const out: string[] = []
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...await files(full)); else if (e.isFile()) out.push(full)
  }
  return out
}
async function exists(file: string) { try { await stat(file); return true } catch { return false } }
export async function installVibePlugin(options: InstallOptions = {}): Promise<InstallResult> {
  const scope = options.scope ?? 'project'
  const vibeHome = process.env.VIBE_HOME ? path.resolve(process.env.VIBE_HOME) : path.join(options.homeDir ?? os.homedir(), '.vibe')
  const base = scope === 'user' ? path.join(vibeHome, 'plugins') : path.resolve(options.cwd ?? process.cwd(), '.vibe', 'plugins')
  const destination = path.join(base, 'elysia9x')
  const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const templateRoot = path.join(packageRoot, 'templates')
  const result: InstallResult = { written: [], skipped: [], destination }
  for (const source of await files(templateRoot)) {
    const relative = path.relative(templateRoot, source)
    const target = path.join(destination, relative)
    await mkdir(path.dirname(target), { recursive: true })
    if (await exists(target) && !options.force) { result.skipped.push(relative.split(path.sep).join('/')); continue }
    await cp(source, target, { force: true })
    result.written.push(relative.split(path.sep).join('/'))
  }
  return result
}
