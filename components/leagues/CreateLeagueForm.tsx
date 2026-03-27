'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generateInviteCode } from '@/lib/utils'

export default function CreateLeagueForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const invite_code = generateInviteCode()

    const { data: league, error: leagueErr } = await supabase
      .from('leagues')
      .insert({ name: name.trim(), description: description.trim() || null, owner_id: userId, invite_code })
      .select()
      .single()

    if (leagueErr || !league) {
      setError('Erreur lors de la création')
      setLoading(false)
      return
    }

    await supabase.from('league_members').insert({ league_id: league.id, user_id: userId })
    router.refresh()
    setName('')
    setDescription('')
    setLoading(false)
  }

  return (
    <div className="card">
      <h2 className="font-display text-2xl tracking-wider mb-5">CRÉER UNE LIGUE</h2>
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="label">Nom de la ligue</label>
          <input className="input" placeholder="Les Prophètes de l'Octagon" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div>
          <label className="label">Description (optionnel)</label>
          <input className="input" placeholder="Une courte description..." value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
          {loading ? 'Création...' : 'Créer la ligue'}
        </button>
      </form>
    </div>
  )
}
