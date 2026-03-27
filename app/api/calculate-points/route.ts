import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { POINTS } from '@/types'

export async function POST(request: Request) {
  const { eventId } = await request.json()
  console.log('🔵 calculate-points called with eventId:', eventId)
  console.log('🔵 Service role key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: fights, error: fightsError } = await supabase
    .from('fights')
    .select('*, fight_results(*)')
    .eq('event_id', eventId)

  console.log('🔵 Fights found:', fights?.length, '| Error:', fightsError?.message)

  if (!fights || fights.length === 0) {
    return NextResponse.json({ error: 'No fights found', eventId }, { status: 404 })
  }

  let updated = 0

  for (const fight of fights) {
    const result = fight.fight_results?.[0]
    console.log(`🔵 Fight ${fight.id} | result:`, result ? `${result.winner} / ${result.method} / R${result.round}` : 'MISSING')
    if (!result) continue

    const { data: predictions, error: predError } = await supabase
      .from('predictions')
      .select('*')
      .eq('fight_id', fight.id)

    console.log(`🔵 Predictions:`, predictions?.length, '| Error:', predError?.message)
    if (!predictions) continue

    for (const pred of predictions) {
      let points = 0
      const correctWinner = pred.predicted_winner === result.winner
      const correctMethod = pred.predicted_method === result.method
      const correctRound = pred.predicted_round === result.round

      if (correctWinner) points += POINTS.CORRECT_WINNER
      if (correctMethod) points += POINTS.CORRECT_METHOD
      if (correctRound) points += POINTS.CORRECT_ROUND
      if (correctWinner && correctMethod && correctRound) points += POINTS.PERFECT_COMBO

      console.log(`🔵 Pred ${pred.id} | winner:${correctWinner} method:${correctMethod} round:${correctRound} → ${points} pts`)

      const { error: updateError } = await supabase
        .from('predictions')
        .update({ points_earned: points })
        .eq('id', pred.id)

      console.log(`🔵 Update:`, updateError ? `ERROR: ${updateError.message}` : 'OK')
      updated++
    }
  }

  return NextResponse.json({ success: true, updated })
}
