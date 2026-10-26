import type { Metadata } from 'next'
import Image from 'next/image'
import stats from './stats.json'

// Unlisted: no navbar link, not in the sitemap, and search engines are told to skip it
export const metadata: Metadata = {
  title: 'CHAV group chat stats | Chanel Muir',
  robots: { index: false, follow: false },
}

type Pair = [string, number]

const fmt = new Intl.NumberFormat('en-NZ')
const longDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const pct = (share: number) => `${Math.round(share * 100)}%`
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const hourLabel = (h: number) => (h === 0 ? '12am' : h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h - 12}pm`)
const TOP = 15

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="mt-16">
      <h2 className="text-xl font-bold tracking-[-0.01em] text-text-primary [font-stretch:115%]">{title}</h2>
      {note && <p className="mt-1 text-sm text-text-secondary">{note}</p>}
      <div className="mt-6">{children}</div>
    </section>
  )
}

function Bars({ rows, highlight }: { rows: Pair[]; highlight?: string }) {
  const max = rows[0][1]
  return (
    <ol className="grid gap-1.5">
      {rows.map(([name, n]) => (
        <li key={name} className="grid grid-cols-[7rem_1fr_3.5rem] items-center gap-3 text-sm">
          <span className="truncate text-text-primary">{name}</span>
          <span className="h-3 rounded-[2px] bg-border/60">
            <span
              className={`block h-full rounded-[2px] ${name === highlight ? 'bg-accent' : 'bg-text-primary/70'}`}
              style={{ width: `${(n / max) * 100}%` }}
            />
          </span>
          <span className="text-right tabular-nums text-text-secondary">{fmt.format(n)}</span>
        </li>
      ))}
    </ol>
  )
}

export default function ChavPage() {
  const senders = stats.senders as Pair[]
  const rest = senders.slice(TOP)
  const hourMax = Math.max(...stats.hours.flat())
  const monthMax = Math.max(...stats.months.map(([, n]) => n as number))
  const years = stats.months.flatMap(([m], i) => ((m as string).endsWith('-01') || i === 0 ? [{ i, year: (m as string).slice(0, 4) }] : []))

  const headline = [
    { value: fmt.format(stats.messages), label: `messages from ${stats.people} people` },
    { value: fmt.format(stats.reactions), label: 'reactions, mostly hearts' },
    { value: fmt.format(stats.busiestDay.messages), label: `messages on ${longDate(stats.busiestDay.date)}, the busiest day` },
  ]

  return (
    <div className="mx-auto w-full max-w-4xl px-6 pt-10 pb-24 sm:px-16">
      <header>
        <h1 className="text-[clamp(34px,5vw,56px)] font-extrabold leading-[0.95] tracking-[-0.03em] text-text-primary [font-stretch:125%]">
          CHAV group chat
        </h1>
        <p className="mt-3 text-sm text-text-secondary">
          {longDate(stats.from)} to {longDate(stats.to)}, counted from our Instagram chat. Times are NZ time.
        </p>
        <dl className="mt-6 grid gap-6 sm:grid-cols-3">
          {headline.map((s) => (
            <div key={s.label} className="border-t-[1.5px] border-text-primary pt-3">
              <dt className="sr-only">{s.label}</dt>
              <dd className="text-3xl font-bold tabular-nums tracking-[-0.02em] text-text-primary [font-stretch:115%]">{s.value}</dd>
              <dd className="mt-1 text-sm text-text-secondary">{s.label}</dd>
            </div>
          ))}
        </dl>
      </header>

      <Section title="Most reacted messages">
        <ol className="grid gap-6">
          {stats.topMessages.map((m) => (
            <li key={`${m.date}-${m.name}`} className="grid grid-cols-[2.5rem_1fr] gap-3">
              <span className="pt-0.5 text-right text-lg font-bold tabular-nums text-accent [font-stretch:115%]">{m.reactions}</span>
              <div className="min-w-0">
                <p className="text-lg leading-snug break-words text-text-primary">{m.text}</p>
                <p className="mt-1 text-sm text-text-secondary">
                  {m.name}, {longDate(m.date)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Most reacted photos and videos">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {stats.topMedia.map((m) => (
            <li key={m.src}>
              {m.video ? (
                <video src={`${m.src}#t=0.5`} controls muted loop playsInline preload="metadata" className="aspect-[4/5] w-full rounded-[3px] bg-border object-cover" />
              ) : (
                <Image src={m.src} alt={`Photo from ${m.name}`} width={800} height={1000} sizes="(min-width: 640px) 240px, 50vw" className="aspect-[4/5] w-full rounded-[3px] bg-border object-cover" />
              )}
              <p className="mt-2 text-sm text-text-secondary">
                <span className="font-semibold tabular-nums text-accent">{m.reactions}</span> reactions, from {m.name}, {longDate(m.date)}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Who talks the most" note={`Messages sent. The other ${rest.length} people sent ${fmt.format(rest.reduce((s, [, n]) => s + n, 0))} between them.`}>
        <Bars rows={senders.slice(0, TOP)} highlight="Chanel" />
      </Section>

      <Section title="When the chat is awake" note="Messages by day of the week and hour of the day.">
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[560px]">
            <div className="grid grid-cols-[2.5rem_repeat(24,minmax(0,1fr))] gap-[3px]">
              {stats.hours.map((row, d) => (
                <div key={d} className="contents">
                  <span className="flex items-center text-xs text-text-secondary">{DAYS[d]}</span>
                  {row.map((n, h) => (
                    <span
                      key={h}
                      title={`${DAYS[d]} ${hourLabel(h)}: ${fmt.format(n)} messages`}
                      className="aspect-square rounded-[2px] bg-accent"
                      style={{ opacity: n === 0 ? 0.06 : 0.1 + 0.9 * Math.sqrt(n / hourMax) }}
                    />
                  ))}
                </div>
              ))}
              <span />
              {Array.from({ length: 24 }, (_, h) => (
                <span key={h} className="text-[11px] text-text-secondary">
                  {h % 6 === 0 ? hourLabel(h) : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-text-secondary">
          Night owl: {stats.nightOwl.name}, with {pct(stats.nightOwl.share)} of their messages between 11pm and 4am. Early bird:{' '}
          {stats.earlyBird.name}, with {pct(stats.earlyBird.share)} between 5am and 8am. Counting people with 100 or more messages.
        </p>
      </Section>

      <Section title="Messages each month">
        <div className="flex h-40 items-end gap-[2px]">
          {stats.months.map(([m, n]) => (
            <span
              key={m}
              title={`${new Date(`${m}-01T00:00:00Z`).toLocaleDateString('en-NZ', { month: 'long', year: 'numeric', timeZone: 'UTC' })}: ${fmt.format(n as number)} messages`}
              className="flex-1 rounded-t-[2px] bg-text-primary/70"
              style={{ height: `${((n as number) / monthMax) * 100}%` }}
            />
          ))}
        </div>
        <div className="relative mt-1 h-4 border-t border-border">
          {years.map(({ i, year }) => (
            <span key={year} className="absolute text-xs text-text-secondary" style={{ left: `${(i / stats.months.length) * 100}%` }}>
              {year}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Reactions" note={`The most reacted message got ${stats.mostReacted}.`}>
        <ul className="flex flex-wrap gap-x-6 gap-y-3">
          {(stats.topReactions as Pair[]).map(([e, n]) => (
            <li key={e} className="flex items-baseline gap-2">
              <span className="text-2xl">{e}</span>
              <span className="text-sm tabular-nums text-text-secondary">{fmt.format(n)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-10 grid gap-10 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Most reactions received</h3>
            <div className="mt-3">
              <Bars rows={(stats.received as Pair[]).slice(0, 5)} highlight="Chanel" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Most reactions given</h3>
            <div className="mt-3">
              <Bars rows={(stats.given as Pair[]).slice(0, 5)} highlight="Chanel" />
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Emoji in messages"
        note={`Plus ${fmt.format(stats.media)} photos, videos and voice notes, and ${fmt.format(stats.links)} shared posts and links.`}
      >
        <ul className="flex flex-wrap gap-x-6 gap-y-3">
          {(stats.topEmojis as Pair[]).map(([e, n]) => (
            <li key={e} className="flex items-baseline gap-2">
              <span className="text-2xl">{e}</span>
              <span className="text-sm tabular-nums text-text-secondary">{fmt.format(n)}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}
