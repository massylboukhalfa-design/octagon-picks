import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import ImportFighters from '@/components/fighters/ImportFighters'
import { getLocale } from '@/lib/i18n/server'
import { translations } from '@/lib/i18n/translations'

export default async function FightersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const locale = getLocale()
  const t = translations[locale]

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user!.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const { data: fighters } = await supabase.from('fighters').select('*').order('name')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/dashboard" className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">{t.nav.dashboard}</Link>
            <span className="text-white/20 text-xs">/</span>
            <span className="text-white/60 text-xs uppercase tracking-widest">{t.nav.fighters}</span>
          </div>
          <h1 className="font-display text-5xl tracking-wider">{t.nav.fighters.toUpperCase()}</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/fighters/enrich" className="btn-secondary text-sm py-2">🖼 {locale === 'fr' ? 'Photos' : 'Photos'}</Link>
          <Link href="/fighters/new" className="btn-gold text-sm py-2">+ {locale === 'fr' ? 'Ajouter' : 'Add fighter'}</Link>
        </div>
      </div>

      <span className="text-white/40 font-mono text-sm">
        {fighters?.length ?? 0} {locale === 'fr' ? 'combattant(s)' : 'fighters'}
      </span>

      <ImportFighters />

      {(!fighters || fighters.length === 0) ? (
        <div className="text-center py-16">
          <p className="font-display text-3xl text-white/20 mb-3">
            {locale === 'fr' ? 'AUCUN COMBATTANT' : 'NO FIGHTERS'}
          </p>
          <p className="text-white/40 text-sm mb-6">
            {locale === 'fr' ? 'Commence par ajouter les fighters de tes events' : 'Start by adding fighters for your events'}
          </p>
          <Link href="/fighters/new" className="btn-primary">
            {locale === 'fr' ? 'Ajouter un combattant' : 'Add a fighter'}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {fighters.map((fighter: any) => (
            <Link key={fighter.id} href={`/fighters/${fighter.id}`} className="card-hover group text-center">
              <div className="w-20 h-20 mx-auto mb-3 bg-octagon-700 border border-octagon-600 overflow-hidden rounded-full">
                {fighter.photo_url ? (
                  <img src={fighter.photo_url} alt={fighter.name} className="w-full h-full object-cover object-top" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-display text-2xl text-white/20">{fighter.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="font-display text-lg tracking-wider group-hover:text-blood-400 transition-colors leading-tight">{fighter.name}</div>
              {fighter.nickname && <div className="text-white/40 text-xs italic mt-0.5">"{fighter.nickname}"</div>}
              <div className="flex items-center justify-center gap-1 mt-2">
                {fighter.country_flag && <span className="text-base">{fighter.country_flag}</span>}
                {fighter.is_champion && <span className="badge-gold text-xs">C</span>}
              </div>
              <div className="text-white/40 font-mono text-xs mt-2">{fighter.wins}-{fighter.losses}-{fighter.draws}</div>
              {/* Physique avec conversion pour US */}
              <div className="text-white/25 text-xs mt-1 space-y-0.5">
                {fighter.height_cm && (
                  <div>
                    {locale === 'fr'
                      ? `${fighter.height_cm} cm`
                      : (() => { const totalIn = Math.round(fighter.height_cm / 2.54); return `${Math.floor(totalIn/12)}'${totalIn%12}"` })()}
                  </div>
                )}
                {fighter.weight_kg && (
                  <div>
                    {locale === 'fr'
                      ? `${fighter.weight_kg} kg`
                      : `${Math.round(fighter.weight_kg * 2.20462)} lbs`}
                  </div>
                )}
              </div>
              {fighter.weight_class && <div className="text-white/30 text-xs mt-1 truncate">{fighter.weight_class}</div>}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
