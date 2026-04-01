'use client'

import { useI18n } from '@/lib/i18n/context'
import { useRouter } from 'next/navigation'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()
  const router = useRouter()

  const handleLocale = (l: 'fr' | 'en') => {
    setLocale(l)
    // Force re-render des Server Components pour appliquer la langue
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1 border border-octagon-700 text-xs font-mono">
      <button
        onClick={() => handleLocale('fr')}
        className={`px-2 py-1 transition-colors ${
          locale === 'fr' ? 'bg-blood-500 text-white' : 'text-white/40 hover:text-white'
        }`}
      >
        FR
      </button>
      <button
        onClick={() => handleLocale('en')}
        className={`px-2 py-1 transition-colors ${
          locale === 'en' ? 'bg-blood-500 text-white' : 'text-white/40 hover:text-white'
        }`}
      >
        EN
      </button>
    </div>
  )
}
