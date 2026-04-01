'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const WEIGHT_CLASSES = [
  'Heavyweight', 'Light Heavyweight', 'Middleweight', 'Welterweight',
  'Lightweight', 'Featherweight', 'Bantamweight', 'Flyweight',
  "Women's Featherweight", "Women's Bantamweight", "Women's Flyweight", "Women's Strawweight",
]

type ExternalEvent = { external_id: string; name: string; date: string; time: string; location: string; thumbnail: string | null }
type Fight = {
  fighter1_name: string; fighter2_name: string; fighter1_record: string; fighter2_record: string
  weight_class: string; scheduled_rounds: number; is_main_event: boolean
}

const emptyFight = (): Fight => ({
  fighter1_name: '', fighter2_name: '', fighter1_record: '', fighter2_record: '',
  weight_class: 'Heavyweight', scheduled_rounds: 3, is_main_event: false,
})

export default function ImportEventClient({ locale = 'fr' }: { locale?: string }) {
  const router = useRouter()
  const fr = locale === 'fr'
  const [step, setStep] = useState<'fetch' | 'select' | 'edit'>('fetch')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fetchType, setFetchType] = useState<'next' | 'past'>('next')
  const [externalEvents, setExternalEvents] = useState<ExternalEvent[]>([])
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [deadline, setDeadline] = useState('')
  const [location, setLocation] = useState('')
  const [fights, setFights] = useState<Fight[]>([{ ...emptyFight(), is_main_event: true, scheduled_rounds: 5 }])

  const handleFetch = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/ufc-events?type=${fetchType}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (!data.events?.length) throw new Error(fr ? 'Aucun event trouvé' : 'No events found')
      setExternalEvents(data.events)
      setStep('select')
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const handleSelect = (event: ExternalEvent) => {
    setName(event.name)
    setLocation(event.location || '')
    const dt = `${event.date}T${event.time?.slice(0, 5) || '00:00'}`
    setDate(dt)
    const d = new Date(dt)
    d.setHours(d.getHours() - 1)
    const pad = (n: number) => String(n).padStart(2, '0')
    setDeadline(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`)
    setStep('edit')
  }

  const updateFight = (i: number, field: keyof Fight, value: any) =>
    setFights(prev => prev.map((f, idx) => idx === i ? { ...f, [field]: value } : f))
  const addFight = () => setFights(prev => [...prev, emptyFight()])
  const removeFight = (i: number) => setFights(prev => prev.filter((_, idx) => idx !== i))

  const handleCreate = async () => {
    if (!name || !date || !deadline || !location) {
      setError(fr ? "Remplis tous les champs de l'event" : 'Fill in all event fields'); return
    }
    if (fights.some(f => !f.fighter1_name || !f.fighter2_name)) {
      setError(fr ? 'Tous les combats doivent avoir deux fighters' : 'All fights must have two fighters'); return
    }
    setLoading(true); setError('')
    const supabase = createClient()
    const { data: event, error: evErr } = await supabase
      .from('ufc_events').insert({ name, date, location, prediction_deadline: deadline, status: 'upcoming' })
      .select().single()

    if (evErr || !event) {
      setError(fr ? "Erreur lors de la création de l'event" : 'Error creating event')
      setLoading(false); return
    }

    const fightInserts = fights.map((f, i) => ({ ...f, event_id: event.id, card_order: fights.length - i }))
    const { error: fErr } = await supabase.from('fights').insert(fightInserts)
    if (fErr) {
      setError(fr ? "Erreur lors de l'ajout des combats" : 'Error adding fights')
      setLoading(false); return
    }
    router.push(`/events/${event.id}`)
  }

  const back = (fr ? '← Retour' : '← Back')

  return (
    <div className="space-y-6">

      {/* STEP 1 */}
      {step === 'fetch' && (
        <div className="card space-y-5">
          <h2 className="font-display text-2xl tracking-wider">
            {fr ? 'RÉCUPÉRER LES EVENTS' : 'FETCH EVENTS'}
          </h2>
          <div>
            <label className="label">{fr ? "Type d'events" : 'Event type'}</label>
            <div className="flex gap-3">
              {(['next', 'past'] as const).map(t => (
                <button key={t} onClick={() => setFetchType(t)}
                  className={`py-2 px-4 border text-sm font-semibold uppercase tracking-wider transition-all ${
                    fetchType === t ? 'border-blood-500 bg-blood-500/10 text-white' : 'border-octagon-600 text-white/40 hover:text-white'
                  }`}>
                  {t === 'next' ? (fr ? 'Prochains events' : 'Upcoming events') : (fr ? 'Events passés' : 'Past events')}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={handleFetch} disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? (fr ? 'Récupération...' : 'Fetching...') : (fr ? 'Récupérer depuis TheSportsDB' : 'Fetch from TheSportsDB')}
          </button>
        </div>
      )}

      {/* STEP 2 */}
      {step === 'select' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-wider">
              {fr ? 'CHOISIR UN EVENT' : 'SELECT AN EVENT'}
            </h2>
            <button onClick={() => setStep('fetch')} className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">{back}</button>
          </div>
          <p className="text-white/40 text-sm">{externalEvents.length} {fr ? 'event(s) trouvé(s)' : 'event(s) found'}</p>
          {externalEvents.map(event => (
            <button key={event.external_id} onClick={() => handleSelect(event)} className="w-full text-left card-hover group">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-display text-xl tracking-wider group-hover:text-blood-400 transition-colors">{event.name}</div>
                  <div className="text-white/40 text-sm mt-1">{event.date} · {event.location || (fr ? 'Lieu non défini' : 'Location TBD')}</div>
                </div>
                <span className="badge-gray shrink-0">{fr ? 'Importer →' : 'Import →'}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* STEP 3 */}
      {step === 'edit' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-wider">
              {fr ? "CONFIGURER L'EVENT" : 'CONFIGURE EVENT'}
            </h2>
            <button onClick={() => setStep('select')} className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">{back}</button>
          </div>

          <div className="card space-y-4">
            <div>
              <label className="label">{fr ? 'Nom' : 'Name'}</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">{fr ? 'Date & heure' : 'Date & time'}</label>
                <input type="datetime-local" className="input" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label className="label">{fr ? 'Deadline pronostics' : 'Prediction deadline'}</label>
                <input type="datetime-local" className="input" value={deadline} onChange={e => setDeadline(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">{fr ? 'Lieu' : 'Location'}</label>
              <input className="input" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl tracking-wider">{fr ? 'COMBATS' : 'FIGHTS'}</h3>
              <button type="button" onClick={addFight} className="btn-secondary text-xs py-2">
                + {fr ? 'Ajouter un combat' : 'Add a fight'}
              </button>
            </div>

            {fights.map((fight, i) => (
              <div key={i} className={`card space-y-4 ${fight.is_main_event ? 'border-blood-500/50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-white/30 text-sm">#{fights.length - i}</span>
                    {fight.is_main_event && <span className="badge-red">MAIN EVENT</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-white/40 cursor-pointer">
                      <input type="checkbox" checked={fight.is_main_event}
                        onChange={e => updateFight(i, 'is_main_event', e.target.checked)} />
                      Main Event
                    </label>
                    {fights.length > 1 && (
                      <button type="button" onClick={() => removeFight(i)} className="text-red-500 hover:text-red-400 text-xs">
                        {fr ? 'Retirer' : 'Remove'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {([1, 2] as const).map(side => (
                    <div key={side}>
                      <label className="label">Fighter {side}</label>
                      <input className="input" placeholder={side === 1 ? 'Jon Jones' : 'Stipe Miocic'}
                        value={side === 1 ? fight.fighter1_name : fight.fighter2_name}
                        onChange={e => updateFight(i, side === 1 ? 'fighter1_name' : 'fighter2_name', e.target.value)} />
                      <input className="input mt-1" placeholder={fr ? 'Record ex: 27-1' : 'Record e.g. 27-1'}
                        value={side === 1 ? fight.fighter1_record : fight.fighter2_record}
                        onChange={e => updateFight(i, side === 1 ? 'fighter1_record' : 'fighter2_record', e.target.value)} />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">{fr ? 'Catégorie' : 'Division'}</label>
                    <select className="input" value={fight.weight_class}
                      onChange={e => updateFight(i, 'weight_class', e.target.value)}>
                      {WEIGHT_CLASSES.map(w => <option key={w}>{w}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Rounds</label>
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
          <button onClick={handleCreate} disabled={loading} className="btn-gold w-full py-4 text-base disabled:opacity-50">
            {loading
              ? (fr ? 'Création en cours...' : 'Creating...')
              : (fr ? "Créer l'événement" : 'Create event')}
          </button>
        </div>
      )}
    </div>
  )
}
