type Props = {
  rosters: any[]
  members: any[]
  currentUserId: string
  locale?: string
}

export default function DraftRosterGrid({ rosters, members, currentUserId, locale = 'fr' }: Props) {
  const isFr = locale === 'fr'

  // Grouper les rosters par user
  const rostersByUser: Record<string, any[]> = {}
  for (const roster of rosters) {
    if (!rostersByUser[roster.user_id]) rostersByUser[roster.user_id] = []
    rostersByUser[roster.user_id].push(roster)
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-12 text-white/30">
        {isFr ? 'Aucun roster' : 'No rosters yet'}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl tracking-wider">
        {isFr ? 'ROSTERS' : 'ROSTERS'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map((member: any) => {
          const userRosters = rostersByUser[member.id] ?? []
          const mainEvents = userRosters.filter((r: any) => r.slot_type === 'main_event')
          const undercard = userRosters.filter((r: any) => r.slot_type === 'undercard')
          const isMe = member.id === currentUserId

          return (
            <div key={member.id} className={`card space-y-3 ${isMe ? 'border-blood-500/30' : ''}`}>
              {/* Header joueur */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-octagon-600 bg-octagon-700 flex-shrink-0">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-display text-sm text-white/20">{member.username?.charAt(0)?.toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <div className="font-semibold flex items-center gap-2">
                  {member.username}
                  {isMe && <span className="badge-red text-xs">{isFr ? 'Toi' : 'You'}</span>}
                </div>
                <div className="ml-auto text-white/40 text-xs font-mono">
                  {userRosters.length} {isFr ? 'pick(s)' : 'pick(s)'}
                </div>
              </div>

              {userRosters.length === 0 ? (
                <p className="text-white/30 text-xs italic">
                  {isFr ? 'Pas encore de picks' : 'No picks yet'}
                </p>
              ) : (
                <div className="space-y-2">
                  {/* Main events */}
                  {mainEvents.length > 0 && (
                    <div>
                      <div className="text-white/30 text-xs uppercase tracking-widest mb-1">
                        Main Event
                      </div>
                      {mainEvents.map((r: any) => (
                        <FighterPill key={r.id} roster={r} />
                      ))}
                    </div>
                  )}
                  {/* Undercard */}
                  {undercard.length > 0 && (
                    <div>
                      <div className="text-white/30 text-xs uppercase tracking-widest mb-1">
                        Undercard
                      </div>
                      {undercard.map((r: any) => (
                        <FighterPill key={r.id} roster={r} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FighterPill({ roster }: { roster: any }) {
  const fighter = roster.fighters
  const fight = roster.fights
  const event = fight?.ufc_events

  return (
    <div className="flex items-center gap-2 p-2 bg-octagon-700 border border-octagon-600">
      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-octagon-600">
        {fighter?.photo_url ? (
          <img src={fighter.photo_url} alt={fighter.name} className="w-full h-full object-cover object-top" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white/20 text-xs font-display">{fighter?.name?.charAt(0)}</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{fighter?.name}</div>
        <div className="text-white/30 text-xs truncate">{event?.name}</div>
      </div>
      {roster.slot_type === 'main_event' && (
        <span className="badge-red text-xs flex-shrink-0">ME</span>
      )}
    </div>
  )
}
