import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('eventId')
  if (!eventId) return NextResponse.json({ error: 'eventId required' }, { status: 400 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Trouver les saisons draft qui incluent cet event et qui sont actives
  const { data } = await supabase
    .from('draft_season_events')
    .select('season_id, draft_seasons(id, status)')
    .eq('event_id', eventId)

  const seasonIds = (data ?? [])
    .filter((d: any) => d.draft_seasons?.status === 'active' || d.draft_seasons?.status === 'drafting')
    .map((d: any) => d.season_id)

  return NextResponse.json({ season_ids: seasonIds })
}
