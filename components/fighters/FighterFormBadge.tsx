type Outcome = 'W' | 'L' | 'D' | 'NC'

type Props = {
  form: Outcome[]
  size?: 'sm' | 'md'
  showLabel?: boolean
}

const COLORS: Record<Outcome, string> = {
  W:  'bg-emerald-500',
  L:  'bg-red-500',
  D:  'bg-yellow-500',
  NC: 'bg-white/30',
}

const LABELS: Record<Outcome, string> = {
  W:  'Victoire',
  L:  'Défaite',
  D:  'Nul',
  NC: 'No Contest',
}

export default function FighterFormBadge({ form, size = 'md', showLabel = false }: Props) {
  if (!form || form.length === 0) return null

  const dotSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'

  return (
    <div className="flex items-center gap-1">
      {showLabel && (
        <span className="text-white/30 text-xs uppercase tracking-widest mr-1">Forme</span>
      )}
      {form.map((outcome, i) => (
        <div
          key={i}
          className={`${dotSize} rounded-full ${COLORS[outcome]} flex-shrink-0`}
          title={`${LABELS[outcome]} (${form.length - i} combat${form.length - i > 1 ? 's' : ''} ago)`}
        />
      ))}
    </div>
  )
}
