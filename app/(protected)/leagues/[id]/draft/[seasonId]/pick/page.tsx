import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getLocale } from '@/lib/i18n/server'
import DraftPickForm from '@/components/draft/DraftPickForm'

export default async function DraftPickPage({
  params
}: { params: { id: string; seasonId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const locale = getLocale()
  const isFr = locale === 'fr'

  const { data: season } = await supabase
    .from('draft_seasons').select('*').eq('id', params.seasonId).single()
  if (!season || season.league_id !== params.id) notFound()
  if (season.status !== 'drafting') redirect(`/leagues/${params.id}/draft/${params.seasonId}`)

  // Vérifier que c'est bien mon tour
  const { data: currentPickerId } = await supabase
    .rpc('get_draft_current_user', { p_season_id: params.seasonId })
  if (currentPickerId !== user!.id) redirect(`/leagues/${params.id}/draft/${params.seasonId}`)

  // Events de la saison avec leurs combats et fighters disponibles
  const { data: seasonEvents } = await supabase
    .from('draft_season_events')
    .select('ufc_events(id, name, date, fights(id, fighter1_name, fighter2_name, fighter1_id, fighter2_id, is_main_event, weight_class, scheduled_rounds, fighter1:fighter1_id(id, name, photo_url, country_flag, wins, losses, draws, is_champion), fighter2:fighter2_id(id, name, photo_url, country_flag, wins, losses, draws, is_champion)))')
    .eq('season_id', params.seasonId)

  // Fighters déjà draftés dans cette saison
  const { data: draftedRosters } = await supabase
    .from('draft_rosters')
    .select('fighter_id')
    .eq('season_id', params.seasonId)
    .eq('is_active', true)

  const draftedFighterIds = new Set((draftedRosters ?? []).map((r: any) => r.fighter_id))

  // Deadline du joueur
  const deadline = season.current_pick_started_at
    ? new Date(new Date(season.current_pick_started_at).getTime() + season.hours_per_pick * 60 * 60 * 1000)
    : null

  // Construire la liste des fights disponibles par event
  const eventsWithFights = (seasonEvents ?? [])
    .map((se: any) => se.ufc_events)
    .filter(Boolean)
    .map((event: any) => ({
      ...event,
      fights: (event.fights ?? []).map((fight: any) => ({
        ...fight,
        fighter1_available: fight.fighter1_id && !draftedFighterIds.has(fight.fighter1_id),
        fighter2_available: fight.fighter2_id && !draftedFighterIds.has(fight.fighter2_id),
      })).filter((f: any) => f.fighter1_available || f.fighter2_available)
    }))
    .filter((e: any) => e.fights.length > 0)

  // Combien de picks il me reste à faire ce tour
  const picksNeeded = {
    main_event: season.picks_per_turn?.main_event ?? 1,
    undercard: season.picks_per_turn?.undercard ?? 2,
  }

  return (
    <div className="max-w-3xl animate-fade-in space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/leagues/${params.id}/draft/${params.seasonId}`}
          className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">
          {isFr ? '← Retour' : '← Back'}
        </Link>
      </div>

      <div>
        <div className="badge-red mb-3 inline-flex animate-pulse">
          {isFr ? 'TON TOUR' : 'YOUR TURN'}
        </div>
        <h1 className="font-display text-4xl tracking-wider">
          {isFr ? 'FAIRE TES PICKS' : 'MAKE YOUR PICKS'}
        </h1>
        {deadline && (
          <p className="text-white/40 text-sm mt-2">
            {isFr ? 'Deadline : ' : 'Deadline: '}
            <span className="text-gold-400">
              {deadline.toLocaleString(isFr ? 'fr-FR' : 'en-US', {
                dateStyle: 'medium', timeStyle: 'short'
              })}
            </span>
          </p>
        )}
      </div>

      <div className="card border-blood-500/30 space-y-2">
        <p className="text-white/60 text-sm">
          {isFr
            ? `Tu dois choisir ${picksNeeded.main_event} fighter du main event et ${picksNeeded.undercard} fighters de l'undercard.`
            : `You must pick ${picksNeeded.main_event} main event fighter and ${picksNeeded.undercard} undercard fighters.`}
        </p>
      </div>

      <DraftPickForm
        seasonId={params.seasonId}
        userId={user!.id}
        eventsWithFights={eventsWithFights}
        picksNeeded={picksNeeded}
        locale={locale}
      />
    </div>
  )
}
