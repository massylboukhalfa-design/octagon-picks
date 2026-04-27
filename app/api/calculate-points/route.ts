import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { eventId } = await req.json()
  if (!eventId) return NextResponse.json({ error: 'eventId required' }, { status: 400 })

  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: fights } = await db
    .from('fights')
    .select('id, fighter1_name, fighter2_name, fight_results(*)')
    .eq('event_id', eventId)

  if (!fights?.length) return NextResponse.json({ error: 'No fights found' }, { status: 404 })

  let totalUpdated = 0
  const details: any[] = []

  for (const fight of fights) {
    const result = (fight.fight_results as any[])?.[0]
    if (!result) continue

    const { data: predictions } = await db
      .from('predictions')
      .select('id, user_id, predicted_winner, predicted_method, predicted_round')
      .eq('fight_id', fight.id)

    if (!predictions?.length) continue

    for (const pred of predictions) {
      const correctWinner = pred.predicted_winner === result.winner

      // Comparaison stricte des valeurs exactes stockées en BDD
      const correctMethod = pred.predicted_method === result.method

      // Comparaison numérique stricte
      const correctRound = Number(pred.predicted_round) === Number(result.round)

      let points = 0
      if (correctWinner) points += 10
      if (correctMethod) points += 5
      if (correctRound)  points += 5
      if (correctWinner && correctMethod && correctRound) points += 10

      points = Math.min(points, 30)

      await db.from('predictions').update({ points_earned: points }).eq('id', pred.id)
      totalUpdated++

      // Log détaillé pour débugger
      details.push({
        fight: `${fight.fighter1_name} vs ${fight.fighter2_name}`,
        result_raw: {
          winner: result.winner,
          method: result.method,
          round: result.round,
          method_type: typeof result.method,
          round_type: typeof result.round,
        },
        prediction_raw: {
          winner: pred.predicted_winner,
          method: pred.predicted_method,
          round: pred.predicted_round,
          method_type: typeof pred.predicted_method,
          round_type: typeof pred.predicted_round,
        },
        correct: { winner: correctWinner, method: correctMethod, round: correctRound },
        points,
      })
    }
  }

  await db.from('ufc_events').update({ status: 'completed' }).eq('id', eventId)
  return NextResponse.json({ success: true, predictions_updated: totalUpdated, details })
}
