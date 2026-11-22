const apiKey = process.env.CONTEXT7_API_KEY
const siteUrl = (process.env.DOCS_SITE_URL ?? 'https://0xws.github.io').replace(/\/$/, '')
const base = `/${(process.env.DOCS_BASE ?? '/').replace(/^\/+|\/+$/g, '')}`.replace(/^\/$/, '')
const llmsUrl = `${siteUrl}${base}/llms.txt`

if (!apiKey) {
  console.error('Missing CONTEXT7_API_KEY. Create a Context7 API key with library-management write access.')
  process.exit(1)
}

const response = await fetch('https://context7.com/api/v2/add/llmstxt', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ llmstxtUrl: llmsUrl }),
})

const body = await response.json().catch(() => ({})) as { libraryName?: string; message?: string; error?: string }
if (!response.ok) {
  console.error(`Context7 submission failed (${response.status}): ${body.message ?? body.error ?? 'Unknown error'}`)
  process.exit(1)
}
console.log(`Submitted ${llmsUrl} to Context7.`)
console.log(`${body.libraryName ?? 'Library'}: ${body.message ?? 'Submission accepted for processing.'}`)

export {}
