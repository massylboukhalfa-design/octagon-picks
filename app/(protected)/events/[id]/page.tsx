import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import PredictionForm from '@/components/events/PredictionForm'

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { league?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: event } = await supabase
    .from('ufc_events')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!event) notFound()

  const { data: fights } = await supabase
    .from('fights')
    .select('*, fight_results(*)')
    .eq('event_id', params.id)
    .order('is_main_event', { ascending: false })
    .order('card_order', { ascending: false })

  // User's existing predictions for this event
  const { data: existingPredictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', user!.id)
    .in('fight_id', (fights ?? []).map(f => f.id))
    .eq('league_id', searchParams.league ?? '')

  // User's leagues for the selector
  const { data: userLeagues } = await supabase
    .from('league_members')
    .select('leagues(id, name)')
    .eq('user_id', user!.id)

  const isOpen = event.status === 'upcoming' && new Date() < new Date(event.prediction_deadline)
  const isCompleted = event.status === 'completed'

  const predictionMap = Object.fromEntries((existingPredictions ?? []).map(p => [p.fight_id, p]))

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <Link href="/events" className="text-octagon-600 text-xs uppercase tracking-widest hover:text-white transition-colors mb-3 block">
          ← Événements
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-5xl tracking-wider">{event.name}</h1>
            <p className="text-octagon-600 mt-2 tracking-wide">
              {format(new Date(event.date), "d MMMM yyyy — HH'h'mm", { locale: fr })} · {event.location}
            </p>
          </div>
          <div>
            {event.status === 'upcoming' && (
              <div className="text-right">
                <div className="text-octagon-600 text-xs uppercase tracking-widest mb-1">Deadline pronostics</div>
                <div className={`font-mono text-sm ${isOpen ? 'text-gold-400' : 'text-red-400'}`}>
                  {format(new Date(event.prediction_deadline), "d MMM yyyy à HH'h'mm", { locale: fr })}
                </div>
                <div className="mt-1">
                  {isOpen ? <span className="badge-green">Pronostics ouverts</span> : <span className="badge-red">Fermé</span>}
                </div>
              </div>
            )}
            {isCompleted && <span className="badge-gray">Événement terminé</span>}
          </div>
        </div>
      </div>

      {/* League selector */}
      {isOpen && (
        <LeagueSelector leagues={userLeagues ?? []} currentLeague={searchParams.league} eventId={params.id} />
      )}

      {/* Fights */}
      <div className="space-y-4">
        {fights?.map((fight: any) => (
          <div key={fight.id} className={`card ${fight.is_main_event ? 'border-blood-500/50' : ''}`}>
            {fight.is_main_event && (
              <div className="badge-red mb-3 inline-flex">MAIN EVENT</div>
            )}
            <div className="flex items-center justify-between mb-4">
              <div className="text-octagon-600 text-xs uppercase tracking-widest">{fight.weight_class}</div>
              <div className="text-octagon-600 text-xs font-mono">{fight.scheduled_rounds} rounds</div>
            </div>

            {/* Fighters */}
            <div className="grid grid-cols-3 gap-4 items-center mb-6">
              <div className="text-left">
                <div className="font-display text-2xl tracking-wider">{fight.fighter1_name}</div>
                {fight.fighter1_record && (
                  <div className="text-octagon-600 text-xs font-mono mt-1">{fight.fighter1_record}</div>
                )}
              </div>
              <div className="text-center font-display text-2xl text-octagon-600">VS</div>
              <div className="text-right">
                <div className="font-display text-2xl tracking-wider">{fight.fighter2_name}</div>
                {fight.fighter2_record && (
                  <div className="text-octagon-600 text-xs font-mono mt-1">{fight.fighter2_record}</div>
                )}
              </div>
            </div>

            {/* Result (if completed) */}
            {isCompleted && fight.fight_results?.[0] && (
              <FightResultDisplay result={fight.fight_results[0]} fight={fight} />
            )}

            {/* Prediction form (if open and league selected) */}
            {isOpen && searchParams.league && (
              <PredictionForm
                fight={fight}
                leagueId={searchParams.league}
                userId={user!.id}
                existing={predictionMap[fight.id]}
              />
            )}

            {/* Show existing prediction if closed */}
            {!isOpen && predictionMap[fight.id] && (
              <ExistingPrediction prediction={predictionMap[fight.id]} fight={fight} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function LeagueSelector({ leagues, currentLeague, eventId }: { leagues: any[]; currentLeague?: string; eventId: string }) {
  if (leagues.length === 0) return (
    <div className="card border-octagon-600">
      <p className="text-octagon-600 text-sm">
        Tu n'es dans aucune ligue.{' '}
        <Link href="/leagues" className="text-blood-400 hover:text-blood-300">Rejoins une ligue</Link>
        {' '}pour pronostiquer.
      </p>
    </div>
  )

  return (
    <div className="card">
      <label className="label">Pronostiquer pour la ligue</label>
      <div className="flex flex-wrap gap-2">
        {leagues.map((m: any) => (
          <Link
            key={m.leagues.id}
            href={`/events/${eventId}?league=${m.leagues.id}`}
            className={`px-4 py-2 border text-sm font-semibold uppercase tracking-wider transition-all ${
              currentLeague === m.leagues.id
                ? 'border-blood-500 bg-blood-500/10 text-white'
                : 'border-octagon-600 text-octagon-600 hover:border-octagon-500 hover:text-white'
            }`}
          >
            {m.leagues.name}
          </Link>
        ))}
      </div>
    </div>
  )
}

function FightResultDisplay({ result, fight }: { result: any; fight: any }) {
  const winner = result.winner === 'fighter1' ? fight.fighter1_name : result.winner === 'fighter2' ? fight.fighter2_name : 'Match nul'
  return (
    <div className="bg-octagon-700 border border-octagon-600 p-4 mb-4">
      <div className="text-octagon-600 text-xs uppercase tracking-widest mb-2">Résultat officiel</div>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-display text-xl text-gold-400">{winner}</span>
        <span className="badge-gray">{result.method}</span>
        <span className="badge-gray">R{result.round}</span>
        {result.time && <span className="text-octagon-600 text-xs font-mono">{result.time}</span>}
      </div>
    </div>
  )
}

function ExistingPrediction({ prediction, fight }: { prediction: any; fight: any }) {
  const winner = prediction.predicted_winner === 'fighter1' ? fight.fighter1_name
    : prediction.predicted_winner === 'fighter2' ? fight.fighter2_name : 'Match nul'
  return (
    <div className="bg-octagon-700 border border-octagon-600 p-4">
      <div className="text-octagon-600 text-xs uppercase tracking-widest mb-2">Ton pronostic</div>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-semibold">{winner}</span>
        <span className="badge-gray">{prediction.predicted_method}</span>
        <span className="badge-gray">R{prediction.predicted_round}</span>
        {prediction.points_earned !== null && (
          <span className={`badge ${prediction.points_earned > 0 ? 'badge-gold' : 'badge-gray'}`}>
            {prediction.points_earned} pts
          </span>
        )}
      </div>
    </div>
  )
}
