import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageDir = path.resolve(scriptDir, '..')
const docsDir = path.join(packageDir, 'docs')
const publicDir = path.join(docsDir, 'public')
const generatedDir = path.join(publicDir, 'llms', 'pages')
const siteUrl = (process.env.DOCS_SITE_URL ?? 'https://0xws.github.io').replace(/\/$/, '')
const basePath = `/${(process.env.DOCS_BASE ?? '/').replace(/^\/+|\/+$/g, '')}`.replace(/^\/$/, '/')
const absolutePath = (route: string) => `${basePath === '/' ? '' : basePath}${route}`

async function listMarkdown(dir: string): Promise<string[]> {
  const results: string[] = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === '.vitepress' || entry.name === 'public' || entry.name.startsWith('_')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) results.push(...await listMarkdown(full))
    else if (entry.isFile() && entry.name.endsWith('.md')) results.push(full)
  }
  return results.sort((a, b) => a.localeCompare(b))
}

function stripFrontmatter(source: string): string {
  return source.replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n/, '').trim()
}

function slugFor(file: string): string {
  const relative = path.relative(docsDir, file).replaceAll(path.sep, '/')
  return relative.replace(/\.md$/, '')
}

function titleFor(markdown: string, fallback: string): string {
  const match = markdown.match(/^#\s+(.+)$/m)
  return match?.[1]?.trim() ?? fallback
}

function descriptionFor(markdown: string): string {
  const paragraphs = markdown.split(/\n\s*\n/).map((part) => part.trim())
  const candidate = paragraphs.find((part) => part && !part.startsWith('#') && !part.startsWith('```') && !part.startsWith('|'))
  const normalized = (candidate ?? 'Elysia9X engineering documentation.').replace(/\s+/g, ' ')
  if (normalized.length <= 220) return normalized
  const firstSentence = normalized.match(/^.{40,320}?[.!?](?:\s|$)/)
  if (firstSentence) return firstSentence[0].trim()
  const excerpt = normalized.slice(0, 200)
  return `${excerpt.slice(0, excerpt.lastIndexOf(' ')).trimEnd()}…`
}

const files = await listMarkdown(docsDir)
await rm(path.join(publicDir, 'llms'), { recursive: true, force: true })
await mkdir(generatedDir, { recursive: true })

const entries: { slug: string; title: string; description: string; markdown: string; urlPath: string }[] = []
for (const file of files) {
  const source = stripFrontmatter(await readFile(file, 'utf8'))
  const slug = slugFor(file)
  const pageTitle = titleFor(source, slug)
  const description = descriptionFor(source)
  const mirrorPath = path.join(generatedDir, `${slug}.md`)
  await mkdir(path.dirname(mirrorPath), { recursive: true })
  await writeFile(mirrorPath, `<!-- Generated from ${slug}.md; edit the source document instead. -->\n\n${source}\n`)
  entries.push({ slug, title: pageTitle, description, markdown: source, urlPath: absolutePath(`/llms/pages/${slug}.md`) })
}

const header = `# Elysia9X documentation\n\n> A production engineering standard for Bun and TypeScript applications. This index links to Markdown source pages suitable for retrieval-augmented generation and coding-agent context.\n\nStart with the introduction and architecture reference. Prefer focused pages over loading the full corpus.\n\n`
const index = `${header}- Full reference: ${siteUrl}${absolutePath('/llms-full.txt')}\n\n` + entries.map((entry) => `## ${entry.title}\n\n${entry.description}\n\n- Markdown: ${siteUrl}${entry.urlPath}\n- Website: ${siteUrl}${absolutePath(`/${entry.slug === 'index' ? '' : entry.slug}`)}\n`).join('\n')
const full = `# Elysia9X — Full documentation\n\n${entries.map((entry) => `\n\n---\n\n<!-- source: ${entry.slug}.md -->\n\n${entry.markdown}`).join('\n')}`
await writeFile(path.join(publicDir, 'llms.txt'), index)
await writeFile(path.join(publicDir, 'llms-full.txt'), full)
await writeFile(path.join(publicDir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}${absolutePath('/sitemap.xml')}\n`)
console.log(`Generated llms.txt, llms-full.txt and ${entries.length} Markdown mirrors.`)
