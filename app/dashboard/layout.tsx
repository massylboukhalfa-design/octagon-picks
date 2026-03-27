import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/auth/LogoutButton'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
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
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-octagon-600 text-sm font-mono tracking-wider hidden sm:block">
              {profile?.username ?? user.email}
            </span>
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
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {children}
      </main>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-octagon-600 hover:text-white text-sm font-semibold uppercase tracking-[0.1em] px-3 py-4 border-b-2 border-transparent hover:border-blood-500 transition-all duration-200"
    >
      {children}
    </Link>
  )
}
