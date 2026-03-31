import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body = await request.json()
  const { events } = body

  if (!Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ error: 'events doit être un tableau non vide' }, { status: 400 })
  }

  const results = {
    events_inserted: 0,
    fights_inserted: 0,
    fighters_linked: 0,
    fighters_created: 0,
    errors: [] as string[],
  }

  for (const ev of events) {
    if (!ev.name || !ev.date || !ev.prediction_deadline) {
      results.errors.push(`Event "${ev.name ?? 'sans nom'}" ignoré — champs obligatoires manquants (name, date, prediction_deadline)`)
      continue
    }

    // Créer l'event
    const { data: event, error: evErr } = await supabase
      .from('ufc_events')
      .insert({
        name: ev.name,
        date: ev.date,
        location: ev.location ?? 'À définir',
        prediction_deadline: ev.prediction_deadline,
        status: ev.status ?? 'upcoming',
      })
      .select()
      .single()

    if (evErr || !event) {
      results.errors.push(`Event "${ev.name}" : ${evErr?.message}`)
      continue
    }

    results.events_inserted++

    // Traiter les combats
    const fights = ev.fights ?? []
    for (let i = 0; i < fights.length; i++) {
      const fight = fights[i]
      if (!fight.fighter1_name || !fight.fighter2_name) {
        results.errors.push(`Combat ignoré dans "${ev.name}" — fighters manquants`)
        continue
      }

      // Résoudre fighter1
      const { id: f1id, created: f1created } = await resolveFighter(supabase, {
        name: fight.fighter1_name,
        record: fight.fighter1_record,
        weight_class: fight.weight_class,
      })
      if (f1created) results.fighters_created++
      else if (f1id) results.fighters_linked++

      // Résoudre fighter2
      const { id: f2id, created: f2created } = await resolveFighter(supabase, {
        name: fight.fighter2_name,
        record: fight.fighter2_record,
        weight_class: fight.weight_class,
      })
      if (f2created) results.fighters_created++
      else if (f2id) results.fighters_linked++

      // Insérer le combat
      const { error: fightErr } = await supabase.from('fights').insert({
        event_id: event.id,
        fighter1_name: fight.fighter1_name,
        fighter2_name: fight.fighter2_name,
        fighter1_id: f1id ?? null,
        fighter2_id: f2id ?? null,
        fighter1_record: fight.fighter1_record ?? null,
        fighter2_record: fight.fighter2_record ?? null,
        weight_class: fight.weight_class ?? null,
        scheduled_rounds: fight.scheduled_rounds ?? 3,
        is_main_event: fight.is_main_event ?? false,
        card_order: fights.length - i,
      })

      if (fightErr) results.errors.push(`Combat ${fight.fighter1_name} vs ${fight.fighter2_name} : ${fightErr.message}`)
      else results.fights_inserted++
    }
  }

  return NextResponse.json(results)
}

// Cherche un fighter par nom exact, sinon le crée avec les infos disponibles
async function resolveFighter(
  supabase: any,
  { name, record, weight_class }: { name: string; record?: string; weight_class?: string }
): Promise<{ id: string | null; created: boolean }> {
  // Chercher par nom exact
  const { data: existing } = await supabase
    .from('fighters')
    .select('id')
    .ilike('name', name.trim())
    .single()

  if (existing) return { id: existing.id, created: false }

  // Parser le record "27-1-0" ou "27-1"
  let wins = 0, losses = 0, draws = 0
  if (record) {
    const parts = record.replace(/\s/g, '').split('-')
    wins   = parseInt(parts[0] ?? '0') || 0
    losses = parseInt(parts[1] ?? '0') || 0
    draws  = parseInt(parts[2] ?? '0') || 0
  }

  // Créer le fighter avec les infos minimales
  const { data: created, error } = await supabase
    .from('fighters')
    .insert({
      name: name.trim(),
      wins,
      losses,
      draws,
      no_contests: 0,
      wins_ko: 0,
      wins_sub: 0,
      wins_dec: 0,
      weight_class: weight_class ?? null,
      is_champion: false,
    })
    .select('id')
    .single()

  if (error || !created) return { id: null, created: false }
  return { id: created.id, created: true }
}
