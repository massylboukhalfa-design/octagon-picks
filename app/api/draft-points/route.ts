import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Barème : KO/TKO = 4, Sub = 4, UD = 3, SD/MD = 2
// Main event × 2, lone win = 1 pt de base
function getBasePoints(method: string): number {
  if (method === 'KO/TKO' || method === 'Submission') return 4
  if (method === 'Decision') return 3
  if (method === 'Split Decision' || method === 'Majority Decision') return 2
  return 1
}

export async function POST(req: NextRequest) {
  const { seasonId, fightId } = await req.json()
  if (!seasonId || !fightId)
    return NextResponse.json({ error: 'seasonId and fightId required' }, { status: 400 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Vérifier admin
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Récupérer le résultat du combat
  const { data: result } = await admin
    .from('fight_results').select('*, fights(is_main_event, fighter1_id, fighter2_id)')
    .eq('fight_id', fightId).single()
  if (!result) return NextResponse.json({ error: 'No result found for this fight' }, { status: 404 })

  const fight = result.fights as any
  const isMainEvent = fight?.is_main_event ?? false
  const multiplier = isMainEvent ? 2 : 1

  // Trouver le fighter gagnant
  const winnerId = result.winner === 'fighter1' ? fight.fighter1_id
    : result.winner === 'fighter2' ? fight.fighter2_id
    : null
  const loserId = result.winner === 'fighter1' ? fight.fighter2_id
    : result.winner === 'fighter2' ? fight.fighter1_id
    : null

  if (!winnerId) return NextResponse.json({ error: 'No winner (draw/NC)' }, { status: 400 })

  // Trouver les joueurs qui ont le winner dans leur roster
  const { data: winnerRosters } = await admin
    .from('draft_rosters')
    .select('id, user_id, slot_type')
    .eq('season_id', seasonId)
    .eq('fighter_id', winnerId)
    .eq('is_active', true)

  // Trouver les joueurs qui ont le loser dans leur roster
  const { data: loserRosters } = await admin
    .from('draft_rosters')
    .select('user_id')
    .eq('season_id', seasonId)
    .eq('fighter_id', loserId)
    .eq('is_active', true)

  const loserOwnerIds = new Set((loserRosters ?? []).map((r: any) => r.user_id))
  const basePoints = getBasePoints(result.method)
  const pointsToInsert = []

  for (const roster of winnerRosters ?? []) {
    // Clash win : l'adversaire appartient à un autre joueur de la ligue
    const isClash = loserId && loserOwnerIds.size > 0 && !loserOwnerIds.has(roster.user_id)
    const isLone = !isClash

    const base = isClash ? basePoints : 1
    const total = base * multiplier

    pointsToInsert.push({
      season_id: seasonId,
      fight_id: fightId,
      user_id: roster.user_id,
      roster_id: roster.id,
      base_points: base,
      multiplier,
      total_points: total,
      point_type: isClash ? 'clash_win' : 'lone_win',
    })
  }

  if (pointsToInsert.length > 0) {
    const { error } = await admin
      .from('draft_fight_points')
      .upsert(pointsToInsert, { onConflict: 'season_id,fight_id,user_id,roster_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, points_awarded: pointsToInsert.length, details: pointsToInsert })
}
