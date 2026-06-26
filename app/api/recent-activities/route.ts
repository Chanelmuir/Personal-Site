import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const userId = process.env.CHANEL_DATABASE_ID!

  const { data, error } = await supabase
    .from('activities')
    .select('id, strava_id, name, type, start_date, distance_m, moving_time_s, elevation_m, route')
    .eq('user_id', userId)
    .order('start_date', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Recent activities fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ activities: data ?? [] })
}