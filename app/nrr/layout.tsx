import type { Metadata } from 'next'
import NrrNav from './nrr-nav'

export const metadata: Metadata = {
  title: 'NZ Road Relay · Chanel Muir',
  description: 'Course maps for every relay at the 2026 NZ Road Relay Champs.',
  alternates: { canonical: '/nrr' },
}

export default function NrrLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NrrNav />
      {children}
    </>
  )
}
