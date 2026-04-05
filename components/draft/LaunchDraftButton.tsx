'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LaunchDraftButton({ seasonId, locale = 'fr' }: { seasonId: string; locale?: string }) {
  const router = useRouter()
  const isFr = locale === 'fr'
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState('')

  const handleLaunch = async () => {
    if (!confirm) { setConfirm(true); return }
    setLoading(true); setError('')

    const res = await fetch('/api/draft-launch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seasonId }),
    })
    const data = await res.json()

    if (data.error) {
      setError(data.error)
      setLoading(false)
      setConfirm(false)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {confirm && (
        <p className="text-white/60 text-xs text-right max-w-48">
          {isFr
            ? "L'ordre sera tiré au sort. C'est irréversible."
            : "The order will be randomized. This is irreversible."}
        </p>
      )}
      <div className="flex gap-2">
        {confirm && (
          <button onClick={() => setConfirm(false)}
            className="text-white/40 hover:text-white text-xs transition-colors">
            {isFr ? 'Annuler' : 'Cancel'}
          </button>
        )}
        <button onClick={handleLaunch} disabled={loading}
          className="btn-gold text-sm py-2 px-4 disabled:opacity-50">
          {loading
            ? (isFr ? 'Lancement...' : 'Launching...')
            : confirm
            ? (isFr ? '⚡ Confirmer le lancement' : '⚡ Confirm launch')
            : (isFr ? '⚡ Lancer le draft' : '⚡ Launch draft')}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
