import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { seasonId } = await req.json()
  if (!seasonId) return NextResponse.json({ error: 'seasonId required' }, { status: 400 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Vérifier que c'est l'owner
  const { data: season } = await admin
    .from('draft_seasons').select('*, leagues(owner_id)').eq('id', seasonId).single()
  if (!season) return NextResponse.json({ error: 'Season not found' }, { status: 404 })
  if ((season.leagues as any).owner_id !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (season.status !== 'upcoming')
    return NextResponse.json({ error: 'Season already started' }, { status: 400 })

  // Récupérer les membres de la ligue et mélanger aléatoirement
  const { data: members } = await admin
    .from('league_members').select('user_id').eq('league_id', season.league_id)
  if (!members?.length) return NextResponse.json({ error: 'No members' }, { status: 400 })

  const shuffled = [...members.map((m: any) => m.user_id)]
    .sort(() => Math.random() - 0.5)

  // Lancer le draft
  const { error } = await admin.from('draft_seasons').update({
    status: 'drafting',
    turn_order: shuffled,
    current_pick_index: 0,
    current_pick_started_at: new Date().toISOString(),
  }).eq('id', seasonId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, turn_order: shuffled })
}
