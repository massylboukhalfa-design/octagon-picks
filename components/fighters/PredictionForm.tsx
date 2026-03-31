'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FIGHT_METHODS, FightMethod } from '@/types'
import FighterFormBadge from '@/components/fighters/FighterForm'

type Props = {
  fight: any
  userId: string
  userLeagues: { id: string; name: string }[]
  existing?: any
}

export default function PredictionForm({ fight, userId, userLeagues, existing }: Props) {
  const [winner, setWinner] = useState<'fighter1' | 'fighter2' | 'draw' | ''>(existing?.predicted_winner ?? '')
  const [method, setMethod] = useState<FightMethod | ''>(existing?.predicted_method ?? '')
  const [round, setRound] = useState<number>(existing?.predicted_round ?? 0)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const isDecision = method === 'Decision'
  const isDraw = winner === 'draw'
  const isAutoRound = isDecision || isDraw
  const rounds = Array.from({ length: fight.scheduled_rounds }, (_, i) => i + 1)
  const effectiveRound = isAutoRound ? fight.scheduled_rounds : round

  const handleMethodChange = (m: FightMethod) => {
    setMethod(m)
    if (m === 'Decision') setRound(0)
  }

  const handleWinnerChange = (w: 'fighter1' | 'fighter2' | 'draw') => {
    setWinner(w)
    if (w === 'draw') {
      setMethod('Decision')
      setRound(0)
    }
  }

  const handleSave = async () => {
    if (!winner || !method) {
      setError('Complète tous les champs')
      return
    }
    if (!isAutoRound && !round) {
      setError('Choisis un round')
      return
    }

    setLoading(true)
    setError('')
    setSaved(false)

    const supabase = createClient()

    const predictionData = {
      predicted_winner: winner,
      predicted_method: method,
      predicted_round: effectiveRound,
    }

    if (existing) {
      // Mise à jour du prono existant — les league_predictions restent inchangées
      const { error: updateErr } = await supabase
        .from('predictions')
        .update(predictionData)
        .eq('id', existing.id)

      if (updateErr) {
        setError('Erreur lors de la mise à jour')
        setLoading(false)
        return
      }
    } else {
      // 1. Insérer le prono unique
      const { data: pred, error: insertErr } = await supabase
        .from('predictions')
        .insert({ user_id: userId, fight_id: fight.id, ...predictionData })
        .select()
        .single()

      if (insertErr || !pred) {
        setError('Erreur lors de l\'enregistrement')
        setLoading(false)
        return
      }

      // 2. Associer le prono à toutes les ligues de l'utilisateur
      if (userLeagues.length > 0) {
        const leagueLinks = userLeagues.map(league => ({
          prediction_id: pred.id,
          league_id: league.id,
        }))

        const { error: linkErr } = await supabase
          .from('league_predictions')
          .insert(leagueLinks)

        if (linkErr) {
          setError('Prono enregistré mais erreur de liaison aux ligues')
          setLoading(false)
          return
        }
      }
    }

    setSaved(true)
    setLoading(false)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="border-t border-octagon-700 pt-4 mt-2">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs uppercase tracking-widest text-white/40">
          {existing ? 'Modifier ton pronostic' : 'Ton pronostic'}
        </div>
        {userLeagues.length > 0 && !existing && (
          <div className="text-xs text-white/30">
            Valable dans {userLeagues.length} ligue{userLeagues.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Winner */}
      <div className="mb-4">
        <label className="label">Vainqueur</label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'fighter1', label: fight.fighter1_name, form: fight.fighter1?.form ?? fight.fighter1_form },
            { value: 'fighter2', label: fight.fighter2_name, form: fight.fighter2?.form ?? fight.fighter2_form },
            { value: 'draw', label: 'Match nul', form: null },
          ] as const).map(opt => (
            <button
              key={opt.value}
              onClick={() => handleWinnerChange(opt.value)}
              className={`py-2 px-3 border text-sm font-semibold tracking-wide transition-all text-center ${
                winner === opt.value
                  ? 'border-blood-500 bg-blood-500/10 text-white'
                  : 'border-octagon-600 text-white/40 hover:border-octagon-500 hover:text-white'
              }`}
            >
              <div className="truncate">{opt.label}</div>
              {opt.form && opt.form.length > 0 && (
                <div className={`flex justify-center mt-1.5 ${winner === opt.value ? 'opacity-100' : 'opacity-60'}`}>
                  <FighterFormBadge form={opt.form} size="sm" />
                </div>
              )}
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
              onClick={() => handleMethodChange(m)}
              className={`py-1.5 px-3 border text-sm font-mono tracking-wider transition-all ${
                method === m
                  ? 'border-gold-500 bg-yellow-950/30 text-gold-400'
                  : 'border-octagon-600 text-white/40 hover:border-octagon-500 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Round — masqué si Decision ou Match nul */}
      {!isAutoRound ? (
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
                    : 'border-octagon-600 text-white/40 hover:border-octagon-500 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-5 px-3 py-2 bg-octagon-700 border border-octagon-600 inline-flex items-center gap-2">
          <span className="text-white/40 text-xs uppercase tracking-widest">Round</span>
          <span className="text-white/60 text-sm font-mono">
            R{fight.scheduled_rounds} — automatique
            {isDraw ? ' (match nul)' : ' (décision)'}
          </span>
        </div>
      )}

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
