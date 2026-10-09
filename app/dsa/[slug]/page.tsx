import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import CodePanel from '../code-panel'
import { getTopic, getTopicSlugs } from '../topics-content'
import { VISUALISERS } from '../visualisers'

export function generateStaticParams() {
  return getTopicSlugs().map((slug) => ({ slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const topic = await getTopic(slug)
  if (!topic) return {}
  return { title: `${topic.title} | Chanel Muir`, description: topic.summary }
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const visualiser = VISUALISERS[slug]
  const topic = await getTopic(slug, visualiser?.functions)
  if (!topic) notFound()

  return (
    <main className="mx-auto w-full max-w-6xl px-6 pt-10 pb-24 sm:px-16">
      <Link href="/dsa" className="run-link text-sm text-text-secondary hover:text-accent">
        ← All stops
      </Link>
      <h1 className="mt-5 text-[clamp(34px,5vw,56px)] font-extrabold leading-[0.95] tracking-[-0.03em] text-text-primary [font-stretch:125%]">
        {topic.title}
      </h1>
      <p className="mt-3 max-w-xl text-lg text-text-secondary">{topic.summary}</p>

      <article
        className="prose prose-zinc mt-10 max-w-2xl prose-strong:text-text-primary prose-code:font-normal prose-code:text-accent prose-code:before:content-none prose-code:after:content-none"
        dangerouslySetInnerHTML={{ __html: topic.contentHtml }}
      />

      <section className="mt-14" aria-label="Try it">
        <h2 className="mb-6 font-serif text-2xl text-text-primary">Try it</h2>
        {visualiser ? <visualiser.Component source={topic.source} /> : <CodePanel source={topic.source} />}
      </section>
    </main>
  )
}
