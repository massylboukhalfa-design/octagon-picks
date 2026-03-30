import Link from 'next/link'

export default function InfoPage() {
  return (
    <div className="max-w-3xl space-y-12 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Link href="/dashboard" className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">Dashboard</Link>
          <span className="text-white/20 text-xs">/</span>
          <span className="text-white/60 text-xs uppercase tracking-widest">Informations</span>
        </div>
        <h1 className="font-display text-5xl tracking-wider mb-2">INFORMATIONS</h1>
        <p className="text-white/40 tracking-wide">Règles, FAQ et conditions d'utilisation d'Octagon Picks</p>
      </div>

      {/* Système de points */}
      <section className="card space-y-6">
        <h2 className="font-display text-3xl tracking-wider text-blood-400">SYSTÈME DE POINTS</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Pour chaque combat, tu pronostics le vainqueur, la méthode de victoire et le round.
          Plus ton pronostic est précis, plus tu marques de points.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { pts: '+10', label: 'Bon gagnant', desc: 'Tu as prédit le bon vainqueur', color: 'text-white' },
            { pts: '+5', label: 'Bonne méthode', desc: 'KO/TKO, Submission, Decision...', color: 'text-gold-400' },
            { pts: '+5', label: 'Bon round', desc: 'Le combat s\'est terminé au bon round', color: 'text-gold-400' },
            { pts: '+10', label: 'Bonus combo', desc: 'Les 3 critères corrects en même temps', color: 'text-blood-400' },
          ].map(item => (
            <div key={item.label} className="bg-octagon-700 border border-octagon-600 p-4">
              <div className={`font-display text-3xl mb-1 ${item.color}`}>{item.pts}</div>
              <div className="font-semibold text-sm tracking-wide">{item.label}</div>
              <div className="text-white/40 text-xs mt-1">{item.desc}</div>
            </div>
          ))}
        </div>
        <div className="bg-octagon-700 border border-gold-500/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">Maximum par combat</span>
            <span className="font-display text-2xl text-gold-400">30 pts</span>
          </div>
          <p className="text-white/40 text-xs mt-2">
            10 (gagnant) + 5 (méthode) + 5 (round) + 10 (bonus combo) = 30 pts parfaits
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-display text-xl tracking-wider text-white/60">CAS SPÉCIAUX</h3>
          <div className="space-y-2 text-sm text-white/60 leading-relaxed">
            <p>
              <span className="text-white font-semibold">Decision</span> — Si tu pronostics une victoire
              aux points (Decision), le round n'est pas à choisir. Si le combat se termine effectivement
              par décision, tu obtiens automatiquement les points du round.
            </p>
            <p>
              <span className="text-white font-semibold">Match nul</span> — En cas de pronostic de match nul,
              la méthode est automatiquement "Decision" et le round n'est pas à choisir.
              Si le résultat est bien un match nul, tu obtiens les points du round automatiquement.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="card space-y-6">
        <h2 className="font-display text-3xl tracking-wider text-blood-400">FAQ</h2>
        <div className="space-y-5">
          {[
            {
              q: 'Jusqu\'à quand puis-je modifier mon pronostic ?',
              a: 'Tu peux modifier ton pronostic jusqu\'à la deadline indiquée sur la page de l\'événement. Une fois la deadline passée, les pronostics sont verrouillés.',
            },
            {
              q: 'Mon score est-il le même dans toutes mes ligues ?',
              a: 'Oui. Ton pronostic est unique par combat et les points calculés sont identiques dans toutes tes ligues. Il est impossible d\'avoir un score différent selon la ligue.',
            },
            {
              q: 'Que se passe-t-il si je rejoins une ligue après avoir déjà pronostiqué ?',
              a: 'Tous tes pronostics passés sont automatiquement associés à ta nouvelle ligue. Ton score dans cette ligue reflète l\'ensemble de tes pronos depuis le début, pas seulement depuis que tu l\'as rejointe.',
            },
            {
              q: 'Puis-je voir les pronostics des autres ?',
              a: 'Oui, mais uniquement pour les événements terminés. Clique sur le nom d\'un joueur dans le classement d\'une ligue pour voir son historique de pronostics.',
            },
            {
              q: 'Quand les points sont-ils calculés ?',
              a: 'Les points sont calculés par l\'administrateur après chaque événement UFC, une fois les résultats officiels saisis. Le classement se met à jour automatiquement.',
            },
            {
              q: 'Que signifie NC ?',
              a: 'NC signifie "No Contest" — le combat est annulé ou déclaré nul pour des raisons réglementaires (dopage, blessure involontaire, etc.). C\'est rare mais prévu dans le système.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="border-b border-octagon-700 pb-5 last:border-0 last:pb-0">
              <div className="font-semibold tracking-wide mb-2">{q}</div>
              <div className="text-white/50 text-sm leading-relaxed">{a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Conditions d'utilisation */}
      <section className="card space-y-4">
        <h2 className="font-display text-3xl tracking-wider text-blood-400">CONDITIONS D'UTILISATION</h2>
        <div className="space-y-3 text-white/50 text-sm leading-relaxed">
          <p>
            Octagon Picks est une application de pronostics sportifs à but non lucratif,
            réservée à un cercle privé d'utilisateurs invités. Aucune mise d'argent n'est impliquée.
          </p>
          <p>
            En utilisant l'application, tu acceptes de ne pas tenter de contourner le système de points,
            de ne pas créer plusieurs comptes, et de respecter les autres membres de ta ligue.
          </p>
          <p>
            Les données personnelles collectées (email, pseudo) sont utilisées uniquement pour
            le fonctionnement de l'application et ne sont pas partagées avec des tiers.
          </p>
          <p>
            L'administrateur se réserve le droit de modifier les règles, de corriger des résultats
            erronés ou de recalculer des points en cas d'erreur de saisie.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className="card space-y-4">
        <h2 className="font-display text-3xl tracking-wider text-blood-400">CONTACT</h2>
        <p className="text-white/50 text-sm leading-relaxed">
          Pour toute question, signalement d'un bug ou suggestion d'amélioration,
          contacte l'administrateur directement par message ou par email.
        </p>
        <div className="bg-octagon-700 border border-octagon-600 p-4">
          <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Administrateur</div>
                  <div className="font-semibold tracking-wide">Massyl : octagonpicks1@gmail.com</div>
        </div>
      </section>
    </div>
  )
}
