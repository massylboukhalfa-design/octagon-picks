'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Fighter = {
  id: string; name: string; nickname?: string | null; photo_url?: string | null
  weight_class?: string | null; wins: number; losses: number; draws: number
  country_flag?: string | null; is_champion: boolean; ranking?: number | null
}

type Filter = 'all' | 'missing' | 'done'
type AutoStatus = 'idle' | 'running' | 'done'

export default function EnrichGrid({ fighters, locale = 'fr' }: { fighters: Fighter[]; locale?: string }) {
  const fr = locale === 'fr'
  const [filter, setFilter] = useState<Filter>('missing')
  const [search, setSearch] = useState('')
  const [weightClass, setWeightClass] = useState('')
  const [photos, setPhotos] = useState<Record<string, string>>(() =>
    Object.fromEntries(fighters.filter(f => f.photo_url).map(f => [f.id, f.photo_url!]))
  )
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Auto-enrichissement
  const [autoStatus, setAutoStatus] = useState<AutoStatus>('idle')
  const [autoProgress, setAutoProgress] = useState({ done: 0, total: 0, success: 0, failed: 0, current: '' })
  const stopRef = useRef(false)

  const weightClasses = Array.from(new Set(fighters.map(f => f.weight_class).filter(Boolean))) as string[]
  const missingFighters = fighters.filter(f => !photos[f.id])

  const filtered = fighters.filter(f => {
    if (filter === 'missing' && photos[f.id]) return false
    if (filter === 'done' && !photos[f.id]) return false
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false
    if (weightClass && f.weight_class !== weightClass) return false
    return true
  })

  // ── Upload manuel ──────────────────────────────────────────
  const uploadPhoto = useCallback(async (fighter: Fighter, file: File) => {
    setUploading(p => ({ ...p, [fighter.id]: true }))
    setErrors(p => ({ ...p, [fighter.id]: '' }))
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${fighter.id}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('fighters').upload(path, file, { upsert: true })
    if (uploadErr) {
      setErrors(p => ({ ...p, [fighter.id]: uploadErr.message }))
      setUploading(p => ({ ...p, [fighter.id]: false }))
      return
    }
    const { data } = supabase.storage.from('fighters').getPublicUrl(path)
    const url = data.publicUrl + '?t=' + Date.now()
    await supabase.from('fighters').update({ photo_url: url }).eq('id', fighter.id)
    setPhotos(p => ({ ...p, [fighter.id]: url }))
    setSaved(p => ({ ...p, [fighter.id]: true }))
    setTimeout(() => setSaved(p => ({ ...p, [fighter.id]: false })), 2500)
    setUploading(p => ({ ...p, [fighter.id]: false }))
  }, [])

  const removePhoto = useCallback(async (fighter: Fighter) => {
    const supabase = createClient()
    await supabase.from('fighters').update({ photo_url: null }).eq('id', fighter.id)
    setPhotos(p => { const n = { ...p }; delete n[fighter.id]; return n })
  }, [])

  // ── Auto-enrichissement ────────────────────────────────────
  const startAutoEnrich = async () => {
    const targets = missingFighters
    if (!targets.length) return

    stopRef.current = false
    setAutoStatus('running')
    setAutoProgress({ done: 0, total: targets.length, success: 0, failed: 0, current: '' })

    let success = 0, failed = 0

    for (let i = 0; i < targets.length; i++) {
      if (stopRef.current) break
      const fighter = targets[i]
      setAutoProgress(p => ({ ...p, done: i, current: fighter.name }))

      try {
        const res = await fetch('/api/enrich-fighter-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fighterId: fighter.id, fighterName: fighter.name }),
        })
        const data = await res.json()

        if (data.success && data.photo_url) {
          setPhotos(p => ({ ...p, [fighter.id]: data.photo_url }))
          setSaved(p => ({ ...p, [fighter.id]: true }))
          setTimeout(() => setSaved(p => ({ ...p, [fighter.id]: false })), 3000)
          success++
        } else {
          setErrors(p => ({ ...p, [fighter.id]: data.reason ?? 'not found' }))
          failed++
        }
      } catch {
        failed++
      }

      setAutoProgress(p => ({ ...p, done: i + 1, success, failed }))
      // Petit délai pour ne pas surcharger UFC.com
      await new Promise(r => setTimeout(r, 700))
    }

    setAutoProgress(p => ({ ...p, current: '', done: p.total }))
    setAutoStatus('done')
  }

  const stopAutoEnrich = () => { stopRef.current = true }

  const missing = fighters.filter(f => !photos[f.id]).length
  const done = fighters.filter(f => photos[f.id]).length

  return (
    <div className="space-y-5">
      {/* ── Barre auto-enrichissement ── */}
      <div className="card border-gold-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl tracking-wider">
              {fr ? 'ENRICHISSEMENT AUTOMATIQUE' : 'AUTO ENRICHMENT'}
            </h2>
            <p className="text-white/40 text-xs mt-1">
              {fr
                ? `Scrape les photos depuis UFC.com pour les ${missing} fighter(s) sans photo`
                : `Scrapes photos from UFC.com for ${missing} fighter(s) without a photo`}
            </p>
          </div>
          <div className="flex gap-2">
            {autoStatus === 'running' ? (
              <button onClick={stopAutoEnrich}
                className="btn-secondary text-sm py-2 px-4 border-red-500/50 text-red-400">
                {fr ? 'Arrêter' : 'Stop'}
              </button>
            ) : (
              <button onClick={startAutoEnrich} disabled={missing === 0}
                className="btn-gold text-sm py-2 px-4 disabled:opacity-40">
                {autoStatus === 'done'
                  ? (fr ? '↺ Relancer' : '↺ Retry')
                  : (fr ? '⚡ Lancer' : '⚡ Start')}
              </button>
            )}
          </div>
        </div>

        {/* Progress */}
        {(autoStatus === 'running' || autoStatus === 'done') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/50">
                {autoStatus === 'running' && autoProgress.current
                  ? `${fr ? 'En cours : ' : 'Processing: '}${autoProgress.current}`
                  : autoStatus === 'done'
                  ? (fr ? 'Terminé' : 'Done')
                  : ''}
              </span>
              <span className="font-mono text-white/60">
                {autoProgress.done}/{autoProgress.total}
              </span>
            </div>
            {/* Barre de progression */}
            <div className="h-1.5 bg-octagon-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold-500 transition-all duration-300"
                style={{ width: `${autoProgress.total ? (autoProgress.done / autoProgress.total) * 100 : 0}%` }}
              />
            </div>
            <div className="flex gap-4 text-xs">
              <span className="text-emerald-400">✓ {autoProgress.success} {fr ? 'trouvées' : 'found'}</span>
              <span className="text-red-400">✗ {autoProgress.failed} {fr ? 'introuvables' : 'not found'}</span>
            </div>
            {autoStatus === 'done' && autoProgress.failed > 0 && (
              <p className="text-white/30 text-xs">
                {fr
                  ? 'Les fighters introuvables ont leur nom qui ne correspond pas exactement au slug UFC.com. Corrige le nom dans leur fiche.'
                  : 'Fighters not found have names that don\'t match their UFC.com slug. Fix the name in their profile.'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Filtres ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex border border-octagon-700">
          {([
            ['all', fr ? `Tous (${fighters.length})` : `All (${fighters.length})`],
            ['missing', fr ? `Sans photo (${missing})` : `Missing (${missing})`],
            ['done', fr ? `Avec photo (${done})` : `With photo (${done})`],
          ] as [Filter, string][]).map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors ${
                filter === val ? 'bg-blood-500 text-white' : 'text-white/40 hover:text-white'
              }`}>
              {label}
            </button>
          ))}
        </div>
        <input type="text" placeholder={fr ? 'Rechercher...' : 'Search...'}
          value={search} onChange={e => setSearch(e.target.value)}
          className="input py-2 text-sm w-48" />
        <select value={weightClass} onChange={e => setWeightClass(e.target.value)} className="input py-2 text-sm">
          <option value="">{fr ? 'Toutes catégories' : 'All divisions'}</option>
          {weightClasses.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
        {(search || weightClass) && (
          <button onClick={() => { setSearch(''); setWeightClass('') }}
            className="text-white/40 hover:text-white text-xs transition-colors">
            {fr ? 'Réinitialiser' : 'Reset'}
          </button>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="font-display text-3xl text-white/20">
            {filter === 'missing'
              ? (fr ? '✓ Tous les fighters ont une photo' : '✓ All fighters have a photo')
              : (fr ? 'Aucun résultat' : 'No results')}
          </p>
        </div>
      )}

      {/* ── Grille fighters ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {filtered.map(fighter => (
          <FighterCard
            key={fighter.id} fighter={fighter}
            photoUrl={photos[fighter.id]}
            uploading={uploading[fighter.id]}
            saved={saved[fighter.id]}
            error={errors[fighter.id]}
            onUpload={uploadPhoto} onRemove={removePhoto}
            locale={locale}
          />
        ))}
      </div>

      {filtered.length > 0 && (
        <div className="text-white/30 text-xs text-center pt-2">
          {filtered.length} fighter{filtered.length > 1 ? 's' : ''} {fr ? 'affiché(s)' : 'shown'}
        </div>
      )}
    </div>
  )
}

function FighterCard({ fighter, photoUrl, uploading, saved, error, onUpload, onRemove, locale = 'fr' }: {
  fighter: Fighter; photoUrl?: string; uploading?: boolean; saved?: boolean
  error?: string; locale?: string
  onUpload: (f: Fighter, file: File) => void; onRemove: (f: Fighter) => void
}) {
  const fr = locale === 'fr'
  const fileRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) onUpload(fighter, file)
  }

  return (
    <div
      className={`relative group border transition-all ${
        saved ? 'border-emerald-500 bg-emerald-950/10' :
        uploading ? 'border-gold-500/50' :
        photoUrl ? 'border-octagon-600 bg-octagon-800' :
        error ? 'border-red-800/50 bg-octagon-800/50' :
        'border-octagon-700 border-dashed bg-octagon-800/50'
      }`}
      onDrop={handleDrop} onDragOver={e => e.preventDefault()}
    >
      <div className="w-full aspect-square overflow-hidden cursor-pointer relative"
        onClick={() => !uploading && fileRef.current?.click()}>
        {photoUrl ? (
          <img src={photoUrl} alt={fighter.name} className="w-full h-full object-cover object-top" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-octagon-700 group-hover:bg-octagon-600 transition-colors">
            {uploading ? (
              <div className="text-gold-400 text-2xl animate-spin">↻</div>
            ) : (
              <>
                <span className="font-display text-3xl text-white/15 mb-1">{fighter.name.charAt(0)}</span>
                <span className="text-white/30 text-xs">+ Photo</span>
              </>
            )}
          </div>
        )}
        {photoUrl && !uploading && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-xs uppercase tracking-widest font-semibold">
              {fr ? 'Changer' : 'Change'}
            </span>
          </div>
        )}
        {saved && <div className="absolute top-1 right-1 bg-emerald-500 text-white text-xs px-1.5 py-0.5 font-semibold">✓</div>}
        {fighter.is_champion && <div className="absolute top-1 left-1 badge-gold text-xs">C</div>}
      </div>

      <div className="p-2">
        <div className="font-semibold text-xs leading-tight truncate" title={fighter.name}>
          {fighter.country_flag && <span className="mr-0.5">{fighter.country_flag}</span>}
          {fighter.name}
        </div>
        {fighter.nickname && <div className="text-white/30 text-xs italic truncate">"{fighter.nickname}"</div>}
        <div className="text-white/40 font-mono text-xs mt-0.5">{fighter.wins}-{fighter.losses}-{fighter.draws}</div>
        {fighter.weight_class && <div className="text-white/25 text-xs truncate leading-tight">{fighter.weight_class}</div>}
        {error && !photoUrl && (
          <div className="text-red-400 text-xs mt-1 leading-tight truncate" title={error}>
            ✗ {error === 'not_found' ? (fr ? 'introuvable' : 'not found') : error}
          </div>
        )}
        {photoUrl && !uploading && (
          <button onClick={e => { e.stopPropagation(); onRemove(fighter) }}
            className="mt-1 text-white/20 hover:text-red-400 text-xs transition-colors">
            {fr ? 'Supprimer' : 'Remove'}
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(fighter, f) }} className="hidden" />
    </div>
  )
}
