import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import ImportEvents from '@/components/events/ImportEvents'

export default async function EventsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
        <h1 className="font-display text-5xl tracking-wider">ÉVÉNEMENTS UFC</h1>
        {profile?.is_admin && (
          <div className="flex gap-2">
            <Link href="/events/admin/import" className="btn-secondary text-sm py-2">
              ↓ Import auto
            </Link>
            <Link href="/events/admin/new" className="btn-gold text-sm py-2">
              + Créer manuellement
            </Link>
          </div>
        )}
      </div>

      {profile?.is_admin && <ImportEvents />}

      {upcoming.length > 0 && (
        <div>
          <h2 className="font-display text-2xl tracking-wider text-blood-400 mb-4">PROCHAINS ÉVÉNEMENTS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map((event: any) => (
              <EventCard key={event.id} event={event} highlight />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="font-display text-2xl tracking-wider text-white/40 mb-4">HISTORIQUE</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {past.map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {(!events || events.length === 0) && (
        <div className="text-center py-16">
          <p className="font-display text-4xl text-octagon-700 mb-4">AUCUN ÉVÉNEMENT</p>
          <p className="text-white/40 text-sm">Les événements UFC apparaîtront ici</p>
        </div>
      )}
    </div>
  )
}

function EventCard({ event, highlight = false }: { event: any; highlight?: boolean }) {
  const isPast = event.status === 'completed'
  return (
    <Link
      href={`/events/${event.id}`}
      className={`card-hover group ${highlight ? 'border-blood-500/50' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <StatusBadge status={event.status} />
        <span className="text-white/40 font-mono text-xs">
          {event.fights?.[0]?.count ?? 0} combats
        </span>
      </div>
      <h3 className={`font-display text-2xl tracking-wider mb-1 group-hover:text-blood-400 transition-colors ${highlight ? 'text-white' : 'text-white'}`}>
        {event.name}
      </h3>
      <p className="text-white/40 text-sm tracking-wide">
        {format(new Date(event.date), 'd MMMM yyyy', { locale: fr })}
      </p>
      <p className="text-white/40 text-xs mt-1">{event.location}</p>
      {!isPast && event.prediction_deadline && (
        <p className="text-gold-400 text-xs mt-3 font-mono">
          Deadline : {format(new Date(event.prediction_deadline), "d MMM HH'h'mm", { locale: fr })}
        </p>
      )}
    </Link>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'upcoming') return <span className="badge-green">À venir</span>
  if (status === 'locked') return <span className="badge-red">Fermé</span>
  return <span className="badge-gray">Terminé</span>
}
