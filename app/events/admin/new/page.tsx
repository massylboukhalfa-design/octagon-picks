import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewEventForm from '@/components/events/NewEventForm'

export default async function NewEventPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user!.id)
    .single()

  if (!profile?.is_admin) redirect('/events')

  return (
    <div className="max-w-2xl animate-fade-in">
      <h1 className="font-display text-5xl tracking-wider mb-8">NOUVEL ÉVÉNEMENT</h1>
      <NewEventForm />
    </div>
  )
}
