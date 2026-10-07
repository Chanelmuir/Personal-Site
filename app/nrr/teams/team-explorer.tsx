'use client'

import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { race, formatTime, formatPace, type RelayEvent, type Team } from '../splits/data'
import { positionModel, defaultHighlights, ordinal, type PositionModel } from './positions'

// Categorical series colours, assigned to highlighted teams in a fixed order.
const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948']

interface Highlight {
  id: number
  slot: number
}

function pill(active: boolean) {
  return `rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
    active
      ? 'border-text-primary bg-text-primary text-background'
      : 'border-border bg-surface text-text-primary hover:border-text-secondary'
  }`
}

const lastLeg = (event: RelayEvent, k: number) => event.segments[k].legs[event.segments[k].legs.length - 1]
const columnLabel = (event: RelayEvent, k: number) =>
  k === event.segments.length - 1 ? 'Finish' : `Leg ${lastLeg(event, k)}`
const onSegment = (event: RelayEvent, k: number) =>
  event.segments[k].combined ? `legs ${event.segments[k].legs.join(' + ')}` : `leg ${event.segments[k].legs[0]}`
const after = (event: RelayEvent, k: number) =>
  k === event.segments.length - 1 ? 'at the finish' : `after leg ${lastLeg(event, k)}`

function withSlots(ids: number[]): Highlight[] {
  return ids.map((id, slot) => ({ id, slot }))
}

