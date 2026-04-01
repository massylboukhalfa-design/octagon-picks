import Link from 'next/link'
import { getLocale } from '@/lib/i18n/server'

export default function HomePage() {
  const locale = getLocale()
  const fr = locale === 'fr'

  const points = fr
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
          {fr ? (
            <>Crée ta ligue, pronostique le gagnant, la méthode et le round.<br />Domine le classement de tes amis.</>
          ) : (
            <>Create your league, predict the winner, method and round.<br />Dominate your friends' leaderboard.</>
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in animate-delay-300">
          <Link href="/auth/register" className="btn-gold text-base py-4 px-10">
            {fr ? 'Créer un compte' : 'Create account'}
          </Link>
          <Link href="/auth/login" className="btn-secondary text-base py-4 px-10">
            {fr ? "J'ai un compte" : 'I have an account'}
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-12 mt-24 animate-fade-in animate-delay-400">
          {[
            { value: '30', label: fr ? 'Points max par combat' : 'Max points per fight' },
            { value: '3', label: fr ? 'Critères de pronostic' : 'Prediction criteria' },
            { value: '∞', label: fr ? 'Ligues possibles' : 'Possible leagues' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-5xl text-blood-400">{stat.value}</div>
              <div className="text-white/40 text-xs uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 border-t border-octagon-800 px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl tracking-wider text-center mb-12 text-white/40">
            {fr ? 'SYSTÈME DE POINTS' : 'SCORING SYSTEM'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {points.map(item => (
              <div key={item.label} className="card text-center">
                <div className={`font-display text-4xl ${item.color}`}>{item.pts}</div>
                <div className="text-white/40 text-xs uppercase tracking-widest mt-2">{item.label}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-white/40 text-sm mt-6">
            {fr ? 'Max ' : 'Max '}
            <span className="text-gold-400 font-semibold">30 pts</span>
            {fr ? ' par combat avec le combo parfait' : ' per fight with a perfect combo'}
          </p>
        </div>
      </section>
    </main>
  )
}
