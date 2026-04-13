'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'

type Event = { id: string; name: string; date: string; location: string }

type Props = {
  leagueId: string
  userId: string
  events: Event[]
  locale?: string
}

export default function CreateDraftSeasonForm({ leagueId, userId, events, locale = 'fr' }: Props) {
  const router = useRouter()
  const isFr = locale === 'fr'
  const dateLocale = isFr ? fr : enUS

  const [name, setName] = useState('')
  const [seasonStart, setSeasonStart] = useState('')
  const [seasonEnd, setSeasonEnd] = useState('')
  const [hoursPerPick, setHoursPerPick] = useState(24)
  const [totalRounds, setTotalRounds] = useState(1)
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleEvent = (id: string) => {
    setSelectedEventIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    if (!name.trim()) { setError(isFr ? 'Nom requis' : 'Name required'); return }
    if (selectedEventIds.size === 0) { setError(isFr ? 'Sélectionne au moins un event' : 'Select at least one event'); return }

    setLoading(true); setError('')
    const supabase = createClient()

    // Créer la saison
    const { data: season, error: seasonErr } = await supabase
      .from('draft_seasons')
      .insert({
        league_id: leagueId,
        name: name.trim(),
        status: 'upcoming',
        draft_order: 'snake',
        hours_per_pick: hoursPerPick,
        total_rounds: totalRounds,
        season_start: seasonStart || null,
        season_end: seasonEnd || null,
        created_by: userId,
      })
      .select().single()

    if (seasonErr || !season) {
      setError(seasonErr?.message ?? 'Error')
      setLoading(false); return
    }

    // Lier les events
    const { error: evErr } = await supabase
      .from('draft_season_events')
      .insert(Array.from(selectedEventIds).map(event_id => ({ season_id: season.id, event_id })))

    if (evErr) {
      setError(evErr.message)
      setLoading(false); return
    }

    router.push(`/leagues/${leagueId}/draft/${season.id}`)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Nom */}
      <div className="card space-y-4">
        <h2 className="font-display text-xl tracking-wider">
          {isFr ? 'INFORMATIONS' : 'DETAILS'}
        </h2>
        <div>
          <label className="label">{isFr ? 'Nom de la saison' : 'Season name'}</label>
          <input className="input" placeholder={isFr ? 'Saison 1 — Printemps 2026' : 'Season 1 — Spring 2026'}
            value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">{isFr ? 'Début de saison' : 'Season start'}</label>
            <input type="date" className="input" value={seasonStart} onChange={e => setSeasonStart(e.target.value)} />
          </div>
          <div>
            <label className="label">{isFr ? 'Fin de saison' : 'Season end'}</label>
            <input type="date" className="input" value={seasonEnd} onChange={e => setSeasonEnd(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">
            {isFr ? 'Nombre de rounds de draft' : 'Number of draft rounds'}
          </label>
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5].map(r => (
              <button key={r} type="button" onClick={() => setTotalRounds(r)}
                className={`py-1.5 px-4 border text-sm font-mono transition-all ${
                  totalRounds === r
                    ? 'border-blood-500 bg-blood-500/10 text-white'
                    : 'border-octagon-600 text-white/40 hover:text-white'
                }`}>
                {r}
              </button>
            ))}
          </div>
          <p className="text-white/30 text-xs mt-2">
            {isFr
              ? `Chaque joueur picke ${totalRounds} fois — ${totalRounds} × (1 ME + 2 UC) fighters par joueur.`
              : `Each player picks ${totalRounds} time(s) — ${totalRounds} × (1 ME + 2 UC) fighters per player.`}
          </p>
        </div>
        <div>
          <label className="label">
            {isFr ? 'Heures par tour de draft' : 'Hours per draft pick'}
          </label>
          <div className="flex gap-2 flex-wrap">
            {[12, 24, 48, 72].map(h => (
              <button key={h} type="button" onClick={() => setHoursPerPick(h)}
                className={`py-1.5 px-4 border text-sm font-mono transition-all ${
                  hoursPerPick === h
                    ? 'border-blood-500 bg-blood-500/10 text-white'
                    : 'border-octagon-600 text-white/40 hover:text-white'
                }`}>
                {h}h
              </button>
            ))}
          </div>
          <p className="text-white/30 text-xs mt-2">
            {isFr
              ? `Chaque joueur a ${hoursPerPick}h pour faire ses picks quand c'est son tour.`
              : `Each player has ${hoursPerPick}h to make their picks when it's their turn.`}
          </p>
        </div>
      </div>

      {/* Sélection des events */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl tracking-wider">
            {isFr ? 'EVENTS DE LA SAISON' : 'SEASON EVENTS'}
          </h2>
          <span className="text-white/40 text-xs font-mono">
            {selectedEventIds.size} {isFr ? 'sélectionné(s)' : 'selected'}
          </span>
        </div>

        {events.length === 0 ? (
          <p className="text-white/40 text-sm">
            {isFr ? 'Aucun event upcoming disponible.' : 'No upcoming events available.'}
          </p>
        ) : (
          <div className="space-y-2">
            {events.map(event => {
              const selected = selectedEventIds.has(event.id)
              return (
                <button key={event.id} type="button" onClick={() => toggleEvent(event.id)}
                  className={`w-full flex items-center justify-between p-3 border transition-all text-left ${
                    selected
                      ? 'border-blood-500 bg-blood-500/10'
                      : 'border-octagon-600 bg-octagon-700 hover:border-octagon-500'
                  }`}>
                  <div>
                    <div className="font-semibold text-sm">{event.name}</div>
                    <div className="text-white/40 text-xs mt-0.5">
                      {format(new Date(event.date), isFr ? 'd MMM yyyy' : 'MMM d, yyyy', { locale: dateLocale })}
                      {' · '}{event.location}
                    </div>
                  </div>
                  <div className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 ${
                    selected ? 'border-blood-500 bg-blood-500' : 'border-octagon-500'
                  }`}>
                    {selected && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Règles rappel */}
      <div className="card border-octagon-600 space-y-2">
        <h3 className="font-display text-sm tracking-wider text-white/60">
          {isFr ? 'RÈGLES DU DRAFT' : 'DRAFT RULES'}
        </h3>
        <div className="text-white/40 text-xs space-y-1">
          <p>🥊 {isFr ? '1 fighter du main event par tour' : '1 main event fighter per pick'}</p>
          <p>⚔️ {isFr ? '2 fighters de l\'undercard par tour' : '2 undercard fighters per pick'}</p>
          <p>🐍 {isFr ? 'Ordre snake (1-2-3-3-2-1...)' : 'Snake order (1-2-3-3-2-1...)'}</p>
          <p>🔄 {isFr ? `${totalRounds} round(s) de draft` : `${totalRounds} draft round(s)`}</p>
          <p>⏱️ {isFr ? `${hoursPerPick}h par joueur pour picker` : `${hoursPerPick}h per player to pick`}</p>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button onClick={handleSubmit} disabled={loading} className="btn-gold w-full py-4 text-base disabled:opacity-50">
        {loading
          ? (isFr ? 'Création...' : 'Creating...')
          : (isFr ? 'Créer la saison' : 'Create season')}
      </button>
    </div>
  )
}
