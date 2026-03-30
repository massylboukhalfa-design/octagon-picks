import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import FighterForm from '@/components/fighters/FighterForm'

export default async function NewFighterPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user!.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/fighters" className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">Combattants</Link>
        <span className="text-white/20 text-xs">/</span>
        <span className="text-white/60 text-xs uppercase tracking-widest">Nouveau</span>
      </div>
      <h1 className="font-display text-5xl tracking-wider mb-8">NOUVEAU COMBATTANT</h1>
      <FighterForm />
    </div>
  )
}
