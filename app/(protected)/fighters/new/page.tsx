import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import FighterForm from '@/components/fighters/FighterForm'
import { getLocale } from '@/lib/i18n/server'
import { translations } from '@/lib/i18n/translations'

export default async function NewFighterPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user!.id).single()
  if (!profile?.is_admin) redirect('/dashboard')
  const locale = getLocale()
  const t = translations[locale]
  const fr = locale === 'fr'

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/fighters" className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">
          {t.nav.fighters}
        </Link>
        <span className="text-white/20 text-xs">/</span>
        <span className="text-white/60 text-xs uppercase tracking-widest">{fr ? 'Nouveau' : 'New'}</span>
      </div>
      <h1 className="font-display text-5xl tracking-wider mb-8">
        {fr ? 'NOUVEAU COMBATTANT' : 'NEW FIGHTER'}
      </h1>
      <FighterForm locale={locale} />
    </div>
  )
}
