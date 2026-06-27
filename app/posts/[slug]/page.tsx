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
    <main className="max-w-3xl mx-auto px-6 py-32">
      <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>

      <p className="mt-2 text-sm text-gray-500">
        {new Date(post.date).toLocaleDateString('en-NZ', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
        })}
      </p>

      <div className="mt-4 flex gap-2 flex-wrap">
        {post.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-accent-light px-3 py-1 text-sm text-accent"
          >
            {tag}
          </span>
        ))}
      </div>

      <article
        className="prose prose-zinc dark:prose-invert mt-10 max-w-none"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />
    </main>
  )
}