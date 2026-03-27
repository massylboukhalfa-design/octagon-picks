'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FIGHT_METHODS, FightMethod } from '@/types'

type FightResult = {
  winner: 'fighter1' | 'fighter2' | 'draw' | 'nc'
  method: FightMethod | ''
  round: number
  time: string
}

export default function ResultsForm({ eventId, fights }: { eventId: string; fights: any[] }) {
  const router = useRouter()
  const [results, setResults] = useState<Record<string, FightResult>>(
    Object.fromEntries(fights.map(f => [
      f.id,
      f.fight_results?.[0]
        ? { winner: f.fight_results[0].winner, method: f.fight_results[0].method, round: f.fight_results[0].round, time: f.fight_results[0].time ?? '' }
        : { winner: '', method: '', round: 1, time: '' }
    ]))
  )
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const update = (fightId: string, field: keyof FightResult, value: any) => {
    setResults(prev => ({ ...prev, [fightId]: { ...prev[fightId], [field]: value } }))
  }

  const handleSave = async () => {
    setLoading(true)
    const supabase = createClient()

    for (const fight of fights) {
      const r = results[fight.id]
      if (!r.winner || !r.method || !r.round) continue

      if (fight.fight_results?.[0]) {
        await supabase.from('fight_results').update({
          winner: r.winner, method: r.method, round: r.round, time: r.time || null
        }).eq('id', fight.fight_results[0].id)
      } else {
        await supabase.from('fight_results').insert({
          fight_id: fight.id, winner: r.winner, method: r.method, round: r.round, time: r.time || null
        })
      }
    }

    // Mark event as completed
    await supabase.from('ufc_events').update({ status: 'completed' }).eq('id', eventId)

    // Trigger points calculation via API route
    await fetch('/api/calculate-points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId }),
    })

    setSaved(true)
    setLoading(false)
    setTimeout(() => router.push(`/events/${eventId}`), 1500)
  }

  return (
    <div className="space-y-4">
      {fights.map((fight: any) => {
        const r = results[fight.id]
        const rounds = Array.from({ length: fight.scheduled_rounds }, (_, i) => i + 1)
        return (
          <div key={fight.id} className={`card ${fight.is_main_event ? 'border-blood-500/50' : ''}`}>
            {fight.is_main_event && <div className="badge-red mb-3 inline-flex">MAIN EVENT</div>}
            <div className="font-display text-xl tracking-wider mb-4">
              {fight.fighter1_name} <span className="text-octagon-600">vs</span> {fight.fighter2_name}
            </div>

            <div className="space-y-4">
              {/* Winner */}
              <div>
                <label className="label">Vainqueur</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { v: 'fighter1', label: fight.fighter1_name },
                    { v: 'fighter2', label: fight.fighter2_name },
                    { v: 'draw', label: 'Draw' },
                    { v: 'nc', label: 'NC' },
                  ].map(opt => (
                    <button key={opt.v} type="button"
                      onClick={() => update(fight.id, 'winner', opt.v)}
                      className={`py-2 text-sm border font-semibold transition-all ${
                        r.winner === opt.v ? 'border-blood-500 bg-blood-500/10 text-white' : 'border-octagon-600 text-octagon-600 hover:border-octagon-500 hover:text-white'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Method */}
                <div>
                  <label className="label">Méthode</label>
                  <div className="flex flex-wrap gap-2">
                    {FIGHT_METHODS.map(m => (
                      <button key={m} type="button"
                        onClick={() => update(fight.id, 'method', m)}
                        className={`py-1 px-2 border text-xs font-mono transition-all ${
                          r.method === m ? 'border-gold-500 text-gold-400 bg-yellow-950/30' : 'border-octagon-600 text-octagon-600 hover:text-white'
                        }`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Round */}
                <div>
                  <label className="label">Round</label>
                  <div className="flex gap-2">
                    {rounds.map(rnd => (
                      <button key={rnd} type="button"
                        onClick={() => update(fight.id, 'round', rnd)}
                        className={`w-9 h-9 border font-display text-lg transition-all ${
                          r.round === rnd ? 'border-blood-500 bg-blood-500/10 text-white' : 'border-octagon-600 text-octagon-600 hover:text-white'
                        }`}>
                        {rnd}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Time */}
              <div>
                <label className="label">Temps (optionnel)</label>
                <input className="input w-32" placeholder="4:32" value={r.time}
                  onChange={e => update(fight.id, 'time', e.target.value)} />
              </div>
            </div>
          </div>
        )
      })}

      <button
        onClick={handleSave}
        disabled={loading}
        className={`${saved ? 'btn-secondary border-emerald-700 text-emerald-400' : 'btn-gold'} w-full py-4 text-base disabled:opacity-50`}
      >
        {loading ? 'Sauvegarde...' : saved ? '✓ Résultats enregistrés — calcul des points...' : 'Valider les résultats & calculer les points'}
      </button>
    </div>
  )
}
