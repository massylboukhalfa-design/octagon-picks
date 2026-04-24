'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const WEIGHT_CLASSES = [
  'Heavyweight','Light Heavyweight','Middleweight','Welterweight',
  'Lightweight','Featherweight','Bantamweight','Flyweight',
  "Women's Featherweight","Women's Bantamweight","Women's Flyweight","Women's Strawweight",
]

type Fighter = { id: string; name: string; wins: number; losses: number; draws: number; weight_class?: string | null; country_flag?: string | null }
type Fight = {
  id: string; fighter1_name: string; fighter2_name: string
  fighter1_id: string | null; fighter2_id: string | null
  fighter1_record: string | null; fighter2_record: string | null
  weight_class: string; scheduled_rounds: number; is_main_event: boolean
  card_order: number; fight_results?: { id: string }[]
}

type Props = {
  event: any
  fights: Fight[]
  allFighters: Fighter[]
  locale?: string
}

export default function EventEditForm({ event, fights: initialFights, allFighters, locale = 'fr' }: Props) {
  const router = useRouter()
  const fr = locale === 'fr'

  // Infos event
  const [name, setName] = useState(event.name)
  const [date, setDate] = useState(event.date?.slice(0, 16) ?? '')
  const [deadline, setDeadline] = useState(event.prediction_deadline?.slice(0, 16) ?? '')
  const [location, setLocation] = useState(event.location ?? '')
  const [status, setStatus] = useState(event.status)

  // Combats
  const [fights, setFights] = useState<Fight[]>(initialFights)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const updateFight = (id: string, field: keyof Fight, value: any) =>
    setFights(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f))

  const switchFighter = (fightId: string, side: 1 | 2, newFighterId: string) => {
    const fighter = allFighters.find(f => f.id === newFighterId)
    if (!fighter) return
    setFights(prev => prev.map(f => {
      if (f.id !== fightId) return f
      if (side === 1) return { ...f, fighter1_id: fighter.id, fighter1_name: fighter.name, fighter1_record: `${fighter.wins}-${fighter.losses}-${fighter.draws}`, weight_class: fighter.weight_class ?? f.weight_class }
      return { ...f, fighter2_id: fighter.id, fighter2_name: fighter.name, fighter2_record: `${fighter.wins}-${fighter.losses}-${fighter.draws}`, weight_class: fighter.weight_class ?? f.weight_class }
    }))
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    setFights(prev => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next.map((f, i) => ({ ...f, card_order: next.length - i }))
    })
  }

  const moveDown = (index: number) => {
    if (index === fights.length - 1) return
    setFights(prev => {
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next.map((f, i) => ({ ...f, card_order: next.length - i }))
    })
  }

  const addFight = () => {
    const tempId = `new-${Date.now()}`
    setFights(prev => [{
      id: tempId, fighter1_name: '', fighter2_name: '',
      fighter1_id: null, fighter2_id: null,
      fighter1_record: null, fighter2_record: null,
      weight_class: 'Heavyweight', scheduled_rounds: 3,
      is_main_event: false, card_order: prev.length + 1,
    }, ...prev])
  }

  const removeFight = async (fight: Fight) => {
    if (!fight.id.startsWith('new-')) {
      if (!confirm(fr ? 'Supprimer ce combat ?' : 'Delete this fight?')) return
      const supabase = createClient()
      await supabase.from('fights').delete().eq('id', fight.id)
    }
    setFights(prev => prev.filter(f => f.id !== fight.id))
  }

  const handleSave = async () => {
    setSaving(true); setMsg('')
    const supabase = createClient()

    // Mettre à jour les infos de l'event
    await supabase.from('ufc_events').update({ name, date, prediction_deadline: deadline, location, status }).eq('id', event.id)

    // Sauvegarder les combats
    for (const fight of fights) {
      if (fight.id.startsWith('new-')) {
        // Nouveau combat
        await supabase.from('fights').insert({
          event_id: event.id,
          fighter1_name: fight.fighter1_name,
          fighter2_name: fight.fighter2_name,
          fighter1_id: fight.fighter1_id,
          fighter2_id: fight.fighter2_id,
          fighter1_record: fight.fighter1_record,
          fighter2_record: fight.fighter2_record,
          weight_class: fight.weight_class,
          scheduled_rounds: fight.scheduled_rounds,
          is_main_event: fight.is_main_event,
          card_order: fight.card_order,
        })
      } else {
        // Modifier combat existant
        await supabase.from('fights').update({
          fighter1_name: fight.fighter1_name,
          fighter2_name: fight.fighter2_name,
          fighter1_id: fight.fighter1_id,
          fighter2_id: fight.fighter2_id,
          fighter1_record: fight.fighter1_record,
          fighter2_record: fight.fighter2_record,
          weight_class: fight.weight_class,
          scheduled_rounds: fight.scheduled_rounds,
          is_main_event: fight.is_main_event,
          card_order: fight.card_order,
        }).eq('id', fight.id)
      }
    }

    setMsg(fr ? '✓ Sauvegardé' : '✓ Saved')
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Infos event */}
      <div className="card space-y-4">
        <h2 className="font-display text-xl tracking-wider">
          {fr ? "INFOS DE L'ÉVÉNEMENT" : 'EVENT DETAILS'}
        </h2>
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">{fr ? 'Lieu' : 'Location'}</label>
            <input className="input" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
          <div>
            <label className="label">Statut</label>
            <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Combats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl tracking-wider">{fr ? 'COMBATS' : 'FIGHTS'}</h2>
          <button onClick={addFight} className="btn-secondary text-xs py-2">
            + {fr ? 'Ajouter un combat' : 'Add fight'}
          </button>
        </div>

        {fights.map((fight, index) => {
          const isNew = fight.id.startsWith('new-')
          const hasResult = (fight.fight_results ?? []).length > 0

          return (
            <div key={fight.id} className={`card space-y-3 ${fight.is_main_event ? 'border-blood-500/40' : ''} ${isNew ? 'border-gold-500/40' : ''}`}>
              {/* Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {fight.is_main_event && <span className="badge-red text-xs">MAIN EVENT</span>}
                  {isNew && <span className="text-gold-400 text-xs uppercase tracking-widest">Nouveau</span>}
                  {hasResult && <span className="text-white/30 text-xs">résultat enregistré</span>}
                </div>
                <div className="flex items-center gap-2">
                  {/* Ordre */}
                  <button onClick={() => moveUp(index)} disabled={index === 0}
                    className="text-white/30 hover:text-white disabled:opacity-20 text-sm px-1">↑</button>
                  <button onClick={() => moveDown(index)} disabled={index === fights.length - 1}
                    className="text-white/30 hover:text-white disabled:opacity-20 text-sm px-1">↓</button>
                  <label className="flex items-center gap-1.5 text-xs text-white/40 cursor-pointer">
                    <input type="checkbox" checked={fight.is_main_event}
                      onChange={e => updateFight(fight.id, 'is_main_event', e.target.checked)} />
                    ME
                  </label>
                  <button onClick={() => removeFight(fight)}
                    className="text-red-500 hover:text-red-400 text-xs">
                    {fr ? 'Retirer' : 'Remove'}
                  </button>
                </div>
              </div>

              {/* Fighters */}
              <div className="grid grid-cols-2 gap-3">
                {([1, 2] as const).map(side => {
                  const nameField = side === 1 ? 'fighter1_name' : 'fighter2_name'
                  const idField = side === 1 ? 'fighter1_id' : 'fighter2_id'
                  const recordField = side === 1 ? 'fighter1_record' : 'fighter2_record'
                  const currentId = fight[idField]
                  return (
                    <div key={side} className="space-y-2">
                      <label className="label text-xs">Fighter {side}</label>
                      {/* Sélecteur fighter depuis la BDD */}
                      <select className="input text-sm"
                        value={currentId ?? ''}
                        onChange={e => e.target.value ? switchFighter(fight.id, side, e.target.value) : updateFight(fight.id, idField, null)}>
                        <option value="">{fr ? '— Non lié —' : '— Unlinked —'}</option>
                        {allFighters.map(f => (
                          <option key={f.id} value={f.id}>{f.name} ({f.wins}-{f.losses}-{f.draws})</option>
                        ))}
                      </select>
                      {/* Nom (éditable si non lié) */}
                      <input className="input text-sm" placeholder={fr ? 'Nom du fighter' : 'Fighter name'}
                        value={fight[nameField]}
                        onChange={e => updateFight(fight.id, nameField, e.target.value)} />
                      {/* Record */}
                      <input className="input text-sm" placeholder="27-1"
                        value={fight[recordField] ?? ''}
                        onChange={e => updateFight(fight.id, recordField, e.target.value)} />
                    </div>
                  )
                })}
              </div>

              {/* Catégorie & rounds */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">{fr ? 'Catégorie' : 'Division'}</label>
                  <select className="input text-sm" value={fight.weight_class}
                    onChange={e => updateFight(fight.id, 'weight_class', e.target.value)}>
                    {WEIGHT_CLASSES.map(w => <option key={w}>{w}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Rounds</label>
                  <select className="input text-sm" value={fight.scheduled_rounds}
                    onChange={e => updateFight(fight.id, 'scheduled_rounds', Number(e.target.value))}>
                    <option value={3}>3</option>
                    <option value={5}>5</option>
                  </select>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Save */}
      {msg && <p className="text-emerald-400 text-sm">{msg}</p>}
      <button onClick={handleSave} disabled={saving}
        className="btn-gold w-full py-4 text-base disabled:opacity-50">
        {saving ? (fr ? 'Sauvegarde...' : 'Saving...') : (fr ? 'Sauvegarder les modifications' : 'Save changes')}
      </button>
    </div>
  )
}
