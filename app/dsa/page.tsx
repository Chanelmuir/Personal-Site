import type { Metadata } from 'next'
import Link from 'next/link'
import { LINES } from './topics'

export const metadata: Metadata = {
  title: 'Data structures and algorithms | Chanel Muir',
}

// The index is a transit map: one line for data structures, one for the algorithms built on them.
// Open stops are filled in and link to their page; stops still to come are hollow.
export default function DsaIndex() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 pt-10 pb-24 sm:px-16">
      <h1 className="text-[clamp(34px,5vw,56px)] font-extrabold leading-[0.95] tracking-[-0.03em] text-text-primary [font-stretch:125%]">
        Data structures and algorithms
      </h1>
      <p className="mt-4 max-w-xl text-text-secondary">
        Working through DSA one stop at a time. Each stop has notes, a C++ implementation, and something to
        play with.
      </p>

      <div className="mt-12 grid gap-14 md:grid-cols-2 md:gap-10">
        {LINES.map((line) => (
          <section key={line.name} aria-label={line.name}>
            <h2 className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">
              <span className="h-3 w-8" style={{ background: line.colour }} aria-hidden="true" />
              {line.name}
            </h2>
            <ol className="relative mt-6">
              {/* The rail runs from the first stop's centre to the last's */}
              <span
                aria-hidden="true"
                className="absolute top-3 bottom-3 left-[9px] w-[6px]"
                style={{ background: line.colour }}
              />
              {line.stops.map((stop) => (
                <li key={stop.name} className="relative flex min-h-16 items-start gap-5 pb-4">
                  <span
                    aria-hidden="true"
                    className="relative z-10 mt-0.5 h-6 w-6 flex-shrink-0 rounded-full border-[5px] bg-background"
                    style={{ borderColor: line.colour, background: stop.slug ? line.colour : undefined }}
                  />
                  <div className="min-w-0">
                    {stop.slug ? (
                      <Link
                        href={`/dsa/${stop.slug}`}
                        className="run-link text-lg font-bold tracking-[-0.01em] text-text-primary [font-stretch:115%] hover:text-accent"
                      >
                        {stop.name}
                      </Link>
                    ) : (
                      <span className="text-lg font-bold tracking-[-0.01em] text-text-secondary [font-stretch:115%]">
                        {stop.name}
                      </span>
                    )}
                    <p className="mt-0.5 text-sm text-text-secondary">
                      {stop.note}
                      {!stop.slug && <span className="ml-2 text-xs uppercase tracking-[0.14em] opacity-60">Coming up</span>}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </main>
  )
}
