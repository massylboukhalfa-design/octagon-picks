'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="text-octagon-600 hover:text-white text-xs uppercase tracking-widest transition-colors py-1 px-2 hover:bg-octagon-700 border border-transparent hover:border-octagon-600"
    >
      Déconnexion
    </button>
  )
}
