import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import EnrichGrid from '@/components/fighters/EnrichGrid'

export default async function EnrichPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user!.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const { data: fighters } = await supabase
    .from('fighters')
    .select('id, name, nickname, photo_url, weight_class, wins, losses, draws, country_flag, is_champion, ranking')
    .order('weight_class')
    .order('name')

  const total = fighters?.length ?? 0
  const withPhoto = fighters?.filter(f => f.photo_url).length ?? 0
  const withoutPhoto = total - withPhoto

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/fighters" className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">Fighters</Link>
            <span className="text-white/20 text-xs">/</span>
            <span className="text-white/60 text-xs uppercase tracking-widest">Enrichissement photos</span>
          </div>
          <h1 className="font-display text-5xl tracking-wider">PHOTOS</h1>
        </div>
        <div className="text-right">
          <div className="font-display text-3xl text-white">{withPhoto}<span className="text-white/30 text-lg">/{total}</span></div>
          <div className="text-white/40 text-xs uppercase tracking-widest mt-1">avec photo</div>
          {withoutPhoto > 0 && (
            <div className="text-blood-400 text-xs mt-1">{withoutPhoto} manquante{withoutPhoto > 1 ? 's' : ''}</div>
          )}
        </div>
      </div>

      <EnrichGrid fighters={fighters ?? []} />
    </div>
  )
}
