'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Trade = {
  id: string
  status: string
  message?: string
  created_at: string
  proposer_id: string
  receiver_id: string
  proposer_roster: { fighters: { name: string }; fights: { ufc_events: { name: string } } }
  receiver_roster: { fighters: { name: string }; fights: { ufc_events: { name: string } } }
  proposer_profile: { username: string }
  receiver_profile: { username: string }
}

type Props = {
  trades: Trade[]
  currentUserId: string
  locale?: string
}

export default function DraftTradeList({ trades, currentUserId, locale = 'fr' }: Props) {
  const router = useRouter()
  const isFr = locale === 'fr'
  const [loading, setLoading] = useState<string | null>(null)

  const pending = trades.filter(t => t.status === 'pending')
  const resolved = trades.filter(t => t.status !== 'pending')

  const handleAction = async (tradeId: string, action: 'accept' | 'reject' | 'cancel') => {
    setLoading(tradeId)
    const res = await fetch('/api/draft-trade', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tradeId, action }),
    })
    const data = await res.json()
    if (!data.error) router.refresh()
    setLoading(null)
  }

  const statusLabel = (s: string) => {
    const map: Record<string, string> = isFr
      ? { pending: 'En attente', accepted: 'Accepté', rejected: 'Refusé', cancelled: 'Annulé', expired: 'Expiré' }
      : { pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected', cancelled: 'Cancelled', expired: 'Expired' }
    return map[s] ?? s
  }

  if (trades.length === 0) {
    return (
      <p className="text-white/30 text-sm text-center py-6">
        {isFr ? 'Aucun échange' : 'No trades'}
      </p>
    )
  }

  const TradePill = ({ trade }: { trade: Trade }) => {
    const isProposer = trade.proposer_id === currentUserId
    const isPending = trade.status === 'pending'

    return (
      <div className={`border p-4 space-y-3 ${
        isPending && !isProposer ? 'border-gold-500/50 bg-yellow-950/10' : 'border-octagon-700'
      }`}>
        <div className="flex items-start justify-between gap-2">
          <div className="text-sm">
            <span className="font-semibold">{trade.proposer_profile?.username}</span>
            <span className="text-white/40"> {isFr ? 'offre' : 'offers'} </span>
            <span className="font-semibold text-blood-400">{trade.proposer_roster?.fighters?.name}</span>
            <span className="text-white/40"> {isFr ? 'contre' : 'for'} </span>
            <span className="font-semibold text-gold-400">{trade.receiver_roster?.fighters?.name}</span>
            <span className="text-white/40"> ({trade.receiver_profile?.username})</span>
          </div>
          <span className={`text-xs flex-shrink-0 ${
            trade.status === 'accepted' ? 'text-emerald-400' :
            trade.status === 'pending' ? 'text-gold-400' :
            'text-white/30'
          }`}>
            {statusLabel(trade.status)}
          </span>
        </div>

        {trade.message && (
          <p className="text-white/40 text-xs italic">"{trade.message}"</p>
        )}

        {isPending && (
          <div className="flex gap-2">
            {isProposer ? (
              <button onClick={() => handleAction(trade.id, 'cancel')}
                disabled={loading === trade.id}
                className="text-xs text-white/40 hover:text-white transition-colors">
                {isFr ? 'Annuler' : 'Cancel'}
              </button>
            ) : (
              <>
                <button onClick={() => handleAction(trade.id, 'accept')}
                  disabled={loading === trade.id}
                  className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50">
                  {isFr ? 'Accepter' : 'Accept'}
                </button>
                <button onClick={() => handleAction(trade.id, 'reject')}
                  disabled={loading === trade.id}
                  className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-50">
                  {isFr ? 'Refuser' : 'Decline'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-white/40 text-xs uppercase tracking-widest">
            {isFr ? 'EN ATTENTE' : 'PENDING'}
          </h3>
          {pending.map(t => <TradePill key={t.id} trade={t} />)}
        </div>
      )}
      {resolved.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-white/40 text-xs uppercase tracking-widest">
            {isFr ? 'HISTORIQUE' : 'HISTORY'}
          </h3>
          {resolved.map(t => <TradePill key={t.id} trade={t} />)}
        </div>
      )}
    </div>
  )
}
