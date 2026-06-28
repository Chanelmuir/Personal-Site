import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface GalleryGamePhoto {
  id: string
  image_path: string
  lat: number
  lng: number
  description: string | null
}

export async function getRandomGamePhoto(): Promise<{ photo: GalleryGamePhoto; imageUrl: string } | null> {
  // fetch all ids, then pick one client-side
  const { data, error } = await supabase
    .from('gallery_game_photos')
    .select('id, image_path, lat, lng, description')

  if (error || !data || data.length === 0) {
    console.error('Gallery game fetch error:', error)
    return null
  }

  const photo = data[Math.floor(Math.random() * data.length)]

  const { data: urlData } = supabase.storage
    .from('gallery-game')
    .getPublicUrl(photo.image_path)

  return { photo, imageUrl: urlData.publicUrl }
}