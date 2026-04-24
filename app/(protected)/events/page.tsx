import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import ImportEvents from '@/components/events/ImportEvents'
import { getLocale } from '@/lib/i18n/server'
import { translations } from '@/lib/i18n/translations'

export default async function EventsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const locale = getLocale()
  const t = translations[locale]
  const dateLocale = locale === 'fr' ? fr : enUS

  const { data: events } = await supabase
    .from('ufc_events')
    .select('*, fights(count)')
    .order('date', { ascending: false })

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user!.id)
    .single()

  const upcoming = events?.filter(e => e.status === 'upcoming') ?? []
  const past = events?.filter(e => e.status !== 'upcoming') ?? []

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-5xl tracking-wider">{t.events.title}</h1>
        {profile?.is_admin && (
          <div className="flex gap-2">
            <Link href="/events/admin/import" className="btn-secondary text-sm py-2">
              ↓ {locale === 'fr' ? 'Import auto' : 'Auto import'}
            </Link>
            <Link href="/events/admin/new" className="btn-gold text-sm py-2">
              + {locale === 'fr' ? 'Créer manuellement' : 'Create manually'}
            </Link>
          </div>
        )}
      </div>

      {profile?.is_admin && <ImportEvents locale={locale} />}

      {upcoming.length > 0 && (
        <div>
          <h2 className="font-display text-2xl tracking-wider text-blood-400 mb-4">{t.events.upcoming}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map((event: any) => (
              <EventCard key={event.id} event={event} highlight dateLocale={dateLocale} locale={locale} t={t} isAdmin={profile?.is_admin ?? false} />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="font-display text-2xl tracking-wider text-white/40 mb-4">{t.events.past}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {past.map((event: any) => (
              <EventCard key={event.id} event={event} highlight={false} dateLocale={dateLocale} locale={locale} t={t} isAdmin={profile?.is_admin ?? false} />
            ))}
          </div>
        </div>
      )}

      {(!events || events.length === 0) && (
        <div className="text-center py-16">
          <p className="font-display text-3xl text-white/20">
            {locale === 'fr' ? 'AUCUN ÉVÉNEMENT' : 'NO EVENTS'}
          </p>
        </div>
      )}
    </div>
  )
}

function EventCard({ event, highlight, dateLocale, locale, t, isAdmin }: any) {
  const fightCount = event.fights?.[0]?.count ?? 0
  const isCompleted = event.status === 'completed'
  const isLocked = event.status === 'locked'
  const deadlinePassed = new Date() > new Date(event.prediction_deadline)
  const fr = locale === 'fr'

  return (
    <div className={`card ${highlight ? 'border-blood-500/30' : ''}`}>
      <Link href={`/events/${event.id}`} className="block hover:opacity-90 transition-opacity">
        <div className="flex items-start justify-between mb-3">
          <div>
            {isCompleted && <span className="badge-gray text-xs mb-2 inline-flex">{fr ? 'TERMINÉ' : 'COMPLETED'}</span>}
            {isLocked && <span className="badge-gray text-xs mb-2 inline-flex">{fr ? 'FERMÉ' : 'LOCKED'}</span>}
            {!isCompleted && !isLocked && !deadlinePassed && <span className="badge-red text-xs mb-2 inline-flex">{fr ? 'OUVERT' : 'OPEN'}</span>}
            {!isCompleted && !isLocked && deadlinePassed && <span className="badge-gray text-xs mb-2 inline-flex">{fr ? 'DEADLINE PASSÉE' : 'DEADLINE PASSED'}</span>}
          </div>
          <span className="text-white/30 text-xs font-mono">{fightCount} {fr ? 'combats' : 'fights'}</span>
        </div>
        <h3 className="font-display text-xl tracking-wider mb-1 leading-tight">{event.name}</h3>
        <p className="text-white/40 text-xs">
          {format(new Date(event.date), fr ? 'd MMM yyyy' : 'MMM d, yyyy', { locale: dateLocale })} · {event.location}
        </p>
        {!isCompleted && (
          <p className="text-white/30 text-xs mt-2">
            {t.events.deadline} : {format(new Date(event.prediction_deadline), fr ? "d MMM à HH'h'mm" : "MMM d 'at' h:mm a", { locale: dateLocale })}
          </p>
        )}
      </Link>
      {isAdmin && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-octagon-700">
          <Link href={`/events/${event.id}/edit`}
            className="text-xs text-white/40 hover:text-white border border-octagon-600 hover:border-octagon-500 px-2 py-1 transition-all">
            ✏️ {fr ? 'Modifier' : 'Edit'}
          </Link>
          <Link href={`/events/${event.id}/results`}
            className="text-xs text-white/40 hover:text-gold-400 border border-octagon-600 hover:border-gold-500/50 px-2 py-1 transition-all">
            🏆 {fr ? 'Résultats' : 'Results'}
          </Link>
        </div>
      )}
    </div>
  )
}
