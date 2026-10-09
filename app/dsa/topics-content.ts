import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'
import { functionRange, highlightLine, type Token } from './highlight-cpp'

const contentDirectory = path.join(process.cwd(), 'content/dsa')
const sourceDirectory = path.join(process.cwd(), 'dsa')

export interface Topic {
  slug: string
  title: string
  summary: string
  contentHtml: string
  source: { file: string; lines: Token[][]; ranges: Record<string, [number, number]> }
}

export function getTopicSlugs(): string[] {
  return fs
    .readdirSync(contentDirectory)
    .filter((file) => file.endsWith('.md'))
    .map((file) => file.replace(/\.md$/, ''))
}

// `functions` names the functions the page's visualiser can point at in the source
export async function getTopic(slug: string, functions: string[] = []): Promise<Topic | null> {
  const fullPath = path.join(contentDirectory, `${slug}.md`)
  if (!getTopicSlugs().includes(slug)) return null
  const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'))
  const contentHtml = (await remark().use(html).process(content)).toString()

  const file = data.source as string
  const raw = fs.readFileSync(path.join(sourceDirectory, file), 'utf8').replace(/\n$/, '').split('\n')
  const ranges: Record<string, [number, number]> = {}
  for (const fn of functions) {
    const range = functionRange(raw, fn)
    if (range) ranges[fn] = range
  }

  return {
    slug,
    title: (data.title as string) ?? slug,
    summary: (data.summary as string) ?? '',
    contentHtml,
    source: { file, lines: raw.map(highlightLine), ranges },
  }
}
