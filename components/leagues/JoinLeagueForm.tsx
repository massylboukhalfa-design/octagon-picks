'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function JoinLeagueForm({ userId }: { userId: string }) {
  const router = useRouter()
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
      .from('leagues')
      .select('id, name')
      .eq('invite_code', code.trim().toUpperCase())
      .single()

    if (!league) {
      setError('Code invalide — ligue introuvable')
      setLoading(false)
      return
    }

    const { error: joinErr } = await supabase
      .from('league_members')
      .insert({ league_id: league.id, user_id: userId })

    if (joinErr) {
      if (joinErr.code === '23505') setError('Tu es déjà membre de cette ligue')
      else setError('Erreur lors de la tentative de rejoindre')
      setLoading(false)
      return
    }

    setSuccess(`Tu as rejoint "${league.name}" !`)
    setCode('')
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="card">
      <h2 className="font-display text-2xl tracking-wider mb-5">REJOINDRE UNE LIGUE</h2>
      <form onSubmit={handleJoin} className="space-y-4">
        <div>
          <label className="label">Code d'invitation</label>
          <input
            className="input font-mono uppercase tracking-[0.3em] text-gold-400"
            placeholder="EX: AB12CD"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            required
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-emerald-400 text-sm">{success}</p>}
        <button type="submit" disabled={loading} className="btn-secondary w-full disabled:opacity-50">
          {loading ? 'Vérification...' : 'Rejoindre'}
        </button>
      </form>
    </div>
  )
}
