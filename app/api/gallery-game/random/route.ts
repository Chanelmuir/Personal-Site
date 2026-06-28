import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('gallery_game_photos')
    .select('id, image_path, lat, lng, description')

  if (error || !data || data.length === 0) {
    return NextResponse.json({ photo: null, imageUrl: null }, { status: 200 })
  }

  const photo = data[Math.floor(Math.random() * data.length)]

  const { data: urlData } = supabase.storage
    .from('gallery-game')
    .getPublicUrl(photo.image_path)

  return NextResponse.json({ photo, imageUrl: urlData.publicUrl })
}