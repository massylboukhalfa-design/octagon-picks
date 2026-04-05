import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { getLocale } from '@/lib/i18n/server'

export default async function DraftIndexPage({ params }: { params: { id: string } }) {
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

  const isOwner = league.owner_id === user!.id

  const { data: seasons } = await supabase
    .from('draft_seasons')
    .select('*, draft_season_events(count)')
    .eq('league_id', params.id)
    .order('created_at', { ascending: false })

  const statusLabel = (s: string) => {
    const map: Record<string, string> = isFr
      ? { upcoming: 'À venir', drafting: 'Draft en cours', active: 'Saison active', completed: 'Terminée' }
      : { upcoming: 'Upcoming', drafting: 'Drafting', active: 'Active', completed: 'Completed' }
    return map[s] ?? s
  }

  const statusColor = (s: string) => ({
    upcoming: 'badge-gray',
    drafting: 'badge-red',
    active: 'badge-green',
    completed: 'badge-gray',
  }[s] ?? 'badge-gray')

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-2">
        <Link href={`/leagues/${params.id}`} className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">
          {league.name}
        </Link>
        <span className="text-white/20 text-xs">/</span>
        <span className="text-white/60 text-xs uppercase tracking-widest">Draft</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-5xl tracking-wider">DRAFT MODE</h1>
          <p className="text-white/40 text-sm mt-1">{league.name}</p>
        </div>
        {isOwner && (
          <Link href={`/leagues/${params.id}/draft/new`} className="btn-gold text-sm py-2 px-4">
            + {isFr ? 'Nouvelle saison' : 'New season'}
          </Link>
        )}
      </div>

      {(!seasons || seasons.length === 0) ? (
        <div className="text-center py-16 card">
          <p className="font-display text-3xl text-white/20 mb-3">
            {isFr ? 'AUCUNE SAISON' : 'NO SEASONS'}
          </p>
          <p className="text-white/40 text-sm">
            {isFr
              ? "L'owner de la ligue peut créer une saison draft."
              : 'The league owner can create a draft season.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {seasons.map((season: any) => (
            <Link
              key={season.id}
              href={`/leagues/${params.id}/draft/${season.id}`}
              className="card-hover block"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`${statusColor(season.status)} text-xs`}>
                      {statusLabel(season.status)}
                    </span>
                    {season.status === 'drafting' && (
                      <span className="text-blood-400 text-xs animate-pulse">● LIVE</span>
                    )}
                  </div>
                  <h2 className="font-display text-2xl tracking-wider">{season.name}</h2>
                  <div className="text-white/40 text-xs mt-1">
                    {season.draft_season_events?.[0]?.count ?? 0} {isFr ? 'event(s)' : 'event(s)'}
                    {season.season_start && (
                      <span className="ml-3">
                        {format(new Date(season.season_start), isFr ? 'd MMM yyyy' : 'MMM d, yyyy', { locale: dateLocale })}
                        {' → '}
                        {season.season_end && format(new Date(season.season_end), isFr ? 'd MMM yyyy' : 'MMM d, yyyy', { locale: dateLocale })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-white/30 text-sm">→</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
