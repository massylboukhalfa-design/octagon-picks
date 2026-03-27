import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { POINTS } from '@/types'

export async function POST(request: Request) {
  const { eventId } = await request.json()

  // Service role client — bypass RLS pour le calcul des points
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: fights } = await supabase
    .from('fights')
    .select('*, fight_results(*)')
    .eq('event_id', eventId)

  if (!fights) return NextResponse.json({ error: 'No fights found' }, { status: 404 })

  let updated = 0

  for (const fight of fights) {
    const result = fight.fight_results?.[0]
    if (!result) continue

    const { data: predictions } = await supabase
      .from('predictions')
      .select('*')
      .eq('fight_id', fight.id)

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

      await supabase
        .from('predictions')
        .update({ points_earned: points })
        .eq('id', pred.id)

      updated++
    }
  }

  return NextResponse.json({ success: true, updated })
}
