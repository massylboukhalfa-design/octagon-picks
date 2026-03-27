import { Prediction, FightResult, POINTS } from '@/types'

export function calculatePoints(prediction: Prediction, result: FightResult): number {
  let points = 0

  const correctWinner = prediction.predicted_winner === result.winner
  const correctMethod = prediction.predicted_method === result.method
  const correctRound = prediction.predicted_round === result.round

  if (correctWinner) points += POINTS.CORRECT_WINNER
  if (correctMethod) points += POINTS.CORRECT_METHOD
  if (correctRound) points += POINTS.CORRECT_ROUND
  if (correctWinner && correctMethod && correctRound) points += POINTS.PERFECT_COMBO

  return points
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function formatPoints(points: number): string {
  return `${points} pts`
}
