'use client'

import { useRef, useState } from 'react'
import { race, rankSegment, formatTime, formatPace } from './data'

const MEDALS = ['bg-amber-400', 'bg-stone-300', 'bg-orange-300']

function pill(active: boolean) {
  return `rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
    active
      ? 'border-text-primary bg-text-primary text-background'
      : 'border-border bg-surface text-text-primary hover:border-text-secondary'
  }`
}

export default function SplitsExplorer() {
  const [eventId, setEventId] = useState(race.events[0].id)
  const [category, setCategory] = useState('all')
  const [segmentIndex, setSegmentIndex] = useState(0)
  const [query, setQuery] = useState('')
  const rankingRef = useRef<HTMLElement>(null)

  const event = race.events.find((e) => e.id === eventId)!
  const segment = event.segments[segmentIndex]

  const ranked = rankSegment(event, segmentIndex, category)
  const fastest = ranked[0]?.seconds

  const q = query.trim().toLowerCase()
  const rows = q
    ? ranked.filter((r) =>
        [r.runner, r.team.team, r.team.club].some((v) => v?.toLowerCase().includes(q))
      )
    : ranked

  function chooseSegment(index: number) {
    setSegmentIndex(index)
    // On phones the ranking sits below every podium card, so bring it into view.
    const ranking = rankingRef.current
    if (ranking && ranking.getBoundingClientRect().top > window.innerHeight * 0.6) {
      ranking.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  function chooseEvent(id: number) {
    setEventId(id)
    setCategory('all')
    setSegmentIndex(0)
  }

  return (
    <div className="mt-10 flex flex-col gap-10">
      {/* Relay + category */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {race.events.map((e) => (
            <button key={e.id} onClick={() => chooseEvent(e.id)} className={pill(e.id === eventId)}>
              {e.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCategory('all')} className={pill(category === 'all')}>
            All teams
          </button>
          {event.categories.map((c) => (
            <button key={c.name} onClick={() => setCategory(c.name)} className={pill(category === c.name)}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Podium per leg */}
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-2xl text-text-primary">Fastest on each leg</h2>
          <p className="text-sm text-text-secondary">Pick a leg to see the full ranking</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {event.segments.map((s, i) => {
            const top = rankSegment(event, i, category).slice(0, 3)
            return (
              <button
                key={s.label}
                onClick={() => chooseSegment(i)}
                className={`flex flex-col gap-3 rounded-xl border bg-surface p-4 text-left transition-colors ${
                  i === segmentIndex ? 'border-accent ring-1 ring-accent' : 'border-border hover:border-text-secondary'
                }`}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-text-primary">{s.label}</span>
                  <span className="text-xs text-text-secondary">{s.km ? `${s.km} km` : ''}</span>
                </span>
                {top.length === 0 ? (
                  <span className="text-sm text-text-secondary">No teams in this category</span>
                ) : (
                  <ol className="flex flex-col gap-2">
                    {top.map((r, j) => (
                      <li key={r.team.id} className="grid grid-cols-[20px_1fr_auto] items-start gap-2">
                        <span
                          className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-stone-900 ${MEDALS[r.rank - 1] ?? MEDALS[j]}`}
                        >
                          {r.rank}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium leading-tight text-text-primary">
                            {r.runner ?? r.team.team}
                          </span>
                          <span className="block text-xs text-text-secondary">
                            {r.team.club ?? r.team.team}
                          </span>
                        </span>
                        <span className="text-sm font-semibold tabular-nums text-text-primary">
                          {formatTime(r.seconds)}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* Full ranking for one leg */}
      <section ref={rankingRef} className="scroll-mt-24">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-2xl text-text-primary">{segment.label}</h2>
          <p className="text-sm text-text-secondary">
            {[segment.km ? `${segment.km} km` : null, segment.note].filter(Boolean).join(' · ')}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a runner, club or team"
            aria-label="Find a runner, club or team"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary sm:w-80"
          />
          <span className="text-sm text-text-secondary">
            {rows.length} of {ranked.length} splits
          </span>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-text-secondary">
                <th className="px-3 py-2.5 font-medium">#</th>
                <th className="px-3 py-2.5 font-medium">Runner</th>
                <th className="hidden px-3 py-2.5 font-medium sm:table-cell">Club · team</th>
                <th className="px-3 py-2.5 text-right font-medium">
                  Split<span className="sm:hidden"> · pace · gap</span>
                </th>
                <th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">Pace</th>
                <th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">Gap</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.team.id} className="border-b border-border/60 last:border-b-0 align-top">
                  <td className="px-3 py-2.5 font-semibold tabular-nums text-text-primary">{r.rank}</td>
                  <td className="px-3 py-2.5">
                    <span className="block font-medium text-text-primary">
                      {r.runner ?? <span className="text-text-secondary">Not published</span>}
                    </span>
                    <span className="block text-xs text-text-secondary sm:hidden">{r.team.team}</span>
                  </td>
                  <td className="hidden px-3 py-2.5 text-text-secondary sm:table-cell">
                    {r.team.club && <span className="block text-text-primary">{r.team.club}</span>}
                    <span className="block text-xs">{r.team.team}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    <span className="block font-semibold text-text-primary">{formatTime(r.seconds)}</span>
                    {/* Phones have no room for the pace and gap columns, so they sit under the split. */}
                    <span className="block whitespace-nowrap text-xs text-text-secondary sm:hidden">
                      {[
                        segment.paceHidden || !segment.km ? null : formatPace(r.seconds, segment.km),
                        r.seconds === fastest ? null : `+${formatTime(r.seconds - fastest)}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </td>
                  <td className="hidden px-3 py-2.5 text-right tabular-nums text-text-secondary sm:table-cell">
                    {formatPace(r.seconds, segment.paceHidden ? null : segment.km)}
                  </td>
                  <td className="hidden px-3 py-2.5 text-right tabular-nums text-text-secondary sm:table-cell">
                    {r.seconds === fastest ? '—' : `+${formatTime(r.seconds - fastest)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Notes */}
      <section className="flex max-w-3xl flex-col gap-2 border-t border-border pt-6 text-sm leading-relaxed text-text-secondary">
        {event.notes.map((n, i) => (
          <p key={i}>
            {n.title && <strong className="font-semibold text-text-primary">{n.title} </strong>}
            {n.text}
          </p>
        ))}
      </section>
    </div>
  )
}
