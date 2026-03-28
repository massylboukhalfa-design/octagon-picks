import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import CreateLeagueForm from '@/components/leagues/CreateLeagueForm'
import JoinLeagueForm from '@/components/leagues/JoinLeagueForm'

export default async function LeaguesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: myLeagues } = await supabase
    .from('league_members')
    .select(`
      joined_at,
      leagues (
        id, name, description, invite_code, owner_id,
        league_members(count)
      )
    `)
    .eq('user_id', user!.id)
    .order('joined_at', { ascending: false })

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-5xl tracking-wider">MES LIGUES</h1>
        <span className="text-octagon-600 font-mono text-sm">{myLeagues?.length ?? 0} ligue(s)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CreateLeagueForm userId={user!.id} />
        <JoinLeagueForm userId={user!.id} />
      </div>

      <div className="divider" />

      {myLeagues && myLeagues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myLeagues.map((m: any) => {
            const league = m.leagues
            const isOwner = league.owner_id === user!.id
            return (
              <Link
                key={league.id}
                href={`/leagues/${league.id}`}
                className="card-hover group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-display text-2xl tracking-wider group-hover:text-blood-400 transition-colors">
                    {league.name}
                  </h3>
                  {isOwner && <span className="badge-gold text-xs">ADMIN</span>}
                </div>
                {league.description && (
                  <p className="text-octagon-600 text-sm mb-3 tracking-wide">{league.description}</p>
                )}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-octagon-600 text-xs font-mono">
                    {league.league_members?.[0]?.count ?? 0} membre(s)
                  </span>
                  <span className="text-octagon-600 font-mono text-xs tracking-widest border border-octagon-600 px-2 py-0.5">
                    #{league.invite_code}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="font-display text-4xl text-octagon-700 mb-4">AUCUNE LIGUE</p>
          <p className="text-octagon-600 text-sm tracking-wide">Crée ou rejoins une ligue pour commencer à pronostiquer</p>
        </div>
      )}
    </div>
  )
}
