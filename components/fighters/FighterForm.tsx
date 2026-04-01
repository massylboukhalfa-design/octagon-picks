'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const WEIGHT_CLASSES = [
  'Heavyweight', 'Light Heavyweight', 'Middleweight', 'Welterweight',
  'Lightweight', 'Featherweight', 'Bantamweight', 'Flyweight',
  "Women's Featherweight", "Women's Bantamweight", "Women's Flyweight", "Women's Strawweight",
]
const STANCES = ['Orthodox', 'Southpaw', 'Switch']

type FighterData = {
  name: string; nickname: string; country: string; country_flag: string
  wins: number; losses: number; draws: number; no_contests: number
  wins_ko: number; wins_sub: number; wins_dec: number
  height_cm: string; weight_kg: string; reach_cm: string
  stance: string; weight_class: string; ranking: string; is_champion: boolean
}

const empty: FighterData = {
  name: '', nickname: '', country: '', country_flag: '',
  wins: 0, losses: 0, draws: 0, no_contests: 0,
  wins_ko: 0, wins_sub: 0, wins_dec: 0,
  height_cm: '', weight_kg: '', reach_cm: '',
  stance: '', weight_class: 'Heavyweight', ranking: '', is_champion: false,
}

type Props = { existing?: any; locale?: string }

