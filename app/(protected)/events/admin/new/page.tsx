import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NewEventForm from '@/components/events/NewEventForm'
import { getLocale } from '@/lib/i18n/server'
import { translations } from '@/lib/i18n/translations'

export default async function NewEventPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user!.id).single()
  if (!profile?.is_admin) redirect('/events')
  const locale = getLocale()
  const t = translations[locale]
  const fr = locale === 'fr'

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/events" className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">
          {t.nav.events}
        </Link>
        <span className="text-white/20 text-xs">/</span>
        <span className="text-white/60 text-xs uppercase tracking-widest">{fr ? 'Nouveau' : 'New'}</span>
      </div>
      <h1 className="font-display text-5xl tracking-wider mb-8">
        {fr ? 'NOUVEL ÉVÉNEMENT' : 'NEW EVENT'}
      </h1>
      <NewEventForm locale={locale} />
    </div>
  )
}
