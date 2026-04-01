import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ResultsForm from '@/components/events/ResultsForm'
import { getLocale } from '@/lib/i18n/server'

export default async function EventResultsPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const locale = getLocale()

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user!.id).single()
  if (!profile?.is_admin) redirect('/events')

  const { data: event } = await supabase.from('ufc_events').select('*').eq('id', params.id).single()
  if (!event) notFound()

  const { data: fights } = await supabase
    .from('fights').select('*, fight_results(*)')
    .eq('event_id', params.id)
    .order('is_main_event', { ascending: false })
    .order('card_order', { ascending: false })

  return (
    <div className="max-w-3xl animate-fade-in">
      <h1 className="font-display text-4xl tracking-wider mb-2">
        {locale === 'fr' ? 'SAISIR LES RÉSULTATS' : 'ENTER RESULTS'}
      </h1>
      <p className="text-white/40 mb-8">{event.name}</p>
      <ResultsForm eventId={params.id} fights={fights ?? []} locale={locale} />
    </div>
  )
}
