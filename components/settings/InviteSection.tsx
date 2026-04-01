'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n/context'

export default function InviteSection() {
  const { t } = useI18n()
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedMsg, setCopiedMsg] = useState(false)

  const inviteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://octagon-picks.vercel.app'

  const inviteMessage = t.settings.inviteText === 'Partage ce lien pour inviter tes amis sur Octagon Picks'
    ? `🥊 Rejoins-moi sur Octagon Picks, l'app de pronostics UFC !\n\nFais tes pronostics sur chaque combat, gagne des points et défie tes amis dans des ligues privées.\n\n👉 ${inviteUrl}`
    : `🥊 Join me on Octagon Picks, the UFC predictions app!\n\nPredict fight outcomes, earn points and challenge your friends in private leagues.\n\n👉 ${inviteUrl}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const copyMessage = async () => {
    await navigator.clipboard.writeText(inviteMessage)
    setCopiedMsg(true)
    setTimeout(() => setCopiedMsg(false), 2000)
  }

  return (
    <div className="card space-y-4">
      <h3 className="font-display text-xl tracking-wider">{t.settings.invite}</h3>
      <p className="text-white/40 text-sm leading-relaxed">{t.settings.inviteText}</p>

      {/* URL */}
      <div className="flex items-center gap-2 bg-octagon-700 border border-octagon-600 px-3 py-2">
        <span className="font-mono text-sm text-white/60 flex-1 truncate">{inviteUrl}</span>
        <button
          onClick={copyLink}
          className={`text-xs uppercase tracking-widest font-semibold transition-colors flex-shrink-0 ${
            copiedLink ? 'text-emerald-400' : 'text-white/40 hover:text-white'
          }`}
        >
          {copiedLink ? t.settings.copied : t.settings.copyLink}
        </button>
      </div>

      {/* Message complet */}
      <button
        onClick={copyMessage}
        className={`w-full py-3 border text-sm font-semibold uppercase tracking-widest transition-all ${
          copiedMsg
            ? 'border-emerald-500 text-emerald-400'
            : 'border-octagon-600 text-white/40 hover:border-octagon-500 hover:text-white'
        }`}
      >
        {copiedMsg ? `✓ ${t.settings.copied}` : `📋 ${t.settings.copyMessage}`}
      </button>

      {/* Aperçu du message */}
      <div className="bg-octagon-700 border border-octagon-600 p-3 rounded">
        <p className="text-white/30 text-xs whitespace-pre-line leading-relaxed">{inviteMessage}</p>
      </div>
    </div>
  )
}
