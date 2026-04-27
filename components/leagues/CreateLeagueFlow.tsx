'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function useLocale() {
  if (typeof document === 'undefined') return 'fr'
  return document.cookie.match(/locale=(\w+)/)?.[1] ??
    (navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en')
}

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

type Mode = 'prono' | 'draft' | null

export default function CreateLeagueFlow({ userId }: { userId: string }) {
  const router = useRouter()
  const locale = useLocale()
  const fr = locale === 'fr'

  const [step, setStep] = useState<'pick-mode' | 'fill-form'>('pick-mode')
  const [mode, setMode] = useState<Mode>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!name.trim() || !mode) return
    setLoading(true); setError('')
    const supabase = createClient()
    const invite_code = generateCode()

    const { data: league, error: leagueErr } = await supabase
      .from('leagues')
      .insert({ name: name.trim(), description: description.trim() || null, owner_id: userId, invite_code, mode })
      .select().single()

    if (leagueErr || !league) {
      setError(fr ? 'Erreur lors de la création' : 'Error creating league')
      setLoading(false); return
    }

    await supabase.from('league_members').insert({ league_id: league.id, user_id: userId })
    router.push(`/leagues/${league.id}`)
    router.refresh()
  }

  // ── Step 1 : Choix du mode ────────────────────────────────
  if (step === 'pick-mode') {
    return (
      <div className="card space-y-6">
        <div>
          <h2 className="font-display text-2xl tracking-wider mb-1">
            {fr ? 'CRÉER UNE LIGUE' : 'CREATE A LEAGUE'}
          </h2>
          <p className="text-white/40 text-sm">
            {fr ? 'Choisis le mode de ta ligue — ce choix est définitif.' : 'Choose your league mode — this choice is permanent.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Mode Prono */}
          <button
            type="button"
            onClick={() => setMode('prono')}
            className={`relative text-left p-5 border-2 transition-all group ${
              mode === 'prono'
                ? 'border-blood-500 bg-blood-500/10'
                : 'border-octagon-600 bg-octagon-800 hover:border-blood-500/50'
            }`}
          >
            {mode === 'prono' && (
              <div className="absolute top-3 right-3 w-5 h-5 bg-blood-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            )}
            <div className="text-3xl mb-3">🎯</div>
            <div className="font-display text-xl tracking-wider mb-2">
              {fr ? 'PRONOSTICS' : 'PREDICTIONS'}
            </div>
            <p className="text-white/50 text-sm leading-relaxed">
              {fr
                ? 'Pronostique le gagnant, la méthode et le round de chaque combat. Accumule des points et grimpe au classement de ta ligue.'
                : 'Predict the winner, method and round of each fight. Earn points and climb your league leaderboard.'}
            </p>
            <div className="mt-4 space-y-1">
              {(fr
                ? ['✓ Jusqu\'à 30 pts par combat', '✓ Classement en temps réel', '✓ Ouvert à tous les events']
                : ['✓ Up to 30 pts per fight', '✓ Real-time leaderboard', '✓ Open to all events']
              ).map(item => (
                <div key={item} className="text-white/40 text-xs">{item}</div>
              ))}
            </div>
          </button>

          {/* Mode Draft */}
          <button
            type="button"
            onClick={() => setMode('draft')}
            className={`relative text-left p-5 border-2 transition-all group ${
              mode === 'draft'
                ? 'border-gold-500 bg-yellow-950/20'
                : 'border-octagon-600 bg-octagon-800 hover:border-gold-500/50'
            }`}
          >
            {mode === 'draft' && (
              <div className="absolute top-3 right-3 w-5 h-5 bg-gold-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            )}
            <div className="text-3xl mb-3">🏆</div>
            <div className="font-display text-xl tracking-wider mb-2">DRAFT</div>
            <p className="text-white/50 text-sm leading-relaxed">
              {fr
                ? 'Constitue ton équipe de fighters avant la saison. Marque des points selon leurs performances réelles sur les events inclus.'
                : 'Build your team of fighters before the season. Score points based on their real performance across included events.'}
            </p>
            <div className="mt-4 space-y-1">
              {(fr
                ? ['✓ Snake order asynchrone', '✓ Échanges entre joueurs', '✓ Points par clash direct']
                : ['✓ Async snake order draft', '✓ Trades between players', '✓ Points from direct clashes']
              ).map(item => (
                <div key={item} className="text-white/40 text-xs">{item}</div>
              ))}
            </div>
          </button>
        </div>

        <button
          onClick={() => setStep('fill-form')}
          disabled={!mode}
          className="btn-primary w-full py-3 disabled:opacity-40"
        >
          {fr ? 'Continuer →' : 'Continue →'}
        </button>
      </div>
    )
  }

  // ── Step 2 : Nom et description ───────────────────────────
  return (
    <div className="card space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <button onClick={() => setStep('pick-mode')}
          className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">
          {fr ? '← Mode' : '← Mode'}
        </button>
        <span className="text-white/20 text-xs">/</span>
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${
          mode === 'draft' ? 'text-gold-400' : 'text-blood-400'
        }`}>
          {mode === 'draft' ? '🏆 Draft' : '🎯 ' + (fr ? 'Pronostics' : 'Predictions')}
        </div>
      </div>

      <div>
        <h2 className="font-display text-2xl tracking-wider mb-1">
          {fr ? 'NOMMER TA LIGUE' : 'NAME YOUR LEAGUE'}
        </h2>
        <p className="text-white/40 text-sm">
          {mode === 'draft'
            ? (fr ? 'Ligue Draft — mode compétition saison.' : 'Draft league — season competition mode.')
            : (fr ? 'Ligue Pronostics — pronostique chaque event.' : 'Prediction league — predict every event.')}
        </p>
      </div>

      <div>
        <label className="label">{fr ? 'Nom de la ligue' : 'League name'}</label>
        <input className="input"
          placeholder={mode === 'draft'
            ? (fr ? 'Fantasy Octagon S1' : 'Fantasy Octagon S1')
            : (fr ? "Les Prophètes de l'Octagon" : 'The Octagon Prophets')}
          value={name} onChange={e => setName(e.target.value)} required />
      </div>

      <div>
        <label className="label">{fr ? 'Description (optionnel)' : 'Description (optional)'}</label>
        <input className="input"
          placeholder={fr ? 'Une courte description...' : 'A short description...'}
          value={description} onChange={e => setDescription(e.target.value)} />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        onClick={handleCreate}
        disabled={loading || !name.trim()}
        className={`w-full py-3 disabled:opacity-40 ${
          mode === 'draft' ? 'btn-gold' : 'btn-primary'
        }`}
      >
        {loading
          ? (fr ? 'Création...' : 'Creating...')
          : (fr ? 'Créer la ligue' : 'Create league')}
      </button>
    </div>
  )
}
