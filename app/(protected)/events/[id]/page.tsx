import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import PredictionForm from '@/components/events/PredictionForm'
import FighterCard from '@/components/fighters/FighterCard'
import FighterFormBadge from '@/components/fighters/FighterFormBadge'
import { getLocale } from '@/lib/i18n/server'
import { translations } from '@/lib/i18n/translations'

export default async function EventDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const locale = getLocale()
  const t = translations[locale]
  const dateLocale = locale === 'fr' ? fr : enUS

  const { data: event } = await supabase
    .from('ufc_events')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!event) notFound()

  const { data: fights } = await supabase
    .from('fights')
    .select('*, fight_results(*), fighter1:fighter1_id(*, form), fighter2:fighter2_id(*, form)')
    .eq('event_id', params.id)
    .order('is_main_event', { ascending: false })
    .order('card_order', { ascending: false })

  const { data: existingPredictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', user!.id)
    .in('fight_id', (fights ?? []).map(f => f.id))

  const { data: userLeaguesRaw } = await supabase
    .from('league_members')
    .select('leagues(id, name)')
    .eq('user_id', user!.id)

  const userLeagues = (userLeaguesRaw ?? [])
    .map((m: any) => m.leagues)
    .filter(Boolean)

  const isOpen = event.status === 'upcoming' && new Date() < new Date(event.prediction_deadline)
  const isCompleted = event.status === 'completed'

  const predictionMap = Object.fromEntries(
    (existingPredictions ?? []).map(p => [p.fight_id, p])
  )

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Link href="/dashboard" className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">{t.nav.dashboard}</Link>
          <span className="text-white/20 text-xs">/</span>
          <Link href="/events" className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">{t.nav.events}</Link>
          <span className="text-white/20 text-xs">/</span>
          <span className="text-white/60 text-xs uppercase tracking-widest truncate max-w-[200px]">{event.name}</span>
        </div>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-5xl tracking-wider">{event.name}</h1>
            <p className="text-white/50 mt-2 tracking-wide">
              {format(new Date(event.date), locale === 'fr' ? "d MMMM yyyy — HH'h'mm" : "MMMM d, yyyy — h:mm a", { locale: dateLocale })} · {event.location}
            </p>
          </div>
          <div>
            {event.status === 'upcoming' && (
              <div className="text-right">
                <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Deadline pronostics</div>
                <div className={`font-mono text-sm ${isOpen ? 'text-gold-400' : 'text-red-400'}`}>
                  {format(new Date(event.prediction_deadline), "d MMM yyyy à HH'h'mm", { locale: fr })}
                </div>
                <div className="mt-1">
                  {isOpen ? (
                    <span className="badge-green">{locale === 'fr' ? 'Pronostics ouverts' : 'Predictions open'}</span>
                  ) : (
                    <span className="badge-red">{locale === 'fr' ? 'Fermé' : 'Locked'}</span>
                  )}
                </div>
              </div>
            )}
            {isCompleted && <span className="badge-gray">{locale === 'fr' ? 'Événement terminé' : 'Event completed'}</span>}
          </div>
        </div>
      </div>

      {/* Info ligues si ouvert */}
      {isOpen && userLeagues.length > 0 && (
        <div className="card border-octagon-600">
          <p className="text-white/50 text-sm tracking-wide">
            {locale === 'fr' ? (
              <>Ton pronostic sera automatiquement enregistré dans{' '}
              <span className="text-white font-semibold">{userLeagues.length} ligue{userLeagues.length > 1 ? 's' : ''}</span>
              {' '}: {userLeagues.map((l: any) => l.name).join(', ')}</>
            ) : (
              <>Your prediction will automatically be saved in{' '}
              <span className="text-white font-semibold">{userLeagues.length} league{userLeagues.length > 1 ? 's' : ''}</span>
              {' '}: {userLeagues.map((l: any) => l.name).join(', ')}</>
            )}
          </p>
        </div>
      )}

      {isOpen && userLeagues.length === 0 && (
        <div className="card border-octagon-600">
          <p className="text-white/50 text-sm tracking-wide">
            {locale === 'fr' ? (
              <>Tu n'es dans aucune ligue.{' '}
              <Link href="/leagues" className="text-blood-400 hover:text-blood-300">Rejoins une ligue</Link>
              {' '}pour que ton score soit comptabilisé.</>
            ) : (
              <>You're not in any league.{' '}
              <Link href="/leagues" className="text-blood-400 hover:text-blood-300">Join a league</Link>
              {' '}to have your score counted.</>
            )}
          </p>
        </div>
      )}

      {/* Fights */}
      <div className="space-y-4">
        {fights?.map((fight: any) => {
          const hasFighterData = fight.fighter1 || fight.fighter2
          return (
          <div key={fight.id} className={`card ${fight.is_main_event ? 'border-blood-500/50' : ''}`}>
            {fight.is_main_event && (
              <div className="badge-red mb-3 inline-flex">MAIN EVENT</div>
            )}
            <div className="flex items-center justify-between mb-4">
              <div className="text-white/40 text-xs uppercase tracking-widest">{fight.weight_class}</div>
              <div className="text-white/40 text-xs font-mono">{fight.scheduled_rounds} rounds</div>
            </div>

            {/* Fighters — version enrichie si données disponibles */}
            {hasFighterData ? (
              <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-end mb-6">
                <FighterCard
                  fighter={fight.fighter1 ?? { id: '', name: fight.fighter1_name, wins: 0, losses: 0, draws: 0, wins_ko: 0, wins_sub: 0, wins_dec: 0, is_champion: false }}
                  record={fight.fighter1_record}
                  side="left"
                />
                <div className="text-center pb-6">
                  <div className="font-display text-3xl text-white/20">VS</div>
                </div>
                <FighterCard
                  fighter={fight.fighter2 ?? { id: '', name: fight.fighter2_name, wins: 0, losses: 0, draws: 0, wins_ko: 0, wins_sub: 0, wins_dec: 0, is_champion: false }}
                  record={fight.fighter2_record}
                  side="right"
                />
              </div>
            ) : (
              /* Version simple sans données fighter */
              <div className="grid grid-cols-3 gap-4 items-center mb-6">
                <div className="text-left">
                  <div className="font-display text-2xl tracking-wider">{fight.fighter1_name}</div>
                  {fight.fighter1_record && (
                    <div className="text-white/40 text-xs font-mono mt-1">{fight.fighter1_record}</div>
                  )}
                </div>
                <div className="text-center font-display text-2xl text-white/30">VS</div>
                <div className="text-right">
                  <div className="font-display text-2xl tracking-wider">{fight.fighter2_name}</div>
                  {fight.fighter2_record && (
                    <div className="text-white/40 text-xs font-mono mt-1">{fight.fighter2_record}</div>
                  )}
                </div>
              </div>
            )}

            {/* Formulaire de pronostic */}
            {isOpen && (
              <PredictionForm
                fight={fight}
                userId={user!.id}
                userLeagues={userLeagues}
                existing={predictionMap[fight.id]}
                locale={locale}
              />
            )}

            {/* Event terminé : résultat + prono côte à côte */}
            {isCompleted && (
              <CompletedFightDisplay
                result={fight.fight_results?.[0]}
                prediction={predictionMap[fight.id]}
                fight={fight}
                locale={locale}
              />
            )}

            {/* Pronostic existant si event fermé mais pas terminé */}
            {!isOpen && !isCompleted && predictionMap[fight.id] && (
              <ExistingPrediction prediction={predictionMap[fight.id]} fight={fight} locale={locale} />
            )}
          </div>
          )
        })}
      </div>
    </div>
  )
}

