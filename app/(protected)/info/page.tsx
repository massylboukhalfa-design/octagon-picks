import Link from 'next/link'
import { getLocale } from '@/lib/i18n/server'
import { translations } from '@/lib/i18n/translations'

export default function InfoPage() {
  const locale = getLocale()
  const t = translations[locale]

  const points = locale === 'fr' ? [
    { pts: '+10', label: 'Bon gagnant', desc: 'Tu as prédit le bon vainqueur', color: 'text-white' },
    { pts: '+5', label: 'Bonne méthode', desc: 'KO/TKO, Submission, Decision...', color: 'text-gold-400' },
    { pts: '+5', label: 'Bon round', desc: 'Le combat s\'est terminé au bon round', color: 'text-gold-400' },
    { pts: '+10', label: 'Bonus combo', desc: 'Les 3 critères corrects en même temps', color: 'text-blood-400' },
  ] : [
    { pts: '+10', label: 'Correct winner', desc: 'You predicted the right winner', color: 'text-white' },
    { pts: '+5', label: 'Correct method', desc: 'KO/TKO, Submission, Decision...', color: 'text-gold-400' },
    { pts: '+5', label: 'Correct round', desc: 'The fight ended in the right round', color: 'text-gold-400' },
    { pts: '+10', label: 'Combo bonus', desc: 'All 3 criteria correct at once', color: 'text-blood-400' },
  ]

  const faq = locale === 'fr' ? [
    { q: 'Jusqu\'à quand puis-je modifier mon pronostic ?', a: 'Tu peux modifier ton pronostic jusqu\'à la deadline indiquée sur la page de l\'événement. Une fois la deadline passée, les pronostics sont verrouillés.' },
    { q: 'Mon score est-il le même dans toutes mes ligues ?', a: 'Oui. Ton pronostic est unique par combat et les points calculés sont identiques dans toutes tes ligues.' },
    { q: 'Que se passe-t-il si je rejoins une ligue après avoir déjà pronostiqué ?', a: 'Tous tes pronostics passés sont automatiquement associés à ta nouvelle ligue.' },
    { q: 'Puis-je voir les pronostics des autres ?', a: 'Oui, mais uniquement pour les événements terminés. Clique sur un joueur dans le classement pour voir son historique.' },
    { q: 'Quand les points sont-ils calculés ?', a: 'Les points sont calculés par l\'administrateur après chaque événement, une fois les résultats officiels saisis.' },
    { q: 'Que signifie NC ?', a: 'NC signifie "No Contest" — le combat est annulé ou déclaré nul pour des raisons réglementaires.' },
  ] : [
    { q: 'How long can I edit my prediction?', a: 'You can edit your prediction until the deadline shown on the event page. Once the deadline passes, picks are locked.' },
    { q: 'Is my score the same in all my leagues?', a: 'Yes. Your prediction is unique per fight and points are identical across all your leagues.' },
    { q: 'What happens if I join a league after already making predictions?', a: 'All your past predictions are automatically linked to your new league.' },
    { q: 'Can I see other players\' predictions?', a: 'Yes, but only for completed events. Click a player\'s name in the standings to view their history.' },
    { q: 'When are points calculated?', a: 'Points are calculated by the admin after each event, once official results are entered.' },
    { q: 'What does NC mean?', a: '"No Contest" — the fight is cancelled or declared void for regulatory reasons (doping, accidental injury, etc.).' },
  ]

  return (
    <div className="max-w-3xl space-y-12 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Link href="/dashboard" className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">{t.nav.dashboard}</Link>
          <span className="text-white/20 text-xs">/</span>
          <span className="text-white/60 text-xs uppercase tracking-widest">{t.nav.info}</span>
        </div>
        <h1 className="font-display text-5xl tracking-wider mb-2">
          {locale === 'fr' ? 'INFORMATIONS' : 'INFORMATION'}
        </h1>
        <p className="text-white/40 tracking-wide">
          {locale === 'fr' ? 'Règles, FAQ et conditions d\'utilisation d\'Octagon Picks' : 'Rules, FAQ and terms of use for Octagon Picks'}
        </p>
      </div>

      {/* Points */}
      <section className="card space-y-6">
        <h2 className="font-display text-3xl tracking-wider text-blood-400">
          {locale === 'fr' ? 'SYSTÈME DE POINTS' : 'SCORING SYSTEM'}
        </h2>
        <p className="text-white/60 text-sm leading-relaxed">
          {locale === 'fr'
            ? 'Pour chaque combat, tu pronostics le vainqueur, la méthode de victoire et le round. Plus ton pronostic est précis, plus tu marques de points.'
            : 'For each fight, you predict the winner, method of victory and round. The more accurate your pick, the more points you earn.'}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {points.map(item => (
            <div key={item.label} className="bg-octagon-700 border border-octagon-600 p-4">
              <div className={`font-display text-3xl mb-1 ${item.color}`}>{item.pts}</div>
              <div className="font-semibold text-sm tracking-wide">{item.label}</div>
              <div className="text-white/40 text-xs mt-1">{item.desc}</div>
            </div>
          ))}
        </div>
        <div className="bg-octagon-700 border border-gold-500/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">{locale === 'fr' ? 'Maximum par combat' : 'Maximum per fight'}</span>
            <span className="font-display text-2xl text-gold-400">30 pts</span>
          </div>
          <p className="text-white/40 text-xs mt-2">
            {locale === 'fr'
              ? '10 (gagnant) + 5 (méthode) + 5 (round) + 10 (bonus combo) = 30 pts parfaits'
              : '10 (winner) + 5 (method) + 5 (round) + 10 (combo bonus) = 30 perfect pts'}
          </p>
        </div>
        <div className="space-y-3">
          <h3 className="font-display text-xl tracking-wider text-white/60">
            {locale === 'fr' ? 'CAS SPÉCIAUX' : 'SPECIAL CASES'}
          </h3>
          <div className="space-y-2 text-sm text-white/60 leading-relaxed">
            {locale === 'fr' ? (
              <>
                <p><span className="text-white font-semibold">Decision</span> — Si tu pronostics une victoire aux points, le round n'est pas à choisir. Si le combat se termine par décision, tu obtiens automatiquement les points du round.</p>
                <p><span className="text-white font-semibold">Match nul</span> — La méthode est automatiquement "Decision" et le round n'est pas à choisir. Si le résultat est bien un match nul, tu obtiens les points du round automatiquement.</p>
              </>
            ) : (
              <>
                <p><span className="text-white font-semibold">Decision</span> — If you pick a decision win, you don't choose a round. If the fight ends by decision, you automatically earn the round points.</p>
                <p><span className="text-white font-semibold">Draw</span> — The method is automatically set to "Decision" and no round is selected. If the result is indeed a draw, you earn round points automatically.</p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="card space-y-6">
        <h2 className="font-display text-3xl tracking-wider text-blood-400">FAQ</h2>
        <div className="space-y-5">
          {faq.map(({ q, a }) => (
            <div key={q} className="border-b border-octagon-700 pb-5 last:border-0 last:pb-0">
              <div className="font-semibold tracking-wide mb-2">{q}</div>
              <div className="text-white/50 text-sm leading-relaxed">{a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Terms */}
      <section className="card space-y-4">
        <h2 className="font-display text-3xl tracking-wider text-blood-400">
          {locale === 'fr' ? 'CONDITIONS D\'UTILISATION' : 'TERMS OF USE'}
        </h2>
        <div className="space-y-3 text-white/50 text-sm leading-relaxed">
          {locale === 'fr' ? (
            <>
              <p>Octagon Picks est une application de pronostics sportifs à but non lucratif, réservée à un cercle privé d'utilisateurs invités. Aucune mise d'argent n'est impliquée.</p>
              <p>En utilisant l'application, tu acceptes de ne pas tenter de contourner le système de points, de ne pas créer plusieurs comptes, et de respecter les autres membres.</p>
              <p>Les données personnelles collectées (email, pseudo) sont utilisées uniquement pour le fonctionnement de l'application et ne sont pas partagées avec des tiers.</p>
              <p>L'administrateur se réserve le droit de modifier les règles, de corriger des résultats erronés ou de recalculer des points en cas d'erreur de saisie.</p>
            </>
          ) : (
            <>
              <p>Octagon Picks is a non-profit sports prediction app open to invited users only. No money or wagers are involved.</p>
              <p>By using the app, you agree not to attempt to manipulate the scoring system, not to create multiple accounts, and to respect other members.</p>
              <p>Personal data collected (email, username) is used solely for the app's operation and is never shared with third parties.</p>
              <p>The administrator reserves the right to modify rules, correct incorrect results, or recalculate points in the event of an entry error.</p>
            </>
          )}
        </div>
      </section>

      {/* Contact */}
      <section className="card space-y-4">
        <h2 className="font-display text-3xl tracking-wider text-blood-400">CONTACT</h2>
        <p className="text-white/50 text-sm leading-relaxed">
          {locale === 'fr'
            ? 'Pour toute question, signalement d\'un bug ou suggestion, contacte l\'administrateur directement.'
            : 'For any question, bug report or suggestion, contact the admin directly.'}
        </p>
        <div className="bg-octagon-700 border border-octagon-600 p-4 space-y-1">
          <div className="text-white/40 text-xs uppercase tracking-widest mb-1">{locale === 'fr' ? 'Administrateur' : 'Admin'}</div>
          <div className="font-semibold tracking-wide">Massyl</div>
          <div className="font-mono text-sm text-white/60">octagonpicks1@gmail.com</div>
        </div>
      </section>
    </div>
  )
}
