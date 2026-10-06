import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

const projectsDirectory = path.join(process.cwd(), 'content/projects')

export interface ProjectMeta {
  slug: string
  name: string
  tagline: string
  image: string
  href?: string
  repo?: string
  post?: string
  tags: string[]
  order: number
}

// Frontmatter is untyped, so fall back to sensible defaults for anything missing
function toMeta(slug: string, data: Record<string, unknown>): ProjectMeta {
  return {
    slug,
    name: (data.name as string) ?? slug,
    tagline: (data.tagline as string) ?? '',
    image: (data.image as string) ?? '',
    href: data.href as string | undefined,
    repo: data.repo as string | undefined,
    post: data.post as string | undefined,
    tags: (data.tags as string[]) ?? [],
    order: (data.order as number) ?? 0,
  }
}

export function getAllProjectSlugs(): string[] {
  if (!fs.existsSync(projectsDirectory)) return []
  return fs
    .readdirSync(projectsDirectory)
    .filter((file) => file.endsWith('.md'))
    .map((file) => file.replace(/\.md$/, ''))
}

export function getAllProjectsMeta(): ProjectMeta[] {
  return getAllProjectSlugs()
    .map((slug) => {
      const fileContents = fs.readFileSync(path.join(projectsDirectory, `${slug}.md`), 'utf8')
      return toMeta(slug, matter(fileContents).data)
    })
    .sort((a, b) => a.order - b.order)
}

export async function getProjectBySlug(slug: string) {
  const fullPath = path.join(projectsDirectory, `${slug}.md`)

  if (!fs.existsSync(fullPath)) return null

  const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'))
  const processedContent = await remark().use(html).process(content)

  return {
    ...toMeta(slug, data),
    contentHtml: processedContent.toString(),
  }
}
