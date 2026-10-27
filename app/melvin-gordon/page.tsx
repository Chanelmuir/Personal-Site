import type { Metadata } from 'next'
import ChatStatsPage from '../components/chat-stats'
import stats from './stats.json'

// Unlisted: no navbar link, not in the sitemap, and search engines are told to skip it
export const metadata: Metadata = {
  title: 'Melvin Gordon group chat stats | Chanel Muir',
  robots: { index: false, follow: false },
}

export default function MelvinGordonPage() {
  return <ChatStatsPage title="Melvin Gordon group chat" stats={stats} />
}
