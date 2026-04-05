import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const admin = () => createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST — proposer un échange
export async function POST(req: NextRequest) {
  const { seasonId, proposerRosterId, receiverRosterId, message } = await req.json()

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = admin()

  // Récupérer les deux rosters et vérifier que les fighters n'ont pas encore combattu
  const { data: proposerRoster } = await db
    .from('draft_rosters')
    .select('id, user_id, fighter_id, fight_id, fights(fight_results(id))')
    .eq('id', proposerRosterId).single()

  const { data: receiverRoster } = await db
    .from('draft_rosters')
    .select('id, user_id, fighter_id, fight_id, fights(fight_results(id))')
    .eq('id', receiverRosterId).single()

  if (!proposerRoster || !receiverRoster)
    return NextResponse.json({ error: 'Roster not found' }, { status: 404 })

  if (proposerRoster.user_id !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Vérifier que les combats n'ont pas encore eu lieu
  const proposerFightDone = (proposerRoster.fights as any)?.fight_results?.length > 0
  const receiverFightDone = (receiverRoster.fights as any)?.fight_results?.length > 0

  if (proposerFightDone || receiverFightDone)
    return NextResponse.json({
      error: 'Cannot trade fighters who have already fought'
    }, { status: 400 })

  const { data: trade, error } = await db.from('draft_trades').insert({
    season_id: seasonId,
    proposer_id: user.id,
    receiver_id: receiverRoster.user_id,
    proposer_roster_id: proposerRosterId,
    receiver_roster_id: receiverRosterId,
    message: message || null,
    status: 'pending',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, trade })
}

// PATCH — accepter / refuser / annuler un échange
export async function PATCH(req: NextRequest) {
  const { tradeId, action } = await req.json()
  if (!tradeId || !['accept', 'reject', 'cancel'].includes(action))
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = admin()
  const { data: trade } = await db.from('draft_trades').select('*').eq('id', tradeId).single()
  if (!trade) return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
  if (trade.status !== 'pending') return NextResponse.json({ error: 'Trade already resolved' }, { status: 400 })

  // Vérifier les permissions
  if (action === 'cancel' && trade.proposer_id !== user.id)
    return NextResponse.json({ error: 'Only proposer can cancel' }, { status: 403 })
  if (['accept', 'reject'].includes(action) && trade.receiver_id !== user.id)
    return NextResponse.json({ error: 'Only receiver can accept/reject' }, { status: 403 })

  const status = action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'cancelled'

  if (action === 'accept') {
    // Échanger les fighters dans les rosters
    const { data: pRoster } = await db.from('draft_rosters').select('fighter_id, fight_id, slot_type').eq('id', trade.proposer_roster_id).single()
    const { data: rRoster } = await db.from('draft_rosters').select('fighter_id, fight_id, slot_type').eq('id', trade.receiver_roster_id).single()

    if (!pRoster || !rRoster) return NextResponse.json({ error: 'Rosters not found' }, { status: 404 })

    // Vérifier une dernière fois que les combats n'ont pas eu lieu
    const { data: pResult } = await db.from('fight_results').select('id').eq('fight_id', pRoster.fight_id).single()
    const { data: rResult } = await db.from('fight_results').select('id').eq('fight_id', rRoster.fight_id).single()
    if (pResult || rResult)
      return NextResponse.json({ error: 'Cannot trade — fight already happened' }, { status: 400 })

    // Swap
    await db.from('draft_rosters').update({
      fighter_id: rRoster.fighter_id, fight_id: rRoster.fight_id, slot_type: rRoster.slot_type, acquired_by: 'trade'
    }).eq('id', trade.proposer_roster_id)

    await db.from('draft_rosters').update({
      fighter_id: pRoster.fighter_id, fight_id: pRoster.fight_id, slot_type: pRoster.slot_type, acquired_by: 'trade'
    }).eq('id', trade.receiver_roster_id)
  }

  await db.from('draft_trades').update({ status, resolved_at: new Date().toISOString() }).eq('id', tradeId)
  return NextResponse.json({ success: true, status })
}
