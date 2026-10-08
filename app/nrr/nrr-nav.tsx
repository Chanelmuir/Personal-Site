'use client'

import Link from 'next/link'
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
  return (
    <nav aria-label="Road relays" className="flex-shrink-0 border-b border-border bg-background">
      <div className="mx-auto flex h-11 w-full max-w-6xl items-stretch gap-6 overflow-x-auto px-6 sm:px-16">
        <span className="hidden items-center text-xs font-medium uppercase tracking-[0.2em] text-text-secondary sm:flex">
          Road Relays 2026
        </span>
        {TABS.map((tab) => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center whitespace-nowrap border-b-2 text-sm font-medium transition-colors ${
                active
                  ? 'border-text-primary text-text-primary'
                  : 'run-link border-transparent text-text-secondary hover:text-accent [--run-line:2px] [--runner-bottom:-1px] [background-origin:border-box]'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
