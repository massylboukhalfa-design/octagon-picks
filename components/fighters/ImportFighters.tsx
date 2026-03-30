'use client'

import { useState, useRef } from 'react'

const EXAMPLE = JSON.stringify([
  {
    name: "Jon Jones",
    nickname: "Bones",
    country: "United States",
    country_flag: "🇺🇸",
    wins: 27, losses: 1, draws: 0, no_contests: 1,
    wins_ko: 10, wins_sub: 7, wins_dec: 10,
    height_cm: 193, weight_kg: 120, reach_cm: 215,
    stance: "Orthodox",
    weight_class: "Heavyweight",
    ranking: null,
    is_champion: true,
    photo_url: null
  }
], null, 2)

export default function ImportFighters() {
  const [json, setJson] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ inserted: number; updated: number; errors: string[] } | null>(null)
  const [parseError, setParseError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setJson(ev.target?.result as string)
    reader.readAsText(file)
  }

  const handleImport = async () => {
    setParseError('')
    setResult(null)

    let fighters
    try {
      fighters = JSON.parse(json)
      if (!Array.isArray(fighters)) throw new Error('Le JSON doit être un tableau []')
    } catch (e: any) {
      setParseError('JSON invalide : ' + e.message)
      return
    }

    setLoading(true)
    const res = await fetch('/api/import-fighters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fighters }),
    })
    const data = await res.json()
    setResult(data)
    setLoading(false)
    if (data.inserted > 0 || data.updated > 0) setJson('')
  }

  const fighterCount = (() => {
    try { const p = JSON.parse(json); return Array.isArray(p) ? p.length : null } catch { return null }
  })()

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl tracking-wider">IMPORT JSON</h2>
        <button
          type="button"
          onClick={() => setJson(EXAMPLE)}
          className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors"
        >
          Voir exemple
        </button>
      </div>

      <p className="text-white/40 text-sm leading-relaxed">
        Colle un tableau JSON de combattants ou charge un fichier <code className="text-white/60">.json</code>.
        Si un combattant existe déjà (même nom exact), il sera mis à jour.
      </p>

      {/* Zone texte */}
      <div className="relative">
        <textarea
          className="input font-mono text-xs leading-relaxed resize-none"
          rows={10}
          placeholder={'[\n  {\n    "name": "Jon Jones",\n    "wins": 27,\n    ...\n  }\n]'}
          value={json}
          onChange={e => setJson(e.target.value)}
          spellCheck={false}
        />
        {fighterCount !== null && (
          <div className="absolute top-2 right-2 badge-gray text-xs">
            {fighterCount} fighter{fighterCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="btn-secondary text-sm py-2"
        >
          Charger un fichier .json
        </button>
        <input ref={fileRef} type="file" accept=".json,application/json" onChange={handleFile} className="hidden" />

        <button
          type="button"
          onClick={handleImport}
          disabled={!json.trim() || loading}
          className="btn-gold text-sm py-2 disabled:opacity-50"
        >
          {loading ? 'Import en cours...' : 'Importer'}
        </button>

        {json && (
          <button type="button" onClick={() => { setJson(''); setResult(null); setParseError('') }}
            className="text-white/40 hover:text-white text-xs transition-colors">
            Effacer
          </button>
        )}
      </div>

      {/* Erreur de parsing */}
      {parseError && (
        <div className="bg-red-950 border border-red-800 text-red-400 text-sm p-3">
          {parseError}
        </div>
      )}

      {/* Résultat */}
      {result && (
        <div className={`border p-4 space-y-2 ${result.errors.length === 0 ? 'bg-emerald-950/20 border-emerald-700' : 'bg-octagon-700 border-octagon-600'}`}>
          <div className="flex gap-4 text-sm">
            <span className="text-emerald-400">✓ {result.inserted} ajouté{result.inserted > 1 ? 's' : ''}</span>
            <span className="text-white/60">↻ {result.updated} mis à jour</span>
            {result.errors.length > 0 && (
              <span className="text-red-400">✗ {result.errors.length} erreur{result.errors.length > 1 ? 's' : ''}</span>
            )}
          </div>
          {result.errors.length > 0 && (
            <div className="text-red-400 text-xs space-y-1 mt-2">
              {result.errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}
        </div>
      )}

      {/* Format attendu */}
      <details className="group">
        <summary className="text-white/40 text-xs uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
          Format JSON attendu
        </summary>
        <pre className="mt-3 bg-octagon-700 border border-octagon-600 p-4 text-xs font-mono text-white/60 overflow-x-auto leading-relaxed">
{`[
  {
    "name": "Jon Jones",          // obligatoire
    "nickname": "Bones",          // optionnel
    "country": "United States",   // optionnel
    "country_flag": "🇺🇸",        // emoji drapeau
    "wins": 27,
    "losses": 1,
    "draws": 0,
    "no_contests": 1,
    "wins_ko": 10,
    "wins_sub": 7,
    "wins_dec": 10,
    "height_cm": 193,             // optionnel
    "weight_kg": 120,             // optionnel
    "reach_cm": 215,              // optionnel
    "stance": "Orthodox",         // Orthodox | Southpaw | Switch
    "weight_class": "Heavyweight",
    "ranking": null,              // null si champion
    "is_champion": true,
    "photo_url": null             // URL ou null
  }
]`}
        </pre>
      </details>
    </div>
  )
}
