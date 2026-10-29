import { timingSafeEqual } from 'crypto'
import { readFile } from 'fs/promises'
import path from 'path'
import { NextRequest } from 'next/server'

// Unlisted and password protected: no navbar link, not in the sitemap, and
// the page is only sent after the browser's login prompt gets MUSIC_PASSWORD
// (any username works). The page itself is the Vibe Atlas artifact, as is.

// Compare without leaking how much of the password matched
function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.MUSIC_PASSWORD
  const header = req.headers.get('authorization')
  if (!expected || !header?.startsWith('Basic ')) return false

  const decoded = Buffer.from(header.slice(6), 'base64').toString()
  const a = Buffer.from(decoded.slice(decoded.indexOf(':') + 1))
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function GET(req: NextRequest) {
  const headers = { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'private, no-store' }

  if (!process.env.MUSIC_PASSWORD) {
    return new Response('Not configured', { status: 503, headers })
  }
  if (!isAuthorized(req)) {
    return new Response('Password required', {
      status: 401,
      headers: { ...headers, 'WWW-Authenticate': 'Basic realm="music", charset="UTF-8"' },
    })
  }

  const html = await readFile(path.join(process.cwd(), 'content/music/vibe-atlas.html'), 'utf8')
  return new Response(html, { headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' } })
}
