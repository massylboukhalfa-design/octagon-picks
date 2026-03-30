import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import FighterForm from '@/components/fighters/FighterForm'

export default async function EditFighterPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user!.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const { data: fighter } = await supabase.from('fighters').select('*').eq('id', params.id).single()
  if (!fighter) notFound()

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/fighters" className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">Combattants</Link>
        <span className="text-white/20 text-xs">/</span>
        <span className="text-white/60 text-xs uppercase tracking-widest">{fighter.name}</span>
      </div>
      <div className="flex items-center gap-4 mb-8">
        {fighter.photo_url && (
          <div className="w-16 h-16 rounded-full overflow-hidden border border-octagon-600 flex-shrink-0">
            <img src={fighter.photo_url} alt={fighter.name} className="w-full h-full object-cover object-top" />
          </div>
        )}
        <div>
          <h1 className="font-display text-4xl tracking-wider">{fighter.name}</h1>
          {fighter.nickname && <p className="text-white/40 text-sm italic">"{fighter.nickname}"</p>}
        </div>
      </div>
      <FighterForm existing={fighter} />
    </div>
  )
}
