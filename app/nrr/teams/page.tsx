import type { Metadata } from 'next'
import TeamExplorer from './team-explorer'
import { race } from '../splits/data'

export const metadata: Metadata = {
  title: 'Road relay team stats · Chanel Muir',
  description: 'How every team moved through the field at the 2026 NZ Road Relay Champs, with head to head comparisons.',
}

export default function TeamsPage() {
  return (
    <main className="max-w-5xl mx-auto w-full px-6 py-12 sm:px-16 sm:py-16">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">
        {race.race} · 3 Oct 2026 · {race.venue}
      </p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight text-text-primary sm:text-5xl">
        Team stats
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-text-secondary">
        Where each team sat after every changeover, and how any two teams stacked up leg by leg.
      </p>

      <TeamExplorer />

      <p className="mt-12 text-sm text-text-secondary">
        Source:{' '}
        <a href={race.source} target="_blank" rel="noopener noreferrer" className="text-accent hover:opacity-80">
          SportSplits
        </a>
      </p>
    </main>
  )
}
