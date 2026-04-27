import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import CreateLeagueFlow from '@/components/leagues/CreateLeagueFlow'
import JoinLeagueForm from '@/components/leagues/JoinLeagueForm'
import { getLocale } from '@/lib/i18n/server'
import { translations } from '@/lib/i18n/translations'

export default async function LeaguesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const locale = getLocale()
  const t = translations[locale]
  const fr = locale === 'fr'

  const { data: myLeagues } = await supabase
    .from('league_members')
    .select('joined_at, leagues(id, name, description, invite_code, owner_id, mode, league_members(count))')
    .eq('user_id', user!.id)
    .order('joined_at', { ascending: false })

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-5xl tracking-wider">{t.leagues.title}</h1>
        <span className="text-white/40 font-mono text-sm">
          {myLeagues?.length ?? 0} {fr ? 'ligue(s)' : 'league(s)'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CreateLeagueFlow userId={user!.id} />
        <JoinLeagueForm userId={user!.id} />
      </div>

      <div className="divider" />

      {myLeagues && myLeagues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myLeagues.map((m: any) => {
            const league = m.leagues
            const isOwner = league.owner_id === user!.id
            const isDraft = league.mode === 'draft'
            return (
              <Link key={league.id} href={`/leagues/${league.id}`} className="card-hover group">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-display text-2xl tracking-wider group-hover:text-blood-400 transition-colors">
                    {league.name}
                  </h3>
                  <div className="flex gap-2 flex-shrink-0">
                    {isOwner && <span className="badge-gold text-xs">OWNER</span>}
                    <span className={`text-xs px-2 py-0.5 border font-semibold ${
                      isDraft
                        ? 'border-gold-500/50 text-gold-400'
                        : 'border-blood-500/50 text-blood-400'
                    }`}>
                      {isDraft ? '🏆 Draft' : '🎯 ' + (fr ? 'Prono' : 'Prono')}
                    </span>
                  </div>
                </div>
                {league.description && (
                  <p className="text-white/40 text-sm mb-3 tracking-wide">{league.description}</p>
                )}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-white/40 text-xs font-mono">
                    {league.league_members?.[0]?.count ?? 0} {t.leagues.members}
                  </span>
                  <span className="text-white/40 font-mono text-xs tracking-widest border border-octagon-600 px-2 py-0.5">
                    {league.invite_code}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="font-display text-3xl text-white/20 mb-2">
            {fr ? 'AUCUNE LIGUE' : 'NO LEAGUES'}
          </p>
          <p className="text-white/40 text-sm">{t.dashboard.joinOrCreate}</p>
        </div>
      )}
    </div>
  )
}
