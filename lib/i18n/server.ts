import { cookies, headers } from 'next/headers'
import { Locale } from './translations'

export function getLocale(): Locale {
  // 1. Cookie utilisateur (prioritaire)
  const cookieStore = cookies()
  const cookieLocale = cookieStore.get('locale')?.value
  if (cookieLocale === 'fr' || cookieLocale === 'en') return cookieLocale

  // 2. Header Accept-Language
  const acceptLanguage = headers().get('accept-language') ?? ''
  const isFrench = acceptLanguage.toLowerCase().includes('fr')
  return isFrench ? 'fr' : 'en'
}
