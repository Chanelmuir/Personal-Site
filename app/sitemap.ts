import type { MetadataRoute } from 'next'
import { getAllProjectSlugs } from './lib/projects'
import { siteUrl } from './lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/training', '/nrr', '/nrr/splits', '/nrr/teams', '/gallery']
  const projects = getAllProjectSlugs().map((slug) => `/projects/${slug}`)

  return [...pages, ...projects].map((path) => ({ url: `${siteUrl}${path}` }))
}
