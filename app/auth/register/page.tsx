'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', username: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const locale = typeof window !== 'undefined'
    ? (document.cookie.match(/locale=(\w+)/)?.[1] ?? (navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'))
    : 'fr'
  const fr = locale === 'fr'

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError(fr ? 'Les mots de passe ne correspondent pas' : 'Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      setError(fr ? 'Mot de passe trop court (min. 6 caractères)' : 'Password too short (min. 6 characters)')
      return
    }
    if (form.username.length < 3) {
      setError(fr ? 'Pseudo trop court (min. 3 caractères)' : 'Username too short (min. 3 characters)')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { username: form.username } },
    })
    if (signUpError) {
      setError(signUpError.message === 'User already registered'
        ? (fr ? 'Cet email est déjà utilisé' : 'This email is already registered')
        : signUpError.message)
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <div className="animate-slide-up">
      <div className="mb-10">
        <div className="badge-red mb-4 inline-flex">{fr ? 'BETA PRIVÉE' : 'PRIVATE BETA'}</div>
        <h1 className="font-display text-5xl tracking-wider mb-2">
          {fr ? 'CRÉER UN COMPTE' : 'CREATE ACCOUNT'}
        </h1>
        <p className="text-white/40 tracking-wide">
          {fr ? "Rejoins l'arène des pronostics" : 'Join the prediction arena'}
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-5">
        <div>
          <label className="label">{fr ? 'Pseudo' : 'Username'}</label>
          <input type="text" className="input" placeholder={fr ? 'TonPseudo' : 'YourUsername'}
            value={form.username} onChange={update('username')} required />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" placeholder="you@email.com"
            value={form.email} onChange={update('email')} required />
        </div>
        <div>
          <label className="label">{fr ? 'Mot de passe' : 'Password'}</label>
          <input type="password" className="input" placeholder={fr ? 'Min. 6 caractères' : 'Min. 6 characters'}
            value={form.password} onChange={update('password')} required />
        </div>
        <div>
          <label className="label">{fr ? 'Confirmer le mot de passe' : 'Confirm password'}</label>
          <input type="password" className="input" placeholder="••••••••"
            value={form.confirm} onChange={update('confirm')} required />
        </div>
        {error && (
          <div className="bg-red-950 border border-red-800 text-red-400 text-sm px-4 py-3 tracking-wide">{error}</div>
        )}
        <button type="submit" disabled={loading} className="btn-gold w-full py-4 text-base disabled:opacity-50">
          {loading ? (fr ? 'Création...' : 'Creating...') : (fr ? 'Rejoindre la beta' : 'Join the beta')}
        </button>
      </form>

      <div className="divider my-8" />

      <p className="text-center text-white/40 text-sm tracking-wide">
        {fr ? 'Déjà un compte ?' : 'Already have an account?'}{' '}
        <Link href="/auth/login" className="text-blood-400 hover:text-blood-300 transition-colors">
          {fr ? 'Se connecter' : 'Sign in'}
        </Link>
      </p>
    </div>
  )
}
