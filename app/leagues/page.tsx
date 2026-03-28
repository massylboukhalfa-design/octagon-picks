import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default async function LeagueDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: league } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!league) notFound()

  // Check membership
  const { data: membership } = await supabase
    .from('league_members')
    .select('id')
    .eq('league_id', params.id)
    .eq('user_id', user!.id)
    .single()

  if (!membership) notFound()

  // Leaderboard
  const { data: leaderboard } = await supabase
    .from('league_leaderboard')
    .select('*')
    .eq('league_id', params.id)
    .order('total_points', { ascending: false })

  // Events with predictions count for this league
  const { data: events } = await supabase
    .from('ufc_events')
    .select(`
      id, name, date, location, status,
      fights(
        id,
        predictions(count)
      )
    `)
    .order('date', { ascending: false })
    .limit(10)

  const isOwner = league.owner_id === user!.id

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Link href="/dashboard" className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">Dashboard</Link>
            <span className="text-white/20 text-xs">/</span>
            <Link href="/leagues" className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">Ligues</Link>
            <span className="text-white/20 text-xs">/</span>
            <span className="text-white/60 text-xs uppercase tracking-widest">{league.name}</span>
          </div>
          <h1 className="font-display text-5xl tracking-wider">{league.name}</h1>
          {league.description && (
            <p className="text-white/50 mt-2 tracking-wide">{league.description}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Code d'invitation</div>
          <div className="font-mono text-2xl text-gold-400 tracking-[0.3em] border border-gold-500 px-4 py-2 glow-gold">
            {league.invite_code}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard */}
        <div className="lg:col-span-2 card">
          <h2 className="font-display text-3xl tracking-wider mb-6">CLASSEMENT</h2>
          {leaderboard && leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.map((entry: any, i: number) => (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-4 p-4 border ${
                    i === 0 ? 'border-gold-500 bg-yellow-950/20' :
                    i === 1 ? 'border-octagon-500 bg-octagon-700' :
                    i === 2 ? 'border-octagon-600 bg-octagon-700' :
                    'border-octagon-700 bg-octagon-800'
                  } ${entry.user_id === user!.id ? 'border-l-2 border-l-blood-500' : ''}`}
                >
                  <div className={`font-display text-2xl w-8 text-center ${
                    i === 0 ? 'text-gold-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-octagon-600'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold tracking-wide flex items-center gap-2">
                      {entry.username}
                      {entry.user_id === user!.id && <span className="badge-red text-xs">Toi</span>}
                    </div>
                    <div className="flex gap-3 mt-1">
                      <span className="text-octagon-600 text-xs">✓ {entry.correct_winner} gagnants</span>
                      <span className="text-octagon-600 text-xs">🎯 {entry.perfect_picks} parfaits</span>
                    </div>
                  </div>
                  <div className={`font-display text-3xl ${i === 0 ? 'text-gold-400' : 'text-white'}`}>
                    {entry.total_points}
                    <span className="text-sm text-octagon-600 ml-1 font-body">pts</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-octagon-600 text-center py-8">Aucun pronostic encore posé dans cette ligue</p>
          )}
        </div>

        {/* Events history */}
        <div className="card">
          <h2 className="font-display text-2xl tracking-wider mb-5">ÉVÉNEMENTS</h2>
          <div className="space-y-3">
            {events?.map((event: any) => (
              <Link
                key={event.id}
                href={`/events/${event.id}?league=${params.id}`}
                className="block p-3 bg-octagon-700 hover:bg-octagon-600 border border-octagon-600 hover:border-blood-500 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm tracking-wide">{event.name}</div>
                    <div className="text-octagon-600 text-xs mt-0.5">
                      {format(new Date(event.date), 'd MMM yyyy', { locale: fr })}
                    </div>
                  </div>
                  <StatusBadge status={event.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Admin section */}
      {isOwner && (
        <div className="card border-gold-500/30">
          <h2 className="font-display text-2xl tracking-wider mb-4 text-gold-400">ADMINISTRATION</h2>
          <p className="text-octagon-600 text-sm tracking-wide">
            Tu es le créateur de cette ligue. Tu peux gérer les événements et les résultats depuis la page Événements.
          </p>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'upcoming') return <span className="badge-green">À venir</span>
  if (status === 'locked') return <span className="badge-red">Fermé</span>
  return <span className="badge-gray">Terminé</span>
}
