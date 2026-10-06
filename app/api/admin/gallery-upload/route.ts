import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Compare without leaking how much of the password matched
function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.ADMIN_UPLOAD_PASSWORD
  const provided = req.headers.get('x-admin-password')
  if (!expected || !provided) return false

  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  if (!process.env.ADMIN_UPLOAD_PASSWORD) {
    return NextResponse.json({ error: 'Uploads are not configured' }, { status: 503 })
  }
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
  }

  const formData = await req.formData()

  const file = formData.get('file') as File | null
  const lat = formData.get('lat') as string | null
  const lng = formData.get('lng') as string | null
  const description = formData.get('description') as string | null

  if (!file || !lat || !lng) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const latNum = parseFloat(lat)
  const lngNum = parseFloat(lng)
  if (!(Math.abs(latNum) <= 90) || !(Math.abs(lngNum) <= 180)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
  }

  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
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
      lat: latNum,
      lng: lngNum,
      description: description || null,
    })

  if (insertError) {
    console.error('Gallery insert error:', insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}