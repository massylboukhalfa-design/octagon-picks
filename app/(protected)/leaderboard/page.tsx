import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getLocale } from '@/lib/i18n/server'
import { translations } from '@/lib/i18n/translations'

export default async function LeaderboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const locale = getLocale()
  const t = translations[locale]

  const { data: leaderboard } = await supabase
    .from('global_leaderboard')
    .select('*')
    .order('total_points', { ascending: false })
    .limit(100)

  const myRank = leaderboard?.findIndex(e => e.user_id === user?.id)

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link href="/dashboard" className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">
            {t.nav.dashboard}
          </Link>
          <span className="text-white/20 text-xs">/</span>
          <span className="text-white/60 text-xs uppercase tracking-widest">{t.nav.leaderboard}</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-5xl tracking-wider">{t.leaderboard.title}</h1>
            <p className="text-white/40 text-sm mt-1">{t.leaderboard.subtitle}</p>
          </div>
          {myRank !== undefined && myRank >= 0 && (
            <div className="text-right">
              <div className="font-display text-4xl text-gold-400">#{myRank + 1}</div>
              <div className="text-white/40 text-xs uppercase tracking-widest">{t.dashboard.rank}</div>
            </div>
          )}
        </div>
      </div>

      {(!leaderboard || leaderboard.length === 0) ? (
        <div className="text-center py-16">
          <p className="font-display text-3xl text-white/20">{t.leaderboard.empty}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry: any, i: number) => {
            const isMe = entry.user_id === user?.id
            const medal = i === 0 ? 'text-gold-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-white/30'

            return (
              <Link
                key={entry.user_id}
                href={`/profil/${entry.user_id}`}
                className={`flex items-center gap-4 p-4 border transition-all ${
                  i === 0 ? 'border-gold-500/50 bg-yellow-950/20 hover:bg-yellow-950/30' :
                  i === 1 ? 'border-octagon-500 bg-octagon-700 hover:bg-octagon-600' :
                  i === 2 ? 'border-octagon-600 bg-octagon-700 hover:bg-octagon-600' :
                  'border-octagon-700 bg-octagon-800 hover:bg-octagon-700'
                } ${isMe ? 'border-l-2 border-l-blood-500' : ''}`}
              >
                {/* Rang */}
                <div className={`font-display text-2xl w-8 text-center flex-shrink-0 ${medal}`}>
                  {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden border border-octagon-600 bg-octagon-700 flex-shrink-0">
                  {entry.avatar_url ? (
                    <img src={entry.avatar_url} alt={entry.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-display text-lg text-white/20">{entry.username?.charAt(0)?.toUpperCase()}</span>
                    </div>
                  )}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold tracking-wide flex items-center gap-2">
                    {entry.username}
                    {isMe && <span className="badge-red text-xs">{t.leagues.you}</span>}
                  </div>
                  <div className="flex gap-3 mt-0.5 text-xs text-white/40">
                    <span>✓ {entry.correct_winners} {t.leaderboard.correct.toLowerCase()}</span>
                    <span>🎯 {entry.perfect_picks} {t.leaderboard.perfect.toLowerCase()}</span>
                    <span className="hidden sm:inline">{entry.total_predictions} {t.leaderboard.predictions.toLowerCase()}</span>
                  </div>
                </div>

                {/* Points */}
                <div className={`font-display text-3xl flex-shrink-0 ${i === 0 ? 'text-gold-400' : 'text-white'}`}>
                  {entry.total_points}
                  <span className="text-sm text-white/40 ml-1 font-body">{t.dashboard.points}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
