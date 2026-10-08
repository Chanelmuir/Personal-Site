'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/nrr', label: 'Course map' },
  { href: '/nrr/splits', label: 'Leg splits' },
  { href: '/nrr/teams', label: 'Team stats' },
]

// One set of tabs shared by every NRR page, so each is a click from the others.
// Hovering a tab sends the runner along its bottom edge, drawing a line where the active tab's border sits.
export default function NrrNav() {
  const pathname = usePathname()
  // The tab whose runner is mid-run. It keeps running after a click makes that tab the active one,
  // so the line finishes drawing instead of snapping to the active border.
  const [running, setRunning] = useState<string | null>(null)
  return (
    <nav aria-label="Road relays" className="flex-shrink-0 border-b border-border bg-background">
      <div className="mx-auto flex h-11 w-full max-w-6xl items-stretch gap-6 overflow-x-auto px-6 sm:px-16">
        <span className="hidden items-center border-b-2 border-transparent text-xs font-medium uppercase tracking-[0.2em] text-text-secondary sm:flex">
          Road Relays 2026
        </span>
        {TABS.map((tab) => {
          const active = pathname === tab.href
          const runner = !active || running === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              onMouseEnter={() => !active && setRunning(tab.href)}
              onMouseLeave={() => !active && setRunning(null)}
              onFocus={() => !active && setRunning(tab.href)}
              onBlur={() => !active && setRunning(null)}
              onAnimationEnd={(e) => e.animationName === 'run-across' && setRunning(null)}
              className={`flex items-center whitespace-nowrap border-b-2 text-sm font-medium transition-colors ${
                runner
                  ? 'run-link border-transparent [--run-gap:0px] [--run-line:2px] [--runner-bottom:-1px] [background-origin:border-box]'
                  : 'border-text-primary'
              } ${active ? 'text-text-primary' : 'text-text-secondary hover:text-accent'}`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
