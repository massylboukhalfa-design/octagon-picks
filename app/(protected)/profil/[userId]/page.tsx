import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default async function ProfilPage({ params }: { params: { userId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, favorite_fighter_id, created_at')
    .eq('id', params.userId)
    .single()

  if (!profile) notFound()

  const isOwnProfile = user?.id === params.userId

  // Combattant favori
  let favFighter: any = null
  if (profile.favorite_fighter_id) {
    const { data } = await supabase
      .from('fighters')
      .select('id, name, photo_url, weight_class, country_flag, wins, losses, draws, is_champion')
      .eq('id', profile.favorite_fighter_id)
      .single()
    favFighter = data
  }

  // Events terminés avec combats et résultats
  const { data: events } = await supabase
    .from('ufc_events')
    .select(`id, name, date, location, fights(id, fighter1_name, fighter2_name, weight_class, is_main_event, card_order, scheduled_rounds, fight_results(winner, method, round))`)
    .eq('status', 'completed')
    .order('date', { ascending: false })

  const fightIds = (events ?? []).flatMap((e: any) => e.fights.map((f: any) => f.id))

  const { data: predictions } = await supabase
    .from('predictions')
    .select('fight_id, predicted_winner, predicted_method, predicted_round, points_earned')
    .eq('user_id', params.userId)
    .in('fight_id', fightIds.length > 0 ? fightIds : ['none'])

  const predMap = Object.fromEntries((predictions ?? []).map(p => [p.fight_id, p]))

  const totalPoints = (predictions ?? []).reduce((sum, p) => sum + (p.points_earned ?? 0), 0)
  const perfectPicks = (predictions ?? []).filter(p => p.points_earned === 30).length
  const correctWinners = (predictions ?? []).filter(p => (p.points_earned ?? 0) >= 10).length

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">Dashboard</Link>
        <span className="text-white/20 text-xs">/</span>
        <span className="text-white/60 text-xs uppercase tracking-widest">{profile.username}</span>
      </div>

      {/* Header profil */}
      <div className="card">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-octagon-600 bg-octagon-700 flex-shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-display text-3xl text-white/20">{profile.username.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <div className="font-display text-4xl tracking-wider">{profile.username}</div>
              {isOwnProfile && <span className="badge-red">Toi</span>}
            </div>
            <div className="text-white/40 text-xs uppercase tracking-widest mb-4">
              Membre depuis {format(new Date(profile.created_at), 'MMMM yyyy', { locale: fr })}
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

          {/* Fighter favori */}
          {favFighter && (
            <div className="text-center flex-shrink-0">
              <div className="text-white/40 text-xs uppercase tracking-widest mb-2">Fighter favori</div>
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blood-500/50 bg-octagon-700 mx-auto mb-1">
                {favFighter.photo_url ? (
                  <img src={favFighter.photo_url} alt={favFighter.name} className="w-full h-full object-cover object-top" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-display text-xl text-white/20">{favFighter.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="text-xs font-semibold">{favFighter.name}</div>
              <div className="text-white/40 text-xs">{favFighter.country_flag}</div>
              {favFighter.is_champion && <span className="badge-gold text-xs mt-1 inline-flex">C</span>}
            </div>
          )}
        </div>

        {isOwnProfile && (
          <div className="mt-4 pt-4 border-t border-octagon-700">
            <Link href="/parametres" className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">
              Modifier mon profil →
            </Link>
          </div>
        )}
      </div>

      {/* Historique */}
      {(events ?? []).length === 0 && (
        <div className="text-center py-12">
          <p className="font-display text-3xl text-white/20 mb-2">AUCUN EVENT TERMINÉ</p>
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
            <div className="flex items-start justify-between mb-2">
              <div>
                <Link href={`/events/${event.id}`} className="font-display text-2xl tracking-wider hover:text-blood-400 transition-colors">
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
              const isDecisionOrDraw = pred?.predicted_method === 'Decision' || pred?.predicted_winner === 'draw'

              return (
                <div key={fight.id} className="bg-octagon-700 border border-octagon-600 p-4">
                  {fight.is_main_event && <div className="badge-red mb-2 inline-flex">MAIN EVENT</div>}
                  <div className="text-white/40 text-xs uppercase tracking-widest mb-2">{fight.weight_class}</div>
                  <div className="font-display text-lg tracking-wider mb-3">
                    {fight.fighter1_name} <span className="text-white/30 mx-2">vs</span> {fight.fighter2_name}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {pred && (
                      <div>
                        <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Pronostic</div>
                        <div className="flex flex-wrap gap-1">
                          <span className="badge-gray">{predWinnerName}</span>
                          <span className="badge-gray">{pred.predicted_method}</span>
                          {!isDecisionOrDraw && <span className="badge-gray">R{pred.predicted_round}</span>}
                        </div>
                      </div>
                    )}
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
                  {points !== null && points !== undefined && (
                    <div className="mt-3 pt-3 border-t border-octagon-600 flex items-center justify-between">
                      <span className="text-white/40 text-xs uppercase tracking-widest">Points gagnés</span>
                      <span className={`font-display text-xl ${points === 30 ? 'text-gold-400' : points >= 10 ? 'text-white' : 'text-white/40'}`}>
                        {points} pts {points === 30 && <span className="text-xs text-gold-400">PARFAIT</span>}
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
