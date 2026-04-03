import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { getLocale } from '@/lib/i18n/server'
import { translations } from '@/lib/i18n/translations'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const locale = getLocale()
  const t = translations[locale]
  const dateLocale = locale === 'fr' ? fr : enUS

  const [{ data: profile }, { data: leagues }, { data: nextEvent }, { data: recentPredictions }] =
    await Promise.all([
      supabase.from('profiles').select('username').eq('id', user!.id).single(),
      supabase.from('league_members').select('leagues(id, name)').eq('user_id', user!.id).limit(5),
      supabase.from('ufc_events').select('*').eq('status', 'upcoming').order('date').limit(1).single(),
      supabase.from('predictions')
        .select('*, fights(fighter1_name, fighter2_name, ufc_events(name))')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

  const userLeagues = (leagues ?? []).map((m: any) => m.leagues).filter(Boolean)

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <p className="text-white/40 text-sm uppercase tracking-widest mb-1">
          {locale === 'fr' ? 'Bienvenue,' : 'Welcome,'}
        </p>
        <h1 className="font-display text-5xl tracking-wider">
          {profile?.username ?? 'Champion'}
        </h1>
      </div>

      {nextEvent && (
        <div className="relative bg-octagon-800 border border-blood-500 p-6 overflow-hidden glow-red">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blood-500 opacity-5 blur-3xl" />
          <div className="badge-red mb-3 inline-flex">
            {locale === 'fr' ? 'PROCHAIN ÉVÉNEMENT' : 'NEXT EVENT'}
          </div>
          <h2 className="font-display text-3xl tracking-wider mb-1">{nextEvent.name}</h2>
          <p className="text-white/40 text-sm tracking-wide mb-4">
            {format(new Date(nextEvent.date), locale === 'fr' ? "d MMMM yyyy — HH'h'mm" : "MMMM d, yyyy — h:mm a", { locale: dateLocale })} · {nextEvent.location}
          </p>
          <p className="text-white/40 text-xs mb-4">
            {locale === 'fr' ? 'Deadline pronostics :' : 'Prediction deadline:'}{' '}
            <span className="text-gold-400">
              {format(new Date(nextEvent.prediction_deadline), locale === 'fr' ? "d MMM yyyy à HH'h'mm" : "MMM d, yyyy 'at' h:mm a", { locale: dateLocale })}
            </span>
          </p>
          <Link href={`/events/${nextEvent.id}`} className="btn-primary inline-flex">
            {locale === 'fr' ? 'Voir les combats →' : 'View fights →'}
          </Link>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Ligues */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-wider">{t.dashboard.myLeagues}</h2>
            <Link href="/leagues" className="text-white/40 text-xs hover:text-white transition-colors uppercase tracking-widest">
              {locale === 'fr' ? 'Voir tout →' : 'View all →'}
            </Link>
          </div>
          {userLeagues.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-white/40 text-sm mb-4">{t.dashboard.joinOrCreate}</p>
              <div className="flex gap-2 justify-center">
                <Link href="/leagues" className="btn-primary text-sm py-2">{t.dashboard.createLeague}</Link>
                <Link href="/leagues" className="btn-secondary text-sm py-2">{t.dashboard.joinLeague}</Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {userLeagues.map((league: any) => (
                <Link key={league.id} href={`/leagues/${league.id}`}
                  className="flex items-center justify-between p-3 bg-octagon-700 border border-octagon-600 hover:border-blood-500/50 transition-all">
                  <span className="font-semibold text-sm">{league.name}</span>
                  <span className="text-white/30 text-xs">→</span>
                </Link>
              ))}
              <Link href="/leagues" className="block text-center text-white/40 text-xs hover:text-white transition-colors pt-2 uppercase tracking-widest">
                {locale === 'fr' ? '+ Rejoindre une ligue' : '+ Join a league'}
              </Link>
            </div>
          )}
        </div>

        {/* Pronostics récents */}
        <div className="card space-y-4">
          <h2 className="font-display text-2xl tracking-wider">{t.dashboard.myPredictions}</h2>
          {(!recentPredictions || recentPredictions.length === 0) ? (
            <div className="text-center py-6">
              <p className="text-white/40 text-sm">
                {locale === 'fr' ? 'Aucun pronostic pour l\'instant' : 'No predictions yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentPredictions.map((pred: any) => {
                const fight = pred.fights
                const event = fight?.ufc_events
                return (
                  <div key={pred.id} className="p-3 bg-octagon-700 border border-octagon-600 text-sm">
                    <div className="text-white/40 text-xs mb-1">{event?.name}</div>
                    <div className="font-semibold">
                      {fight?.fighter1_name} vs {fight?.fighter2_name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white/40 text-xs">
                        {locale === 'fr' ? 'Pronostic :' : 'Pick:'}{' '}
                        {pred.predicted_winner === 'fighter1' ? fight?.fighter1_name
                          : pred.predicted_winner === 'fighter2' ? fight?.fighter2_name
                          : (locale === 'fr' ? 'Match nul' : 'Draw')}
                      </span>
                      {pred.points_earned !== null && (
                        <span className={`font-mono text-xs ${pred.points_earned === 30 ? 'text-gold-400' : pred.points_earned > 0 ? 'text-emerald-400' : 'text-white/30'}`}>
                          {pred.points_earned} {t.dashboard.points}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
