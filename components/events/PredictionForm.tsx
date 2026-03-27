'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FIGHT_METHODS, FightMethod } from '@/types'

type Props = {
  fight: any
  leagueId: string
  userId: string
  existing?: any
}

export default function PredictionForm({ fight, leagueId, userId, existing }: Props) {
  const [winner, setWinner] = useState<'fighter1' | 'fighter2' | 'draw'>(existing?.predicted_winner ?? '')
  const [method, setMethod] = useState<FightMethod>(existing?.predicted_method ?? '')
  const [round, setRound] = useState<number>(existing?.predicted_round ?? 0)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const rounds = Array.from({ length: fight.scheduled_rounds }, (_, i) => i + 1)

  const handleSave = async () => {
    if (!winner || !method || !round) {
      setError('Complète tous les champs')
      return
    }
    setLoading(true)
    setError('')
    setSaved(false)
    const supabase = createClient()

    const payload = {
      user_id: userId,
      fight_id: fight.id,
      league_id: leagueId,
      predicted_winner: winner,
      predicted_method: method,
      predicted_round: round,
    }

    if (existing) {
      await supabase.from('predictions').update(payload).eq('id', existing.id)
    } else {
      await supabase.from('predictions').insert(payload)
    }

    setSaved(true)
    setLoading(false)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="border-t border-octagon-700 pt-4 mt-2">
      <div className="text-xs uppercase tracking-widest text-octagon-600 mb-4">
        {existing ? 'Modifier ton pronostic' : 'Ton pronostic'}
      </div>

      {/* Winner */}
      <div className="mb-4">
        <label className="label">Vainqueur</label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'fighter1', label: fight.fighter1_name },
            { value: 'fighter2', label: fight.fighter2_name },
            { value: 'draw', label: 'Match nul' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              onClick={() => setWinner(opt.value)}
              className={`py-2 px-3 border text-sm font-semibold tracking-wide transition-all text-center ${
                winner === opt.value
                  ? 'border-blood-500 bg-blood-500/10 text-white'
                  : 'border-octagon-600 text-octagon-600 hover:border-octagon-500 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Method */}
      <div className="mb-4">
        <label className="label">Méthode</label>
        <div className="flex flex-wrap gap-2">
          {FIGHT_METHODS.map(m => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`py-1.5 px-3 border text-sm font-mono tracking-wider transition-all ${
                method === m
                  ? 'border-gold-500 bg-yellow-950/30 text-gold-400'
                  : 'border-octagon-600 text-octagon-600 hover:border-octagon-500 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Round */}
      <div className="mb-5">
        <label className="label">Round</label>
        <div className="flex gap-2">
          {rounds.map(r => (
            <button
              key={r}
              onClick={() => setRound(r)}
              className={`w-10 h-10 border font-display text-xl tracking-wide transition-all ${
                round === r
                  ? 'border-blood-500 bg-blood-500/10 text-white'
                  : 'border-octagon-600 text-octagon-600 hover:border-octagon-500 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <button
        onClick={handleSave}
        disabled={loading}
        className={`${saved ? 'btn-secondary border-emerald-700 text-emerald-400' : 'btn-primary'} disabled:opacity-50`}
      >
        {loading ? 'Enregistrement...' : saved ? '✓ Pronostic enregistré' : existing ? 'Modifier le pronostic' : 'Enregistrer le pronostic'}
      </button>
    </div>
  )
}
