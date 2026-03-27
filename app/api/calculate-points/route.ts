import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { POINTS } from '@/types'

export async function POST(request: Request) {
  const { eventId } = await request.json()
  console.log('🔵 eventId:', eventId)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Requête 1 : fights de l'event
  const { data: fights, error: fightsError } = await supabase
    .from('fights')
    .select('id')
    .eq('event_id', eventId)

  console.log('🔵 Fights:', fights?.length, fightsError?.message)
  if (!fights || fights.length === 0) {
    return NextResponse.json({ error: 'No fights' }, { status: 404 })
  }

  const fightIds = fights.map(f => f.id)

  // Requête 2 : résultats séparément
  const { data: results, error: resultsError } = await supabase
    .from('fight_results')
    .select('*')
    .in('fight_id', fightIds)

  console.log('🔵 Results:', results?.length, resultsError?.message)

  // Requête 3 : predictions
  const { data: predictions, error: predsError } = await supabase
    .from('predictions')
    .select('*')
    .in('fight_id', fightIds)

  console.log('🔵 Predictions:', predictions?.length, predsError?.message)

  if (!results || !predictions) {
    return NextResponse.json({ error: 'Missing data' }, { status: 500 })
  }

  // Map résultats par fight_id
  const resultMap = Object.fromEntries(results.map(r => [r.fight_id, r]))

  let updated = 0

  for (const pred of predictions) {
    const result = resultMap[pred.fight_id]
    if (!result) {
      console.log('🔵 No result for fight:', pred.fight_id)
      continue
    }

    let points = 0
    const correctWinner = pred.predicted_winner === result.winner
    const correctMethod = pred.predicted_method === result.method
    const correctRound = pred.predicted_round === result.round

    if (correctWinner) points += POINTS.CORRECT_WINNER
    if (correctMethod) points += POINTS.CORRECT_METHOD
    if (correctRound) points += POINTS.CORRECT_ROUND
    if (correctWinner && correctMethod && correctRound) points += POINTS.PERFECT_COMBO

    console.log(`🔵 Pred ${pred.id} → ${points} pts (W:${correctWinner} M:${correctMethod} R:${correctRound})`)

    const { error: updateError } = await supabase
      .from('predictions')
      .update({ points_earned: points })
      .eq('id', pred.id)

    console.log('🔵 Update:', updateError ? updateError.message : 'OK')
    updated++
  }

  return NextResponse.json({ success: true, updated })
}
