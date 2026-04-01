'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n/context'

export default function LogoutButton() {
  const router = useRouter()
  const { locale } = useI18n()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors py-1 px-2 hover:bg-octagon-700 border border-transparent hover:border-octagon-600"
    >
      {locale === 'fr' ? 'Déconnexion' : 'Sign out'}
    </button>
  )
}
