import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { eventId } = await req.json()
  if (!eventId) return NextResponse.json({ error: 'eventId required' }, { status: 400 })

  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Récupérer les combats — sans filtre sur le statut de l'event
  const { data: fights, error: fightsErr } = await db
    .from('fights')
    .select('id, fighter1_name, fighter2_name')
    .eq('event_id', eventId)

  if (fightsErr) return NextResponse.json({ error: fightsErr.message }, { status: 500 })
  if (!fights?.length) return NextResponse.json({ error: 'No fights found' }, { status: 404 })

  // Récupérer les résultats séparément pour éviter les problèmes de join
  const fightIds = fights.map(f => f.id)

  const { data: results } = await db
    .from('fight_results')
    .select('fight_id, winner, method, round')
    .in('fight_id', fightIds)

  if (!results?.length) return NextResponse.json({ error: 'No results found' }, { status: 404 })

  const resultMap = Object.fromEntries(results.map(r => [r.fight_id, r]))

  // Récupérer tous les pronostics de ces combats
  const { data: predictions } = await db
    .from('predictions')
    .select('id, fight_id, predicted_winner, predicted_method, predicted_round')
    .in('fight_id', fightIds)

  if (!predictions?.length) return NextResponse.json({ error: 'No predictions found' }, { status: 404 })

  let totalUpdated = 0
  const details: any[] = []

  for (const pred of predictions) {
    const result = resultMap[pred.fight_id]
    if (!result) continue

    const fight = fights.find(f => f.id === pred.fight_id)

    const correctWinner = String(pred.predicted_winner).trim() === String(result.winner).trim()
    const correctMethod  = String(pred.predicted_method).trim() === String(result.method).trim()
    const correctRound   = Number(pred.predicted_round) === Number(result.round)

    let points = 0
    if (correctWinner) points += 10
    if (correctMethod) points += 5
    if (correctRound)  points += 5
    if (correctWinner && correctMethod && correctRound) points += 10
    points = Math.min(points, 30)

    await db.from('predictions').update({ points_earned: points }).eq('id', pred.id)
    totalUpdated++

    details.push({
      fight: `${fight?.fighter1_name} vs ${fight?.fighter2_name}`,
      result:     { winner: result.winner,         method: result.method,         round: result.round,         round_type: typeof result.round },
      prediction: { winner: pred.predicted_winner, method: pred.predicted_method, round: pred.predicted_round, round_type: typeof pred.predicted_round },
      correct: { winner: correctWinner, method: correctMethod, round: correctRound },
      points,
    })
  }

  // Marquer l'event comme completed (idempotent)
  await db.from('ufc_events').update({ status: 'completed' }).eq('id', eventId)

  return NextResponse.json({ success: true, predictions_updated: totalUpdated, details })
}
