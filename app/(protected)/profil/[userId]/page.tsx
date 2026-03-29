import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default async function ProfilPage({ params }: { params: { userId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Profil de l'utilisateur consulté
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, created_at')
    .eq('id', params.userId)
    .single()

  if (!profile) notFound()

  const isOwnProfile = user?.id === params.userId

  // Events terminés avec les combats et résultats
  const { data: events } = await supabase
    .from('ufc_events')
    .select(`
      id, name, date, location,
      fights(
        id, fighter1_name, fighter2_name, weight_class,
        is_main_event, card_order, scheduled_rounds,
        fight_results(winner, method, round)
      )
    `)
    .eq('status', 'completed')
    .order('date', { ascending: false })

  // Pronos de l'utilisateur consulté sur ces events
  const fightIds = (events ?? []).flatMap((e: any) => e.fights.map((f: any) => f.id))

  const { data: predictions } = await supabase
    .from('predictions')
    .select('fight_id, predicted_winner, predicted_method, predicted_round, points_earned')
    .eq('user_id', params.userId)
    .in('fight_id', fightIds.length > 0 ? fightIds : ['none'])

  const predMap = Object.fromEntries((predictions ?? []).map(p => [p.fight_id, p]))

  // Stats globales
  const totalPoints = (predictions ?? []).reduce((sum, p) => sum + (p.points_earned ?? 0), 0)
  const perfectPicks = (predictions ?? []).filter(p => p.points_earned === 30).length
  const correctWinners = (predictions ?? []).filter(p => (p.points_earned ?? 0) >= 10).length
  const totalPredictions = (predictions ?? []).filter(p => p.points_earned !== null).length

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">Dashboard</Link>
        <span className="text-white/20 text-xs">/</span>
        <span className="text-white/60 text-xs uppercase tracking-widest">{profile.username}</span>
      </div>

      {/* Header profil */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-display text-4xl tracking-wider mb-1">{profile.username}</div>
            <div className="text-white/40 text-xs uppercase tracking-widest">
              Membre depuis {format(new Date(profile.created_at), 'MMMM yyyy', { locale: fr })}
            </div>
            {isOwnProfile && <div className="badge-red mt-2 inline-flex">Ton profil</div>}
          </div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="font-display text-3xl text-gold-400">{totalPoints}</div>
              <div className="text-white/40 text-xs uppercase tracking-widest mt-1">pts total</div>
            </div>
            <div>
              <div className="font-display text-3xl text-white">{correctWinners}</div>
              <div className="text-white/40 text-xs uppercase tracking-widest mt-1">bons gagnants</div>
            </div>
            <div>
              <div className="font-display text-3xl text-blood-400">{perfectPicks}</div>
              <div className="text-white/40 text-xs uppercase tracking-widest mt-1">parfaits</div>
            </div>
          </div>
        </div>
      </div>

      {/* Historique des pronos par event */}
      {(events ?? []).length === 0 && (
        <div className="text-center py-12">
          <p className="font-display text-3xl text-white/20 mb-2">AUCUN EVENT TERMINÉ</p>
          <p className="text-white/40 text-sm">Les pronos apparaîtront ici après les événements</p>
        </div>
      )}

      {(events ?? []).map((event: any) => {
        const eventFights = [...event.fights].sort((a: any, b: any) =>
          b.is_main_event - a.is_main_event || b.card_order - a.card_order
        )
        const eventPreds = eventFights.filter((f: any) => predMap[f.id])
        if (eventPreds.length === 0) return null

        const eventPoints = eventPreds.reduce((sum: number, f: any) =>
          sum + (predMap[f.id]?.points_earned ?? 0), 0)

        return (
          <div key={event.id} className="card space-y-3">
            {/* Header event */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <Link href={`/events/${event.id}`}
                  className="font-display text-2xl tracking-wider hover:text-blood-400 transition-colors">
                  {event.name}
                </Link>
                <div className="text-white/40 text-xs mt-1 tracking-wide">
                  {format(new Date(event.date), 'd MMMM yyyy', { locale: fr })} · {event.location}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl text-gold-400">{eventPoints} pts</div>
                <div className="text-white/40 text-xs">{eventPreds.length} prono(s)</div>
              </div>
            </div>

            {/* Combats */}
            {eventFights.map((fight: any) => {
              const pred = predMap[fight.id]
              const result = fight.fight_results?.[0]
              if (!pred && !result) return null

              const predWinnerName = pred?.predicted_winner === 'fighter1' ? fight.fighter1_name
                : pred?.predicted_winner === 'fighter2' ? fight.fighter2_name : 'Match nul'

              const resultWinnerName = result?.winner === 'fighter1' ? fight.fighter1_name
                : result?.winner === 'fighter2' ? fight.fighter2_name
                : result?.winner === 'draw' ? 'Match nul' : 'NC'

              const points = pred?.points_earned

              return (
                <div key={fight.id} className="bg-octagon-700 border border-octagon-600 p-4">
                  {fight.is_main_event && <div className="badge-red mb-2 inline-flex">MAIN EVENT</div>}
                  <div className="text-white/40 text-xs uppercase tracking-widest mb-2">{fight.weight_class}</div>

                  {/* Noms des fighters */}
                  <div className="font-display text-lg tracking-wider mb-3">
                    {fight.fighter1_name}
                    <span className="text-white/30 mx-2">vs</span>
                    {fight.fighter2_name}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Prono */}
                    {pred ? (
                      <div>
                        <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Pronostic</div>
                        <div className="flex flex-wrap gap-1">
                          <span className="badge-gray">{predWinnerName}</span>
                          <span className="badge-gray">{pred.predicted_method}</span>
                          {pred.predicted_method !== 'Decision' && pred.predicted_winner !== 'draw' && (
                            <span className="badge-gray">R{pred.predicted_round}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Pronostic</div>
                        <span className="text-white/30 text-sm">Pas de prono</span>
                      </div>
                    )}

                    {/* Résultat */}
                    {result && (
                      <div>
                        <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Résultat</div>
                        <div className="flex flex-wrap gap-1">
                          <span className="text-gold-400 text-sm font-semibold">{resultWinnerName}</span>
                          <span className="badge-gray">{result.method}</span>
                          <span className="badge-gray">R{result.round}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Points */}
                  {points !== null && points !== undefined && (
                    <div className="mt-3 pt-3 border-t border-octagon-600 flex items-center justify-between">
                      <span className="text-white/40 text-xs uppercase tracking-widest">Points gagnés</span>
                      <span className={`font-display text-xl ${
                        points === 30 ? 'text-gold-400' :
                        points >= 10 ? 'text-white' :
                        'text-white/40'
                      }`}>
                        {points} pts
                        {points === 30 && <span className="text-xs text-gold-400 ml-1">PARFAIT</span>}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
