import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { getLocale } from '@/lib/i18n/server'
import DraftLeaderboard from '@/components/draft/DraftLeaderboard'
import DraftRosterGrid from '@/components/draft/DraftRosterGrid'
import DraftStatusBanner from '@/components/draft/DraftStatusBanner'
import LaunchDraftButton from '@/components/draft/LaunchDraftButton'

export default async function DraftSeasonPage({
  params
}: { params: { id: string; seasonId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const locale = getLocale()
  const isFr = locale === 'fr'
  const dateLocale = isFr ? fr : enUS

  const { data: league } = await supabase.from('leagues').select('*').eq('id', params.id).single()
  if (!league) notFound()

  const { data: membership } = await supabase
    .from('league_members').select('id').eq('league_id', params.id).eq('user_id', user!.id).single()
  if (!membership) notFound()

  const { data: season } = await supabase
    .from('draft_seasons').select('*').eq('id', params.seasonId).single()
  if (!season || season.league_id !== params.id) notFound()

  // Events de la saison
  const { data: seasonEvents } = await supabase
    .from('draft_season_events')
    .select('ufc_events(id, name, date, location)')
    .eq('season_id', params.seasonId)

  const events = (seasonEvents ?? []).map((e: any) => e.ufc_events).filter(Boolean)

  // Membres de la ligue
  const { data: members } = await supabase
    .from('league_members')
    .select('profiles(id, username, avatar_url)')
    .eq('league_id', params.id)
  const memberProfiles = (members ?? []).map((m: any) => m.profiles).filter(Boolean)

  // Rosters
  const { data: rosters } = await supabase
    .from('draft_rosters')
    .select('*, fighters(id, name, photo_url, country_flag, wins, losses, draws), fights(id, fighter1_name, fighter2_name, is_main_event, weight_class, ufc_events(name))')
    .eq('season_id', params.seasonId)
    .eq('is_active', true)

  // Leaderboard (seulement si saison active ou terminée)
  let leaderboard: any[] = []
  if (season.status === 'active' || season.status === 'completed') {
    const { data: lb } = await supabase
      .from('draft_season_leaderboard')
      .select('*')
      .eq('season_id', params.seasonId)
      .order('rank', { ascending: true })
    leaderboard = lb ?? []
  }

  const isOwner = league.owner_id === user!.id

  // Qui doit picker maintenant ?
  let currentPickerUser: any = null
  if (season.status === 'drafting' && season.turn_order) {
    const { data: cp } = await supabase
      .rpc('get_draft_current_user', { p_season_id: params.seasonId })
    if (cp) {
      currentPickerUser = memberProfiles.find((m: any) => m.id === cp)
    }
  }

  // Est-ce mon tour ?
  const isMyTurn = season.status === 'drafting' && currentPickerUser?.id === user!.id

  // Deadline du joueur courant
  let myDeadline: Date | null = null
  if (season.status === 'drafting' && season.current_pick_started_at) {
    myDeadline = new Date(new Date(season.current_pick_started_at).getTime() + season.hours_per_pick * 60 * 60 * 1000)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href={`/leagues/${params.id}`} className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">
          {league.name}
        </Link>
        <span className="text-white/20 text-xs">/</span>
        <Link href={`/leagues/${params.id}/draft`} className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">
          Draft
        </Link>
        <span className="text-white/20 text-xs">/</span>
        <span className="text-white/60 text-xs uppercase tracking-widest truncate max-w-[200px]">{season.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-wider">{season.name}</h1>
          <div className="flex gap-3 mt-2 text-white/40 text-xs">
            <span>{events.length} event{events.length > 1 ? 's' : ''}</span>
            <span>·</span>
            <span>{memberProfiles.length} {isFr ? 'joueurs' : 'players'}</span>
            {season.season_start && (
              <>
                <span>·</span>
                <span>
                  {format(new Date(season.season_start), isFr ? 'd MMM' : 'MMM d', { locale: dateLocale })}
                  {' → '}
                  {season.season_end && format(new Date(season.season_end), isFr ? 'd MMM yyyy' : 'MMM d, yyyy', { locale: dateLocale })}
                </span>
              </>
            )}
          </div>
        </div>
        {isOwner && season.status === 'upcoming' && (
          <LaunchDraftButton seasonId={params.seasonId} locale={locale} />
        )}
        {season.status === 'active' && (
          <Link href={`/leagues/${params.id}/draft/${params.seasonId}/trades`}
            className="btn-secondary text-sm py-2 px-4">
            ⇄ {locale === 'fr' ? 'Échanges' : 'Trades'}
          </Link>
        )}
      </div>

      {/* Bannière statut */}
      <DraftStatusBanner
        season={season}
        isMyTurn={isMyTurn}
        currentPicker={currentPickerUser}
        myDeadline={myDeadline}
        leagueId={params.id}
        seasonId={params.seasonId}
        locale={locale}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classement — visible en active/completed */}
        {(season.status === 'active' || season.status === 'completed') && leaderboard.length > 0 && (
          <div className="lg:col-span-1">
            <DraftLeaderboard
              leaderboard={leaderboard}
              currentUserId={user!.id}
              locale={locale}
            />
          </div>
        )}

        {/* Rosters */}
        <div className={season.status === 'active' || season.status === 'completed' ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <DraftRosterGrid
            rosters={rosters ?? []}
            members={memberProfiles}
            currentUserId={user!.id}
            locale={locale}
          />
        </div>
      </div>

      {/* Events de la saison */}
      <div className="card space-y-3">
        <h2 className="font-display text-xl tracking-wider">
          {isFr ? 'EVENTS DE LA SAISON' : 'SEASON EVENTS'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {events.map((event: any) => (
            <Link key={event.id} href={`/events/${event.id}`}
              className="flex items-center justify-between p-3 bg-octagon-700 border border-octagon-600 hover:border-blood-500/50 transition-all">
              <div>
                <div className="font-semibold text-sm">{event.name}</div>
                <div className="text-white/40 text-xs mt-0.5">
                  {format(new Date(event.date), isFr ? 'd MMM yyyy' : 'MMM d, yyyy', { locale: dateLocale })}
                </div>
              </div>
              <span className="text-white/30 text-xs">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
