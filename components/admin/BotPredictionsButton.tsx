'use client'

import { useState } from 'react'

export default function BotPredictionsButton({ eventId, locale = 'fr' }: { eventId: string; locale?: string }) {
  const fr = locale === 'fr'
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ inserted: number; skipped: number; total: number } | null>(null)
  const [error, setError] = useState('')

  const handleClick = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    const res = await fetch('/api/bot-predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId }),
    })

    const data = await res.json()

    if (data.error) {
      setError(data.error)
    } else {
      setResult(data)
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="btn-secondary text-sm py-2 px-4 disabled:opacity-50 flex items-center gap-2"
      >
        🤖 {loading
          ? (fr ? 'Génération...' : 'Generating...')
          : (fr ? 'Générer les pronos du bot' : 'Generate bot picks')}
      </button>

      {result && (
        <div className="text-xs text-right space-y-0.5">
          <div className="text-emerald-400">✓ {result.inserted} {fr ? 'pronostic(s) créé(s)' : 'pick(s) created'}</div>
          {result.skipped > 0 && (
            <div className="text-white/40">{result.skipped} {fr ? 'déjà existant(s)' : 'already existed'}</div>
          )}
        </div>
      )}

      {error && (
        <div className="text-red-400 text-xs">{error}</div>
      )}
    </div>
  )
}
