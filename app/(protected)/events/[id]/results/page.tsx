import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ResultsForm from '@/components/events/ResultsForm'
import BotPredictionsButton from '@/components/admin/BotPredictionsButton'
import DraftPointsButton from '@/components/admin/DraftPointsButton'
import { getLocale } from '@/lib/i18n/server'

export default async function EventResultsPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const locale = getLocale()
  const fr = locale === 'fr'

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
    <div className="max-w-3xl animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-wider mb-2">
          {fr ? 'SAISIR LES RÉSULTATS' : 'ENTER RESULTS'}
        </h1>
        <p className="text-white/40">{event.name}</p>
      </div>

      {/* Bot predictions */}
      <div className="card border-octagon-600 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl tracking-wider">
              {fr ? 'PRONOSTICS BOT' : 'BOT PREDICTIONS'}
            </h2>
            <p className="text-white/40 text-xs mt-1">
              {fr
                ? 'Génère des pronostics aléatoires pour le bot sur cet event'
                : 'Generate random predictions for the bot on this event'}
            </p>
          </div>
          <BotPredictionsButton eventId={params.id} locale={locale} />
        </div>
      </div>

      {/* Draft points */}
      <div className="card border-gold-500/20 space-y-3">
        <DraftPointsButton
          eventId={params.id}
          fights={fights ?? []}
          locale={locale}
        />
      </div>

      {/* Résultats */}
      <ResultsForm eventId={params.id} fights={fights ?? []} locale={locale} />
    </div>
  )
}
