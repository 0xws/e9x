import { cp, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export interface InstallOptions { cwd?: string; force?: boolean }
export interface InstallResult { written: string[]; skipped: string[]; marketplace: string }
async function files(dir: string): Promise<string[]> {
  const result: string[] = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) result.push(...await files(full))
    else if (entry.isFile()) result.push(full)
  }
  return result
}
async function exists(file: string) { try { await stat(file); return true } catch { return false } }

export async function installCodexPlugin(options: InstallOptions = {}): Promise<InstallResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd())
  const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const templateRoot = path.join(packageRoot, 'templates')
  const destinationRoot = path.join(cwd, 'plugins', 'elysia9x')
  const result: InstallResult = { written: [], skipped: [], marketplace: '.agents/plugins/marketplace.json' }
  for (const source of await files(templateRoot)) {
    const relative = path.relative(templateRoot, source)
    const destination = path.join(destinationRoot, relative)
    await mkdir(path.dirname(destination), { recursive: true })
    if (await exists(destination) && !options.force) { result.skipped.push(path.posix.join('plugins/elysia9x', relative.split(path.sep).join('/'))); continue }
    await cp(source, destination, { force: true })
    result.written.push(path.posix.join('plugins/elysia9x', relative.split(path.sep).join('/')))
  }
  const marketplaceFile = path.join(cwd, '.agents', 'plugins', 'marketplace.json')
  await mkdir(path.dirname(marketplaceFile), { recursive: true })
  let marketplace: any = { name: 'elysia9x-local', interface: { displayName: 'Elysia9X' }, plugins: [] }
  if (await exists(marketplaceFile)) {
    try { marketplace = JSON.parse(await readFile(marketplaceFile, 'utf8')) } catch { throw new Error(`Invalid JSON in ${marketplaceFile}; refusing to overwrite it.`) }
  }
  if (!Array.isArray(marketplace.plugins)) throw new Error('Existing Codex marketplace must contain a plugins array.')
  const entry = { name: 'elysia9x', source: { source: 'local', path: './plugins/elysia9x' }, policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' }, category: 'Developer Tools' }
  const index = marketplace.plugins.findIndex((plugin: any) => plugin?.name === 'elysia9x')
  if (index >= 0) marketplace.plugins[index] = entry
  else marketplace.plugins.push(entry)
  await writeFile(marketplaceFile, `${JSON.stringify(marketplace, null, 2)}\n`)
  result.written.push('.agents/plugins/marketplace.json')
  return result
}
