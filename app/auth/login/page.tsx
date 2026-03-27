'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="animate-slide-up">
      <div className="mb-10">
        <h1 className="font-display text-5xl tracking-wider mb-2">CONNEXION</h1>
        <p className="text-octagon-600 tracking-wide">Accède à tes ligues et pronostics</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            placeholder="ton@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Mot de passe</label>
          <input
            type="password"
            className="input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 text-red-400 text-sm px-4 py-3 tracking-wide">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <div className="divider my-8" />

      <p className="text-center text-octagon-600 text-sm tracking-wide">
        Pas encore de compte ?{' '}
        <Link href="/auth/register" className="text-blood-400 hover:text-blood-300 transition-colors">
          Rejoindre la beta
        </Link>
      </p>
    </div>
  )
}
