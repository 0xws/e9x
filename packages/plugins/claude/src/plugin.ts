import { cp, mkdir, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export interface InstallOptions {
  cwd?: string
  force?: boolean
}

export interface InstallResult {
  written: string[]
  skipped: string[]
}

async function listFiles(directory: string): Promise<string[]> {
  const files: string[] = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await listFiles(full))
    else if (entry.isFile()) files.push(full)
  }
  return files
}

export async function installClaudePlugin(options: InstallOptions = {}): Promise<InstallResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd())
  const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const templateRoot = path.join(packageRoot, 'templates')
  const files = await listFiles(templateRoot)
  const result: InstallResult = { written: [], skipped: [] }

  for (const source of files) {
    const relative = path.relative(templateRoot, source)
    const destination = path.join(cwd, relative)
    await mkdir(path.dirname(destination), { recursive: true })
    let exists = false
    try { await stat(destination); exists = true } catch { /* destination absent */ }
    if (exists && !options.force) {
      result.skipped.push(relative.replaceAll(path.sep, '/'))
      continue
    }
    await cp(source, destination, { force: true })
    result.written.push(relative.replaceAll(path.sep, '/'))
  }
  return result
}
