'use client'

import { useState, useRef } from 'react'

const EXAMPLE = JSON.stringify([
  {
    name: "UFC 310: Jones vs Aspinall",
    date: "2025-12-07T03:00:00",
    location: "T-Mobile Arena, Las Vegas",
    prediction_deadline: "2025-12-07T01:00:00",
    status: "upcoming",
    fights: [
      {
        fighter1_name: "Jon Jones",
        fighter1_record: "27-1",
        fighter2_name: "Tom Aspinall",
        fighter2_record: "15-3",
        weight_class: "Heavyweight",
        scheduled_rounds: 5,
        is_main_event: true
      },
      {
        fighter1_name: "Islam Makhachev",
        fighter1_record: "28-1",
        fighter2_name: "Arman Tsarukyan",
        fighter2_record: "23-3",
        weight_class: "Lightweight",
        scheduled_rounds: 5,
        is_main_event: false
      }
    ]
  }
], null, 2)

export default function ImportEvents() {
  const [json, setJson] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    events_inserted: number
    fights_inserted: number
    fighters_linked: number
    fighters_created: number
    errors: string[]
  } | null>(null)
  const [parseError, setParseError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setJson(ev.target?.result as string)
    reader.readAsText(file)
  }

  const eventCount = (() => {
    try { const p = JSON.parse(json); return Array.isArray(p) ? p.length : null } catch { return null }
  })()

  const handleImport = async () => {
    setParseError('')
    setResult(null)

    let events
    try {
      events = JSON.parse(json)
      if (!Array.isArray(events)) throw new Error('Le JSON doit être un tableau []')
    } catch (e: any) {
      setParseError('JSON invalide : ' + e.message)
      return
    }

    setLoading(true)
    const res = await fetch('/api/import-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    })
    const data = await res.json()
    setResult(data)
    setLoading(false)
    if (!data.error) setJson('')
  }

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
        Colle un tableau JSON d'événements avec leurs combats. Si un fighter existe déjà en base
        (recherche par nom), il sera automatiquement lié. Sinon, il sera créé avec les infos disponibles.
      </p>

      {/* Zone texte */}
      <div className="relative">
        <textarea
          className="input font-mono text-xs leading-relaxed resize-none"
          rows={12}
          placeholder={'[\n  {\n    "name": "UFC 310: ...",\n    "date": "2025-12-07T03:00:00",\n    "prediction_deadline": "2025-12-07T01:00:00",\n    "fights": [...]\n  }\n]'}
          value={json}
          onChange={e => setJson(e.target.value)}
          spellCheck={false}
        />
        {eventCount !== null && (
          <div className="absolute top-2 right-2 badge-gray text-xs">
            {eventCount} event{eventCount > 1 ? 's' : ''}
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

      {parseError && (
        <div className="bg-red-950 border border-red-800 text-red-400 text-sm p-3">{parseError}</div>
      )}

      {result && (
        <div className={`border p-4 space-y-3 ${result.errors.length === 0 ? 'bg-emerald-950/20 border-emerald-700' : 'bg-octagon-700 border-octagon-600'}`}>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-emerald-400">✓ {result.events_inserted} event{result.events_inserted > 1 ? 's' : ''} créé{result.events_inserted > 1 ? 's' : ''}</span>
            <span className="text-white/60">⚔ {result.fights_inserted} combat{result.fights_inserted > 1 ? 's' : ''} ajouté{result.fights_inserted > 1 ? 's' : ''}</span>
            <span className="text-gold-400">🔗 {result.fighters_linked} fighter{result.fighters_linked > 1 ? 's' : ''} liés depuis la base</span>
            <span className="text-white/50">+ {result.fighters_created} fighter{result.fighters_created > 1 ? 's' : ''} créé{result.fighters_created > 1 ? 's' : ''}</span>
          </div>
          {result.errors.length > 0 && (
            <div className="text-red-400 text-xs space-y-1 border-t border-octagon-600 pt-3">
              {result.errors.map((e, i) => <div key={i}>✗ {e}</div>)}
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
    "name": "UFC 310: Jones vs Aspinall",  // obligatoire
    "date": "2025-12-07T03:00:00",          // obligatoire — ISO 8601
    "location": "T-Mobile Arena, Las Vegas",
    "prediction_deadline": "2025-12-07T01:00:00", // obligatoire
    "status": "upcoming",                   // upcoming | locked | completed
    "fights": [
      {
        "fighter1_name": "Jon Jones",       // obligatoire
        "fighter1_record": "27-1",          // format W-L ou W-L-D
        "fighter2_name": "Tom Aspinall",    // obligatoire
        "fighter2_record": "15-3",
        "weight_class": "Heavyweight",
        "scheduled_rounds": 5,              // 3 ou 5
        "is_main_event": true
      }
    ]
  }
]`}
        </pre>
      </details>
    </div>
  )
}
