import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

console.log('Service role key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
console.log('Service role key length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length)

export async function POST(req: NextRequest) {
  const formData = await req.formData()

  const file = formData.get('file') as File | null
  const lat = formData.get('lat') as string | null
  const lng = formData.get('lng') as string | null
  const description = formData.get('description') as string | null

  if (!file || !lat || !lng) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const fileName = `${Date.now()}-${file.name}`
  const fileBuffer = await file.arrayBuffer()

  const { error: uploadError } = await supabaseAdmin.storage
    .from('gallery-game')
    .upload(fileName, fileBuffer, {
      contentType: file.type,
    })

  if (uploadError) {
    console.error('Gallery upload error:', uploadError)
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { error: insertError } = await supabaseAdmin
    .from('gallery_game_photos')
    .insert({
      image_path: fileName,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      description: description || null,
    })

  if (insertError) {
    console.error('Gallery insert error:', insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}