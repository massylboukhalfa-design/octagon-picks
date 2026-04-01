'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { Locale, translations } from './translations'

type Translations = typeof translations.fr | typeof translations.en

type I18nContextType = {
  locale: Locale
  t: Translations
  setLocale: (l: Locale) => void
}

const I18nContext = createContext<I18nContextType>({
  locale: 'fr',
  t: translations.fr,
  setLocale: () => {},
})

export function I18nProvider({ children, defaultLocale }: { children: ReactNode; defaultLocale: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    document.cookie = `locale=${l};path=/;max-age=31536000`
  }

  return (
    <I18nContext.Provider value={{ locale, t: translations[locale], setLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => useContext(I18nContext)
