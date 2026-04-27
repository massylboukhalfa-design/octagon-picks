'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeleteLeagueButton({ leagueId, leagueName, locale = 'fr' }: {
  leagueId: string
  leagueName: string
  locale?: string
}) {
  const router = useRouter()
  const fr = locale === 'fr'
  const [step, setStep] = useState<'idle' | 'confirm'>('idle')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    setLoading(true); setError('')
    const supabase = createClient()

    // Supabase CASCADE supprime league_members, predictions liées etc.
    const { error: err } = await supabase.from('leagues').delete().eq('id', leagueId)

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    router.push('/leagues')
    router.refresh()
  }

  if (step === 'idle') {
    return (
      <button
        onClick={() => setStep('confirm')}
        className="text-xs text-red-500 hover:text-red-400 border border-red-800 hover:border-red-600 px-3 py-1.5 transition-all"
      >
        {fr ? 'Supprimer la ligue' : 'Delete league'}
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <div className="bg-red-950 border border-red-800 p-4 space-y-2">
        <p className="text-red-400 text-sm font-semibold">
          {fr ? '⚠️ Action irréversible' : '⚠️ Irreversible action'}
        </p>
        <p className="text-white/60 text-sm">
          {fr
            ? `La ligue "${leagueName}" et toutes ses données (membres, pronostics, points) seront définitivement supprimées.`
            : `The league "${leagueName}" and all its data (members, predictions, points) will be permanently deleted.`}
        </p>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex gap-3">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="bg-red-700 hover:bg-red-600 text-white text-sm px-4 py-2 font-semibold transition-colors disabled:opacity-50"
        >
          {loading
            ? (fr ? 'Suppression...' : 'Deleting...')
            : (fr ? 'Confirmer la suppression' : 'Confirm deletion')}
        </button>
        <button
          onClick={() => setStep('idle')}
          disabled={loading}
          className="text-white/40 hover:text-white text-sm transition-colors"
        >
          {fr ? 'Annuler' : 'Cancel'}
        </button>
      </div>
    </div>
  )
}
