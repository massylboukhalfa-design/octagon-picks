'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Props = {
  userId: string
  email: string
  profile: {
    username: string
    notification_email: string | null
    newsletter_email: string | null
    created_at: string
  } | null
}

type Tab = 'compte' | 'notifications' | 'newsletter' | 'cgu'

const TABS: { id: Tab; label: string }[] = [
  { id: 'compte', label: 'Compte' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'newsletter', label: 'Newsletter' },
  { id: 'cgu', label: 'CGU' },
]

export default function ParametresClient({ userId, email, profile }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('compte')

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b border-octagon-700 mb-8">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`text-sm font-semibold uppercase tracking-widest px-4 py-3 border-b-2 transition-all ${
              tab === t.id
                ? 'text-white border-blood-500'
                : 'text-white/40 border-transparent hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'compte' && (
        <CompteTab userId={userId} email={email} profile={profile} router={router} />
      )}
      {tab === 'notifications' && (
        <EmailTab
          userId={userId}
          type="notification"
          currentEmail={profile?.notification_email ?? null}
          title="Email de notifications"
          description="Reçois un rappel par email avant la deadline de chaque événement UFC."
          placeholder="ton@email.com"
        />
      )}
      {tab === 'newsletter' && (
        <EmailTab
          userId={userId}
          type="newsletter"
          currentEmail={profile?.newsletter_email ?? null}
          title="Newsletter"
          description="Reçois les actualités UFC et les annonces de nouveaux événements."
          placeholder="ton@email.com"
        />
      )}
      {tab === 'cgu' && <CguTab />}
    </div>
  )
}

// ── Onglet Compte ──────────────────────────────────────────
function CompteTab({ userId, email, profile, router }: any) {
  const [username, setUsername] = useState(profile?.username ?? '')
  const [loadingUsername, setLoadingUsername] = useState(false)
  const [loadingReset, setLoadingReset] = useState(false)
  const [loadingDelete, setLoadingDelete] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setErrorMsg('')
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  const handleUpdateUsername = async () => {
    if (!username.trim() || username.trim().length < 3) {
      setErrorMsg('Le pseudo doit faire au moins 3 caractères')
      return
    }
    setLoadingUsername(true)
    setErrorMsg('')
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ username: username.trim() })
      .eq('id', userId)

    if (error) setErrorMsg('Erreur lors de la mise à jour')
    else { showSuccess('Pseudo mis à jour'); router.refresh() }
    setLoadingUsername(false)
  }

  const handleResetPassword = async () => {
    setLoadingReset(true)
    setErrorMsg('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) setErrorMsg('Erreur lors de l\'envoi')
    else showSuccess(`Email de réinitialisation envoyé à ${email}`)
    setLoadingReset(false)
  }

  const handleDeleteAccount = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setLoadingDelete(true)
    const supabase = createClient()

    // Supprimer les données utilisateur
    await supabase.from('predictions').delete().eq('user_id', userId)
    await supabase.from('league_members').delete().eq('user_id', userId)
    await supabase.from('profiles').delete().eq('id', userId)
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="space-y-8">
      {/* Infos */}
      <div className="card">
        <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Email de connexion</div>
        <div className="font-mono text-sm text-white/60">{email}</div>
      </div>

      {/* Pseudo */}
      <div className="card space-y-4">
        <h3 className="font-display text-xl tracking-wider">MODIFIER LE PSEUDO</h3>
        <div>
          <label className="label">Pseudo</label>
          <input
            className="input"
            value={username}
            onChange={e => setUsername(e.target.value)}
            maxLength={30}
          />
        </div>
        {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}
        {successMsg && <p className="text-emerald-400 text-sm">{successMsg}</p>}
        <button onClick={handleUpdateUsername} disabled={loadingUsername} className="btn-primary disabled:opacity-50">
          {loadingUsername ? 'Mise à jour...' : 'Enregistrer'}
        </button>
      </div>

      {/* Mot de passe */}
      <div className="card space-y-4">
        <h3 className="font-display text-xl tracking-wider">MOT DE PASSE</h3>
        <p className="text-white/40 text-sm leading-relaxed">
          Un email de réinitialisation sera envoyé à <span className="text-white/60">{email}</span>.
          Tu pourras définir un nouveau mot de passe en cliquant sur le lien.
        </p>
        <button onClick={handleResetPassword} disabled={loadingReset} className="btn-secondary disabled:opacity-50">
          {loadingReset ? 'Envoi...' : 'Recevoir le lien de réinitialisation'}
        </button>
      </div>

      {/* Supprimer le compte */}
      <div className="card border-red-900/50 space-y-4">
        <h3 className="font-display text-xl tracking-wider text-red-400">SUPPRIMER LE COMPTE</h3>
        <p className="text-white/40 text-sm leading-relaxed">
          Cette action est irréversible. Tous tes pronostics, ton historique et tes données
          seront définitivement supprimés.
        </p>
        {confirmDelete && (
          <div className="bg-red-950 border border-red-800 p-4 text-red-400 text-sm">
            Es-tu sûr ? Clique à nouveau pour confirmer la suppression définitive.
          </div>
        )}
        <button
          onClick={handleDeleteAccount}
          disabled={loadingDelete}
          className={`text-sm font-semibold uppercase tracking-wider px-6 py-3 border transition-all disabled:opacity-50 ${
            confirmDelete
              ? 'border-red-500 bg-red-500/10 text-red-400 hover:bg-red-500/20'
              : 'border-red-900 text-red-700 hover:border-red-700 hover:text-red-400'
          }`}
        >
          {loadingDelete ? 'Suppression...' : confirmDelete ? 'Confirmer la suppression' : 'Supprimer mon compte'}
        </button>
        {confirmDelete && (
          <button onClick={() => setConfirmDelete(false)} className="text-white/40 text-xs hover:text-white transition-colors ml-4">
            Annuler
          </button>
        )}
      </div>
    </div>
  )
}

