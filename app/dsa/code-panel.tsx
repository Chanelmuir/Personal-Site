'use client'

import { useEffect, useRef } from 'react'
import type { Token, TokenKind } from './highlight-cpp'

export interface Source {
  file: string
  lines: Token[][]
  ranges: Record<string, [number, number]>
}

const COLOURS: Record<TokenKind, string> = {
  comment: 'text-text-secondary italic',
  string: 'text-[#a6542b]',
  number: 'text-[#a6542b]',
  keyword: 'text-accent',
  type: 'text-[#35724a]',
  preprocessor: 'text-text-secondary',
  function: 'font-semibold text-text-primary',
  plain: 'text-text-primary',
}

// The C++ source, with the function that's currently running highlighted and scrolled into view
export default function CodePanel({ source, active }: { source: Source; active?: string | null }) {
  const scroller = useRef<HTMLDivElement>(null)
  const range = active ? source.ranges[active] : undefined

  useEffect(() => {
    const el = scroller.current
    if (!el || !range) return
    const line = el.querySelector<HTMLElement>(`[data-line="${range[0]}"]`)
    // Scroll the panel only, never the page
    if (line) el.scrollTo({ top: line.offsetTop - 12, behavior: 'smooth' })
  }, [range])

  return (
    <figure className="min-w-0 border border-border bg-surface">
      <figcaption className="flex items-center justify-between border-b border-border px-4 py-2 font-mono text-xs text-text-secondary">
        <span>{source.file}</span>
        <span>C++17</span>
      </figcaption>
      <div ref={scroller} className="relative max-h-[34rem] overflow-auto py-3">
        <pre className="font-mono text-[12.5px] leading-[1.6]">
          <code>
            {source.lines.map((tokens, i) => {
              const lit = range && i >= range[0] && i <= range[1]
              return (
                <div
                  key={i}
                  data-line={i}
                  className={`flex border-l-[3px] pr-4 transition-colors duration-200 ${lit ? 'border-accent bg-accent-light' : 'border-transparent'}`}
                >
                  <span className="w-10 flex-shrink-0 select-none pr-3 text-right text-text-secondary/60">{i + 1}</span>
                  <span>
                    {tokens.map((t, j) => (
                      <span key={j} className={COLOURS[t.kind]}>
                        {t.text}
                      </span>
                    ))}
                    {tokens.length === 0 && ' '}
                  </span>
                </div>
              )
            })}
          </code>
        </pre>
      </div>
    </figure>
  )
}
