'use client'

import { useState } from 'react'

type Props = {
  eventId: string
  fights: { id: string; fighter1_name: string; fighter2_name: string; fight_results?: any[] }[]
  locale?: string
}

export default function DraftPointsButton({ eventId, fights, locale = 'fr' }: Props) {
  const isFr = locale === 'fr'
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ fight: string; points: number; error?: string }[]>([])
  const [done, setDone] = useState(false)

  // Seulement les combats avec résultats
  const completedFights = fights.filter(f => f.fight_results && f.fight_results.length > 0)

  const handleCalculate = async () => {
    setLoading(true)
    setResults([])
    const outcomes: typeof results = []

    // Récupérer toutes les saisons draft actives liées à cet event
    const seasonsRes = await fetch(`/api/draft-seasons-for-event?eventId=${eventId}`)
    const seasonsData = await seasonsRes.json()
    const seasonIds: string[] = seasonsData.season_ids ?? []

    if (seasonIds.length === 0) {
      setResults([{ fight: 'Global', points: 0, error: isFr ? 'Aucune saison draft active pour cet event' : 'No active draft season for this event' }])
      setLoading(false)
      return
    }

    for (const fight of completedFights) {
      for (const seasonId of seasonIds) {
        const res = await fetch('/api/draft-points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seasonId, fightId: fight.id }),
        })
        const data = await res.json()
        outcomes.push({
          fight: `${fight.fighter1_name} vs ${fight.fighter2_name}`,
          points: data.points_awarded ?? 0,
          error: data.error,
        })
      }
    }

    setResults(outcomes)
    setDone(true)
    setLoading(false)
  }

  if (completedFights.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl tracking-wider">
            {isFr ? 'POINTS DRAFT' : 'DRAFT POINTS'}
          </h2>
          <p className="text-white/40 text-xs mt-1">
            {isFr
              ? `Calcule les points draft pour les ${completedFights.length} combat(s) avec résultat`
              : `Calculate draft points for ${completedFights.length} fight(s) with results`}
          </p>
        </div>
        <button
          onClick={handleCalculate}
          disabled={loading || done}
          className="btn-secondary text-sm py-2 px-4 disabled:opacity-50 flex items-center gap-2"
        >
          🏆 {loading
            ? (isFr ? 'Calcul...' : 'Calculating...')
            : done
            ? (isFr ? '✓ Calculé' : '✓ Done')
            : (isFr ? 'Calculer les points draft' : 'Calculate draft points')}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {results.map((r, i) => (
            <div key={i} className={`flex items-center justify-between text-xs p-2 ${
              r.error ? 'text-red-400' : 'text-white/60'
            }`}>
              <span className="truncate">{r.fight}</span>
              {r.error
                ? <span className="text-red-400 ml-2 flex-shrink-0">✗ {r.error}</span>
                : <span className="text-emerald-400 ml-2 flex-shrink-0">+{r.points} pts</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
