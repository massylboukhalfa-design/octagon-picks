import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getLocale } from '@/lib/i18n/server'
import DraftTradeForm from '@/components/draft/DraftTradeForm'
import DraftTradeList from '@/components/draft/DraftTradeList'

export default async function DraftTradesPage({
  params
}: { params: { id: string; seasonId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const locale = getLocale()
  const isFr = locale === 'fr'

  const { data: season } = await supabase
    .from('draft_seasons').select('*').eq('id', params.seasonId).single()
  if (!season || season.league_id !== params.id) notFound()
  if (season.status !== 'active') redirect(`/leagues/${params.id}/draft/${params.seasonId}`)

  const { data: members } = await supabase
    .from('league_members').select('profiles(id, username, avatar_url)').eq('league_id', params.id)
  const memberProfiles = (members ?? []).map((m: any) => m.profiles).filter(Boolean)

  const { data: allRosters } = await supabase
    .from('draft_rosters')
    .select('id, user_id, fighter_id, slot_type, fighters(id, name, photo_url), fights(id, fighter1_name, fighter2_name, is_main_event, ufc_events(name), fight_results(id))')
    .eq('season_id', params.seasonId)
    .eq('is_active', true)

  const myRosters = (allRosters ?? []).filter((r: any) => r.user_id === user!.id)

  // Récupérer les trades avec les noms snapshotés (pas besoin de joindre les rosters)
  const { data: trades } = await supabase
    .from('draft_trades')
    .select(`
      id, status, message, created_at, season_id,
      proposer_id, receiver_id,
      proposer_fighter_name, receiver_fighter_name,
      proposer_profile:proposer_id(username),
      receiver_profile:receiver_id(username)
    `)
    .eq('season_id', params.seasonId)
    .or(`proposer_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-2xl animate-fade-in space-y-6">
      <Link href={`/leagues/${params.id}/draft/${params.seasonId}`}
        className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">
        {isFr ? '← Retour' : '← Back'}
      </Link>

      <h1 className="font-display text-4xl tracking-wider">
        {isFr ? 'ÉCHANGES' : 'TRADES'}
      </h1>

      {myRosters.length > 0 && memberProfiles.length > 1 && (
        <DraftTradeForm
          seasonId={params.seasonId}
          currentUserId={user!.id}
          myRosters={myRosters}
          members={memberProfiles}
          allRosters={allRosters ?? []}
          locale={locale}
        />
      )}

      <div className="card space-y-4">
        <h2 className="font-display text-xl tracking-wider">
          {isFr ? 'MES ÉCHANGES' : 'MY TRADES'}
        </h2>
        <DraftTradeList
          trades={trades ?? []}
          currentUserId={user!.id}
          leagueId={params.id}
          locale={locale}
        />
      </div>
    </div>
  )
}
