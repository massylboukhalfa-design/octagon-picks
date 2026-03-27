'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Fight = {
  fighter1_name: string
  fighter2_name: string
  fighter1_record: string
  fighter2_record: string
  weight_class: string
  scheduled_rounds: number
  is_main_event: boolean
}

const WEIGHT_CLASSES = [
  'Heavyweight', 'Light Heavyweight', 'Middleweight', 'Welterweight',
  'Lightweight', 'Featherweight', 'Bantamweight', 'Flyweight',
  "Women's Featherweight", "Women's Bantamweight", "Women's Flyweight", "Women's Strawweight",
]

const emptyFight = (): Fight => ({
  fighter1_name: '', fighter2_name: '', fighter1_record: '', fighter2_record: '',
  weight_class: 'Heavyweight', scheduled_rounds: 3, is_main_event: false,
})

export default function NewEventForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [deadline, setDeadline] = useState('')
  const [fights, setFights] = useState<Fight[]>([{ ...emptyFight(), is_main_event: true, scheduled_rounds: 5 }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const updateFight = (i: number, field: keyof Fight, value: any) => {
    setFights(prev => prev.map((f, idx) => idx === i ? { ...f, [field]: value } : f))
  }

  const addFight = () => setFights(prev => [...prev, emptyFight()])
  const removeFight = (i: number) => setFights(prev => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data: event, error: evErr } = await supabase
      .from('ufc_events')
      .insert({ name, date, location, prediction_deadline: deadline, status: 'upcoming' })
      .select()
      .single()

    if (evErr || !event) { setError('Erreur création événement'); setLoading(false); return }

    const fightInserts = fights.map((f, i) => ({
      ...f,
      event_id: event.id,
      card_order: fights.length - i,
    }))

    const { error: fErr } = await supabase.from('fights').insert(fightInserts)
    if (fErr) { setError('Erreur création combats'); setLoading(false); return }

    router.push(`/events/${event.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="card space-y-4">
        <h2 className="font-display text-2xl tracking-wider">INFOS DE L'ÉVÉNEMENT</h2>
        <div>
          <label className="label">Nom</label>
          <input className="input" placeholder="UFC 310: Jones vs Miocic" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Date & heure</label>
            <input type="datetime-local" className="input" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="label">Deadline pronostics</label>
            <input type="datetime-local" className="input" value={deadline} onChange={e => setDeadline(e.target.value)} required />
          </div>
        </div>
        <div>
          <label className="label">Lieu</label>
          <input className="input" placeholder="T-Mobile Arena, Las Vegas" value={location} onChange={e => setLocation(e.target.value)} required />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl tracking-wider">COMBATS</h2>
          <button type="button" onClick={addFight} className="btn-secondary text-xs py-2">+ Ajouter un combat</button>
        </div>

        {fights.map((fight, i) => (
          <div key={i} className={`card space-y-4 ${fight.is_main_event ? 'border-blood-500/50' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-octagon-600 text-sm">#{fights.length - i}</span>
                {fight.is_main_event && <span className="badge-red">MAIN EVENT</span>}
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-octagon-600 cursor-pointer">
                  <input type="checkbox" checked={fight.is_main_event}
                    onChange={e => updateFight(i, 'is_main_event', e.target.checked)} />
                  Main Event
                </label>
                {fights.length > 1 && (
                  <button type="button" onClick={() => removeFight(i)} className="text-red-500 hover:text-red-400 text-xs">Retirer</button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Fighter 1</label>
                <input className="input" placeholder="Jon Jones" value={fight.fighter1_name}
                  onChange={e => updateFight(i, 'fighter1_name', e.target.value)} required />
                <input className="input mt-1" placeholder="Record (ex: 27-1)" value={fight.fighter1_record}
                  onChange={e => updateFight(i, 'fighter1_record', e.target.value)} />
              </div>
              <div>
                <label className="label">Fighter 2</label>
                <input className="input" placeholder="Stipe Miocic" value={fight.fighter2_name}
                  onChange={e => updateFight(i, 'fighter2_name', e.target.value)} required />
                <input className="input mt-1" placeholder="Record (ex: 20-4)" value={fight.fighter2_record}
                  onChange={e => updateFight(i, 'fighter2_record', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Catégorie</label>
                <select className="input" value={fight.weight_class}
                  onChange={e => updateFight(i, 'weight_class', e.target.value)}>
                  {WEIGHT_CLASSES.map(w => <option key={w}>{w}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Rounds prévus</label>
                <select className="input" value={fight.scheduled_rounds}
                  onChange={e => updateFight(i, 'scheduled_rounds', Number(e.target.value))}>
                  <option value={3}>3 rounds</option>
                  <option value={5}>5 rounds</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base disabled:opacity-50">
        {loading ? 'Création en cours...' : 'Créer l\'événement'}
      </button>
    </form>
  )
}
