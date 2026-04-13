import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

type Pick = {
  fighter_id: string
  fight_id: string
  slot_type: 'main_event' | 'undercard'
}

export async function POST(req: NextRequest) {
  const { seasonId, picks, leagueId }: { seasonId: string; picks: Pick[]; leagueId: string } = await req.json()
  if (!seasonId || !picks?.length)
    return NextResponse.json({ error: 'seasonId and picks required' }, { status: 400 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: season } = await admin
    .from('draft_seasons').select('*').eq('id', seasonId).single()
  if (!season || season.status !== 'drafting')
    return NextResponse.json({ error: 'Season not in drafting status' }, { status: 400 })

  const { data: currentPicker } = await admin
    .rpc('get_draft_current_user', { p_season_id: seasonId })
  if (currentPicker !== user.id)
    return NextResponse.json({ error: 'Not your turn' }, { status: 403 })

  const mainEventPicks = picks.filter(p => p.slot_type === 'main_event')
  const undercardPicks = picks.filter(p => p.slot_type === 'undercard')
  const needed = season.picks_per_turn ?? { main_event: 1, undercard: 2 }

  if (mainEventPicks.length !== needed.main_event || undercardPicks.length !== needed.undercard)
    return NextResponse.json({
      error: `Need exactly ${needed.main_event} main event + ${needed.undercard} undercard picks`
    }, { status: 400 })

  const { data: alreadyDrafted } = await admin
    .from('draft_rosters')
    .select('fighter_id')
    .eq('season_id', seasonId)
    .in('fighter_id', picks.map(p => p.fighter_id))

  if (alreadyDrafted?.length)
    return NextResponse.json({ error: 'Some fighters already drafted' }, { status: 409 })

  const { error: insertError } = await admin.from('draft_rosters').insert(
    picks.map(p => ({
      season_id: seasonId,
      user_id: user.id,
      fighter_id: p.fighter_id,
      fight_id: p.fight_id,
      slot_type: p.slot_type,
      acquired_by: 'draft',
      pick_index: season.current_pick_index,
    }))
  )
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  const totalMembers = season.turn_order?.length ?? 1
  const totalRounds = season.total_rounds ?? 1
  const nextIndex = season.current_pick_index + 1
  const isDraftComplete = nextIndex >= totalMembers * totalRounds

  if (isDraftComplete) {
    await admin.from('draft_seasons').update({
      status: 'active',
      current_pick_index: nextIndex,
      current_pick_started_at: null,
    }).eq('id', seasonId)
  } else {
    await admin.from('draft_seasons').update({
      current_pick_index: nextIndex,
      current_pick_started_at: new Date().toISOString(),
    }).eq('id', seasonId)
  }

  // Revalider les pages concernées pour que tous les joueurs voient la mise à jour
  if (leagueId) {
    revalidatePath(`/leagues/${leagueId}/draft/${seasonId}`)
    revalidatePath(`/leagues/${leagueId}/draft/${seasonId}/pick`)
  }

  return NextResponse.json({ success: true, next_pick_index: nextIndex, draft_complete: isDraftComplete })
}
