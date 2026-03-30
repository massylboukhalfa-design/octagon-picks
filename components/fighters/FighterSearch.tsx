'use client'

import { useState, useRef, useEffect } from 'react'

type Fighter = {
  id: string
  name: string
  photo_url?: string | null
  weight_class?: string | null
  country_flag?: string | null
  wins?: number
  losses?: number
  draws?: number
}

type Props = {
  fighters: Fighter[]
  value: string | null
  onChange: (fighterId: string | null, fighter: Fighter | null) => void
  placeholder?: string
  label?: string
}

export default function FighterSearch({ fighters, value, onChange, placeholder = 'Rechercher un combattant...', label }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = value ? fighters.find(f => f.id === value) ?? null : null

  const filtered = query.trim().length > 0
    ? fighters.filter(f => f.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : fighters.slice(0, 8)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (fighter: Fighter) => {
    onChange(fighter.id, fighter)
    setQuery('')
    setOpen(false)
  }

  const handleClear = () => {
    onChange(null, null)
    setQuery('')
  }

  return (
    <div ref={ref} className="relative">
      {label && <label className="label">{label}</label>}

      {/* Fighter sélectionné */}
      {selected ? (
        <div className="flex items-center gap-3 bg-octagon-700 border border-blood-500/50 p-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-octagon-600 bg-octagon-600 flex-shrink-0">
            {selected.photo_url ? (
              <img src={selected.photo_url} alt={selected.name} className="w-full h-full object-cover object-top" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-display text-lg text-white/20">{selected.name.charAt(0)}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">
              {selected.country_flag && <span className="mr-1">{selected.country_flag}</span>}
              {selected.name}
            </div>
            <div className="text-white/40 text-xs">
              {selected.weight_class && <span>{selected.weight_class}</span>}
              {(selected.wins !== undefined) && (
                <span className="ml-2 font-mono">{selected.wins}-{selected.losses}-{selected.draws}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors flex-shrink-0"
          >
            Changer
          </button>
        </div>
      ) : (
        /* Champ de recherche */
        <div>
          <input
            type="text"
            className="input"
            placeholder={placeholder}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
          />

          {/* Dropdown résultats */}
          {open && (
            <div className="absolute z-50 top-full left-0 right-0 bg-octagon-800 border border-octagon-600 border-t-0 max-h-64 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-4 text-white/40 text-sm text-center">Aucun combattant trouvé</div>
              ) : (
                filtered.map(fighter => (
                  <button
                    key={fighter.id}
                    type="button"
                    onClick={() => handleSelect(fighter)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-octagon-700 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-octagon-600 bg-octagon-700 flex-shrink-0">
                      {fighter.photo_url ? (
                        <img src={fighter.photo_url} alt={fighter.name} className="w-full h-full object-cover object-top" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-display text-base text-white/20">{fighter.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {fighter.country_flag && <span className="mr-1">{fighter.country_flag}</span>}
                        {fighter.name}
                      </div>
                      <div className="text-white/40 text-xs">
                        {fighter.weight_class && <span>{fighter.weight_class}</span>}
                        {fighter.wins !== undefined && (
                          <span className="ml-2 font-mono">{fighter.wins}-{fighter.losses}-{fighter.draws}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
