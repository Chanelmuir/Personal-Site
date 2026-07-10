import { getPostBySlug, getAllPostSlugs } from '../../lib/posts'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const slugs = getAllPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) notFound()

  return (
    <main className="max-w-2xl mx-auto px-6 py-24 sm:py-32">
      <a href="/" className="text-sm text-text-secondary hover:text-accent transition-colors">
        ← Back
      </a>

      <h1 className="mt-6 font-serif text-4xl tracking-tight text-text-primary sm:text-5xl">
        {post.title}
      </h1>

      <p className="mt-3 text-sm text-text-secondary">
        {new Date(post.date).toLocaleDateString('en-NZ', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
        })}
      </p>

      {post.tags.length > 0 && (
        <p className="mt-4 text-xs uppercase tracking-wide text-text-secondary">
          {post.tags.join(" · ")}
        </p>
      )}

      <article
        className="prose prose-zinc mt-10 max-w-none prose-headings:font-serif prose-a:text-accent"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />
    </main>
  )
}