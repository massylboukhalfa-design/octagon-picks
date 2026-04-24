import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const WEIGHT_CLASSES = [
  'Heavyweight','Light Heavyweight','Middleweight','Welterweight',
  'Lightweight','Featherweight','Bantamweight','Flyweight',
  "Women's Featherweight","Women's Bantamweight","Women's Flyweight","Women's Strawweight",
]

export async function POST(req: NextRequest) {
  const { events } = await req.json()
  if (!Array.isArray(events)) return NextResponse.json({ error: 'events must be an array' }, { status: 400 })

  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let events_inserted = 0
  let fights_inserted = 0
  let fighters_linked = 0
  let fighters_created = 0
  const errors: string[] = []

  for (const ev of events) {
    try {
      const { data: event, error: evErr } = await db
        .from('ufc_events')
        .insert({
          name: ev.name,
          date: ev.date,
          location: ev.location ?? null,
          prediction_deadline: ev.prediction_deadline ?? ev.date,
          status: ev.status ?? 'upcoming',
        })
        .select().single()

      if (evErr || !event) { errors.push(`Event "${ev.name}": ${evErr?.message}`); continue }
      events_inserted++

      for (let i = 0; i < (ev.fights ?? []).length; i++) {
        const f = ev.fights[i]
        try {
          // Auto-lier ou créer fighter1
          let fighter1_id: string | null = null
          if (f.fighter1_name) {
            const { data: existing } = await db
              .from('fighters').select('id').ilike('name', f.fighter1_name.trim()).single()
            if (existing) {
              fighter1_id = existing.id
              fighters_linked++
            } else {
              const { data: created } = await db
                .from('fighters')
                .insert({ name: f.fighter1_name.trim(), wins: 0, losses: 0, draws: 0, wins_ko: 0, wins_sub: 0, wins_dec: 0, is_champion: false })
                .select('id').single()
              if (created) { fighter1_id = created.id; fighters_created++ }
            }
          }

          // Auto-lier ou créer fighter2
          let fighter2_id: string | null = null
          if (f.fighter2_name) {
            const { data: existing } = await db
              .from('fighters').select('id').ilike('name', f.fighter2_name.trim()).single()
            if (existing) {
              fighter2_id = existing.id
              fighters_linked++
            } else {
              const { data: created } = await db
                .from('fighters')
                .insert({ name: f.fighter2_name.trim(), wins: 0, losses: 0, draws: 0, wins_ko: 0, wins_sub: 0, wins_dec: 0, is_champion: false })
                .select('id').single()
              if (created) { fighter2_id = created.id; fighters_created++ }
            }
          }

          const { error: fightErr } = await db.from('fights').insert({
            event_id: event.id,
            fighter1_name: f.fighter1_name,
            fighter2_name: f.fighter2_name,
            fighter1_id,
            fighter2_id,
            fighter1_record: f.fighter1_record ?? null,
            fighter2_record: f.fighter2_record ?? null,
            weight_class: f.weight_class ?? 'Heavyweight',
            scheduled_rounds: f.scheduled_rounds ?? 3,
            is_main_event: f.is_main_event ?? false,
            card_order: ev.fights.length - i,
          })
          if (fightErr) errors.push(`Fight "${f.fighter1_name} vs ${f.fighter2_name}": ${fightErr.message}`)
          else fights_inserted++
        } catch (e: any) {
          errors.push(`Fight error: ${e.message}`)
        }
      }
    } catch (e: any) {
      errors.push(`Event error: ${e.message}`)
    }
  }

  return NextResponse.json({ events_inserted, fights_inserted, fighters_linked, fighters_created, errors })
}
