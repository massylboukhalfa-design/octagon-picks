import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/auth/LogoutButton'
import NavLink from '@/components/layout/NavLink'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, is_admin')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-octagon-950 flex flex-col">
      {/* Top nav */}
      <nav className="border-b border-octagon-800 bg-octagon-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="font-display text-xl tracking-widest">
              <span className="text-white">OCTAGON</span>
              <span className="text-blood-500">PICKS</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/leagues">Ligues</NavLink>
              <NavLink href="/events">Événements</NavLink>
              <NavLink href="/info">Infos</NavLink>
              {profile?.is_admin && (
                <NavLink href="/fighters">Fighters</NavLink>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/50 text-sm font-mono tracking-wider hidden sm:block">
              {profile?.username ?? user.email}
            </span>
            <Link
              href="/parametres"
              className="text-white/40 hover:text-white transition-colors p-1"
              title="Paramètres"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </Link>
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* Mobile nav */}
      <div className="md:hidden border-b border-octagon-800 bg-octagon-900">
        <div className="flex px-4 overflow-x-auto">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/leagues">Ligues</NavLink>
          <NavLink href="/events">Événements</NavLink>
          <NavLink href="/info">Infos</NavLink>
          {profile?.is_admin && <NavLink href="/fighters">Fighters</NavLink>}
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {children}
      </main>
    </div>
  )
}

  return (
    <div className="min-h-screen bg-octagon-950 flex flex-col">
      {/* Top nav */}
      <nav className="border-b border-octagon-800 bg-octagon-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="font-display text-xl tracking-widest">
              <span className="text-white">OCTAGON</span>
              <span className="text-blood-500">PICKS</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/leagues">Ligues</NavLink>
              <NavLink href="/events">Événements</NavLink>
              <NavLink href="/info">Infos</NavLink>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/50 text-sm font-mono tracking-wider hidden sm:block">
              {profile?.username ?? user.email}
            </span>
            <Link
              href="/parametres"
              className="text-white/40 hover:text-white transition-colors p-1"
              title="Paramètres"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </Link>
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* Mobile nav */}
      <div className="md:hidden border-b border-octagon-800 bg-octagon-900">
        <div className="flex px-4">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/leagues">Ligues</NavLink>
          <NavLink href="/events">Événements</NavLink>
          <NavLink href="/info">Infos</NavLink>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {children}
      </main>
    </div>
  )
}
