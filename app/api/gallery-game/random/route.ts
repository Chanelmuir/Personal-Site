import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const excludeId = searchParams.get('exclude')

  const { data, error } = await supabase
    .from('gallery_game_photos')
    .select('id, image_path, lat, lng, description')

  if (error || !data || data.length === 0) {
    return NextResponse.json({ photo: null, imageUrl: null }, { status: 200 })
  }

  // Filter out the last shown photo
  const pool = data.length > 1 ? data.filter((p) => p.id !== excludeId) : data

  const photo = pool[Math.floor(Math.random() * pool.length)]

  const { data: urlData } = supabase.storage
    .from('gallery-game')
    .getPublicUrl(photo.image_path)

  return NextResponse.json(
    { photo, imageUrl: urlData.publicUrl },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}