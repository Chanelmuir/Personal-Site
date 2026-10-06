import type { Metadata } from 'next'
import Link from 'next/link'
import SplitsExplorer from './splits-explorer'
import { race } from './data'

export const metadata: Metadata = {
  title: 'Road relay splits · Chanel Muir',
  description: 'Every leg split from the 2026 NZ Road Relay Champs, ranked fastest to slowest.',
}

export default function SplitsPage() {
  return (
    <main className="max-w-5xl mx-auto w-full px-6 py-12 sm:px-16 sm:py-16">
      <Link href="/nrr" className="text-sm text-text-secondary hover:text-accent transition-colors">
        ← Course map
      </Link>

      <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">
        {race.race} · 3 Oct 2026 · {race.venue}
      </p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight text-text-primary sm:text-5xl">
        Splits by leg
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-text-secondary">
        The official results only rank teams, so I pulled every runner&apos;s split off SportSplits to
        see who was quickest on each leg.
      </p>

      <SplitsExplorer />

      <p className="mt-12 text-sm text-text-secondary">
        Source:{' '}
        <a href={race.source} target="_blank" rel="noopener noreferrer" className="text-accent hover:opacity-80">
          SportSplits
        </a>
      </p>
    </main>
  )
}
