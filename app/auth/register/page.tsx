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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    if (form.password.length < 6) {
      setError('Mot de passe trop court (min. 6 caractères)')
      return
    }
    if (form.username.length < 3) {
      setError('Pseudo trop court (min. 3 caractères)')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { username: form.username },
      },
    })

    if (signUpError) {
      setError(signUpError.message === 'User already registered'
        ? 'Cet email est déjà utilisé'
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
        <div className="badge-red mb-4 inline-flex">BETA PRIVÉE</div>
        <h1 className="font-display text-5xl tracking-wider mb-2">CRÉER UN COMPTE</h1>
        <p className="text-octagon-600 tracking-wide">Rejoins l'arène des pronostics</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-5">
        <div>
          <label className="label">Pseudo</label>
          <input type="text" className="input" placeholder="TonPseudo" value={form.username} onChange={update('username')} required />
        </div>

        <div>
          <label className="label">Email</label>
          <input type="email" className="input" placeholder="ton@email.com" value={form.email} onChange={update('email')} required />
        </div>

        <div>
          <label className="label">Mot de passe</label>
          <input type="password" className="input" placeholder="Min. 6 caractères" value={form.password} onChange={update('password')} required />
        </div>

        <div>
          <label className="label">Confirmer le mot de passe</label>
          <input type="password" className="input" placeholder="••••••••" value={form.confirm} onChange={update('confirm')} required />
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 text-red-400 text-sm px-4 py-3 tracking-wide">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-gold w-full py-4 text-base disabled:opacity-50">
          {loading ? 'Création...' : 'Rejoindre la beta'}
        </button>
      </form>

      <div className="divider my-8" />

      <p className="text-center text-octagon-600 text-sm tracking-wide">
        Déjà un compte ?{' '}
        <Link href="/auth/login" className="text-blood-400 hover:text-blood-300 transition-colors">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
