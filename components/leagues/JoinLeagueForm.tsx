'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function useLocale() {
  if (typeof document === 'undefined') return 'fr'
  return document.cookie.match(/locale=(\w+)/)?.[1] ?? (navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en')
}

export default function JoinLeagueForm({ userId }: { userId: string }) {
  const router = useRouter()
  const locale = useLocale()
  const fr = locale === 'fr'
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError('')
    setSuccess('')

    const supabase = createClient()
    const { data: league } = await supabase
      .from('leagues').select('id, name')
      .eq('invite_code', code.trim().toUpperCase()).single()

    if (!league) {
      setError(fr ? 'Code invalide — ligue introuvable' : 'Invalid code — league not found')
      setLoading(false)
      return
    }

    const { error: joinErr } = await supabase
      .from('league_members').insert({ league_id: league.id, user_id: userId })

    if (joinErr) {
      if (joinErr.code === '23505')
        setError(fr ? 'Tu es déjà membre de cette ligue' : 'You are already a member of this league')
      else
        setError(fr ? 'Erreur lors de la tentative de rejoindre' : 'Error joining league')
      setLoading(false)
      return
    }

    setSuccess(fr ? `Tu as rejoint "${league.name}" !` : `You joined "${league.name}"!`)
    setCode('')
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="card">
      <h2 className="font-display text-2xl tracking-wider mb-5">
        {fr ? 'REJOINDRE UNE LIGUE' : 'JOIN A LEAGUE'}
      </h2>
      <form onSubmit={handleJoin} className="space-y-4">
        <div>
          <label className="label">{fr ? "Code d'invitation" : 'Invite code'}</label>
          <input
            className="input font-mono uppercase tracking-[0.3em] text-gold-400"
            placeholder="AB12CD"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            required
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-emerald-400 text-sm">{success}</p>}
        <button type="submit" disabled={loading} className="btn-secondary w-full disabled:opacity-50">
          {loading ? (fr ? 'Vérification...' : 'Checking...') : (fr ? 'Rejoindre' : 'Join')}
        </button>
      </form>
    </div>
  )
}
