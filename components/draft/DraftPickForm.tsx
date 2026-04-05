'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Fighter = {
  id: string; name: string; photo_url?: string
  country_flag?: string; wins: number; losses: number; draws: number; is_champion: boolean
}

type Fight = {
  id: string; fighter1_name: string; fighter2_name: string
  is_main_event: boolean; weight_class: string; scheduled_rounds: number
  fighter1_available: boolean; fighter2_available: boolean
  fighter1: Fighter | null; fighter2: Fighter | null
}

type EventWithFights = {
  id: string; name: string; date: string
  fights: Fight[]
}

type PickedFighter = {
  fighter_id: string; fight_id: string; slot_type: 'main_event' | 'undercard'; fighter_name: string
}

type Props = {
  seasonId: string
  userId: string
  eventsWithFights: EventWithFights[]
  picksNeeded: { main_event: number; undercard: number }
  locale?: string
}

export default function DraftPickForm({ seasonId, userId, eventsWithFights, picksNeeded, locale = 'fr' }: Props) {
  const router = useRouter()
  const isFr = locale === 'fr'
  const [picks, setPicks] = useState<PickedFighter[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const mainEventPicks = picks.filter(p => p.slot_type === 'main_event')
  const undercardPicks = picks.filter(p => p.slot_type === 'undercard')
  const mainEventDone = mainEventPicks.length >= picksNeeded.main_event
  const undercardDone = undercardPicks.length >= picksNeeded.undercard
  const allDone = mainEventDone && undercardDone

  const isPicked = (fighterId: string) => picks.some(p => p.fighter_id === fighterId)

  const togglePick = (fighter: Fighter, fight: Fight, slotType: 'main_event' | 'undercard') => {
    if (isPicked(fighter.id)) {
      setPicks(prev => prev.filter(p => p.fighter_id !== fighter.id))
      return
    }

    // Vérifier si le slot est plein
    const slotsForType = picks.filter(p => p.slot_type === slotType).length
    const maxForType = slotType === 'main_event' ? picksNeeded.main_event : picksNeeded.undercard
    if (slotsForType >= maxForType) {
      setError(isFr
        ? `Tu as déjà ${maxForType} pick(s) ${slotType === 'main_event' ? 'main event' : 'undercard'}`
        : `You already have ${maxForType} ${slotType === 'main_event' ? 'main event' : 'undercard'} pick(s)`)
      return
    }

    setError('')
    setPicks(prev => [...prev, {
      fighter_id: fighter.id,
      fight_id: fight.id,
      slot_type: slotType,
      fighter_name: fighter.name,
    }])
  }

  const handleSubmit = async () => {
    if (!allDone) {
      setError(isFr ? 'Tu dois compléter tous tes picks' : 'You must complete all your picks')
      return
    }
    setLoading(true); setError('')

    const res = await fetch('/api/draft-pick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seasonId, picks: picks.map(({ fighter_name, ...p }) => p) }),
    })
    const data = await res.json()

    if (data.error) {
      setError(data.error)
      setLoading(false)
    } else {
      router.refresh()
      router.back()
    }
  }

  return (
    <div className="space-y-6">
      {/* Récapitulatif picks en cours */}
      <div className="card border-octagon-600 space-y-3">
        <h2 className="font-display text-xl tracking-wider">
          {isFr ? 'TES PICKS' : 'YOUR PICKS'}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-white/40 text-xs uppercase tracking-widest mb-2">
              Main Event ({mainEventPicks.length}/{picksNeeded.main_event})
            </div>
            {mainEventPicks.length === 0 ? (
              <div className="p-3 border border-dashed border-octagon-600 text-white/20 text-sm text-center">
                {isFr ? 'Sélectionner →' : 'Select →'}
              </div>
            ) : mainEventPicks.map(p => (
              <div key={p.fighter_id} className="p-2 bg-blood-500/10 border border-blood-500/50 text-sm font-semibold flex items-center justify-between">
                {p.fighter_name}
                <button onClick={() => setPicks(prev => prev.filter(x => x.fighter_id !== p.fighter_id))}
                  className="text-white/40 hover:text-white text-xs ml-2">✕</button>
              </div>
            ))}
          </div>
          <div>
            <div className="text-white/40 text-xs uppercase tracking-widest mb-2">
              Undercard ({undercardPicks.length}/{picksNeeded.undercard})
            </div>
            {undercardPicks.length === 0 ? (
              <div className="p-3 border border-dashed border-octagon-600 text-white/20 text-sm text-center">
                {isFr ? 'Sélectionner →' : 'Select →'}
              </div>
            ) : undercardPicks.map(p => (
              <div key={p.fighter_id} className="p-2 bg-octagon-700 border border-octagon-600 text-sm font-semibold flex items-center justify-between">
                {p.fighter_name}
                <button onClick={() => setPicks(prev => prev.filter(x => x.fighter_id !== p.fighter_id))}
                  className="text-white/40 hover:text-white text-xs ml-2">✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fighters disponibles par event */}
      {eventsWithFights.map(event => (
        <div key={event.id} className="card space-y-4">
          <h3 className="font-display text-xl tracking-wider text-blood-400">{event.name}</h3>
          <div className="space-y-3">
            {event.fights.map((fight: Fight) => {
              const slotType = fight.is_main_event ? 'main_event' : 'undercard'
              return (
                <div key={fight.id}>
                  <div className="flex items-center gap-2 mb-2">
                    {fight.is_main_event && <span className="badge-red text-xs">MAIN EVENT</span>}
                    <span className="text-white/30 text-xs">{fight.weight_class}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { fighter: fight.fighter1, available: fight.fighter1_available, name: fight.fighter1_name },
                      { fighter: fight.fighter2, available: fight.fighter2_available, name: fight.fighter2_name },
                    ].map(({ fighter, available, name }) => {
                      if (!available || !fighter) return (
                        <div key={name} className="p-3 border border-octagon-700 opacity-30 text-center text-sm">
                          {name}<br />
                          <span className="text-xs text-white/40">{isFr ? 'Déjà drafté' : 'Already drafted'}</span>
                        </div>
                      )

                      const picked = isPicked(fighter.id)
                      const slotFull = picks.filter(p => p.slot_type === slotType).length >= (slotType === 'main_event' ? picksNeeded.main_event : picksNeeded.undercard)

                      return (
                        <button key={fighter.id} type="button"
                          onClick={() => togglePick(fighter, fight, slotType)}
                          disabled={!picked && slotFull}
                          className={`p-3 border text-left transition-all disabled:opacity-40 ${
                            picked
                              ? 'border-blood-500 bg-blood-500/10'
                              : 'border-octagon-600 bg-octagon-700 hover:border-blood-500/50'
                          }`}>
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-octagon-600 flex-shrink-0">
                              {fighter.photo_url ? (
                                <img src={fighter.photo_url} alt={fighter.name} className="w-full h-full object-cover object-top" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="font-display text-sm text-white/20">{fighter.name.charAt(0)}</span>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm truncate">{fighter.name}</div>
                              <div className="text-white/40 text-xs font-mono">
                                {fighter.wins}-{fighter.losses}-{fighter.draws}
                              </div>
                            </div>
                            {picked && <span className="ml-auto text-blood-400 text-lg flex-shrink-0">✓</span>}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button onClick={handleSubmit} disabled={loading || !allDone}
        className="btn-gold w-full py-4 text-base disabled:opacity-50">
        {loading
          ? (isFr ? 'Envoi...' : 'Submitting...')
          : allDone
          ? (isFr ? '✓ Valider mes picks' : '✓ Submit my picks')
          : (isFr
              ? `Encore ${picksNeeded.main_event - mainEventPicks.length} main event + ${picksNeeded.undercard - undercardPicks.length} undercard à choisir`
              : `${picksNeeded.main_event - mainEventPicks.length} main event + ${picksNeeded.undercard - undercardPicks.length} undercard left`)}
      </button>
    </div>
  )
}