export default function TeamExplorer() {
  const [eventId, setEventId] = useState(race.events[0].id)
  const [category, setCategory] = useState('all')
  const event = race.events.find((e) => e.id === eventId)!
  const model = positionModel(event, category)
  const [highlights, setHighlights] = useState<Highlight[]>(() =>
    withSlots(defaultHighlights(positionModel(race.events[0]), race.events[0].segments.length))
  )

  function reset(nextEvent: RelayEvent, nextCategory: string) {
    setEventId(nextEvent.id)
    setCategory(nextCategory)
    setHighlights(withSlots(defaultHighlights(positionModel(nextEvent, nextCategory), nextEvent.segments.length)))
  }

  function toggle(id: number) {
    setHighlights((current) => {
      if (current.some((h) => h.id === id)) return current.filter((h) => h.id !== id)
      const used = current.map((h) => h.slot)
      const slot = SERIES.findIndex((_, i) => !used.includes(i))
      // Past eight teams there are no colours left, so leave the selection alone.
      return slot < 0 ? current : [...current, { id, slot }]
    })
  }

  const scope = category === 'all' ? 'overall' : `in ${category}`

  return (
    <div className="mt-10 flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {race.events.map((e) => (
            <button key={e.id} onClick={() => reset(e, 'all')} className={pill(e.id === eventId)}>
              {e.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => reset(event, 'all')} className={pill(category === 'all')}>
            All teams
          </button>
          {event.categories.map((c) => (
            <button key={c.name} onClick={() => reset(event, c.name)} className={pill(category === c.name)}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-2xl text-text-primary">Team positions after each leg</h2>
          <p className="text-sm text-text-secondary">
            {category === 'all' ? `All ${model.teams.length} teams` : `Position within ${category}`}
          </p>
        </div>
        <HighlightPicker model={model} event={event} highlights={highlights} onToggle={toggle} onClear={() => setHighlights([])} />
        <MovesNote model={model} event={event} />
        <BumpChart model={model} event={event} highlights={highlights} onToggle={toggle} />
      </section>

      <HeadToHead model={model} event={event} highlights={highlights} scope={scope} />

      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-accent">Show positions as a table</summary>
        <PositionsTable model={model} event={event} />
      </details>
    </div>
  )
}

function HighlightPicker({
  model,
  event,
  highlights,
  onToggle,
  onClear,
}: {
  model: PositionModel
  event: RelayEvent
  highlights: Highlight[]
  onToggle: (id: number) => void
  onClear: () => void
}) {
  const byId = new Map(model.teams.map((t) => [t.id, t]))
  const last = event.segments.length - 1
  const options = [...model.teams]
    .filter((t) => !highlights.some((h) => h.id === t.id))
    .sort((a, b) => model.row.get(a.id)! - model.row.get(b.id)!)

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {highlights
        .filter((h) => byId.has(h.id))
        .map((h) => (
          <button
            key={h.id}
            onClick={() => onToggle(h.id)}
            aria-label={`Stop highlighting ${byId.get(h.id)!.team}`}
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-surface py-1 pl-3 pr-2 text-sm font-medium text-text-primary"
          >
            <span className="h-[3px] w-4 flex-shrink-0 rounded" style={{ backgroundColor: SERIES[h.slot] }} />
            <span className="truncate">{byId.get(h.id)!.team}</span>
            <span aria-hidden className="text-text-secondary">×</span>
          </button>
        ))}
      {highlights.length < SERIES.length && (
        <select
          value=""
          onChange={(e) => e.target.value && onToggle(Number(e.target.value))}
          aria-label="Highlight a team"
          className="max-w-full rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
        >
          <option value="">Highlight a team…</option>
          {options.map((t) => {
            const place = model.positions.get(t.id)![last]
            return (
              <option key={t.id} value={t.id}>
                {place ? `${place}. ` : 'DNF · '}
                {t.team}
              </option>
            )
          })}
        </select>
      )}
      {highlights.length > 0 && (
        <button onClick={onClear} className="px-1 text-sm font-medium text-accent underline underline-offset-2">
          Clear all
        </button>
      )}
    </div>
  )
}

function MovesNote({ model, event }: { model: PositionModel; event: RelayEvent }) {
  const last = event.segments.length - 1
  const withNet = model.teams.filter((t) => model.netChange(t) != null)
  const best = [...withNet].sort((a, b) => model.netChange(b)! - model.netChange(a)!)[0]
  const worst = [...withNet].sort((a, b) => model.netChange(a)! - model.netChange(b)!)[0]
  const parts: string[] = []
  if (best && model.netChange(best)! > 0) {
    const p = model.positions.get(best.id)!
    parts.push(`Biggest climb: ${best.team}, ${ordinal(p[0]!)} ${after(event, 0)} to ${ordinal(p[last]!)} at the finish.`)
  }
  if (worst && model.netChange(worst)! < 0) {
    const p = model.positions.get(worst.id)!
    parts.push(`Biggest drop: ${worst.team}, ${ordinal(p[0]!)} to ${ordinal(p[last]!)}.`)
  }
  parts.push('Click a line or team name to highlight it, and compare highlighted teams below.')
  return <p className="mt-3 text-sm text-text-secondary">{parts.join(' ')}</p>
}

function BumpChart({
  model,
  event,
  highlights,
  onToggle,
}: {
  model: PositionModel
  event: RelayEvent
  highlights: Highlight[]
  onToggle: (id: number) => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(800)
  const [hover, setHover] = useState<{ id: number; k: number } | null>(null)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const observer = new ResizeObserver(() => setWidth(el.clientWidth))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const S = event.segments.length
  const n = model.teams.length
  const compact = width < 640
  const W = Math.max(320, width)
  const rowH = n > 30 ? 14 : n > 15 ? 20 : 26
  const L = compact ? 28 : 34
  const R = compact ? 120 : 220
  const T = 48
  const B = 36
  const gap = (W - L - R) / (S - 1)
  const H = T + (Math.max(n, 1) - 1) * rowH + B
  const x = (k: number) => L + k * gap
  const y = (p: number) => T + (p - 1) * rowH

  const columns = event.segments.map((_, k) => {
    const upTo = event.segments.slice(0, k + 1)
    const km = upTo.every((s) => s.km != null) ? upTo.reduce((sum, s) => sum + s.km!, 0) : null
    return { label: columnLabel(event, k), tiny: k === S - 1 ? 'Fin' : `L${lastLeg(event, k)}`, km }
  })

  const path = (id: number) =>
    model.positions
      .get(id)!
      .map((p, k) => (p == null ? '' : `${x(k)} ${y(p)}`))
      .filter(Boolean)
      .map((pt, i) => (i ? 'L' : 'M') + pt)
      .join('')

  const highlightOf = (id: number) => highlights.find((h) => h.id === id)
  const colour = (id: number) => {
    const h = highlightOf(id)
    return h ? SERIES[h.slot] : '#1c1917'
  }

  function hitTest(e: MouseEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const sx = ((e.clientX - r.left) * W) / r.width
    const sy = ((e.clientY - r.top) * H) / r.height
    const p = Math.round((sy - T) / rowH) + 1
    if (p < 1 || p > n) return null
    if (sx > x(S - 1) + 10) {
      const team = model.teams.find((t) => model.row.get(t.id) === p)
      return team ? { id: team.id, k: S - 1 } : null
    }
    const k = Math.max(0, Math.min(S - 1, Math.round((sx - L) / gap)))
    const exact = model.teams.find((t) => model.positions.get(t.id)![k] === p)
    return exact ? { id: exact.id, k } : null
  }

  const hovered = hover ? model.teams.find((t) => t.id === hover.id) : undefined
  const step = rowH >= 20 ? 1 : 5

  return (
    <div ref={box} className="relative mt-4 overflow-hidden rounded-xl border border-border bg-surface">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full"
        role="img"
        aria-label={`Positions of ${n} teams at each changeover and at the finish. The same data is in the table below.`}
        onPointerMove={(e) => e.pointerType === 'mouse' && setHover(hitTest(e))}
        onPointerLeave={() => setHover(null)}
        onClick={(e) => {
          const hit = hitTest(e)
          if (hit) onToggle(hit.id)
        }}
      >
        {Array.from({ length: n }, (_, i) => i + 1)
          .filter((p) => p === 1 || p % step === 0)
          .map((p) => (
            <g key={p}>
              <line x1={L} x2={x(S - 1)} y1={y(p)} y2={y(p)} stroke="#efece8" />
              <text x={L - 10} y={y(p) + 4} textAnchor="end" fontSize={11} fill="#6b6560" className="tabular-nums">
                {p}
              </text>
            </g>
          ))}
        {columns.map((c, k) => (
          <g key={k}>
            <line x1={x(k)} x2={x(k)} y1={T - 10} y2={y(n) + 8} stroke="#e7e3de" />
            <text x={x(k)} y={18} textAnchor="middle" fontSize={12} fontWeight={600} fill="#1c1917">
              {compact ? c.tiny : c.label}
            </text>
            <text x={x(k)} y={32} textAnchor="middle" fontSize={11} fill="#6b6560" className="tabular-nums">
              {c.km == null ? '' : compact ? c.km.toFixed(1) : `${c.km.toFixed(1)} km`}
            </text>
          </g>
        ))}

        {model.teams
          .filter((t) => !highlightOf(t.id))
          .map((t) => (
            <path
              key={t.id}
              d={path(t.id)}
              fill="none"
              stroke="#6b6560"
              strokeOpacity={hover ? 0.15 : 0.3}
              strokeWidth={1.25}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
        {[...highlights, ...(hover && !highlightOf(hover.id) ? [{ id: hover.id, slot: -1 }] : [])]
          .filter((h) => model.positions.has(h.id))
          .map((h) => (
            <g key={h.id}>
              <path
                d={path(h.id)}
                fill="none"
                stroke={colour(h.id)}
                strokeWidth={hover?.id === h.id ? 3 : 2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {model.positions.get(h.id)!.map((p, k) =>
                p == null ? null : (
                  <circle key={k} cx={x(k)} cy={y(p)} r={4} fill={colour(h.id)} stroke="#ffffff" strokeWidth={2} />
                )
              )}
            </g>
          ))}

        {model.teams.map((t) => {
          const place = model.positions.get(t.id)![S - 1]
          const h = highlightOf(t.id)
          const emphasised = !!h || hover?.id === t.id
          const name = compact ? (t.team.length > 12 ? `${t.team.slice(0, 11).trim()}…` : t.team) : t.team.length > 30 ? `${t.team.slice(0, 29)}…` : t.team
          const lx = x(S - 1) + (compact ? 10 : 14)
          const row = model.row.get(t.id)!
          return (
            <g key={t.id} className="cursor-pointer">
              {h && <line x1={lx} x2={lx + 10} y1={y(row)} y2={y(row)} stroke={SERIES[h.slot]} strokeWidth={3} strokeLinecap="round" />}
              <text
                x={lx + (h ? 15 : 0)}
                y={y(row) + 4}
                fontSize={rowH >= 20 ? 12 : 11}
                fontWeight={emphasised ? 700 : 400}
                fill={emphasised ? '#1c1917' : '#6b6560'}
                className="tabular-nums"
              >
                {`${place ?? 'DNF'}  ${name}`}
              </text>
            </g>
          )
        })}
      </svg>

      {hover && hovered && <Tooltip model={model} event={event} team={hovered} k={hover.k} left={(x(hover.k) / W) * width} top={(y(model.positions.get(hover.id)![hover.k] ?? 1) / W) * width} />}
    </div>
  )
}

function Tooltip({
  model,
  event,
  team,
  k: requested,
  left,
  top,
}: {
  model: PositionModel
  event: RelayEvent
  team: Team
  k: number
  left: number
  top: number
}) {
  const p = model.positions.get(team.id)!
  const k = p[requested] == null ? model.lastTimed(team) : requested
  if (k < 0) return null
  const change = k > 0 && p[k - 1] != null ? p[k - 1]! - p[k]! : null
  const split = team.splits[k]
  const flipLeft = left > 480

  return (
    <div
      className="pointer-events-none absolute z-10 w-60 rounded-lg border border-border bg-surface p-3 text-xs leading-snug shadow-lg"
      style={{ left: flipLeft ? left - 254 : left + 14, top: top + 12 }}
    >
      <div className="text-sm font-semibold text-text-primary">
        {ordinal(p[k]!)} {after(event, k)}
      </div>
      {change != null && (
        <div className={change > 0 ? 'font-semibold text-green-700' : change < 0 ? 'font-semibold text-red-700' : 'text-text-secondary'}>
          {change > 0 ? `▲ ${change} on ${onSegment(event, k)}` : change < 0 ? `▼ ${-change} on ${onSegment(event, k)}` : `No change on ${onSegment(event, k)}`}
        </div>
      )}
      {split != null && (
        <div className="text-text-secondary">
          {team.runners[k] ?? 'Runner not published'} · {formatTime(split)}
        </div>
      )}
      <div className="mt-1 text-text-primary">
        <b>{team.team}</b>
        {team.club && <span className="text-text-secondary"> · {team.club}</span>}
      </div>
      <div className="mt-1.5 border-t border-border pt-1.5 tabular-nums text-text-secondary">
        Route: {p.filter((v) => v != null).join(' → ')}
        {p[p.length - 1] == null && ' → DNF'}
      </div>
    </div>
  )
}

function HeadToHead({
  model,
  event,
  highlights,
  scope,
}: {
  model: PositionModel
  event: RelayEvent
  highlights: Highlight[]
  scope: string
}) {
  const S = event.segments.length
  const selected = highlights
    .map((h) => ({ h, team: model.teams.find((t) => t.id === h.id) }))
    .filter((s): s is { h: Highlight; team: Team } => !!s.team)
    .sort((a, b) => model.row.get(a.team.id)! - model.row.get(b.team.id)!)

  if (selected.length === 0) {
    return (
      <section>
        <h2 className="font-serif text-2xl text-text-primary">Head to head</h2>
        <p className="mt-3 rounded-xl border border-dashed border-border bg-surface p-4 text-sm text-text-secondary">
          Highlight two or more teams on the graph to compare their runners, splits and gaps here.
        </p>
      </section>
    )
  }

  const fastest = event.segments.map((_, k) => {
    const s = selected.map(({ team }) => team.splits[k]).filter((v): v is number => v != null)
    return s.length ? Math.min(...s) : null
  })
  const leading = event.segments.map((_, k) => {
    const e = selected.map(({ team }) => model.elapsed.get(team.id)![k]).filter((v): v is number => v != null)
    return e.length ? Math.min(...e) : null
  })
  const wins = new Map(
    selected.map(({ team }) => [team.id, event.segments.filter((_, k) => fastest[k] != null && team.splits[k] === fastest[k]).length])
  )

  let summary = 'Highlight another team on the graph to compare against.'
  if (selected.length > 1) {
    const [a, b] = [selected[0].team, selected[1].team]
    summary = ''
    if (a.finish != null && b.finish != null) {
      const gap = formatTime(b.finish - a.finish)
      summary =
        selected.length === 2
          ? `${a.team} finished ${gap} ahead of ${b.team}.`
          : `${a.team} finished first of these ${selected.length} teams, ${gap} ahead of ${b.team}.`
    }
    if (selected.length === 2) {
      let swing: { k: number; d: number } | null = null
      for (let k = 0; k < S; k++) {
        const sa = a.splits[k]
        const sb = b.splits[k]
        if (sa == null || sb == null) continue
        if (!swing || Math.abs(sb - sa) > Math.abs(swing.d)) swing = { k, d: sb - sa }
      }
      if (swing && swing.d !== 0) {
        const [gainer, other] = swing.d > 0 ? [a, b] : [b, a]
        summary += ` The biggest difference was on ${onSegment(event, swing.k)}, where ${gainer.team} gained ${formatTime(Math.abs(swing.d))} on ${other.team}.`
      }
    }
  }

  const finishers = selected.filter(({ team }) => team.finish != null).map(({ team }) => team.finish!)
  const bestFinish = finishers.length ? Math.min(...finishers) : null

  return (
    <section>
      <h2 className="font-serif text-2xl text-text-primary">Head to head</h2>
      <p className="mt-3 max-w-3xl text-sm text-text-primary">{summary.trim()}</p>
      <p className="mt-1 text-sm text-text-secondary">
        Positions are {scope}. Gaps are to the fastest split and the leading team of those highlighted.
      </p>
      <div className="mt-4 max-w-full overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="text-sm">
          <thead>
            <tr className="border-b border-border text-left align-top">
              <th className="sticky left-0 z-10 bg-surface px-3 py-2.5 text-[11px] font-medium uppercase tracking-wider text-text-secondary">
                Leg
              </th>
              {selected.map(({ h, team }) => (
                <th key={team.id} className="min-w-40 max-w-52 px-3 py-2.5 font-medium text-text-primary">
                  <span className="mr-1.5 inline-block h-[3px] w-4 rounded align-middle" style={{ backgroundColor: SERIES[h.slot] }} />
                  {team.team}
                  <span className="block text-xs font-normal text-text-secondary">{team.club ?? 'No club listed'}</span>
                  {selected.length > 1 && (
                    <span className="mt-1 block text-xs font-normal text-text-secondary">
                      Fastest on {wins.get(team.id)} of {S} splits
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {event.segments.map((segment, k) => (
              <tr key={k} className="border-b border-border/60 align-top">
                <td className="sticky left-0 z-10 border-r border-border/60 bg-surface px-3 py-2.5">
                  <b className="block whitespace-nowrap text-text-primary">{segment.short}</b>
                  <span className="text-xs tabular-nums text-text-secondary">{segment.km ? `${segment.km} km` : ''}</span>
                </td>
                {selected.map(({ team }) => {
                  const split = team.splits[k]
                  const p = model.positions.get(team.id)!
                  const change = k > 0 && p[k - 1] != null && p[k] != null ? p[k - 1]! - p[k]! : null
                  const elapsed = model.elapsed.get(team.id)![k]
                  return (
                    <td key={team.id} className="px-3 py-2.5">
                      <div className="font-medium text-text-primary">
                        {team.runners[k] ?? '—'}
                        {segment.combined && team.runners[k] && (
                          <span className="font-normal text-text-secondary"> (leg {lastLeg(event, k)})</span>
                        )}
                      </div>
                      <div className="mt-0.5 tabular-nums">
                        {split == null ? (
                          '—'
                        ) : (
                          <>
                            <b className="text-text-primary">{formatTime(split)}</b>
                            {segment.km && !segment.paceHidden && (
                              <span className="text-text-secondary"> {formatPace(split, segment.km)}</span>
                            )}
                            {selected.length > 1 &&
                              (split === fastest[k] ? (
                                <span className="ml-1 rounded border border-text-primary px-1 text-[10px] font-bold text-text-primary">
                                  FASTEST
                                </span>
                              ) : (
                                <span className="text-text-secondary"> +{formatTime(split - fastest[k]!)}</span>
                              ))}
                          </>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs tabular-nums text-text-secondary">
                        {p[k] == null ? (
                          team.finish == null && <strong className="text-text-primary">DNF</strong>
                        ) : (
                          <>
                            <strong className="text-text-primary">{ordinal(p[k]!)}</strong>
                            {change != null && change > 0 && <span className="font-semibold text-green-700"> ▲{change}</span>}
                            {change != null && change < 0 && <span className="font-semibold text-red-700"> ▼{-change}</span>}
                            {selected.length > 1 &&
                              elapsed != null &&
                              (elapsed === leading[k] ? ' · leading' : ` · ${formatTime(elapsed - leading[k]!)} behind`)}
                          </>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
            <tr className="bg-background align-top">
              <td className="sticky left-0 z-10 border-r border-border/60 bg-background px-3 py-2.5">
                <b className="text-text-primary">Total</b>
              </td>
              {selected.map(({ team }) => (
                <td key={team.id} className="px-3 py-2.5">
                  {team.finish == null ? (
                    <b className="text-text-primary">DNF</b>
                  ) : (
                    <>
                      <b className="tabular-nums text-text-primary">{formatTime(team.finish)}</b>
                      <div className="text-xs text-text-secondary">
                        <strong className="text-text-primary">{ordinal(model.positions.get(team.id)![S - 1]!)}</strong> {scope}
                        {selected.length > 1 && team.finish !== bestFinish && ` · ${formatTime(team.finish - bestFinish!)} behind`}
                      </div>
                    </>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}

function PositionsTable({ model, event }: { model: PositionModel; event: RelayEvent }) {
  const rows = [...model.teams].sort((a, b) => model.row.get(a.id)! - model.row.get(b.id)!)
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-text-secondary">
            <th className="px-3 py-2 font-medium">Team</th>
            {event.segments.map((_, k) => (
              <th key={k} className="px-3 py-2 text-right font-medium">
                {columnLabel(event, k)}
              </th>
            ))}
            <th className="px-3 py-2 text-right font-medium">Net</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => {
            const p = model.positions.get(t.id)!
            const net = model.netChange(t)
            return (
              <tr key={t.id} className="border-b border-border/60 last:border-b-0">
                <td className="px-3 py-2 text-text-primary">
                  <b className="font-medium">{t.team}</b>
                  {t.club && <span className="text-text-secondary"> · {t.club}</span>}
                </td>
                {p.map((v, k) => (
                  <td key={k} className="px-3 py-2 text-right tabular-nums text-text-primary">
                    {v ?? (t.finish == null && k >= model.lastTimed(t) ? 'DNF' : '—')}
                  </td>
                ))}
                <td className="px-3 py-2 text-right tabular-nums">
                  {net == null ? '—' : net > 0 ? <span className="font-semibold text-green-700">▲{net}</span> : net < 0 ? <span className="font-semibold text-red-700">▼{-net}</span> : '0'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
