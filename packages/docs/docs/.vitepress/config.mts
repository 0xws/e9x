import { defineConfig } from 'vitepress'

const description =
  'A production engineering standard for Bun and TypeScript applications: feature architecture, BFF contracts, authorization, deployment, and deterministic governance.'
const basePath = process.env.DOCS_BASE
  ? `/${process.env.DOCS_BASE.replace(/^\/+|\/+$/g, '')}/`
  : '/'
const siteUrl = (process.env.DOCS_SITE_URL ?? 'https://0xws.github.io').replace(/\/$/, '')

export default defineConfig({
  title: 'Elysia9X',
  description,
  lang: 'en-US',
  base: basePath,
  cleanUrls: true,
  lastUpdated: true,
  sitemap: {
    hostname: `${siteUrl}${basePath}`,
  },
  head: [
    ['meta', { name: 'theme-color', content: '#111827' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Elysia9X — Engineering Standard' }],
    ['meta', { property: 'og:description', content: description }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${basePath}favicon.svg` }],
  ],
  themeConfig: {
    siteTitle: 'Elysia9X',
    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'Architecture', link: '/guide/architecture' },
      { text: 'CLI', link: '/guide/cli' },
      { text: 'Context7', link: '/guide/context7' },
      { text: 'GitHub', link: 'https://github.com/0xws/e9x' },
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is Elysia9X?', link: '/guide/introduction' },
          { text: 'Principles', link: '/guide/principles' },
        ],
      },
      {
        text: 'Architecture',
        items: [
          { text: 'System architecture', link: '/guide/architecture' },
          { text: 'Feature modules', link: '/guide/features' },
          { text: 'Authorization', link: '/guide/authorization' },
          { text: 'Data and migrations', link: '/guide/data' },
          { text: 'Deployment', link: '/guide/deployment' },
          { text: 'Testing and operations', link: '/guide/quality-operations' },
        ],
      },
      {
        text: 'Tooling',
        items: [
          { text: 'CLI', link: '/guide/cli' },
          { text: 'Agent integrations', link: '/guide/agents' },
          { text: 'Plugin development', link: '/guide/plugin-development' },
          { text: 'Context7 and llms.txt', link: '/guide/context7' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/0xws/e9x' },
    ],
    editLink: {
      pattern: 'https://github.com/0xws/e9x/edit/main/packages/docs/docs/:path',
      text: 'Edit this page on GitHub',
    },
    footer: {
      message: 'An independent architecture standard for production TypeScript applications.',
      copyright: 'Copyright © 2026 Elysia9X contributors',
    },
    search: { provider: 'local' },
  },
})