export default function FighterForm({ existing, locale = 'fr' }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<FighterData>(existing ? {
    ...empty, ...existing,
    height_cm: existing.height_cm?.toString() ?? '',
    weight_kg: existing.weight_kg?.toString() ?? '',
    reach_cm: existing.reach_cm?.toString() ?? '',
    ranking: existing.ranking?.toString() ?? '',
  } : empty)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>(existing?.photo_url ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (field: keyof FighterData, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError(locale === 'fr' ? 'Le nom est obligatoire' : 'Name is required'); return }
    setLoading(true); setError('')
    const supabase = createClient()
    let photo_url = existing?.photo_url ?? null

    if (photo) {
      const ext = photo.name.split('.').pop()
      const path = `${Date.now()}-${form.name.toLowerCase().replace(/\s+/g, '-')}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('fighters').upload(path, photo, { upsert: true })
      if (uploadErr) { setError('Upload error: ' + uploadErr.message); setLoading(false); return }
      const { data: urlData } = supabase.storage.from('fighters').getPublicUrl(path)
      photo_url = urlData.publicUrl
    }

    const payload = {
      name: form.name.trim(), nickname: form.nickname.trim() || null,
      country: form.country.trim() || null, country_flag: form.country_flag.trim() || null,
      wins: Number(form.wins), losses: Number(form.losses), draws: Number(form.draws),
      no_contests: Number(form.no_contests), wins_ko: Number(form.wins_ko),
      wins_sub: Number(form.wins_sub), wins_dec: Number(form.wins_dec),
      height_cm: form.height_cm ? Number(form.height_cm) : null,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      reach_cm: form.reach_cm ? Number(form.reach_cm) : null,
      stance: form.stance || null, weight_class: form.weight_class || null,
      ranking: form.ranking ? Number(form.ranking) : null,
      is_champion: form.is_champion, photo_url,
    }

    if (existing) {
      const { error: err } = await supabase.from('fighters').update(payload).eq('id', existing.id)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { error: err } = await supabase.from('fighters').insert(payload)
      if (err) { setError(err.message); setLoading(false); return }
    }
    router.push('/fighters'); router.refresh()
  }

  const num = (field: keyof FighterData) => (
    <input type="number" min={0} className="input text-center"
      value={form[field] as number} onChange={e => update(field, Number(e.target.value))} />
  )

  const fr = locale === 'fr'

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Photo */}
      <div className="card space-y-4">
        <h3 className="font-display text-xl tracking-wider">PHOTO</h3>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-octagon-700 border border-octagon-600 overflow-hidden rounded-full flex-shrink-0">
            {photoPreview ? (
              <img src={photoPreview} alt="preview" className="w-full h-full object-cover object-top" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-display text-3xl text-white/20">{form.name.charAt(0) || '?'}</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary text-xs py-2">
              {photoPreview ? (fr ? 'Changer la photo' : 'Change photo') : (fr ? 'Ajouter une photo' : 'Add photo')}
            </button>
            {photoPreview && (
              <button type="button" onClick={() => { setPhoto(null); setPhotoPreview('') }}
                className="block text-white/40 text-xs hover:text-white transition-colors">
                {fr ? 'Supprimer' : 'Remove'}
              </button>
            )}
            <p className="text-white/30 text-xs">JPG, PNG — max 5MB</p>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
      </div>

      {/* Identity */}
      <div className="card space-y-4">
        <h3 className="font-display text-xl tracking-wider">{fr ? 'IDENTITÉ' : 'IDENTITY'}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">{fr ? 'Nom complet *' : 'Full name *'}</label>
            <input className="input" placeholder="Jon Jones" value={form.name} onChange={e => update('name', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">{fr ? 'Surnom' : 'Nickname'}</label>
            <input className="input" placeholder="Bones" value={form.nickname} onChange={e => update('nickname', e.target.value)} />
          </div>
          <div>
            <label className="label">{fr ? 'Pays' : 'Country'}</label>
            <input className="input" placeholder="United States" value={form.country} onChange={e => update('country', e.target.value)} />
          </div>
          <div>
            <label className="label">{fr ? 'Drapeau (emoji)' : 'Flag (emoji)'}</label>
            <input className="input text-2xl" placeholder="🇺🇸" value={form.country_flag} onChange={e => update('country_flag', e.target.value)} maxLength={4} />
          </div>
        </div>
      </div>

      {/* Division */}
      <div className="card space-y-4">
        <h3 className="font-display text-xl tracking-wider">{fr ? 'CATÉGORIE' : 'DIVISION'}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">{fr ? 'Catégorie de poids' : 'Weight class'}</label>
            <select className="input" value={form.weight_class} onChange={e => update('weight_class', e.target.value)}>
              {WEIGHT_CLASSES.map(w => <option key={w}>{w}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{fr ? 'Classement' : 'Ranking'}</label>
            <input className="input" type="number" min={1} max={15} placeholder="1"
              value={form.ranking} onChange={e => update('ranking', e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.is_champion} onChange={e => update('is_champion', e.target.checked)} className="w-4 h-4" />
          <span className="text-sm font-semibold tracking-wide">{fr ? 'Champion en titre' : 'Current champion'}</span>
          {form.is_champion && <span className="badge-gold">C</span>}
        </label>
      </div>

      {/* Record */}
      <div className="card space-y-4">
        <h3 className="font-display text-xl tracking-wider">RECORD</h3>
        <div className="grid grid-cols-4 gap-3">
          <div><label className="label text-center block">{fr ? 'Victoires' : 'Wins'}</label>{num('wins')}</div>
          <div><label className="label text-center block">{fr ? 'Défaites' : 'Losses'}</label>{num('losses')}</div>
          <div><label className="label text-center block">{fr ? 'Nuls' : 'Draws'}</label>{num('draws')}</div>
          <div><label className="label text-center block">NC</label>{num('no_contests')}</div>
        </div>
        <div className="divider" />
        <p className="text-white/40 text-xs uppercase tracking-widest">{fr ? 'Détail des victoires' : 'Win breakdown'}</p>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label text-center block">KO/TKO</label>{num('wins_ko')}</div>
          <div><label className="label text-center block">Submission</label>{num('wins_sub')}</div>
          <div><label className="label text-center block">{fr ? 'Décision' : 'Decision'}</label>{num('wins_dec')}</div>
        </div>
      </div>

      {/* Physical — stored in metric, displayed per locale */}
      <div className="card space-y-4">
        <h3 className="font-display text-xl tracking-wider">{fr ? 'PHYSIQUE' : 'PHYSICAL'}</h3>
        <p className="text-white/40 text-xs">{fr ? 'Valeurs stockées en cm / kg' : 'Values stored in cm / kg (converted for display)'}</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">{fr ? 'Taille (cm)' : 'Height (cm)'}</label>
            {form.height_cm && !fr && (
              <p className="text-white/30 text-xs mb-1">
                ≈ {(() => { const i = Math.round(Number(form.height_cm)/2.54); return `${Math.floor(i/12)}'${i%12}"` })()}
              </p>
            )}
            <input className="input" type="number" placeholder="193" value={form.height_cm} onChange={e => update('height_cm', e.target.value)} />
          </div>
          <div>
            <label className="label">{fr ? 'Poids (kg)' : 'Weight (kg)'}</label>
            {form.weight_kg && !fr && (
              <p className="text-white/30 text-xs mb-1">≈ {Math.round(Number(form.weight_kg) * 2.20462)} lbs</p>
            )}
            <input className="input" type="number" placeholder="120" value={form.weight_kg} onChange={e => update('weight_kg', e.target.value)} />
          </div>
          <div>
            <label className="label">{fr ? 'Allonge (cm)' : 'Reach (cm)'}</label>
            {form.reach_cm && !fr && (
              <p className="text-white/30 text-xs mb-1">≈ {Math.round(Number(form.reach_cm) / 2.54)}"</p>
            )}
            <input className="input" type="number" placeholder="215" value={form.reach_cm} onChange={e => update('reach_cm', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">{fr ? 'Garde' : 'Stance'}</label>
          <div className="flex gap-2">
            {['', ...STANCES].map(s => (
              <button key={s} type="button" onClick={() => update('stance', s)}
                className={`py-1.5 px-3 border text-sm font-mono transition-all ${
                  form.stance === s ? 'border-blood-500 bg-blood-500/10 text-white' : 'border-octagon-600 text-white/40 hover:text-white'
                }`}>
                {s || (fr ? 'Non défini' : 'Unknown')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button onClick={handleSubmit} disabled={loading} className="btn-gold py-4 px-8 disabled:opacity-50">
          {loading
            ? (fr ? 'Enregistrement...' : 'Saving...')
            : existing
            ? (fr ? 'Mettre à jour' : 'Update fighter')
            : (fr ? 'Créer le combattant' : 'Create fighter')}
        </button>
        <button onClick={() => router.back()} className="btn-secondary py-4 px-6">
          {fr ? 'Annuler' : 'Cancel'}
        </button>
      </div>
    </div>
  )
}
