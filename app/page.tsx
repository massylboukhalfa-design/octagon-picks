import Link from 'next/link'
import { getLocale } from '@/lib/i18n/server'

export default function HomePage() {
  const locale = getLocale()
  const fr = locale === 'fr'

  const pronoPoints = fr
    ? [
        { pts: '+10', label: 'Bon gagnant', color: 'text-white' },
        { pts: '+5', label: 'Bonne méthode', color: 'text-gold-400' },
        { pts: '+5', label: 'Bon round', color: 'text-gold-400' },
        { pts: '+10', label: 'Combo parfait', color: 'text-blood-400' },
      ]
    : [
        { pts: '+10', label: 'Correct winner', color: 'text-white' },
        { pts: '+5', label: 'Correct method', color: 'text-gold-400' },
        { pts: '+5', label: 'Correct round', color: 'text-gold-400' },
        { pts: '+10', label: 'Perfect combo', color: 'text-blood-400' },
      ]

  const draftPoints = fr
    ? [
        { pts: '4 pts', label: 'KO / Submission', color: 'text-blood-400' },
        { pts: '3 pts', label: 'Décision unanime', color: 'text-white' },
        { pts: '2 pts', label: 'Décision partagée', color: 'text-gold-400' },
        { pts: '×2', label: 'Main event', color: 'text-gold-400' },
      ]
    : [
        { pts: '4 pts', label: 'KO / Submission', color: 'text-blood-400' },
        { pts: '3 pts', label: 'Unanimous decision', color: 'text-white' },
        { pts: '2 pts', label: 'Split decision', color: 'text-gold-400' },
        { pts: '×2', label: 'Main event', color: 'text-gold-400' },
      ]

  return (
    <main className="min-h-screen bg-octagon-950 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blood-500 opacity-5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blood-500 opacity-5 blur-[120px]" />
        <div className="absolute inset-0 bg-noise opacity-50" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:80px_80px]" />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-octagon-800">
        <div className="font-display text-2xl tracking-widest">
          <span className="text-white">OCTAGON</span>
          <span className="text-blood-500">PICKS</span>
        </div>
        <div className="flex gap-3">
          <Link href="/auth/login" className="btn-secondary text-xs py-2 px-4">
            {fr ? 'Connexion' : 'Sign in'}
          </Link>
          <Link href="/auth/register" className="btn-primary text-xs py-2 px-4">
            {fr ? 'Rejoindre la beta' : 'Join the beta'}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-8 py-24">
        <div className="inline-flex items-center gap-2 badge-red mb-8 animate-fade-in">
          <span className="w-1.5 h-1.5 bg-blood-400 rounded-full animate-pulse" />
          {fr ? 'BETA PRIVÉE — INVITATIONS LIMITÉES' : 'PRIVATE BETA — LIMITED INVITES'}
        </div>

        <h1 className="font-display text-[clamp(4rem,12vw,9rem)] leading-none tracking-wider mb-6 animate-fade-in animate-delay-100">
          {fr ? (
            <>
              <span className="block text-white">PRONOSTIQUE</span>
              <span className="block text-gradient-blood">L'OCTAGON</span>
            </>
          ) : (
            <>
              <span className="block text-white">PREDICT</span>
              <span className="block text-gradient-blood">THE OCTAGON</span>
            </>
          )}
        </h1>

        <p className="text-white/40 text-xl font-light tracking-wide max-w-xl mb-12 animate-fade-in animate-delay-200">
          {fr
            ? 'Deux modes de jeu, une seule arène. Pronostique chaque combat ou constitue ton équipe de fighters.'
            : 'Two game modes, one arena. Predict each fight or build your team of fighters.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in animate-delay-300">
          <Link href="/auth/register" className="btn-gold text-base py-4 px-10">
            {fr ? 'Créer un compte' : 'Create account'}
          </Link>
          <Link href="/auth/login" className="btn-secondary text-base py-4 px-10">
            {fr ? "J'ai un compte" : 'I have an account'}
          </Link>
        </div>
      </section>

      {/* Deux modes */}
      <section className="relative z-10 border-t border-octagon-800 px-8 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl tracking-wider text-center mb-12 text-white/40">
            {fr ? 'DEUX MODES DE JEU' : 'TWO GAME MODES'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Mode Prono */}
            <div className="card border-blood-500/30 space-y-5">
              <div className="flex items-center gap-3">
                <span className="text-4xl">🎯</span>
                <div>
                  <div className="font-display text-2xl tracking-wider">
                    {fr ? 'PRONOSTICS' : 'PREDICTIONS'}
                  </div>
                  <div className="text-blood-400 text-xs uppercase tracking-widest">
                    {fr ? 'Event par event' : 'Event by event'}
                  </div>
                </div>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">
                {fr
                  ? 'Pour chaque combat, pronostique le vainqueur, la méthode et le round. Les points s\'accumulent au fil des events dans le classement de ta ligue.'
                  : 'For each fight, predict the winner, method and round. Points accumulate across events in your league standings.'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {pronoPoints.map(item => (
                  <div key={item.label} className="bg-octagon-700 p-3 text-center">
                    <div className={`font-display text-2xl ${item.color}`}>{item.pts}</div>
                    <div className="text-white/40 text-xs mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
              <div className="text-white/30 text-xs text-center">
                {fr ? 'Max 30 pts par combat' : 'Max 30 pts per fight'}
              </div>
            </div>

            {/* Mode Draft */}
            <div className="card border-gold-500/30 space-y-5">
              <div className="flex items-center gap-3">
                <span className="text-4xl">🏆</span>
                <div>
                  <div className="font-display text-2xl tracking-wider">DRAFT</div>
                  <div className="text-gold-400 text-xs uppercase tracking-widest">
                    {fr ? 'Mode saison' : 'Season mode'}
                  </div>
                </div>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">
                {fr
                  ? 'Avant la saison, chaque joueur draft une équipe de fighters. Tu marques des points quand tes fighters gagnent — surtout quand ton fighter affronte celui d\'un autre joueur.'
                  : 'Before the season, each player drafts a team of fighters. You score points when your fighters win — especially when your fighter faces another player\'s.'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {draftPoints.map(item => (
                  <div key={item.label} className="bg-octagon-700 p-3 text-center">
                    <div className={`font-display text-2xl ${item.color}`}>{item.pts}</div>
                    <div className="text-white/40 text-xs mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-1 text-xs text-white/30">
                <div>{fr ? '🐍 Snake order asynchrone' : '🐍 Async snake draft order'}</div>
                <div>{fr ? '⇄ Échanges entre joueurs possibles' : '⇄ Trades between players allowed'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 border-t border-octagon-800 px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '2', label: fr ? 'Modes de jeu' : 'Game modes' },
              { value: '30', label: fr ? 'Pts max / combat' : 'Max pts / fight' },
              { value: '∞', label: fr ? 'Ligues possibles' : 'Possible leagues' },
              { value: '🔒', label: fr ? 'Cercle privé' : 'Private circle' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-5xl text-blood-400">{stat.value}</div>
                <div className="text-white/40 text-xs uppercase tracking-widest mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
