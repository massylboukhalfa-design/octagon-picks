import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import ResultsForm from '@/components/events/ResultsForm'

export default async function EventResultsPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user!.id).single()
  if (!profile?.is_admin) redirect('/events')

  const { data: event } = await supabase.from('ufc_events').select('*').eq('id', params.id).single()
  if (!event) notFound()

  const { data: fights } = await supabase
    .from('fights')
    .select('*, fight_results(*)')
    .eq('event_id', params.id)
    .order('is_main_event', { ascending: false })
    .order('card_order', { ascending: false })

  return (
    <div className="max-w-3xl animate-fade-in">
      <h1 className="font-display text-4xl tracking-wider mb-2">SAISIR LES RÉSULTATS</h1>
      <p className="text-octagon-600 mb-8">{event.name}</p>
      <ResultsForm eventId={params.id} fights={fights ?? []} />
    </div>
  )
}
