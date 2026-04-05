import Link from 'next/link'

type Props = {
  leaderboard: any[]
  currentUserId: string
  locale?: string
}

export default function DraftLeaderboard({ leaderboard, currentUserId, locale = 'fr' }: Props) {
  const isFr = locale === 'fr'

  return (
    <div className="card space-y-4">
      <h2 className="font-display text-2xl tracking-wider">
        {isFr ? 'CLASSEMENT' : 'STANDINGS'}
      </h2>
      <div className="space-y-2">
        {leaderboard.map((entry: any, i: number) => {
          const isMe = entry.user_id === currentUserId
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null

          return (
            <div key={entry.user_id}
              className={`flex items-center gap-3 p-3 border transition-all ${
                i === 0 ? 'border-gold-500/50 bg-yellow-950/20' :
                'border-octagon-700 bg-octagon-800'
              } ${isMe ? 'border-l-2 border-l-blood-500' : ''}`}>
              <div className={`font-display text-xl w-8 text-center flex-shrink-0 ${
                i === 0 ? 'text-gold-400' : 'text-white/30'
              }`}>
                {medal ?? entry.rank}
              </div>
              <div className="w-8 h-8 rounded-full overflow-hidden border border-octagon-600 bg-octagon-700 flex-shrink-0">
                {entry.avatar_url ? (
                  <img src={entry.avatar_url} alt={entry.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-display text-sm text-white/20">{entry.username?.charAt(0)?.toUpperCase()}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm flex items-center gap-2">
                  {entry.username}
                  {isMe && <span className="badge-red text-xs">{isFr ? 'Toi' : 'You'}</span>}
                </div>
                <div className="text-white/40 text-xs">
                  {entry.clash_wins} {isFr ? 'clash' : 'clash'} · {entry.lone_wins} {isFr ? 'solo' : 'lone'}
                </div>
              </div>
              <div className={`font-display text-2xl flex-shrink-0 ${i === 0 ? 'text-gold-400' : 'text-white'}`}>
                {entry.total_points}
                <span className="text-xs text-white/40 ml-1 font-body">pts</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Légende */}
      <div className="border-t border-octagon-700 pt-3 text-white/30 text-xs space-y-1">
        <p>⚔️ {isFr ? 'Clash : adversaire drafté par un autre joueur' : 'Clash: opponent drafted by another player'}</p>
        <p>🎯 {isFr ? 'Solo : adversaire non drafté (+1 pt)' : 'Lone: opponent not drafted (+1 pt)'}</p>
        <p>🏆 {isFr ? 'Main event ×2 sur tous les points' : 'Main event ×2 on all points'}</p>
      </div>
    </div>
  )
}