function CompletedFightDisplay({ result, prediction, fight, locale }: { result: any; prediction: any; fight: any; locale: string }) {
  const draw = locale === 'fr' ? 'Match nul' : 'Draw'
  const resultWinner = result?.winner === 'fighter1' ? fight.fighter1_name
    : result?.winner === 'fighter2' ? fight.fighter2_name
    : result?.winner === 'draw' ? draw : 'NC'

  const predWinner = prediction?.predicted_winner === 'fighter1' ? fight.fighter1_name
    : prediction?.predicted_winner === 'fighter2' ? fight.fighter2_name : draw

  const points = prediction?.points_earned
  const isDecisionOrDraw = prediction?.predicted_method === 'Decision' || prediction?.predicted_winner === 'draw'

  return (
    <div className="border-t border-octagon-700 pt-4 mt-2">
      <div className="grid grid-cols-2 gap-3">
        {/* Résultat officiel */}
        <div className="bg-octagon-700 border border-octagon-600 p-4">
          <div className="text-white/40 text-xs uppercase tracking-widest mb-3">
            {locale === 'fr' ? 'Résultat officiel' : 'Official result'}
          </div>
          {result ? (
            <div className="space-y-1">
              <div className="font-display text-lg text-gold-400 tracking-wider">{resultWinner}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="badge-gray">{result.method}</span>
                <span className="badge-gray">R{result.round}</span>
                {result.time && <span className="text-white/40 text-xs font-mono self-center">{result.time}</span>}
              </div>
            </div>
          ) : (
            <span className="text-white/30 text-sm">{locale === 'fr' ? 'Pas encore saisi' : 'Not entered yet'}</span>
          )}
        </div>

        {/* Ton pronostic */}
        <div className={`p-4 border ${
          points === 30 ? 'bg-yellow-950/20 border-gold-500' :
          points > 0 ? 'bg-octagon-700 border-octagon-600' :
          'bg-octagon-700 border-octagon-600'
        }`}>
          <div className="text-white/40 text-xs uppercase tracking-widest mb-3">
            {locale === 'fr' ? 'Ton pronostic' : 'Your pick'}
          </div>
          {prediction ? (
            <div className="space-y-1">
              <div className="font-display text-lg tracking-wider">{predWinner}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="badge-gray">{prediction.predicted_method}</span>
                {!isDecisionOrDraw && (
                  <span className="badge-gray">R{prediction.predicted_round}</span>
                )}
              </div>
              {points !== null && points !== undefined && (
                <div className="mt-3">
                  <span className={`badge ${
                    points === 30 ? 'badge-gold' :
                    points > 0 ? 'badge-green' :
                    'badge-gray'
                  }`}>
                    {points === 30 ? '★ ' : ''}{points} pts
                  </span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-white/30 text-sm">{locale === 'fr' ? 'Pas de pronostic' : 'No prediction'}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function ExistingPrediction({ prediction, fight, locale }: { prediction: any; fight: any; locale: string }) {
  const draw = locale === 'fr' ? 'Match nul' : 'Draw'
  const winner = prediction.predicted_winner === 'fighter1' ? fight.fighter1_name
    : prediction.predicted_winner === 'fighter2' ? fight.fighter2_name : draw
  const isDecisionOrDraw = prediction.predicted_method === 'Decision' || prediction.predicted_winner === 'draw'
  return (
    <div className="bg-octagon-700 border border-octagon-600 p-4 border-t border-octagon-700 mt-2">
      <div className="text-white/40 text-xs uppercase tracking-widest mb-2">
        {locale === 'fr' ? 'Ton pronostic' : 'Your pick'}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-semibold">{winner}</span>
        <span className="badge-gray">{prediction.predicted_method}</span>
        {!isDecisionOrDraw && <span className="badge-gray">R{prediction.predicted_round}</span>}
      </div>
    </div>
  )
}
