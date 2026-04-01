'use client'

import { useI18n } from '@/lib/i18n/context'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()

  return (
    <div className="flex items-center gap-1 border border-octagon-700 text-xs font-mono">
      <button
        onClick={() => setLocale('fr')}
        className={`px-2 py-1 transition-colors ${
          locale === 'fr' ? 'bg-blood-500 text-white' : 'text-white/40 hover:text-white'
        }`}
      >
        FR
      </button>
      <button
        onClick={() => setLocale('en')}
        className={`px-2 py-1 transition-colors ${
          locale === 'en' ? 'bg-blood-500 text-white' : 'text-white/40 hover:text-white'
        }`}
      >
        EN
      </button>
    </div>
  )
}
