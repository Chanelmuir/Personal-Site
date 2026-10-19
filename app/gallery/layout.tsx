import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gallery · Chanel Muir',
  description: 'A guessing game: get one of my photos and drop a pin where you think it was taken.',
  alternates: { canonical: '/gallery' },
}

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children
}
