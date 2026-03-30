import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body = await request.json()
  const { fighters } = body

  if (!Array.isArray(fighters) || fighters.length === 0) {
    return NextResponse.json({ error: 'fighters doit être un tableau non vide' }, { status: 400 })
  }

  const results = { inserted: 0, updated: 0, errors: [] as string[] }

  for (const f of fighters) {
    if (!f.name) { results.errors.push('Fighter sans nom ignoré'); continue }

    const payload = {
      name: f.name,
      nickname: f.nickname ?? null,
      country: f.country ?? null,
      country_flag: f.country_flag ?? null,
      wins: Number(f.wins ?? 0),
      losses: Number(f.losses ?? 0),
      draws: Number(f.draws ?? 0),
      no_contests: Number(f.no_contests ?? 0),
      wins_ko: Number(f.wins_ko ?? 0),
      wins_sub: Number(f.wins_sub ?? 0),
      wins_dec: Number(f.wins_dec ?? 0),
      height_cm: f.height_cm ? Number(f.height_cm) : null,
      weight_kg: f.weight_kg ? Number(f.weight_kg) : null,
      reach_cm: f.reach_cm ? Number(f.reach_cm) : null,
      stance: f.stance ?? null,
      weight_class: f.weight_class ?? null,
      ranking: f.ranking ? Number(f.ranking) : null,
      is_champion: Boolean(f.is_champion ?? false),
      photo_url: f.photo_url ?? null,
    }

    const { data: existing } = await supabase
      .from('fighters')
      .select('id')
      .eq('name', f.name)
      .single()

    if (existing) {
      const { error } = await supabase.from('fighters').update(payload).eq('id', existing.id)
      if (error) results.errors.push(`${f.name}: ${error.message}`)
      else results.updated++
    } else {
      const { error } = await supabase.from('fighters').insert(payload)
      if (error) results.errors.push(`${f.name}: ${error.message}`)
      else results.inserted++
    }
  }

  return NextResponse.json(results)
}
