import FighterFormBadge from '@/components/fighters/FighterFormBadge'

type Fighter = {
  id: string; name: string; nickname?: string; country?: string; country_flag?: string
  photo_url?: string; wins: number; losses: number; draws: number
  wins_ko: number; wins_sub: number; wins_dec: number
  height_cm?: number; reach_cm?: number; stance?: string
  weight_class?: string; is_champion: boolean; ranking?: number; form?: string[]
}

type Props = {
  fighter: Fighter; record?: string; side: 'left' | 'right'
  isSelected?: boolean; onClick?: () => void; locale?: string
}

export default function FighterCard({ fighter, record, side, isSelected, onClick, locale = 'fr' }: Props) {
  const isRight = side === 'right'
  const fr = locale === 'fr'

  const fmtHeight = (cm: number) => {
    if (fr) return `${cm}cm`
    const totalIn = Math.round(cm / 2.54)
    return `${Math.floor(totalIn / 12)}'${totalIn % 12}"`
  }
  const fmtReach = (cm: number) => fr ? `${cm}cm ${fr ? 'allonge' : 'reach'}` : `${Math.round(cm / 2.54)}" reach`

  return (
    <button
      onClick={onClick}
      className={`w-full text-${isRight ? 'right' : 'left'} group transition-all ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className={`flex items-end gap-3 ${isRight ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Photo */}
        <div className={`relative flex-shrink-0 w-24 h-24 md:w-32 md:h-32 overflow-hidden border-2 transition-all ${
          isSelected ? 'border-blood-500 shadow-lg shadow-blood-500/20' : 'border-octagon-600 group-hover:border-blood-500/50'
        } bg-octagon-700`}>
          {fighter.photo_url ? (
            <img src={fighter.photo_url} alt={fighter.name} className="w-full h-full object-cover object-top" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-display text-4xl text-white/20">{fighter.name.charAt(0)}</span>
            </div>
          )}
          {fighter.is_champion && <div className="absolute top-1 left-1 badge-gold text-xs">C</div>}
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <div className={`flex items-center gap-1 mb-1 ${isRight ? 'justify-end' : 'justify-start'}`}>
            {fighter.country_flag && <span className="text-lg">{fighter.country_flag}</span>}
            {fighter.ranking && <span className="text-white/40 text-xs font-mono">#{fighter.ranking}</span>}
          </div>

          <div className={`font-display text-xl md:text-2xl tracking-wider leading-tight transition-colors ${
            isSelected ? 'text-blood-400' : 'text-white group-hover:text-blood-400'
          }`}>{fighter.name}</div>

          {fighter.nickname && <div className="text-white/40 text-xs italic mt-0.5">"{fighter.nickname}"</div>}

          <div className="font-mono text-sm text-white/60 mt-1">
            {record ?? `${fighter.wins}-${fighter.losses}-${fighter.draws}`}
          </div>

          {fighter.form && fighter.form.length > 0 && (
            <div className={`flex mt-2 ${isRight ? 'justify-end' : 'justify-start'}`}>
              <FighterFormBadge form={fighter.form as any} size="sm" />
            </div>
          )}

          <div className={`flex gap-2 mt-2 ${isRight ? 'justify-end' : 'justify-start'}`}>
            {fighter.wins_ko > 0 && <span className="text-xs font-mono text-white/40">{fighter.wins_ko} KO</span>}
            {fighter.wins_sub > 0 && <span className="text-xs font-mono text-white/40">{fighter.wins_sub} SUB</span>}
            {fighter.wins_dec > 0 && <span className="text-xs font-mono text-white/40">{fighter.wins_dec} DEC</span>}
          </div>

          {(fighter.height_cm || fighter.reach_cm || fighter.stance) && (
            <div className={`flex gap-3 mt-2 ${isRight ? 'justify-end' : 'justify-start'}`}>
              {fighter.height_cm && <span className="text-xs text-white/30">{fmtHeight(fighter.height_cm)}</span>}
              {fighter.reach_cm && <span className="text-xs text-white/30">{fmtReach(fighter.reach_cm)}</span>}
              {fighter.stance && <span className="text-xs text-white/30">{fighter.stance}</span>}
            </div>
          )}
        </div>
      </div>

      {onClick && (
        <div className={`mt-2 h-0.5 transition-all ${isSelected ? 'bg-blood-500' : 'bg-transparent group-hover:bg-blood-500/30'}`} />
      )}
    </button>
  )
}
