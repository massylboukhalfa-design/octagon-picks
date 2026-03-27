export type Profile = {
  id: string
  username: string
  avatar_url?: string
  created_at: string
}

export type League = {
  id: string
  name: string
  description?: string
  invite_code: string
  owner_id: string
  created_at: string
  member_count?: number
}

export type LeagueMember = {
  id: string
  league_id: string
  user_id: string
  joined_at: string
  profile?: Profile
  total_points?: number
}

export type UFCEvent = {
  id: string
  name: string
  date: string
  location: string
  status: 'upcoming' | 'locked' | 'completed'
  prediction_deadline: string
  created_at: string
}

export type Fight = {
  id: string
  event_id: string
  fighter1_name: string
  fighter2_name: string
  fighter1_record?: string
  fighter2_record?: string
  weight_class: string
  scheduled_rounds: number
  card_order: number
  is_main_event: boolean
  result?: FightResult
}

export type FightResult = {
  id: string
  fight_id: string
  winner: 'fighter1' | 'fighter2' | 'draw' | 'nc'
  method: FightMethod
  round: number
  time?: string
}

export type FightMethod = 'KO/TKO' | 'Submission' | 'Decision' | 'DQ' | 'NC'

export type Prediction = {
  id: string
  user_id: string
  fight_id: string
  league_id: string
  predicted_winner: 'fighter1' | 'fighter2' | 'draw'
  predicted_method: FightMethod
  predicted_round: number
  points_earned?: number
  created_at: string
  updated_at: string
}

export type LeaderboardEntry = {
  user_id: string
  username: string
  total_points: number
  correct_winner: number
  correct_method: number
  correct_round: number
  perfect_picks: number
  rank: number
}

export const POINTS = {
  CORRECT_WINNER: 10,
  CORRECT_METHOD: 5,
  CORRECT_ROUND: 5,
  PERFECT_COMBO: 10, // bonus if winner + method + round all correct
} as const

export const FIGHT_METHODS: FightMethod[] = ['KO/TKO', 'Submission', 'Decision', 'DQ', 'NC']
