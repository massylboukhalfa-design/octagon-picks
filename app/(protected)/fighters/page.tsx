import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function FightersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user!.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard')

  const { data: fighters } = await supabase
    .from('fighters')
    .select('*')
    .order('name')

  const weightClasses = Array.from(new Set((fighters ?? []).map((f: any) => f.weight_class).filter(Boolean)))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/dashboard" className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">Dashboard</Link>
            <span className="text-white/20 text-xs">/</span>
            <span className="text-white/60 text-xs uppercase tracking-widest">Combattants</span>
          </div>
          <h1 className="font-display text-5xl tracking-wider">COMBATTANTS</h1>
        </div>
        <Link href="/fighters/new" className="btn-gold text-sm py-2">
          + Ajouter un combattant
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-white/40 font-mono text-sm">{fighters?.length ?? 0} combattant(s)</span>
      </div>

      {(!fighters || fighters.length === 0) ? (
        <div className="text-center py-16">
          <p className="font-display text-3xl text-white/20 mb-3">AUCUN COMBATTANT</p>
          <p className="text-white/40 text-sm mb-6">Commence par ajouter les fighters de tes events</p>
          <Link href="/fighters/new" className="btn-primary">Ajouter un combattant</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {fighters.map((fighter: any) => (
            <Link
              key={fighter.id}
              href={`/fighters/${fighter.id}`}
              className="card-hover group text-center"
            >
              {/* Photo */}
              <div className="w-20 h-20 mx-auto mb-3 bg-octagon-700 border border-octagon-600 overflow-hidden rounded-full">
                {fighter.photo_url ? (
                  <img
                    src={fighter.photo_url}
                    alt={fighter.name}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-display text-2xl text-white/20">
                      {fighter.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Infos */}
              <div className="font-display text-lg tracking-wider group-hover:text-blood-400 transition-colors leading-tight">
                {fighter.name}
              </div>
              {fighter.nickname && (
                <div className="text-white/40 text-xs italic mt-0.5">"{fighter.nickname}"</div>
              )}
              <div className="flex items-center justify-center gap-1 mt-2">
                {fighter.country_flag && <span className="text-base">{fighter.country_flag}</span>}
                {fighter.is_champion && <span className="badge-gold text-xs">C</span>}
              </div>
              <div className="text-white/40 font-mono text-xs mt-2">
                {fighter.wins}-{fighter.losses}-{fighter.draws}
              </div>
              {fighter.weight_class && (
                <div className="text-white/30 text-xs mt-1 truncate">{fighter.weight_class}</div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
