import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import CreateDraftSeasonForm from '@/components/draft/CreateDraftSeasonForm'
import { getLocale } from '@/lib/i18n/server'

export default async function NewDraftSeasonPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const locale = getLocale()
  const isFr = locale === 'fr'

  const { data: league } = await supabase.from('leagues').select('*').eq('id', params.id).single()
  if (!league) notFound()
  if (league.owner_id !== user!.id) redirect(`/leagues/${params.id}/draft`)

  // Events disponibles (upcoming ou active, non encore dans une saison de cette ligue)
  const { data: events } = await supabase
    .from('ufc_events')
    .select('id, name, date, location')
    .in('status', ['upcoming', 'active'])
    .order('date', { ascending: true })

  return (
    <div className="max-w-2xl animate-fade-in space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/leagues/${params.id}/draft`} className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">
          Draft
        </Link>
        <span className="text-white/20 text-xs">/</span>
        <span className="text-white/60 text-xs uppercase tracking-widest">
          {isFr ? 'Nouvelle saison' : 'New season'}
        </span>
      </div>
      <h1 className="font-display text-4xl tracking-wider">
        {isFr ? 'CRÉER UNE SAISON' : 'CREATE A SEASON'}
      </h1>
      <CreateDraftSeasonForm
        leagueId={params.id}
        userId={user!.id}
        events={events ?? []}
        locale={locale}
      />
    </div>
  )
}
