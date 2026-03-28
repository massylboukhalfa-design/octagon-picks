import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-octagon-600 text-sm uppercase tracking-widest mb-1">Bienvenue,</p>
        <h1 className="font-display text-5xl tracking-wider">
          {profile?.username ?? 'Champion'}
        </h1>
      </div>

      {/* Next event CTA */}
      {nextEvent && (
        <div className="relative bg-octagon-800 border border-blood-500 p-6 overflow-hidden glow-red">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blood-500 opacity-5 blur-3xl" />
          <div className="badge-red mb-3 inline-flex">PROCHAIN ÉVÉNEMENT</div>
          <h2 className="font-display text-3xl tracking-wider mb-1">{nextEvent.name}</h2>
          <p className="text-octagon-600 text-sm tracking-wide mb-4">
            {format(new Date(nextEvent.date), "d MMMM yyyy — HH'h'mm", { locale: fr })} · {nextEvent.location}
          </p>
          <p className="text-octagon-600 text-xs mb-4">
            Deadline pronostics :{' '}
            <span className="text-gold-400">
              {format(new Date(nextEvent.prediction_deadline), "d MMM yyyy à HH'h'mm", { locale: fr })}
            </span>
          </p>
          <Link href={`/events/${nextEvent.id}`} className="btn-primary inline-flex">
            Voir les combats →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mes ligues */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-2xl tracking-wider">MES LIGUES</h3>
            <Link href="/leagues" className="text-blood-400 hover:text-blood-300 text-xs uppercase tracking-widest transition-colors">
              Voir tout →
            </Link>
          </div>
          {leagues && leagues.length > 0 ? (
            <div className="space-y-3">
              {leagues.map((m: any) => (
                <Link
                  key={m.leagues?.id}
                  href={`/leagues/${m.leagues?.id}`}
                  className="flex items-center justify-between p-3 bg-octagon-700 hover:bg-octagon-600 border border-octagon-600 hover:border-blood-500 transition-all"
                >
                  <span className="font-semibold tracking-wide">{m.leagues?.name}</span>
                  <span className="text-octagon-600 text-xs">→</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-octagon-600 text-sm mb-4">Aucune ligue rejointe</p>
              <Link href="/leagues" className="btn-secondary text-xs py-2 px-4">
                Créer ou rejoindre
              </Link>
            </div>
          )}
        </div>

        {/* Derniers pronostics */}
        <div className="card">
          <h3 className="font-display text-2xl tracking-wider mb-5">DERNIERS PRONOSTICS</h3>
          {recentPredictions && recentPredictions.length > 0 ? (
            <div className="space-y-3">
              {recentPredictions.map((p: any) => (
                <div key={p.id} className="p-3 bg-octagon-700 border border-octagon-600">
                  <div className="text-xs text-octagon-600 mb-1">{p.fights?.ufc_events?.name}</div>
                  <div className="font-semibold text-sm tracking-wide">
                    {p.fights?.fighter1_name} vs {p.fights?.fighter2_name}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="badge-gray">{p.predicted_winner === 'fighter1' ? p.fights?.fighter1_name : p.predicted_winner === 'fighter2' ? p.fights?.fighter2_name : 'Draw'}</span>
                    <span className="badge-gray">{p.predicted_method}</span>
                    <span className="badge-gray">R{p.predicted_round}</span>
                    {p.points_earned !== null && (
                      <span className="badge-gold">{p.points_earned} pts</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-octagon-600 text-sm">Aucun pronostic encore posé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
