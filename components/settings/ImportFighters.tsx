'use client'

import { useState, useRef } from 'react'

export default function ImportFighters({ locale = 'fr' }: { locale?: string }) {
  const fr = locale === 'fr'
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
    setParseError(''); setResult(null)
    let fighters
    try {
      fighters = JSON.parse(json)
      if (!Array.isArray(fighters)) throw new Error(fr ? 'Le JSON doit être un tableau []' : 'JSON must be an array []')
    } catch (e: any) {
      setParseError((fr ? 'JSON invalide : ' : 'Invalid JSON: ') + e.message)
      return
    }
    setLoading(true)
    const res = await fetch('/api/import-fighters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fighters }) })
    const data = await res.json()
    setResult(data)
    setLoading(false)
    if (data.inserted > 0 || data.updated > 0) setJson('')
  }

  const fighterCount = (() => { try { const p = JSON.parse(json); return Array.isArray(p) ? p.length : null } catch { return null } })()

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl tracking-wider">IMPORT JSON</h2>
        <button type="button" onClick={() => setJson(JSON.stringify([{ name: "Jon Jones", wins: 27, losses: 1, draws: 0, weight_class: "Heavyweight", is_champion: true }], null, 2))}
          className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">
          {fr ? 'Voir exemple' : 'Show example'}
        </button>
      </div>

      <p className="text-white/40 text-sm leading-relaxed">
        {fr
          ? 'Colle un tableau JSON de combattants. Si un combattant existe déjà (même nom), il sera mis à jour.'
          : 'Paste a JSON array of fighters. If a fighter already exists (same name), they will be updated.'}
      </p>

      <div className="relative">
        <textarea className="input font-mono text-xs leading-relaxed resize-none" rows={10}
          placeholder={'[\n  {\n    "name": "Jon Jones",\n    "wins": 27,\n    ...\n  }\n]'}
          value={json} onChange={e => setJson(e.target.value)} spellCheck={false} />
        {fighterCount !== null && (
          <div className="absolute top-2 right-2 badge-gray text-xs">
            {fighterCount} fighter{fighterCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary text-sm py-2">
          {fr ? 'Charger un fichier .json' : 'Load .json file'}
        </button>
        <input ref={fileRef} type="file" accept=".json,application/json" onChange={handleFile} className="hidden" />
        <button type="button" onClick={handleImport} disabled={!json.trim() || loading} className="btn-gold text-sm py-2 disabled:opacity-50">
          {loading ? (fr ? 'Import en cours...' : 'Importing...') : (fr ? 'Importer' : 'Import')}
        </button>
        {json && (
          <button type="button" onClick={() => { setJson(''); setResult(null); setParseError('') }}
            className="text-white/40 hover:text-white text-xs transition-colors">
            {fr ? 'Effacer' : 'Clear'}
          </button>
        )}
      </div>

      {parseError && <div className="bg-red-950 border border-red-800 text-red-400 text-sm p-3">{parseError}</div>}

      {result && (
        <div className={`border p-4 space-y-2 ${result.errors.length === 0 ? 'bg-emerald-950/20 border-emerald-700' : 'bg-octagon-700 border-octagon-600'}`}>
          <div className="flex gap-4 text-sm">
            <span className="text-emerald-400">✓ {result.inserted} {fr ? `ajouté${result.inserted > 1 ? 's' : ''}` : 'added'}</span>
            <span className="text-white/60">↻ {result.updated} {fr ? 'mis à jour' : 'updated'}</span>
            {result.errors.length > 0 && <span className="text-red-400">✗ {result.errors.length} {fr ? 'erreur(s)' : 'error(s)'}</span>}
          </div>
          {result.errors.length > 0 && (
            <div className="text-red-400 text-xs space-y-1 mt-2">{result.errors.map((e, i) => <div key={i}>{e}</div>)}</div>
          )}
        </div>
      )}
    </div>
  )
}
