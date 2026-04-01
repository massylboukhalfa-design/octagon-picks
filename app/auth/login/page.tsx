'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Auth pages use browser locale directly (no server cookie available yet)
function getBrowserLocale() {
  if (typeof navigator === 'undefined') return 'fr'
  return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const locale = typeof window !== 'undefined'
    ? (document.cookie.match(/locale=(\w+)/)?.[1] ?? getBrowserLocale())
    : 'fr'
  const fr = locale === 'fr'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(fr ? 'Email ou mot de passe incorrect' : 'Incorrect email or password')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="animate-slide-up">
      <div className="mb-10">
        <h1 className="font-display text-5xl tracking-wider mb-2">
          {fr ? 'CONNEXION' : 'SIGN IN'}
        </h1>
        <p className="text-white/40 tracking-wide">
          {fr ? 'Accède à tes ligues et pronostics' : 'Access your leagues and predictions'}
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" placeholder="you@email.com"
            value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label">{fr ? 'Mot de passe' : 'Password'}</label>
          <input type="password" className="input" placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        {error && (
          <div className="bg-red-950 border border-red-800 text-red-400 text-sm px-4 py-3 tracking-wide">{error}</div>
        )}
        <button type="submit" disabled={loading}
          className="btn-primary w-full py-4 text-base disabled:opacity-50">
          {loading ? (fr ? 'Connexion...' : 'Signing in...') : (fr ? 'Se connecter' : 'Sign in')}
        </button>
      </form>

      <div className="divider my-8" />

      <p className="text-center text-white/40 text-sm tracking-wide">
        {fr ? 'Pas encore de compte ?' : "Don't have an account?"}{' '}
        <Link href="/auth/register" className="text-blood-400 hover:text-blood-300 transition-colors">
          {fr ? 'Rejoindre la beta' : 'Join the beta'}
        </Link>
      </p>
    </div>
  )
}
