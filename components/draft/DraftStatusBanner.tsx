import Link from 'next/link'

type Props = {
  season: any
  isMyTurn: boolean
  currentPicker: any
  myDeadline: Date | null
  leagueId: string
  seasonId: string
  locale?: string
}

export default function DraftStatusBanner({
  season, isMyTurn, currentPicker, myDeadline, leagueId, seasonId, locale = 'fr'
}: Props) {
  const isFr = locale === 'fr'

  if (season.status === 'upcoming') {
    return (
      <div className="card border-octagon-600">
        <p className="text-white/50 text-sm">
          {isFr
            ? "Le draft n'a pas encore commencé. L'owner de la ligue peut le lancer."
            : "The draft hasn't started yet. The league owner can launch it."}
        </p>
      </div>
    )
  }

  if (season.status === 'drafting') {
    if (isMyTurn) {
      return (
        <div className="card border-blood-500 bg-blood-500/5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blood-400 rounded-full animate-pulse" />
            <span className="font-display text-xl tracking-wider text-blood-400">
              {isFr ? "C'EST TON TOUR !" : "IT'S YOUR TURN!"}
            </span>
          </div>
          {myDeadline && (
            <p className="text-white/60 text-sm">
              {isFr ? 'Tu as jusqu\'au ' : 'You have until '}
              <span className="text-gold-400 font-semibold">
                {myDeadline.toLocaleString(isFr ? 'fr-FR' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
              {isFr ? ' pour faire tes picks.' : ' to make your picks.'}
            </p>
          )}
          <Link href={`/leagues/${leagueId}/draft/${seasonId}/pick`}
            className="btn-primary inline-flex">
            {isFr ? 'Faire mes picks →' : 'Make my picks →'}
          </Link>
        </div>
      )
    }

    return (
      <div className="card border-gold-500/30 space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-gold-400 rounded-full animate-pulse" />
          <span className="text-gold-400 text-sm font-semibold uppercase tracking-widest">
            {isFr ? 'DRAFT EN COURS' : 'DRAFT IN PROGRESS'}
          </span>
        </div>
        {currentPicker && (
          <p className="text-white/60 text-sm">
            {isFr ? "En attente de " : "Waiting for "}
            <span className="text-white font-semibold">{currentPicker.username}</span>
            {isFr ? ' pour faire ses picks.' : ' to make their picks.'}
          </p>
        )}
        {myDeadline && (
          <p className="text-white/40 text-xs">
            {isFr ? 'Deadline : ' : 'Deadline: '}
            {myDeadline.toLocaleString(isFr ? 'fr-FR' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        )}
      </div>
    )
  }

  if (season.status === 'active') {
    return (
      <div className="card border-emerald-700/50 bg-emerald-950/10">
        <p className="text-emerald-400 text-sm font-semibold">
          ✓ {isFr ? 'Saison active — les combats rapportent des points' : 'Season active — fights are scoring points'}
        </p>
      </div>
    )
  }

  if (season.status === 'completed') {
    return (
      <div className="card border-octagon-600">
        <p className="text-white/40 text-sm">
          {isFr ? 'Saison terminée.' : 'Season completed.'}
        </p>
      </div>
    )
  }

  return null
}
