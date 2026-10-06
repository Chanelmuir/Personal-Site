import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProjectBySlug, getAllProjectSlugs } from '../../lib/projects'

export async function generateStaticParams() {
  return getAllProjectSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) return {}
  return { title: `${project.name} · Chanel Muir`, description: project.tagline }
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)

  if (!project) notFound()

  return (
    <main className="max-w-2xl mx-auto px-6 py-24 sm:py-32">
      <Link href="/" className="text-sm text-text-secondary hover:text-accent transition-colors">
        ← Back
      </Link>

      <h1 className="mt-6 font-serif text-4xl tracking-tight text-text-primary sm:text-5xl">
        {project.name}
      </h1>

      <p className="mt-4 text-lg leading-relaxed text-text-secondary">{project.tagline}</p>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        {project.href && (
          <a href={project.href} target="_blank" rel="noopener noreferrer" className="text-accent hover:opacity-80">
            Try it <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
          </a>
        )}
        {project.repo && (
          <a href={project.repo} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-accent">
            <i className="fa-brands fa-github" /> Source
          </a>
        )}
        {project.tags.length > 0 && (
          <span className="text-xs uppercase tracking-wide text-text-secondary">
            {project.tags.join(' · ')}
          </span>
        )}
      </div>

      {project.image && (
        <div className="mt-10 overflow-hidden rounded-2xl border border-border">
          <Image
            src={project.image}
            alt={project.name}
            width={1200}
            height={900}
            className="h-auto w-full"
            priority
          />
        </div>
      )}

      <article
        className="prose prose-zinc mt-10 max-w-none prose-headings:font-serif prose-a:text-accent prose-code:before:content-none prose-code:after:content-none"
        dangerouslySetInnerHTML={{ __html: project.contentHtml }}
      />

      {project.post && (
        <Link
          href={`/posts/${project.post}`}
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm text-white transition-opacity hover:opacity-90"
        >
          Read the full story →
        </Link>
      )}
    </main>
  )
}