// ── Onglet Email générique (Notifications + Newsletter) ────
function EmailTab({ userId, type, currentEmail, title, description, placeholder }: {
  userId: string
  type: 'notification' | 'newsletter'
  currentEmail: string | null
  title: string
  description: string
  placeholder: string
}) {
  const field = type === 'notification' ? 'notification_email' : 'newsletter_email'
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setError('')
    setTimeout(() => setSuccess(''), 4000)
  }

  const handleSave = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Adresse email invalide')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase
      .from('profiles')
      .update({ [field]: email.trim() })
      .eq('id', userId)

    if (err) setError('Erreur lors de l\'enregistrement')
    else { showSuccess('Adresse enregistrée'); setEmail(''); window.location.reload() }
    setLoading(false)
  }

  const handleRemove = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ [field]: null }).eq('id', userId)
    showSuccess('Adresse supprimée')
    setLoading(false)
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <h3 className="font-display text-xl tracking-wider">{title.toUpperCase()}</h3>
        <p className="text-white/40 text-sm leading-relaxed">{description}</p>

        {currentEmail ? (
          <div className="space-y-4">
            <div className="bg-octagon-700 border border-octagon-600 p-4 flex items-center justify-between">
              <div>
                <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Adresse enregistrée</div>
                <div className="font-mono text-sm text-emerald-400">{currentEmail}</div>
              </div>
              <span className="badge-green">Actif</span>
            </div>
            {success && <p className="text-emerald-400 text-sm">{success}</p>}
            <button onClick={handleRemove} disabled={loading} className="btn-secondary text-sm py-2 disabled:opacity-50">
              {loading ? 'Suppression...' : 'Supprimer cette adresse'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-octagon-700 border border-octagon-600 p-3 inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-white/20 rounded-full" />
              <span className="text-white/40 text-sm">Aucune adresse enregistrée</span>
            </div>
            <div>
              <label className="label">Adresse email</label>
              <input
                type="email"
                className="input"
                placeholder={placeholder}
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-emerald-400 text-sm">{success}</p>}
            <button onClick={handleSave} disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        )}
      </div>

      <div className="card border-octagon-600">
        <p className="text-white/30 text-xs leading-relaxed">
          {type === 'notification'
            ? 'Les rappels sont envoyés 24h avant la deadline de chaque événement. Tu peux supprimer ton adresse à tout moment.'
            : 'La newsletter est envoyée lors de l\'annonce de nouveaux événements UFC. Maximum 2 emails par mois. Tu peux te désabonner à tout moment.'}
        </p>
      </div>
    </div>
  )
}

// ── Onglet CGU ─────────────────────────────────────────────
function CguTab() {
  return (
    <div className="card space-y-6">
      <h3 className="font-display text-2xl tracking-wider">CONDITIONS GÉNÉRALES D'UTILISATION</h3>
      <div className="space-y-4 text-white/50 text-sm leading-relaxed">
        {[
          {
            title: 'Accès et inscription',
            text: "Octagon Picks est une application privée accessible sur invitation. L'inscription est réservée aux personnes ayant reçu un lien ou un code d'invitation. Chaque utilisateur ne peut posséder qu'un seul compte.",
          },
          {
            title: 'Nature du service',
            text: "Octagon Picks est un jeu de pronostics sportifs à titre récréatif et gratuit. Aucune mise d'argent réelle n'est impliquée. Les points accumulés n'ont aucune valeur monétaire.",
          },
          {
            title: 'Données personnelles',
            text: "Les données collectées (adresse email, pseudo, préférences) sont utilisées uniquement pour le fonctionnement de l'application. Elles ne sont pas transmises à des tiers. Conformément au RGPD, tu peux demander la suppression de ton compte et de tes données à tout moment depuis les paramètres.",
          },
          {
            title: 'Responsabilité',
            text: "L'administrateur ne peut être tenu responsable d'éventuelles erreurs dans les résultats de combats ou les calculs de points. En cas d'erreur constatée, une correction peut être appliquée manuellement.",
          },
          {
            title: 'Modifications',
            text: "Les présentes conditions peuvent être mises à jour à tout moment. Les utilisateurs seront informés des changements significatifs.",
          },
        ].map(({ title, text }) => (
          <div key={title}>
            <div className="text-white font-semibold mb-1">{title}</div>
            <p>{text}</p>
          </div>
        ))}
      </div>
      <div className="text-white/30 text-xs border-t border-octagon-700 pt-4">
        Dernière mise à jour : Mars 2026
      </div>
    </div>
  )
}
