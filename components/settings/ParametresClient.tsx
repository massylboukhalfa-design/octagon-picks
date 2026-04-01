'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import FighterSearch from '@/components/fighters/FighterSearch'
import InviteSection from '@/components/settings/InviteSection'

type Fighter = { id: string; name: string; photo_url?: string; weight_class?: string; country_flag?: string }

type Props = {
  userId: string
  email: string
  fighters: Fighter[]
  locale?: string
  profile: {
    username: string
    avatar_url: string | null
    favorite_fighter_id: string | null
    notification_email: string | null
    newsletter_email: string | null
    created_at: string
  } | null
}

export default function ParametresClient({ userId, email, profile, fighters, locale = 'fr' }: Props) {
  const router = useRouter()
  const fr = locale === 'fr'
  type Tab = 'account' | 'notifications' | 'newsletter' | 'terms'
  const [tab, setTab] = useState<Tab>('account')

  const TABS = [
    { id: 'account' as Tab, label: fr ? 'Compte' : 'Account' },
    { id: 'notifications' as Tab, label: 'Notifications' },
    { id: 'newsletter' as Tab, label: 'Newsletter' },
    { id: 'terms' as Tab, label: fr ? 'CGU' : 'Terms' },
  ]

  return (
    <div>
      <div className="flex border-b border-octagon-700 mb-8">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`text-sm font-semibold uppercase tracking-widest px-4 py-3 border-b-2 transition-all ${
              tab === t.id ? 'text-white border-blood-500' : 'text-white/40 border-transparent hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'account' && <CompteTab userId={userId} email={email} profile={profile} fighters={fighters} router={router} locale={locale} />}
      {tab === 'notifications' && (
        <EmailTab userId={userId} type="notification"
          currentEmail={profile?.notification_email ?? null}
          title={fr ? 'Email de notifications' : 'Notification email'}
          description={fr ? 'Reçois un rappel par email avant la deadline de chaque événement UFC.' : 'Receive a reminder email before each UFC event deadline.'}
          placeholder="you@email.com" locale={locale} />
      )}
      {tab === 'newsletter' && (
        <EmailTab userId={userId} type="newsletter"
          currentEmail={profile?.newsletter_email ?? null}
          title="Newsletter"
          description={fr ? 'Reçois les actualités UFC et les annonces de nouveaux événements.' : 'Receive UFC news and new event announcements.'}
          placeholder="you@email.com" locale={locale} />
      )}
      {tab === 'terms' && <CguTab locale={locale} />}
    </div>
  )
}

function CompteTab({ userId, email, profile, fighters, router, locale }: any) {
  const fr = locale === 'fr'
  const fileRef = useRef<HTMLInputElement>(null)
  const [username, setUsername] = useState(profile?.username ?? '')
  const [avatarPreview, setAvatarPreview] = useState<string>(profile?.avatar_url ?? '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [favFighterId, setFavFighterId] = useState<string>(profile?.favorite_fighter_id ?? '')
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [loadingReset, setLoadingReset] = useState(false)
  const [loadingDelete, setLoadingDelete] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const showSuccess = (msg: string) => { setSuccess(msg); setError(''); setTimeout(() => setSuccess(''), 4000) }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSaveProfile = async () => {
    if (username.trim().length < 3) {
      setError(fr ? 'Pseudo trop court (min. 3 caractères)' : 'Username too short (min. 3 characters)')
      return
    }
    setLoadingProfile(true); setError('')
    const supabase = createClient()
    let avatar_url = profile?.avatar_url ?? null

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `${userId}/avatar.${ext}`
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
      if (uploadErr) { setError('Upload error: ' + uploadErr.message); setLoadingProfile(false); return }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      avatar_url = urlData.publicUrl + '?t=' + Date.now()
    }

    const { error: updateErr } = await supabase.from('profiles').update({
      username: username.trim(), avatar_url, favorite_fighter_id: favFighterId || null,
    }).eq('id', userId)

    if (updateErr) setError(fr ? 'Erreur mise à jour' : 'Update error: ' + updateErr.message)
    else { showSuccess(fr ? 'Profil mis à jour' : 'Profile updated'); router.refresh() }
    setLoadingProfile(false)
  }

  const handleRemoveAvatar = async () => {
    setAvatarPreview(''); setAvatarFile(null)
    const supabase = createClient()
    await supabase.from('profiles').update({ avatar_url: null }).eq('id', userId)
    router.refresh()
  }

  const handleResetPassword = async () => {
    setLoadingReset(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (err) setError(fr ? 'Erreur envoi email' : 'Error sending email')
    else showSuccess(fr ? `Lien envoyé à ${email}` : `Link sent to ${email}`)
    setLoadingReset(false)
  }

  const handleDeleteAccount = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setLoadingDelete(true)
    const supabase = createClient()
    await supabase.from('predictions').delete().eq('user_id', userId)
    await supabase.from('league_members').delete().eq('user_id', userId)
    await supabase.from('profiles').delete().eq('id', userId)
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="space-y-8">
      {/* Login email */}
      <div className="card">
        <div className="text-white/40 text-xs uppercase tracking-widest mb-1">
          {fr ? 'Email de connexion' : 'Login email'}
        </div>
        <div className="font-mono text-sm text-white/60">{email}</div>
      </div>

      {/* Profile */}
      <div className="card space-y-5">
        <h3 className="font-display text-xl tracking-wider">
          {fr ? 'MON PROFIL' : 'MY PROFILE'}
        </h3>

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20 flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-octagon-600 bg-octagon-700">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-display text-3xl text-white/20">{username.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary text-xs py-2">
              {avatarPreview ? (fr ? 'Changer la photo' : 'Change photo') : (fr ? 'Ajouter une photo' : 'Add photo')}
            </button>
            {avatarPreview && (
              <button type="button" onClick={handleRemoveAvatar} className="block text-white/40 text-xs hover:text-white transition-colors">
                {fr ? 'Supprimer' : 'Remove'}
              </button>
            )}
            <p className="text-white/30 text-xs">JPG, PNG — max 5MB</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </div>

        {/* Username */}
        <div>
          <label className="label">{fr ? 'Pseudo' : 'Username'}</label>
          <input className="input" value={username} onChange={e => setUsername(e.target.value)} maxLength={30} />
        </div>

        {/* Fav fighter */}
        <div>
          <label className="label">
            {fr ? 'Combattant favori' : 'Favorite fighter'}{' '}
            <span className="text-white/30 normal-case font-normal">({fr ? 'optionnel' : 'optional'})</span>
          </label>
          {fighters.length > 0 ? (
            <FighterSearch
              fighters={fighters}
              value={favFighterId || null}
              onChange={(id: any) => setFavFighterId(id ?? '')}
              placeholder={fr ? 'Rechercher un combattant...' : 'Search a fighter...'}
            />
          ) : (
            <p className="text-white/30 text-sm">
              {fr ? 'Aucun combattant dans la base.' : 'No fighters in database.'}
            </p>
          )}
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-emerald-400 text-sm">{success}</p>}

        <button onClick={handleSaveProfile} disabled={loadingProfile} className="btn-primary disabled:opacity-50">
          {loadingProfile ? (fr ? 'Enregistrement...' : 'Saving...') : (fr ? 'Enregistrer le profil' : 'Save profile')}
        </button>
      </div>

      {/* Password */}
      <div className="card space-y-4">
        <h3 className="font-display text-xl tracking-wider">
          {fr ? 'MOT DE PASSE' : 'PASSWORD'}
        </h3>
        <p className="text-white/40 text-sm leading-relaxed">
          {fr
            ? <>Un email de réinitialisation sera envoyé à <span className="text-white/60">{email}</span>.</>
            : <>A reset link will be sent to <span className="text-white/60">{email}</span>.</>}
        </p>
        <button onClick={handleResetPassword} disabled={loadingReset} className="btn-secondary disabled:opacity-50">
          {loadingReset
            ? (fr ? 'Envoi...' : 'Sending...')
            : (fr ? 'Recevoir le lien de réinitialisation' : 'Send reset link')}
        </button>
      </div>

      {/* Invite */}
      <InviteSection locale={locale} />

      {/* Delete account */}
      <div className="card border-red-900/50 space-y-4">
        <h3 className="font-display text-xl tracking-wider text-red-400">
          {fr ? 'SUPPRIMER LE COMPTE' : 'DELETE ACCOUNT'}
        </h3>
        <p className="text-white/40 text-sm leading-relaxed">
          {fr
            ? 'Action irréversible. Tous tes pronostics, ton historique et tes données seront supprimés.'
            : 'This is irreversible. All your picks, history and data will be permanently deleted.'}
        </p>
        {confirmDelete && (
          <div className="bg-red-950 border border-red-800 p-4 text-red-400 text-sm">
            {fr ? 'Es-tu sûr ? Clique à nouveau pour confirmer.' : 'Are you sure? Click again to confirm.'}
          </div>
        )}
        <div className="flex items-center gap-4">
          <button onClick={handleDeleteAccount} disabled={loadingDelete}
            className={`text-sm font-semibold uppercase tracking-wider px-6 py-3 border transition-all disabled:opacity-50 ${
              confirmDelete ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-red-900 text-red-700 hover:border-red-700 hover:text-red-400'
            }`}>
            {loadingDelete
              ? (fr ? 'Suppression...' : 'Deleting...')
              : confirmDelete
              ? (fr ? 'Confirmer la suppression' : 'Confirm deletion')
              : (fr ? 'Supprimer mon compte' : 'Delete my account')}
          </button>
          {confirmDelete && (
            <button onClick={() => setConfirmDelete(false)} className="text-white/40 text-xs hover:text-white transition-colors">
              {fr ? 'Annuler' : 'Cancel'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function EmailTab({ userId, type, currentEmail, title, description, placeholder, locale }: any) {
  const fr = locale === 'fr'
  const field = type === 'notification' ? 'notification_email' : 'newsletter_email'
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const showSuccess = (msg: string) => { setSuccess(msg); setError(''); setTimeout(() => setSuccess(''), 4000) }

  const handleSave = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError(fr ? 'Adresse email invalide' : 'Invalid email address'); return
    }
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.from('profiles').update({ [field]: email.trim() }).eq('id', userId)
    if (err) setError(fr ? 'Erreur' : 'Error')
    else { showSuccess(fr ? 'Adresse enregistrée' : 'Address saved'); setEmail(''); window.location.reload() }
    setLoading(false)
  }

  const handleRemove = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ [field]: null }).eq('id', userId)
    showSuccess(fr ? 'Adresse supprimée' : 'Address removed')
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
                <div className="text-white/40 text-xs uppercase tracking-widest mb-1">
                  {fr ? 'Adresse enregistrée' : 'Registered address'}
                </div>
                <div className="font-mono text-sm text-emerald-400">{currentEmail}</div>
              </div>
              <span className="badge-green">{fr ? 'Actif' : 'Active'}</span>
            </div>
            {success && <p className="text-emerald-400 text-sm">{success}</p>}
            <button onClick={handleRemove} disabled={loading} className="btn-secondary text-sm py-2 disabled:opacity-50">
              {loading ? (fr ? 'Suppression...' : 'Removing...') : (fr ? 'Supprimer cette adresse' : 'Remove this address')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="label">{fr ? 'Adresse email' : 'Email address'}</label>
              <input type="email" className="input" placeholder={placeholder} value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-emerald-400 text-sm">{success}</p>}
            <button onClick={handleSave} disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? (fr ? 'Enregistrement...' : 'Saving...') : (fr ? 'Enregistrer' : 'Save')}
            </button>
          </div>
        )}
      </div>
      <div className="card border-octagon-600">
        <p className="text-white/30 text-xs leading-relaxed">
          {type === 'notification'
            ? (fr ? 'Rappels envoyés 24h avant la deadline. Supprimable à tout moment.' : 'Reminders sent 24h before the deadline. Removable at any time.')
            : (fr ? 'Newsletter envoyée lors de nouveaux événements. Max 2 emails/mois.' : 'Newsletter sent for new events. Max 2 emails/month.')}
        </p>
      </div>
    </div>
  )
}

function CguTab({ locale }: { locale: string }) {
  const fr = locale === 'fr'
  const items = fr ? [
    { title: 'Accès et inscription', text: "Octagon Picks est une application privée accessible sur invitation. L'inscription est réservée aux personnes ayant reçu un lien ou un code d'invitation. Chaque utilisateur ne peut posséder qu'un seul compte." },
    { title: 'Nature du service', text: "Octagon Picks est un jeu de pronostics sportifs à titre récréatif et gratuit. Aucune mise d'argent réelle n'est impliquée. Les points accumulés n'ont aucune valeur monétaire." },
    { title: 'Données personnelles', text: "Les données collectées (email, pseudo, photo) sont utilisées uniquement pour le fonctionnement de l'application. Elles ne sont pas transmises à des tiers. Tu peux demander la suppression de ton compte à tout moment." },
    { title: 'Responsabilité', text: "L'administrateur ne peut être tenu responsable d'éventuelles erreurs dans les résultats. En cas d'erreur constatée, une correction peut être appliquée manuellement." },
    { title: 'Modifications', text: "Les présentes conditions peuvent être mises à jour à tout moment. Les utilisateurs seront informés des changements significatifs." },
  ] : [
    { title: 'Access and registration', text: "Octagon Picks is a private app accessible by invitation only. Registration is reserved for people who have received an invite link or code. Each user may only hold one account." },
    { title: 'Nature of the service', text: "Octagon Picks is a free recreational sports prediction game. No real money or wagers are involved. Points accumulated have no monetary value." },
    { title: 'Personal data', text: "Data collected (email, username, photo) is used solely for the app's operation and is never shared with third parties. You can request account deletion at any time from Settings." },
    { title: 'Liability', text: "The administrator cannot be held responsible for errors in fight results or point calculations. If an error is identified, a manual correction may be applied." },
    { title: 'Modifications', text: "These terms may be updated at any time. Users will be notified of significant changes." },
  ]

  return (
    <div className="card space-y-6">
      <h3 className="font-display text-2xl tracking-wider">
        {fr ? "CONDITIONS GÉNÉRALES D'UTILISATION" : 'TERMS OF USE'}
      </h3>
      <div className="space-y-4 text-white/50 text-sm leading-relaxed">
        {items.map(({ title, text }) => (
          <div key={title}>
            <div className="text-white font-semibold mb-1">{title}</div>
            <p>{text}</p>
          </div>
        ))}
      </div>
      <div className="text-white/30 text-xs border-t border-octagon-700 pt-4">
        {fr ? 'Dernière mise à jour : Mars 2026' : 'Last updated: March 2026'}
      </div>
    </div>
  )
}
