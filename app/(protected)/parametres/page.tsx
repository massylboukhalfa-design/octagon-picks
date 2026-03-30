import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ParametresClient from '@/components/settings/ParametresClient'

export default async function ParametresPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, notification_email, newsletter_email, created_at')
    .eq('id', user!.id)
    .single()

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/dashboard" className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">Dashboard</Link>
        <span className="text-white/20 text-xs">/</span>
        <span className="text-white/60 text-xs uppercase tracking-widest">Paramètres</span>
      </div>
      <h1 className="font-display text-5xl tracking-wider mb-8">PARAMÈTRES</h1>
      <ParametresClient
        userId={user!.id}
        email={user!.email ?? ''}
        profile={profile}
      />
    </div>
  )
}
