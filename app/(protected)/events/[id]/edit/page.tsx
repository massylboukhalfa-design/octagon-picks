import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getLocale } from '@/lib/i18n/server'
import EventEditForm from '@/components/events/EventEditForm'

export default async function EventEditPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const locale = getLocale()
  const fr = locale === 'fr'

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user!.id).single()
  if (!profile?.is_admin) redirect('/events')

  const { data: event } = await supabase
    .from('ufc_events').select('*').eq('id', params.id).single()
  if (!event) notFound()

  const { data: fights } = await supabase
    .from('fights')
    .select('*, fight_results(id)')
    .eq('event_id', params.id)
    .order('card_order', { ascending: false })

  const { data: fighters } = await supabase
    .from('fighters')
    .select('id, name, wins, losses, draws, weight_class, country_flag')
    .order('name')

  return (
    <div className="max-w-4xl animate-fade-in space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/events/${params.id}`}
          className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">
          {fr ? '← Retour' : '← Back'}
        </Link>
      </div>
      <div>
        <h1 className="font-display text-4xl tracking-wider">
          {fr ? "MODIFIER L'ÉVÉNEMENT" : 'EDIT EVENT'}
        </h1>
        <p className="text-white/40 mt-1">{event.name}</p>
      </div>
      <EventEditForm
        event={event}
        fights={fights ?? []}
        allFighters={fighters ?? []}
        locale={locale}
      />
    </div>
  )
}
