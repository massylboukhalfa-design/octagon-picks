import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ParametresClient from '@/components/settings/ParametresClient'
import { getLocale } from '@/lib/i18n/server'
import { translations } from '@/lib/i18n/translations'

export default async function ParametresPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const locale = getLocale()
  const t = translations[locale]

  const [{ data: profile }, { data: fighters }] = await Promise.all([
    supabase.from('profiles')
      .select('id, username, avatar_url, favorite_fighter_id, notification_email, newsletter_email, created_at')
      .eq('id', user!.id).single(),
    supabase.from('fighters').select('id, name, photo_url, weight_class, country_flag').order('name'),
  ])

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/dashboard" className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">{t.nav.dashboard}</Link>
        <span className="text-white/20 text-xs">/</span>
        <span className="text-white/60 text-xs uppercase tracking-widest">{t.nav.settings}</span>
      </div>
      <h1 className="font-display text-5xl tracking-wider mb-8">{t.settings.title}</h1>
      <ParametresClient
        userId={user!.id}
        email={user!.email ?? ''}
        profile={profile}
        fighters={fighters ?? []}
        locale={locale}
      />
    </div>
  )
}
