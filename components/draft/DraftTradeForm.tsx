'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type RosterEntry = {
  id: string
  fighter_id: string
  slot_type: string
  fighters: { id: string; name: string; photo_url?: string }
  fights: { ufc_events: { name: string } }
}

type Member = {
  id: string
  username: string
  avatar_url?: string
}

type Props = {
  seasonId: string
  currentUserId: string
  myRosters: RosterEntry[]
  members: Member[]
  allRosters: RosterEntry[]
  locale?: string
}

export default function DraftTradeForm({ seasonId, currentUserId, myRosters, members, allRosters, locale = 'fr' }: Props) {
  const router = useRouter()
  const isFr = locale === 'fr'

  const [selectedMyRosterId, setSelectedMyRosterId] = useState('')
  const [selectedTargetUserId, setSelectedTargetUserId] = useState('')
  const [selectedTheirRosterId, setSelectedTheirRosterId] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const otherMembers = members.filter(m => m.id !== currentUserId)
  const theirRosters = allRosters.filter(r => r.fighter_id && selectedTargetUserId &&
    allRosters.some(ar => ar.id === r.id))

  const targetUserRosters = allRosters.filter((r: any) => r.user_id === selectedTargetUserId)

  const handleSubmit = async () => {
    if (!selectedMyRosterId || !selectedTheirRosterId) {
      setError(isFr ? 'Sélectionne les deux fighters' : 'Select both fighters')
      return
    }
    setLoading(true); setError('')

    const res = await fetch('/api/draft-trade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seasonId,
        proposerRosterId: selectedMyRosterId,
        receiverRosterId: selectedTheirRosterId,
        message: message.trim() || null,
      }),
    })
    const data = await res.json()

    if (data.error) { setError(data.error); setLoading(false) }
    else {
      setSuccess(isFr ? 'Proposition envoyée !' : 'Trade proposal sent!')
      setSelectedMyRosterId(''); setSelectedTargetUserId(''); setSelectedTheirRosterId(''); setMessage('')
      setLoading(false)
      router.refresh()
    }
  }

  return (
    <div className="card space-y-5">
      <h2 className="font-display text-xl tracking-wider">
        {isFr ? 'PROPOSER UN ÉCHANGE' : 'PROPOSE A TRADE'}
      </h2>

      {/* Mon fighter */}
      <div>
        <label className="label">{isFr ? 'Je donne' : 'I offer'}</label>
        <div className="grid grid-cols-1 gap-2">
          {myRosters.map(r => (
            <button key={r.id} type="button" onClick={() => setSelectedMyRosterId(r.id)}
              className={`flex items-center gap-3 p-3 border text-left transition-all ${
                selectedMyRosterId === r.id
                  ? 'border-blood-500 bg-blood-500/10'
                  : 'border-octagon-600 bg-octagon-700 hover:border-octagon-500'
              }`}>
              <div className="w-8 h-8 rounded-full overflow-hidden bg-octagon-600 flex-shrink-0">
                {r.fighters?.photo_url ? (
                  <img src={r.fighters.photo_url} alt={r.fighters.name} className="w-full h-full object-cover object-top" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white/20 text-xs">{r.fighters?.name?.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{r.fighters?.name}</div>
                <div className="text-white/40 text-xs">{r.fights?.ufc_events?.name} · {r.slot_type === 'main_event' ? 'ME' : 'UC'}</div>
              </div>
              {selectedMyRosterId === r.id && <span className="text-blood-400">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Joueur cible */}
      <div>
        <label className="label">{isFr ? 'Avec qui ?' : 'With who?'}</label>
        <div className="flex gap-2 flex-wrap">
          {otherMembers.map(m => (
            <button key={m.id} type="button" onClick={() => { setSelectedTargetUserId(m.id); setSelectedTheirRosterId('') }}
              className={`flex items-center gap-2 py-1.5 px-3 border text-sm transition-all ${
                selectedTargetUserId === m.id
                  ? 'border-blood-500 bg-blood-500/10 text-white'
                  : 'border-octagon-600 text-white/40 hover:text-white'
              }`}>
              {m.username}
            </button>
          ))}
        </div>
      </div>

      {/* Fighter cible */}
      {selectedTargetUserId && (
        <div>
          <label className="label">{isFr ? 'Je veux' : 'I want'}</label>
          <div className="grid grid-cols-1 gap-2">
            {targetUserRosters.map((r: any) => (
              <button key={r.id} type="button" onClick={() => setSelectedTheirRosterId(r.id)}
                className={`flex items-center gap-3 p-3 border text-left transition-all ${
                  selectedTheirRosterId === r.id
                    ? 'border-gold-500 bg-yellow-950/20'
                    : 'border-octagon-600 bg-octagon-700 hover:border-octagon-500'
                }`}>
                <div className="w-8 h-8 rounded-full overflow-hidden bg-octagon-600 flex-shrink-0">
                  {r.fighters?.photo_url ? (
                    <img src={r.fighters.photo_url} alt={r.fighters?.name} className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-white/20 text-xs">{r.fighters?.name?.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{r.fighters?.name}</div>
                  <div className="text-white/40 text-xs">{r.fights?.ufc_events?.name} · {r.slot_type === 'main_event' ? 'ME' : 'UC'}</div>
                </div>
                {selectedTheirRosterId === r.id && <span className="text-gold-400">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message optionnel */}
      <div>
        <label className="label">{isFr ? 'Message (optionnel)' : 'Message (optional)'}</label>
        <input className="input" placeholder={isFr ? 'Un commentaire...' : 'A note...'}
          value={message} onChange={e => setMessage(e.target.value)} maxLength={200} />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {success && <p className="text-emerald-400 text-sm">{success}</p>}

      <button onClick={handleSubmit} disabled={loading || !selectedMyRosterId || !selectedTheirRosterId}
        className="btn-secondary w-full disabled:opacity-50">
        {loading
          ? (isFr ? 'Envoi...' : 'Sending...')
          : (isFr ? 'Proposer l\'échange' : 'Propose trade')}
      </button>
    </div>
  )
}
